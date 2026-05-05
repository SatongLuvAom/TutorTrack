import { CourseCard } from "@/components/courses/course-card";
import { CourseFilters } from "@/components/courses/course-filters";
import { SearchEmptyState } from "@/components/marketplace/search-empty-state";
import {
  getSubjectOptions,
  listPublicCourses,
  parseCourseFilters,
} from "@/services/course.service";

export const dynamic = "force-dynamic";

type CoursesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = parseCourseFilters(params);
  const [subjects, courses] = await Promise.all([
    getSubjectOptions(),
    listPublicCourses(filters),
  ]);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-12">
          <p className="tt-kicker">Public courses</p>
          <h1 className="tt-heading mt-2 max-w-3xl text-4xl leading-[1.2]">
            ค้นหาคอร์สที่เข้ากับเป้าหมายการเรียน
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
            ดูเฉพาะคอร์สที่เผยแพร่แล้วจากติวเตอร์ที่ผ่านการอนุมัติ เลือกตามวิชา ระดับ ราคา และรูปแบบเรียนได้ทันที
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <CourseFilters filters={filters} subjects={subjects} />

        <div className="mt-8">
          {courses.length === 0 ? (
            <SearchEmptyState
              description="ลองเปลี่ยนคำค้นหา วิชา ระดับ รูปแบบคอร์ส หรือช่วงราคาเพื่อดูคอร์สที่พร้อมสมัคร"
              resetHref="/courses"
              title="ไม่พบคอร์สที่ตรงกับตัวกรอง"
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
