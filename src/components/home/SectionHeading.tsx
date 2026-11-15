import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { sectionTitle } from "@/components/layout/styles";

/** Heading of a home page section: small label, serif title and an optional "see all" link on the right. */
export function SectionHeading({ id, eyebrow, title, href, linkLabel }: { id: string; eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className={`mt-2 ${sectionTitle}`}>
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          {linkLabel}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}
    </Reveal>
  );
}
