import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import { AGE_GROUPS, AGE_GROUP_LETTERS, calculateStandings } from './tournament';

// ─── Label helpers ─────────────────────────────────────────────────────────────
const AGE_DISPLAY = {
  U10:   'U10',
  U12:   'U12',
  U14:   'U14',
  U16:   'U16',
  Girls: 'Girls U13',
};

const AGE_YEAR_RANGE = {
  U10:   '2015 - 2016',
  U12:   '2013 - 2014',
  U14:   '2011 - 2012',
  U16:   '2009 - 2010',
  Girls: '2012, 13 & 14 (+2 - 2011)',
};

const AGE_DAY = {
  U10:   'Saturday & Sunday',
  U12:   'Saturday & Sunday',
  U14:   'Saturday & Sunday',
  U16:   'Sunday',
  Girls: 'Sunday',
};

// ─── Colors (ARGB) ─────────────────────────────────────────────────────────────
const COLORS = {
  U10:       { header: 'FF2E75B6', light: 'FFBDD7EE' },
  U12:       { header: 'FF375623', light: 'FFD9EAD3' },
  U14:       { header: 'FF7F6000', light: 'FFFFF2CC' },
  U16:       { header: 'FFBE4B03', light: 'FFFCE4D6' },
  Girls:     { header: 'FFC00078', light: 'FFFCE4EC' },
  teamSheet: { header: 'FF1F6E43', light: 'FFD9EAD3' },
  overview:  { header: 'FF274E8B', light: 'FFDCE6F1' },
};

const GREEN_HEADER  = 'FF70AD47';
const LIGHT_GREEN   = 'FFD9EAD3';
const LIGHT_BLUE    = 'FFDCE6F1';
const DARK_BLUE     = 'FF2E75B6';
const WHITE         = 'FFFFFFFF';
const DARK_TEXT     = 'FF000000';
const ROW_ALT       = 'FFF5F5F5';

// ─── Style helpers ─────────────────────────────────────────────────────────────
function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function border(style = 'thin') {
  const s = { style };
  return { top: s, left: s, bottom: s, right: s };
}

function styleCell(cell, opts = {}) {
  const { fillColor, bold, size = 10, color = DARK_TEXT, hAlign = 'left', vAlign = 'middle', wrapText = false } = opts;
  if (fillColor) cell.fill = fill(fillColor);
  cell.font = { name: 'Calibri', size, bold: !!bold, color: { argb: color } };
  cell.alignment = { horizontal: hAlign, vertical: vAlign, wrapText };
  cell.border = border();
}

// ─── Time helpers ───────────────────────────────────────────────────────────────
function to12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function addMinutes(time24, mins) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

// ─── Teams sheet ───────────────────────────────────────────────────────────────
function buildTeamsSheet(wb, allTeams) {
  const ws = wb.addWorksheet('Teams');
  const c = COLORS.teamSheet;

  ws.columns = [
    { width: 40 },
    { width: 14 },
    { width: 10 },
  ];

  // Title
  ws.addRow(['School / Academy', 'Age Group', 'Group']);
  const titleRow = ws.lastRow;
  titleRow.height = 24;
  titleRow.eachCell(cell => styleCell(cell, { fillColor: c.header, bold: true, size: 12, color: WHITE, hAlign: 'center' }));

  // Data
  const sorted = [...allTeams].sort((a, b) => {
    const ai = AGE_GROUPS.indexOf(a.ageGroup);
    const bi = AGE_GROUPS.indexOf(b.ageGroup);
    if (ai !== bi) return ai - bi;
    return a.group.localeCompare(b.group) || a.name.localeCompare(b.name);
  });

  let lastAge = null;
  sorted.forEach((team, i) => {
    if (team.ageGroup !== lastAge) {
      // Age group separator row
      ws.addRow([`— ${AGE_DISPLAY[team.ageGroup]} (${AGE_YEAR_RANGE[team.ageGroup]}) —`, '', '']);
      const sepRow = ws.lastRow;
      sepRow.height = 20;
      const ageColor = COLORS[team.ageGroup] || c;
      sepRow.eachCell(cell => styleCell(cell, { fillColor: ageColor.light, bold: true, size: 11, hAlign: 'center' }));
      lastAge = team.ageGroup;
    }
    ws.addRow([team.name, team.ageGroup, team.group]);
    const r = ws.lastRow;
    r.height = 17;
    r.eachCell(cell => styleCell(cell, { fillColor: i % 2 === 0 ? ROW_ALT : WHITE }));
  });
}

