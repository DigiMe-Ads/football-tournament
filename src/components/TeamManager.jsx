import { useState } from 'react';

// Light-theme group card styles (TeamManager is admin-only, always renders on white background)
const GROUP_STYLES = {
  A: { border: 'border-blue-200 bg-blue-50',    title: 'text-blue-700',   btn: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' },
  B: { border: 'border-sky-200 bg-sky-50',      title: 'text-sky-700',    btn: 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-300' },
  C: { border: 'border-indigo-200 bg-indigo-50', title: 'text-indigo-700', btn: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300' },
  D: { border: 'border-violet-200 bg-violet-50', title: 'text-violet-700', btn: 'bg-violet-100 hover:bg-violet-200 text-violet-700 border-violet-300' },
  E: { border: 'border-blue-200 bg-blue-50',    title: 'text-blue-700',   btn: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' },
  F: { border: 'border-sky-200 bg-sky-50',      title: 'text-sky-700',    btn: 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-300' },
  G: { border: 'border-indigo-200 bg-indigo-50', title: 'text-indigo-700', btn: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300' },
  H: { border: 'border-violet-200 bg-violet-50', title: 'text-violet-700', btn: 'bg-violet-100 hover:bg-violet-200 text-violet-700 border-violet-300' },
  I: { border: 'border-blue-200 bg-blue-50',    title: 'text-blue-700',   btn: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' },
  J: { border: 'border-sky-200 bg-sky-50',      title: 'text-sky-700',    btn: 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-300' },
  K: { border: 'border-indigo-200 bg-indigo-50', title: 'text-indigo-700', btn: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300' },
  L: { border: 'border-violet-200 bg-violet-50', title: 'text-violet-700', btn: 'bg-violet-100 hover:bg-violet-200 text-violet-700 border-violet-300' },
  M: { border: 'border-blue-200 bg-blue-50',    title: 'text-blue-700',   btn: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' },
  N: { border: 'border-sky-200 bg-sky-50',      title: 'text-sky-700',    btn: 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-300' },
  O: { border: 'border-indigo-200 bg-indigo-50', title: 'text-indigo-700', btn: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300' },
  P: { border: 'border-violet-200 bg-violet-50', title: 'text-violet-700', btn: 'bg-violet-100 hover:bg-violet-200 text-violet-700 border-violet-300' },
};

const fallback = { border: 'border-gray-200 bg-gray-50', title: 'text-gray-600', btn: 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300' };

export default function TeamManager({
  teams, letters, saveTeam, deleteTeam,
  onResetGroup, onResetAllTeams,
  onGenerateFixtures, initialized, locked = false,
}) {
  const [editingId,  setEditingId]  = useState(null);
  const [draftName,  setDraftName]  = useState('');
  const [adding,     setAdding]     = useState(null);
  const [newName,    setNewName]    = useState('');
  const [generating, setGenerating] = useState(false);
  const [resettingG, setResettingG] = useState(null);
  const [resettingAll, setResettingAll] = useState(false);

  const teamsIn = (g) => teams.filter(t => t.group === g).sort((a, b) => a.id.localeCompare(b.id));

  function nextSlot(g) {
    const used = teamsIn(g).map(t => {
      const num = t.id.replace(/^[A-Z]+/, '');
      return parseInt(num);
    });
    for (let i = 1; i <= 20; i++) if (!used.includes(i)) return `${g}${i}`;
    return null;
  }

  async function addTeam(g) {
    const name = newName.trim(); if (!name) return;
    const slotId = nextSlot(g); if (!slotId) return;
    await saveTeam({ id: slotId, group: g, name, shortName: name.slice(0,3).toUpperCase() });
    setNewName(''); setAdding(null);
  }

  async function saveEdit(team) {
    const name = draftName.trim(); if (!name) return;
    await saveTeam({ ...team, name, shortName: name.slice(0,3).toUpperCase() });
    setEditingId(null);
  }

  async function handleGenerate() {
    if (teams.length < 2) { alert('Add at least 2 teams before generating.'); return; }
    if (!confirm(`Generate fixtures for ${teams.length} teams?${initialized ? '\n\nThis OVERWRITES existing fixtures.' : ''}`)) return;
    setGenerating(true);
    await onGenerateFixtures();
    setGenerating(false);
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div>
          <h3 className="font-display text-xl text-gray-900 tracking-wider">Team Setup</h3>
          <p className="text-gray-400 text-xs mt-0.5">{teams.length} teams across {letters.filter(l => teamsIn(l).length > 0).length} groups</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { if (!confirm('Remove ALL teams?')) return; setResettingAll(true); await onResetAllTeams(); setResettingAll(false); }}
            disabled={locked || resettingAll || teams.length === 0}
            className="text-xs px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 transition-colors disabled:opacity-40">
            {resettingAll ? '…' : '✕ Clear All'}
          </button>
          <button onClick={handleGenerate} disabled={locked || teams.length < 2 || generating}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-40 ${
              initialized ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-kz hover:bg-kz-400 text-white'
            }`}>
            {generating ? 'Generating…' : initialized ? '⚠ Regenerate' : '🚀 Generate Fixtures'}
          </button>
        </div>
      </div>

      {locked && (
        <div className="px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 text-xs">
          🔒 Tournament ended — team setup is locked.
        </div>
      )}

      {!locked && initialized && (
        <div className="px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-300 text-orange-700 text-xs">
          ⚠ Fixtures exist — editing teams and regenerating will reset all scores.
        </div>
      )}

      {/* Groups grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {letters.map(g => {
          const gTeams = teamsIn(g);
          const st = GROUP_STYLES[g] || fallback;
          const isResetting = resettingG === g;

          return (
            <div key={g} className={`rounded-xl border p-4 ${st.border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`font-display text-xl tracking-wider ${st.title}`}>Group {g}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">{gTeams.length} team{gTeams.length !== 1 ? 's' : ''}</span>
                  {gTeams.length > 0 && (
                    <button onClick={async () => { if (!confirm(`Clear Group ${g}?`)) return; setResettingG(g); await onResetGroup(g); setResettingG(null); }}
                      disabled={locked || isResetting}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${st.btn} disabled:opacity-40`}>
                      {isResetting ? '…' : '↺'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {gTeams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                    <span className="text-gray-400 text-xs font-mono w-5 shrink-0">{team.id}</span>
                    {editingId === team.id ? (
                      <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') saveEdit(team); if (e.key==='Escape') setEditingId(null); }}
                        className="flex-1 bg-transparent border-b border-kz text-gray-900 text-sm focus:outline-none py-0.5" />
                    ) : (
                      <span className="flex-1 text-gray-800 text-sm truncate">{team.name}</span>
                    )}
                    {editingId === team.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => saveEdit(team)} className="text-kz hover:text-kz-400 text-sm px-1">✓</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
                      </div>
                    ) : !locked && (
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={() => { setEditingId(team.id); setDraftName(team.name); }}
                          className="text-gray-300 hover:text-gray-600 text-xs px-1.5 py-1 rounded hover:bg-gray-100 transition-colors">✎</button>
                        <button onClick={async () => { if (!confirm(`Remove ${team.name}?`)) return; await deleteTeam(team.id); }}
                          className="text-gray-300 hover:text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50 transition-colors">✕</button>
                      </div>
                    )}
                  </div>
                ))}
                {gTeams.length === 0 && <p className="text-gray-300 text-xs text-center py-2 italic">No teams yet</p>}
              </div>

              {adding === g ? (
                <div className="flex gap-2">
                  <input autoFocus placeholder="Team name…" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter') addTeam(g); if (e.key==='Escape') { setAdding(null); setNewName(''); } }}
                    className="flex-1 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm px-3 py-1.5 focus:outline-none focus:border-kz transition-colors" />
                  <button onClick={() => addTeam(g)} disabled={!newName.trim()}
                    className="bg-kz hover:bg-kz-400 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0">Add</button>
                  <button onClick={() => { setAdding(null); setNewName(''); }} className="text-gray-400 hover:text-gray-600 text-xs px-1.5">✕</button>
                </div>
              ) : !locked && (
                <button onClick={() => { setAdding(g); setNewName(''); }}
                  className="w-full text-left text-gray-400 hover:text-gray-600 text-xs py-2 px-3 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors">
                  + Add team to Group {g}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
