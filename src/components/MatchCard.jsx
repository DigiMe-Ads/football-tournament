import { useState } from 'react';
import { getTeamName } from '../lib/tournament';

const segColors = {
  cup:    { card: 'border-kz-gold/40 from-kz-gold/10 to-transparent',     accent: 'text-kz-gold',    badge: 'bg-kz-gold/20 text-kz-gold border-kz-gold/30' },
  plate:  { card: 'border-sky-500/40 from-sky-500/10 to-transparent',      accent: 'text-sky-400',    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  shield: { card: 'border-violet-500/40 from-violet-500/10 to-transparent', accent: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  bowl:   { card: 'border-rose-500/40 from-rose-500/10 to-transparent',     accent: 'text-rose-400',   badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  group:  { card: 'border-kz/40 from-kz/10 to-transparent',                accent: 'text-kz-300',     badge: 'bg-kz/20 text-kz-300 border-kz/30' },
};

export default function MatchCard({
  match, isAdmin, onSave, onReset,
  colorScheme = 'group', showTime = true,
  teams = [], isKnockout = false,
  groupLabel = null,
}) {
  const [editing, setEditing] = useState(false);
  const [hs,  setHs]  = useState('');
  const [as_, setAs]  = useState('');
  const [penMode, setPenMode] = useState(false);
  const [penHs, setPenHs] = useState('');
  const [penAs, setPenAs] = useState('');
  const [saving, setSaving] = useState(false);

  const style    = segColors[colorScheme] || segColors.group;
  const homeName = getTeamName(match.homeTeamId, teams);
  const awayName = getTeamName(match.awayTeamId, teams);
  const tbd      = !match.homeTeamId || !match.awayTeamId;
  const hasPens  = match.penWinner != null;
  const isDraw   = match.completed && Number(match.homeScore) === Number(match.awayScore);
  const homeWins = match.completed && (match.homeScore > match.awayScore || (isDraw && hasPens && match.penWinner === match.homeTeamId));
  const awayWins = match.completed && (match.awayScore > match.homeScore || (isDraw && hasPens && match.penWinner === match.awayTeamId));

  function startEdit() {
    setHs(match.homeScore ?? ''); setAs(match.awayScore ?? '');
    setPenMode(false); setPenHs(''); setPenAs('');
    setEditing(true);
  }

  async function handleSave() {
    if (hs === '' || as_ === '') return;
    setSaving(true);
    const draw = Number(hs) === Number(as_);
    if (isKnockout && draw && penMode) {
      if (penHs === '' || penAs === '' || Number(penHs) === Number(penAs)) {
        alert('Pen scores must produce a winner.'); setSaving(false); return;
      }
      const penWinner = Number(penHs) > Number(penAs) ? match.homeTeamId : match.awayTeamId;
      await onSave(match.id, hs, as_, { penHomeScore: Number(penHs), penAwayScore: Number(penAs), penWinner });
    } else {
      await onSave(match.id, hs, as_, null);
    }
    setSaving(false); setEditing(false); setPenMode(false);
  }

  async function handleReset(e) {
    e.stopPropagation();
    if (!confirm('Reset this match?')) return;
    await onReset(match.id);
  }

  return (
    <div className={`relative rounded-xl border bg-gradient-to-br ${style.card} p-3 sm:p-4 transition-all ${match.completed ? '' : tbd ? 'opacity-50' : 'opacity-80 hover:opacity-100'}`}>
      {/* Time + optional group label */}
      {showTime && (match.time || groupLabel) && (
        <span className="absolute -top-2.5 left-3 bg-kz-950 border border-white/10 text-white/50 text-xs font-mono px-2 py-0.5 rounded-full">
          {match.time}{groupLabel ? ` · ${groupLabel}` : ''}
        </span>
      )}
      {/* Status */}
      {match.completed && (
        <span className={`absolute -top-2.5 right-3 text-xs px-2 py-0.5 rounded-full border ${
          hasPens ? 'bg-purple-900/80 border-purple-500/40 text-purple-300' : 'bg-kz-800 border-kz/40 text-kz-300'
        }`}>
          {hasPens ? 'Pens' : 'FT'}
        </span>
      )}

      {/* Teams + score */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`flex-1 text-right text-sm leading-tight truncate ${homeWins ? 'text-white font-semibold' : 'text-white/75'}`}>
          {tbd && !match.homeTeamId ? 'TBD' : homeName}
        </span>

        <div className="shrink-0 flex items-center gap-1">
          {editing ? (
            <>
              <input type="number" min="0" max="99" value={hs} onChange={e => setHs(e.target.value)} autoFocus
                className="w-10 text-center bg-black/50 border border-white/20 rounded-lg text-white text-base font-mono py-1 focus:outline-none focus:border-kz" />
              <span className="text-white/30 text-sm">–</span>
              <input type="number" min="0" max="99" value={as_} onChange={e => setAs(e.target.value)}
                className="w-10 text-center bg-black/50 border border-white/20 rounded-lg text-white text-base font-mono py-1 focus:outline-none focus:border-kz" />
            </>
          ) : (
            <div className={`flex items-center gap-1.5 font-display text-xl sm:text-2xl ${match.completed ? style.accent : 'text-white/25'}`}>
              <span>{match.completed ? match.homeScore : '—'}</span>
              <span className="text-white/20 text-base">:</span>
              <span>{match.completed ? match.awayScore : '—'}</span>
            </div>
          )}
        </div>

        <span className={`flex-1 text-left text-sm leading-tight truncate ${awayWins ? 'text-white font-semibold' : 'text-white/75'}`}>
          {tbd && !match.awayTeamId ? 'TBD' : awayName}
        </span>
      </div>

      {/* Pen display */}
      {match.completed && hasPens && !editing && (
        <p className="text-center text-purple-300/60 text-xs mt-1 font-mono">
          pens {match.penHomeScore}–{match.penAwayScore}
        </p>
      )}

      {/* Pen entry */}
      {editing && isKnockout && penMode && (
        <div className="mt-3 space-y-1.5">
          <p className="text-center text-purple-300 text-xs uppercase tracking-wider">Penalty Shootout</p>
          <div className="flex items-center justify-center gap-2">
            <input type="number" min="0" max="20" value={penHs} onChange={e => setPenHs(e.target.value)} placeholder="0"
              className="w-10 text-center bg-black/50 border border-purple-500/40 rounded-lg text-white font-mono py-1 focus:outline-none focus:border-purple-400" />
            <span className="text-white/30">–</span>
            <input type="number" min="0" max="20" value={penAs} onChange={e => setPenAs(e.target.value)} placeholder="0"
              className="w-10 text-center bg-black/50 border border-purple-500/40 rounded-lg text-white font-mono py-1 focus:outline-none focus:border-purple-400" />
          </div>
        </div>
      )}

      {/* Draw → pens prompt */}
      {editing && isKnockout && !penMode && hs !== '' && as_ !== '' && Number(hs) === Number(as_) && (
        <div className="mt-2 text-center">
          <button onClick={() => setPenMode(true)}
            className="text-xs px-3 py-1 rounded-lg bg-purple-900/40 border border-purple-500/30 text-purple-300 hover:bg-purple-800/50 transition-colors">
            + Penalty Shootout
          </button>
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && !tbd && (
        <div className="mt-2.5 flex justify-center gap-1.5 flex-wrap">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setPenMode(false); }}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                disabled={hs === '' || as_ === '' || saving || (isKnockout && penMode && (penHs === '' || penAs === ''))}
                className="text-xs px-3 py-1 rounded-lg bg-kz hover:bg-kz-400 disabled:opacity-40 text-white font-medium transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              {match.completed && (
                <button onClick={handleReset}
                  className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-red-900/40 text-white/30 hover:text-red-400 transition-colors">
                  ↺
                </button>
              )}
              <button onClick={startEdit}
                className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-kz/30 text-white/60 hover:text-white transition-colors">
                {match.completed ? '✎ Edit' : '+ Score'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}