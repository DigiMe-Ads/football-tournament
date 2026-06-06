// ─── TOURNAMENT CONFIG ────────────────────────────────────────────────────────
export const TOURNAMENT_DATE  = '2026-06-06';
export const START_TIME_MINUTES = 8 * 60;
export const MATCH_DURATION     = 16;
export const BREAK_BETWEEN      = 4;

// ─── AGE GROUPS ───────────────────────────────────────────────────────────────
export const AGE_GROUPS = ['U10', 'U12', 'U14', 'U16', 'Girls'];

// Each age group gets its own set of group letters
export const AGE_GROUP_LETTERS = {
  U10:   ['A', 'B', 'C', 'D'],
  U12:   ['E', 'F', 'G', 'H'],
  U14:   ['I', 'J', 'K', 'L'],
  U16:   ['M', 'N', 'O', 'P'],
  Girls: ['Q', 'R'],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

export function getGroupLetters(ageGroup) {
  return AGE_GROUP_LETTERS[ageGroup] || ['A','B','C','D'];
}

// ─── ROUND-ROBIN SCHEDULE ────────────────────────────────────────────────────
// For N teams, generate all pairs in a round-robin order
function rrPairs(teams) {
  const pairs = [];
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++)
      pairs.push([teams[i], teams[j]]);
  return pairs;
}

// Generate group matches INTERLEAVED across groups:
// Round 1 of all groups first, then Round 2 of all groups, etc.
export function generateGroupMatches(teams, ageGroup) {
  const letters = getGroupLetters(ageGroup);
  let timeMinutes = START_TIME_MINUTES;
  let matchId = 1;

  // Build rounds per group
  const groupRounds = {};
  letters.forEach(letter => {
    const grpTeams = teams.filter(t => t.group === letter);
    if (grpTeams.length < 2) { groupRounds[letter] = []; return; }

    // For 4 teams: 3 rounds of 2 matches each
    // For N teams: use standard round-robin rotation
    const rounds = buildRRRounds(grpTeams);
    groupRounds[letter] = rounds;
  });

  // Find max rounds
  const maxRounds = Math.max(...Object.values(groupRounds).map(r => r.length), 0);

  const matches = [];

  // Interleave: for each round, emit all groups
  for (let roundIdx = 0; roundIdx < maxRounds; roundIdx++) {
    letters.forEach(letter => {
      const rounds = groupRounds[letter] || [];
      const roundMatches = rounds[roundIdx] || [];
      roundMatches.forEach(([home, away]) => {
        matches.push({
          id: `${ageGroup}_G${String(matchId).padStart(3,'0')}`,
          ageGroup,
          type: 'group',
          group: letter,
          round: roundIdx + 1,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: null, awayScore: null,
          time: minutesToTime(timeMinutes),
          completed: false,
        });
        matchId++;
        timeMinutes += MATCH_DURATION + BREAK_BETWEEN;
      });
    });
  }

  return matches;
}

// Build round-robin rounds for a group of teams
// Returns array of rounds, each round = array of [homeTeam, awayTeam] pairs
function buildRRRounds(teams) {
  const n = teams.length;
  if (n < 2) return [];

  // For odd counts add a null bye to make the size even.
  // The rotation then naturally gives each team exactly one bye per cycle,
  // and every pair appears exactly once — no duplicates.
  const list = n % 2 !== 0 ? [...teams, null] : [...teams];
  const m = list.length; // always even
  const rounds = [];

  for (let r = 0; r < m - 1; r++) {
    const round = [];
    for (let i = 0; i < m / 2; i++) {
      const home = list[i];
      const away = list[m - 1 - i];
      if (home !== null && away !== null) round.push([home, away]);
    }
    if (round.length > 0) rounds.push(round);
    // Keep position 0 fixed, rotate the rest
    const last = list.splice(m - 1, 1)[0];
    list.splice(1, 0, last);
  }
  return rounds;
}

