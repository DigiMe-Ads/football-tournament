import { useState } from 'react';

const GROUP_STYLES = {
  A: { border: 'border-blue-400/40 bg-blue-400/5',   title: 'text-blue-400',   btn: 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 border-blue-400/30' },
  B: { border: 'border-sky-400/40 bg-sky-400/5',     title: 'text-sky-400',    btn: 'bg-sky-400/20 hover:bg-sky-400/30 text-sky-300 border-sky-400/30' },
  C: { border: 'border-indigo-400/40 bg-indigo-400/5',title: 'text-indigo-400', btn: 'bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-300 border-indigo-400/30' },
  D: { border: 'border-violet-400/40 bg-violet-400/5',title: 'text-violet-400', btn: 'bg-violet-400/20 hover:bg-violet-400/30 text-violet-300 border-violet-400/30' },
  E: { border: 'border-blue-400/40 bg-blue-400/5',   title: 'text-blue-400',   btn: 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 border-blue-400/30' },
  F: { border: 'border-sky-400/40 bg-sky-400/5',     title: 'text-sky-400',    btn: 'bg-sky-400/20 hover:bg-sky-400/30 text-sky-300 border-sky-400/30' },
  G: { border: 'border-indigo-400/40 bg-indigo-400/5',title: 'text-indigo-400', btn: 'bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-300 border-indigo-400/30' },
  H: { border: 'border-violet-400/40 bg-violet-400/5',title: 'text-violet-400', btn: 'bg-violet-400/20 hover:bg-violet-400/30 text-violet-300 border-violet-400/30' },
  I: { border: 'border-blue-400/40 bg-blue-400/5',   title: 'text-blue-400',   btn: 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 border-blue-400/30' },
  J: { border: 'border-sky-400/40 bg-sky-400/5',     title: 'text-sky-400',    btn: 'bg-sky-400/20 hover:bg-sky-400/30 text-sky-300 border-sky-400/30' },
  K: { border: 'border-indigo-400/40 bg-indigo-400/5',title: 'text-indigo-400', btn: 'bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-300 border-indigo-400/30' },
  L: { border: 'border-violet-400/40 bg-violet-400/5',title: 'text-violet-400', btn: 'bg-violet-400/20 hover:bg-violet-400/30 text-violet-300 border-violet-400/30' },
  M: { border: 'border-blue-400/40 bg-blue-400/5',   title: 'text-blue-400',   btn: 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 border-blue-400/30' },
  N: { border: 'border-sky-400/40 bg-sky-400/5',     title: 'text-sky-400',    btn: 'bg-sky-400/20 hover:bg-sky-400/30 text-sky-300 border-sky-400/30' },
  O: { border: 'border-indigo-400/40 bg-indigo-400/5',title: 'text-indigo-400', btn: 'bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-300 border-indigo-400/30' },
  P: { border: 'border-violet-400/40 bg-violet-400/5',title: 'text-violet-400', btn: 'bg-violet-400/20 hover:bg-violet-400/30 text-violet-300 border-violet-400/30' },
};

const fallback = { border: 'border-white/10 bg-white/5', title: 'text-white/60', btn: 'bg-white/10 text-white/40 border-white/10' };

export default function TeamManager({
  teams, letters, saveTeam, deleteTeam,
  onResetGroup, onResetAllTeams,
  onGenerateFixtures, initialized,
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
    // t.id is like "A1", "A2" — strip the group letter prefix
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <h3 className="font-display text-xl text-white tracking-wider">Team Setup</h3>
          <p className="text-white/40 text-xs mt-0.5">{teams.length} teams across {letters.filter(l => teamsIn(l).length > 0).length} groups</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { if (!confirm('Remove ALL teams?')) return; setResettingAll(true); await onResetAllTeams(); setResettingAll(false); }}
            disabled={resettingAll || teams.length === 0}
            className="text-xs px-3 py-2 rounded-lg bg-red-900/30 hover:bg-red-800/50 border border-red-500/30 text-red-400 transition-colors disabled:opacity-40">
            {resettingAll ? '…' : '✕ Clear All'}
          </button>
          <button onClick={handleGenerate} disabled={teams.length < 2 || generating}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-40 ${
              initialized ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-kz hover:bg-kz-400 text-white'
            }`}>
            {generating ? 'Generating…' : initialized ? '⚠ Regenerate' : '🚀 Generate Fixtures'}
          </button>
        </div>
      </div>

      {initialized && (
        <div className="px-4 py-2.5 rounded-xl bg-orange-900/20 border border-orange-500/30 text-orange-300 text-xs">
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
                  <span className="text-white/25 text-xs">{gTeams.length} team{gTeams.length !== 1 ? 's' : ''}</span>
                  {gTeams.length > 0 && (
                    <button onClick={async () => { if (!confirm(`Clear Group ${g}?`)) return; setResettingG(g); await onResetGroup(g); setResettingG(null); }}
                      disabled={isResetting}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${st.btn} disabled:opacity-40`}>
                      {isResetting ? '…' : '↺'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {gTeams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                    <span className="text-white/25 text-xs font-mono w-5 shrink-0">{team.id}</span>
                    {editingId === team.id ? (
                      <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') saveEdit(team); if (e.key==='Escape') setEditingId(null); }}
                        className="flex-1 bg-transparent border-b border-kz text-white text-sm focus:outline-none py-0.5" />
                    ) : (
                      <span className="flex-1 text-white/85 text-sm truncate">{team.name}</span>
                    )}
                    {editingId === team.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => saveEdit(team)} className="text-kz-300 hover:text-white text-sm px-1">✓</button>
                        <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/60 text-sm px-1">✕</button>
                      </div>
                    ) : (
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={() => { setEditingId(team.id); setDraftName(team.name); }}
                          className="text-white/25 hover:text-white/70 text-xs px-1.5 py-1 rounded hover:bg-white/10 transition-colors">✎</button>
                        <button onClick={async () => { if (!confirm(`Remove ${team.name}?`)) return; await deleteTeam(team.id); }}
                          className="text-white/20 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-red-900/30 transition-colors">✕</button>
                      </div>
                    )}
                  </div>
                ))}
                {gTeams.length === 0 && <p className="text-white/20 text-xs text-center py-2 italic">No teams yet</p>}
              </div>

              {adding === g ? (
                <div className="flex gap-2">
                  <input autoFocus placeholder="Team name…" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key==='Enter') addTeam(g); if (e.key==='Escape') { setAdding(null); setNewName(''); } }}
                    className="flex-1 bg-black/30 border border-white/20 rounded-lg text-white text-sm px-3 py-1.5 focus:outline-none focus:border-kz transition-colors" />
                  <button onClick={() => addTeam(g)} disabled={!newName.trim()}
                    className="bg-kz hover:bg-kz-400 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0">Add</button>
                  <button onClick={() => { setAdding(null); setNewName(''); }} className="text-white/30 hover:text-white/60 text-xs px-1.5">✕</button>
                </div>
              ) : (
                <button onClick={() => { setAdding(g); setNewName(''); }}
                  className="w-full text-left text-white/25 hover:text-white/50 text-xs py-2 px-3 border border-dashed border-white/10 hover:border-white/20 rounded-lg transition-colors">
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