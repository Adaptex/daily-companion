export type WellnessTip = {
  advice: string;
  action: string;
  citation: string;
  citationUrl?: string;
};

export type WellnessGoal = {
  id: string;
  label: string;
  icon: string;
  description: string;
  tips: WellnessTip[];
};

export const WELLNESS_GOALS: WellnessGoal[] = [
  {
    id: "energy",
    label: "More Energy",
    icon: "⚡",
    description: "Sustainable energy through the day",
    tips: [
      {
        advice: "A 20-minute walk at lunchtime raises afternoon energy and mood more than caffeine — without the crash.",
        action: "Walk outside after lunch today, even just around the block.",
        citation: "Frontiers in Psychology, 2017",
        citationUrl: "https://doi.org/10.3389/fpsyg.2017.00747",
      },
      {
        advice: "Eating low-glycaemic foods (oats, legumes, nuts) keeps blood sugar stable and prevents the 3pm slump.",
        action: "Swap white rice or bread for oats or lentils at one meal.",
        citation: "Am. J. Clinical Nutrition, 2008",
        citationUrl: "https://doi.org/10.1093/ajcn/87.1.212",
      },
      {
        advice: "Dehydration of just 1–2% body weight causes measurable fatigue and impairs concentration.",
        action: "Fill a 500ml bottle now and finish it before your next meeting.",
        citation: "Journal of Nutrition, 2012",
        citationUrl: "https://doi.org/10.3945/jn.111.142000",
      },
      {
        advice: "Cold exposure (a 30-second cold shower finish) triggers norepinephrine release, boosting alertness for hours.",
        action: "End your shower with 30 seconds of cold water — breathe through it.",
        citation: "PLOS ONE, 2018",
        citationUrl: "https://doi.org/10.1371/journal.pone.0201977",
      },
      {
        advice: "Short 10-minute naps before 3pm restore alertness without disrupting night sleep.",
        action: "Set a 20-minute alarm after lunch and close your eyes — even 10 minutes counts.",
        citation: "Sleep, 2006",
        citationUrl: "https://doi.org/10.1093/sleep/29.6.831",
      },
    ],
  },
  {
    id: "fitness",
    label: "Build Fitness",
    icon: "◈",
    description: "Strength and endurance gains",
    tips: [
      {
        advice: "Progressive overload — adding a small challenge each session — is the single most validated principle for strength gains.",
        action: "Add 1 extra rep or 1kg to one exercise today compared to last time.",
        citation: "NSCA Strength & Conditioning Journal, 2017",
        citationUrl: "https://doi.org/10.1519/SSC.0000000000000287",
      },
      {
        advice: "Compound movements (squat, deadlift, push-up, row) recruit more muscle fibres and burn more calories than isolation exercises.",
        action: "Do 3 sets of 10 push-ups and 10 bodyweight squats — no equipment needed.",
        citation: "J. Strength & Conditioning Research, 2014",
        citationUrl: "https://doi.org/10.1519/JSC.0b013e31826e9a2d",
      },
      {
        advice: "Protein within 2 hours of exercise significantly improves muscle protein synthesis and recovery.",
        action: "Have eggs, Greek yoghurt, or a handful of nuts within 2 hours of any workout.",
        citation: "J. International Society of Sports Nutrition, 2013",
        citationUrl: "https://doi.org/10.1186/1550-2783-10-53",
      },
      {
        advice: "Rest days are not wasted days — muscles grow during recovery, not during training.",
        action: "Take a full rest day or a light walk. Don't skip the recovery.",
        citation: "European J. Applied Physiology, 2011",
        citationUrl: "https://doi.org/10.1007/s00421-010-1718-x",
      },
      {
        advice: "Zone 2 cardio (a pace where you can hold a conversation) for 150 minutes/week is associated with a 35% lower mortality risk.",
        action: "Go for a 30-min brisk walk — talk-test pace: slightly breathless but able to chat.",
        citation: "JAMA Internal Medicine, 2015",
        citationUrl: "https://doi.org/10.1001/jamainternmed.2015.0533",
      },
    ],
  },
  {
    id: "nutrition",
    label: "Eat Better",
    icon: "◉",
    description: "Food choices that actually matter",
    tips: [
      {
        advice: "The Mediterranean diet is the most extensively studied eating pattern — linked to 30% lower cardiovascular disease risk.",
        action: "Add olive oil, tomatoes, and a handful of nuts to one meal today.",
        citation: "PREDIMED Trial, NEJM 2013",
        citationUrl: "https://doi.org/10.1056/NEJMoa1200303",
      },
      {
        advice: "Eating slowly and stopping at 80% full (hara hachi bu) reduces caloric intake by 15–20% without counting anything.",
        action: "Put your fork down between every 3 bites at your next meal. Notice when full.",
        citation: "J. Academy Nutrition & Dietetics, 2011",
        citationUrl: "https://doi.org/10.1016/j.jada.2011.09.026",
      },
      {
        advice: "Ultra-processed foods (UPF) are independently associated with higher obesity, depression, and cancer risk regardless of calorie count.",
        action: "Replace one packaged snack today with fruit, nuts, or yoghurt.",
        citation: "BMJ, 2019",
        citationUrl: "https://doi.org/10.1136/bmj.l1451",
      },
      {
        advice: "30 different plants per week improves gut microbiome diversity more than any supplement.",
        action: "Count the unique vegetables, fruits, nuts, seeds, or legumes you ate today. Aim for 5.",
        citation: "American Gut Project, mSystems 2018",
        citationUrl: "https://doi.org/10.1128/mSystems.00031-18",
      },
      {
        advice: "Time-restricted eating (eating within a 10-hour window) improves metabolic health markers even without calorie reduction.",
        action: "Finish dinner by 7pm and don't eat until 9am. Try it for one day.",
        citation: "Cell Metabolism, 2020",
        citationUrl: "https://doi.org/10.1016/j.cmet.2019.11.004",
      },
    ],
  },
  {
    id: "sleep",
    label: "Sleep Better",
    icon: "◑",
    description: "Rest that actually restores",
    tips: [
      {
        advice: "Screen light (blue wavelength) suppresses melatonin for up to 3 hours — making falling asleep harder.",
        action: "Set a screen-off alarm for 90 minutes before your target sleep time tonight.",
        citation: "Sleep Medicine Reviews, 2018",
        citationUrl: "https://doi.org/10.1016/j.smrv.2017.01.004",
      },
      {
        advice: "A bedroom temperature of 18–19°C (65°F) is the most effective non-medication sleep aid.",
        action: "Turn on the AC or open a window tonight. Sleep cool.",
        citation: "Sleep Medicine Reviews, 2012",
        citationUrl: "https://doi.org/10.1016/j.smrv.2011.07.002",
      },
      {
        advice: "Consistent wake time (even on weekends) is more important than bedtime for sleep quality.",
        action: "Set a single wake-up alarm for tomorrow — and commit to it on Saturday too.",
        citation: "Current Biology, 2019",
        citationUrl: "https://doi.org/10.1016/j.cub.2019.06.029",
      },
      {
        advice: "Poor sleep for 6 nights reduces insulin sensitivity by 30% — equivalent to gaining 8kg of body fat.",
        action: "Treat tonight's sleep as a performance input. Protect the 8 hours.",
        citation: "Annals of Internal Medicine, 2010",
        citationUrl: "https://doi.org/10.7326/0003-4819-153-7-201010050-00006",
      },
      {
        advice: "Magnesium glycinate (300–400mg before bed) is associated with improved deep sleep quality.",
        action: "Eat magnesium-rich foods at dinner: dark chocolate, pumpkin seeds, or spinach.",
        citation: "Journal of Research in Medical Sciences, 2012",
        citationUrl: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3703169/",
      },
    ],
  },
  {
    id: "mind",
    label: "Mental Clarity",
    icon: "◎",
    description: "Focus, calm, and resilience",
    tips: [
      {
        advice: "Box breathing (4s in, 4s hold, 4s out, 4s hold) activates the parasympathetic nervous system within 60 seconds.",
        action: "Do 4 rounds of box breathing right now — before reading anything else.",
        citation: "Frontiers in Neuroscience, 2017",
        citationUrl: "https://doi.org/10.3389/fnins.2017.00087",
      },
      {
        advice: "A 10-minute mindfulness session per day for 8 weeks measurably reduces anxiety and increases grey matter density.",
        action: "Set a 10-minute timer. Sit comfortably, focus on your breath. When distracted, return.",
        citation: "Psychiatry Research, 2011",
        citationUrl: "https://doi.org/10.1016/j.pscychresns.2010.08.006",
      },
      {
        advice: "Aerobic exercise is as effective as SSRIs for mild-to-moderate depression according to a 2023 Lancet meta-analysis.",
        action: "If you're feeling low, a 20-minute brisk walk is clinically meaningful — do it today.",
        citation: "Lancet Psychiatry, 2023",
        citationUrl: "https://doi.org/10.1016/S2215-0366(23)00030-4",
      },
      {
        advice: "Writing 3 specific things you're grateful for each day for 3 weeks measurably improves wellbeing.",
        action: "Write 3 specific things from today — people, moments, or small things you noticed.",
        citation: "J. Personality & Social Psychology, 2003",
        citationUrl: "https://doi.org/10.1037/0022-3514.84.2.377",
      },
      {
        advice: "Time in nature for 2 hours per week is associated with 23% lower cortisol levels.",
        action: "Plan a 30-minute outdoor session this week — park, garden, beach, anywhere green.",
        citation: "Nature Medicine, 2019",
        citationUrl: "https://doi.org/10.1038/s41591-019-0484-5",
      },
    ],
  },
  {
    id: "weight",
    label: "Lose Weight",
    icon: "▽",
    description: "Evidence-based, sustainable approach",
    tips: [
      {
        advice: "A 500kcal daily deficit through food (not exercise) reliably produces ~0.5kg/week loss — sustainable and measurable.",
        action: "Skip one high-calorie item today (a sugary drink, dessert, or large portion).",
        citation: "Obesity Reviews, 2015",
        citationUrl: "https://doi.org/10.1111/obr.12374",
      },
      {
        advice: "Protein at 1.6g/kg bodyweight preserves muscle mass during weight loss — preventing the 'skinny fat' outcome.",
        action: "Add a protein source to every meal today: eggs, chicken, fish, lentils, or tofu.",
        citation: "J. International Society of Sports Nutrition, 2017",
        citationUrl: "https://doi.org/10.1186/s12970-017-0177-8",
      },
      {
        advice: "Sleep deprivation raises ghrelin (hunger hormone) by 24%, sabotaging any caloric effort made during the day.",
        action: "Protect tonight's sleep — a rested tomorrow reduces unnecessary snacking.",
        citation: "Annals of Internal Medicine, 2010",
        citationUrl: "https://doi.org/10.7326/0003-4819-153-7-201010050-00006",
      },
      {
        advice: "Resistance training while in a caloric deficit preserves 90% of muscle — cardio alone preserves only 65%.",
        action: "Do 3 sets of push-ups and squats today. 15 minutes is enough.",
        citation: "Medicine & Science in Sports & Exercise, 2012",
        citationUrl: "https://doi.org/10.1249/MSS.0b013e318279a8dd",
      },
      {
        advice: "Drinking 500ml of water before meals reduces meal calories by 13% — the simplest intervention in the literature.",
        action: "Drink a full glass of water before your next meal. Every meal, every day.",
        citation: "Obesity, 2010",
        citationUrl: "https://doi.org/10.1038/oby.2009.235",
      },
    ],
  },
];
