import { SKILLS } from "@/data/skills";
import { pickByDay } from "@/lib/daily";
import { Feedback } from "@/components/Feedback";

const CATEGORY_TINT: Record<string, string> = {
  Productivity: "bg-[#e8f0e0] text-[#3a5c2a]",
  Communication: "bg-[#e0e8f0] text-[#2a3c5c]",
  Finance: "bg-[#e0f0e8] text-[#2a5c44]",
  Health: "bg-[#f0e8e0] text-[#5c3a2a]",
  Learning: "bg-[#ede0f0] text-[#4a2a5c]",
  Career: "bg-[#f0f0e0] text-[#5c5a2a]",
  Creativity: "bg-[#f0e0e8] text-[#5c2a3c]",
  Tech: "bg-[#e0edf0] text-[#2a4a5c]",
  Mindset: "bg-[#e8e0f0] text-[#3a2a5c]",
};

export function SkillCard() {
  const skill = pickByDay(SKILLS);
  const tint = CATEGORY_TINT[skill.category] ?? "bg-paper-deep text-ink-soft";

  return (
    <section className="group relative flex h-full flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Section E
            </span>
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            Skill of the Day
          </h2>
        </div>
        <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tint}`}>
          {skill.category}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        <h3 className="font-display text-[20px] leading-snug tracking-tight text-ink">
          {skill.title}
        </h3>

        <p className="text-[13.5px] leading-relaxed text-ink-soft">
          {skill.body}
        </p>

        <div className="mt-auto rounded-lg border border-rule-soft bg-paper-deep/60 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
            Try it
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">
            {skill.tip}
          </p>
        </div>
      </div>

      <footer className="mt-4 flex items-center justify-between border-t border-rule pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          5 min read
        </span>
        <Feedback id={`skill:${skill.title}`} />
      </footer>
    </section>
  );
}
