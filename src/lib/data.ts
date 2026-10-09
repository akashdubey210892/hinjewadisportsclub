export type Status = "live" | "upcoming" | "completed";

export interface Player { id: string; name: string; role: "Batter" | "Bowler" | "All-rounder" | "WK"; }
export interface Team { id: string; name: string; short: string; captain: string; players: Player[]; }
export interface Innings { team: string; runs: number; wickets: number; overs: string; }
export interface Match {
  id: string; title: string; venue: string; date: string; status: Status; overs: number;
  teamA: Team; teamB: Team; innings: Innings[]; summary: string; toss?: string;
}

// Match, squad, scorecard and commentary data must come from Firebase.
// Keep the initial dataset empty rather than showing invented matches or players.
export const matches: Match[] = [];

export const getMatch = (id: string): Match | undefined =>
  matches.find((match) => match.id === id);
