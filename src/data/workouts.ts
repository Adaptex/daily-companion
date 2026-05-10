export type Exercise = {
  name: string;
  sets: number;
  reps: string;
};

export type Workout = {
  title: string;
  focus: string;
  exercises: Exercise[];
  note?: string;
};

export const WORKOUTS: Workout[] = [
  // Full Body (7)
  {
    title: "Full Body Circuit A",
    focus: "Full Body",
    exercises: [
      { name: "Jumping Jacks", sets: 3, reps: "30s" },
      { name: "Push-ups", sets: 3, reps: "12" },
      { name: "Bodyweight Squats", sets: 3, reps: "15" },
      { name: "Mountain Climbers", sets: 3, reps: "30s" },
      { name: "Glute Bridges", sets: 3, reps: "15" },
      { name: "Plank", sets: 3, reps: "30s" },
    ],
    note: "30s rest between sets",
  },
  {
    title: "Full Body Circuit B",
    focus: "Full Body",
    exercises: [
      { name: "High Knees", sets: 3, reps: "30s" },
      { name: "Reverse Lunges", sets: 3, reps: "10/side" },
      { name: "Wide Push-ups", sets: 3, reps: "10" },
      { name: "Superman", sets: 3, reps: "12" },
      { name: "Bicycle Crunches", sets: 3, reps: "20" },
      { name: "Squat Jumps", sets: 3, reps: "10" },
    ],
    note: "30s rest between sets",
  },
  {
    title: "Full Body Circuit C",
    focus: "Full Body",
    exercises: [
      { name: "Burpees", sets: 3, reps: "8" },
      { name: "Diamond Push-ups", sets: 3, reps: "10" },
      { name: "Step-back Lunges", sets: 3, reps: "12/side" },
      { name: "Plank Shoulder Taps", sets: 3, reps: "20" },
      { name: "Wall Sit", sets: 3, reps: "45s" },
      { name: "Flutter Kicks", sets: 3, reps: "30s" },
    ],
    note: "Rest 45s between sets",
  },
  {
    title: "Full Body Tabata",
    focus: "Full Body",
    exercises: [
      { name: "Squat to Press (air)", sets: 4, reps: "20s on / 10s off" },
      { name: "Push-up Hold + Lower", sets: 4, reps: "20s on / 10s off" },
      { name: "Alternating Reverse Lunge", sets: 4, reps: "20s on / 10s off" },
      { name: "Mountain Climbers", sets: 4, reps: "20s on / 10s off" },
    ],
    note: "4 rounds of each exercise",
  },
  {
    title: "Full Body Endurance",
    focus: "Full Body",
    exercises: [
      { name: "March in Place", sets: 1, reps: "3 min" },
      { name: "Push-ups", sets: 4, reps: "10" },
      { name: "Squat + Hold", sets: 4, reps: "12 + 10s hold" },
      { name: "Dead Bug", sets: 3, reps: "10/side" },
      { name: "Inchworm", sets: 3, reps: "8" },
      { name: "Side Plank", sets: 2, reps: "30s/side" },
    ],
    note: "45s rest between exercises",
  },
  {
    title: "Full Body Power",
    focus: "Full Body",
    exercises: [
      { name: "Squat Jumps", sets: 4, reps: "10" },
      { name: "Explosive Push-ups", sets: 4, reps: "6" },
      { name: "Lateral Bounds", sets: 3, reps: "10/side" },
      { name: "Tuck Jumps", sets: 3, reps: "8" },
      { name: "Push-up to T", sets: 3, reps: "8/side" },
    ],
    note: "60s rest — power focus, max effort each set",
  },
  {
    title: "Full Body Ladder",
    focus: "Full Body",
    exercises: [
      { name: "Squats", sets: 1, reps: "10 → 8 → 6 → 4" },
      { name: "Push-ups", sets: 1, reps: "10 → 8 → 6 → 4" },
      { name: "Glute Bridges", sets: 1, reps: "10 → 8 → 6 → 4" },
      { name: "Mountain Climbers", sets: 1, reps: "30s → 25s → 20s → 15s" },
    ],
    note: "Descending reps — rest only between exercises",
  },

  // Upper Body Push (5)
  {
    title: "Push Day A",
    focus: "Upper Body",
    exercises: [
      { name: "Push-ups", sets: 4, reps: "12" },
      { name: "Wide Push-ups", sets: 3, reps: "10" },
      { name: "Pike Push-ups", sets: 3, reps: "10" },
      { name: "Tricep Dips (chair)", sets: 3, reps: "12" },
      { name: "Shoulder Taps", sets: 3, reps: "20" },
    ],
    note: "45s rest between sets",
  },
  {
    title: "Push Day B",
    focus: "Upper Body",
    exercises: [
      { name: "Diamond Push-ups", sets: 4, reps: "10" },
      { name: "Decline Push-ups (feet elevated)", sets: 3, reps: "10" },
      { name: "Pike Push-ups", sets: 3, reps: "12" },
      { name: "Close-grip Tricep Dips", sets: 3, reps: "12" },
      { name: "Plank to Push-up", sets: 3, reps: "8" },
    ],
    note: "60s rest — focus on slow negatives",
  },
  {
    title: "Push Endurance",
    focus: "Upper Body",
    exercises: [
      { name: "Push-ups", sets: 5, reps: "AMRAP" },
      { name: "Wide Push-ups", sets: 3, reps: "AMRAP" },
      { name: "Tricep Dips", sets: 3, reps: "AMRAP" },
      { name: "Pike Push-ups", sets: 3, reps: "8" },
    ],
    note: "AMRAP = as many reps as possible. 60s rest.",
  },
  {
    title: "Shoulder & Chest Focus",
    focus: "Upper Body",
    exercises: [
      { name: "Push-up Hold (2s bottom)", sets: 4, reps: "10" },
      { name: "Pike Push-ups", sets: 4, reps: "12" },
      { name: "Arm Circles", sets: 3, reps: "30s/direction" },
      { name: "Plank Up-Downs", sets: 3, reps: "10" },
      { name: "Tricep Dips", sets: 3, reps: "15" },
    ],
    note: "Slow and controlled — 3s down, 1s up",
  },
  {
    title: "Push Pyramid",
    focus: "Upper Body",
    exercises: [
      { name: "Push-ups", sets: 1, reps: "5 → 10 → 15 → 10 → 5" },
      { name: "Diamond Push-ups", sets: 1, reps: "5 → 8 → 10 → 8 → 5" },
      { name: "Tricep Dips", sets: 1, reps: "5 → 10 → 12 → 10 → 5" },
    ],
    note: "Ascending then descending — rest only between exercises",
  },

  // Core (5)
  {
    title: "Core Foundation",
    focus: "Core",
    exercises: [
      { name: "Plank", sets: 3, reps: "45s" },
      { name: "Bicycle Crunches", sets: 3, reps: "20" },
      { name: "Leg Raises", sets: 3, reps: "12" },
      { name: "Dead Bug", sets: 3, reps: "10/side" },
      { name: "Russian Twists", sets: 3, reps: "20" },
      { name: "Superman", sets: 3, reps: "12" },
    ],
    note: "30s rest between sets",
  },
  {
    title: "Core & Lower Back",
    focus: "Core",
    exercises: [
      { name: "Bird Dog", sets: 3, reps: "10/side" },
      { name: "Superman Hold", sets: 3, reps: "30s" },
      { name: "Side Plank", sets: 3, reps: "30s/side" },
      { name: "Glute Bridge Hold", sets: 3, reps: "45s" },
      { name: "Dead Bug", sets: 3, reps: "12/side" },
    ],
    note: "Focus on bracing the core throughout",
  },
  {
    title: "Abs Blast",
    focus: "Core",
    exercises: [
      { name: "Crunches", sets: 3, reps: "20" },
      { name: "Reverse Crunches", sets: 3, reps: "15" },
      { name: "Flutter Kicks", sets: 3, reps: "30s" },
      { name: "Bicycle Crunches", sets: 3, reps: "24" },
      { name: "Plank", sets: 3, reps: "60s" },
    ],
    note: "Minimal rest — 20s between sets",
  },
  {
    title: "Anti-Rotation Core",
    focus: "Core",
    exercises: [
      { name: "Plank Hold", sets: 4, reps: "45s" },
      { name: "Side Plank", sets: 3, reps: "40s/side" },
      { name: "Plank Shoulder Taps", sets: 3, reps: "20" },
      { name: "Dead Bug", sets: 4, reps: "10/side" },
      { name: "Bird Dog", sets: 3, reps: "12/side" },
    ],
    note: "Anti-rotation builds functional stability",
  },
  {
    title: "Core Endurance Circuit",
    focus: "Core",
    exercises: [
      { name: "Plank", sets: 1, reps: "60s" },
      { name: "Bicycle Crunches", sets: 1, reps: "30" },
      { name: "Leg Raises", sets: 1, reps: "15" },
      { name: "Side Plank L", sets: 1, reps: "45s" },
      { name: "Side Plank R", sets: 1, reps: "45s" },
      { name: "Mountain Climbers", sets: 1, reps: "45s" },
    ],
    note: "3 rounds of the full circuit. 60s rest between rounds.",
  },

  // Lower Body (5)
  {
    title: "Leg Day A",
    focus: "Lower Body",
    exercises: [
      { name: "Bodyweight Squats", sets: 4, reps: "15" },
      { name: "Reverse Lunges", sets: 3, reps: "12/side" },
      { name: "Glute Bridges", sets: 3, reps: "20" },
      { name: "Wall Sit", sets: 3, reps: "45s" },
      { name: "Calf Raises", sets: 3, reps: "20" },
    ],
    note: "45s rest between sets",
  },
  {
    title: "Glute & Hamstring Focus",
    focus: "Lower Body",
    exercises: [
      { name: "Glute Bridge", sets: 4, reps: "15" },
      { name: "Single-leg Glute Bridge", sets: 3, reps: "12/side" },
      { name: "Donkey Kicks", sets: 3, reps: "15/side" },
      { name: "Fire Hydrants", sets: 3, reps: "15/side" },
      { name: "Hamstring Curl (towel)", sets: 3, reps: "10" },
    ],
    note: "Squeeze glutes at the top of every rep",
  },
  {
    title: "Quad & Calf Focus",
    focus: "Lower Body",
    exercises: [
      { name: "Squats", sets: 4, reps: "15" },
      { name: "Sumo Squats", sets: 3, reps: "12" },
      { name: "Wall Sit", sets: 3, reps: "60s" },
      { name: "Step-ups (chair)", sets: 3, reps: "12/side" },
      { name: "Calf Raises", sets: 4, reps: "25" },
    ],
    note: "3s down, pause, drive up on squats",
  },
  {
    title: "Single-Leg Balance",
    focus: "Lower Body",
    exercises: [
      { name: "Single-leg Romanian Deadlift", sets: 3, reps: "10/side" },
      { name: "Pistol Squat (assisted)", sets: 3, reps: "6/side" },
      { name: "Single-leg Calf Raise", sets: 3, reps: "15/side" },
      { name: "Lateral Lunge", sets: 3, reps: "10/side" },
      { name: "Step-back Lunge with Hold", sets: 3, reps: "8/side" },
    ],
    note: "Builds balance and knee stability",
  },
  {
    title: "Leg Endurance",
    focus: "Lower Body",
    exercises: [
      { name: "Squats", sets: 5, reps: "20" },
      { name: "Walking Lunges", sets: 4, reps: "12/side" },
      { name: "Glute Bridges", sets: 4, reps: "20" },
      { name: "Calf Raises", sets: 3, reps: "30" },
    ],
    note: "Light burn throughout — minimal rest",
  },

  // HIIT / Cardio (5)
  {
    title: "HIIT Circuit A",
    focus: "Cardio",
    exercises: [
      { name: "Burpees", sets: 4, reps: "10" },
      { name: "High Knees", sets: 4, reps: "30s" },
      { name: "Squat Jumps", sets: 4, reps: "12" },
      { name: "Mountain Climbers", sets: 4, reps: "30s" },
    ],
    note: "40s work / 20s rest. 4 rounds.",
  },
  {
    title: "HIIT Circuit B",
    focus: "Cardio",
    exercises: [
      { name: "Jump Lunges", sets: 4, reps: "10/side" },
      { name: "Push-up Burpees", sets: 4, reps: "8" },
      { name: "Tuck Jumps", sets: 4, reps: "10" },
      { name: "Plank Jacks", sets: 4, reps: "30s" },
    ],
    note: "45s work / 15s rest. 4 rounds.",
  },
  {
    title: "Low-Impact Cardio",
    focus: "Cardio",
    exercises: [
      { name: "March in Place", sets: 3, reps: "60s" },
      { name: "Step Touch", sets: 3, reps: "60s" },
      { name: "Squat + Kick", sets: 3, reps: "12/side" },
      { name: "Standing Bicycle", sets: 3, reps: "20" },
      { name: "Low Jacks", sets: 3, reps: "30s" },
    ],
    note: "Joint-friendly — no jumping",
  },
  {
    title: "Cardio Pyramid",
    focus: "Cardio",
    exercises: [
      { name: "High Knees", sets: 1, reps: "20s → 30s → 40s → 30s → 20s" },
      { name: "Squat Jumps", sets: 1, reps: "5 → 8 → 10 → 8 → 5" },
      { name: "Burpees", sets: 1, reps: "3 → 5 → 7 → 5 → 3" },
    ],
    note: "Rest 15s between rungs. One pass through = 30 min.",
  },
  {
    title: "EMOM Cardio",
    focus: "Cardio",
    exercises: [
      { name: "Squat Jumps — every minute on the minute", sets: 10, reps: "10" },
      { name: "Push-ups — alternating minutes", sets: 10, reps: "10" },
      { name: "Mountain Climbers — alternating minutes", sets: 10, reps: "20" },
    ],
    note: "Every Minute On the Minute for 30 minutes — rest until next minute starts",
  },

  // Mobility / Recovery (5)
  {
    title: "Morning Mobility",
    focus: "Mobility",
    exercises: [
      { name: "Cat-Cow", sets: 2, reps: "60s" },
      { name: "Hip Circles", sets: 2, reps: "10/side" },
      { name: "World's Greatest Stretch", sets: 2, reps: "5/side" },
      { name: "Thoracic Rotation", sets: 2, reps: "10/side" },
      { name: "Child's Pose", sets: 2, reps: "60s" },
    ],
    note: "Slow and breathed — never force a stretch",
  },
  {
    title: "Hip & Lower Back Release",
    focus: "Mobility",
    exercises: [
      { name: "Pigeon Pose", sets: 2, reps: "60s/side" },
      { name: "Figure-4 Stretch", sets: 2, reps: "45s/side" },
      { name: "Supine Twist", sets: 2, reps: "45s/side" },
      { name: "Knee-to-Chest Pull", sets: 2, reps: "30s/side" },
      { name: "Happy Baby", sets: 2, reps: "60s" },
    ],
    note: "Ideal after a heavy leg day or long sitting session",
  },
  {
    title: "Upper Body Stretch",
    focus: "Mobility",
    exercises: [
      { name: "Doorway Chest Stretch", sets: 2, reps: "45s" },
      { name: "Cross-body Shoulder Stretch", sets: 2, reps: "30s/side" },
      { name: "Tricep Overhead Stretch", sets: 2, reps: "30s/side" },
      { name: "Neck Side Tilt", sets: 2, reps: "30s/side" },
      { name: "Thoracic Extension (chair)", sets: 2, reps: "60s" },
    ],
    note: "Great after a desk day — decompress the spine",
  },
  {
    title: "Full Body Flow",
    focus: "Mobility",
    exercises: [
      { name: "Inchworm", sets: 3, reps: "6" },
      { name: "Squat + Overhead Reach", sets: 3, reps: "10" },
      { name: "Hip Flexor Lunge", sets: 3, reps: "45s/side" },
      { name: "T-Spine Rotation", sets: 3, reps: "10/side" },
      { name: "Standing Forward Fold", sets: 3, reps: "45s" },
    ],
    note: "Move smoothly — this is a flow, not a workout",
  },
  {
    title: "Active Recovery",
    focus: "Mobility",
    exercises: [
      { name: "Easy Walk / March", sets: 1, reps: "5 min" },
      { name: "Leg Swings", sets: 2, reps: "10/side" },
      { name: "Arm Circles", sets: 2, reps: "30s/direction" },
      { name: "Sun Salutation (slow)", sets: 5, reps: "1 round" },
      { name: "Savasana", sets: 1, reps: "3 min" },
    ],
    note: "For days after hard sessions — keep the body moving without stress",
  },
];
