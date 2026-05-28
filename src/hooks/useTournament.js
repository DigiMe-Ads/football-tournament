import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection, doc, getDocs, setDoc, updateDoc,
  onSnapshot, writeBatch, deleteDoc, query, where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  generateGroupMatches,
  calculateStandings,
  buildKnockoutTemplate,
  getGroupLetters,
} from '../lib/tournament';

const MATCHES_COL  = 'matches';
const KNOCKOUT_COL = 'knockouts';
const TEAMS_COL    = 'teams';
const BACKUPS_COL  = 'backups';

// ─── Resolve a single slot ────────────────────────────────────────────────────
function resolveSlot(slot, resolved, standings) {
  if (!slot) return null;

  // Group position: any letter A-P followed by 1-4, e.g. "A1", "E3", "M2"
  const gpMatch = slot.match(/^([A-Z])([1-4])$/);
  if (gpMatch) {
    const group = gpMatch[1];
    const pos   = parseInt(gpMatch[2]) - 1;
    return standings[group]?.[pos]?.teamId || null;
  }

  // Winner — look inside already-resolved array so earlier rounds feed later ones
  if (slot.startsWith('W:')) {
    const matchId = slot.slice(2);
    // Try both bare id ("CQF1") and prefixed id ("U10_CQF1")
    const m = resolved.find(m => m.id === matchId || m.id?.endsWith(`_${matchId}`));
    if (!m?.completed) return null;
    if (m.penWinner) return m.penWinner;
    if (Number(m.homeScore) > Number(m.awayScore)) return m.homeTeamId;
    if (Number(m.awayScore) > Number(m.homeScore)) return m.awayTeamId;
    return null;
  }

  // Loser
  if (slot.startsWith('L:')) {
    const matchId = slot.slice(2);
    const m = resolved.find(m => m.id === matchId || m.id?.endsWith(`_${matchId}`));
    if (!m?.completed) return null;
    if (m.penWinner) return m.penWinner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
    if (Number(m.homeScore) > Number(m.awayScore)) return m.awayTeamId;
    if (Number(m.awayScore) > Number(m.homeScore)) return m.homeTeamId;
    return null;
  }

  return null;
}

