import { useState } from 'react';
import { getTeamName } from '../lib/tournament';

const segColors = {
  cup: {
    card: 'border-kz-gold/40 from-kz-gold/10 to-transparent',
    lightBorder: 'border-amber-300',
    accent: 'text-kz-gold',
    lightAccent: 'text-amber-600',
    badge: 'bg-kz-gold/20 text-kz-gold border-kz-gold/30',
    lightBadge: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  plate: {
    card: 'border-sky-500/40 from-sky-500/10 to-transparent',
    lightBorder: 'border-sky-400',
    accent: 'text-sky-400',
    lightAccent: 'text-sky-600',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    lightBadge: 'bg-sky-100 text-sky-700 border-sky-400',
  },
  shield: {
    card: 'border-violet-500/40 from-violet-500/10 to-transparent',
    lightBorder: 'border-violet-400',
    accent: 'text-violet-400',
    lightAccent: 'text-violet-600',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    lightBadge: 'bg-violet-100 text-violet-700 border-violet-400',
  },
  bowl: {
    card: 'border-rose-500/40 from-rose-500/10 to-transparent',
    lightBorder: 'border-rose-400',
    accent: 'text-rose-400',
    lightAccent: 'text-rose-600',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    lightBadge: 'bg-rose-100 text-rose-700 border-rose-400',
  },
  group: {
    card: 'border-kz/40 from-kz/10 to-transparent',
    lightBorder: 'border-amber-300',
    accent: 'text-kz-300',
    lightAccent: 'text-amber-600',
    badge: 'bg-kz/20 text-kz-300 border-kz/30',
    lightBadge: 'bg-amber-100 text-amber-700 border-amber-300',
  },
};

export default function MatchCard({
  match, isAdmin, onSave, onReset, onSaveTime,
  colorScheme = 'group', showTime = true,
  teams = [], isKnockout = false,
  groupLabel = null, showFieldNo = false,
}) {
  const [editing, setEditing] = useState(false);
  const [hs,  setHs]  = useState('');
  const [as_, setAs]  = useState('');
  const [penMode, setPenMode] = useState(false);
  const [penHs, setPenHs] = useState('');
  const [penAs, setPenAs] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeVal, setTimeVal] = useState('');
  const [fieldNoVal, setFieldNoVal] = useState('');

  const style    = segColors[colorScheme] || segColors.group;
  const homeName = getTeamName(match.homeTeamId, teams);
  const awayName = getTeamName(match.awayTeamId, teams);
  const tbd      = !match.homeTeamId || !match.awayTeamId;
  const hasPens  = match.penWinner != null;
  const isDraw   = match.completed && Number(match.homeScore) === Number(match.awayScore);
  const homeWins = match.completed && (match.homeScore > match.awayScore || (isDraw && hasPens && match.penWinner === match.homeTeamId));
  const awayWins = match.completed && (match.awayScore > match.homeScore || (isDraw && hasPens && match.penWinner === match.awayTeamId));

  // isAdmin doubles as the light-mode flag (admin view = white background)
  const L = isAdmin;

  function startEdit() {
    setHs(match.homeScore ?? ''); setAs(match.awayScore ?? '');
    setPenMode(false); setPenHs(''); setPenAs('');
    setEditing(true);
  }

  function startEditTime() {
    setTimeVal(match.time ?? '');
    setFieldNoVal(match.fieldNumber != null ? String(match.fieldNumber) : '');
    setEditingTime(true);
  }

  async function handleTimeSave() {
    if (!onSaveTime) return;
    const fieldNo = showFieldNo ? (fieldNoVal !== '' ? Number(fieldNoVal) : null) : undefined;
    await onSaveTime(match.id, timeVal || null, fieldNo);
    setEditingTime(false);
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
    <div className={`relative rounded-xl border p-3 sm:p-4 transition-all ${
      L
        ? `bg-white shadow-sm ${style.lightBorder}`
        : `bg-gradient-to-br ${style.card}`
    } ${match.completed ? '' : tbd ? 'opacity-50' : 'opacity-80 hover:opacity-100'}`}>

      {/* Time + optional group label */}
      {showTime && (match.time || groupLabel || (showFieldNo && match.fieldNumber != null)) && (
        <span className={`absolute -top-2.5 left-3 text-xs font-mono px-2 py-0.5 rounded-full border ${
          L ? 'bg-white border-gray-200 text-gray-500 shadow-sm' : 'bg-kz-950 border-white/10 text-white/50'
        }`}>
          {match.time}
          {showFieldNo && match.fieldNumber != null ? ` · Field ${match.fieldNumber}` : ''}
          {groupLabel ? ` · ${groupLabel}` : ''}
        </span>
      )}

      {/* Status badge */}
      {match.completed && (
        <span className={`absolute -top-2.5 right-3 text-xs px-2 py-0.5 rounded-full border ${
          hasPens
            ? (L ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-purple-900/80 border-purple-500/40 text-purple-300')
            : (L ? style.lightBadge : 'bg-kz-800 border-kz/40 text-kz-300')
        }`}>
          {hasPens ? 'Pens' : 'FT'}
        </span>
      )}

      {/* Teams + score */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`flex-1 text-right text-sm leading-tight truncate ${
          homeWins
            ? (L ? 'text-gray-900 font-semibold' : 'text-white font-semibold')
            : (L ? 'text-gray-900' : 'text-white/75')
        }`}>
          {tbd && !match.homeTeamId ? 'TBD' : homeName}
        </span>

        <div className="shrink-0 flex items-center gap-1">
          {editing ? (
            <>
              <input type="number" min="0" max="99" value={hs} onChange={e => setHs(e.target.value)} autoFocus
                className={`w-10 text-center border rounded-lg text-base font-mono py-1 focus:outline-none ${
                  L ? 'bg-white border-gray-300 text-gray-900 focus:border-amber-500' : 'bg-black/50 border-white/20 text-white focus:border-kz'
                }`} />
              <span className={`text-sm ${L ? 'text-gray-400' : 'text-white/30'}`}>–</span>
              <input type="number" min="0" max="99" value={as_} onChange={e => setAs(e.target.value)}
                className={`w-10 text-center border rounded-lg text-base font-mono py-1 focus:outline-none ${
                  L ? 'bg-white border-gray-300 text-gray-900 focus:border-amber-500' : 'bg-black/50 border-white/20 text-white focus:border-kz'
                }`} />
            </>
          ) : (
            <div className={`flex items-center gap-1.5 font-display text-xl sm:text-2xl ${
              match.completed
                ? (L ? style.lightAccent : style.accent)
                : (L ? 'text-gray-300' : 'text-white/25')
            }`}>
              <span>{match.completed ? match.homeScore : '—'}</span>
              <span className={`text-base ${L ? 'text-gray-300' : 'text-white/20'}`}>:</span>
              <span>{match.completed ? match.awayScore : '—'}</span>
            </div>
          )}
        </div>

        <span className={`flex-1 text-left text-sm leading-tight truncate ${
          awayWins
            ? (L ? 'text-gray-900 font-semibold' : 'text-white font-semibold')
            : (L ? 'text-gray-900' : 'text-white/75')
        }`}>
          {tbd && !match.awayTeamId ? 'TBD' : awayName}
        </span>
      </div>

      {/* Pen display */}
      {match.completed && hasPens && !editing && (
        <p className={`text-center text-xs mt-1 font-mono ${L ? 'text-purple-500' : 'text-purple-300/60'}`}>
          pens {match.penHomeScore}–{match.penAwayScore}
        </p>
      )}

      {/* Pen entry */}
      {editing && isKnockout && penMode && (
        <div className="mt-3 space-y-1.5">
          <p className={`text-center text-xs uppercase tracking-wider ${L ? 'text-purple-700' : 'text-purple-300'}`}>Penalty Shootout</p>
          <div className="flex items-center justify-center gap-2">
            <input type="number" min="0" max="20" value={penHs} onChange={e => setPenHs(e.target.value)} placeholder="0"
              className={`w-10 text-center border rounded-lg font-mono py-1 focus:outline-none ${
                L ? 'bg-white border-purple-300 text-gray-900 focus:border-purple-500' : 'bg-black/50 border-purple-500/40 text-white focus:border-purple-400'
              }`} />
            <span className={L ? 'text-gray-400' : 'text-white/30'}>–</span>
            <input type="number" min="0" max="20" value={penAs} onChange={e => setPenAs(e.target.value)} placeholder="0"
              className={`w-10 text-center border rounded-lg font-mono py-1 focus:outline-none ${
                L ? 'bg-white border-purple-300 text-gray-900 focus:border-purple-500' : 'bg-black/50 border-purple-500/40 text-white focus:border-purple-400'
              }`} />
          </div>
        </div>
      )}

      {/* Draw → pens prompt */}
      {editing && isKnockout && !penMode && hs !== '' && as_ !== '' && Number(hs) === Number(as_) && (
        <div className="mt-2 text-center">
          <button onClick={() => setPenMode(true)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              L
                ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                : 'bg-purple-900/40 border-purple-500/30 text-purple-300 hover:bg-purple-800/50'
            }`}>
            + Penalty Shootout
          </button>
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div className="mt-2.5 flex justify-center gap-1.5 flex-wrap">
          {editingTime ? (
            <>
              <input type="time" value={timeVal} onChange={e => setTimeVal(e.target.value)}
                className={`text-xs border rounded-lg px-2 py-1 font-mono focus:outline-none ${
                  L ? 'bg-white border-gray-300 text-gray-900 focus:border-amber-500' : 'bg-black/50 border-white/20 text-white focus:border-kz'
                }`} />
              {showFieldNo && (
                <input type="number" min="1" max="20" value={fieldNoVal}
                  onChange={e => setFieldNoVal(e.target.value)}
                  placeholder="Field#"
                  className={`w-16 text-xs border rounded-lg px-2 py-1 font-mono focus:outline-none ${
                    L ? 'bg-white border-gray-300 text-gray-900 focus:border-amber-500' : 'bg-black/50 border-white/20 text-white focus:border-kz'
                  }`} />
              )}
              <button onClick={() => setEditingTime(false)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  L ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-white/5 hover:bg-white/10 text-white/50'
                }`}>
                Cancel
              </button>
              <button onClick={handleTimeSave}
                className="text-xs px-3 py-1 rounded-lg bg-kz hover:bg-kz-400 text-white font-medium transition-colors">
                Save
              </button>
            </>
          ) : editing ? (
            <>
              <button onClick={() => { setEditing(false); setPenMode(false); }}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  L ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-white/5 hover:bg-white/10 text-white/50'
                }`}>
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
              {!tbd && (
                <>
                  {match.completed && (
                    <button onClick={handleReset}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                        L
                          ? 'bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600'
                          : 'bg-white/5 hover:bg-red-900/40 text-white/30 hover:text-red-400'
                      }`}>
                      ↺
                    </button>
                  )}
                  <button onClick={startEdit}
                    className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                      L
                        ? 'bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-gray-900 border-gray-200 hover:border-amber-300'
                        : 'bg-white/10 hover:bg-kz/30 text-white/60 hover:text-white border-transparent'
                    }`}>
                    {match.completed ? '✎ Edit' : '+ Score'}
                  </button>
                </>
              )}
              {onSaveTime && (
                <button onClick={startEditTime}
                  title="Edit time"
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    L
                      ? 'bg-gray-100 hover:bg-amber-100 text-gray-400 hover:text-amber-700'
                      : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70'
                  }`}>
                  ⏱
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
