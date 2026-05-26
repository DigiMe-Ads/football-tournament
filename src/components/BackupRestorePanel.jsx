import { useState } from 'react';

function formatTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function BackupRestorePanel({ ageGroup, createBackup, fetchBackups, restoreFromBackup, scheme }) {
  const [open,          setOpen]          = useState(false);
  const [backups,       setBackups]       = useState([]);
  const [loadingList,   setLoadingList]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [restoringId,   setRestoringId]   = useState(null);
  const [saveStatus,    setSaveStatus]    = useState('idle'); // idle | ok | err

  async function openPanel() {
    setOpen(true);
    await refreshList();
  }

  async function refreshList() {
    setLoadingList(true);
    try {
      const list = await fetchBackups();
      setBackups(list);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await createBackup('Manual backup');
      setSaveStatus('ok');
      await refreshList();
    } catch {
      setSaveStatus('err');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }

  async function handleRestore(backup) {
    const timeStr = formatTs(backup.timestamp);
    if (!confirm(
      `Restore "${backup.label}" saved at ${timeStr}?\n\n` +
      `This will replace all current ${ageGroup} data (teams, fixtures, scores) with the snapshot.\n\n` +
      `A new backup of the current state will be saved first.`
    )) return;

    setRestoringId(backup.id);
    try {
      // Safety: snapshot current state before overwriting
      await createBackup(`Auto (before restore to: ${timeStr})`);
      await restoreFromBackup(backup);
    } catch (err) {
      console.error('Restore failed:', err);
      alert('Restore failed — check console for details.');
    } finally {
      setRestoringId(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={openPanel}
        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-indigo-300 transition-colors"
      >
        ↩ Backups
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Backups</span>
          <span className="text-white/25 text-xs">·</span>
          <span className="text-xs" style={{ color: scheme.primary }}>{ageGroup}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-400 transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            {saving ? <span className="animate-spin inline-block">⟳</span> : '💾'}
            {saving ? 'Saving…' : saveStatus === 'ok' ? 'Saved ✓' : 'Save backup'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-white/30 hover:text-white/70 text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      </div>

      {/* Backup list */}
      <div className="px-4 py-3">
        {loadingList ? (
          <p className="text-white/30 text-xs text-center py-4">Loading snapshots…</p>
        ) : backups.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <p className="text-3xl">📭</p>
            <p className="text-white/40 text-xs">No backups yet.</p>
            <p className="text-white/25 text-xs">A backup is auto-saved before every hard reset.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {backups.map(b => {
              const isAuto   = b.label?.startsWith('Auto');
              const isRestoring = restoringId === b.id;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/8 hover:border-white/15 transition-colors"
                >
                  {/* Icon */}
                  <div className="shrink-0 text-base">{isAuto ? '🔄' : '💾'}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs font-medium truncate">{b.label}</p>
                    <p className="text-white/35 text-xs mt-0.5">{formatTs(b.timestamp)}</p>
                    <p className="text-white/20 text-xs mt-0.5">
                      {b.teams?.length ?? 0} teams · {b.matches?.length ?? 0} fixtures · {b.knockouts?.length ?? 0} knockouts
                    </p>
                  </div>

                  {/* Restore button */}
                  <button
                    onClick={() => handleRestore(b)}
                    disabled={!!restoringId}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 text-indigo-300 transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    {isRestoring
                      ? <><span className="animate-spin inline-block">⟳</span> Restoring…</>
                      : '↩ Restore'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-white/20 text-xs mt-3 text-center">
          Hard Reset always auto-saves a snapshot before clearing data.
          Restore also saves a snapshot of the current state first.
        </p>
      </div>
    </div>
  );
}