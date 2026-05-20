import { useState } from 'react';
import { getTeamName } from '../lib/tournament';

const segmentColors = {
  cup:    'from-amber-500/20 to-amber-600/10 border-amber-500/40',
  plate:  'from-sky-500/20 to-sky-600/10 border-sky-500/40',
  shield: 'from-violet-500/20 to-violet-600/10 border-violet-500/40',
  bowl:   'from-rose-500/20 to-rose-600/10 border-rose-500/40',
  group:  'from-green-500/10 to-green-600/5 border-green-500/30',
};
const segmentAccent = {
  cup:    'text-amber-400',
  plate:  'text-sky-400',
  shield: 'text-violet-400',
  bowl:   'text-rose-400',
  group:  'text-green-400',
};

export default function MatchCard({
  match, isAdmin, onSave, onReset,
  colorScheme = 'group', showTime = true, teams = [],
  isKnockout = false,
}) {
  const [editing,  setEditing]  = useState(false);
  const [hs,       setHs]       = useState('');
  const [as_,      setAs]       = useState('');
  const [penMode,  setPenMode]  = useState(false);
  const [penHs,    setPenHs]    = useState('');
  const [penAs,    setPenAs]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const homeName = getTeamName(match.homeTeamId, teams);
  const awayName = getTeamName(match.awayTeamId, teams);
  const tbd      = !match.homeTeamId || !match.awayTeamId;

  const isDraw       = match.completed && Number(match.homeScore) === Number(match.awayScore);
  const hasPens      = match.penWinner != null;
  const penWinHome   = match.penWinner === match.homeTeamId;

  function startEdit() {
    setHs(match.homeScore ?? '');
    setAs(match.awayScore ?? '');
    setPenMode(false); setPenHs(''); setPenAs('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false); setPenMode(false);
    setHs(''); setAs(''); setPenHs(''); setPenAs('');
  }

  async function handleSave() {
    if (hs === '' || as_ === '') return;
    setSaving(true);

    const isDraw = Number(hs) === Number(as_);

    if (isKnockout && isDraw && penMode) {
      // Save with pen data
      if (penHs === '' || penAs === '' || Number(penHs) === Number(penAs)) {
        alert('Pen scores must have a winner (no draws).');
        setSaving(false); return;
      }
      const penWinner = Number(penHs) > Number(penAs) ? match.homeTeamId : match.awayTeamId;
      await onSave(match.id, hs, as_, {
        penHomeScore: Number(penHs),
        penAwayScore: Number(penAs),
        penWinner,
      });
    } else {
      await onSave(match.id, hs, as_, null);
    }

    setSaving(false);
    setEditing(false); setPenMode(false);
  }

  async function handleReset(e) {
    e.stopPropagation();
    if (!confirm('Reset this match result?')) return;
    await onReset(match.id);
  }

  const gradient = segmentColors[colorScheme] || segmentColors.group;
  const accent   = segmentAccent[colorScheme] || segmentAccent.group;

  // Decide which score label to show for winner bolding
  const homeWins = match.completed && (
    match.homeScore > match.awayScore ||
    (isDraw && hasPens && penWinHome)
  );
  const awayWins = match.completed && (
    match.awayScore > match.homeScore ||
    (isDraw && hasPens && !penWinHome)
  );

  return (
    <div className={`relative rounded-xl border bg-gradient-to-br ${gradient} p-4 transition-all duration-200 ${match.completed ? 'opacity-100' : tbd ? 'opacity-50' : 'opacity-90 hover:opacity-100'}`}>
      {/* Time badge */}
      {showTime && match.time && (
        <div className="absolute -top-2.5 left-4">
          <span className="bg-[#0a1a0f] border border-white/10 text-white/60 text-xs font-mono px-2 py-0.5 rounded-full">
            {match.time}
          </span>
        </div>
      )}

      {/* Status badge */}
      {match.completed && (
        <div className="absolute -top-2.5 right-4">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            hasPens
              ? 'bg-purple-900/80 border-purple-500/40 text-purple-300'
              : 'bg-green-900/80 border-green-500/40 text-green-400'
          }`}>
            {hasPens ? 'Pens' : 'FT'}
          </span>
        </div>
      )}

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className={`flex-1 text-right ${homeWins ? 'text-white font-semibold' : 'text-white/80'}`}>
          <span className="text-sm leading-tight">{tbd && !match.homeTeamId ? 'TBD' : homeName}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="99" value={hs} onChange={e => setHs(e.target.value)}
                className="w-12 text-center bg-black/40 border border-white/20 rounded-lg text-white text-lg font-mono py-1 focus:outline-none focus:border-green-500" autoFocus />
              <span className="text-white/40 text-xl">—</span>
              <input type="number" min="0" max="99" value={as_} onChange={e => setAs(e.target.value)}
                className="w-12 text-center bg-black/40 border border-white/20 rounded-lg text-white text-lg font-mono py-1 focus:outline-none focus:border-green-500" />
            </div>
          ) : (
            <div className={`flex items-center gap-2 font-display text-2xl ${match.completed ? accent : 'text-white/30'}`}>
              <span>{match.completed ? match.homeScore : '—'}</span>
              <span className="text-white/20 text-lg">:</span>
              <span>{match.completed ? match.awayScore : '—'}</span>
            </div>
          )}
        </div>

        <div className={`flex-1 text-left ${awayWins ? 'text-white font-semibold' : 'text-white/80'}`}>
          <span className="text-sm leading-tight">{tbd && !match.awayTeamId ? 'TBD' : awayName}</span>
        </div>
      </div>

      {/* Pen score display (when completed with pens) */}
      {match.completed && hasPens && !editing && (
        <div className="flex justify-center mt-1">
          <span className="text-purple-300/70 text-xs font-mono">
            (pens: {match.penHomeScore} – {match.penAwayScore})
          </span>
        </div>
      )}

      {/* Pen entry (while editing a drawn knockout) */}
      {editing && isKnockout && penMode && (
        <div className="mt-3 space-y-2">
          <p className="text-center text-purple-300 text-xs uppercase tracking-wider">Penalty Shootout</p>
          <div className="flex items-center justify-center gap-2">
            <input type="number" min="0" max="20" value={penHs} onChange={e => setPenHs(e.target.value)}
              placeholder="0"
              className="w-12 text-center bg-black/40 border border-purple-500/40 rounded-lg text-white text-lg font-mono py-1 focus:outline-none focus:border-purple-400" />
            <span className="text-white/40">–</span>
            <input type="number" min="0" max="20" value={penAs} onChange={e => setPenAs(e.target.value)}
              placeholder="0"
              className="w-12 text-center bg-black/40 border border-purple-500/40 rounded-lg text-white text-lg font-mono py-1 focus:outline-none focus:border-purple-400" />
          </div>
          <p className="text-center text-white/30 text-xs">Enter pen score — must have a winner</p>
        </div>
      )}

      {/* Prompt to add pens when score is a draw in knockout */}
      {editing && isKnockout && !penMode && hs !== '' && as_ !== '' && Number(hs) === Number(as_) && (
        <div className="mt-2 text-center">
          <button onClick={() => setPenMode(true)}
            className="text-xs px-3 py-1 rounded-lg bg-purple-900/40 border border-purple-500/30 text-purple-300 hover:bg-purple-800/50 transition-colors">
            + Add Penalty Shootout
          </button>
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && !tbd && (
        <div className="mt-3 flex justify-center gap-2 flex-wrap">
          {editing ? (
            <>
              <button onClick={cancelEdit}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                disabled={hs === '' || as_ === '' || saving || (isKnockout && penMode && (penHs === '' || penAs === ''))}
                className="text-xs px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white transition-colors font-medium">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              {match.completed && (
                <button onClick={handleReset}
                  className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-red-900/40 text-white/40 hover:text-red-400 transition-colors">
                  ↺ Reset
                </button>
              )}
              <button onClick={startEdit}
                className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                {match.completed ? '✎ Edit' : '+ Score'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}