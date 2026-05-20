import MatchCard from './MatchCard';

const segStyles = {
  cup:    { icon: '🏆', border: 'border-kz-gold/30',    grad: 'from-kz-gold/15 to-transparent',  title: 'text-kz-gold',    badge: 'bg-kz-gold/20 text-kz-gold border-kz-gold/30' },
  plate:  { icon: '🥈', border: 'border-sky-500/30',    grad: 'from-sky-500/15 to-transparent',   title: 'text-sky-400',    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  shield: { icon: '🛡️', border: 'border-violet-500/30', grad: 'from-violet-500/15 to-transparent', title: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  bowl:   { icon: '🥣', border: 'border-rose-500/30',   grad: 'from-rose-500/15 to-transparent',  title: 'text-rose-400',   badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export default function KnockoutBracket({ segment, segmentData, knockoutMatches, isAdmin, onSave, onReset, teams }) {
  const style = segStyles[segment];
  if (!segmentData || !style) return null;

  // Match by bare id OR suffixed id (e.g. "CQF1" matches "U10_CQF1")
  function findMatch(templateId) {
    return knockoutMatches.find(
      m => m.id === templateId || m.id?.endsWith(`_${templateId}`)
    );
  }

  return (
    <div className={`rounded-2xl border ${style.border} bg-gradient-to-br ${style.grad} p-4 sm:p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl sm:text-3xl">{style.icon}</span>
        <div>
          <h2 className={`font-display text-2xl sm:text-3xl tracking-wider ${style.title}`}>{segmentData.label}</h2>
          <p className="text-white/30 text-xs">{segmentData.rounds.length} round{segmentData.rounds.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {segmentData.rounds.map(round => {
          // Filter matches for this round — match by roundId field stored in Firestore
          const roundMatches = knockoutMatches.filter(m => m.roundId === round.id);

          return (
            <div key={round.id} className="flex-shrink-0 w-[220px] sm:w-[260px]">
              <div className="mb-3">
                <span className={`text-xs uppercase tracking-widest font-semibold border rounded-full px-3 py-1 ${style.badge}`}>
                  {round.label}
                </span>
              </div>
              <div className="space-y-3">
                {round.matches.map(tmpl => {
                  // Find by bare id OR prefixed id
                  const match = findMatch(tmpl.id);
                  // Use resolved match if found, else show empty stub
                  const display = match ?? { ...tmpl, id: tmpl.id, completed: false, homeTeamId: null, awayTeamId: null };
                  return (
                    <MatchCard
                      key={tmpl.id}
                      match={display}
                      isAdmin={isAdmin}
                      onSave={onSave}
                      onReset={onReset}
                      colorScheme={segment}
                      showTime={false}
                      teams={teams}
                      isKnockout={true}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}