import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LEVEL_OPTIONS } from "@/services/marketplace-utils";
import { courseSortOptions, type CourseFilters } from "@/services/course.service";
import type { PublicSubject } from "@/types/marketplace";

type CourseFiltersProps = {
  filters: CourseFilters;
  subjects: PublicSubject[];
};

const sortLabels: Record<(typeof courseSortOptions)[number], string> = {
  newest: "ใหม่ล่าสุด",
  "price-asc": "ราคาต่ำไปสูง",
  "price-desc": "ราคาสูงไปต่ำ",
};

export function CourseFilters({ filters, subjects }: CourseFiltersProps) {
  return (
    <form action="/courses" className="tt-filter-panel" method="get">
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
              placeholder="ชื่อคอร์ส วิชา หรือครู"
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
          <label className="tt-label" htmlFor="type">
            รูปแบบคอร์ส
          </label>
          <select
            className="tt-input"
            defaultValue={filters.type ?? ""}
            id="type"
            name="type"
          >
            <option value="">ทุกแบบ</option>
            <option value="PRIVATE">Private</option>
            <option value="GROUP">Group</option>
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
            placeholder="บาท"
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
            placeholder="บาท"
            type="number"
          />
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
            {courseSortOptions.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href="/courses">ล้างตัวกรอง</Link>
        </Button>
        <Button type="submit">ค้นหาคอร์ส</Button>
      </div>
    </form>
  );
}