// ─── Overview sheet ─────────────────────────────────────────────────────────────
function buildOverviewSheet(wb, allTeams) {
  const ws = wb.addWorksheet('Overview');

  const activeGroups = AGE_GROUPS.filter(ag => allTeams.some(t => t.ageGroup === ag));
  if (activeGroups.length === 0) return;

  // Set column widths (one column per age group)
  activeGroups.forEach((_, i) => { ws.getColumn(i + 1).width = 26; });

  // Row 1: Category / day header
  activeGroups.forEach((ag, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value = AGE_DAY[ag];
    styleCell(cell, { fillColor: COLORS.overview.light, bold: true, size: 11, hAlign: 'center' });
  });
  ws.getRow(1).height = 20;

  // Row 2: Age group name
  activeGroups.forEach((ag, i) => {
    const cell = ws.getCell(2, i + 1);
    cell.value = AGE_DISPLAY[ag];
    styleCell(cell, { fillColor: COLORS[ag]?.header || DARK_BLUE, bold: true, size: 13, color: WHITE, hAlign: 'center' });
  });
  ws.getRow(2).height = 25;

  // Row 3: Year range
  activeGroups.forEach((ag, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = AGE_YEAR_RANGE[ag];
    styleCell(cell, { fillColor: COLORS[ag]?.light || LIGHT_BLUE, bold: true, hAlign: 'center' });
  });
  ws.getRow(3).height = 18;

  // Team rows - find max
  const maxTeams = Math.max(...activeGroups.map(ag => allTeams.filter(t => t.ageGroup === ag).length));
  const teamsPerAge = Object.fromEntries(
    activeGroups.map(ag => [ag, allTeams.filter(t => t.ageGroup === ag).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))])
  );

  for (let i = 0; i < maxTeams; i++) {
    const rowNum = 4 + i;
    activeGroups.forEach((ag, j) => {
      const team = teamsPerAge[ag][i];
      const cell = ws.getCell(rowNum, j + 1);
      cell.value = team ? team.name : '';
      styleCell(cell, { fillColor: team ? (i % 2 === 0 ? ROW_ALT : WHITE) : 'FFF0F0F0' });
    });
    ws.getRow(rowNum).height = 17;
  }

  // Count row
  const countRow = 4 + maxTeams;
  activeGroups.forEach((ag, i) => {
    const cell = ws.getCell(countRow, i + 1);
    cell.value = teamsPerAge[ag].length;
    styleCell(cell, { fillColor: LIGHT_GREEN, bold: true, hAlign: 'center' });
  });
  ws.getRow(countRow).height = 18;
}

