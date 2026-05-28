import { useState } from 'react';

function formatTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// BackupRestorePanel is admin-only — always renders on the white admin background
export default function BackupRestorePanel({ ageGroup, createBackup, fetchBackups, restoreFromBackup, scheme }) {
  const [open,          setOpen]          = useState(false);
  const [backups,       setBackups]       = useState([]);
  const [loadingList,   setLoadingList]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [restoringId,   setRestoringId]   = useState(null);
  const [saveStatus,    setSaveStatus]    = useState('idle');

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
        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-700 transition-colors"
      >
        ↩ Backups
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">Backups</span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs" style={{ color: scheme.primary }}>{ageGroup}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            {saving ? <span className="animate-spin inline-block">⟳</span> : '💾'}
            {saving ? 'Saving…' : saveStatus === 'ok' ? 'Saved ✓' : 'Save backup'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Backup list */}
      <div className="px-4 py-3">
        {loadingList ? (
          <p className="text-gray-400 text-xs text-center py-4">Loading snapshots…</p>
        ) : backups.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <p className="text-3xl">📭</p>
            <p className="text-gray-500 text-xs">No backups yet.</p>
            <p className="text-gray-400 text-xs">A backup is auto-saved before every hard reset.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {backups.map(b => {
              const isAuto      = b.label?.startsWith('Auto');
              const isRestoring = restoringId === b.id;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="shrink-0 text-base">{isAuto ? '🔄' : '💾'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-xs font-medium truncate">{b.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{formatTs(b.timestamp)}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {b.teams?.length ?? 0} teams · {b.matches?.length ?? 0} fixtures · {b.knockouts?.length ?? 0} knockouts
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(b)}
                    disabled={!!restoringId}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-700 transition-colors disabled:opacity-40 flex items-center gap-1"
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

        <p className="text-gray-400 text-xs mt-3 text-center">
          Hard Reset always auto-saves a snapshot before clearing data.
          Restore also saves a snapshot of the current state first.
        </p>
      </div>
    </div>
  );
}
