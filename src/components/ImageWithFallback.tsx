"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt?: string;
  imgClassName?: string;
  containerClassName?: string;
  minWidth?: number;
  minHeight?: number;
  withGradient?: boolean;
  loading?: "eager" | "lazy";
}

export function ImageWithFallback({
  src,
  alt = "",
  imgClassName,
  containerClassName,
  minWidth = 800,
  minHeight = 450,
  withGradient = false,
  loading = "lazy",
}: Props) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={imgClassName}
        onError={() => setHidden(true)}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
            setHidden(true);
          }
        }}
      />
      {withGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
      )}
    </div>
  );
}
