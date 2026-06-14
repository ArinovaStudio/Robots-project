import "dotenv/config";
import { PrismaClient, Role, UserStatus, OtpType, ConnectionStatus, SubscriptionStatus, TransactionStatus, MediaType, PostStatus, ReactionType, ReportReason, ReportStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── helpers ────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const INDUSTRIES = ["Technology", "Manufacturing", "Healthcare", "Logistics", "Construction", "Retail", "Finance", "Agriculture", "Energy", "Education"];
const PRODUCTS   = ["Steel", "Software", "Machinery", "Electronics", "Textiles", "Chemicals", "Pharmaceuticals", "Plastics", "Food Processing", "Renewable Energy"];
const LOCATIONS  = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Ahmedabad", "Kolkata", "Jaipur", "Surat"];
const COMPANIES  = ["TechNova Pvt Ltd", "SteelCore Industries", "MediPlus Corp", "SwiftLogix", "BuildRight Pvt", "RetailEdge", "FinServe Ltd", "AgriGrow", "PowerGen Co", "EduBridge"];
const AVATARS    = Array.from({ length: 10 }, (_, i) => `https://i.pravatar.cc/150?img=${i + 10}`);
const POST_IMGS  = Array.from({ length: 10 }, (_, i) => `https://picsum.photos/seed/${i + 1}/800/600`);

const POST_CONTENTS = [
  "Excited to announce our Q2 expansion into 3 new markets! Looking for partners in logistics and manufacturing. 🚀",
  "We're seeking reliable steel suppliers for our upcoming infrastructure project in Pune. DM if interested.",
  "Just closed a major deal with a renewable energy firm. The future is green! #SustainableBusiness",
  "Looking for B2B partners in the pharmaceutical supply chain. Our cold-storage logistics are top tier.",
  "We've upgraded our manufacturing facility — 40% increase in output capacity. Ready to scale! 💪",
  "Hiring top talent in Bangalore for our SaaS division. Reach out if you know someone great.",
  "Attended the Industry 4.0 summit last week — incredible insights on automation and AI in manufacturing.",
  "Our agri-tech solution helped 500+ farmers improve yield by 30% this season. Proud of this milestone.",
  "Partnering with 3 new textile mills this quarter to improve supply chain transparency.",
  "Open to collaboration in the edtech space — we build custom LMS platforms for enterprises.",
  "New product launch next month! Watch this space for updates on our industrial IoT sensor line.",
  "Seeking investment partners for our Series A round. Deck available on request.",
];

const COMMENTS_TEXT = [
  "This is fantastic! Would love to connect and explore synergies.",
  "Congratulations on the milestone! Your team's dedication really shows.",
  "Interested in your supply chain solution — can we schedule a call?",
  "Great achievement! Looking forward to seeing what's next from your team.",
  "We've been in this space for 10 years — let's collaborate.",
  "Impressive growth numbers. What's your secret sauce?",
  "Would love to learn more about your partnership terms.",
  "This aligns perfectly with what we're building. Let's talk!",
  "Remarkable results. The industry needs more innovations like this.",
  "Followed and connected! Hope to work together soon.",
  "Thanks for sharing — very relevant to our current projects.",
  "Is this open for international partners as well?",
];

const DM_MESSAGES = [
  "Hey! Saw your post about the expansion — very exciting stuff.",
  "Hi, I'm reaching out regarding a potential partnership opportunity.",
  "Thanks for connecting! Would love to schedule a quick call.",
  "We have a project that might align with your offerings.",
  "Could you share more details about your pricing model?",
  "Loved your recent post! It really resonated with our challenges.",
  "Do you attend industry events? Would love to meet in person.",
  "Can you send over your product catalogue?",
  "We're looking for suppliers exactly like you. Let's talk.",
  "Just sent you a connection request. Hope we can collaborate!",
];

const SEARCH_QUERIES = ["steel supplier", "logistics partner", "software development", "pharma supply", "renewable energy", "textile manufacturer", "agri tech", "industrial IoT", "cold storage", "B2B marketplace"];

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── 1. PLANS ──────────────────────────────────────────────────────────────
  console.log("Creating plans...");
  const planDefs = [
    { name: "Starter",     price: 499,  duration: 30,  givesBoost: false, description: "Basic listing for small businesses." },
    { name: "Growth",      price: 999,  duration: 30,  givesBoost: true,  description: "Boosted profile with analytics." },
    { name: "Pro",         price: 1999, duration: 60,  givesBoost: true,  description: "Priority matching + AI recommendations." },
    { name: "Enterprise",  price: 4999, duration: 90,  givesBoost: true,  description: "Full suite with dedicated support." },
    { name: "Annual Lite", price: 3999, duration: 365, givesBoost: false, description: "Year-round visibility at low cost." },
    { name: "Annual Pro",  price: 9999, duration: 365, givesBoost: true,  description: "Best value annual plan with all features." },
    { name: "Trial",       price: 0,    duration: 7,   givesBoost: false, description: "7-day free trial for new users." },
    { name: "Boost Only",  price: 299,  duration: 15,  givesBoost: true,  description: "15-day profile boost without subscription." },
    { name: "Seasonal",    price: 699,  duration: 45,  givesBoost: true,  description: "Perfect for quarterly campaigns." },
    { name: "Platinum",    price: 7999, duration: 180, givesBoost: true,  description: "6-month premium with featured placement." },
  ];
  const plans = await Promise.all(planDefs.map(p => prisma.plan.create({ data: p })));
  console.log(`  ✓ ${plans.length} plans`);

  // ── 2. USERS (keep existing 4, create 8 more = 12 total) ─────────────────
  console.log("Creating users...");
  const hashedPwd = await bcrypt.hash("User@1234", 12);
  const adminHash = await bcrypt.hash("Mmb@1913", 12);

  const userDefs = [
    { name: "Mohsin Admin",   email: "mohsin@mohsin.com",   password: adminHash,  role: Role.ADMIN, status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Alice Sharma",   email: "alice@test.com",       password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Bob Mehta",      email: "bob@test.com",         password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Carol Singh",    email: "carol@test.com",       password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "David Khan",     email: "david@test.com",       password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Eva Patel",      email: "eva@test.com",         password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Frank Verma",    email: "frank@test.com",       password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: false },
    { name: "Grace Reddy",    email: "grace@test.com",       password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Henry Nair",     email: "henry@test.com",       password: hashedPwd,  role: Role.USER,  status: UserStatus.SUSPENDED, isOnboarded: true  },
    { name: "Iris Joshi",     email: "iris@test.com",        password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Jay Kapoor",     email: "jay@test.com",         password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: true  },
    { name: "Kira Desai",     email: "kira@test.com",        password: hashedPwd,  role: Role.USER,  status: UserStatus.ACTIVE,    isOnboarded: false },
  ];

  const users: any[] = [];
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, status: u.status, isOnboarded: u.isOnboarded, image: pick(AVATARS) },
      create: { ...u, image: pick(AVATARS) },
    });
    users.push(user);
  }
  console.log(`  ✓ ${users.length} users`);

  const onboardedUsers = users.filter(u => u.isOnboarded);
  const activeUsers    = users.filter(u => u.status === UserStatus.ACTIVE);

  // ── 3. COMPANY PROFILES ───────────────────────────────────────────────────
  console.log("Creating company profiles...");
  for (let i = 0; i < onboardedUsers.length; i++) {
    const u = onboardedUsers[i];
    const industry = INDUSTRIES[i % INDUSTRIES.length];
    const product  = PRODUCTS[i % PRODUCTS.length];
    const dealIn   = pickN(PRODUCTS, 3);
    const lookingFor = pickN(PRODUCTS.filter(p => !dealIn.includes(p)), 3);
    await prisma.companyProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId:              u.id,
        companyName:         COMPANIES[i % COMPANIES.length],
        description:         `${COMPANIES[i % COMPANIES.length]} is a leading ${industry} company specializing in ${product}. We partner with businesses globally to deliver excellence.`,
        logoUrl:             `https://picsum.photos/seed/logo${i}/100/100`,
        size:                randomInt(10, 5000),
        type:                industry,
        yearOfEstablishment: randomInt(1995, 2020),
        dealIn,
        lookingFor,
        website:             `https://www.${COMPANIES[i % COMPANIES.length].toLowerCase().replace(/\s+/g, "")}.com`,
        location:            LOCATIONS[i % LOCATIONS.length],
        isBoosted:           i % 3 === 0,
        exchangeDataset:     { industries: [industry], products: dealIn, needs: lookingFor, verified: true },
      },
    });
  }
  const companies = await prisma.companyProfile.findMany();
  console.log(`  ✓ ${companies.length} company profiles`);

  // ── 4. OTPs ───────────────────────────────────────────────────────────────
  console.log("Creating OTPs...");
  const otpEmails = ["otp1@test.com","otp2@test.com","otp3@test.com","otp4@test.com","otp5@test.com",
                     "otp6@test.com","otp7@test.com","otp8@test.com","otp9@test.com","otp10@test.com"];
  for (const email of otpEmails) {
    for (const type of [OtpType.VERIFY_EMAIL, OtpType.RESET_PASSWORD]) {
      await prisma.otp.upsert({
        where: { email_type: { email, type } },
        update: {},
        create: { email, otp: String(randomInt(100000, 999999)), type, expiresAt: daysFromNow(1) },
      });
    }
  }
  const otpCount = await prisma.otp.count();
  console.log(`  ✓ ${otpCount} OTPs`);

  // ── 5. FOLLOWS ────────────────────────────────────────────────────────────
  console.log("Creating follows...");
  const followPairs = new Set<string>();
  for (const follower of activeUsers) {
    const targets = pickN(activeUsers.filter(u => u.id !== follower.id), 4);
    for (const target of targets) {
      const key = `${follower.id}-${target.id}`;
      if (!followPairs.has(key)) {
        followPairs.add(key);
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: follower.id, followingId: target.id } },
          update: {},
          create: { followerId: follower.id, followingId: target.id },
        });
      }
    }
  }
  const followCount = await prisma.follow.count();
  console.log(`  ✓ ${followCount} follows`);

  // ── 6. CONNECTIONS ────────────────────────────────────────────────────────
  console.log("Creating connections...");
  const statuses = [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED, ConnectionStatus.REJECTED];
  const connMessages = [
    "Hi! Would love to connect and explore business opportunities.",
    "Saw your profile — I think we can collaborate on supply chain solutions.",
    "Reaching out as we're expanding into your market segment.",
    "Let's connect and share industry insights.",
    "I'd love to discuss a potential partnership.",
  ];
  const connPairs = new Set<string>();
  for (const sender of activeUsers) {
    const receivers = pickN(activeUsers.filter(u => u.id !== sender.id), 3);
    for (const receiver of receivers) {
      const key = `${sender.id}-${receiver.id}`;
      const reverseKey = `${receiver.id}-${sender.id}`;
      if (!connPairs.has(key) && !connPairs.has(reverseKey)) {
        connPairs.add(key);
        await prisma.connection.upsert({
          where: { senderId_receiverId: { senderId: sender.id, receiverId: receiver.id } },
          update: {},
          create: { senderId: sender.id, receiverId: receiver.id, status: pick(statuses), message: pick(connMessages) },
        });
      }
    }
  }
  const connCount = await prisma.connection.count();
  console.log(`  ✓ ${connCount} connections`);

  // ── 7. POSTS ──────────────────────────────────────────────────────────────
  console.log("Creating posts...");
  const posts: any[] = [];
  for (let i = 0; i < POST_CONTENTS.length; i++) {
    const author = activeUsers[i % activeUsers.length];
    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        content:  POST_CONTENTS[i],
        status:   i === 11 ? PostStatus.SUSPENDED : PostStatus.ACTIVE,
        isEdited: i % 4 === 0,
      },
    });
    posts.push(post);
  }
  console.log(`  ✓ ${posts.length} posts`);

  // ── 8. POST MEDIA ─────────────────────────────────────────────────────────
  console.log("Creating post media...");
  const mediaTypes = [MediaType.IMAGE, MediaType.IMAGE, MediaType.IMAGE, MediaType.VIDEO, MediaType.DOCUMENT];
  for (let i = 0; i < posts.length; i++) {
    const count = randomInt(1, 3);
    for (let j = 0; j < count; j++) {
      await prisma.postMedia.create({
        data: { postId: posts[i].id, url: POST_IMGS[(i + j) % POST_IMGS.length], type: pick(mediaTypes) },
      });
    }
  }
  const mediaCount = await prisma.postMedia.count();
  console.log(`  ✓ ${mediaCount} post media`);

  // ── 9. COMMENTS ───────────────────────────────────────────────────────────
  console.log("Creating comments...");
  const topComments: any[] = [];
  for (let i = 0; i < COMMENTS_TEXT.length; i++) {
    const post   = posts[i % posts.length];
    const author = activeUsers[(i + 2) % activeUsers.length];
    const comment = await prisma.comment.create({
      data: { postId: post.id, authorId: author.id, content: COMMENTS_TEXT[i], isEdited: i % 5 === 0 },
    });
    topComments.push(comment);
  }
  // replies
  const replyTexts = [
    "Great point! Totally agree.", "Thanks for sharing this perspective.",
    "Could you elaborate a bit more?", "This is exactly what I needed to hear.",
    "Well said! Looking forward to your updates.", "Interesting take — let's discuss further.",
    "Couldn't agree more!", "Thanks for the support!", "Will definitely reach out.", "Absolutely!",
  ];
  for (let i = 0; i < 10; i++) {
    const parent = topComments[i % topComments.length];
    const author = activeUsers[(i + 3) % activeUsers.length];
    await prisma.comment.create({
      data: { postId: parent.postId, authorId: author.id, content: replyTexts[i], parentId: parent.id },
    });
  }
  const commentCount = await prisma.comment.count();
  console.log(`  ✓ ${commentCount} comments (incl. replies)`);

  // ── 10. POST REACTIONS ────────────────────────────────────────────────────
  console.log("Creating post reactions...");
  const reactionTypes = [ReactionType.LIKE, ReactionType.DISLIKE];
  const reactedPairs = new Set<string>();
  for (const user of activeUsers) {
    const targetPosts = pickN(posts, 5);
    for (const post of targetPosts) {
      const key = `${post.id}-${user.id}`;
      if (!reactedPairs.has(key)) {
        reactedPairs.add(key);
        await prisma.postReaction.create({
          data: { postId: post.id, userId: user.id, type: pick(reactionTypes) },
        });
      }
    }
  }
  const postReactionCount = await prisma.postReaction.count();
  console.log(`  ✓ ${postReactionCount} post reactions`);

  // ── 11. COMMENT REACTIONS ─────────────────────────────────────────────────
  console.log("Creating comment reactions...");
  const allComments = await prisma.comment.findMany();
  const commentReactedPairs = new Set<string>();
  for (const user of activeUsers) {
    const targetComments = pickN(allComments, 4);
    for (const comment of targetComments) {
      const key = `${comment.id}-${user.id}`;
      if (!commentReactedPairs.has(key)) {
        commentReactedPairs.add(key);
        await prisma.commentReaction.create({
          data: { commentId: comment.id, userId: user.id, type: pick(reactionTypes) },
        });
      }
    }
  }
  const commentReactionCount = await prisma.commentReaction.count();
  console.log(`  ✓ ${commentReactionCount} comment reactions`);

  // ── 12. SAVED POSTS ───────────────────────────────────────────────────────
  console.log("Creating saved posts...");
  const savedPairs = new Set<string>();
  for (const user of activeUsers) {
    const targetPosts = pickN(posts, 4);
    for (const post of targetPosts) {
      const key = `${user.id}-${post.id}`;
      if (!savedPairs.has(key)) {
        savedPairs.add(key);
        await prisma.savedPost.create({ data: { userId: user.id, postId: post.id } });
      }
    }
  }
  const savedCount = await prisma.savedPost.count();
  console.log(`  ✓ ${savedCount} saved posts`);

  // ── 13. PLANS → SUBSCRIPTIONS & TRANSACTIONS ──────────────────────────────
  console.log("Creating subscriptions & transactions...");
  const subStatuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELED];
  const txStatuses  = [TransactionStatus.SUCCESS, TransactionStatus.PENDING, TransactionStatus.FAILED];

  for (let i = 0; i < activeUsers.length; i++) {
    const user = activeUsers[i];
    const plan = plans[i % plans.length];
    const subStatus = subStatuses[i % subStatuses.length];

    await prisma.subscription.create({
      data: {
        userId:    user.id,
        planId:    plan.id,
        status:    subStatus,
        startDate: daysAgo(randomInt(1, 60)),
        endDate:   daysFromNow(plan.duration),
      },
    });

    const txStatus = txStatuses[i % txStatuses.length];
    await prisma.transaction.create({
      data: {
        userId:             user.id,
        planId:             plan.id,
        amount:             plan.price,
        currency:           "INR",
        razorpayOrderId:    `order_${Date.now()}_${i}`,
        razorpayPaymentId:  txStatus === TransactionStatus.SUCCESS ? `pay_${Date.now()}_${i}` : null,
        razorpaySignature:  txStatus === TransactionStatus.SUCCESS ? `sig_${Date.now()}_${i}` : null,
        status:             txStatus,
      },
    });
  }
  const subCount = await prisma.subscription.count();
  const txCount  = await prisma.transaction.count();
  console.log(`  ✓ ${subCount} subscriptions, ${txCount} transactions`);

  // ── 14. CONVERSATIONS & DIRECT MESSAGES ───────────────────────────────────
  console.log("Creating conversations & messages...");
  const convPairs = new Set<string>();
  const conversations: any[] = [];

  for (let i = 0; i < activeUsers.length; i++) {
    for (let j = i + 1; j < activeUsers.length && conversations.length < 12; j++) {
      const u1 = activeUsers[i];
      const u2 = activeUsers[j];
      const key = `${u1.id}-${u2.id}`;
      if (!convPairs.has(key)) {
        convPairs.add(key);
        const lastMsg = pick(DM_MESSAGES);
        const conv = await prisma.conversation.create({
          data: { user1Id: u1.id, user2Id: u2.id, lastMessage: lastMsg, lastMessageAt: daysAgo(randomInt(0, 10)) },
        });
        conversations.push({ conv, u1, u2 });
      }
    }
  }

  for (const { conv, u1, u2 } of conversations) {
    const msgCount = randomInt(4, 8);
    for (let k = 0; k < msgCount; k++) {
      const sender = k % 2 === 0 ? u1 : u2;
      await prisma.directMessage.create({
        data: {
          conversationId: conv.id,
          senderId:       sender.id,
          content:        pick(DM_MESSAGES),
          isRead:         k < msgCount - 1,
          isDeleted:      false,
        },
      });
    }
  }
  const dmCount = await prisma.directMessage.count();
  console.log(`  ✓ ${conversations.length} conversations, ${dmCount} direct messages`);

  // ── 15. POST REPORTS ──────────────────────────────────────────────────────
  console.log("Creating post reports...");
  const reportReasons = Object.values(ReportReason);
  const reportStatuses = Object.values(ReportStatus);
  const reportDetails = [
    "This post contains misleading information about our company.",
    "The user is spamming the feed with promotional content.",
    "This post violates community guidelines.",
    "Contains offensive language targeting a specific community.",
    "Copyright infringement — content stolen from our website.",
    "Harassment directed at a competitor company.",
    "Fake testimonials being promoted as genuine.",
    "This post contains explicit content.",
    "User is impersonating a legitimate business.",
    "Post contains false pricing claims.",
  ];

  const reportPairs = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const post   = posts[i % posts.length];
    const reporter = activeUsers[(i + 1) % activeUsers.length];
    const key = `${post.id}-${reporter.id}`;
    if (!reportPairs.has(key) && post.authorId !== reporter.id) {
      reportPairs.add(key);
      await prisma.postReport.create({
        data: {
          postId:  post.id,
          userId:  reporter.id,
          reason:  reportReasons[i % reportReasons.length],
          details: reportDetails[i],
          status:  reportStatuses[i % reportStatuses.length],
        },
      });
    }
  }
  const reportCount = await prisma.postReport.count();
  console.log(`  ✓ ${reportCount} post reports`);

  // ── 16. SEARCH STATS ──────────────────────────────────────────────────────
  console.log("Creating search stats...");
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    for (let d = 0; d < 10; d++) {
      const date = daysAgo(d);
      const dateOnly = new Date(date.toISOString().split("T")[0]);
      await prisma.searchStat.upsert({
        where: { query_date_isTag: { query: SEARCH_QUERIES[i], date: dateOnly, isTag: i % 3 === 0 } },
        update: { count: { increment: randomInt(1, 50) } },
        create: { query: SEARCH_QUERIES[i], date: dateOnly, isTag: i % 3 === 0, count: randomInt(10, 200) },
      });
    }
  }
  const searchCount = await prisma.searchStat.count();
  console.log(`  ✓ ${searchCount} search stats`);

  // ── 17. PROFILE VIEW STATS ────────────────────────────────────────────────
  console.log("Creating profile view stats...");
  for (const company of companies) {
    for (let d = 0; d < 10; d++) {
      const date = daysAgo(d);
      const dateOnly = new Date(date.toISOString().split("T")[0]);
      await prisma.profileViewStat.upsert({
        where: { companyId_date: { companyId: company.id, date: dateOnly } },
        update: { count: { increment: randomInt(1, 20) } },
        create: { companyId: company.id, date: dateOnly, count: randomInt(5, 100) },
      });
    }
  }
  const pvCount = await prisma.profileViewStat.count();
  console.log(`  ✓ ${pvCount} profile view stats`);

  // ── 18. SEARCH IMPRESSION STATS ───────────────────────────────────────────
  console.log("Creating search impression stats...");
  for (const company of companies) {
    for (let d = 0; d < 10; d++) {
      const date = daysAgo(d);
      const dateOnly = new Date(date.toISOString().split("T")[0]);
      await prisma.searchImpressionStat.upsert({
        where: { companyId_date: { companyId: company.id, date: dateOnly } },
        update: { count: { increment: randomInt(1, 30) } },
        create: { companyId: company.id, date: dateOnly, count: randomInt(10, 150) },
      });
    }
  }
  const siCount = await prisma.searchImpressionStat.count();
  console.log(`  ✓ ${siCount} search impression stats`);

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete! Summary:");
  console.log(`   Users:                 ${users.length}`);
  console.log(`   Company Profiles:      ${companies.length}`);
  console.log(`   Plans:                 ${plans.length}`);
  console.log(`   Subscriptions:         ${subCount}`);
  console.log(`   Transactions:          ${txCount}`);
  console.log(`   Posts:                 ${posts.length}`);
  console.log(`   Post Media:            ${mediaCount}`);
  console.log(`   Comments:              ${commentCount}`);
  console.log(`   Post Reactions:        ${postReactionCount}`);
  console.log(`   Comment Reactions:     ${commentReactionCount}`);
  console.log(`   Saved Posts:           ${savedCount}`);
  console.log(`   Follows:               ${followCount}`);
  console.log(`   Connections:           ${connCount}`);
  console.log(`   Conversations:         ${conversations.length}`);
  console.log(`   Direct Messages:       ${dmCount}`);
  console.log(`   Post Reports:          ${reportCount}`);
  console.log(`   OTPs:                  ${otpCount}`);
  console.log(`   Search Stats:          ${searchCount}`);
  console.log(`   Profile View Stats:    ${pvCount}`);
  console.log(`   Search Impressions:    ${siCount}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