// ─── STANDINGS ────────────────────────────────────────────────────────────────
// Tiebreaker order (when points are equal):
//   1. Goal difference  2. Goals scored  3. Goals conceded
//   4. Head-to-head mini-league (pts → GD → GF → GA among tied teams)
//   5. Penalties (3 kicks) — admin resolves manually; standings show teams as equal
export function calculateStandings(groupMatches, group, teams) {
  const grpTeams = teams.filter(t => t.group === group);
  const completedMatches = groupMatches.filter(m => m.group === group && m.completed);

  const table = grpTeams.map(t => ({
    teamId: t.id, teamName: t.name,
    played: 0, won: 0, drawn: 0, lost: 0,
    gf: 0, ga: 0, gd: 0, points: 0,
  }));

  completedMatches.forEach(m => {
    const home = table.find(t => t.teamId === m.homeTeamId);
    const away = table.find(t => t.teamId === m.awayTeamId);
    if (!home || !away) return;
    const hs = Number(m.homeScore), as_ = Number(m.awayScore);
    home.played++; away.played++;
    home.gf += hs; home.ga += as_;
    away.gf += as_; away.ga += hs;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
    if (hs > as_)      { home.won++; home.points += 3; away.lost++; }
    else if (hs < as_) { away.won++; away.points += 3; home.lost++; }
    else               { home.drawn++; away.drawn++; home.points++; away.points++; }
  });

  // Step 1: sort by overall criteria (GD, GF, GA — lower GA is better)
  const basic = [...table].sort((a, b) =>
    b.points - a.points || b.gd - a.gd || b.gf - a.gf || (a.ga - b.ga)
  );

  // Step 2: find groups tied on all four criteria, break with H2H mini-league
  const result = [];
  let i = 0;
  while (i < basic.length) {
    let j = i + 1;
    while (
      j < basic.length &&
      basic[j].points === basic[i].points &&
      basic[j].gd     === basic[i].gd     &&
      basic[j].gf     === basic[i].gf     &&
      basic[j].ga     === basic[i].ga
    ) j++;

    if (j - i === 1) {
      result.push(basic[i]);
    } else {
      // Compute H2H mini-league only among these tied teams
      const tiedTeams = basic.slice(i, j);
      const tiedIds   = new Set(tiedTeams.map(t => t.teamId));
      const h2hMatches = completedMatches.filter(
        m => tiedIds.has(m.homeTeamId) && tiedIds.has(m.awayTeamId)
      );

      const h2h = Object.fromEntries(tiedTeams.map(t => [t.teamId, { pts: 0, gf: 0, ga: 0 }]));
      h2hMatches.forEach(m => {
        const hs = Number(m.homeScore), as_ = Number(m.awayScore);
        h2h[m.homeTeamId].gf += hs;  h2h[m.homeTeamId].ga += as_;
        h2h[m.awayTeamId].gf += as_; h2h[m.awayTeamId].ga += hs;
        if (hs > as_)      { h2h[m.homeTeamId].pts += 3; }
        else if (as_ > hs) { h2h[m.awayTeamId].pts += 3; }
        else               { h2h[m.homeTeamId].pts++; h2h[m.awayTeamId].pts++; }
      });

      result.push(
        ...[...tiedTeams].sort((a, b) => {
          const ah = h2h[a.teamId], bh = h2h[b.teamId];
          if (bh.pts !== ah.pts) return bh.pts - ah.pts;
          const agd = ah.gf - ah.ga, bgd = bh.gf - bh.ga;
          if (bgd !== agd) return bgd - agd;
          if (bh.gf !== ah.gf) return bh.gf - ah.gf;
          return ah.ga - bh.ga; // lower H2H GA better; true tie → penalties (admin)
        })
      );
    }

    i = j;
  }

  return result;
}

// ─── KNOCKOUT TEMPLATE BUILDER ────────────────────────────────────────────────
// Dynamically built based on actual groups in this age group.
// Cup:    top 2 per group → QFs (cross-seeded) → SFs → Final
// Plate:  Cup QF losers → SFs → Final
// Shield: 3rd & 4th per group → QFs → SFs → Final
// Bowl:   Shield QF losers → SFs → Final


// ─── GIRLS KNOCKOUT (Cup only, top 2 from 2 groups → SF → Final) ─────────────
function buildGirlsKnockoutTemplate(letters) {
  const [g1, g2] = letters;
  // 2 groups: top 2 from each group cross-seed directly into SFs
  // Q1 vs R2, R1 vs Q2 → Final
  return {
    cup: {
      label: 'Cup', icon: '🏆',
      rounds: [
        { id: 'cup-sf', label: 'Semi Finals', matches: [
          { id: 'CSF1', homeSlot: `${g1}1`, awaySlot: `${g2}2` },
          { id: 'CSF2', homeSlot: `${g2}1`, awaySlot: `${g1}2` },
        ]},
        { id: 'cup-f', label: 'Final', matches: [
          { id: 'CF1', homeSlot: 'W:CSF1', awaySlot: 'W:CSF2' },
        ]},
      ],
    },
  };
}

