import { SearchEmptyState } from "@/components/marketplace/search-empty-state";
import { TutorCard } from "@/components/tutors/tutor-card";
import { TutorFilters } from "@/components/tutors/tutor-filters";
import { getSubjectOptions } from "@/services/course.service";
import { listPublicTutors, parseTutorFilters } from "@/services/tutor.service";

export const dynamic = "force-dynamic";

type TutorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorsPage({ searchParams }: TutorsPageProps) {
  const params = searchParams ? await searchParams : {};
  const filters = parseTutorFilters(params);
  const [subjects, tutors] = await Promise.all([
    getSubjectOptions(),
    listPublicTutors(filters),
  ]);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-12">
          <p className="tt-kicker">Public tutors</p>
          <h1 className="tt-heading mt-2 max-w-3xl text-4xl leading-[1.2]">
            ค้นหาติวเตอร์ที่สอนเข้าใจและเหมาะกับเรา
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
            เลือกดูเฉพาะติวเตอร์ที่ผ่านการอนุมัติ เปรียบเทียบวิชา ระดับ ราคา รีวิว และแนวการสอนได้จากหน้าเดียว
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <TutorFilters filters={filters} subjects={subjects} />

        <div className="mt-8">
          {tutors.length === 0 ? (
            <SearchEmptyState
              description="ลองเปลี่ยนคำค้นหา วิชา ช่วงราคา หรือคะแนนขั้นต่ำเพื่อดูติวเตอร์ที่เหมาะกับเป้าหมายของผู้เรียน"
              resetHref="/tutors"
              title="ไม่พบติวเตอร์ที่ตรงกับตัวกรอง"
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
