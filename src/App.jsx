import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTournament } from './hooks/useTournament';
import { GROUPS } from './lib/tournament';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import KnockoutBracket from './components/KnockoutBracket';
import LoginPage from './components/LoginPage';
import TeamManager from './components/TeamManager';

export default function App() {
  const { isAdmin, logout } = useAuth();
  const {
    teams, groupMatches, knockoutMatches, standings,
    initialized, loading,
    saveTeam, deleteTeam, resetGroup, resetAllTeams,  
    initializeTournament,
    updateGroupMatch, resetGroupMatch,
    updateKnockoutMatch, resetKnockoutMatch,
    resetAll, hardReset,
  } = useTournament();

  const [tab, setTab]           = useState('groups');
  const [showLogin, setShowLogin] = useState(false);
  const [resetting, setResetting] = useState(false);

  const NAV_TABS = [
    ...(isAdmin ? [{ id: 'setup', label: 'Setup', icon: '⚙️' }] : []),
    { id: 'groups', label: 'Groups', icon: '⚽' },
    { id: 'cup',    label: 'Cup',    icon: '🏆' },
    { id: 'plate',  label: 'Plate',  icon: '🥈' },
    { id: 'shield', label: 'Shield', icon: '🛡️' },
    { id: 'bowl',   label: 'Bowl',   icon: '🥣' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pitch-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">⚽</div>
          <p className="font-display text-3xl text-green-400 tracking-wider">Loading…</p>
        </div>
      </div>
    );
  }

  // Not initialized + not admin → prompt login
  if (!initialized && !isAdmin) {
    return (
      <div className="min-h-screen pitch-bg flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="text-7xl">⚽</div>
          <h1 className="font-display text-5xl text-green-400 tracking-widest">Tournament 2025</h1>
          <p className="text-white/50">Tournament hasn't been set up yet.</p>
          <button onClick={() => setShowLogin(true)}
            className="border border-white/20 hover:border-green-500/50 text-white/70 hover:text-white px-6 py-3 rounded-xl transition-colors">
            Admin Login
          </button>
        </div>
        {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  async function handleResetAll() {
    if (!confirm('Reset ALL match scores?')) return;
    setResetting(true);
    await resetAll();
    setResetting(false);
  }

  async function handleHardReset() {
    if (!confirm('HARD RESET: Delete all fixtures and regenerate?')) return;
    setResetting(true);
    await hardReset();
    setResetting(false);
  }

  const adminBar = isAdmin && (
    <div className="flex flex-wrap gap-2 items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <span className="text-white/60 text-sm font-medium">Admin Controls</span>
      <div className="flex gap-2">
        <button onClick={handleResetAll} disabled={resetting}
          className="text-xs px-4 py-2 rounded-lg bg-orange-900/40 hover:bg-orange-800/60 border border-orange-500/30 text-orange-400 transition-colors disabled:opacity-50">
          ↺ Reset All Scores
        </button>
        <button onClick={handleHardReset} disabled={resetting}
          className="text-xs px-4 py-2 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-red-400 transition-colors disabled:opacity-50">
          ⚠ Hard Reset
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pitch-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a1a0f]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="font-display text-xl text-green-400 tracking-widest leading-none">Tournament 2025</h1>
              <p className="text-white/40 text-xs">6 June · 16 Teams · 8am onwards</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <span className="hidden sm:block text-white/40 text-xs border border-white/10 rounded-full px-3 py-1">👤 Admin</span>
                <button onClick={logout} className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">Logout</button>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="text-xs border border-white/20 hover:border-green-500/50 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                Admin Login
              </button>
            )}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id ? 'border-green-500 text-green-400' : 'border-transparent text-white/50 hover:text-white/80'
              }`}>
              <span>{t.icon}</span>
              <span className="font-display tracking-wider text-base">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Setup tab (admin only) ──────────────────────────────────────── */}
        {tab === 'setup' && isAdmin && (
          <div className="fade-up">
            <TeamManager
              teams={teams}
              saveTeam={saveTeam}
              deleteTeam={deleteTeam}
              onResetGroup={resetGroup}
              onResetAllTeams={resetAllTeams}
              onGenerateFixtures={initializeTournament}
              initialized={initialized}
            />
          </div>
        )}

        {/* ── Groups tab ──────────────────────────────────────────────────── */}
        {tab === 'groups' && (
          <div className="space-y-10 fade-up">
            {adminBar}

            {!initialized ? (
              <div className="text-center py-20 text-white/40">
                <p className="text-5xl mb-4">📋</p>
                <p className="font-display text-2xl tracking-wider mb-2">No Fixtures Yet</p>
                <p className="text-sm">Go to <button onClick={() => setTab('setup')} className="text-green-400 underline">Setup</button> to add teams and generate fixtures.</p>
              </div>
            ) : (
              GROUPS.map(group => {
                const gMatches   = groupMatches.filter(m => m.group === group);
                const gStandings = standings[group] || [];
                return (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="font-display text-4xl text-white tracking-widest">Group {group}</h2>
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/30 text-sm">{gMatches.filter(m => m.completed).length}/{gMatches.length} played</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <StandingsTable standings={gStandings} group={group} />
                      <div className="space-y-4">
                        {[1, 2, 3].map(round => {
                          const roundMatches = gMatches.filter(m => m.round === round);
                          if (roundMatches.length === 0) return null;
                          return (
                            <div key={round}>
                              <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Round {round}</p>
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

        {/* ── Knockout tabs ───────────────────────────────────────────────── */}
        {['cup', 'plate', 'shield', 'bowl'].includes(tab) && (
          <div className="space-y-6 fade-up">
            {adminBar}
            {!initialized ? (
              <div className="text-center py-20 text-white/40">
                <p className="text-5xl mb-4">🔒</p>
                <p className="font-display text-2xl tracking-wider">Knockouts Locked</p>
                <p className="text-sm mt-2">Generate fixtures first from the <button onClick={() => setTab('setup')} className="text-green-400 underline">Setup</button> tab.</p>
              </div>
            ) : (
              <>
                <KnockoutBracket
                  segment={tab}
                  knockoutMatches={knockoutMatches.filter(m => m.segment === tab)}
                  isAdmin={isAdmin}
                  onSave={updateKnockoutMatch}
                  onReset={resetKnockoutMatch}
                  teams={teams}
                />
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm">
                  {tab === 'cup'    && <p>🏆 Top 2 from each group. QF: A1 vs B2 · B1 vs A2 · C1 vs D2 · D1 vs C2. QF losers → Plate.</p>}
                  {tab === 'plate'  && <p>🥈 Cup QF losers compete. SF losers → Shield.</p>}
                  {tab === 'shield' && <p>🛡️ Plate SF losers + 3rd place from Groups A & C.</p>}
                  {tab === 'bowl'   && <p>🥣 3rd from Groups B & D + all 4th place teams + Shield SF losers.</p>}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-white/5 text-center text-white/20 text-xs">
        <p>Tournament Day · 6 June 2025 · 8:00 AM onwards · 16-minute matches</p>
      </footer>

      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
    </div>
  );
}