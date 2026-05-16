# TutorTrack

TutorTrack is a tutor marketplace and student progress tracking platform. This repository currently includes manual payments, Omise/Opn PromptPay gateway payments, and testing/security hardening for the MVP.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Zod
- Vitest

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```powershell
Copy-Item .env.example .env
```

3. Update `DATABASE_URL` in `.env` to point at your local PostgreSQL database.

4. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Scripts

- `npm run dev` starts the local Next.js development server.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run test` runs Vitest.
- `npm run db:migrate` runs Prisma migrations against `DATABASE_URL`.
- `npm run db:seed` runs the Prisma seed script.

## Environment

- `DATABASE_URL` is required and must be a PostgreSQL connection string.
- `AUTH_SECRET` is required for signed HttpOnly session cookies and must be at least 32 characters long.
- `NEXT_PUBLIC_APP_URL` defaults to `http://localhost:3000` when omitted.
- `SHADOW_DATABASE_URL` is optional and useful when your database user cannot create Prisma shadow databases during migration workflows.
- `ALLOW_DEMO_PASSWORD_LOGIN` is optional and should stay unset or `false` in production. Set it to `true` only for disposable demo deployments that intentionally allow seeded `@tutortrack.test` accounts to use the shared demo password.
- `PAYMENT_PROVIDER` can be `OMISE` for the PromptPay gateway flow or `MANUAL` for manual-only deployments.
- `OMISE_PUBLIC_KEY` and `NEXT_PUBLIC_OMISE_PUBLIC_KEY` are public Omise/Opn keys. The current PromptPay flow creates charges server-side, but the public key is documented for future client SDK work.
- `OMISE_SECRET_KEY` is required only on the server for Omise/Opn charge creation and charge retrieval. Never expose it to the browser.
- `OMISE_WEBHOOK_SECRET` is optional but recommended. Use it as a shared token in the webhook URL query string or a webhook header when your provider setup supports it.

Manual payment records do not require provider secrets. PromptPay gateway payments require Omise/Opn keys.

## Database Setup

Prisma is configured for PostgreSQL in `prisma/schema.prisma`. The schema includes TutorTrack users, role profiles, explicit parent-student links, subjects, courses, enrollments, sessions, attendance, assignments, submissions, assessments, skills, progress notes, reviews, and manual payment records.

Generate the Prisma client after schema changes:

```bash
npx prisma generate
```

Create or apply migrations against your local PostgreSQL database:

```bash
npm run db:migrate
```

Run the demo seed after applying migrations:

```bash
npm run db:seed
```

The generated Prisma client is written to `lib/generated/prisma` and ignored by Git. `npm install` runs `prisma generate` through the `postinstall` script.

Historical learning records and parent-child access links use status fields or restrictive relations instead of destructive cascade deletes. Tutor update permissions for student progress must be enforced in server-side services and `lib/permissions.ts` by checking the student's active enrollment belongs to a course owned by that tutor.

## Seed Data

The Phase 3 seed creates realistic demo data for the TutorTrack MVP flow:

- 1 admin, 3 tutors, 5 students, and 3 parents.
- Active `ParentStudentLink` records for parent-child access testing.
- 6 subjects and 6 courses, including published marketplace courses and draft courses.
- Enrollments, lesson sessions, attendance, assignments, submissions, assessments, skills, student skill progress, tutor progress notes, reviews, and manual payment records.
- A complete progress-report dataset for `student1@tutortrack.test`.
- A partial progress-report dataset for `student2@tutortrack.test`.
- One tutor with `PENDING` verification, `DRAFT` courses, one `PENDING` payment, and paid manual-transfer payment records.

Demo accounts:

