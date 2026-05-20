import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTournament } from './hooks/useTournament';
import { AGE_GROUPS } from './lib/tournament';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import KnockoutBracket from './components/KnockoutBracket';
import LoginPage from './components/LoginPage';
import TeamManager from './components/TeamManager';

const KO_SEGMENTS = ['cup', 'plate', 'shield', 'bowl'];
const KO_ICONS    = { cup: '🏆', plate: '🥈', shield: '🛡️', bowl: '🥣' };

export default function App() {
  const { isAdmin, logout } = useAuth();
  const [ageGroup,   setAgeGroup]   = useState('U10');
  const [tab,        setTab]        = useState('groups');
  const [showLogin,  setShowLogin]  = useState(false);
  const [resetting,  setResetting]  = useState(false);

  const {
    teams, groupMatches, knockoutMatches, knockoutTemplate,
    standings, initialized, loading,
    letters, activeLetters,
    saveTeam, deleteTeam, resetGroup, resetAllTeams,
    initializeTournament,
    updateGroupMatch, resetGroupMatch,
    updateKnockoutMatch, resetKnockoutMatch,
    resetAll, hardReset,
  } = useTournament(ageGroup);

  const TABS = [
    ...(isAdmin ? [{ id: 'setup', label: 'Setup', icon: '⚙️' }] : []),
    { id: 'groups', label: 'Groups', icon: '⚽' },
    ...KO_SEGMENTS.map(s => ({ id: s, label: knockoutTemplate?.[s]?.label || s, icon: KO_ICONS[s] })),
  ];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pitch-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">⚽</div>
          <p className="font-display text-2xl text-kz-300 tracking-wider">Loading…</p>
        </div>
      </div>
    );
  }

  async function handleResetAll() {
    if (!confirm(`Reset ALL scores for ${ageGroup}?`)) return;
    setResetting(true); await resetAll(); setResetting(false);
  }
  async function handleHardReset() {
    if (!confirm(`Hard reset ${ageGroup}? Deletes and regenerates all fixtures.`)) return;
    setResetting(true); await hardReset(); setResetting(false);
  }

  const adminBar = isAdmin && (
    <div className="flex flex-wrap gap-2 items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
      <span className="text-white/50 text-xs font-medium">Admin · {ageGroup}</span>
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleResetAll} disabled={resetting}
          className="text-xs px-3 py-1.5 rounded-lg bg-orange-900/40 hover:bg-orange-800/60 border border-orange-500/30 text-orange-400 transition-colors disabled:opacity-40">
          ↺ Reset Scores
        </button>
        <button onClick={handleHardReset} disabled={resetting}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-red-400 transition-colors disabled:opacity-40">
          ⚠ Hard Reset
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pitch-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-kz-950/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="Kickerz Logo" className="w-20 h-20 sm:w-25 sm:h-25" />
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl leading-none tracking-widest">
                <span className="text-white">KICKERZ </span>
                <span className="gold-shimmer">CUP 2026</span>
              </h1>
              <p className="text-white/30 text-xs mt-0.5 hidden sm:block">June 6th &amp; 7th</p>
            </div>
          </div>

          {/* Right: age group selector + auth */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Age group dropdown */}
            <select
              value={ageGroup}
              onChange={e => { setAgeGroup(e.target.value); setTab('groups'); }}
              className="bg-kz-900 border border-kz-gold/40 text-kz-gold text-sm rounded-lg px-2 py-1.5 sm:px-3 focus:outline-none focus:border-kz-gold cursor-pointer appearance-none"
              style={{ backgroundColor: '#0d1530', colorScheme: 'dark' }}
            >
              {AGE_GROUPS.map(ag => (
                <option key={ag} value={ag} style={{ backgroundColor: '#0d1530', color: '#F5A623' }}>
                  {ag}
                </option>
              ))}
            </select>

            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:block text-white/30 text-xs border border-white/10 rounded-full px-2 py-0.5">Admin</span>
                <button onClick={logout} className="text-xs text-white/35 hover:text-white/70 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="text-xs border border-white/15 hover:border-kz/60 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                Login
              </button>
            )}
          </div>
        </div>

        {/* Age group indicator strip */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-0">
          <div className="flex items-center gap-2 py-1 border-b border-white/5">
            <span className="text-kz-gold font-display tracking-wider text-sm">{ageGroup}</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/30 text-xs">Groups: {letters.join(', ')}</span>
            {initialized && <span className="text-white/20 text-xs">· {groupMatches.length} group matches</span>}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex gap-0.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-kz-gold text-kz-gold' : 'border-transparent text-white/40 hover:text-white/70'
              }`}>
              <span className="text-sm">{t.icon}</span>
              <span className="font-display tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5">

        {/* Setup tab */}
        {tab === 'setup' && isAdmin && (
          <div className="fade-up">
            <TeamManager
              teams={teams}
              letters={letters}
              saveTeam={saveTeam}
              deleteTeam={deleteTeam}
              onResetGroup={resetGroup}
              onResetAllTeams={resetAllTeams}
              onGenerateFixtures={initializeTournament}
              initialized={initialized}
            />
          </div>
        )}

        {/* Groups tab */}
        {tab === 'groups' && (
          <div className="space-y-8 fade-up">
            {adminBar}

            {!initialized ? (
              <div className="text-center py-16 text-white/30">
                <p className="text-5xl mb-4">📋</p>
                <p className="font-display text-2xl tracking-wider mb-2">No Fixtures</p>
                <p className="text-sm">
                  {isAdmin
                    ? <span>Go to <button onClick={() => setTab('setup')} className="text-kz-300 underline">Setup</button> to add teams and generate fixtures.</span>
                    : 'Fixtures haven\'t been generated yet.'}
                </p>
              </div>
            ) : (
              letters.map(letter => {
                const gMatches   = groupMatches.filter(m => m.group === letter);
                const gStandings = standings[letter] || [];
                const maxRound   = Math.max(...gMatches.map(m => m.round), 0);
                if (gMatches.length === 0) return null;

                return (
                  <div key={letter} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="font-display text-3xl sm:text-4xl text-white tracking-widest">Group {letter}</h2>
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/25 text-xs">
                        {gMatches.filter(m => m.completed).length}/{gMatches.length} played
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <StandingsTable standings={gStandings} group={letter} />
                      <div className="space-y-3">
                        {Array.from({ length: maxRound }, (_, i) => i + 1).map(round => {
                          const roundMatches = gMatches.filter(m => m.round === round);
                          if (!roundMatches.length) return null;
                          return (
                            <div key={round}>
                              <p className="text-white/25 text-xs uppercase tracking-widest mb-1.5">Round {round}</p>
                              <div className="space-y-2">
                                {roundMatches.map(match => (
                                  <MatchCard key={match.id} match={match} isAdmin={isAdmin}
                                    onSave={updateGroupMatch} onReset={resetGroupMatch}
                                    colorScheme="group" teams={teams} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Knockout tabs */}
        {KO_SEGMENTS.includes(tab) && (
          <div className="space-y-5 fade-up">
            {adminBar}
            {!initialized || !knockoutTemplate ? (
              <div className="text-center py-16 text-white/30">
                <p className="text-5xl mb-4">🔒</p>
                <p className="font-display text-2xl tracking-wider">Knockouts Locked</p>
                <p className="text-sm mt-2">
                  {isAdmin
                    ? <span>Generate fixtures from <button onClick={() => setTab('setup')} className="text-kz-300 underline">Setup</button> first.</span>
                    : 'Fixtures not yet generated.'}
                </p>
              </div>
            ) : (
              <>
                <KnockoutBracket
                  segment={tab}
                  segmentData={knockoutTemplate[tab]}
                  knockoutMatches={knockoutMatches.filter(m => m.segment === tab)}
                  isAdmin={isAdmin}
                  onSave={updateKnockoutMatch}
                  onReset={resetKnockoutMatch}
                  teams={teams}
                />
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/35 text-xs leading-relaxed">
                  {tab === 'cup'    && `🏆 Cup: Top 2 from each group. Winners advance; losers drop to Plate.`}
                  {tab === 'plate'  && `🥈 Plate: Cup Quarter Final losers compete for the Plate.`}
                  {tab === 'shield' && `🛡️ Shield: 3rd & 4th from all groups enter Shield Quarter Finals. Losers drop to Bowl.`}
                  {tab === 'bowl'   && `🥣 Bowl: Shield Quarter Final losers compete for the Bowl.`}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 border-t border-white/5 text-center text-white/15 text-xs">
        <p className="font-display tracking-widest text-sm text-white/20">KICKERZ CUP 2026</p>
        <p className="mt-1">June 6th &amp; 7th · 8:00 AM onwards · 16-minute matches</p>
      </footer>

      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
    </div>
  );
}