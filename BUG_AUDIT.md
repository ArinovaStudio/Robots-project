# Exhaustive System Bug Audit & Verification Ledger

## 1. System & Architecture Overview
- **Framework**: Next.js 16.2.5 (App Router, custom HTTP server with Socket.IO in `server.ts`, Next middleware proxy convention in `proxy.ts`).
- **Database / ORM**: PostgreSQL (Neon Database Serverless) with pgvector, Prisma ORM 7.10.0.
- **Authentication**: NextAuth 4.24.14 (JWT strategy, credentials + OAuth providers, Prisma adapter, rate limiting on auth endpoints).
- **Real-time / WebSocket**: Socket.IO 4.8.3 for direct chat & presence tracking in `socket/directChatHandler.ts`.
- **Client State**: Zustand 5.0 (persisted `user-store`) + SWR 2.4 + Next.js router.
- **Payments**: Razorpay Node SDK with HMAC-SHA256 signature verification.

---

## 2. End-to-End Workflow Checklist

| Workflow Area | Sub-Workflow / Endpoint | Status | Notes |
|---|---|---|---|
| **Authentication & Onboarding** | Credentials Registration & Password Hashing | Fixed | Email normalized to prevent duplicate accounts via case variance |
| | Password Reset via OTP | Fixed | Email normalized in OTP generation, validation, and reset |
| | Verification Email OTP | Fixed | Normalizes input email; case-insensitive matching verified |
| | Multi-Step Investor Onboarding (`/signup/investor`) | Passed | Validates fields, creates profile & redirects correctly |
| | Multi-Step Company Onboarding (`/register/company`) | Passed | Validated company creation and redirects |
| | Logout & Session Eviction | Fixed | Clears persisted store & forces window navigation to `/login` |
| **Notifications** | Mark Notification as Read (`PATCH /api/notifications`) | Fixed | Replaced invalid compound `prisma.notification.update` with `updateMany` |
| **Payments & Razorpay** | Payment Verification & Boost Activation (`POST /api/razorpay/success`) | Fixed | Used `updateMany` for `companyProfile` so investor transactions don't crash |
| **Network & Connections** | Connection Request State Machine (`POST /api/network/connect/request`) | Fixed | Allows re-requesting connection if previous status was `REJECTED` |
| | Connections List & Search Filter (`GET /api/network/connect/connections`) | Fixed | Searches across founder name, company name, receiver, and investor firm |
| | Followers / Following Lists (`GET /api/network/followers`, `following`) | Fixed | Handles investors cleanly with firm name and user image fallbacks |
| **Social / Feed / Posts** | Post Creation with Events (`POST /api/posts`) | Fixed | Added try-catch for `eventDataString` JSON and validated `eventDate` |
| | Post Moderation & Profanity Filtering | Passed | Sanitizes profanities and flags violations |
| **Direct Messaging & Chat** | Direct Chat Metadata (`GET /api/chat/[targetUserId]`) | Fixed | Includes `image`, `accountType`, `investor` details & 404 handling |
| | Real-time WebSocket Messaging (`socket/directChatHandler.ts`) | Fixed | Chat socket payload includes investor details (`firmName`, avatar) |
| | Chat Avatar Fallback (`MessageBubble`, `ChatHeader`) | Fixed | Falls back to `user.image` when `company.logoUrl` is missing |
| **Investor Portal & Pitches** | Pitch Offer Creation (`POST /api/investor/pitches/[pitchId]/offer`) | Fixed | Enforces positive amount and blocks founders from self-offering |
| | Pitch Browsing & Filter State | Passed | Verified rating labels, pending states, and cancel buttons |
| **Exchange & Service Barter** | Industry Deal-In Calculation (`GET /api/exchange`) | Fixed | Safely falls back if `dealIn` array is empty or undefined |
| **Cron & Background Tasks** | Expire Subscriptions & Boosts (`POST /api/cron/expire`) | Fixed | Enforces `CRON_SECRET` presence to prevent `Bearer undefined` bypass |
| **Search & Discovery** | Search Suggestions (`GET /api/search/suggestions`) | Fixed | Returns suggestions for both companies and investors |

---

## 3. Discovered Defects & Remediation Ledger

### Bug ID: BUG-001
- **Severity**: High (Server Crash / Database Error)
- **Affected Feature & Files**: `app/api/notifications/route.ts`
- **Reproduction**: User marks notification as read via `PATCH /api/notifications` sending `{ id: "..." }`.
- **Expected Behavior**: Notification marked as read for the authenticated user without error.
- **Actual Behavior**: Prisma throws error because `Notification` model does not have a unique constraint on `[id, userId]`, making `prisma.notification.update({ where: { id, userId } })` invalid.
- **Root Cause**: Prisma `update` where clause requires a unique or compound unique index. `Notification` only has `@id` on `id`.
- **Fix Applied**: Switched to `prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } })`.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 1).
- **Verification Result**: Passed.

---

