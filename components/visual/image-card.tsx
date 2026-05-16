import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ImageCardProps = {
  src: string;
  alt: string;
  children: ReactNode;
  className?: string;
  imageClassName?: string;
};

export function ImageCard({
  src,
  alt,
  children,
  className,
  imageClassName,
}: ImageCardProps) {
  return (
    <article className={cn("tt-card tt-card-hover overflow-hidden", className)}>
      <Image
        alt={alt}
        className={cn("aspect-[16/10] w-full object-cover", imageClassName)}
        height={520}
        src={src}
        width={800}
      />
      <div className="p-5">{children}</div>
    </article>
  );
}
