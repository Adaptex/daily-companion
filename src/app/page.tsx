const cards = [
  { title: "World & AI", hint: "Top stories curated for you" },
  { title: "Sports", hint: "Cricket & football highlights" },
  { title: "Card Offers", hint: "NDB, Commercial Bank — today" },
  { title: "Skill of the Day", hint: "5 minutes to learn something new" },
  { title: "Workout", hint: "Home, no equipment, fits your day" },
  { title: "Talk to Companion", hint: "Ask anything, plan your day" },
];

export default function Home() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-widest text-neutral-500">
          {today} — Colombo
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Good morning.
        </h1>
        <p className="mt-2 text-neutral-400">
          Here&apos;s what matters today. Cards will fill in as we wire each one
          up.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-neutral-700"
          >
            <h2 className="text-lg font-medium">{card.title}</h2>
            <p className="mt-1 text-sm text-neutral-400">{card.hint}</p>
            <div className="mt-6 h-24 rounded-lg border border-dashed border-neutral-800 grid place-items-center text-xs text-neutral-600">
              coming next
            </div>
          </article>
        ))}
      </section>

      <footer className="mt-12 text-xs text-neutral-600">
        v0.1 · scaffold only · model backend not yet connected
      </footer>
    </main>
  );
}