### Bug ID: BUG-002
- **Severity**: Critical (Financial Transaction / Account Failure)
- **Affected Feature & Files**: `app/api/razorpay/success/route.ts`
- **Reproduction**: Investor account purchases a profile boost or subscription plan and verifies payment.
- **Expected Behavior**: Payment is verified, transaction recorded, and user plan updated.
- **Actual Behavior**: Throws Prisma `P2025: Record to update not found.` when attempting `prisma.companyProfile.update({ where: { userId } })` because investors do not have a `CompanyProfile`.
- **Root Cause**: Assumed every paying user has a `CompanyProfile` row.
- **Fix Applied**: Changed to `prisma.companyProfile.updateMany({ where: { userId }, data: { ... } })` so it safely applies when present without failing investor transactions.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 2).
- **Verification Result**: Passed.

---

### Bug ID: BUG-003
- **Severity**: High (Broken State Machine / Permanent User Lockout)
- **Affected Feature & Files**: `app/api/network/connect/request/route.ts`
- **Reproduction**: User A sends connection request to User B. User B rejects the request. User A later tries to send another connection request.
- **Expected Behavior**: User can re-request connection or initiate new request.
- **Actual Behavior**: API returns 400 "Connection request already sent", permanently preventing the two users from ever connecting again.
- **Root Cause**: Route checked `if (existingConnection)` without checking whether the status was `REJECTED`.
- **Fix Applied**: Added branch to update existing `REJECTED` connection back to `PENDING` with updated `senderId` and `receiverId`, and trigger notification.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 3).
- **Verification Result**: Passed.

---

### Bug ID: BUG-004
- **Severity**: Medium (Data Retrieval / Incomplete Search)
- **Affected Feature & Files**: `app/api/network/connect/connections/route.ts`
- **Reproduction**: Search user connections with search query matching founder's name or investor's firm name.
- **Expected Behavior**: Matching connections are returned.
- **Actual Behavior**: No results returned because the search filter only checked `company.name`.
- **Root Cause**: Query where clause only filtered on `sender.company.name` and `receiver.company.name`.
- **Fix Applied**: Expanded search filter to match `sender.name`, `receiver.name`, and `investor.firmName`.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 4).
- **Verification Result**: Passed.

---

### Bug ID: BUG-005
- **Severity**: High (500 Server Crash / Unhandled JSON Exception)
- **Affected Feature & Files**: `app/api/posts/route.ts`
- **Reproduction**: Submitting a post with invalid JSON in `eventDataString` or submitting an invalid date string.
- **Expected Behavior**: Input validation returns 400 Bad Request with descriptive error.
- **Actual Behavior**: Unhandled `JSON.parse` crashed the request with 500, or `new Date(eventData.eventDate).toISOString()` threw `RangeError: Invalid time value`.
- **Root Cause**: `JSON.parse(eventDataString)` was not wrapped in try-catch, and date was converted without `isNaN(date.getTime())` validation.
- **Fix Applied**: Wrapped in safe try-catch returning 400 on malformed JSON; added date validity check and title requirement.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 5).
- **Verification Result**: Passed.

---

### Bug ID: BUG-006 & BUG-007
- **Severity**: Medium (UI Glitch / Missing Investor Data in Chat)
- **Affected Feature & Files**: `app/api/chat/[targetUserId]/route.ts`, `socket/directChatHandler.ts`
- **Reproduction**: Opening a chat or sending direct messages between a company founder and an investor.
- **Expected Behavior**: Investor profile image and firm name display properly in chat header and real-time messages.
- **Actual Behavior**: Avatar was broken or blank; investor firm name was missing because query only selected `company`.
- **Root Cause**: `targetUser` and `sender` Prisma select queries omitted `image`, `accountType`, and `investor`.
- **Fix Applied**: Added `image: true, accountType: true, investor: { select: { firmName: true } }` to user selections in API and socket handlers.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bugs 6 & 7).
- **Verification Result**: Passed.

---

### Bug ID: BUG-008
- **Severity**: Low (UI Visual Glitch)
- **Affected Feature & Files**: `components/chat/message-bubble.tsx`, `components/chat/chat-header.tsx`
- **Reproduction**: Viewing messages from an investor or user without a company logo.
- **Expected Behavior**: Displays user profile image fallback.
- **Actual Behavior**: Default placeholder was rendered even when user had a valid profile photo.
- **Root Cause**: Code checked `sender.company?.logoUrl` directly without falling back to `sender.image`.
- **Fix Applied**: Updated avatar resolution to fallback: `sender.company?.logoUrl || sender.image || "/placeholder.svg"`.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 8).
- **Verification Result**: Passed.

---

### Bug ID: BUG-009
- **Severity**: Medium (API 500 Crash / Null Dereference)
- **Affected Feature & Files**: `app/api/network/followers/route.ts`, `app/api/network/following/route.ts`
- **Reproduction**: Requesting followers or following list when one of the connections is an investor.
- **Expected Behavior**: Returns follower list with investor details.
- **Actual Behavior**: `...item.follower.company` threw TypeError or produced `{ null }` when `company` was null.
- **Root Cause**: Route spread `...item.follower.company` directly without checking if user is an investor.
- **Fix Applied**: Conditional mapping providing `firmName` and user `image` for investors, and company attributes for businesses.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 9).
- **Verification Result**: Passed.

