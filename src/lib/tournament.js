// ─── TOURNAMENT CONFIG ────────────────────────────────────────────────────────
export const TOURNAMENT_DATE = '2025-06-06';
export const START_TIME_MINUTES = 8 * 60; // 8:00 AM
export const MATCH_DURATION = 16;         // minutes per game
export const BREAK_BETWEEN_MATCHES = 4;   // buffer minutes

export const GROUPS = ['A', 'B', 'C', 'D'];

// ─── SCHEDULE HELPER ─────────────────────────────────────────────────────────
function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── GROUP STAGE MATCH GENERATOR (takes teams from Firestore) ────────────────
// Round-robin for 4 teams: 3 rounds × 2 matches = 6 matches per group
const RR_ROUNDS = [
  [0, 3, 1, 2],
  [0, 2, 3, 1],
  [0, 1, 2, 3],
];

export function generateGroupMatches(teams) {
  const matches = [];
  let matchId = 1;
  let timeMinutes = START_TIME_MINUTES;

  GROUPS.forEach(group => {
    const groupTeams = teams.filter(t => t.group === group);
    if (groupTeams.length < 2) return;

    RR_ROUNDS.forEach((round, roundIdx) => {
      const pair1home = groupTeams[round[0]];
      const pair1away = groupTeams[round[1]];
      const pair2home = groupTeams[round[2]];
      const pair2away = groupTeams[round[3]];

      if (pair1home && pair1away) {
        matches.push({
          id: `G${String(matchId).padStart(3, '0')}`,
          type: 'group', group,
          round: roundIdx + 1,
          homeTeamId: pair1home.id,
          awayTeamId: pair1away.id,
          homeScore: null, awayScore: null,
          time: minutesToTime(timeMinutes),
          completed: false,
        });
        matchId++;
        timeMinutes += MATCH_DURATION + BREAK_BETWEEN_MATCHES;
      }

      if (pair2home && pair2away) {
        matches.push({
          id: `G${String(matchId).padStart(3, '0')}`,
          type: 'group', group,
          round: roundIdx + 1,
          homeTeamId: pair2home.id,
          awayTeamId: pair2away.id,
          homeScore: null, awayScore: null,
          time: minutesToTime(timeMinutes),
          completed: false,
        });
        matchId++;
        timeMinutes += MATCH_DURATION + BREAK_BETWEEN_MATCHES;
      }
    });
  });

  return matches;
}

// ─── STANDINGS CALCULATOR (takes teams array) ─────────────────────────────────
export function calculateStandings(groupMatches, group, teams) {
  const groupTeams = teams.filter(t => t.group === group);
  const table = groupTeams.map(t => ({
    teamId: t.id,
    teamName: t.name,
    played: 0, won: 0, drawn: 0, lost: 0,
    gf: 0, ga: 0, gd: 0, points: 0,
  }));

  groupMatches
    .filter(m => m.group === group && m.completed)
    .forEach(m => {
      const home = table.find(t => t.teamId === m.homeTeamId);
      const away = table.find(t => t.teamId === m.awayTeamId);
      if (!home || !away) return;

      const hs = Number(m.homeScore);
      const as_ = Number(m.awayScore);
      home.played++; away.played++;
      home.gf += hs; home.ga += as_;
      away.gf += as_; away.ga += hs;
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;

      if (hs > as_) {
        home.won++; home.points += 3; away.lost++;
      } else if (hs < as_) {
        away.won++; away.points += 3; home.lost++;
      } else {
        home.drawn++; away.drawn++;
        home.points++; away.points++;
      }
    });

  return table.sort((a, b) =>
    b.points - a.points || b.gd - a.gd || b.gf - a.gf
  );
}

// ─── KNOCKOUT TEMPLATE ────────────────────────────────────────────────────────
export const KNOCKOUT_TEMPLATE = {
  cup: {
    label: 'Cup', color: 'amber',
    rounds: [
      { id: 'cup-qf', label: 'Quarter Finals', matches: [
        { id: 'CQF1', homeSlot: 'A1', awaySlot: 'B2' },
        { id: 'CQF2', homeSlot: 'B1', awaySlot: 'A2' },
        { id: 'CQF3', homeSlot: 'C1', awaySlot: 'D2' },
        { id: 'CQF4', homeSlot: 'D1', awaySlot: 'C2' },
      ]},
      { id: 'cup-sf', label: 'Semi Finals', matches: [
        { id: 'CSF1', homeSlot: 'W:CQF1', awaySlot: 'W:CQF2' },
        { id: 'CSF2', homeSlot: 'W:CQF3', awaySlot: 'W:CQF4' },
      ]},
      { id: 'cup-f', label: 'Final', matches: [
        { id: 'CF1', homeSlot: 'W:CSF1', awaySlot: 'W:CSF2' },
      ]},
    ],
  },
  plate: {
    label: 'Plate', color: 'sky',
    rounds: [
      { id: 'plate-sf', label: 'Semi Finals', matches: [
        { id: 'PSF1', homeSlot: 'L:CQF1', awaySlot: 'L:CQF2' },
        { id: 'PSF2', homeSlot: 'L:CQF3', awaySlot: 'L:CQF4' },
      ]},
      { id: 'plate-f', label: 'Final', matches: [
        { id: 'PF1', homeSlot: 'W:PSF1', awaySlot: 'W:PSF2' },
      ]},
    ],
  },
  shield: {
    label: 'Shield', color: 'violet',
    rounds: [
      { id: 'shield-sf', label: 'Semi Finals', matches: [
        { id: 'SSF1', homeSlot: 'L:PSF1', awaySlot: 'L:PSF2' },
        { id: 'SSF2', homeSlot: 'A3', awaySlot: 'C3' },
      ]},
      { id: 'shield-f', label: 'Final', matches: [
        { id: 'SF1', homeSlot: 'W:SSF1', awaySlot: 'W:SSF2' },
      ]},
    ],
  },
  bowl: {
    label: 'Bowl', color: 'rose',
    rounds: [
      { id: 'bowl-sf', label: 'Semi Finals', matches: [
        { id: 'BWF1', homeSlot: 'B3', awaySlot: 'D3' },
        { id: 'BWF2', homeSlot: 'A4', awaySlot: 'C4' },
      ]},
      { id: 'bowl-sf2', label: 'Semi Finals 2', matches: [
        { id: 'BWF3', homeSlot: 'B4', awaySlot: 'D4' },
        { id: 'BWF4', homeSlot: 'L:SSF1', awaySlot: 'L:SSF2' },
      ]},
      { id: 'bowl-f', label: 'Final', matches: [
        { id: 'BF1', homeSlot: 'W:BWF1', awaySlot: 'W:BWF2' },
      ]},
    ],
  },
};

export function getTeamName(id, teams) {
  const t = teams?.find(t => t.id === id);
  return t ? t.name : id || 'TBD';
}