import Image from "next/image";
import { EMPTY_STATE_IMAGE } from "@/components/visual/image-utils";

type EmptyStateIllustrationProps = {
  alt?: string;
  className?: string;
};

export function EmptyStateIllustration({
  alt = "ภาพประกอบสถานะไม่มีข้อมูล",
  className,
}: EmptyStateIllustrationProps) {
  return (
    <Image
      alt={alt}
      className={className}
      height={420}
      src={EMPTY_STATE_IMAGE}
      width={560}
    />
  );
}
