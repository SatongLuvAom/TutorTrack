import { Save } from "lucide-react";
import { SkillLevel } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { SkillLevelBadge } from "@/components/skills/skill-level-badge";
import type { SkillProgressMatrixItem } from "@/services/skill-progress.service";

type SkillProgressAction = (formData: FormData) => Promise<void>;

type BulkSkillProgressFormProps = {
  action: SkillProgressAction;
  courseId: string;
  rows: SkillProgressMatrixItem[];
  showStudent?: boolean;
};

const levelOptions: Array<{ value: SkillLevel; label: string }> = [
  { value: SkillLevel.NEEDS_WORK, label: "Needs work" },
  { value: SkillLevel.BASIC, label: "Basic" },
  { value: SkillLevel.GOOD, label: "Good" },
  { value: SkillLevel.EXCELLENT, label: "Excellent" },
];

export function BulkSkillProgressForm({
  action,
  courseId,
  rows,
  showStudent = false,
}: BulkSkillProgressFormProps) {
  return (
    <form action={action} className="tt-card overflow-hidden">
      <input name="courseId" type="hidden" value={courseId} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              {showStudent ? (
                <th className="px-4 py-3 font-medium">Student</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">Current</th>
              <th className="px-4 py-3 font-medium">New level</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const key = `${row.student.id}:${row.skill.id}`;

              return (
                <tr className="align-top hover:bg-secondary/35" key={key}>
                  {showStudent ? (
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {row.student.displayName ?? row.student.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {row.student.email}
                      </p>
                    </td>
                  ) : null}
                  <td className="px-4 py-4">
                    <input name="recordKey" type="hidden" value={key} />
                    <input
                      name={`studentId:${key}`}
                      type="hidden"
                      value={row.student.id}
                    />
                    <input
                      name={`skillId:${key}`}
                      type="hidden"
                      value={row.skill.id}
                    />
                    <p className="font-semibold">{row.skill.name}</p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                      {row.skill.description ?? row.skill.course.title}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <SkillLevelBadge level={row.progress?.level} />
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="tt-input min-w-44"
                      defaultValue={row.progress?.level ?? SkillLevel.BASIC}
                      name={`level:${key}`}
                    >
                      {levelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      className="tt-input"
                      defaultValue={row.progress?.note ?? ""}
                      maxLength={2000}
                      name={`note:${key}`}
                      placeholder="Optional note"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-border p-4">
        <Button type="submit">
          <Save aria-hidden="true" />
          Save skill progress
        </Button>
      </div>
    </form>
  );
}