// ─── Age group sheet ────────────────────────────────────────────────────────────
function buildAgeGroupSheet(wb, ageGroup, teams, matches, knockouts) {
  const ws = wb.addWorksheet(ageGroup === 'Girls' ? 'Girls U13' : ageGroup);
  const letters = (AGE_GROUP_LETTERS[ageGroup] || []).filter(l => teams.some(t => t.group === l));
  const c = COLORS[ageGroup] || COLORS.U10;

  // Total column span we'll use (at least 9 for match schedule)
  const totalCols = Math.max(letters.length, 9);

  // ── Section 1: Title ────────────────────────────────────────────────────────
  ws.addRow([`${AGE_DISPLAY[ageGroup]}     ${AGE_YEAR_RANGE[ageGroup]}     ${AGE_DAY[ageGroup]}`]);
  const titleRow = ws.lastRow;
  ws.mergeCells(titleRow.number, 1, titleRow.number, totalCols);
  titleRow.height = 28;
  styleCell(ws.getCell(titleRow.number, 1), { fillColor: c.header, bold: true, size: 15, color: WHITE, hAlign: 'center' });

  ws.addRow([]); // blank

  if (letters.length === 0) {
    ws.addRow(['No teams registered for this age group.']);
    return;
  }

  // ── Section 2: Group assignments ────────────────────────────────────────────
  // Section title
  ws.addRow(['Groups']);
  const grpTitleRow = ws.lastRow;
  ws.mergeCells(grpTitleRow.number, 1, grpTitleRow.number, letters.length || 1);
  styleCell(ws.getCell(grpTitleRow.number, 1), { fillColor: c.light, bold: true, size: 12, hAlign: 'center' });
  grpTitleRow.height = 20;

  // Group letter headers
  const letterRowNum = ws.lastRow.number + 1;
  ws.addRow(letters);
  const letterRow = ws.lastRow;
  letterRow.height = 20;
  letters.forEach((_, i) => {
    styleCell(ws.getCell(letterRowNum, i + 1), { fillColor: LIGHT_GREEN, bold: true, hAlign: 'center', size: 11 });
  });

  // Teams under each group letter
  const teamsPerGroup = Object.fromEntries(letters.map(l => [l, teams.filter(t => t.group === l)]));
  const maxInGroup = Math.max(...letters.map(l => teamsPerGroup[l].length));
  for (let i = 0; i < maxInGroup; i++) {
    const vals = letters.map(l => teamsPerGroup[l][i]?.name || '');
    ws.addRow(vals);
    const r = ws.lastRow;
    r.height = 17;
    letters.forEach((_, j) => {
      styleCell(ws.getCell(r.number, j + 1), { fillColor: i % 2 === 0 ? ROW_ALT : WHITE });
    });
  }

  // Team count per group
  const countVals = letters.map(l => teamsPerGroup[l].length);
  ws.addRow(countVals);
  const cntRow = ws.lastRow;
  cntRow.height = 18;
  letters.forEach((_, j) => {
    styleCell(ws.getCell(cntRow.number, j + 1), { fillColor: c.light, bold: true, hAlign: 'center' });
  });

  ws.addRow([]); ws.addRow([]);

  // ── Section 3: Match schedule ───────────────────────────────────────────────
  if (matches.length > 0) {
    // Section title
    ws.addRow(['Match Schedule']);
    const msTitle = ws.lastRow;
    ws.mergeCells(msTitle.number, 1, msTitle.number, 9);
    styleCell(ws.getCell(msTitle.number, 1), { fillColor: c.header, bold: true, size: 12, color: WHITE, hAlign: 'center' });
    msTitle.height = 22;

    // Headers (matching PDF columns)
    ws.addRow(['Game No', 'Start Time', 'End Time', 'Round', 'Group', 'Team A', 'Score', '', 'Team B']);
    const hRow = ws.lastRow;
    hRow.height = 20;
    hRow.eachCell(cell => styleCell(cell, { fillColor: LIGHT_GREEN, bold: true, hAlign: 'center', size: 10 }));

    // Sort matches by scheduled order (match id already sequential)
    const sortedMatches = [...matches].sort((a, b) => {
      const aNum = parseInt((a.id || '').replace(/\D/g, '')) || 0;
      const bNum = parseInt((b.id || '').replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });

    sortedMatches.forEach((match, idx) => {
      const homeTeam = teams.find(t => t.id === match.homeTeamId);
      const awayTeam = teams.find(t => t.id === match.awayTeamId);
      const startStr = to12h(match.time);
      const endStr   = to12h(addMinutes(match.time, 16));
      const score    = match.completed ? `${match.homeScore} - ${match.awayScore}` : '';

      ws.addRow([
        idx + 1,
        startStr,
        endStr,
        match.round,
        match.group,
        homeTeam?.name || 'TBD',
        score,
        'vs',
        awayTeam?.name || 'TBD',
      ]);
      const r = ws.lastRow;
      r.height = 17;
      const altFill = idx % 2 === 0 ? ROW_ALT : WHITE;
      r.eachCell((cell, colNum) => {
        styleCell(cell, {
          fillColor: altFill,
          hAlign: colNum === 1 || colNum === 4 || colNum === 5 || colNum === 7 || colNum === 8 ? 'center' : 'left',
        });
      });
    });
  }

  ws.addRow([]); ws.addRow([]);

  // ── Section 4: Group standings ──────────────────────────────────────────────
  const completedCount = matches.filter(m => m.completed).length;
  if (completedCount > 0) {
    ws.addRow(['Group Standings']);
    const stTitle = ws.lastRow;
    ws.mergeCells(stTitle.number, 1, stTitle.number, 10);
    styleCell(ws.getCell(stTitle.number, 1), { fillColor: c.header, bold: true, size: 12, color: WHITE, hAlign: 'center' });
    stTitle.height = 22;

    for (const letter of letters) {
      const standing = calculateStandings(matches, letter, teams);
      if (standing.length === 0) continue;

      // Group header
      ws.addRow([`Group ${letter}`]);
      const ghRow = ws.lastRow;
      ws.mergeCells(ghRow.number, 1, ghRow.number, 10);
      styleCell(ws.getCell(ghRow.number, 1), { fillColor: c.light, bold: true, size: 11, hAlign: 'center' });
      ghRow.height = 20;

      // Column headers (matching PDF standings format)
      ws.addRow(['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts']);
      const shRow = ws.lastRow;
      shRow.height = 18;
      shRow.eachCell(cell => styleCell(cell, { fillColor: LIGHT_GREEN, bold: true, hAlign: 'center', size: 10 }));

      standing.forEach((row, i) => {
        ws.addRow([i + 1, row.teamName, row.played, row.won, row.drawn, row.lost, row.gf, row.ga, row.gd, row.points]);
        const sr = ws.lastRow;
        sr.height = 17;
        sr.eachCell((cell, colNum) => {
          styleCell(cell, { fillColor: i % 2 === 0 ? ROW_ALT : WHITE, hAlign: colNum === 2 ? 'left' : 'center' });
        });
      });

      ws.addRow([]); // gap between groups
    }
  }

  ws.addRow([]); ws.addRow([]);

  // ── Section 5: Knockout results ─────────────────────────────────────────────
  const completedKO = knockouts.filter(m => m.completed);
  if (completedKO.length > 0) {
    ws.addRow(['Knockout Results']);
    const koTitle = ws.lastRow;
    ws.mergeCells(koTitle.number, 1, koTitle.number, 9);
    styleCell(ws.getCell(koTitle.number, 1), { fillColor: c.header, bold: true, size: 12, color: WHITE, hAlign: 'center' });
    koTitle.height = 22;

    // Group by segment then round
    const KO_ORDER = ['cup', 'plate', 'shield', 'bowl'];
    const bySegment = {};
    knockouts.forEach(ko => {
      const seg = ko.segment || 'unknown';
      if (!bySegment[seg]) bySegment[seg] = {};
      const rnd = ko.roundLabel || ko.roundId || 'Match';
      if (!bySegment[seg][rnd]) bySegment[seg][rnd] = [];
      bySegment[seg][rnd].push(ko);
    });

    const segments = KO_ORDER.filter(s => bySegment[s]);

    for (const seg of segments) {
      const segLabel = { cup: 'Cup', plate: 'Plate', shield: 'Shield', bowl: 'Bowl' }[seg];
      const KO_ICONS = { cup: '🏆', plate: '🥈', shield: '🛡️', bowl: '🏅' };

      ws.addRow([`${KO_ICONS[seg]}  ${segLabel}`]);
      const segRow = ws.lastRow;
      ws.mergeCells(segRow.number, 1, segRow.number, 9);
      styleCell(ws.getCell(segRow.number, 1), { fillColor: c.light, bold: true, size: 12, hAlign: 'center' });
      segRow.height = 20;

      for (const [rndLabel, rndMatches] of Object.entries(bySegment[seg])) {
        // Round sub-header
        ws.addRow([rndLabel, '', '', 'Team A', 'Score', '', 'Team B', '', '']);
        const rhRow = ws.lastRow;
        rhRow.height = 18;
        rhRow.eachCell(cell => styleCell(cell, { fillColor: LIGHT_BLUE, bold: true, hAlign: 'center', size: 10 }));

        rndMatches.forEach((ko, i) => {
          const homeTeam = teams.find(t => t.id === ko.homeTeamId);
          const awayTeam = teams.find(t => t.id === ko.awayTeamId);
          let scoreStr = '';
          if (ko.completed) {
            scoreStr = `${ko.homeScore} - ${ko.awayScore}`;
            if (ko.penWinner) scoreStr += ` (pens: ${ko.penHomeScore}-${ko.penAwayScore})`;
          }

          ws.addRow(['', '', '', homeTeam?.name || 'TBD', scoreStr, 'vs', awayTeam?.name || 'TBD', '', '']);
          const mr = ws.lastRow;
          mr.height = 17;
          mr.eachCell(cell => styleCell(cell, { fillColor: i % 2 === 0 ? ROW_ALT : WHITE, hAlign: 'center' }));
          ws.getCell(mr.number, 4).alignment = { horizontal: 'left' };
          ws.getCell(mr.number, 7).alignment = { horizontal: 'left' };
        });
      }
      ws.addRow([]);
    }
  }

  // ── Set column widths ───────────────────────────────────────────────────────
  // Base widths for match schedule columns
  ws.getColumn(1).width = 10;  // Game No / Pos
  ws.getColumn(2).width = 13;  // Start Time / Team name
  ws.getColumn(3).width = 13;  // End Time
  ws.getColumn(4).width = 8;   // Round
  ws.getColumn(5).width = 8;   // Group
  ws.getColumn(6).width = 26;  // Team A
  ws.getColumn(7).width = 14;  // Score
  ws.getColumn(8).width = 6;   // vs
  ws.getColumn(9).width = 26;  // Team B

  // Also ensure group columns are wide enough
  letters.forEach((_, i) => {
    const col = ws.getColumn(i + 1);
    if ((col.width || 0) < 22) col.width = 22;
  });
}

// ─── Main export function ──────────────────────────────────────────────────────
export async function exportTournamentToExcel() {
  // Lazy-load ExcelJS to keep initial bundle small
  const { default: ExcelJS } = await import('exceljs');

  const [teamsSnap, matchesSnap, koSnap] = await Promise.all([
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'matches')),
    getDocs(collection(db, 'knockouts')),
  ]);

  // Drop placeholder entries whose name is just a slot ID: A1, B1, A4, Girls_Q1, U10_A2 etc.
  const SLOT_ID = /^([A-Za-z0-9]+_)?[A-Za-z]\d+$/i;
  const allTeams = teamsSnap.docs
    .map(d => d.data())
    .filter(t => {
      const name = (t.name || '').trim();
      return name && !SLOT_ID.test(name);
    });
  const allMatches  = matchesSnap.docs.map(d => ({ ...d.data(), id: d.id }));
  const allKnockouts = koSnap.docs.map(d => ({ ...d.data(), id: d.id }));

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Kickerz Cup 2026';
  wb.created  = new Date();
  wb.modified = new Date();

  buildTeamsSheet(wb, allTeams);
  buildOverviewSheet(wb, allTeams);

  for (const ag of AGE_GROUPS) {
    const agTeams    = allTeams.filter(t => t.ageGroup === ag);
    if (agTeams.length === 0) continue;
    const agMatches  = allMatches.filter(m => m.ageGroup === ag);
    const agKO       = allKnockouts.filter(m => m.ageGroup === ag);
    buildAgeGroupSheet(wb, ag, agTeams, agMatches, agKO);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = 'Kickerz_Cup_2026_Draw.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}