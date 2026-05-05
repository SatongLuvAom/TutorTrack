# TutorTrack

TutorTrack is a tutor marketplace and student progress tracking platform. This repository is currently at Phase 7: enrollment foundation.

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

The `Course` schema includes `level`, `capacity` for max students, and `totalSessions` for planned sessions. Lesson session scheduling, assignments, payments, and progress reports are intentionally left for later phases.

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

## Project Structure

- `app/` routes, pages, layouts, and route-level UI states.
- `components/` reusable UI components, including shadcn/ui components.
- `lib/` shared utilities, environment validation, and database client setup.
- `services/` business logic modules, added in later phases.
- `prisma/` Prisma schema, migrations, and seed data.
- `types/` shared TypeScript types.
- `tests/` Vitest tests.

## Phase 7 Scope

This phase implements enrollment only. Payment gateway processing, lesson session scheduling, attendance, assignments, AI features, and progress reports should be added in later phases with server-side authorization and tests.