export function buildKnockoutTemplate(letters, ageGroup = null) {
  if (ageGroup === 'Girls') return buildGirlsKnockoutTemplate(letters);
  const n = letters.length; // number of groups (2 or 4 typical)

  // ── CUP ──────────────────────────────────────────────────────────────────
  // Cross-seeding: group[0] 1st vs group[1] 2nd, group[1] 1st vs group[0] 2nd, etc.
  const cupQFMatches = [];
  for (let i = 0; i < n; i += 2) {
    const g1 = letters[i], g2 = letters[i + 1] || letters[i];
    cupQFMatches.push({ id: `CQF${i+1}`, homeSlot: `${g1}1`, awaySlot: `${g2}2` });
    cupQFMatches.push({ id: `CQF${i+2}`, homeSlot: `${g2}1`, awaySlot: `${g1}2` });
  }

  const cupSFMatches = [];
  for (let i = 0; i < cupQFMatches.length; i += 2) {
    cupSFMatches.push({
      id: `CSF${Math.floor(i/2)+1}`,
      homeSlot: `W:${cupQFMatches[i].id}`,
      awaySlot: `W:${cupQFMatches[i+1]?.id || cupQFMatches[i].id}`,
    });
  }

  const cupRounds = [
    { id: 'cup-qf', label: 'Quarter Finals', matches: cupQFMatches },
  ];
  if (cupSFMatches.length > 1) {
    cupRounds.push({ id: 'cup-sf', label: 'Semi Finals', matches: cupSFMatches });
  }
  cupRounds.push({
    id: 'cup-f', label: 'Final', matches: [{
      id: 'CF1',
      homeSlot: cupSFMatches.length > 1 ? 'W:CSF1' : `W:${cupQFMatches[0]?.id}`,
      awaySlot: cupSFMatches.length > 1 ? 'W:CSF2' : `W:${cupQFMatches[1]?.id}`,
    }],
  });

  // ── PLATE ─────────────────────────────────────────────────────────────────
  const plateSFMatches = [];
  for (let i = 0; i < cupQFMatches.length; i += 2) {
    plateSFMatches.push({
      id: `PSF${Math.floor(i/2)+1}`,
      homeSlot: `L:${cupQFMatches[i].id}`,
      awaySlot: `L:${cupQFMatches[i+1]?.id || cupQFMatches[i].id}`,
    });
  }
  const plateRounds = [];
  if (plateSFMatches.length > 1) {
    plateRounds.push({ id: 'plate-sf', label: 'Semi Finals', matches: plateSFMatches });
  }
  plateRounds.push({
    id: 'plate-f', label: 'Final', matches: [{
      id: 'PF1',
      homeSlot: plateSFMatches.length > 1 ? 'W:PSF1' : `L:${cupQFMatches[0]?.id}`,
      awaySlot: plateSFMatches.length > 1 ? 'W:PSF2' : `L:${cupQFMatches[1]?.id}`,
    }],
  });

  // ── SHIELD ────────────────────────────────────────────────────────────────
  // 3rd AND 4th from each group → QFs
  const shieldQFMatches = [];
  for (let i = 0; i < n; i += 2) {
    const g1 = letters[i], g2 = letters[i + 1] || letters[i];
    shieldQFMatches.push({ id: `SQF${i+1}`, homeSlot: `${g1}3`, awaySlot: `${g2}4` });
    shieldQFMatches.push({ id: `SQF${i+2}`, homeSlot: `${g2}3`, awaySlot: `${g1}4` });
  }
  const shieldSFMatches = [];
  for (let i = 0; i < shieldQFMatches.length; i += 2) {
    shieldSFMatches.push({
      id: `SSF${Math.floor(i/2)+1}`,
      homeSlot: `W:${shieldQFMatches[i].id}`,
      awaySlot: `W:${shieldQFMatches[i+1]?.id || shieldQFMatches[i].id}`,
    });
  }
  const shieldRounds = [
    { id: 'shield-qf', label: 'Quarter Finals', matches: shieldQFMatches },
  ];
  if (shieldSFMatches.length > 1) {
    shieldRounds.push({ id: 'shield-sf', label: 'Semi Finals', matches: shieldSFMatches });
  }
  shieldRounds.push({
    id: 'shield-f', label: 'Final', matches: [{
      id: 'SHFF1',
      homeSlot: shieldSFMatches.length > 1 ? 'W:SSF1' : `W:${shieldQFMatches[0]?.id}`,
      awaySlot: shieldSFMatches.length > 1 ? 'W:SSF2' : `W:${shieldQFMatches[1]?.id}`,
    }],
  });

  // ── BOWL ──────────────────────────────────────────────────────────────────
  const bowlSFMatches = shieldQFMatches.map((m, i) => ({
    id: `BWF${i+1}`,
    homeSlot: `L:${m.id}`,
    awaySlot: null, // paired below
  }));
  // Pair them up for SFs
  const bowlSFPaired = [];
  for (let i = 0; i < bowlSFMatches.length; i += 2) {
    bowlSFPaired.push({
      id: `BWF${Math.floor(i/2)+1}`,
      homeSlot: `L:${shieldQFMatches[i].id}`,
      awaySlot: `L:${shieldQFMatches[i+1]?.id || shieldQFMatches[i].id}`,
    });
  }
  const bowlRounds = [];
  if (bowlSFPaired.length > 1) {
    bowlRounds.push({ id: 'bowl-sf', label: 'Semi Finals', matches: bowlSFPaired });
  }
  bowlRounds.push({
    id: 'bowl-f', label: 'Final', matches: [{
      id: 'BF1',
      homeSlot: bowlSFPaired.length > 1 ? 'W:BWF1' : `L:${shieldQFMatches[0]?.id}`,
      awaySlot: bowlSFPaired.length > 1 ? 'W:BWF2' : `L:${shieldQFMatches[1]?.id}`,
    }],
  });

  return {
    cup:    { label: 'Cup',    icon: '🏆', rounds: cupRounds    },
    plate:  { label: 'Plate',  icon: '🥈', rounds: plateRounds  },
    shield: { label: 'Shield', icon: '🛡️', rounds: shieldRounds },
    bowl:   { label: 'Bowl',   icon: '🏅', rounds: bowlRounds   },
  };
}

export function getTeamName(id, teams) {
  return teams?.find(t => t.id === id)?.name || id || 'TBD';
}