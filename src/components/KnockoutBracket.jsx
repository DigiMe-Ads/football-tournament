import MatchCard from './MatchCard';

const segStyles = {
  cup: {
    icon: '🏆', title: 'text-kz-gold', badge: 'bg-kz-gold/20 text-kz-gold border-kz-gold/30',
    lightBadge: 'bg-amber-100 text-amber-700 border-amber-300',
    border: 'rgba(245,166,35,0.45)', titleHex: '#F5A623', glowColor: 'rgba(245,166,35,0.35)',
    bg1: 'rgba(245,166,35,0.22)', bg2: 'rgba(245,130,10,0.10)',
    lightBg1: 'rgba(245,166,35,0.10)', lightBg2: 'rgba(245,166,35,0.05)',
  },
  plate: {
    icon: '🥈', title: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    lightBadge: 'bg-sky-100 text-sky-700 border-sky-400',
    border: 'rgba(14,165,233,0.45)', titleHex: '#38bdf8', glowColor: 'rgba(14,165,233,0.35)',
    bg1: 'rgba(14,165,233,0.20)', bg2: 'rgba(2,132,199,0.10)',
    lightBg1: 'rgba(14,165,233,0.08)', lightBg2: 'rgba(2,132,199,0.04)',
  },
  shield: {
    icon: '🛡️', title: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    lightBadge: 'bg-violet-100 text-violet-700 border-violet-400',
    border: 'rgba(139,92,246,0.45)', titleHex: '#a78bfa', glowColor: 'rgba(139,92,246,0.35)',
    bg1: 'rgba(139,92,246,0.20)', bg2: 'rgba(109,40,217,0.10)',
    lightBg1: 'rgba(139,92,246,0.08)', lightBg2: 'rgba(109,40,217,0.04)',
  },
  bowl: {
    icon: '🏅', title: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    lightBadge: 'bg-rose-100 text-rose-700 border-rose-400',
    border: 'rgba(244,63,94,0.45)', titleHex: '#fb7185', glowColor: 'rgba(244,63,94,0.35)',
    bg1: 'rgba(244,63,94,0.20)', bg2: 'rgba(190,18,60,0.10)',
    lightBg1: 'rgba(244,63,94,0.08)', lightBg2: 'rgba(190,18,60,0.04)',
  },
};

const BURST = [
  { x:  '0px',   y: '-85px',  d: '0.00s', dur: '1.50s', c: '#FFD700', s: 9 },
  { x:  '60px',  y: '-62px',  d: '0.12s', dur: '1.60s', c: '#FF6B6B', s: 6 },
  { x:  '86px',  y:  '-4px',  d: '0.04s', dur: '1.45s', c: '#4FC3F7', s: 8 },
  { x:  '66px',  y:  '60px',  d: '0.20s', dur: '1.65s', c: '#81C784', s: 6 },
  { x:  '12px',  y:  '85px',  d: '0.08s', dur: '1.55s', c: '#CE93D8', s: 7 },
  { x: '-50px',  y:  '70px',  d: '0.16s', dur: '1.70s', c: '#FFB74D', s: 6 },
  { x: '-85px',  y:  '18px',  d: '0.06s', dur: '1.42s', c: '#F48FB1', s: 8 },
  { x: '-70px',  y: '-55px',  d: '0.18s', dur: '1.58s', c: '#80CBC4', s: 6 },
  { x: '-24px',  y: '-84px',  d: '0.10s', dur: '1.48s', c: '#FFD700', s: 7 },
  { x:  '38px',  y: '-74px',  d: '0.14s', dur: '1.62s', c: '#FF6B6B', s: 6 },
  { x:  '78px',  y:  '40px',  d: '0.22s', dur: '1.52s', c: '#4FC3F7', s: 7 },
  { x: '-60px',  y: '-28px',  d: '0.09s', dur: '1.44s', c: '#CE93D8', s: 6 },
  { x:  '0px',   y:  '95px',  d: '0.25s', dur: '1.72s', c: '#81C784', s: 5 },
  { x: '-90px',  y: '-18px',  d: '0.03s', dur: '1.38s', c: '#FFB74D', s: 7 },
  { x:  '90px',  y: '-35px',  d: '0.17s', dur: '1.56s', c: '#F48FB1', s: 5 },
  { x: '  35px', y:  '78px',  d: '0.28s', dur: '1.68s', c: '#FFD700', s: 6 },
];

function FireworkBurst() {
  return (
    <>
      {BURST.map((p, i) => (
        <span
          key={i}
          className="fw-particle"
          style={{
            '--fw-x': p.x, '--fw-y': p.y,
            '--fw-delay': p.d, '--fw-dur': p.dur,
            width: p.s, height: p.s,
            marginLeft: -(p.s / 2), marginTop: -(p.s / 2),
            background: p.c,
          }}
        />
      ))}
    </>
  );
}

