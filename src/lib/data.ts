export type Status = "live" | "upcoming" | "completed";

export interface Player { id: string; name: string; role: "Batter" | "Bowler" | "All-rounder" | "WK"; }
export interface Team { id: string; name: string; short: string; captain: string; players: Player[]; }
export interface Innings { team: string; runs: number; wickets: number; overs: string; }
export interface Match {
  id: string; title: string; venue: string; date: string; status: Status; overs: number;
  teamA: Team; teamB: Team; innings: Innings[]; summary: string; toss?: string;
}

const names = [
  "Rahul Verma","Amit Singh","Vikas Yadav","Rohit Sharma","Sanjay Patel","Deepak Joshi","Arjun Mehta","Karan Gupta",
  "Nikhil Rao","Pranav Iyer","Suresh Kumar","Manish Tiwari","Ajay Dubey","Ravi Shukla","Gaurav Mishra","Harsh Pandey",
  "Yash Chauhan","Ankit Jain","Mohit Saini","Tarun Bhatt","Kunal Desai","Varun Nair",
];
const roles: Player["role"][] = ["Batter","Batter","All-rounder","Bowler","WK","Bowler","Batter","All-rounder","Bowler","Batter","Bowler"];
const mk = (start: number): Player[] =>
  names.slice(start, start + 11).map((n, i) => ({ id: `p${start + i}`, name: n, role: roles[i] }));

export const lions: Team = { id: "t1", name: "Shivaji Park Lions", short: "SPL", captain: "Rahul Verma", players: mk(0) };
export const strikers: Team = { id: "t2", name: "Marine Drive Strikers", short: "MDS", captain: "Manish Tiwari", players: mk(11) };
export const warriors: Team = { id: "t3", name: "Andheri Warriors", short: "ANW", captain: "Ajay Dubey", players: mk(0) };
export const kings: Team = { id: "t4", name: "Bandra Kings", short: "BDK", captain: "Kunal Desai", players: mk(11) };

export const matches: Match[] = [
  { id: "m1", title: "Sunday League · Match 7", venue: "Shivaji Park, Ground 2", date: "Today, 4:00 PM", status: "live", overs: 10,
    teamA: lions, teamB: strikers, toss: "Lions won the toss and chose to bat",
    innings: [{ team: "SPL", runs: 98, wickets: 4, overs: "10.0" }, { team: "MDS", runs: 61, wickets: 3, overs: "6.2" }],
    summary: "MDS need 38 runs in 22 balls" },
  { id: "m2", title: "Box Cricket Cup · Semi 1", venue: "Turf Arena, Andheri", date: "Today, 7:30 PM", status: "upcoming", overs: 6,
    teamA: warriors, teamB: kings, innings: [], summary: "Starts in 2h 48m" },
  { id: "m3", title: "Sunday League · Match 8", venue: "Oval Maidan", date: "Sun, 12 Oct, 8:00 AM", status: "upcoming", overs: 12,
    teamA: strikers, teamB: warriors, innings: [], summary: "Player draft opens Sat" },
  { id: "m4", title: "Sunday League · Match 6", venue: "Shivaji Park, Ground 1", date: "Sun, 5 Oct", status: "completed", overs: 10,
    teamA: kings, teamB: lions, toss: "Kings won the toss and chose to bowl",
    innings: [{ team: "SPL", runs: 112, wickets: 6, overs: "10.0" }, { team: "BDK", runs: 113, wickets: 5, overs: "9.3" }],
    summary: "Bandra Kings won by 5 wickets" },
  { id: "m5", title: "Friendly", venue: "Turf Arena, Andheri", date: "Sat, 4 Oct", status: "completed", overs: 8,
    teamA: warriors, teamB: strikers,
    innings: [{ team: "ANW", runs: 87, wickets: 7, overs: "8.0" }, { team: "MDS", runs: 74, wickets: 8, overs: "8.0" }],
    summary: "Andheri Warriors won by 13 runs" },
];

export const getMatch = (id: string) => matches.find((m) => m.id === id) ?? matches[0];

export const battingCard = [
  { name: "Rahul Verma", how: "c Desai b Saini", r: 34, b: 21, f: 4, s: 2 },
  { name: "Amit Singh", how: "b Tiwari", r: 12, b: 9, f: 2, s: 0 },
  { name: "Vikas Yadav", how: "run out (Jain)", r: 8, b: 7, f: 1, s: 0 },
  { name: "Rohit Sharma", how: "not out", r: 27, b: 15, f: 2, s: 2 },
  { name: "Sanjay Patel", how: "lbw b Bhatt", r: 5, b: 6, f: 0, s: 0 },
  { name: "Deepak Joshi", how: "not out", r: 6, b: 2, f: 0, s: 1 },
];
export const bowlingCard = [
  { name: "Manish Tiwari", o: "2", m: 0, r: 18, w: 1 },
  { name: "Mohit Saini", o: "2", m: 0, r: 22, w: 1 },
  { name: "Tarun Bhatt", o: "2", m: 0, r: 15, w: 1 },
  { name: "Ankit Jain", o: "2", m: 0, r: 24, w: 0 },
  { name: "Kunal Desai", o: "2", m: 0, r: 17, w: 0 },
];
export const commentary = [
  { ball: "6.2", text: "Joshi to Jain, FOUR! Short and wide, slapped through point.", tag: "4" },
  { ball: "6.1", text: "Joshi to Jain, 1 run, worked to mid-wicket.", tag: "1" },
  { ball: "5.6", text: "Patel to Desai, OUT! Bowled. Middle stump cartwheeling.", tag: "W" },
  { ball: "5.5", text: "Patel to Desai, SIX! Down the track and lofted over long-on.", tag: "6" },
  { ball: "5.4", text: "Patel to Desai, no run, beaten outside off.", tag: "0" },
  { ball: "5.3", text: "Patel to Saini, 1 leg bye, off the pads.", tag: "1lb" },
  { ball: "5.2", text: "Patel to Saini, wide, drifting down leg.", tag: "Wd" },
];
