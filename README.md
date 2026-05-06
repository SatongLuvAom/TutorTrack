# TutorTrack

TutorTrack is a tutor marketplace and student progress tracking platform. This repository is currently at Phase 11: deterministic progress report engine.

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

Add payment or other service secrets only when those modules are implemented.

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

All demo accounts can sign in with password `TutorTrackDemo123!`. The Phase 4 auth layer accepts the legacy seed hash `placeholder-password-hash-auth-phase` only for `@tutortrack.test` demo accounts. New registered users are stored with scrypt password hashes.

## Authentication and Roles

Phase 4 uses a custom email/password auth foundation:

- Passwords are verified server-side and new accounts are hashed with Node `crypto.scrypt`.
- Sessions are signed HttpOnly cookies named `tutortrack_session`.
- Auth POST routes require same-origin `Origin` or `Referer` headers.
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
- Enrollment is implemented for students and linked parents. Payment gateway processing is not implemented yet.

The schema now stores course `level` for management and marketplace filters. Tutor `education` and `teachingStyle` are still summarized from public tutor headline/bio until dedicated profile fields are added in a later phase.

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

The `Course` schema includes `level`, `capacity` for max students, and `totalSessions` for planned sessions. Lesson session scheduling and attendance are implemented in Phase 8. Assignments, payment gateway processing, and progress reports are intentionally left for later phases.

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

Payment remains manual-data only from the seed. Payment gateway collection and payment verification flows are intentionally not implemented in Phase 7.

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

Phase 8 still does not implement assignments, submissions, assessments, progress reports, or payment gateway processing.

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

Phase 9 still does not implement deterministic progress reports, AI features, or payment gateway processing.

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

Phase 10 still does not implement the final progress report engine/UI, AI features, payment gateway processing, or a separate assessment-template schema.

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

- Admins can view all progress reports and notes.
- Tutors can view progress and create notes only for ACTIVE enrolled students in their own courses.
- Students can view only their own active-course progress.
- Parents can view only active linked children through `ParentStudentLink`.
- Public users cannot access progress report or progress note APIs.

Phase 11 intentionally does not implement polished report UI, PDF export, AI recommendations, or payment gateway processing.

Verify progress reports with:

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

## Phase 11 Scope

This phase implements the deterministic progress report engine, progress note service, protected progress APIs, and tests. Polished progress report UI, PDF export, AI recommendations, and payment gateway processing should be added in later phases with server-side authorization and tests.
