// Hardcoded user preferences. Same shape will move to a Supabase row when auth lands.
// See memory/project_daily_companion_todos.md TODO #2.

export type SportsPreferences = {
  cricket: {
    enabled: boolean;
    teams: string[]; // e.g. "Sri Lanka", "Chennai Super Kings"
  };
  f1: {
    enabled: boolean;
    drivers: string[]; // e.g. "Verstappen"
    constructors: string[]; // e.g. "Red Bull"
  };
  football: {
    enabled: boolean;
    clubs: string[]; // e.g. "Arsenal"
  };
};

export type Preferences = {
  sports: SportsPreferences;
};

export const PREFERENCES: Preferences = {
  sports: {
    cricket: {
      enabled: true,
      teams: ["Sri Lanka", "Chennai Super Kings", "CSK"],
    },
    f1: {
      enabled: true,
      drivers: ["Verstappen", "Max Verstappen"],
      constructors: ["Red Bull"],
    },
    football: {
      enabled: true,
      clubs: ["Arsenal"],
    },
  },
};

// Flat list of all preference terms — used by news/briefing for FOR YOU matching.
export function preferenceTerms(): string[] {
  const s = PREFERENCES.sports;
  return [
    ...s.cricket.teams,
    ...s.f1.drivers,
    ...s.f1.constructors,
    ...s.football.clubs,
  ].map((t) => t.toLowerCase());
}
