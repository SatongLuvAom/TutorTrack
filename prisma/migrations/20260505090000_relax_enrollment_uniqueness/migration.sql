DROP INDEX IF EXISTS "Enrollment_studentId_courseId_key";

CREATE INDEX IF NOT EXISTS "Enrollment_studentId_courseId_idx" ON "Enrollment"("studentId", "courseId");
