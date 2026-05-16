import { SearchEmptyState } from "@/components/marketplace/search-empty-state";
import { StatusBadge } from "@/components/marketplace/status-badge";
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
      <section className="border-b border-border bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="tt-shell py-12">
          <StatusBadge tone="accent">Approved tutors only</StatusBadge>
          <h1 className="tt-heading mt-3 max-w-3xl text-4xl leading-[1.2]">
            ค้นหาติวเตอร์ที่สอนเข้าใจและเหมาะกับเป้าหมายของเรา
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
            เปรียบเทียบวิชา ระดับ ราคา รีวิว และแนวการสอนได้จากการ์ดเดียว
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <TutorFilters filters={filters} subjects={subjects} />

        <div className="mt-8">
          {tutors.length === 0 ? (
            <SearchEmptyState
              description="ลองเปลี่ยนคำค้นหา วิชา ช่วงราคา หรือคะแนนขั้นต่ำเพื่อดูติวเตอร์ที่เหมาะกับเป้าหมาย"
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
