export default function StandingsTable({ standings, group }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
        <span className="font-display text-xl text-kz-400 tracking-wider">Group {group}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
              <th className="text-left px-3 py-2 w-6">#</th>
              <th className="text-left px-3 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GF</th>
              <th className="text-center px-2 py-2">GA</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className="text-center px-2 py-2 text-white/60 font-bold">Pts</th>
              <th className="text-center px-2 py-2 text-white/20 text-xs">→</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.teamId} className={`border-b border-white/5 last:border-0 transition-colors ${i < 2 ? 'bg-kz/10' : ''}`}>
                <td className="px-3 py-2.5 text-white/30 font-mono text-xs">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-white/90 max-w-[100px] truncate">{row.teamName}</td>
                <td className="text-center px-2 py-2.5 text-white/60 font-mono text-xs">{row.played}</td>
                <td className="text-center px-2 py-2.5 text-white/60 font-mono text-xs">{row.won}</td>
                <td className="text-center px-2 py-2.5 text-white/60 font-mono text-xs">{row.drawn}</td>
                <td className="text-center px-2 py-2.5 text-white/60 font-mono text-xs">{row.lost}</td>
                <td className="text-center px-2 py-2.5 text-white/60 font-mono text-xs">{row.gf}</td>
                <td className="text-center px-2 py-2.5 text-white/60 font-mono text-xs">{row.ga}</td>
                <td className={`text-center px-2 py-2.5 font-mono text-xs ${row.gd > 0 ? 'text-kz-300' : row.gd < 0 ? 'text-red-400' : 'text-white/30'}`}>
                  {row.gd > 0 ? '+' : ''}{row.gd}
                </td>
                <td className="text-center px-2 py-2.5 font-bold text-white">{row.points}</td>
                <td className={`text-center px-2 py-2.5 text-xs font-semibold ${
                  i === 0 || i === 1 ? 'text-kz-gold' :
                  i === 2 || i === 3 ? 'text-violet-400' : 'text-white/20'
                }`}>
                  {i < 2 ? 'Cup' : i < 4 ? 'Shield' : ''}
                </td>
              </tr>
            ))}
            {standings.length === 0 && (
              <tr><td colSpan={11} className="text-center text-white/20 text-xs py-4">No matches played</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-white/5 flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-kz/60" />
          <span className="text-xs text-white/30">1st–2nd → Cup</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-400/50" />
          <span className="text-xs text-white/30">3rd–4th → Shield</span>
        </div>
      </div>
    </div>
  );
}