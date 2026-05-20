export default function StandingsTable({ standings, group }) {
  const posColors  = ['text-amber-400', 'text-sky-400', 'text-violet-400', 'text-rose-400'];
  const posLabels  = ['Cup', 'Cup', 'Plate', 'Bowl'];

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2">
        <span className="font-display text-xl text-green-400 tracking-wider">Group {group}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="text-left px-4 py-2 w-8">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className="text-center px-2 py-2 font-bold text-white/60">Pts</th>
              <th className="text-center px-2 py-2 text-white/20">→</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.teamId} className={`border-b border-white/5 last:border-0 ${i < 2 ? 'bg-green-500/5' : ''}`}>
                <td className="px-4 py-3 text-white/40 font-mono text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-white/90">{row.teamName}</td>
                <td className="text-center px-2 py-3 text-white/60 font-mono">{row.played}</td>
                <td className="text-center px-2 py-3 text-white/60 font-mono">{row.won}</td>
                <td className="text-center px-2 py-3 text-white/60 font-mono">{row.drawn}</td>
                <td className="text-center px-2 py-3 text-white/60 font-mono">{row.lost}</td>
                <td className={`text-center px-2 py-3 font-mono ${row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-white/40'}`}>
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="text-center px-2 py-3 font-bold text-white">{row.points}</td>
                <td className={`text-center px-2 py-3 text-xs font-medium ${posColors[i] || 'text-white/30'}`}>
                  {posLabels[i] || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-white/5 flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400/60" />
          <span className="text-xs text-white/40">Advance to Cup</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-400/40" />
          <span className="text-xs text-white/40">3rd → Plate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-400/40" />
          <span className="text-xs text-white/40">4th → Bowl</span>
        </div>
      </div>
    </div>
  );
}