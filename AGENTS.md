# AGENTS.md

## Project Overview

This project is TutorTrack, a tutor marketplace and student progress tracking platform.

The platform has four roles:

- ADMIN
- TUTOR
- STUDENT
- PARENT

Core modules:

- Authentication
- Role-based dashboards
- Tutor marketplace
- Course management
- Enrollment
- Lesson sessions
- Attendance
- Assignments and submissions
- Assessments
- Student skill progress
- Progress reports
- Manual payments
- Admin dashboard

## Tech Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Zod
- Vitest
- Playwright only where useful

## Project Structure

Use this structure:

- `app/` for routes, pages, layouts, and API routes
- `components/` for reusable UI components
- `lib/` for shared utilities, auth, permissions, database client, and validators
- `services/` for business logic
- `prisma/` for schema, migrations, and seed data
- `types/` for shared TypeScript types
- `tests/` for unit and e2e tests

## Coding Rules

- Use TypeScript strictly.
- Do not use `any` unless there is no better option.
- Keep business logic out of React components.
- Put business logic in `services/`.
- Put permission checks in `lib/permissions.ts`.
- Put validation schemas in Zod files.
- Use server-side authorization for all protected actions.
- Do not rely only on client-side UI hiding for security.
- Prefer clear and maintainable code over clever code.
- Do not add unnecessary dependencies.
- Do not change the product scope without documenting it.

## Security Rules

This app stores student data, learning records, scores, and parent information.

Follow these rules:

- ADMIN can access all data.
- TUTOR can only access their own courses and students enrolled in their own courses.
- STUDENT can only access their own records.
- PARENT can only access records of linked children.
- Public users can only view public tutor and course pages.
- Never expose one student's progress data to another user.
- Never log secrets, tokens, passwords, or private student data.
- All protected mutations must check permissions on the server.

## Database Rules

Use Prisma.

Main models:

- User
- StudentProfile
- ParentProfile
- TutorProfile
- Subject
- Course
- Enrollment
- LessonSession
- Attendance
- Assignment
- Submission
- Assessment
- Skill
- StudentSkillProgress
- ProgressNote
- Review
- Payment

Rules:

- Use enums for roles and statuses.
- Add indexes for common foreign keys.
- Add timestamps.
- Avoid destructive deletes for learning history.
- Prefer status fields over hard deletion when records matter historically.

## Progress Report Rules

Progress report must be deterministic.

Use this formula:

- Attendance: 20%
- Homework completion: 25%
- Assessment average: 35%
- Skill progress: 15%
- Tutor behavior score placeholder: 5%

Skill level mapping:

- NEEDS_WORK = 25
- BASIC = 50
- GOOD = 75
- EXCELLENT = 100

The progress report should return:

- overall progress score
- attendance rate
- homework completion rate
- assessment average
- skill average
- skill matrix
- strengths
- weaknesses
- latest tutor note
- recommended next steps

If there is not enough data, show a clear empty state instead of fabricating data.

## UI Rules

Use a clean SaaS dashboard style.

Every important page should have:

- loading state
- empty state
- error state where applicable
- responsive layout
- readable tables
- clear status badges

Important pages:

- `/`
- `/tutors`
- `/tutors/[tutorId]`
- `/courses`
- `/courses/[courseId]`
- `/dashboard/student`
- `/dashboard/parent`
- `/dashboard/tutor`
- `/dashboard/admin`

## Testing Rules

Add tests for:

- permission helpers
- progress score calculation
- enrollment access rules
- assignment submission rules
- role-based dashboard redirects

## Commands

Use these commands when relevant:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:migrate
npm run db:seed
```
