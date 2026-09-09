import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Set parameters
const NUM_USERS = 7200;
const BATCH_SIZE = 500;
const POSTS_COUNT = 500;
const CONVERSATIONS_COUNT = 200;

async function main() {
  console.log(`Starting to seed ${NUM_USERS} accounts...`);

  // Hash password once to save 12+ minutes of processing
  const hashedPassword = await bcrypt.hash("password123", 12);

  const getStructuralData = () => {
    return {
      type: faker.commerce.department(),
      dealIn: [faker.commerce.productName()], 
      lookingFor: [faker.commerce.productAdjective()],
    };
  };

  // We will store all generated user IDs to assign them posts/DMs later
  const createdUserIds: string[] = [];

  for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
    const chunkEnd = Math.min(i + BATCH_SIZE, NUM_USERS);
    const userBatch = [];
    
    // Generate User Batch
    for (let j = i; j < chunkEnd; j++) {
      userBatch.push({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase() + j, // ensure unique
        password: hashedPassword,
        isOnboarded: true,
        role: "USER" as const,
      });
    }

    // Insert Users
    await prisma.user.createMany({
      data: userBatch,
      skipDuplicates: true,
    });

    createdUserIds.push(...userBatch.map(u => u.id));

    // Generate CompanyProfile Batch
    const companyBatch = [];
    for (const user of userBatch) {
      const { type, dealIn, lookingFor } = getStructuralData();
      const companyName = faker.company.name();
      const description = `${companyName} is a professional ${type} company specializing in ${dealIn[0]}. We pride ourselves on innovation and quality.`;

      companyBatch.push({
        id: faker.string.uuid(),
        userId: user.id,
        companyName,
        description,
        size: faker.number.int({ min: 10, max: 1000 }),
        type,
        yearOfEstablishment: faker.number.int({ min: 1990, max: 2024 }),
        dealIn, 
        lookingFor,
        location: faker.location.city(),
        website: faker.internet.url(),
      });
    }

    // Insert Companies
    await prisma.companyProfile.createMany({
      data: companyBatch,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded users ${i + 1} to ${chunkEnd}`);
  }

  // Generate Posts
  console.log(`Starting to seed ${POSTS_COUNT} posts...`);
  const postBatch = [];
  for (let i = 0; i < POSTS_COUNT; i++) {
    const authorId = faker.helpers.arrayElement(createdUserIds);
    postBatch.push({
      id: faker.string.uuid(),
      authorId,
      content: faker.lorem.paragraphs(2),
      status: "ACTIVE" as const,
    });
  }

  await prisma.post.createMany({
    data: postBatch,
    skipDuplicates: true,
  });
  console.log(`✅ Seeded ${POSTS_COUNT} posts`);

  // Generate Conversations & DMs
  console.log(`Starting to seed ${CONVERSATIONS_COUNT} conversations and DMs...`);
  const conversationBatch = [];
  const messageBatch = [];
  
  // Track pairs to prevent unique constraint failures
  const seenPairs = new Set();

  for (let i = 0; i < CONVERSATIONS_COUNT; i++) {
    let user1Id = faker.helpers.arrayElement(createdUserIds);
    let user2Id = faker.helpers.arrayElement(createdUserIds);
    
    // Ensure distinct users and no duplicate conversation pairs
    while (user1Id === user2Id || seenPairs.has(`${user1Id}-${user2Id}`) || seenPairs.has(`${user2Id}-${user1Id}`)) {
      user1Id = faker.helpers.arrayElement(createdUserIds);
      user2Id = faker.helpers.arrayElement(createdUserIds);
    }
    
    seenPairs.add(`${user1Id}-${user2Id}`);
    
    const conversationId = faker.string.uuid();
    conversationBatch.push({
      id: conversationId,
      user1Id,
      user2Id,
      lastMessage: faker.lorem.sentence(),
      lastMessageAt: new Date(),
    });

    // Add 5 messages per conversation
    for (let m = 0; m < 5; m++) {
      messageBatch.push({
        id: faker.string.uuid(),
        conversationId,
        senderId: Math.random() > 0.5 ? user1Id : user2Id,
        content: faker.lorem.sentence(),
      });
    }
  }

  await prisma.conversation.createMany({
    data: conversationBatch,
    skipDuplicates: true,
  });
  
  // DMs chunking to avoid query limit
  for (let i = 0; i < messageBatch.length; i += BATCH_SIZE) {
     const chunk = messageBatch.slice(i, i + BATCH_SIZE);
     await prisma.directMessage.createMany({
       data: chunk,
       skipDuplicates: true,
     });
  }

  console.log(`✅ Seeded ${CONVERSATIONS_COUNT} conversations and messages`);

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });