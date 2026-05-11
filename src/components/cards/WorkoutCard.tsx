import { WORKOUTS } from "@/data/workouts";
import { pickByDay } from "@/lib/daily";
import { Feedback } from "@/components/Feedback";

const FOCUS_TINT: Record<string, string> = {
  "Full Body": "bg-[#fde4d3] text-[#7c2d12]",
  "Upper Body": "bg-[#dbe7d6] text-[#3b5b34]",
  Core: "bg-[#e6dcef] text-[#4a2c5a]",
  "Lower Body": "bg-[#e0dccd] text-[#5a4f2c]",
  Cardio: "bg-[#dce6f0] text-[#2a3c5c]",
  Mobility: "bg-[#e0f0e8] text-[#2a5c44]",
};

export function WorkoutCard() {
  const workout = pickByDay(WORKOUTS);
  const tint = FOCUS_TINT[workout.focus] ?? "bg-paper-deep text-ink-soft";

  return (
    <section className="group relative flex h-full flex-col rounded-2xl border border-rule bg-card/80 p-6 backdrop-blur-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(27,24,21,0.15)]">
      <header className="mb-4 flex items-baseline justify-between border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 rounded-full bg-accent/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              Section F
            </span>
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-tight tracking-tight text-ink">
            Workout
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tint}`}>
            {workout.focus}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            30 min
          </span>
        </div>
      </header>

      <h3 className="mb-3 font-display text-[18px] leading-snug tracking-tight text-ink">
        {workout.title}
      </h3>

      <ul className="flex flex-1 flex-col gap-1.5">
        {workout.exercises.map((ex, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 transition hover:bg-paper-deep/40"
          >
            <span className="text-[13px] text-ink">{ex.name}</span>
            <span className="flex-none font-mono text-[11px] text-ink-faint">
              {ex.sets > 1 ? `${ex.sets} × ` : ""}{ex.reps}
            </span>
          </li>
        ))}
      </ul>

      {workout.note && (
        <p className="mt-3 rounded-lg border border-rule-soft bg-paper-deep/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          {workout.note}
        </p>
      )}

      <footer className="mt-4 flex items-center justify-between border-t border-rule pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          no equipment · home
        </span>
        <Feedback id={`workout:${workout.title}`} />
      </footer>
    </section>
  );
}
