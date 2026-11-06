"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Book cover, 2 : 3 (US-19 M1). The cover is a link to an image on the Internet (US-05 AC3), so it can be missing
 * or break later: E1 shows a placeholder when there is no link or the image fails to load.
 * A plain <img> is used on purpose: covers come from any host, and next/image would need every host listed.
 */
export function BookCover({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // The server-rendered <img> can fail before React is ready to hear `onError`: check once after mounting.
  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) setFailed(true);
  }, [src]);

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-line">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- external cover links from any host (see above)
        <img
          ref={imageRef}
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <CoverPlaceholder />
      )}
    </div>
  );
}

/** E1: neutral placeholder – a book icon and "No cover", in the style guide colours. */
export function CoverPlaceholder() {
  return (
    <div role="img" aria-label="No cover image" className="flex h-full w-full flex-col items-center justify-center gap-2 bg-line text-muted">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
        <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
        <path d="M9 7h7" strokeLinecap="round" />
      </svg>
      <span className="text-xs font-medium">No cover</span>
    </div>
  );
}
