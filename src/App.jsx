import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTournament } from './hooks/useTournament';
import { AGE_GROUPS } from './lib/tournament';
import MatchCard from './components/MatchCard';
import StandingsTable from './components/StandingsTable';
import KnockoutBracket from './components/KnockoutBracket';
import LoginPage from './components/LoginPage';
import TeamManager from './components/TeamManager';
import ExportButton from './components/ExportButton';
import BackupRestorePanel from './components/BackupRestorePanel';

const KO_SEGMENTS = ['cup', 'plate', 'shield', 'bowl'];
const KO_ICONS    = { cup: '🏆', plate: '🥈', shield: '🛡️', bowl: '🏅' };

const AGE_GROUP_TITLE = {
  U10:   'U10 (2016 - 2017)',
  U12:   'U12 (2014 - 2015)',
  U14:   'U14 (2012 - 2013)',
  U16:   'U16 (2010 - 2011)',
  Girls: 'Girls U14 (2012, 13 & 14 (+3 - 2011, +1 - 2010))',
  // Testing: 'Testing Mode', // TESTING_MODE: remove this line
};

const AGE_SCHEME = {
  U10:     { primary: '#ef4444', primaryLight: '#fca5a5', primaryDim: 'rgba(239,68,68,0.10)',   primaryRing: 'rgba(239,68,68,0.35)',   bgGlow: 'rgba(239,68,68,0.18)'   },
  U12:     { primary: '#60a5fa', primaryLight: '#bfdbfe', primaryDim: 'rgba(96,165,250,0.10)',  primaryRing: 'rgba(96,165,250,0.35)',  bgGlow: 'rgba(96,165,250,0.18)'  },
  U14:     { primary: '#4ade80', primaryLight: '#bbf7d0', primaryDim: 'rgba(74,222,128,0.10)',  primaryRing: 'rgba(74,222,128,0.35)',  bgGlow: 'rgba(74,222,128,0.18)'  },
  U16:     { primary: '#facc15', primaryLight: '#fef08a', primaryDim: 'rgba(250,204,21,0.10)',  primaryRing: 'rgba(250,204,21,0.35)',  bgGlow: 'rgba(250,204,21,0.18)'  },
  Girls:   { primary: '#f472b6', primaryLight: '#fbcfe8', primaryDim: 'rgba(244,114,182,0.10)', primaryRing: 'rgba(244,114,182,0.35)', bgGlow: 'rgba(244,114,182,0.18)' },
  // Testing: { primary: '#a78bfa', primaryLight: '#ddd6fe', primaryDim: 'rgba(167,139,250,0.10)', primaryRing: 'rgba(167,139,250,0.35)', bgGlow: 'rgba(167,139,250,0.18)' }, // TESTING_MODE: remove this line
};

function getChampion(finalId, knockoutMatches, teams) {
  const m = knockoutMatches.find(m => m.id?.endsWith(`_${finalId}`) || m.id === finalId);
  if (!m?.completed) return null;
  const winnerId = m.penWinner
    || (Number(m.homeScore) > Number(m.awayScore) ? m.homeTeamId : m.awayTeamId);
  return teams.find(t => t.id === winnerId)?.name || null;
}

