import { useState } from 'react';
import { exportTournamentToExcel } from '../lib/exportExcel';

export default function ExportButton() {
  const [state, setState] = useState('idle'); // idle | loading | done | error

  async function handleExport() {
    setState('loading');
    try {
      await exportTournamentToExcel();
      setState('done');
      setTimeout(() => setState('idle'), 2500);
    } catch (err) {
      console.error('Export failed:', err);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  const labels = {
    idle:    { icon: '📊', text: 'Export Excel' },
    loading: { icon: '⟳',  text: 'Exporting…'  },
    done:    { icon: '✓',  text: 'Downloaded!'  },
    error:   { icon: '✕',  text: 'Failed'       },
  };

  const colors = {
    idle:    'border-white/15 text-white/50 hover:border-emerald-500/50 hover:text-emerald-300',
    loading: 'border-white/10 text-white/30 cursor-not-allowed',
    done:    'border-emerald-500/50 text-emerald-400',
    error:   'border-red-500/50 text-red-400',
  };

  const { icon, text } = labels[state];

  return (
    <button
      onClick={handleExport}
      disabled={state === 'loading'}
      className={`text-xs border px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${colors[state]}`}
      title="Export full tournament draw to Excel"
    >
      <span className={state === 'loading' ? 'animate-spin inline-block' : ''}>{icon}</span>
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
}