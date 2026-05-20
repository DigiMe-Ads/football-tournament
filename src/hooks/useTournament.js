import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, getDocs, setDoc, updateDoc,
  onSnapshot, writeBatch, deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  generateGroupMatches,
  calculateStandings,
  KNOCKOUT_TEMPLATE,
  GROUPS,
} from '../lib/tournament';

const MATCHES_COL  = 'matches';
const KNOCKOUT_COL = 'knockouts';
const TEAMS_COL    = 'teams';

// ─── Resolve a single slot against an already-partially-resolved list ─────────
// We pass `resolved` which grows as we process matches in order.
function resolveSlot(slot, resolved, standings) {
  if (!slot) return null;

  // Group position: "A1" = 1st in group A
  if (/^[A-D][1-4]$/.test(slot)) {
    const group = slot[0];
    const pos   = parseInt(slot[1]) - 1;
    return standings[group]?.[pos]?.teamId || null;
  }

  // Winner of a knockout match
  if (slot.startsWith('W:')) {
    const m = resolved.find(m => m.id === slot.slice(2));
    if (!m?.completed) return null;
    // Pen winner overrides score winner
    if (m.penWinner) return m.penWinner;
    if (m.homeScore > m.awayScore) return m.homeTeamId;
    if (m.awayScore > m.homeScore) return m.awayTeamId;
    return null;
  }

  // Loser of a knockout match
  if (slot.startsWith('L:')) {
    const m = resolved.find(m => m.id === slot.slice(2));
    if (!m?.completed) return null;
    if (m.penWinner) {
      // loser is the other team
      return m.penWinner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
    }
    if (m.homeScore > m.awayScore) return m.awayTeamId;
    if (m.awayScore > m.homeScore) return m.homeTeamId;
    return null;
  }

  return null;
}

// ─── Resolve all knockout matches in order ────────────────────────────────────
// Process segment by segment, round by round so dependencies are always met.
function resolveAllKnockouts(rawMatches, standings) {
  // Build an ordered list of match IDs from the template
  const orderedIds = [];
  for (const seg of Object.values(KNOCKOUT_TEMPLATE)) {
    for (const round of seg.rounds) {
      for (const m of round.matches) {
        orderedIds.push(m.id);
      }
    }
  }

  // Start with a copy of raw matches
  const resolved = rawMatches.map(m => ({ ...m }));

  // Process in template order so W:/L: refs resolve correctly
  for (const id of orderedIds) {
    const idx = resolved.findIndex(m => m.id === id);
    if (idx === -1) continue;
    const m = resolved[idx];
    resolved[idx] = {
      ...m,
      homeTeamId: m.homeTeamId || resolveSlot(m.homeSlot, resolved, standings),
      awayTeamId: m.awayTeamId || resolveSlot(m.awaySlot, resolved, standings),
    };
  }

  return resolved;
}