| Role | Email | Name |
| --- | --- | --- |
| Admin | `admin@tutortrack.test` | อรทัย ศิริวัฒน์ |
| Tutor | `tutor1@tutortrack.test` | ปวีณา จันทร์สุข |
| Tutor | `tutor2@tutortrack.test` | ณัฐวุฒิ เกียรติชัย |
| Tutor | `tutor3@tutortrack.test` | มาลินี ธรรมรักษ์ |
| Student | `student1@tutortrack.test` | พิมพ์ชนก วัฒนากุล |
| Student | `student2@tutortrack.test` | กานต์พิชญ์ เลิศล้ำ |
| Student | `student3@tutortrack.test` | ธนภัทร แสงทอง |
| Student | `student4@tutortrack.test` | สิรินดา พรหมรักษ์ |
| Student | `student5@tutortrack.test` | ปุณณวิช สุขเกษม |
| Parent | `parent1@tutortrack.test` | ศิริพร วัฒนากุล |
| Parent | `parent2@tutortrack.test` | เมธินี เลิศล้ำ |
| Parent | `parent3@tutortrack.test` | ชยุตม์ แสงทอง |

All demo accounts can sign in locally with password `TutorTrackDemo123!`. The auth layer accepts the legacy seed hash `placeholder-password-hash-auth-phase` only for `@tutortrack.test` demo accounts, and production disables that fallback unless `ALLOW_DEMO_PASSWORD_LOGIN="true"` is explicitly set. New registered users are stored with scrypt password hashes.

## Authentication and Roles

Phase 4 uses a custom email/password auth foundation:

- Passwords are verified server-side and new accounts are hashed with Node `crypto.scrypt`.
- Sessions are signed HttpOnly cookies named `tutortrack_session`.
- Auth POST routes require same-origin `Origin` or `Referer` headers.
- Login and register routes have basic in-memory rate limiting to reduce brute-force attempts.
- Global security headers are configured in `next.config.ts`, including frame blocking, content sniffing protection, referrer policy, permissions policy, and a minimal CSP.
- Logout is a POST-only mutation.
- Current user resolution lives in `lib/current-user.ts`.
- Auth helpers live in `lib/auth.ts` and `lib/session.ts`.
- Route handlers live in `app/api/auth/login`, `app/api/auth/register`, and `app/api/auth/logout`.

Dashboard redirects by role:

| Role | Dashboard |
| --- | --- |
| ADMIN | `/dashboard/admin` |
| TUTOR | `/dashboard/tutor` |
| STUDENT | `/dashboard/student` |
| PARENT | `/dashboard/parent` |

Protected dashboard pages use server-side guards from `lib/guards.ts`. Unauthenticated users are redirected to `/auth/login`; authenticated users who request the wrong role dashboard are redirected to their own dashboard.

Permission rules are centralized in `lib/permissions.ts`:

- ADMIN can access all protected resources and verify manual payments.
- TUTOR can access their own tutor profile, own courses, sessions, assignments, submissions, and enrolled students for those courses.
- STUDENT can access only their own profile, enrollments, sessions, attendance, assignments, submissions, scores, and progress reports.
- PARENT can access only active linked children through `ParentStudentLink`.
- PUBLIC users can view only published public tutor/course surfaces when those pages are implemented.

Test login locally:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Then open `http://localhost:3000/auth/login` and sign in with any demo email plus password `TutorTrackDemo123!`.

## Public Marketplace

Phase 5 adds public browsing routes:

| Route | Purpose |
| --- | --- |
| `/` | Marketplace homepage with popular subjects, featured tutors, featured courses, and CTAs. |
| `/tutors` | Public tutor listing with search, subject, level, price, rating, and sort filters. |
| `/tutors/[tutorId]` | Public tutor profile detail. |
| `/courses` | Public course listing with search, subject, level, course type, price, and sort filters. |
| `/courses/[courseId]` | Public course detail with tutor summary and lesson preview. |

Public visibility rules:

- Only tutors with `TutorVerificationStatus.APPROVED` are shown publicly.
- Pending and rejected tutors are hidden from `/tutors` and tutor detail pages.
- Only courses with `CourseStatus.PUBLISHED` are shown publicly.
- Draft and archived courses are hidden from `/courses` and course detail pages.
- Public course pages also require the tutor to be approved.
- Enrollment is implemented for students and linked parents. Omise/Opn PromptPay gateway processing is added in Phase 18.

The schema now stores course `level` for management and marketplace filters. Tutor `education` and `teachingStyle` are still summarized from public tutor headline/bio until dedicated profile fields are added in a later phase.

## Visual UI Polish

Phase 16 improves the MVP presentation without changing business rules or permissions:

