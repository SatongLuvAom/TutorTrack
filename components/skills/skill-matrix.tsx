import { SkillLevelBadge } from "@/components/skills/skill-level-badge";
import type { SkillProgressMatrixItem } from "@/services/skill-progress.service";

type SkillMatrixProps = {
  rows: SkillProgressMatrixItem[];
  showStudent?: boolean;
};

function formatDate(value: Date | undefined): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function SkillMatrix({ rows, showStudent = false }: SkillMatrixProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              {showStudent ? (
                <th className="px-4 py-3 font-medium">Student</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Skill</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                className="align-top transition-colors hover:bg-secondary/35"
                key={`${row.student.id}:${row.skill.id}`}
              >
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
                  <p className="font-semibold">{row.skill.name}</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    {row.skill.description ?? "-"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{row.skill.course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.skill.course.subject.name}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <SkillLevelBadge level={row.progress?.level} />
                </td>
                <td className="px-4 py-4">{row.progress?.score ?? "-"}</td>
                <td className="px-4 py-4">
                  <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                    {row.progress?.note ?? "-"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {formatDate(row.progress?.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
