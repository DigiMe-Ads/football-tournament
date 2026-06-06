export default function StandingsTable({ standings, group, scheme, qualifyTop = 2, isGirls = false, isLight = false }) {
  const s = scheme || {
    primary: '#F5A623',
    primaryLight: '#f7bc55',
    primaryDim: 'rgba(43,78,187,0.10)',
  };

  // On white background, use the saturated primary for headings (primaryLight is too pale)
  const headingColor = isLight ? s.primary : s.primaryLight;

  return (
    <div className={`rounded-xl overflow-hidden border ${
      isLight ? 'border-gray-200 bg-white shadow-sm' : 'border-white/10 bg-black/20'
    }`}>
      <div className={`px-4 py-2.5 border-b ${
        isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'
      }`}>
        <span className="font-display text-xl tracking-wider" style={{ color: headingColor }}>Group {group}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className={`text-xs uppercase tracking-wider border-b ${
              isLight ? 'text-gray-400 border-gray-100' : 'text-white/40 border-white/5'
            }`}>
              <th className="text-left px-3 py-2 w-6">#</th>
              <th className="text-left px-3 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GF</th>
              <th className="text-center px-2 py-2">GA</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className={`text-center px-2 py-2 font-bold ${isLight ? 'text-gray-600' : 'text-white/60'}`}>Pts</th>
              <th className={`text-center px-2 py-2 text-xs ${isLight ? 'text-gray-300' : 'text-white/20'}`}>→</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const inCup    = i < qualifyTop;
              const inShield = !isGirls && (i === 2 || i === 3);
              return (
                <tr
                  key={row.teamId}
                  className={`border-b last:border-0 transition-colors ${
                    isLight ? 'border-gray-100' : 'border-white/5'
                  }`}
                  style={{ background: inCup ? s.primaryDim : 'transparent' }}
                >
                  <td className={`px-3 py-2.5 font-mono text-xs ${isLight ? 'text-gray-400' : 'text-white/30'}`}>{i + 1}</td>
                  <td className={`px-3 py-2.5 font-medium max-w-[100px] truncate ${isLight ? 'text-gray-800' : 'text-white/90'}`}>{row.teamName}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${isLight ? 'text-gray-500' : 'text-white/60'}`}>{row.played}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${isLight ? 'text-gray-500' : 'text-white/60'}`}>{row.won}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${isLight ? 'text-gray-500' : 'text-white/60'}`}>{row.drawn}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${isLight ? 'text-gray-500' : 'text-white/60'}`}>{row.lost}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${isLight ? 'text-gray-500' : 'text-white/60'}`}>{row.gf}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${isLight ? 'text-gray-500' : 'text-white/60'}`}>{row.ga}</td>
                  <td className={`text-center px-2 py-2.5 font-mono text-xs ${
                    row.gd > 0
                      ? (isLight ? 'text-teal-600' : 'text-kz-300')
                      : row.gd < 0
                        ? (isLight ? 'text-red-600' : 'text-red-400')
                        : (isLight ? 'text-gray-400' : 'text-white/30')
                  }`}>
                    {row.gd > 0 ? '+' : ''}{row.gd}
                  </td>
                  <td className={`text-center px-2 py-2.5 font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{row.points}</td>
                  <td
                    className="text-center px-2 py-2.5 text-xs font-semibold"
                    style={{
                      color: inCup
                        ? s.primary
                        : inShield
                          ? (isLight ? '#7c3aed' : '#a78bfa')
                          : (isLight ? '#d1d5db' : 'rgba(255,255,255,0.2)'),
                    }}
                  >
                    {inCup ? 'Cup' : inShield ? 'Shield' : ''}
                  </td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr><td colSpan={11} className={`text-center text-xs py-4 ${isLight ? 'text-gray-300' : 'text-white/20'}`}>No matches played</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={`px-4 py-2 border-t flex gap-4 flex-wrap ${isLight ? 'border-gray-100' : 'border-white/5'}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: s.primary }} />
          <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
            {isGirls ? '1st–2nd → Cup Semi Finals' : '1st–2nd → Cup / Plate'}
          </span>
        </div>
        {!isGirls && (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isLight ? 'bg-violet-400' : 'bg-violet-400/50'}`} />
            <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-white/30'}`}>3rd–4th → Shield / Bowl</span>
          </div>
        )}
      </div>
    </div>
  );
}
