import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LEVEL_OPTIONS } from "@/services/marketplace-utils";
import { tutorSortOptions, type TutorFilters } from "@/services/tutor.service";
import type { PublicSubject } from "@/types/marketplace";

type TutorFiltersProps = {
  filters: TutorFilters;
  subjects: PublicSubject[];
};

const sortLabels: Record<(typeof tutorSortOptions)[number], string> = {
  recommended: "แนะนำ",
  rating: "คะแนนรีวิว",
  "price-asc": "ราคาต่ำไปสูง",
  "price-desc": "ราคาสูงไปต่ำ",
  experience: "ประสบการณ์",
};

export function TutorFilters({ filters, subjects }: TutorFiltersProps) {
  return (
    <form
      action="/tutors"
      className="tt-filter-panel"
      method="get"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <label className="tt-label" htmlFor="search">
            ค้นหา
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
            />
            <input
              className="tt-input pl-9"
              defaultValue={filters.search}
              id="search"
              name="search"
              placeholder="ชื่อครู วิชา หรือแนวการสอน"
              type="search"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="subject">
            วิชา
          </label>
          <select
            className="tt-input"
            defaultValue={filters.subject ?? ""}
            id="subject"
            name="subject"
          >
            <option value="">ทุกวิชา</option>
            {subjects.map((subject) => (
              <option key={subject.slug} value={subject.slug}>
                {subject.name}
                {typeof subject.courseCount === "number"
                  ? ` (${subject.courseCount})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="level">
            ระดับ
          </label>
          <select
            className="tt-input"
            defaultValue={filters.level ?? ""}
            id="level"
            name="level"
          >
            <option value="">ทุกระดับ</option>
            {MARKETPLACE_LEVEL_OPTIONS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="minPrice">
            ราคาต่ำสุด
          </label>
          <input
            className="tt-input"
            defaultValue={filters.minPrice}
            id="minPrice"
            min={0}
            name="minPrice"
            placeholder="บาท/ชม."
            type="number"
          />
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="maxPrice">
            ราคาสูงสุด
          </label>
          <input
            className="tt-input"
            defaultValue={filters.maxPrice}
            id="maxPrice"
            min={0}
            name="maxPrice"
            placeholder="บาท/ชม."
            type="number"
          />
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="rating">
            คะแนนขั้นต่ำ
          </label>
          <select
            className="tt-input"
            defaultValue={filters.rating ?? ""}
            id="rating"
            name="rating"
          >
            <option value="">ทุกคะแนน</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="5">5.0</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="sort">
            เรียงตาม
          </label>
          <select
            className="tt-input"
            defaultValue={filters.sort}
            id="sort"
            name="sort"
          >
            {tutorSortOptions.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href="/tutors">ล้างตัวกรอง</Link>
        </Button>
        <Button type="submit">ค้นหาติวเตอร์</Button>
      </div>
    </form>
  );
}
