import Image from "next/image";
import { HERO_LEARNING_IMAGE } from "@/components/visual/image-utils";

type HeroIllustrationProps = {
  alt?: string;
};

export function HeroIllustration({
  alt = "ภาพประกอบนักเรียนกำลังเรียนกับติวเตอร์",
}: HeroIllustrationProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/60 bg-white/70 p-3 shadow-xl shadow-sky-950/10">
      <Image
        alt={alt}
        className="h-auto w-full rounded-lg object-cover"
        height={720}
        priority
        src={HERO_LEARNING_IMAGE}
        width={960}
      />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 grid gap-2 rounded-lg border border-white/70 bg-white/88 p-4 shadow-sm backdrop-blur sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Progress</p>
          <p className="text-xl font-semibold text-primary">82%</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Homework</p>
          <p className="text-xl font-semibold text-emerald-700">ครบ</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Next class</p>
          <p className="text-xl font-semibold text-amber-700">วันนี้</p>
        </div>
      </div>
    </div>
  );
}
