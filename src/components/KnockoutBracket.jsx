import MatchCard from './MatchCard';
import { KNOCKOUT_TEMPLATE } from '../lib/tournament';

const segmentStyles = {
  cup:    { label: 'Cup',    icon: '🏆', gradient: 'from-amber-500/20 via-amber-600/10 to-transparent',  border: 'border-amber-500/30',  title: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  plate:  { label: 'Plate',  icon: '🥈', gradient: 'from-sky-500/20 via-sky-600/10 to-transparent',     border: 'border-sky-500/30',    title: 'text-sky-400',    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  shield: { label: 'Shield', icon: '🛡️', gradient: 'from-violet-500/20 via-violet-600/10 to-transparent',border: 'border-violet-500/30', title: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  bowl:   { label: 'Bowl',   icon: '🥣', gradient: 'from-rose-500/20 via-rose-600/10 to-transparent',   border: 'border-rose-500/30',   title: 'text-rose-400',   badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export default function KnockoutBracket({ segment, knockoutMatches, isAdmin, onSave, onReset, teams }) {
  const template = KNOCKOUT_TEMPLATE[segment];
  const style    = segmentStyles[segment];
  if (!template || !style) return null;

  return (
    <div className={`rounded-2xl border ${style.border} bg-gradient-to-br ${style.gradient} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{style.icon}</span>
        <div>
          <h2 className={`font-display text-3xl tracking-wider ${style.title}`}>{style.label}</h2>
          <p className="text-white/40 text-xs mt-0.5">{template.rounds.length} round{template.rounds.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-2">
        {template.rounds.map(round => {
          const roundMatches = knockoutMatches.filter(m => m.roundId === round.id);
          return (
            <div key={round.id} className="flex-shrink-0 min-w-[240px]">
              <div className="mb-3">
                <span className={`text-xs uppercase tracking-widest font-semibold border rounded-full px-3 py-1 ${style.badge}`}>
                  {round.label}
                </span>
              </div>
              <div className="space-y-3">
                {round.matches.map(matchTemplate => {
                  const match = roundMatches.find(m => m.id === matchTemplate.id) || matchTemplate;
                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
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