export default function KnockoutBracket({ segment, segmentData, knockoutMatches, isAdmin, onSave, onReset, onSaveTime, teams, scheme, isLight = false, showFieldNo = false }) {
  const style = segStyles[segment];
  if (!segmentData || !style) return null;

  const outerBorder = scheme?.primaryRing ?? style.border;
  const winnerLabel = segment === 'cup' ? `${segmentData.label} Champion` : `${segmentData.label} Winner`;

  function findMatch(templateId) {
    return knockoutMatches.find(m => m.id === templateId || m.id?.endsWith(`_${templateId}`));
  }

  const lastRound  = segmentData.rounds[segmentData.rounds.length - 1];
  const finalTmpl  = lastRound?.matches[0];
  const finalMatch = finalTmpl ? findMatch(finalTmpl.id) : null;
  const winnerId   = finalMatch?.completed
    ? (finalMatch.penWinner || (Number(finalMatch.homeScore) > Number(finalMatch.awayScore) ? finalMatch.homeTeamId : finalMatch.awayTeamId))
    : null;
  const winnerName = winnerId ? (teams.find(t => t.id === winnerId)?.name ?? null) : null;

  return (
    <div
      className="rounded-2xl border p-4 sm:p-6"
      style={{
        borderColor: outerBorder,
        background: isLight
          ? `radial-gradient(ellipse at 0% 0%, ${style.lightBg1} 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, ${style.lightBg2} 0%, transparent 55%), #ffffff`
          : `radial-gradient(ellipse at 0% 0%, ${style.bg1} 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, ${style.bg2} 0%, transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.30) 100%)`,
        boxShadow: isLight
          ? `0 1px 3px rgba(0,0,0,0.08), inset 0 0 40px ${style.glowColor.replace('0.35', '0.04')}`
          : `inset 0 0 60px ${style.glowColor.replace('0.35', '0.08')}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl sm:text-3xl">{style.icon}</span>
        <div>
          <h2 className={`font-display text-2xl sm:text-3xl tracking-wider ${style.title}`}>{segmentData.label}</h2>
          <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-white/30'}`}>
            {segmentData.rounds.length} round{segmentData.rounds.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Bracket columns + winner column */}
      <div className="flex gap-4 overflow-x-auto pb-2 items-start">

        {/* Rounds */}
        {segmentData.rounds.map(round => {
          const roundMatches = knockoutMatches.filter(m => m.roundId === round.id);
          return (
            <div key={round.id} className="flex-shrink-0 w-[220px] sm:w-[260px]">
              <div className="mb-3">
                <span className={`text-xs uppercase tracking-widest font-semibold border rounded-full px-3 py-1 ${
                  isLight ? style.lightBadge : style.badge
                }`}>
                  {round.label}
                </span>
              </div>
              <div className="space-y-3">
                {round.matches.map(tmpl => {
                  const match   = findMatch(tmpl.id);
                  const display = match ?? { ...tmpl, id: tmpl.id, completed: false, homeTeamId: null, awayTeamId: null };
                  return (
                    <MatchCard
                      key={tmpl.id}
                      match={display}
                      isAdmin={isAdmin}
                      onSave={onSave}
                      onReset={onReset}
                      onSaveTime={onSaveTime}
                      colorScheme={segment}
                      showTime
                      teams={teams}
                      isKnockout={true}
                      showFieldNo={showFieldNo}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Winner column (inline with bracket) ─────────────────────── */}
        {winnerName && (
          <div className="flex-shrink-0 w-[200px] sm:w-[240px] flex flex-col">
            <div className="mb-3">
              <span className={`text-xs uppercase tracking-widest font-semibold border rounded-full px-3 py-1 ${
                isLight ? style.lightBadge : style.badge
              }`}>
                Champion
              </span>
            </div>

            {/* Winner card — always dark for dramatic effect */}
            <div
              className="winner-glow rounded-2xl border p-6 text-center relative overflow-hidden"
              style={{
                '--glow-c': style.glowColor,
                borderColor: style.border,
                background: `
                  radial-gradient(ellipse at 50% 30%, ${style.glowColor} 0%, transparent 65%),
                  linear-gradient(160deg, ${style.bg1} 0%, rgba(0,0,0,0.55) 100%)
                `,
              }}
            >
              <FireworkBurst />
              <div className="relative z-10">
                <span className="crown-float text-5xl sm:text-6xl block mb-3">👑</span>
                <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] font-semibold mb-2">
                  {winnerLabel}
                </p>
                <p
                  className="font-display text-3xl sm:text-4xl tracking-wider leading-tight"
                  style={{ color: style.titleHex }}
                >
                  {winnerName}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