- Public marketplace pages now use visual hero sections, image-backed tutor/course cards, clearer CTAs, and visual empty states.
- Main role dashboards use summary cards and quick-action cards instead of long text blocks.
- Progress report UI uses larger score cards, progress bars, mobile-friendly report cards, visual skill cards, and clearer partial-data messaging.
- Enrollment lists render as mobile cards on small screens while preserving readable tables on larger screens.

Image strategy:

- Local/static visuals use `next/image`.
- Public placeholder assets live in `public/images/`.
- Remote image hotlinks are not used for marketplace fallback imagery.
- Optional profile image URLs are used only when they are local app paths; otherwise TutorTrack falls back to safe local placeholders.

Placeholder assets:

- `public/images/hero-learning.svg`
- `public/images/tutor-placeholder.svg`
- `public/images/course-placeholder.svg`
- `public/images/progress-placeholder.svg`
- `public/images/empty-state.svg`

This phase is visual polish only. It does not add payment gateways, AI recommendations, PDF export, notifications, or new business modules.

## Course Management

Phase 6 adds protected course management routes for tutors and admins:

| Route | Purpose |
| --- | --- |
| `/dashboard/tutor/courses` | Tutor-owned course list with search, subject, status, and course type filters. |
| `/dashboard/tutor/courses/new` | Create a new tutor course. New courses always start as `DRAFT`. |
| `/dashboard/tutor/courses/[courseId]` | Tutor course detail with status, stats, and actions. |
| `/dashboard/tutor/courses/[courseId]/edit` | Edit tutor-owned course details. Status is not edited casually in this form. |
| `/dashboard/admin/courses` | Admin list for all courses with tutor, subject, status, and course type filters. |
| `/dashboard/admin/courses/[courseId]` | Admin course detail and status actions. |

Course status lifecycle:

- `DRAFT` courses are editable and hidden from public marketplace pages.
- `DRAFT` can become `PUBLISHED`.
- `PUBLISHED` can become `ARCHIVED`.
- `ARCHIVED` stays hidden publicly and can be restored to `DRAFT`.
- Courses are not hard-deleted because future enrollments and learning records depend on course history.

Course permissions:

- Tutors can create courses only for their own `TutorProfile`.
- Tutors can view, edit, publish, archive, and restore only courses they own.
- Admins can view all courses and manage any course status.
- Students, parents, and public visitors cannot access course management routes.
- Public course pages still show only `PUBLISHED` courses from approved tutors.

The `Course` schema includes `level`, `capacity` for max students, and `totalSessions` for planned sessions. Lesson session scheduling and attendance are implemented in Phase 8. Assignments and progress reports are implemented in later phases; Omise/Opn PromptPay gateway processing is added in Phase 18.

Verify course management changes with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Enrollment

Phase 7 adds server-side enrollment flows for students, parents, tutors, and admins:

| Route | Purpose |
| --- | --- |
| `/courses/[courseId]` | Public course detail CTA. Students can enroll themselves; parents can enroll active linked children; public users are sent to login. |
| `/dashboard/student/enrollments` | Student-only list of own enrollments with pending cancellation. |
| `/dashboard/parent/children/[studentId]/enrollments` | Parent-only child enrollment list and linked-child enrollment form. |
| `/dashboard/tutor/courses/[courseId]/students` | Tutor-owned course student list with status/search filters. |
| `/dashboard/tutor/enrollments` | Tutor overview across own course enrollments. |
| `/dashboard/admin/enrollments` | Admin enrollment management with course, tutor, student, and status filters. |

Enrollment status lifecycle:

- New student or parent-created enrollments start as `PENDING`.
- Admin can change `PENDING` to `ACTIVE` or `CANCELLED`.
- Admin can change `ACTIVE` to `COMPLETED` or `CANCELLED`.
- `CANCELLED` and `COMPLETED` are treated as final states in the MVP.
- Students and parents can cancel only `PENDING` enrollments they are authorized to access.

Enrollment rules:

