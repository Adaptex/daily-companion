import { SKILLS } from "@/data/skills";
import { pickByDay } from "@/lib/daily";
import { Feedback } from "@/components/Feedback";

const CATEGORY_META: Record<string, { tint: string; icon: string }> = {
  Productivity: { tint: "bg-[#e8f0e0] text-[#3a5c2a] border-[#c8ddb8]", icon: "⚡" },
  Communication: { tint: "bg-[#e0e8f0] text-[#2a3c5c] border-[#b8c8dd]", icon: "💬" },
  Finance:       { tint: "bg-[#e0f0e8] text-[#2a5c44] border-[#b8ddc8]", icon: "₿" },
  Health:        { tint: "bg-[#f0e8e0] text-[#5c3a2a] border-[#ddc8b8]", icon: "❤" },
  Learning:      { tint: "bg-[#ede0f0] text-[#4a2a5c] border-[#d0b8dd]", icon: "📖" },
  Career:        { tint: "bg-[#f0f0e0] text-[#5c5a2a] border-[#dddbB8]", icon: "🎯" },
  Creativity:    { tint: "bg-[#f0e0e8] text-[#5c2a3c] border-[#ddb8c8]", icon: "✦" },
  Tech:          { tint: "bg-[#e0edf0] text-[#2a4a5c] border-[#b8cedd]", icon: "⌨" },
  Mindset:       { tint: "bg-[#e8e0f0] text-[#3a2a5c] border-[#c8b8dd]", icon: "◎" },
};

export function SkillCard() {
  const skill = pickByDay(SKILLS);
  const meta = CATEGORY_META[skill.category] ?? {
    tint: "bg-paper-deep text-ink-soft border-rule",
    icon: "★",
  };

  return (
    <section className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-rule bg-card/80 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      {/* Decorative icon watermark */}
      <span className="pointer-events-none select-none absolute right-4 top-2 font-display text-[96px] leading-none text-ink/[0.035] transition-transform duration-500 group-hover:scale-110">
        {meta.icon}
      </span>

      <div className="relative z-10 flex flex-1 flex-col p-6">
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
          <span className={`rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tint}`}>
            {skill.category}
          </span>
        </header>

        <h3 className="font-display text-[20px] leading-snug tracking-tight text-ink">
          {skill.title}
        </h3>

        <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-soft">
          {skill.body}
        </p>

        {/* Try It — styled as an action prompt */}
        <div className="mt-4 rounded-xl border-l-[3px] border-accent bg-paper-deep/70 px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent">
            Try it today
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-ink">
            {skill.tip}
          </p>
        </div>

        <footer className="mt-4 flex items-center justify-between border-t border-rule pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
            5 min · {skill.category}
          </span>
          <Feedback id={`skill:${skill.title}`} />
        </footer>
      </div>
    </section>
  );
}
