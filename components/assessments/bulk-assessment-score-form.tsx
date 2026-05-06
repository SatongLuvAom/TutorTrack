import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TutorAssessmentDetail } from "@/services/assessment.service";

type ScoreAction = (formData: FormData) => Promise<void>;

type BulkAssessmentScoreFormProps = {
  action: ScoreAction;
  assessment: TutorAssessmentDetail;
};

function scoreValue(score: number | null | undefined): string {
  return score === null || score === undefined ? "" : String(score);
}

export function BulkAssessmentScoreForm({
  action,
  assessment,
}: BulkAssessmentScoreFormProps) {
  return (
    <form action={action} className="tt-card overflow-hidden">
      <input name="assessmentId" type="hidden" value={assessment.id} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Percentage</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessment.roster.map((row) => (
              <tr className="align-top hover:bg-secondary/35" key={row.student.id}>
                <td className="px-4 py-4">
                  <input name="studentId" type="hidden" value={row.student.id} />
                  <p className="font-semibold">
                    {row.student.displayName ?? row.student.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {row.student.email}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <input
                    className="tt-input w-28"
                    defaultValue={scoreValue(row.assessment?.score)}
                    max={assessment.maxScore}
                    min={0}
                    name={`score:${row.student.id}`}
                    step="0.01"
                    type="number"
                  />
                </td>
                <td className="px-4 py-4">
                  {row.assessment?.percentage === null ||
                  row.assessment?.percentage === undefined
                    ? "-"
                    : `${row.assessment.percentage}%`}
                </td>
                <td className="px-4 py-4">
                  <input
                    className="tt-input"
                    defaultValue={row.assessment?.note ?? ""}
                    maxLength={2000}
                    name={`note:${row.student.id}`}
                    placeholder="Optional note"
                  />
                </td>
                <td className="px-4 py-4">
                  {row.assessment
                    ? new Intl.DateTimeFormat("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(row.assessment.updatedAt)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t border-border p-4">
        <Button type="submit">
          <Save aria-hidden="true" />
          Save scores
        </Button>
      </div>
    </form>
  );
}
