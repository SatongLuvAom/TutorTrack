ALTER TABLE "Course" ADD COLUMN "level" TEXT NOT NULL DEFAULT 'all-levels';
ALTER TABLE "Course" ADD COLUMN "totalSessions" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "Course_level_idx" ON "Course"("level");