---

### Bug ID: BUG-010
- **Severity**: Medium (API 500 Crash / Undefined Array Index)
- **Affected Feature & Files**: `app/api/exchange/route.ts`
- **Reproduction**: Company profile has empty `dealIn: []` or `null`. User visits `/exchange`.
- **Expected Behavior**: AI service exchange generates recommendations using company type or fallback industry.
- **Actual Behavior**: `company.dealIn[0]` accessed index 0 on empty array, causing undefined prompt interpolation or runtime failure.
- **Root Cause**: Unsafe array index access without bounds check.
- **Fix Applied**: Added fallback: `(company.dealIn && company.dealIn.length > 0) ? company.dealIn[0] : company.type || "their industry"`.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 10).
- **Verification Result**: Passed.

---

### Bug ID: BUG-011
- **Severity**: High (Security Vulnerability / Unauthorized Access)
- **Affected Feature & Files**: `app/api/cron/expire/route.ts`
- **Reproduction**: In environments where `CRON_SECRET` is unset, send `POST /api/cron/expire` with header `Authorization: Bearer undefined`.
- **Expected Behavior**: Endpoint rejects all unauthenticated requests.
- **Actual Behavior**: Header comparison `authHeader !== Bearer ${process.env.CRON_SECRET}` evaluated to `Bearer undefined === Bearer undefined`, allowing unauthorized invocation.
- **Root Cause**: Missing check that `process.env.CRON_SECRET` is truthy before comparing headers.
- **Fix Applied**: Added guard: `if (!process.env.CRON_SECRET) { return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 401 }); }`.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 11).
- **Verification Result**: Passed.

---

### Bug ID: BUG-012
- **Severity**: Medium (Business Logic Violation)
- **Affected Feature & Files**: `app/api/investor/pitches/[pitchId]/offer/route.ts`
- **Reproduction**: Pitch owner submits an investment offer on their own pitch, or submits negative offer amount.
- **Expected Behavior**: Rejected with 400 Bad Request.
- **Actual Behavior**: Pitch owner could submit offers to themselves, and negative amounts were accepted.
- **Root Cause**: Missing validation for `pitch.userId === session.user.id` and `amount <= 0`.
- **Fix Applied**: Added checks preventing self-offers and requiring `amount > 0`.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 12).
- **Verification Result**: Passed.

---

### Bug ID: BUG-013
- **Severity**: Medium (Authentication Failure / User Lockout)
- **Affected Feature & Files**: `app/api/auth/otp/send/route.ts`, `otp/verify/route.ts`, `register/route.ts`, `reset-password/route.ts`
- **Reproduction**: User registers or requests OTP with mixed-case email (e.g. `User@Domain.com`), then logs in or verifies with `user@domain.com`.
- **Expected Behavior**: Authentication and OTP verification succeed regardless of email casing.
- **Actual Behavior**: OTP verification failed or duplicate user error occurred due to case-sensitive string matching.
- **Root Cause**: Inconsistent email normalization before querying or inserting into database.
- **Fix Applied**: Added `.trim().toLowerCase()` to emails across all authentication endpoints.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 13).
- **Verification Result**: Passed.

---

### Bug ID: BUG-014
- **Severity**: Low (Search Incompleteness)
- **Affected Feature & Files**: `app/api/search/suggestions/route.ts`
- **Reproduction**: User types query in search bar hoping to find an investor firm.
- **Expected Behavior**: Search suggestions include investor firms.
- **Actual Behavior**: Only company profiles were queried and suggested.
- **Root Cause**: Route only queried `prisma.companyProfile`.
- **Fix Applied**: Added parallel query to `prisma.investorProfile` and combined suggestion results.
- **Regression Test**: `__tests__/exhaustive-bug-fixes.test.ts` (Bug 14).
- **Verification Result**: Passed.

---

### Bug ID: BUG-015
- **Severity**: High (Production Build Failure / Prerender Crash)
- **Affected Feature & Files**: `app/(auth)/resend-otp/page.tsx`, `app/(home)/directory/page.tsx`
- **Reproduction**: Run `npm run build` with Next.js 16.
- **Expected Behavior**: Static pages and CSR bailout components build cleanly.
- **Actual Behavior**: Build crashed with error `useSearchParams() should be wrapped in a suspense boundary at page "/resend-otp". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout`.
- **Root Cause**: Next.js App Router requires client components using `useSearchParams()` to be wrapped in `<Suspense>` boundaries to prevent prerender errors during SSG.
- **Fix Applied**: Wrapped `ResendOtpContent` and `DirectoryClient` inside `<Suspense>` boundaries with fallback loaders.
- **Regression Test**: Verified via `npm run build`.
- **Verification Result**: Passed (185/185 static and dynamic routes compiled successfully).

---

## 4. Verification Summary
- **Type Checking (`tsc --noEmit`)**: 0 errors.
- **Unit & Integration Tests (`npm test`)**: 15 test suites passed, 128 tests passed, 0 failures.
- **Production Build (`npm run build`)**: Compiled successfully (185/185 pages).

