export default function StandingsTable({ standings, group, scheme, qualifyTop = 2 }) {
  const s = scheme || {
    primary: '#F5A623',
    primaryLight: '#f7bc55',
    primaryDim: 'rgba(43,78,187,0.10)',
  };

  const isGirls = qualifyTop === 4;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
        <span className="font-display text-xl tracking-wider" style={{ color: s.primaryLight }}>Group {group}</span>
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
            {standings.map((row, i) => {
              const inCup    = i < qualifyTop;
              const inShield = !isGirls && (i === 2 || i === 3);
              return (
                <tr
                  key={row.teamId}
                  className="border-b border-white/5 last:border-0 transition-colors"
                  style={{ background: inCup ? s.primaryDim : 'transparent' }}
                >
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
                  <td
                    className="text-center px-2 py-2.5 text-xs font-semibold"
                    style={{
                      color: inCup ? s.primary : inShield ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {inCup ? 'Cup' : inShield ? 'Shield' : ''}
                  </td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr><td colSpan={11} className="text-center text-white/20 text-xs py-4">No matches played</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-white/5 flex gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: s.primary }} />
          <span className="text-xs text-white/30">
            {isGirls ? '1st vs 4th · 2nd vs 3rd → Cup Semi Finals' : '1st–2nd → Cup / Plate'}
          </span>
        </div>
        {!isGirls && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-400/50" />
            <span className="text-xs text-white/30">3rd–4th → Shield / Bowl</span>
          </div>
        )}
      </div>
    </div>
  );
}