- Students can enroll only themselves.
- Parents can enroll only children connected by active `ParentStudentLink` records.
- Tutors cannot create enrollments and can view enrollments only for courses they own.
- Admins can view and manage all enrollment statuses.
- Public users cannot enroll without logging in.
- Only `PUBLISHED` courses can be enrolled in; `DRAFT` and `ARCHIVED` courses are blocked.
- The service prevents duplicate `PENDING` or `ACTIVE` enrollments for the same student/course and checks course `capacity` against pending plus active seats.
- The schema keeps enrollment history and no course/enrollment hard-delete path is exposed.

Manual payment submission and admin verification are implemented in Phase 13. Omise/Opn PromptPay gateway collection is added in Phase 18.

Verify enrollment changes with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Sessions and Attendance

Phase 8 adds lesson session scheduling and attendance tracking:

| Route | Purpose |
| --- | --- |
| `/dashboard/tutor/sessions` | Tutor-owned session list with course, status, and search filters. |
| `/dashboard/tutor/courses/[courseId]/sessions` | Sessions for one tutor-owned course. |
| `/dashboard/tutor/courses/[courseId]/sessions/new` | Create a new scheduled session for a tutor-owned published course. |
| `/dashboard/tutor/sessions/[sessionId]` | Tutor session detail with attendance marking for active enrolled students. |
| `/dashboard/tutor/sessions/[sessionId]/edit` | Edit a tutor-owned scheduled session. |
| `/dashboard/student/schedule` | Student-only schedule from own active enrollments. |
| `/dashboard/student/attendance` | Student-only attendance history and summary. |
| `/dashboard/parent/children/[studentId]/schedule` | Parent view for an active linked child's schedule. |
| `/dashboard/parent/children/[studentId]/attendance` | Parent view for an active linked child's attendance history. |
| `/dashboard/admin/sessions` | Admin view of all sessions and attendance records. |

Session status lifecycle:

- New sessions start as `SCHEDULED`.
- Tutors can create sessions only for their own `PUBLISHED` courses.
- Tutors can edit only their own `SCHEDULED` sessions.
- `SCHEDULED` sessions can become `COMPLETED` or `CANCELLED`.
- `COMPLETED` and `CANCELLED` are final states for the MVP.
- Tutors cannot create sessions for `DRAFT` or `ARCHIVED` courses.

Attendance rules:

- Tutors can mark attendance only for sessions in their own courses.
- Attendance can be marked only for students with `ACTIVE` enrollment in that course.
- `PENDING`, `CANCELLED`, and `COMPLETED` enrollments are not markable.
- Attendance uses upsert on `(sessionId, studentId)` to prevent duplicate records.
- Attendance statuses are `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED`.
- Cancelled sessions are locked for attendance marking.

Access rules:

- Admins can view and manage all sessions and view all attendance records.
- Tutors can manage only their own sessions and attendance for their own courses.
- Students can view only their own schedule and attendance history.
- Parents can view schedule and attendance only for active linked children.
- Public users cannot access sessions or attendance dashboard routes.

Phase 8 still does not implement assignments, submissions, assessments, progress reports, or payment gateway processing; those are covered by later phases.

Verify sessions and attendance changes with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Assignments and Submissions

Phase 9 adds homework assignment, student submission, tutor grading, parent tracking, and admin inspection flows:

| Route | Purpose |
| --- | --- |
| `/dashboard/tutor/assignments` | Tutor overview across assignments in own courses, with course/search/grading filters. |
| `/dashboard/tutor/courses/[courseId]/assignments` | Assignments for one tutor-owned course. |
| `/dashboard/tutor/courses/[courseId]/assignments/new` | Create an assignment for a tutor-owned course. |
| `/dashboard/tutor/assignments/[assignmentId]` | Assignment detail with active enrolled student roster and submission status. |
| `/dashboard/tutor/assignments/[assignmentId]/edit` | Edit an assignment in a tutor-owned course. |
| `/dashboard/tutor/submissions/[submissionId]/grade` | Grade a submission for a tutor-owned course assignment. |
| `/dashboard/student/assignments` | Student view of assignments for ACTIVE enrollments only. |
| `/dashboard/student/assignments/[assignmentId]` | Student assignment detail and submit/resubmit form. |
| `/dashboard/parent/children/[studentId]/assignments` | Parent read-only assignment tracker for an active linked child. |
| `/dashboard/parent/children/[studentId]/assignments/[assignmentId]` | Parent read-only assignment/submission detail. |
| `/dashboard/admin/assignments` | Admin read-only assignment overview and counts. |
| `/dashboard/admin/submissions` | Admin read-only submission inspection. |