export function useTournament() {
  const [teams,           setTeams]           = useState([]);
  const [groupMatches,    setGroupMatches]     = useState([]);
  const [knockoutMatches, setKnockoutMatches]  = useState([]);
  const [initialized,     setInitialized]      = useState(false);
  const [loading,         setLoading]          = useState(true);

  // ── Real-time listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, TEAMS_COL), snap => {
      setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    const unsubGroup = onSnapshot(collection(db, MATCHES_COL), snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setGroupMatches(docs.filter(d => d.type === 'group'));
      setInitialized(docs.length > 0);
      setLoading(false);
    });

    const unsubKO = onSnapshot(collection(db, KNOCKOUT_COL), snap => {
      setKnockoutMatches(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    return () => { unsubTeams(); unsubGroup(); unsubKO(); };
  }, []);

  // ── Standings ────────────────────────────────────────────────────────────
  const standings = {};
  GROUPS.forEach(g => {
    standings[g] = calculateStandings(groupMatches, g, teams);
  });

  // ── Resolve knockouts in dependency order ────────────────────────────────
  const resolvedKnockouts = resolveAllKnockouts(knockoutMatches, standings);

  // ── Team CRUD ────────────────────────────────────────────────────────────
  const saveTeam = useCallback(async (team) => {
    await setDoc(doc(db, TEAMS_COL, team.id), team, { merge: true });
  }, []);

  const deleteTeam = useCallback(async (teamId) => {
    await deleteDoc(doc(db, TEAMS_COL, teamId));
  }, []);

  // ── Generate fixtures ────────────────────────────────────────────────────
  const initializeTournament = useCallback(async (teamsToUse) => {
    const allTeams = teamsToUse || teams;
    const batch = writeBatch(db);

    // Clear existing first
    const [gSnap, kSnap] = await Promise.all([
      getDocs(collection(db, MATCHES_COL)),
      getDocs(collection(db, KNOCKOUT_COL)),
    ]);
    gSnap.docs.forEach(d => batch.delete(d.ref));
    kSnap.docs.forEach(d => batch.delete(d.ref));

    // Group matches
    const matches = generateGroupMatches(allTeams);
    matches.forEach(m => batch.set(doc(db, MATCHES_COL, m.id), m));

    // Knockout stubs
    for (const [segKey, segVal] of Object.entries(KNOCKOUT_TEMPLATE)) {
      for (const round of segVal.rounds) {
        for (const match of round.matches) {
          batch.set(doc(db, KNOCKOUT_COL, match.id), {
            id: match.id,
            homeSlot: match.homeSlot,
            awaySlot: match.awaySlot,
            segment: segKey,
            segmentLabel: segVal.label,
            type: 'knockout',
            homeTeamId: null,
            awayTeamId: null,
            homeScore: null,
            awayScore: null,
            penHomeScore: null,
            penAwayScore: null,
            penWinner: null,
            completed: false,
            roundLabel: round.label,
            roundId: round.id,
          });
        }
      }
    }

    await batch.commit();
  }, [teams]);


  // ── Delete all teams in one group ────────────────────────────────────────
  const resetGroup = useCallback(async (group) => {
    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, TEAMS_COL));
    snap.docs
      .filter(d => d.data().group === group)
      .forEach(d => batch.delete(d.ref));
    await batch.commit();
  }, []);

  // ── Delete every team ────────────────────────────────────────────────────
  const resetAllTeams = useCallback(async () => {
    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, TEAMS_COL));
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }, []);

  // ── Score updates ────────────────────────────────────────────────────────
  const updateGroupMatch = useCallback(async (matchId, homeScore, awayScore) => {
    const completed = homeScore !== '' && awayScore !== '' &&
                      homeScore != null && awayScore != null;
    await updateDoc(doc(db, MATCHES_COL, matchId), {
      homeScore: completed ? Number(homeScore) : null,
      awayScore: completed ? Number(awayScore) : null,
      completed,
    });
  }, []);

  const resetGroupMatch = useCallback(async (matchId) => {
    await updateDoc(doc(db, MATCHES_COL, matchId), {
      homeScore: null, awayScore: null, completed: false,
    });
  }, []);

  // Knockout score — supports penalty shootout data
  const updateKnockoutMatch = useCallback(async (matchId, homeScore, awayScore, penData) => {
    const completed = homeScore !== '' && awayScore !== '' &&
                      homeScore != null && awayScore != null;
    await updateDoc(doc(db, KNOCKOUT_COL, matchId), {
      homeScore: completed ? Number(homeScore) : null,
      awayScore: completed ? Number(awayScore) : null,
      penHomeScore: penData?.penHomeScore ?? null,
      penAwayScore: penData?.penAwayScore ?? null,
      penWinner:    penData?.penWinner    ?? null,
      completed,
    });
  }, []);

  const resetKnockoutMatch = useCallback(async (matchId) => {
    await updateDoc(doc(db, KNOCKOUT_COL, matchId), {
      homeScore: null, awayScore: null, completed: false,
      penHomeScore: null, penAwayScore: null, penWinner: null,
    });
  }, []);

  // ── Global resets ────────────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    const batch = writeBatch(db);
    const [gSnap, kSnap] = await Promise.all([
      getDocs(collection(db, MATCHES_COL)),
      getDocs(collection(db, KNOCKOUT_COL)),
    ]);
    gSnap.docs.forEach(d => batch.update(d.ref, {
      homeScore: null, awayScore: null, completed: false,
    }));
    kSnap.docs.forEach(d => batch.update(d.ref, {
      homeScore: null, awayScore: null, completed: false,
      homeTeamId: null, awayTeamId: null,
      penHomeScore: null, penAwayScore: null, penWinner: null,
    }));
    await batch.commit();
  }, []);

  const hardReset = useCallback(async () => {
    await initializeTournament();
  }, [initializeTournament]);

  return {
    teams,
    groupMatches,
    knockoutMatches: resolvedKnockouts,
    standings,
    initialized,
    loading,
    resetGroup,        
    resetAllTeams, 
    saveTeam,
    deleteTeam,
    initializeTournament,
    updateGroupMatch,    resetGroupMatch,
    updateKnockoutMatch, resetKnockoutMatch,
    resetAll,            hardReset,
  };
}