export default function App() {
  const { isAdmin, logout } = useAuth();
  const [ageGroup,   setAgeGroup]   = useState('U10');
  const [tab,        setTab]        = useState('groups');
  const [showLogin,  setShowLogin]  = useState(false);
  const [resetting,  setResetting]  = useState(false);
  const [groupSort,  setGroupSort]  = useState('group'); // 'group' | 'time'

  const {
    teams, groupMatches, knockoutMatches, knockoutTemplate,
    standings, initialized, loading,
    letters, activeLetters,
    saveTeam, deleteTeam, resetGroup, resetAllTeams,
    initializeTournament,
    updateGroupMatch, updateGroupMatchTime, resetGroupMatch,
    updateKnockoutMatch, updateKnockoutMatchTime, resetKnockoutMatch,
    resetAll, hardReset,
    createBackup, fetchBackups, restoreFromBackup,
  } = useTournament(ageGroup);

  useEffect(() => { setGroupSort('group'); }, [ageGroup]);

  const scheme = AGE_SCHEME[ageGroup] || AGE_SCHEME.U10;

  // White background for admin, dark for public
  const isLight = isAdmin;
  const pageBg    = isLight ? '#ffffff' : '#0a0f1e';
  const headerBg  = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(10,15,30,0.96)';
  const selectBg  = isLight ? '#f8fafc' : '#0d1530';
  const gridLine  = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.015)';

  // Text helpers
  const tPrimary   = isLight ? '#111827' : '#ffffff';
  const tSecondary = isLight ? '#6b7280' : 'rgba(255,255,255,0.50)';
  const tMuted     = isLight ? '#9ca3af' : 'rgba(255,255,255,0.30)';
  const tDim       = isLight ? '#b0b7c3' : 'rgba(255,255,255,0.25)';
  const tFaint     = isLight ? '#c4cad4' : 'rgba(255,255,255,0.20)';
  const tFainter   = isLight ? '#d1d5db' : 'rgba(255,255,255,0.15)';

  // Surface / border helpers
  const bgSubtle   = isLight ? 'rgba(0,0,0,0.04)'  : 'rgba(255,255,255,0.05)';
  const bgActive   = isLight ? 'rgba(0,0,0,0.12)'  : 'rgba(255,255,255,0.15)';
  const bdSubtle   = isLight ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.10)';
  const bdFaint    = isLight ? 'rgba(0,0,0,0.05)'  : 'rgba(255,255,255,0.05)';
  const bdMedium   = isLight ? 'rgba(0,0,0,0.12)'  : 'rgba(255,255,255,0.15)';

  // On white, use scheme.primary for headings (primaryLight is too pale on white)
  const headingColor = isLight ? scheme.primary : scheme.primaryLight;

  const cupChamp    = getChampion('CF1',   knockoutMatches, teams);
  const plateChamp  = getChampion('PF1',   knockoutMatches, teams);
  const shieldChamp = getChampion('SHFF1', knockoutMatches, teams);
  const bowlChamp   = getChampion('BF1',   knockoutMatches, teams);
  const hasChamps   = !!(cupChamp || plateChamp || shieldChamp || bowlChamp);

  const koSegments = ageGroup === 'Girls' ? ['cup'] : KO_SEGMENTS;

  const TABS = [
    ...(isAdmin ? [{ id: 'setup', label: 'Setup', icon: '⚙️' }] : []),
    { id: 'groups', label: 'Groups', icon: '⚽' },
    ...koSegments.map(s => ({ id: s, label: knockoutTemplate?.[s]?.label || s, icon: KO_ICONS[s] })),
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
    <div
      className="flex flex-wrap gap-2 items-center justify-between p-3 rounded-xl border"
      style={{ backgroundColor: bgSubtle, borderColor: bdSubtle }}
    >
      <span className="text-xs font-medium" style={{ color: tSecondary }}>Admin · {ageGroup}</span>
      <div className="flex gap-2 flex-wrap">
        <BackupRestorePanel
          ageGroup={ageGroup}
          scheme={scheme}
          createBackup={createBackup}
          fetchBackups={fetchBackups}
          restoreFromBackup={restoreFromBackup}
        />
        <button onClick={handleResetAll} disabled={resetting}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
            isLight
              ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-700'
              : 'bg-orange-900/40 hover:bg-orange-800/60 border-orange-500/30 text-orange-400'
          }`}>
          ↺ Reset Scores
        </button>
        <button onClick={handleHardReset} disabled={resetting}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
            isLight
              ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-700'
              : 'bg-red-900/40 hover:bg-red-800/60 border-red-500/30 text-red-400'
          }`}>
          ⚠ Hard Reset
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: pageBg,
        backgroundImage: `
          radial-gradient(ellipse at 50% 0%, ${scheme.bgGlow} 0%, transparent 55%),
          radial-gradient(ellipse at 80% 80%, ${scheme.primaryDim} 0%, transparent 50%),
          repeating-linear-gradient(90deg, ${gridLine} 0px, ${gridLine} 1px, transparent 1px, transparent 80px)
        `,
        transition: 'background-image 0.5s ease',
      }}
    >

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ backgroundColor: headerBg, borderBottom: `1px solid ${scheme.primaryRing}` }}
      >
        {/* Colored top accent line */}
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${scheme.primary} 30%, ${scheme.primaryLight} 50%, ${scheme.primary} 70%, transparent 100%)` }}
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="Kickerz Logo" className="w-[90px] h-[90px] sm:w-[120px] sm:h-[120px]" />
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl leading-none tracking-widest">
                <span style={{ color: tPrimary }}>KICKERZ </span>
                <span className="gold-shimmer">CUP 2026</span>
              </h1>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: tMuted }}>June 6th &amp; 7th</p>
            </div>
          </div>

          {/* Right: age group selector + export + auth */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && <ExportButton />}
            {/* Age group dropdown */}
            <select
              value={ageGroup}
              onChange={e => { setAgeGroup(e.target.value); setTab('groups'); }}
              className="border text-sm rounded-lg px-2 py-1.5 sm:px-3 focus:outline-none cursor-pointer appearance-none"
              style={{ backgroundColor: selectBg, colorScheme: isLight ? 'light' : 'dark', borderColor: scheme.primaryRing, color: scheme.primary }}
            >
              {AGE_GROUPS.map(ag => (
                <option key={ag} value={ag} style={{ backgroundColor: selectBg, color: isLight ? '#374151' : '#F5A623' }}>
                  {ag}
                </option>
              ))}
            </select>

            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="hidden sm:block text-xs rounded-full px-2 py-0.5 border"
                  style={{ color: tMuted, borderColor: bdSubtle }}
                >Admin</span>
                <button onClick={logout}
                  className={`text-xs px-2 py-1.5 rounded-lg transition-colors ${
                    isLight
                      ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                      : 'text-white/35 hover:text-white/70 hover:bg-white/5'
                  }`}>
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
          <div className="flex items-center gap-2 py-1" style={{ borderBottom: `1px solid ${bdFaint}` }}>
            <span className="font-display tracking-wider text-sm" style={{ color: scheme.primary }}>{ageGroup}</span>
            <span className="text-xs" style={{ color: tFaint }}>·</span>
            <span className="text-xs" style={{ color: tMuted }}>Groups: {letters.join(', ')}</span>
            {initialized && <span className="text-xs" style={{ color: tFaint }}>· {groupMatches.length} group matches</span>}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex gap-0.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab !== t.id
                  ? (isLight ? 'border-transparent text-gray-400 hover:text-gray-700' : 'border-transparent text-white/40 hover:text-white/70')
                  : ''
              }`}
              style={tab === t.id ? { borderColor: scheme.primary, color: scheme.primary } : {}}>
              <span className="text-sm">{t.icon}</span>
              <span className="font-display tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5">

        {/* Age group title */}
        <div className="mb-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl tracking-widest" style={{ color: headingColor }}>
            {AGE_GROUP_TITLE[ageGroup]}
          </h2>
        </div>

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
              <div className="text-center py-16" style={{ color: tMuted }}>
                <p className="text-5xl mb-4">📋</p>
                <p className="font-display text-2xl tracking-wider mb-2">No Fixtures</p>
                <p className="text-sm">
                  {isAdmin
                    ? <span>Go to <button onClick={() => setTab('setup')} className="text-kz-300 underline">Setup</button> to add teams and generate fixtures.</span>
                    : 'Fixtures haven\'t been generated yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* ── Sort toggle ─────────────────────────────────────── */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex gap-0.5 p-0.5 rounded-lg border"
                    style={{ backgroundColor: bgSubtle, borderColor: bdSubtle }}
                  >
                    <button
                      onClick={() => setGroupSort('group')}
                      className="text-xs px-3 py-1.5 rounded-md transition-colors font-medium"
                      style={{
                        backgroundColor: groupSort === 'group' ? bgActive : 'transparent',
                        color: groupSort === 'group' ? tPrimary : tMuted,
                      }}
                    >
                      By Group
                    </button>
                    <button
                      onClick={() => setGroupSort('time')}
                      className="text-xs px-3 py-1.5 rounded-md transition-colors font-medium"
                      style={{
                        backgroundColor: groupSort === 'time' ? bgActive : 'transparent',
                        color: groupSort === 'time' ? tPrimary : tMuted,
                      }}
                    >
                      ⏱ By Time
                    </button>
                  </div>
                  <span className="text-xs" style={{ color: tFaint }}>
                    {groupMatches.filter(m => m.completed).length}/{groupMatches.length} played
                  </span>
                </div>

                {/* ── By Group view ────────────────────────────────────── */}
                {groupSort === 'group' && letters.map(letter => {
                  const gMatches   = groupMatches.filter(m => m.group === letter);
                  const gStandings = standings[letter] || [];
                  const maxRound   = Math.max(...gMatches.map(m => m.round), 0);
                  if (gMatches.length === 0) return null;

                  return (
                    <div key={letter} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h2 className="font-display text-3xl sm:text-4xl tracking-widest" style={{ color: headingColor }}>Group {letter}</h2>
                        <div className="flex-1 h-px" style={{ background: scheme.primaryRing }} />
                        <span className="text-xs" style={{ color: tDim }}>
                          {gMatches.filter(m => m.completed).length}/{gMatches.length} played
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <StandingsTable standings={gStandings} group={letter} scheme={scheme} qualifyTop={ageGroup === 'Girls' ? 4 : 2} isLight={isLight} />
                        <div className="space-y-3">
                          {Array.from({ length: maxRound }, (_, i) => i + 1).map(round => {
                            const roundMatches = gMatches.filter(m => m.round === round);
                            if (!roundMatches.length) return null;
                            return (
                              <div key={round}>
                                <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: tDim }}>Round {round}</p>
                                <div className="space-y-2">
                                  {roundMatches.map(match => (
                                    <MatchCard key={match.id} match={match} isAdmin={isAdmin}
                                      onSave={updateGroupMatch} onReset={resetGroupMatch}
                                      onSaveTime={updateGroupMatchTime}
                                      colorScheme="group" teams={teams}
                                      showTime showFieldNo={ageGroup === 'Girls'} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ── By Time view ─────────────────────────────────────── */}
                {groupSort === 'time' && (() => {
                  const sorted = [...groupMatches].sort((a, b) => {
                    const ta = a.time || ''; const tb = b.time || '';
                    return ta < tb ? -1 : ta > tb ? 1 : 0;
                  });

                  // Bucket by hour
                  const blocks = [];
                  sorted.forEach(m => {
                    const hour = m.time ? m.time.split(':')[0] : '??';
                    const last = blocks[blocks.length - 1];
                    if (last && last.hour === hour) last.matches.push(m);
                    else blocks.push({ hour, label: `${hour}:00 – ${hour}:59`, matches: [m] });
                  });

                  return (
                    <div className="space-y-6">
                      {blocks.map(block => (
                        <div key={block.hour} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold" style={{ color: scheme.primary }}>
                              {block.label}
                            </span>
                            <div className="flex-1 h-px" style={{ background: scheme.primaryRing }} />
                            <span className="text-xs" style={{ color: tFaint }}>
                              {block.matches.filter(m => m.completed).length}/{block.matches.length} played
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {block.matches.map(match => (
                              <MatchCard key={match.id} match={match} isAdmin={isAdmin}
                                onSave={updateGroupMatch} onReset={resetGroupMatch}
                                onSaveTime={updateGroupMatchTime}
                                colorScheme="group" teams={teams}
                                showTime groupLabel={`Grp ${match.group}`}
                                showFieldNo={ageGroup === 'Girls'} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Knockout tabs */}
        {koSegments.includes(tab) && (
          <div className="space-y-5 fade-up">
            {adminBar}
            {!initialized || !knockoutTemplate ? (
              <div className="text-center py-16" style={{ color: tMuted }}>
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
                  onSaveTime={updateKnockoutMatchTime}
                  teams={teams}
                  scheme={scheme}
                  isLight={isLight}
                  showFieldNo={ageGroup === 'Girls'}
                />
                <div
                  className="p-4 rounded-xl border text-xs leading-relaxed"
                  style={{ backgroundColor: bgSubtle, borderColor: bdSubtle, color: tSecondary }}
                >
                  {tab === 'cup'    && `🏆 Cup: Top 2 from each group. Winners advance; losers drop to Plate.`}
                  {tab === 'plate'  && `🥈 Plate: Cup Quarter Final losers compete for the Plate.`}
                  {tab === 'shield' && `🛡️ Shield: 3rd & 4th from all groups enter Shield Quarter Finals. Losers drop to Bowl.`}
                  {tab === 'bowl'   && `🏅 Bowl: Shield Quarter Final losers compete for the Bowl.`}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Champions Board ────────────────────────────────────────────────── */}
      {initialized && hasChamps && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 mb-2 fade-up">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-2xl sm:text-3xl tracking-widest" style={{ color: scheme.primary }}>
              {ageGroup} Champions
            </h2>
            <div className="flex-1 h-px" style={{ background: scheme.primaryRing }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cup',    icon: '🏆', champ: cupChamp    },
              { label: 'Plate',  icon: '🥈', champ: plateChamp  },
              { label: 'Shield', icon: '🛡️', champ: shieldChamp },
              { label: 'Bowl',   icon: '🏅', champ: bowlChamp   },
            ].map(({ label, icon, champ }) => (
              <div
                key={label}
                className="rounded-xl border p-4 text-center transition-all"
                style={{
                  backgroundColor: champ ? bgSubtle : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.10)'),
                  borderColor: champ ? bdMedium : bdFaint,
                  opacity: champ ? 1 : 0.4,
                }}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-display text-xs tracking-widest mb-1.5" style={{ color: tMuted }}>{label}</div>
                <div
                  className="font-display text-sm sm:text-base tracking-wider truncate"
                  style={{ color: champ ? headingColor : tFainter }}
                >
                  {champ || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer
        className="mt-12 py-6 text-center text-xs"
        style={{ borderTop: `1px solid ${bdFaint}` }}
      >
        <p className="font-display tracking-widest text-sm" style={{ color: tFaint }}>KICKERZ CUP 2026</p>
        <p className="mt-1" style={{ color: tFainter }}>June 6th &amp; 7th · 8:00 AM onwards · 16-minute matches</p>
      </footer>

      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
    </div>
  );
}