// ─── Resolve all knockouts in template order ──────────────────────────────────
function resolveAllKnockouts(rawMatches, standings, template) {
  if (!template) return rawMatches;

  // Collect match IDs in dependency order from the template
  const orderedIds = [];
  for (const seg of Object.values(template)) {
    for (const round of seg.rounds) {
      for (const m of round.matches) {
        if (m.id) orderedIds.push(m.id);
      }
    }
  }

  // Work on a copy
  const resolved = rawMatches.map(m => ({ ...m }));

  for (const templateId of orderedIds) {
    // Match in Firestore may be stored as "U10_CQF1" — find by suffix
    const idx = resolved.findIndex(
      m => m.id === templateId || m.id?.endsWith(`_${templateId}`)
    );
    if (idx === -1) continue;

    const m = resolved[idx];
    const homeTeamId = m.homeTeamId || resolveSlot(m.homeSlot, resolved, standings);
    const awayTeamId = m.awayTeamId || resolveSlot(m.awaySlot, resolved, standings);

    resolved[idx] = { ...m, homeTeamId, awayTeamId };
  }

  return resolved;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTournament(ageGroup) {
  const [teams,           setTeams]           = useState([]);
  const [groupMatches,    setGroupMatches]     = useState([]);
  const [knockoutMatches, setKnockoutMatches]  = useState([]);
  const [initialized,     setInitialized]      = useState(false);
  const [loading,         setLoading]          = useState(true);

  const letters = getGroupLetters(ageGroup);

  useEffect(() => {
    if (!ageGroup) return;
    setLoading(true);
    setTeams([]); setGroupMatches([]); setKnockoutMatches([]);
    setInitialized(false);

    const teamsQ   = query(collection(db, TEAMS_COL),    where('ageGroup', '==', ageGroup));
    const matchesQ = query(collection(db, MATCHES_COL),  where('ageGroup', '==', ageGroup));
    const koQ      = query(collection(db, KNOCKOUT_COL), where('ageGroup', '==', ageGroup));

    const unsubTeams = onSnapshot(teamsQ, snap => {
      // Use d.data() so id = "A1", not the doc ID "U10_A1"
      setTeams(snap.docs.map(d => ({ ...d.data() })));
    });
    const unsubGroup = onSnapshot(matchesQ, snap => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setGroupMatches(docs);
      setInitialized(docs.length > 0);
      setLoading(false);
    });
    const unsubKO = onSnapshot(koQ, snap => {
      // Keep doc id (e.g. "U10_CQF1") as the id — resolver handles both forms
      setKnockoutMatches(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    return () => { unsubTeams(); unsubGroup(); unsubKO(); };
  }, [ageGroup]);

  // ── Standings ────────────────────────────────────────────────────────────
  const standings = useMemo(() => {
    const s = {};
    letters.forEach(l => {
      s[l] = calculateStandings(groupMatches, l, teams);
    });
    return s;
  }, [groupMatches, teams, letters.join('')]);

  // ── Active letters + dynamic template ───────────────────────────────────
  const activeLetters = useMemo(
    () => letters.filter(l => teams.some(t => t.group === l)),
    [teams, letters.join('')]
  );

  const knockoutTemplate = useMemo(
    () => activeLetters.length >= 2 ? buildKnockoutTemplate(activeLetters, ageGroup) : null,
    [activeLetters.join(''), ageGroup]
  );

  // ── Resolve knockouts ────────────────────────────────────────────────────
  const resolvedKnockouts = useMemo(
    () => resolveAllKnockouts(knockoutMatches, standings, knockoutTemplate),
    [knockoutMatches, standings, knockoutTemplate]
  );

  // ── Team CRUD ────────────────────────────────────────────────────────────
  const saveTeam = useCallback(async (team) => {
    await setDoc(doc(db, TEAMS_COL, `${ageGroup}_${team.id}`), {
      ...team,
      id: team.id,       // keep as "A1"
      ageGroup,
    }, { merge: true });
  }, [ageGroup]);

  const deleteTeam = useCallback(async (teamId) => {
    // teamId is "A1" — doc is "U10_A1"
    await deleteDoc(doc(db, TEAMS_COL, `${ageGroup}_${teamId}`));
  }, [ageGroup]);

  const resetGroup = useCallback(async (group) => {
    const batch = writeBatch(db);
    const snap = await getDocs(
      query(collection(db, TEAMS_COL), where('ageGroup', '==', ageGroup), where('group', '==', group))
    );
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }, [ageGroup]);

  const resetAllTeams = useCallback(async () => {
    const batch = writeBatch(db);
    const snap = await getDocs(query(collection(db, TEAMS_COL), where('ageGroup', '==', ageGroup)));
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }, [ageGroup]);

  // ── Generate fixtures ────────────────────────────────────────────────────
  const initializeTournament = useCallback(async () => {
    const batch = writeBatch(db);

    // Delete existing for this age group
    const [gSnap, kSnap] = await Promise.all([
      getDocs(query(collection(db, MATCHES_COL),  where('ageGroup', '==', ageGroup))),
      getDocs(query(collection(db, KNOCKOUT_COL), where('ageGroup', '==', ageGroup))),
    ]);
    gSnap.docs.forEach(d => batch.delete(d.ref));
    kSnap.docs.forEach(d => batch.delete(d.ref));

    // Group matches
    const matches = generateGroupMatches(teams, ageGroup);
    matches.forEach(m => batch.set(doc(db, MATCHES_COL, m.id), m));

    // Knockout stubs
    const usedLetters = letters.filter(l => teams.some(t => t.group === l));
    if (usedLetters.length >= (ageGroup === 'Girls' ? 1 : 2)) {
      const template = buildKnockoutTemplate(usedLetters, ageGroup);
      for (const [segKey, segVal] of Object.entries(template)) {
        for (const round of segVal.rounds) {
          for (const match of round.matches) {
            if (!match.id) continue;
            const docId = `${ageGroup}_${match.id}`;
            batch.set(doc(db, KNOCKOUT_COL, docId), {
              id:           match.id,       // bare id: "CQF1"
              docId,                        // full id: "U10_CQF1"
              ageGroup,
              homeSlot:     match.homeSlot  || null,
              awaySlot:     match.awaySlot  || null,
              segment:      segKey,
              segmentLabel: segVal.label,
              type:         'knockout',
              homeTeamId:   null,
              awayTeamId:   null,
              homeScore:    null,
              awayScore:    null,
              penHomeScore: null,
              penAwayScore: null,
              penWinner:    null,
              completed:    false,
              roundLabel:   round.label,
              roundId:      round.id,
            });
          }
        }
      }
    }

    await batch.commit();
  }, [teams, ageGroup, letters]);

  // ── Score updates ────────────────────────────────────────────────────────
  const updateGroupMatch = useCallback(async (matchId, hs, as_) => {
    const completed = hs !== '' && as_ !== '' && hs != null && as_ != null;
    await updateDoc(doc(db, MATCHES_COL, matchId), {
      homeScore: completed ? Number(hs) : null,
      awayScore: completed ? Number(as_) : null,
      completed,
    });
  }, []);

  const updateGroupMatchTime = useCallback(async (matchId, time, fieldNo) => {
    const update = { time: time ?? null };
    if (fieldNo !== undefined) update.fieldNumber = fieldNo;
    await updateDoc(doc(db, MATCHES_COL, matchId), update);
  }, []);

  const resetGroupMatch = useCallback(async (matchId) => {
    await updateDoc(doc(db, MATCHES_COL, matchId), {
      homeScore: null, awayScore: null, completed: false,
    });
  }, []);

  const updateKnockoutMatch = useCallback(async (matchId, hs, as_, penData) => {
  const completed = hs !== '' && as_ !== '' && hs != null && as_ != null;
  const docId = matchId.includes('_') ? matchId : `${ageGroup}_${matchId}`;
  await updateDoc(doc(db, KNOCKOUT_COL, docId), {
    homeScore:    completed ? Number(hs) : null,
    awayScore:    completed ? Number(as_) : null,
    penHomeScore: penData?.penHomeScore ?? null,
    penAwayScore: penData?.penAwayScore ?? null,
    penWinner:    penData?.penWinner    ?? null,
    completed,
  });
}, [ageGroup]);

const updateKnockoutMatchTime = useCallback(async (matchId, time, fieldNo) => {
  const docId = matchId.includes('_') ? matchId : `${ageGroup}_${matchId}`;
  const update = { time: time ?? null };
  if (fieldNo !== undefined) update.fieldNumber = fieldNo;
  await updateDoc(doc(db, KNOCKOUT_COL, docId), update);
}, [ageGroup]);

const resetKnockoutMatch = useCallback(async (matchId) => {
  const docId = matchId.includes('_') ? matchId : `${ageGroup}_${matchId}`;
  await updateDoc(doc(db, KNOCKOUT_COL, docId), {
    homeScore: null, awayScore: null, completed: false,
    penHomeScore: null, penAwayScore: null, penWinner: null,
  });
}, [ageGroup]);

  // ── Backup & restore ─────────────────────────────────────────────────────
  const createBackup = useCallback(async (label = 'Manual backup') => {
    const [tSnap, mSnap, kSnap] = await Promise.all([
      getDocs(query(collection(db, TEAMS_COL),    where('ageGroup', '==', ageGroup))),
      getDocs(query(collection(db, MATCHES_COL),  where('ageGroup', '==', ageGroup))),
      getDocs(query(collection(db, KNOCKOUT_COL), where('ageGroup', '==', ageGroup))),
    ]);
    const backupDoc = {
      ageGroup,
      label,
      timestamp: serverTimestamp(),
      // Store full Firestore doc IDs alongside data so restore is exact
      teams:     tSnap.docs.map(d => ({ _docId: d.id, ...d.data() })),
      matches:   mSnap.docs.map(d => ({ ...d.data(), id: d.id })),
      knockouts: kSnap.docs.map(d => ({ ...d.data(), id: d.id })),
    };
    const ref = doc(collection(db, BACKUPS_COL));
    await setDoc(ref, backupDoc);
    return ref.id;
  }, [ageGroup]);

  const fetchBackups = useCallback(async () => {
    const snap = await getDocs(
      query(collection(db, BACKUPS_COL), where('ageGroup', '==', ageGroup))
    );
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0))
      .slice(0, 15);
  }, [ageGroup]);

  const restoreFromBackup = useCallback(async (backup) => {
    // Delete current data for this age group
    const [tSnap, mSnap, kSnap] = await Promise.all([
      getDocs(query(collection(db, TEAMS_COL),    where('ageGroup', '==', ageGroup))),
      getDocs(query(collection(db, MATCHES_COL),  where('ageGroup', '==', ageGroup))),
      getDocs(query(collection(db, KNOCKOUT_COL), where('ageGroup', '==', ageGroup))),
    ]);

    // Split into batches of 400 to stay under Firestore's 500-op limit
    const ops = [];
    tSnap.docs.forEach(d => ops.push({ type: 'delete', ref: d.ref }));
    mSnap.docs.forEach(d => ops.push({ type: 'delete', ref: d.ref }));
    kSnap.docs.forEach(d => ops.push({ type: 'delete', ref: d.ref }));

    // Restore from backup
    (backup.teams || []).forEach(t => {
      const { _docId, ...data } = t;
      ops.push({ type: 'set', ref: doc(db, TEAMS_COL, _docId), data });
    });
    (backup.matches || []).forEach(m => {
      ops.push({ type: 'set', ref: doc(db, MATCHES_COL, m.id), data: m });
    });
    (backup.knockouts || []).forEach(k => {
      const koDocId = k.docId || k.id;
      ops.push({ type: 'set', ref: doc(db, KNOCKOUT_COL, koDocId), data: k });
    });

    const CHUNK = 400;
    for (let i = 0; i < ops.length; i += CHUNK) {
      const batch = writeBatch(db);
      ops.slice(i, i + CHUNK).forEach(op => {
        if (op.type === 'delete') batch.delete(op.ref);
        else batch.set(op.ref, op.data);
      });
      await batch.commit();
    }
  }, [ageGroup]);

  const resetAll = useCallback(async () => {
    const batch = writeBatch(db);
    const [gSnap, kSnap] = await Promise.all([
      getDocs(query(collection(db, MATCHES_COL),  where('ageGroup', '==', ageGroup))),
      getDocs(query(collection(db, KNOCKOUT_COL), where('ageGroup', '==', ageGroup))),
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
  }, [ageGroup]);

  const hardReset = useCallback(async () => {
    await createBackup('Auto (before hard reset)');
    await initializeTournament();
  }, [createBackup, initializeTournament]);

  return {
    teams, groupMatches,
    knockoutMatches: resolvedKnockouts,
    knockoutTemplate,
    standings, initialized, loading,
    letters, activeLetters,
    saveTeam, deleteTeam, resetGroup, resetAllTeams,
    initializeTournament,
    updateGroupMatch, updateGroupMatchTime, resetGroupMatch,
    updateKnockoutMatch, updateKnockoutMatchTime, resetKnockoutMatch,
    resetAll,            hardReset,
    createBackup, fetchBackups, restoreFromBackup,
  };
}