Assignment and submission rules:

- Tutors can create and edit assignments only for courses they own.
- Students can view and submit assignments only for courses where they have `ACTIVE` enrollment.
- Parents can view assignments/submissions only for children linked through active `ParentStudentLink` records.
- Parents cannot submit work in the MVP.
- Tutors can grade submissions only for assignments in their own courses.
- Admins can view all assignments and submissions, but admin grading is not implemented in this phase.
- Each student has at most one submission per assignment via the schema unique key and service upsert.
- Students may resubmit before grading; once `gradedAt` is set, student edits are blocked.
- Late status is derived from `submittedAt > dueAt`.
- Scores are validated server-side and cannot exceed the assignment `maxScore`.
- Homework summary data is available through `getHomeworkSummaryForStudent` for future progress reports.

The current Prisma schema does not include `Assignment.sessionId`, so Phase 9 assignments are linked to courses only. Session-linked assignments can be added later with a schema migration.

Phase 9 still does not implement deterministic progress reports, AI features, or payment gateway processing; those are covered by later phases where in scope.

Verify assignments and submissions with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Assessments and Skill Progress

Phase 10 adds tutor-managed assessments, student score viewing, parent score tracking, and course skill progress:

| Route | Purpose |
| --- | --- |
| `/dashboard/tutor/assessments` | Tutor overview of assessment groups across own courses. |
| `/dashboard/tutor/courses/[courseId]/assessments` | Assessments for one tutor-owned course. |
| `/dashboard/tutor/courses/[courseId]/assessments/new` | Create an assessment for ACTIVE enrolled students in a tutor-owned course. |
| `/dashboard/tutor/assessments/[assessmentId]` | Record or update scores for ACTIVE enrolled students. |
| `/dashboard/tutor/assessments/[assessmentId]/edit` | Edit assessment metadata without deleting score history. |
| `/dashboard/tutor/courses/[courseId]/skills` | Batch update course skill levels for ACTIVE enrolled students. |
| `/dashboard/tutor/students/[studentId]/skills` | Tutor view of one active student skill matrix across own courses. |
| `/dashboard/student/assessments` | Student read-only assessment results for ACTIVE enrollments. |
| `/dashboard/student/skills` | Student read-only skill matrix. |
| `/dashboard/parent/children/[studentId]/assessments` | Parent read-only assessment results for an active linked child. |
| `/dashboard/parent/children/[studentId]/skills` | Parent read-only skill matrix for an active linked child. |
| `/dashboard/admin/assessments` | Admin read-only assessment score inspection. |
| `/dashboard/admin/skill-progress` | Admin read-only skill progress inspection. |

Assessment and skill rules:

- Tutors can create/edit assessments only for their own courses.
- The current Prisma schema stores `Assessment` as one row per student score, so TutorTrack groups assessment rows by course, title, type, date, and max score. Creating an assessment creates score rows for current ACTIVE enrollments.
- Tutors can record assessment scores only for ACTIVE enrolled students in their own courses.
- Scores are validated server-side and cannot exceed `maxScore`.
- Tutors can update skill progress only for ACTIVE enrolled students in their own courses.
- Students and parents can view skill matrices and assessment results but cannot edit them.
- Parents can view only children connected through active `ParentStudentLink` records.
- Admin pages are read-only for this phase.

Skill level score mapping for future deterministic progress reports:

| Skill level | Score |
| --- | ---: |
| `NEEDS_WORK` | 25 |
| `BASIC` | 50 |
| `GOOD` | 75 |
| `EXCELLENT` | 100 |

Helpers now exist for future reports:

- `getAssessmentAverageForStudent(studentId, courseId?)`
- `getSkillAverageForStudent(studentId, courseId?)`
- `mapSkillLevelToScore(level)`

Phase 10 still does not implement AI features, payment gateway processing, or a separate assessment-template schema; payment gateway support is added in Phase 18.

Verify assessments and skill progress with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Progress Report Engine

Phase 11 adds the deterministic progress report engine and progress note APIs.

