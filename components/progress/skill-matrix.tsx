import type { SkillMatrixItem } from "@/services/progress.service";
import { SkillLevelBadge } from "@/components/skills/skill-level-badge";
import {
  formatProgressDate,
  getSkillLevelLabel,
} from "./progress-utils";

type SkillMatrixProps = {
  skills: SkillMatrixItem[];
};

export function SkillMatrix({ skills }: SkillMatrixProps) {
  if (skills.length === 0) {
    return (
      <section className="tt-card p-5">
        <p className="tt-kicker">Skill matrix</p>
        <h2 className="tt-heading mt-1 text-xl">No skill data yet</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Skill progress will appear after a tutor records skill levels.
        </p>
      </section>
    );
  }

  return (
    <section className="tt-card overflow-hidden">
      <div className="border-b border-border p-5">
        <p className="tt-kicker">Skill matrix</p>
        <h2 className="tt-heading mt-1 text-xl">Tracked skills</h2>
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {skills.map((skill) => (
          <article className="rounded-lg border border-border bg-card p-4" key={skill.skillId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{skill.skillName}</h3>
                {skill.skillDescription ? (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {skill.skillDescription}
                  </p>
                ) : null}
              </div>
              <SkillLevelBadge level={skill.level} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-muted-foreground">Score</p>
                <p className="mt-1 font-semibold">{skill.score}</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-muted-foreground">Updated</p>
                <p className="mt-1 font-semibold">
                  {formatProgressDate(skill.updatedAt)}
                </p>
              </div>
            </div>
            {skill.note ? (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm leading-6 text-muted-foreground">
                {skill.note}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Skill</th>
              <th className="px-5 py-3">Level</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Tutor note</th>
              <th className="px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {skills.map((skill) => (
              <tr key={skill.skillId}>
                <td className="px-5 py-4">
                  <div className="font-semibold text-foreground">
                    {skill.skillName}
                  </div>
                  {skill.skillDescription ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {skill.skillDescription}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <SkillLevelBadge level={skill.level} />
                  <span className="sr-only">
                    {getSkillLevelLabel(skill.level)}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold">{skill.score}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {skill.note ?? "-"}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {formatProgressDate(skill.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
