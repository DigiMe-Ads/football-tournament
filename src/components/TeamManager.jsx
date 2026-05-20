import { useState } from 'react';
import { GROUPS } from '../lib/tournament';

const GROUP_COLORS = {
  A: 'border-amber-500/40 bg-amber-500/5',
  B: 'border-sky-500/40 bg-sky-500/5',
  C: 'border-violet-500/40 bg-violet-500/5',
  D: 'border-rose-500/40 bg-rose-500/5',
};
const GROUP_TITLE = {
  A: 'text-amber-400', B: 'text-sky-400', C: 'text-violet-400', D: 'text-rose-400',
};
const GROUP_BTN = {
  A: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30',
  B: 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/30',
  C: 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-violet-500/30',
  D: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30',
};

export default function TeamManager({
  teams, saveTeam, deleteTeam,
  onGenerateFixtures, onResetGroup, onResetAllTeams,
  initialized,
}) {
  const [editingId,  setEditingId]  = useState(null);
  const [draftName,  setDraftName]  = useState('');
  const [adding,     setAdding]     = useState(null); // group letter currently open
  const [newName,    setNewName]    = useState('');
  const [generating, setGenerating] = useState(false);
  const [resettingGroup, setResettingGroup] = useState(null);
  const [resettingAll,   setResettingAll]   = useState(false);

  const teamsInGroup = (group) =>
    teams.filter(t => t.group === group).sort((a, b) => a.id.localeCompare(b.id));

  function nextSlotInGroup(group) {
    const used = teamsInGroup(group).map(t => parseInt(t.id[1]));
    for (let i = 1; i <= 4; i++) {
      if (!used.includes(i)) return `${group}${i}`;
    }
    return null; // group full
  }

  // ── Add ───────────────────────────────────────────────────────────────────
  async function handleAddTeam(group) {
    const name = newName.trim();
    if (!name) return;
    const slotId = nextSlotInGroup(group);
    if (!slotId) return;
    await saveTeam({
      id: slotId,
      group,
      name,
      shortName: name.slice(0, 3).toUpperCase(),
    });
    setNewName('');
    setAdding(null);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function startEdit(team) {
    setEditingId(team.id);
    setDraftName(team.name);
  }

  async function handleSaveEdit(team) {
    const name = draftName.trim();
    if (!name) return;
    await saveTeam({ ...team, name, shortName: name.slice(0, 3).toUpperCase() });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftName('');
  }

  // ── Delete single team ────────────────────────────────────────────────────
  async function handleDeleteTeam(team) {
    if (!confirm(`Remove "${team.name}" from Group ${team.group}?`)) return;
    await deleteTeam(team.id);
  }

  // ── Reset a whole group (delete all teams in it) ──────────────────────────
  async function handleResetGroup(group) {
    if (!confirm(`Remove all teams from Group ${group}? This cannot be undone.`)) return;
    setResettingGroup(group);
    await onResetGroup(group);
    setResettingGroup(null);
  }

  // ── Reset all teams ───────────────────────────────────────────────────────
  async function handleResetAllTeams() {
    if (!confirm('Remove ALL teams from every group? This cannot be undone.')) return;
    setResettingAll(true);
    await onResetAllTeams();
    setResettingAll(false);
  }

  // ── Generate fixtures ─────────────────────────────────────────────────────
  async function handleGenerate() {
    if (teams.length < 4) {
      alert('Add at least 4 teams (1 per group) before generating fixtures.');
      return;
    }
    if (!confirm(`Generate fixtures for ${teams.length} teams?${initialized ? '\n\nThis will OVERWRITE existing fixtures and reset all scores.' : ''}`)) return;
    setGenerating(true);
    await onGenerateFixtures();
    setGenerating(false);
  }

  const totalTeams = teams.length;
  const groupsFull = GROUPS.filter(g => teamsInGroup(g).length >= 4).length;

  return (
    <div className="space-y-6">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <h3 className="font-display text-2xl text-white tracking-wider">Team Setup</h3>
          <p className="text-white/40 text-sm mt-0.5">
            {totalTeams}/16 teams · {groupsFull}/4 groups full
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleResetAllTeams}
            disabled={resettingAll || totalTeams === 0}
            className="text-xs px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-red-400 transition-colors disabled:opacity-40"
          >
            {resettingAll ? 'Clearing…' : '✕ Clear All Teams'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={teams.length < 4 || generating}
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 ${
              initialized
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {generating ? 'Generating…' : initialized ? '⚠ Regenerate Fixtures' : '🚀 Generate Fixtures'}
          </button>
        </div>
      </div>

      {initialized && (
        <div className="px-4 py-3 rounded-xl bg-orange-900/20 border border-orange-500/30 text-orange-300 text-sm">
          ⚠ Fixtures already exist. Editing teams and regenerating will reset all match scores.
        </div>
      )}

      {/* ── Groups grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GROUPS.map(group => {
          const groupTeams   = teamsInGroup(group);
          const isFull       = groupTeams.length >= 4;
          const isAddingHere = adding === group;
          const isResetting  = resettingGroup === group;

          return (
            <div key={group} className={`rounded-xl border p-4 ${GROUP_COLORS[group]}`}>

              {/* Group header */}
              <div className="flex items-center justify-between mb-3">
                <span className={`font-display text-2xl tracking-wider ${GROUP_TITLE[group]}`}>
                  Group {group}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs">{groupTeams.length}/4</span>
                  {groupTeams.length > 0 && (
                    <button
                      onClick={() => handleResetGroup(group)}
                      disabled={isResetting}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${GROUP_BTN[group]} disabled:opacity-40`}
                    >
                      {isResetting ? '…' : '↺ Reset'}
                    </button>
                  )}
                </div>
              </div>

              {/* Team list */}
              <div className="space-y-2 mb-3">
                {groupTeams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                    {/* Slot ID */}
                    <span className="text-white/30 text-xs font-mono w-6 shrink-0">{team.id}</span>

                    {/* Name / edit input */}
                    {editingId === team.id ? (
                      <input
                        autoFocus
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  handleSaveEdit(team);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="flex-1 bg-transparent border-b border-green-500 text-white text-sm focus:outline-none py-0.5"
                      />
                    ) : (
                      <span className="flex-1 text-white/90 text-sm truncate">{team.name}</span>
                    )}

                    {/* Action buttons */}
                    {editingId === team.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleSaveEdit(team)}
                          className="text-green-400 hover:text-green-300 text-sm px-1 transition-colors"
                          title="Save"
                        >✓</button>
                        <button
                          onClick={cancelEdit}
                          className="text-white/30 hover:text-white/60 text-sm px-1 transition-colors"
                          title="Cancel"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(team)}
                          className="text-white/30 hover:text-white/80 text-xs px-1.5 py-1 rounded hover:bg-white/10 transition-colors"
                          title="Rename team"
                        >✎</button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          className="text-white/20 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-red-900/30 transition-colors"
                          title="Remove team"
                        >✕</button>
                      </div>
                    )}
                  </div>
                ))}

                {groupTeams.length === 0 && (
                  <p className="text-white/20 text-xs text-center py-3 italic">No teams in this group</p>
                )}
              </div>

              {/* Add team row */}
              {!isFull && (
                isAddingHere ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      placeholder="Team name…"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleAddTeam(group);
                        if (e.key === 'Escape') { setAdding(null); setNewName(''); }
                      }}
                      className="flex-1 bg-black/30 border border-white/20 rounded-lg text-white text-sm px-3 py-1.5 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <button
                      onClick={() => handleAddTeam(group)}
                      disabled={!newName.trim()}
                      className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >Add</button>
                    <button
                      onClick={() => { setAdding(null); setNewName(''); }}
                      className="text-white/30 hover:text-white/60 text-xs px-2 transition-colors"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAdding(group); setNewName(''); }}
                    className="w-full text-left text-white/30 hover:text-white/60 text-xs py-2 px-3 border border-dashed border-white/10 hover:border-white/25 rounded-lg transition-colors"
                  >
                    + Add team to Group {group}
                  </button>
                )
              )}

              {isFull && !isAddingHere && (
                <p className="text-center text-white/20 text-xs py-1 italic">Group full (4/4)</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}