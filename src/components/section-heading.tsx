import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionHeadingProps = {
  headingId: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  sideNote?: string;
};

export function SectionHeading({
  headingId,
  icon: Icon,
  kicker,
  title,
  description,
  sideNote,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow section-kicker">
          <span className="section-heading-icon" aria-hidden="true">
            <Icon size={15} strokeWidth={1.9} />
          </span>
          <span>{kicker}</span>
        </p>
        <h2 className="section-title" id={headingId}>
          {title}
        </h2>
        <p className="section-description">{description}</p>
      </div>
      {sideNote ? (
        <p className="section-side-note">
          <Sparkles size={14} aria-hidden="true" />
          {sideNote}
        </p>
      ) : null}
    </div>
  );
}