Progress report routes:

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/progress/report?studentId=...&courseId=...` | `GET` | Return a protected deterministic progress report for one student/course. |
| `/api/progress/notes?studentId=...&courseId=...` | `GET` | Return protected tutor progress notes for one student/course. |
| `/api/progress/notes` | `POST` | Create a tutor progress note for an ACTIVE enrolled student in the tutor's own course. |

Progress formula:

```text
progressScore =
(attendanceRate * 0.20) +
(homeworkCompletionRate * 0.25) +
(assessmentAverage * 0.35) +
(skillAverage * 0.15) +
(behaviorScore * 0.05)
```

Missing attendance, homework, assessment, or skill data returns `null` for that component and contributes `0` to the weighted score. `dataCompleteness` explains which data sources are present.

Data completeness:

- Attendance data = 25%
- Homework data = 25%
- Assessment score data = 25%
- Skill progress data = 25%
- Tutor note presence is reported separately as `hasTutorNote`

Skill level mapping:

| Skill level | Score |
| --- | ---: |
| `NEEDS_WORK` | 25 |
| `BASIC` | 50 |
| `GOOD` | 75 |
| `EXCELLENT` | 100 |

Behavior score placeholder:

- Latest tutor progress note exists: `80`
- No tutor progress note exists: `70`
- This is deterministic placeholder logic only. It does not use AI and does not infer sensitive behavior.

Progress report permissions:

- Admins can view all progress reports and notes, and can create progress notes for students with ACTIVE enrollment. Because the current schema requires `tutorId` on `ProgressNote`, admin-created notes are attached to the course tutor record.
- Tutors can view progress and create notes only for ACTIVE enrolled students in their own courses.
- Students can view only their own active-course progress.
- Parents can view only active linked children through `ParentStudentLink`.
- Public users cannot access progress report or progress note APIs.

Phase 11 intentionally does not implement PDF export, AI recommendations, or payment gateway processing; payment gateway support is added in Phase 18.

Verify progress reports with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Progress Report UI

Phase 12 adds protected progress report UI that uses the Phase 11 deterministic report engine.

| Route | Purpose |
| --- | --- |
| `/dashboard/student/progress` | Student overview across own ACTIVE course enrollments. |
| `/dashboard/student/progress/[courseId]` | Student full report for one own ACTIVE course. |
| `/dashboard/parent/children/[studentId]/progress` | Parent overview for an active linked child. |
| `/dashboard/parent/children/[studentId]/courses/[courseId]/progress` | Parent full child report with parent-friendly wording. |
| `/dashboard/tutor/students/[studentId]/progress` | Tutor overview for an ACTIVE enrolled student in own courses. |
| `/dashboard/tutor/courses/[courseId]/students/[studentId]/progress` | Tutor full report with progress note form and note history. |
| `/dashboard/admin/progress` | Admin progress overview across ACTIVE enrollments with filters. |
| `/dashboard/admin/students/[studentId]/courses/[courseId]/progress` | Admin read-only full progress report and note history. |

Visibility rules:

- Students can view only their own progress reports.
- Parents can view only active linked children through `ParentStudentLink`.
- Tutors can view progress and create progress notes only for ACTIVE enrolled students in their own courses.
- Admins can view all progress reports. The admin UI is read-focused in this MVP.
- Public users cannot access progress report pages.

Score badges:

| Score | Label |
| --- | --- |
| 85-100 | Excellent |
| 70-84 | Good |
| 50-69 | Needs Attention |
| 0-49 | At Risk |
| No source data | Not enough data |

Data completeness shows attendance, homework, assessment, and skill data availability. Tutor note presence is shown separately. Low completeness displays a clear partial-data message instead of fabricating insight.

Current limitations:

- No PDF export yet.
- No AI recommendations; next steps are deterministic rules from the progress engine.
- No polished analytics dashboard beyond the MVP overview/detail UI.

Verify progress UI with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Manual Payment MVP

Phase 13 adds manual payment submission and admin verification. It does not integrate a payment gateway, card processor, PromptPay API, automatic bank verification, AI slip reading, invoice PDF export, or accounting system.

Payment routes:

| Route | Purpose |
| --- | --- |
| `/dashboard/student/payments` | Student payment history for own enrollments only. |
| `/dashboard/student/enrollments/[enrollmentId]/payment` | Student manual payment form for an own `PENDING` or `ACTIVE` enrollment. |
| `/dashboard/parent/children/[studentId]/payments` | Parent read-only payment history for an active linked child. |
| `/dashboard/parent/children/[studentId]/enrollments/[enrollmentId]/payment` | Parent manual payment form for an active linked child's enrollment. |
| `/dashboard/tutor/payments` | Tutor limited payment status summary for enrollments in own courses. Proof URLs and notes are hidden from tutors. |
| `/dashboard/admin/payments` | Admin payment list with status, method, payer, student, course, tutor, and date filters. |
| `/dashboard/admin/payments/[paymentId]` | Admin payment detail and verification actions. |

Manual payment workflow:

1. A student or parent creates a payment record for an authorized enrollment.
2. The payer enters amount, manual method, and either a proof URL or note.
3. New payments start as `PENDING`.
4. Admin reviews the payment and marks it `PAID`, `FAILED`, or `REFUNDED`.
5. When a `PENDING` payment is marked `PAID`, `paidAt` is set and a `PENDING` enrollment is activated.

Payment status lifecycle:

- `PENDING` can become `PAID` or `FAILED`.
- `PAID` can become `REFUNDED`.
- `FAILED` and `REFUNDED` are final states in the MVP.
- Payment records are never hard-deleted.
- `REFUNDED` preserves the original `paidAt` timestamp for audit history.

Payment rules:

- Students can create and view payments only for their own enrollments.
- Parents can create and view payments only for active linked children through `ParentStudentLink`.
- Tutors cannot create or verify payments and can only see limited payment status for their own course enrollments.
- Admins can view and verify all payments.
- Public users cannot access payment routes.
- Payment creation is blocked for `CANCELLED` and `COMPLETED` enrollments.
- Duplicate `PENDING` payments for the same enrollment are blocked.
- `CARD` is intentionally disabled in the manual MVP.
- `MANUAL_TRANSFER` and `PROMPTPAY` are stored as manual records only.

Verify manual payments with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Omise/Opn PromptPay Gateway

Phase 18 adds real Omise/Opn PromptPay QR payments while preserving the manual payment MVP. It does not add credit cards, recurring billing, automatic refunds, tutor payouts, coupons, invoice PDFs, or AI slip reading.

PromptPay routes and APIs:

| Route | Purpose |
| --- | --- |
| `/dashboard/student/enrollments/[enrollmentId]/pay` | Student creates an Omise PromptPay QR charge for their own enrollment. |
| `/dashboard/parent/children/[studentId]/enrollments/[enrollmentId]/pay` | Parent creates an Omise PromptPay QR charge for an active linked child enrollment. |
| `POST /api/payments/omise/promptpay/create` | Server-side PromptPay charge creation. Requires auth, same-origin request, Zod validation, and payment permission. |
| `GET /api/payments/[paymentId]/status` | Safe payment status polling for authorized users. |
| `POST /api/webhooks/omise` | Omise webhook endpoint. It retrieves the charge from Omise before changing local payment status. |

Required Omise/Opn setup:

1. Create an Omise/Opn account and enable PromptPay for Thailand.
2. Add test keys to `.env` and Vercel environment variables:

```env
PAYMENT_PROVIDER="OMISE"
OMISE_PUBLIC_KEY="pkey_test_..."
NEXT_PUBLIC_OMISE_PUBLIC_KEY="pkey_test_..."
OMISE_SECRET_KEY="skey_test_..."
OMISE_WEBHOOK_SECRET="generate-a-random-shared-secret"
```

3. Configure the webhook URL in the Omise dashboard:

```text
https://your-domain.com/api/webhooks/omise?secret=your-OMISE_WEBHOOK_SECRET
```

PromptPay flow:

1. Student or parent opens the PromptPay payment page for an authorized enrollment.
2. TutorTrack creates a local `PENDING` payment with provider `OMISE`.
3. TutorTrack creates an Omise PromptPay source and charge with the server-side secret key.
4. The page displays the QR code from `charge.source.scannable_code.image.download_uri`.
5. The user scans the QR in a Thai mobile banking app.
6. Omise sends `charge.complete` to `/api/webhooks/omise`.
7. TutorTrack retrieves the charge from Omise using `OMISE_SECRET_KEY` and trusts only the retrieved provider status.
8. If Omise confirms success, payment becomes `PAID`, `paidAt` is set, and a `PENDING` enrollment becomes `ACTIVE`.
9. Failed or expired provider statuses are mapped to `FAILED` because the current enum has no `EXPIRED`.

Security notes:

- `OMISE_SECRET_KEY` is server-only.
- Frontend code can create a charge request but cannot mark a payment as `PAID`.
- Uploaded proof and manual records do not activate Omise gateway payments.
- Admin manual verification is disabled for Omise gateway payments. Gateway status must come from webhook/provider retrieval.
- Webhooks are idempotent: duplicate `charge.complete` events update the same payment and do not duplicate enrollment activation.
- The webhook route does not require a user session, but it validates the shared webhook token when configured and always retrieves the charge from Omise before changing state.
- Tutor pages show only limited payment status and do not expose proof URLs, notes, provider charge IDs, or source IDs.

Local webhook testing:

- Use Omise test mode.
- Expose your local app with a tunneling tool such as ngrok.
- Configure the Omise test webhook to the tunnel URL plus `/api/webhooks/omise?secret=...`.
- In the Omise dashboard, open the test charge and mark it successful or failed.
- Refresh the TutorTrack payment status page.

Verify PromptPay gateway work with:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Project Structure

- `app/` routes, pages, layouts, and route-level UI states.
- `components/` reusable UI components, including shadcn/ui components.
- `lib/` shared utilities, environment validation, and database client setup.
- `services/` business logic modules, added in later phases.
- `prisma/` Prisma schema, migrations, and seed data.
- `types/` shared TypeScript types.
- `tests/` Vitest tests.

## Security Hardening and Production Readiness

Phase 15 focuses on correctness, authorization, validation, and repeatable verification. It does not add AI recommendations, PDF export, notification workflows, or large UI redesigns. Payment gateway support is added separately in Phase 18.

Current completed MVP modules:

- Auth, signed HttpOnly sessions, role dashboards, and server-side guards.
- Public marketplace pages for approved tutors and published courses.
- Tutor/admin course management.
- Enrollment with capacity and duplicate checks.
- Sessions and attendance for active enrollments.
- Assignments, submissions, and tutor grading.
- Assessments and skill progress.
- Deterministic progress report engine and protected progress report UI.
- Manual payment submission, parent payment flow, tutor limited payment visibility, admin verification, and Omise/Opn PromptPay gateway payments.

Security model:

- Public users can access only the homepage, approved tutor pages, published course pages, login, and register.
- Admins can access all platform data and management pages.
- Tutors can access only their own courses and students with ACTIVE enrollment in those courses.
- Students can access only their own learning records.
- Parents can access only children linked through active `ParentStudentLink` records.
- Dashboard routes use server-side guards. Client-side UI hiding is not treated as authorization.
- Protected mutations validate input with Zod and enforce permission checks server-side.
- Public marketplace queries select only public tutor/course fields and never include student, parent, enrollment, payment, submission, score, or progress data.

Production-readiness checklist before a real deployment:

- Set a strong production `AUTH_SECRET`.
- Keep `ALLOW_DEMO_PASSWORD_LOGIN` unset or `false`.
- Use a managed PostgreSQL database and set `DATABASE_URL` securely in the hosting provider.
- Run `npm run db:migrate` before first production use.
- Review seed data before deploying; demo accounts are for development/demo only.
- Add real monitoring and backup policy for PostgreSQL before storing real student data.
- Configure HTTPS-only hosting and avoid logging passwords, tokens, or private student records.

Verification commands:

```bash
npm run typecheck
npm run lint
npm run test
npm audit --audit-level=high
npx prisma validate
npm run build
```

GitHub Actions CI runs the same core checks on pull requests and pushes to `main`/`master`.

## Phase 15 Scope

This phase hardens auth, dependency security, generated-file hygiene, CI checks, validation consistency, and critical permission/test coverage. Remaining product work should be added in focused future phases with server-side authorization and tests.
