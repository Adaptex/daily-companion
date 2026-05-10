export type Skill = {
  title: string;
  category: string;
  body: string;
  tip: string;
};

export const SKILLS: Skill[] = [
  // Productivity
  {
    title: "The Two-Minute Rule",
    category: "Productivity",
    body: "If a task takes less than two minutes, do it immediately rather than adding it to a list. Developed by David Allen in Getting Things Done, the rule works because the overhead of tracking a small task often exceeds the effort of doing it.",
    tip: "Set a physical timer for 2 minutes on your next small task to feel the rhythm.",
  },
  {
    title: "Time Blocking",
    category: "Productivity",
    body: "Schedule your day in fixed blocks rather than an open to-do list. Assign every hour to a specific activity — deep work, email, breaks — and treat blocks as meetings you can't cancel. This reduces decision fatigue and stops reactive work from consuming focus time.",
    tip: "Block tomorrow morning's first 90 minutes tonight, before you open email.",
  },
  {
    title: "The Weekly Review",
    category: "Productivity",
    body: "Once a week, spend 30 minutes reviewing your projects, commitments, and calendar. GTD creator David Allen called it the critical success factor of the system — without it, any productivity method decays within days.",
    tip: "Block Friday afternoon before the week fills up.",
  },
  {
    title: "Eat the Frog",
    category: "Productivity",
    body: "Tackle your most dreaded or most important task first thing in the morning, before checking email or messages. Once the hardest thing is done, everything else feels lighter and the day's momentum is already positive.",
    tip: "Identify your 'frog' the night before — don't let the morning decide.",
  },
  {
    title: "Single-Tasking",
    category: "Productivity",
    body: "The brain cannot truly multitask — it context-switches, losing 20–40% of productive time to the switching cost. Single-tasking means giving one task your full attention until it's done. Studies consistently show better output in less total time.",
    tip: "Close all unrelated tabs and put your phone face-down before starting.",
  },
  {
    title: "The 1-3-5 Rule",
    category: "Productivity",
    body: "On any given day, commit to finishing 1 big thing, 3 medium things, and 5 small things — nothing more. This forces realistic prioritisation and gives you a daily win structure that feels achievable rather than demoralising.",
    tip: "Write tomorrow's 1-3-5 before you close your laptop tonight.",
  },
  {
    title: "Batch Similar Tasks",
    category: "Productivity",
    body: "Grouping similar tasks together — all emails at once, all calls in a block — reduces the mental cost of context switching. Even 30 minutes of batched email is more efficient than checking it every 20 minutes throughout the day.",
    tip: "Set two email times per day (morning, afternoon) and stick to them for one week.",
  },

  // Communication
  {
    title: "The Pyramid Principle",
    category: "Communication",
    body: "Structure any communication — email, report, presentation — by stating your conclusion first, then the supporting arguments. Developed by McKinsey consultant Barbara Minto, it respects the reader's time and dramatically reduces back-and-forth.",
    tip: "Rewrite your last sent email with the conclusion in the first sentence.",
  },
  {
    title: "Active Listening",
    category: "Communication",
    body: "Listening is not waiting to speak — it's confirming you understood before responding. Techniques include paraphrasing what you heard ('So what you're saying is…') and asking clarifying questions before giving your opinion.",
    tip: "In your next 1-on-1, pause 3 seconds before responding to anything.",
  },
  {
    title: "Writing Shorter Emails",
    category: "Communication",
    body: "Every extra sentence increases the chance an email won't be read fully. The goal is to say what you need in half the words you first draft. Cutting filler phrases ('I just wanted to…', 'As per my previous…') makes you sound more confident, not less polite.",
    tip: "Draft your email, then delete the first sentence — it's usually unnecessary.",
  },
  {
    title: "Mirroring in Negotiation",
    category: "Communication",
    body: "Repeating the last 2–3 words someone says encourages them to keep talking and signals active listening. FBI negotiator Chris Voss popularised this — it builds rapport faster than most conversational techniques and costs nothing.",
    tip: "Try mirroring in your next informal disagreement or request.",
  },
  {
    title: "Decline Meetings Without Agendas",
    category: "Communication",
    body: "Before accepting any meeting, ask for an agenda and the expected outcome. Meetings without these are usually emails that weren't written. Declining them isn't rude — it signals you take everyone's time seriously, including yours.",
    tip: "Add 'What outcome do we need?' to your next meeting invite response.",
  },
  {
    title: "Separate Facts from Interpretations",
    category: "Communication",
    body: "Most workplace conflict comes from stating interpretations as facts. 'You were late' is a fact. 'You don't respect the team' is an interpretation. Training yourself to notice this distinction improves feedback, reduces defensiveness, and resolves conflict faster.",
    tip: "In your next difficult conversation, start only with observable facts before sharing your interpretation.",
  },

  // Finance
  {
    title: "Pay Yourself First",
    category: "Finance",
    body: "Before spending on anything else, automatically transfer a fixed amount to savings or investments on payday. This removes willpower from the equation and ensures saving happens before lifestyle spending expands to fill income.",
    tip: "Set up an automatic transfer of even 5% of your salary to a separate account.",
  },
  {
    title: "The 50/30/20 Rule",
    category: "Finance",
    body: "Budget roughly 50% of take-home pay to needs, 30% to wants, and 20% to savings and debt repayment. It's a starting framework — adjust the ratios to your situation, but the structure forces you to think about all three categories deliberately.",
    tip: "Categorise last month's spending into the three buckets and see where you actually land.",
  },
  {
    title: "Compound Interest",
    category: "Finance",
    body: "Money grows exponentially when returns are reinvested — the earlier you start, the more time does the heavy lifting. LKR 10,000 invested at 8% annually becomes roughly LKR 46,600 in 20 years and LKR 100,600 in 30 — without adding a single rupee more.",
    tip: "Use an online compound interest calculator with your current savings to see your 20-year projection.",
  },
  {
    title: "Build an Emergency Fund First",
    category: "Finance",
    body: "Before investing, build 3–6 months of expenses in a liquid, accessible account. Without this buffer, any unexpected expense — medical, job loss, major repair — forces you to sell investments at the worst time or take on high-interest debt.",
    tip: "Calculate your monthly essential expenses and set a concrete emergency fund target.",
  },
  {
    title: "Lifestyle Inflation Trap",
    category: "Finance",
    body: "When income rises, spending tends to rise proportionally — this is lifestyle inflation. The antidote is keeping expenses flat when income jumps and directing the difference into investments. The gap between earning and spending is what builds wealth.",
    tip: "Next time you get a raise, keep your spending the same for 3 months.",
  },
  {
    title: "Net Worth Over Income",
    category: "Finance",
    body: "Income is what you earn; net worth is what you keep. High earners with poor saving habits stay financially fragile; modest earners who invest consistently build lasting security. Tracking net worth monthly is a better financial health metric than tracking income.",
    tip: "Add up your assets and liabilities today to calculate your current net worth.",
  },

  // Health
  {
    title: "Sleep Is Performance",
    category: "Health",
    body: "Sleep is not laziness — it's when the brain consolidates memory, repairs tissue, and regulates hormones. Chronic undersleeping impairs cognition as severely as alcohol and significantly raises risk of metabolic disease. Most adults need 7–9 hours.",
    tip: "Set a consistent wake-up time 7 days a week — the anchor matters more than bedtime.",
  },
  {
    title: "The 20-20-20 Rule",
    category: "Health",
    body: "Every 20 minutes of screen time, look at something 20 feet away for 20 seconds. This resets your ciliary muscles and significantly reduces digital eye strain — the source of most end-of-day headaches for screen workers.",
    tip: "Set a recurring 20-minute timer while you work on your computer today.",
  },
  {
    title: "Zone 2 Cardio",
    category: "Health",
    body: "Zone 2 is a conversational pace — you can speak in sentences but feel real effort. Done for 150+ minutes per week, it builds aerobic base, improves fat metabolism, and is the most research-backed exercise for longevity. A brisk walk counts.",
    tip: "Take a 30-minute brisk walk today. If you can't hold a conversation, slow down.",
  },
  {
    title: "Hydration Before Hunger",
    category: "Health",
    body: "Thirst and hunger share similar signals in the brain — mild dehydration is frequently misread as hunger. Drinking a glass of water before a meal reduces portion size and improves afternoon alertness more reliably than coffee.",
    tip: "Keep a 500ml water bottle on your desk and finish it before every meal.",
  },
  {
    title: "Non-Sleep Deep Rest",
    category: "Health",
    body: "A 10–20 minute body scan protocol — lying still, following breath — resets alertness without post-nap grogginess. Neuroscientist Andrew Huberman's research shows it can accelerate skill learning and restore afternoon mental energy significantly.",
    tip: "Search 'Yoga Nidra 10 minutes' on YouTube and try it after lunch today.",
  },
  {
    title: "Morning Sunlight",
    category: "Health",
    body: "Getting 5–10 minutes of sunlight within an hour of waking sets your circadian rhythm, boosts morning cortisol (the alertness hormone), and improves sleep quality that night. This effect is strongest before 10am and can't be replicated by indoor light.",
    tip: "Step outside within 30 minutes of waking tomorrow — even on a cloudy day.",
  },

  // Learning
  {
    title: "The Feynman Technique",
    category: "Learning",
    body: "To truly understand something, try explaining it in simple language to an imaginary 12-year-old. Wherever you stumble, you've found a gap. Go back, fill the gap, then explain again. The stumbles are the most valuable part.",
    tip: "Pick one concept from this week and explain it out loud in plain English for 2 minutes.",
  },
  {
    title: "Spaced Repetition",
    category: "Learning",
    body: "Memory fades predictably — reviewing information just before you forget it is far more efficient than re-reading it repeatedly. Apps like Anki use an algorithm to schedule reviews at optimal intervals, which is how language learners reach fluency fast.",
    tip: "Install Anki and make 5 cards from something you learned this week.",
  },
  {
    title: "Interleaving Practice",
    category: "Learning",
    body: "Mixing different types of problems or topics in a single session feels harder but produces better long-term retention than blocking each topic. Athletes call this random practice — it forces your brain to retrieve the right strategy each time, strengthening memory.",
    tip: "Alternate between two different subjects in your next study session instead of blocking each.",
  },
  {
    title: "Deliberate Practice",
    category: "Learning",
    body: "Practising at the edge of your current ability — not in your comfort zone — is what separates experts from competent performers. Researcher Anders Ericsson found that expert performance comes from focused, uncomfortable practice with immediate feedback, not time alone.",
    tip: "In your next skill session, spend at least half the time on the parts you find hardest.",
  },
  {
    title: "Reading Actively",
    category: "Learning",
    body: "Passive reading feels productive but retains little. Active reading means underlining, annotating, and — most importantly — summarising each section in your own words before moving on. The act of writing the summary is where understanding is built.",
    tip: "After each chapter of your current book, write one sentence summarising what you read.",
  },
  {
    title: "Teach to Learn",
    category: "Learning",
    body: "The best way to consolidate knowledge is to teach it. The protégé effect shows that students who know they'll teach material learn it more deeply and retain it longer than students who study for their own tests. You don't need a student — writing a blog post counts.",
    tip: "Write a 5-sentence explanation of something you recently learned, as if for a friend.",
  },

  // Career
  {
    title: "Building in Public",
    category: "Career",
    body: "Sharing work-in-progress — on LinkedIn, GitHub, or a blog — builds an audience and creates accountability. The bar for sharing-worthy work is much lower than most people think. Documenting your learning process is as valuable as showcasing finished products.",
    tip: "Share one thing you learned or built this week, even if it's incomplete.",
  },
  {
    title: "Saying No Strategically",
    category: "Career",
    body: "Every 'yes' is a 'no' to something else. High-performers protect their time by defaulting to 'no' and reserving 'yes' for things aligned with their top priorities. The goal isn't to be unhelpful — it's to be reliably excellent at fewer things.",
    tip: "Identify one recurring commitment that doesn't serve your goals and plan how to exit it.",
  },
  {
    title: "Sponsors vs. Mentors",
    category: "Career",
    body: "Mentors give advice; sponsors use their political capital to advocate for you in rooms you're not in. Both matter, but sponsors accelerate careers in ways mentors cannot. Identifying who in your organisation has sponsorship power is a career strategy, not politics.",
    tip: "List 3 people above you who could advocate for your next opportunity.",
  },
  {
    title: "Systems Over Goals",
    category: "Career",
    body: "Goals tell you where to go; systems determine whether you get there. Focusing on the daily process is more reliable than focusing on the outcome because systems persist after goals are achieved or abandoned. Identity-based habits — 'I am someone who…' — are the strongest systems.",
    tip: "Identify one goal you're working on and define the daily system that produces it.",
  },
  {
    title: "The Two-Pizza Rule for Teams",
    category: "Career",
    body: "Jeff Bezos's rule: if a team needs more than two pizzas to be fed, it's too large. Smaller teams move faster, communicate more clearly, and produce more per person. When you work in or lead a large group, look for ways to split into smaller units of accountability.",
    tip: "Identify the smallest group that could actually own the next project you're part of.",
  },

  // Creativity
  {
    title: "Diverge Before You Converge",
    category: "Creativity",
    body: "Great ideas come from separating the generation phase from the evaluation phase. Brainstorm without judgment first — write every idea, including terrible ones — then evaluate. Mixing generation and evaluation kills creative output because the inner critic stops flow before momentum builds.",
    tip: "Set a 10-minute timer and write 20 ideas for a current problem, no filtering allowed.",
  },
  {
    title: "Constraints Breed Creativity",
    category: "Creativity",
    body: "Unlimited resources and time rarely produce the best work — constraints do. Twitter's character limit, haiku's syllable count, and tight deadlines all force more inventive solutions than unconstrained environments. Next time you feel stuck, add a constraint.",
    tip: "Add an arbitrary constraint to your next creative task and see what it forces you to invent.",
  },
  {
    title: "Walking Solves Problems",
    category: "Creativity",
    body: "Stanford research showed walking increases creative output by 81% compared to sitting. A 20-minute walk — especially outdoors — activates the default mode network, where insight and associative thinking happen. Your best ideas rarely arrive at a desk.",
    tip: "Next time you're stuck on a problem, leave your desk and walk 20 minutes before returning.",
  },
  {
    title: "Sleep on Hard Decisions",
    category: "Creativity",
    body: "The unconscious mind continues processing problems during sleep. Many significant breakthroughs — Kekulé's benzene ring structure, McCartney's 'Yesterday' — came from dreams or the hypnagogic state. Sleeping on a decision frequently changes the answer in a way logic alone doesn't.",
    tip: "Write out a problem you're stuck on tonight, then read it first thing in the morning.",
  },

  // Tech Literacy
  {
    title: "How DNS Works",
    category: "Tech",
    body: "Every time you type a URL, your device queries a Domain Name System server to translate the human-readable name into an IP address — like a phonebook for the internet. Understanding this explains why 'clearing DNS cache' fixes many connection issues.",
    tip: "Open your terminal and run `nslookup google.com` to see DNS resolution live.",
  },
  {
    title: "What a VPN Actually Does",
    category: "Tech",
    body: "A VPN encrypts your traffic and routes it through a server elsewhere, masking your IP from websites. It does not make you anonymous, does not protect against malware, and the VPN provider can see all your traffic. Free VPNs often sell your data.",
    tip: "If you use a VPN, check whether it has a third-party audited no-logs policy.",
  },
  {
    title: "Two-Factor Authentication",
    category: "Tech",
    body: "2FA adds a second verification step after your password — usually a time-sensitive code. Even if your password is stolen, an attacker needs physical access to your second factor. Authenticator apps like Authy are far more secure than SMS codes.",
    tip: "Enable 2FA on your email account today — it's the single highest-impact security action you can take.",
  },

  // Mindset
  {
    title: "Growth vs. Fixed Mindset",
    category: "Mindset",
    body: "Carol Dweck's research shows that people who believe abilities are developable consistently outperform those who believe talent is fixed — even when the fixed-mindset person starts with more raw ability. The belief changes effort, resilience, and which challenges you seek.",
    tip: "Next time you fail at something, reframe: 'I haven't mastered this yet.'",
  },
  {
    title: "Inversion Thinking",
    category: "Mindset",
    body: "Instead of asking 'how do I succeed?', ask 'what would guarantee failure?' — then avoid those things. Charlie Munger called this inversion. It's often easier to identify and remove obstacles than to engineer success directly, especially in complex systems.",
    tip: "Write 5 things that would guarantee failure on your most important current goal.",
  },
];
