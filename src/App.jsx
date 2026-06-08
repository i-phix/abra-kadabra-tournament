import { useState } from "react";

const GROUPS = {
  A: [
    "France",
    "Spain",
    "Argentina",
    "England",
    "Portugal",
    "Brazil",
    "Netherlands",
    "Morocco",
  ],
  B: [
    "Belgium",
    "Germany",
    "Croatia",
    "Colombia",
    "Senegal",
    "Mexico",
    "USA",
    "Uruguay",
  ],
  C: [
    "Japan",
    "Switzerland",
    "IR Iran",
    "Turkiye",
    "Ecuador",
    "Austria",
    "Korea Republic",
    "Australia",
  ],
  D: [
    "Algeria",
    "Egypt",
    "Canada",
    "Norway",
    "Panama",
    "Cote D'Ivoire",
    "Sweden",
    "Paraguay",
  ],
  E: [
    "Czechia",
    "Scotland",
    "Tunisia",
    "Congo DR",
    "Uzbekistan",
    "Qatar",
    "Iraq",
    "South Africa",
  ],
  F: [
    "Saudi Arabia",
    "Jordan",
    "Bosnia & Herzegovina",
    "Cabo Verde",
    "Ghana",
    "Curacao",
    "Haiti",
    "New Zealand",
  ],
};

const TEAM_GROUP = {};
Object.entries(GROUPS).forEach(([g, teams]) =>
  teams.forEach((t) => {
    TEAM_GROUP[t] = g;
  }),
);
const ALL_TEAMS = Object.entries(GROUPS).flatMap(([g, teams]) =>
  teams.map((t) => ({ team: t, group: g })),
);
const GROUPS_LIST = ["A", "B", "C", "D", "E", "F"];

const SCORING = {
  groupStage: {
    A: { W: 1, D: 0 },
    B: { W: 1, D: 1 },
    C: { W: 2, D: 1 },
    D: { W: 2, D: 1 },
    E: { W: 3, D: 2 },
    F: { W: 4, D: 2 },
  },
  roundOf32: { A: 1, B: 1, C: 2, D: 2, E: 2, F: 3 },
  roundOf16: { A: 1, B: 1, C: 1, D: 1, E: 2, F: 2 },
  quarters: 1,
  semis: 2,
  thirdPlace: 1,
  final: 3,
};

const GROUP_COLORS = {
  A: "#1a1a2e",
  B: "#16213e",
  C: "#0f3460",
  D: "#1a472a",
  E: "#4a1942",
  F: "#7b2d00",
};

const ADMIN_USERS = ["kenergy", "admin"];
const MATCHES = ["m1", "m2", "m3"];

const API_NAME_MAP = {
  "Czech Republic": "Czechia",
  "DR Congo": "Congo DR",
  "Democratic Republic of Congo": "Congo DR",
  "Democratic Republic of the Congo": "Congo DR",
  "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "Cape Verde Islands": "Cabo Verde",
  "Cape Verde": "Cabo Verde",
  "Côte d'Ivoire": "Cote D'Ivoire",
  "Cote d'Ivoire": "Cote D'Ivoire",
  "Ivory Coast": "Cote D'Ivoire",
  Türkiye: "Turkiye",
  Turkey: "Turkiye",
  "United States": "USA",
  "South Korea": "Korea Republic",
  "Republic of Korea": "Korea Republic",
  Bosnia: "Bosnia & Herzegovina",
};

const STAGE_MAP = {
  ROUND_OF_16: "ro32",
  LAST_16: "ro32",
  ROUND_OF_32: "ro32",
  ROUND_OF_16_2: "ro16",
  QUARTER_FINALS: "quarters",
  SEMI_FINALS: "semis",
  THIRD_PLACE: "thirdPlace",
  PLAY_OFF_FOR_THIRD_PLACE: "thirdPlace",
  FINAL: "final",
};

function normalizeApiName(name) {
  return API_NAME_MAP[name] || name;
}

function buildMatchResults(wins, draws, losses) {
  const r = [];
  for (let i = 0; i < wins; i++) r.push("W");
  for (let i = 0; i < draws; i++) r.push("D");
  for (let i = 0; i < losses; i++) r.push("L");
  while (r.length < 3) r.push("");
  return r.slice(0, 3);
}

function getMatchTotals(r) {
  let wins = 0,
    draws = 0;
  MATCHES.forEach((m) => {
    if (r[m] === "W") wins++;
    else if (r[m] === "D") draws++;
  });
  return { wins, draws };
}

function computeTeamPoints(team, teamResults) {
  const g = TEAM_GROUP[team];
  if (!g) return 0;
  const r = teamResults[team] || {};
  const sc = SCORING.groupStage[g];
  const { wins, draws } = getMatchTotals(r);
  let pts = wins * sc.W + draws * sc.D;
  if (r.eliminated) return pts;
  if (r.ro32) pts += SCORING.roundOf32[g];
  if (r.ro16) pts += SCORING.roundOf16[g];
  if (r.quarters) pts += SCORING.quarters;
  if (r.semis) pts += SCORING.semis;
  if (r.thirdPlace) pts += SCORING.thirdPlace;
  if (r.final) pts += SCORING.final;
  return pts;
}

function computePlayerData(picks, teamResults) {
  let total = 0;
  const breakdown = {};
  Object.entries(picks).forEach(([g, team]) => {
    const pts = computeTeamPoints(team, teamResults);
    const elim = !!(teamResults[team] || {}).eliminated;
    breakdown[g] = { team, pts, elim };
    total += pts;
  });
  return { total, breakdown };
}

const SK = "abrakadabra_players";
const RK = "abrakadabra_team_results";
const AK = "0d73bad5c3114f288747caef2d389819";
const CK = "abrakadabra_current_user";

function load(key, fb) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fb;
  } catch {
    return fb;
  }
}
function loadStr(key, fb) {
  try {
    return localStorage.getItem(key) || fb;
  } catch {
    return fb;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #f6f6f4;
    color: #18181a;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app { min-height: 100vh; background: #f6f6f4; }

  /* NAV */
  .nav {
    border-bottom: 1px solid #e2e2df;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 54px;
    background: #fff;
  }
  .nav-brand {
    font-weight: 600;
    font-size: 22px;
    letter-spacing: -0.01em;
    color: #18181a;
  }
  .nav-actions { display: flex; gap: 6px; }
  .nav-btn {
    padding: 7px 16px;
    border-radius: 8px;
    border: 1px solid #e2e2df;
    background: transparent;
    color: #52525b;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .nav-btn:hover { background: #f4f4f2; border-color: #ccc; color: #18181a; }
  .nav-btn.active { background: #18181a; color: #fff; border-color: #18181a; }

  /* PAGE WRAPPER */
  .page { max-width: 700px; margin: 0 auto; padding: 48px 24px 64px; }
  .page-wide { max-width: 85vw; margin: 0 auto; padding: 40px 24px 64px; }

  /* HEADINGS */
  h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 6px; color: #18181a; }
  h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 4px; }
  .subtitle { font-size: 14px; color: #71717a; margin-bottom: 40px; font-weight: 400; line-height: 1.5; }

  /* FORM ELEMENTS */
  .field { margin-bottom: 28px; }
  .field label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 8px;
    color: #71717a;
  }
  .input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 9px;
    border: 1px solid #e2e2df;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14.5px;
    font-weight: 400;
    color: #18181a;
    outline: none;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  .input:focus { border-color: #a1a1aa; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
  .input::placeholder { color: #a1a1aa; }

  /* GROUP GRID */
  .group-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 28px;
  }

  /* GROUP CARD */
  .group-card {
    border-radius: 12px;
    border: 1px solid #e2e2df;
    background: #fff;
    overflow: hidden;
  }
  .group-card-header {
    padding: 11px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .group-card-title {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.95);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .group-card-scoring {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.04em;
  }
  .group-card-body { padding: 12px; display: flex; flex-wrap: wrap; gap: 7px; }

  /* ── TEAM CHIPS ── */
  .team-chip {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid #e4e4e1;
    background: #fafaf8;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    color: #3f3f46;
    transition: border-color 0.12s, background 0.12s, color 0.12s, transform 0.08s;
    white-space: nowrap;
    letter-spacing: -0.01em;
    user-select: none;
    line-height: 1;
  }
  .team-chip:hover {
    border-color: #b4b4af;
    background: #f4f4f0;
    color: #18181a;
  }
  .team-chip:active { transform: scale(0.97); }
  .team-chip.selected {
    background: #18181a;
    border-color: #18181a;
    color: #fff;
    font-weight: 500;
  }

  /* PICKS SUMMARY */
  .picks-summary {
    border-radius: 12px;
    border: 1px solid #e2e2df;
    background: #fff;
    padding: 16px 18px;
    margin-bottom: 24px;
  }
  .picks-summary-label {
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #a1a1aa;
    margin-bottom: 12px;
  }
  .picks-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .pick-chip {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border-radius: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px;
    font-weight: 500;
    color: #fff;
    letter-spacing: -0.01em;
    line-height: 1;
  }
  .pick-chip-empty {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border-radius: 7px;
    font-size: 12.5px;
    font-weight: 400;
    background: #f4f4f2;
    color: #a1a1aa;
    border: 1px dashed #d4d4d0;
    font-family: 'DM Sans', sans-serif;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  /* ERROR */
  .error {
    font-size: 13px;
    color: #dc2626;
    margin-bottom: 14px;
    padding: 10px 14px;
    background: #fef2f2;
    border-radius: 8px;
    border: 1px solid #fecaca;
  }

  /* PROGRESS BAR */
  .progress-bar {
    height: 2px;
    background: #e4e4e1;
    border-radius: 2px;
    margin-bottom: 36px;
    overflow: hidden;
  }
  .progress-fill {
    height: 2px;
    background: #18181a;
    border-radius: 2px;
    transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* BUTTONS */
  .btn-primary {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    background: #18181a;
    color: #fff;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: background 0.12s, transform 0.08s;
  }
  .btn-primary:hover { background: #2c2c2e; }
  .btn-primary:active { transform: scale(0.99); }
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    background: #fff;
    color: #18181a;
    border: 1px solid #e2e2df;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: background 0.12s, border-color 0.12s;
  }
  .btn-secondary:hover { background: #f4f4f2; border-color: #ccc; }
  .btn-group { display: flex; gap: 10px; margin-top: 20px; }

  /* VIEWER LOGIN */
  .login-card {
    max-width: 360px;
    margin: 0 auto 40px;
    border-radius: 14px;
    border: 1px solid #e2e2df;
    background: #fff;
    padding: 28px;
  }
  .login-card h2 { font-size: 16px; margin-bottom: 18px; }

  /* LEADERBOARD */
  .lb-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20px;
  }
  .lb-meta { font-size: 13px; color: #71717a; margin-top: 4px; }
  .lb-viewer { font-size: 13px; color: #ffffff; display: flex; align-items: center; gap: 10px; }
  .lb-table-wrap { border-radius: none; border: 1px solid #afafaf; overflow-x: auto; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; min-width: 900px; font-size: 13px; }
  thead tr { background: #18181a; }
  thead th {
    padding: 11px 12px;
    text-align: left;
    font-family: 'Arial', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    border-right: 1px solid #2c2c2e;
    color: #ffffff;
  }
  thead th:last-child { border-right: none; }
  tbody tr { border-bottom: 1px solid #f0f0ee; transition: background 0.08s; }
  tbody tr:hover { background: #fafaf8; }
  tbody tr:nth-child(even) { background: #c4c4c4; }
  tbody tr.is-first { background: #ffffff; }
  td { padding: 10px 12px; border-right: 1px solid #f0f0ee; }
  td:last-child { border-right: none; }
  tfoot tr { border-top: 2px solid #e2e2df; background: #f6f6f4; }
  tfoot td { padding: 11px 12px; font-weight: 600; border-right: 1px solid #e2e2df; }

  .rank-cell { font-weight: 600; font-size: 14px; text-align: center; color: #3f3f46; font-family: 'Arial', monospace; }
  .team-cell {
    text-align: center;
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .team-cell.active { background: #a0f8ba; color: #033115; }
  .team-cell.elim { background: #ffc2c2; color: #ff0000; }
  .pts-cell { text-align: center; font-variant-numeric: tabular-nums; color: #52525b; }
  .total-cell { text-align: center; font-weight: 600; font-size: 14.5px; font-family: 'Arial', monospace; }

  /* ADMIN ACTION CELL */
  .action-cell { text-align: center; width: 48px; }
  .btn-remove-player {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #dc2626;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    transition: background 0.1s, border-color 0.1s, color 0.1s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-remove-player:hover { background: #fee2e2; border-color: #f87171; color: #b91c1c; }

  /* CONFIRM POPOVER */
  .confirm-row td {
    background: #fef2f2 !important;
    padding: 10px 12px !important;
  }
  .confirm-inline {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #991b1b;
  }
  .confirm-inline strong { font-weight: 600; }
  .confirm-inline .confirm-actions { display: flex; gap: 6px; margin-left: auto; }
  .btn-confirm-delete {
    height: 28px;
    padding: 0 12px;
    border-radius: 6px;
    background: #dc2626;
    color: #fff;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.1s;
  }
  .btn-confirm-delete:hover { background: #b91c1c; }
  .btn-cancel-delete {
    height: 28px;
    padding: 0 12px;
    border-radius: 6px;
    background: #fff;
    color: #52525b;
    border: 1px solid #e2e2df;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.1s;
  }
  .btn-cancel-delete:hover { background: #f4f4f2; }

  .empty-state { text-align: center; padding: 80px 0; color: #a1a1aa; font-size: 14px; }

  /* EDIT MODE BANNER */
  .edit-banner {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13.5px;
    color: #92400e;
  }
  .edit-banner strong { font-weight: 600; }
  .edit-banner-actions { display: flex; gap: 8px; }

  /* ADMIN MODAL */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 999;
    backdrop-filter: blur(2px);
  }
  .modal {
    background: #fff;
    border-radius: 16px;
    padding: 28px;
    width: 92%;
    max-width: 720px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid #e2e2df;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  }
  .modal-header {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 20px;
    border-bottom: 1px solid #f0f0ee; padding-bottom: 16px;
  }
  .modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: #f4f4f2; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #71717a; font-size: 16px;
    font-family: inherit; transition: background 0.12s;
  }
  .modal-close:hover { background: #eaeae8; color: #18181a; }

  /* PLAYERS SECTION IN ADMIN */
  .admin-players-section {
    margin-bottom: 24px;
    border-radius: 10px;
    border: 1px solid #fecaca;
    overflow: hidden;
  }
  .admin-players-header {
    padding: 10px 14px;
    background: #fef2f2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #fecaca;
  }
  .admin-players-title {
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #991b1b;
    font-family: 'DM Mono', monospace;
  }
  .admin-players-count {
    font-size: 11px;
    color: #b91c1c;
    font-family: 'DM Mono', monospace;
  }
  .admin-player-row {
    display: flex;
    align-items: center;
    padding: 9px 14px;
    border-bottom: 1px solid #fee2e2;
    gap: 10px;
    font-size: 13.5px;
    transition: background 0.08s;
  }
  .admin-player-row:last-child { border-bottom: none; }
  .admin-player-row:hover { background: #fff5f5; }
  .admin-player-name { flex: 1; font-weight: 500; color: #3f3f46; }
  .admin-player-picks {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .admin-pick-badge {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.9);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.02em;
  }
  .admin-player-confirm {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #991b1b;
    background: #fef2f2;
    padding: 6px 10px;
    border-radius: 7px;
    border: 1px solid #fecaca;
  }
  .admin-player-confirm span { font-weight: 500; }

  /* API PANEL */
  .api-panel {
    background: #f6f6f4;
    border-radius: 10px;
    border: 1px solid #e2e2df;
    padding: 16px;
    margin-bottom: 20px;
  }
  .api-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .badge-ok {
    font-size: 11.5px; background: #f0fdf4; color: #15803d;
    padding: 4px 10px; font-weight: 500; letter-spacing: 0.02em;
    border-radius: 6px; border: 1px solid #bbf7d0;
  }
  .msg { font-size: 12.5px; padding: 8px 12px; margin-top: 8px; font-weight: 400; border-radius: 8px; }
  .msg.ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .msg.err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  .btn-sm {
    height: 32px; padding: 0 14px; border-radius: 7px;
    border: 1px solid #e2e2df; background: #fff;
    color: #3f3f46; font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500; cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
  }
  .btn-sm:hover { background: #f4f4f2; border-color: #ccc; }
  .btn-sm.outline {
    background: transparent; color: #a1a1aa; border-color: #e2e2df; font-size: 11.5px;
  }
  .btn-sm.outline:hover { color: #3f3f46; border-color: #b4b4af; }
  .btn-sync {
    height: 36px; padding: 0 18px; border-radius: 9px;
    background: #1a3a6c; color: #fff;
    border: none; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
    letter-spacing: -0.01em; transition: background 0.12s;
  }
  .btn-sync:hover { background: #1e4080; }
  .btn-sync:disabled { background: #a1a1aa; cursor: not-allowed; }

  /* GROUP TABS */
  .group-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
  .group-tab {
    height: 34px; padding: 0 16px; border-radius: 8px;
    border: 1px solid #e2e2df; background: #fff;
    font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
    cursor: pointer; color: #52525b; letter-spacing: 0.04em;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }
  .group-tab:hover { background: #f4f4f2; border-color: #ccc; }
  .group-tab.active { background: #18181a; color: #fff; border-color: #18181a; }

  /* FIXTURES */
  .fixtures-label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
    text-transform: uppercase; color: #a1a1aa; margin-bottom: 8px;
    font-family: 'DM Mono', monospace;
  }
  .fixture-row {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 10px; border-bottom: 1px solid #f4f4f2;
    font-size: 12px;
  }
  .fixture-row:last-child { border-bottom: none; }
  .fixture-row:hover { background: #fafaf8; }
  .fixture-md { font-size: 10px; color: #d4d4d0; width: 24px; flex-shrink: 0; font-family: 'DM Mono', monospace; }
  .fixture-team { flex: 1; font-weight: 500; color: #3f3f46; font-size: 12.5px; }
  .fixture-team.home { text-align: right; }
  .fixture-score {
    margin: 0 8px; min-width: 56px; text-align: center;
    font-family: 'DM Mono', monospace; font-weight: 500;
    border: 1px solid #e4e4e1; border-radius: 6px;
    padding: 3px 8px; font-size: 12.5px;
  }
  .fixture-status { font-size: 10.5px; font-weight: 500; width: 36px; text-align: right; font-family: 'DM Mono', monospace; }

  /* TEAM ADMIN CARD */
  .team-admin-card { border-radius: 10px; border: 1px solid #e2e2df; background: #fff; overflow: hidden; }
  .team-admin-header {
    padding: 10px 14px; display: flex;
    justify-content: space-between; align-items: center;
  }
  .team-admin-name { font-size: 13.5px; font-weight: 500; color: #fff; letter-spacing: -0.01em; }
  .team-admin-pts {
    font-family: 'DM Mono', monospace;
    font-size: 12px; background: rgba(255,255,255,0.18);
    padding: 2px 10px; border-radius: 5px; color: rgba(255,255,255,0.9); font-weight: 500;
  }
  .team-admin-body { padding: 12px 14px; }

  .section-label {
    font-size: 10.5px; font-weight: 500; letter-spacing: 0.06em;
    text-transform: uppercase; color: #a1a1aa; margin-bottom: 8px;
    font-family: 'DM Mono', monospace;
  }
  .wdl-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .wdl-match-label { font-size: 11.5px; color: #71717a; width: 46px; flex-shrink: 0; }
  .wdl-buttons { display: flex; gap: 3px; flex: 1; }
  .wdl-btn {
    flex: 1; height: 30px; border-radius: 6px;
    border: 1px solid #e4e4e1; background: #fafaf8;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
    cursor: pointer; transition: all 0.1s; color: #a1a1aa;
  }
  .wdl-btn.W { background: #f0fdf4; border-color: #86efac; color: #166534; }
  .wdl-btn.D { background: #fefce8; border-color: #fde047; color: #854d0e; }
  .wdl-btn.L { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
  .wdl-pts { font-family: 'DM Mono', monospace; font-size: 10.5px; color: #a1a1aa; width: 24px; text-align: right; }

  .knockout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .ko-check {
    display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; cursor: pointer; padding: 4px 0;
    color: #3f3f46;
  }
  .ko-check input { cursor: pointer; accent-color: #18181a; width: 14px; height: 14px; }
  .ko-check .ko-pts { font-size: 10.5px; color: #a1a1aa; font-family: 'DM Mono', monospace; }

  .elim-toggle {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500; cursor: pointer;
    margin-bottom: 12px; padding: 9px 12px;
    border-radius: 8px; border: 1px solid #e4e4e1; background: #fafaf8;
    transition: background 0.1s, border-color 0.1s;
  }
  .elim-toggle input { accent-color: #dc2626; width: 14px; height: 14px; }
  .elim-toggle.is-elim { background: #fef2f2; border-color: #fecaca; color: #991b1b; }

  .stat-line { font-size: 11.5px; color: #a1a1aa; margin-top: 6px; font-family: 'DM Mono', monospace; }
  .admin-teams-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .divider { border: none; border-top: 1px solid #f0f0ee; margin: 12px 0; }
`;

function WDLButton({ value, current, onClick }) {
  const active = current === value;
  return (
    <button
      className={`wdl-btn ${active ? value : ""}`}
      onClick={() => onClick(active ? "" : value)}
    >
      {value}
    </button>
  );
}

const STATIC_FIXTURES = {
  A: [
    { home: "France", away: "Senegal", date: "Jun 16", matchday: 1 },
    { home: "Spain", away: "Cabo Verde", date: "Jun 15", matchday: 1 },
    { home: "Argentina", away: "Algeria", date: "Jun 16", matchday: 1 },
    { home: "England", away: "Croatia", date: "Jun 17", matchday: 1 },
    { home: "Portugal", away: "Congo DR", date: "Jun 17", matchday: 1 },
    { home: "Brazil", away: "Morocco", date: "Jun 13", matchday: 1 },
    { home: "Netherlands", away: "Japan", date: "Jun 14", matchday: 1 },
    { home: "Germany", away: "Curacao", date: "Jun 14", matchday: 1 },
    { home: "France", away: "Iraq", date: "Jun 20", matchday: 2 },
    { home: "Spain", away: "Saudi Arabia", date: "Jun 20", matchday: 2 },
    { home: "Argentina", away: "Jordan", date: "Jun 21", matchday: 2 },
    { home: "England", away: "Ghana", date: "Jun 21", matchday: 2 },
    { home: "Portugal", away: "Colombia", date: "Jun 22", matchday: 2 },
    { home: "Brazil", away: "Haiti", date: "Jun 19", matchday: 2 },
    { home: "Netherlands", away: "Sweden", date: "Jun 20", matchday: 2 },
    { home: "Germany", away: "Cote D'Ivoire", date: "Jun 20", matchday: 2 },
    { home: "France", away: "Norway", date: "Jun 25", matchday: 3 },
    { home: "Spain", away: "Uruguay", date: "Jun 25", matchday: 3 },
    { home: "Argentina", away: "Austria", date: "Jun 25", matchday: 3 },
    { home: "England", away: "Panama", date: "Jun 25", matchday: 3 },
    { home: "Portugal", away: "Uzbekistan", date: "Jun 26", matchday: 3 },
    { home: "Scotland", away: "Brazil", date: "Jun 24", matchday: 3 },
    { home: "Netherlands", away: "Tunisia", date: "Jun 24", matchday: 3 },
    { home: "Germany", away: "Ecuador", date: "Jun 24", matchday: 3 },
  ],
  B: [
    { home: "Belgium", away: "Egypt", date: "Jun 15", matchday: 1 },
    { home: "Morocco", away: "Brazil", date: "Jun 13", matchday: 1 },
    { home: "IR Iran", away: "New Zealand", date: "Jun 15", matchday: 1 },
    { home: "Croatia", away: "England", date: "Jun 17", matchday: 1 },
    { home: "Colombia", away: "Uzbekistan", date: "Jun 17", matchday: 1 },
    { home: "Senegal", away: "France", date: "Jun 16", matchday: 1 },
    {
      home: "Switzerland",
      away: "Bosnia & Herzegovina",
      date: "Jun 12",
      matchday: 1,
    },
    { home: "Uruguay", away: "Saudi Arabia", date: "Jun 15", matchday: 1 },
    { home: "Belgium", away: "IR Iran", date: "Jun 21", matchday: 2 },
    { home: "Morocco", away: "Scotland", date: "Jun 19", matchday: 2 },
    { home: "Croatia", away: "Ghana", date: "Jun 21", matchday: 2 },
    { home: "Colombia", away: "Portugal", date: "Jun 22", matchday: 2 },
    { home: "Senegal", away: "Iraq", date: "Jun 20", matchday: 2 },
    { home: "Switzerland", away: "Qatar", date: "Jun 18", matchday: 2 },
    { home: "Uruguay", away: "Cabo Verde", date: "Jun 20", matchday: 2 },
    { home: "Belgium", away: "New Zealand", date: "Jun 26", matchday: 3 },
    { home: "Morocco", away: "Haiti", date: "Jun 24", matchday: 3 },
    { home: "IR Iran", away: "Egypt", date: "Jun 25", matchday: 3 },
    { home: "Croatia", away: "Panama", date: "Jun 26", matchday: 3 },
    { home: "Colombia", away: "Congo DR", date: "Jun 26", matchday: 3 },
    { home: "Senegal", away: "Norway", date: "Jun 25", matchday: 3 },
    { home: "Switzerland", away: "Canada", date: "Jun 24", matchday: 3 },
    { home: "Uruguay", away: "Spain", date: "Jun 25", matchday: 3 },
  ],
  C: [
    { home: "Japan", away: "Netherlands", date: "Jun 14", matchday: 1 },
    { home: "USA", away: "Paraguay", date: "Jun 12", matchday: 1 },
    { home: "Turkiye", away: "Australia", date: "Jun 14", matchday: 1 },
    { home: "Korea Republic", away: "Czechia", date: "Jun 11", matchday: 1 },
    { home: "Ecuador", away: "Cote D'Ivoire", date: "Jun 14", matchday: 1 },
    { home: "Austria", away: "Jordan", date: "Jun 17", matchday: 1 },
    { home: "Norway", away: "Iraq", date: "Jun 16", matchday: 1 },
    { home: "Japan", away: "Sweden", date: "Jun 20", matchday: 2 },
    { home: "USA", away: "Australia", date: "Jun 19", matchday: 2 },
    { home: "Turkiye", away: "Paraguay", date: "Jun 20", matchday: 2 },
    {
      home: "Korea Republic",
      away: "South Africa",
      date: "Jun 18",
      matchday: 2,
    },
    { home: "Ecuador", away: "Germany", date: "Jun 20", matchday: 2 },
    { home: "Austria", away: "Argentina", date: "Jun 21", matchday: 2 },
    { home: "Norway", away: "France", date: "Jun 20", matchday: 2 },
    { home: "Japan", away: "Tunisia", date: "Jun 24", matchday: 3 },
    { home: "USA", away: "Turkiye", date: "Jun 24", matchday: 3 },
    { home: "Korea Republic", away: "Mexico", date: "Jun 24", matchday: 3 },
    { home: "Ecuador", away: "Cote D'Ivoire", date: "Jun 25", matchday: 3 },
    { home: "Austria", away: "Algeria", date: "Jun 25", matchday: 3 },
    { home: "Australia", away: "Paraguay", date: "Jun 24", matchday: 3 },
    { home: "Norway", away: "Senegal", date: "Jun 25", matchday: 3 },
  ],
  D: [
    { home: "Algeria", away: "Argentina", date: "Jun 16", matchday: 1 },
    { home: "Egypt", away: "Belgium", date: "Jun 15", matchday: 1 },
    {
      home: "Canada",
      away: "Bosnia & Herzegovina",
      date: "Jun 12",
      matchday: 1,
    },
    { home: "Cote D'Ivoire", away: "Ecuador", date: "Jun 14", matchday: 1 },
    { home: "Panama", away: "Ghana", date: "Jun 17", matchday: 1 },
    { home: "Sweden", away: "Tunisia", date: "Jun 14", matchday: 1 },
    { home: "Paraguay", away: "USA", date: "Jun 12", matchday: 1 },
    { home: "Jordan", away: "Austria", date: "Jun 17", matchday: 1 },
    { home: "Algeria", away: "Jordan", date: "Jun 21", matchday: 2 },
    { home: "Egypt", away: "IR Iran", date: "Jun 21", matchday: 2 },
    { home: "Canada", away: "Qatar", date: "Jun 18", matchday: 2 },
    { home: "Cote D'Ivoire", away: "Germany", date: "Jun 20", matchday: 2 },
    { home: "Panama", away: "England", date: "Jun 21", matchday: 2 },
    { home: "Sweden", away: "Japan", date: "Jun 20", matchday: 2 },
    { home: "Paraguay", away: "Turkiye", date: "Jun 20", matchday: 2 },
    { home: "Algeria", away: "Austria", date: "Jun 25", matchday: 3 },
    { home: "Egypt", away: "IR Iran", date: "Jun 25", matchday: 3 },
    { home: "Canada", away: "Switzerland", date: "Jun 24", matchday: 3 },
    { home: "Cote D'Ivoire", away: "Ecuador", date: "Jun 25", matchday: 3 },
    { home: "Panama", away: "Croatia", date: "Jun 26", matchday: 3 },
    { home: "Sweden", away: "Netherlands", date: "Jun 24", matchday: 3 },
    { home: "Paraguay", away: "Australia", date: "Jun 24", matchday: 3 },
    { home: "Jordan", away: "Argentina", date: "Jun 25", matchday: 3 },
  ],
  E: [
    { home: "Czechia", away: "Korea Republic", date: "Jun 11", matchday: 1 },
    { home: "Scotland", away: "Haiti", date: "Jun 13", matchday: 1 },
    { home: "Tunisia", away: "Sweden", date: "Jun 14", matchday: 1 },
    { home: "Congo DR", away: "Portugal", date: "Jun 17", matchday: 1 },
    { home: "Uzbekistan", away: "Colombia", date: "Jun 17", matchday: 1 },
    { home: "Qatar", away: "Switzerland", date: "Jun 13", matchday: 1 },
    { home: "Iraq", away: "Norway", date: "Jun 16", matchday: 1 },
    { home: "South Africa", away: "Mexico", date: "Jun 11", matchday: 1 },
    { home: "Czechia", away: "South Africa", date: "Jun 18", matchday: 2 },
    { home: "Scotland", away: "Morocco", date: "Jun 19", matchday: 2 },
    { home: "Congo DR", away: "Colombia", date: "Jun 22", matchday: 2 },
    { home: "Uzbekistan", away: "Portugal", date: "Jun 22", matchday: 2 },
    { home: "Qatar", away: "Canada", date: "Jun 18", matchday: 2 },
    { home: "Iraq", away: "Senegal", date: "Jun 20", matchday: 2 },
    {
      home: "South Africa",
      away: "Korea Republic",
      date: "Jun 18",
      matchday: 2,
    },
    { home: "Czechia", away: "Mexico", date: "Jun 25", matchday: 3 },
    { home: "Scotland", away: "Brazil", date: "Jun 24", matchday: 3 },
    { home: "Tunisia", away: "Netherlands", date: "Jun 24", matchday: 3 },
    { home: "Tunisia", away: "Japan", date: "Jun 24", matchday: 3 },
    { home: "Congo DR", away: "Uzbekistan", date: "Jun 26", matchday: 3 },
    {
      home: "Qatar",
      away: "Bosnia & Herzegovina",
      date: "Jun 24",
      matchday: 3,
    },
    { home: "Iraq", away: "France", date: "Jun 25", matchday: 3 },
  ],
  F: [
    { home: "Saudi Arabia", away: "Uruguay", date: "Jun 15", matchday: 1 },
    {
      home: "Bosnia & Herzegovina",
      away: "Canada",
      date: "Jun 12",
      matchday: 1,
    },
    { home: "Cabo Verde", away: "Spain", date: "Jun 15", matchday: 1 },
    { home: "Ghana", away: "Panama", date: "Jun 17", matchday: 1 },
    { home: "Curacao", away: "Germany", date: "Jun 14", matchday: 1 },
    { home: "Haiti", away: "Scotland", date: "Jun 13", matchday: 1 },
    { home: "New Zealand", away: "IR Iran", date: "Jun 15", matchday: 1 },
    { home: "Jordan", away: "Austria", date: "Jun 17", matchday: 1 },
    { home: "Saudi Arabia", away: "Spain", date: "Jun 20", matchday: 2 },
    {
      home: "Bosnia & Herzegovina",
      away: "Switzerland",
      date: "Jun 18",
      matchday: 2,
    },
    { home: "Cabo Verde", away: "Uruguay", date: "Jun 20", matchday: 2 },
    { home: "Ghana", away: "Croatia", date: "Jun 21", matchday: 2 },
    { home: "Curacao", away: "Cote D'Ivoire", date: "Jun 20", matchday: 2 },
    { home: "Haiti", away: "Brazil", date: "Jun 19", matchday: 2 },
    { home: "New Zealand", away: "Belgium", date: "Jun 21", matchday: 2 },
    { home: "Jordan", away: "Algeria", date: "Jun 21", matchday: 2 },
    { home: "Saudi Arabia", away: "Cabo Verde", date: "Jun 25", matchday: 3 },
    {
      home: "Bosnia & Herzegovina",
      away: "Qatar",
      date: "Jun 24",
      matchday: 3,
    },
    { home: "Ghana", away: "England", date: "Jun 26", matchday: 3 },
    { home: "Curacao", away: "Ecuador", date: "Jun 25", matchday: 3 },
    { home: "Haiti", away: "Morocco", date: "Jun 24", matchday: 3 },
    { home: "New Zealand", away: "Belgium", date: "Jun 26", matchday: 3 },
    { home: "Jordan", away: "Argentina", date: "Jun 25", matchday: 3 },
  ],
};

export default function App() {
  const [page, setPage] = useState("selection");
  const [players, setPlayers] = useState(() => load(SK, []));
  const [teamResults, setTeamResults] = useState(() => load(RK, {}));
  const [name, setName] = useState("");
  const [picks, setPicks] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
    F: "",
  });
  const [error, setError] = useState("");

  // Edit mode state
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPicks, setEditPicks] = useState({});
  const [editError, setEditError] = useState("");

  // Remove player confirmation
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [draft, setDraft] = useState(() => load(RK, {}));
  const [adminGroup, setAdminGroup] = useState("A");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(() => loadStr(CK, ""));
  const [viewerInput, setViewerInput] = useState("");
  const [viewerError, setViewerError] = useState("");

  // Admin remove player state (inside modal)
  const [adminConfirmRemoveId, setAdminConfirmRemoveId] = useState(null);

  const [apiKey, setApiKey] = useState(() =>
    loadStr(AK, "0d73bad5c3114f288747caef2d389819"),
  );
  const [apiKeyInput, setApiKeyInput] = useState(
    "0d73bad5c3114f288747caef2d389819",
  );
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [fixtures, setFixtures] = useState({});
  const [fixturesLoading, setFixturesLoading] = useState(false);

  const isAdmin = ADMIN_USERS.includes(currentUser.trim().toLowerCase());

  function persistUser(name) {
    try {
      localStorage.setItem(CK, name);
    } catch {}
    setCurrentUser(name);
  }

  function persist(newPlayers, newResults) {
    localStorage.setItem(SK, JSON.stringify(newPlayers ?? players));
    localStorage.setItem(RK, JSON.stringify(newResults ?? teamResults));
  }

  const leaderboard = players
    .map((p) => {
      const { total, breakdown } = computePlayerData(p.picks, teamResults);
      return { ...p, total, breakdown };
    })
    .sort((a, b) => b.total - a.total)
    .map((p, i, arr) => ({
      ...p,
      rank:
        i === 0 ? 1 : arr[i - 1].total === p.total ? arr[i - 1].rank : i + 1,
    }));

  const groupTotals = GROUPS_LIST.reduce((acc, g) => {
    acc[g] = leaderboard.reduce((s, p) => s + (p.breakdown[g]?.pts ?? 0), 0);
    return acc;
  }, {});
  const grandTotal = Object.values(groupTotals).reduce((s, v) => s + v, 0);

  const pickedCount = Object.values(picks).filter(Boolean).length;

  function handleSubmit() {
    setError("");
    if (!name.trim()) {
      setError("Enter Your name / alias.");
      return;
    }
    if (Object.values(picks).some((v) => !v)) {
      setError("Pick one team from every group.");
      return;
    }
    if (
      players.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())
    ) {
      setError("That name is already taken.");
      return;
    }
    const updated = [...players, { id: Date.now(), name: name.trim(), picks }];
    setPlayers(updated);
    persist(updated, null);
    persistUser(name.trim());
    setName("");
    setPicks({ A: "", B: "", C: "", D: "", E: "", F: "" });
    setPage("leaderboard");
  }

  function handleViewerLogin() {
    setViewerError("");
    const v = viewerInput.trim();
    if (!v) {
      setViewerError("Enter Your name / alias to continue.");
      return;
    }
    const exists = players.find(
      (p) => p.name.toLowerCase() === v.toLowerCase(),
    );
    if (!exists && !ADMIN_USERS.includes(v.toLowerCase())) {
      setViewerError(
        "Name not found. Add your selection first or check your spelling.",
      );
      return;
    }
    persistUser(v);
    setViewerInput("");
    setViewerError("");
  }

  // ── Edit Selection ────────────────────────────────────────────────────────
  function startEdit(player) {
    setEditingPlayer(player.id);
    setEditPicks({ ...player.picks });
    setEditError("");
  }

  function cancelEdit() {
    setEditingPlayer(null);
    setEditPicks({});
    setEditError("");
  }

  function saveEdit() {
    setEditError("");
    if (Object.values(editPicks).some((v) => !v)) {
      setEditError("You must pick one team from every group.");
      return;
    }
    const updated = players.map((p) =>
      p.id === editingPlayer ? { ...p, picks: { ...editPicks } } : p,
    );
    setPlayers(updated);
    persist(updated, null);
    setEditingPlayer(null);
    setEditPicks({});
  }

  // ── Remove Player (leaderboard — admin only) ──────────────────────────────
  function removePlayer(id) {
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    persist(updated, null);
    setConfirmRemoveId(null);
    // If the removed player was being edited, cancel
    if (editingPlayer === id) cancelEdit();
    // If current user was removed, log out
    const removed = players.find((p) => p.id === id);
    if (removed && removed.name.toLowerCase() === currentUser.toLowerCase()) {
      persistUser("");
    }
  }

  // ── Remove Player (admin modal) ───────────────────────────────────────────
  function adminRemovePlayer(id) {
    const updated = players.filter((p) => p.id !== id);
    setPlayers(updated);
    persist(updated, null);
    setAdminConfirmRemoveId(null);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  function setTeamField(team, field, value) {
    setDraft((prev) => ({
      ...prev,
      [team]: { ...(prev[team] || {}), [field]: value },
    }));
  }

  function saveAdmin() {
    setTeamResults(draft);
    persist(null, draft);
    setAdminOpen(false);
  }

  async function apiFetch(path, key) {
    const res = await fetch(`/api/football/${path}`, {
      headers: { "x-auth-token": key },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function testApiKey(keyToTest) {
    setTesting(true);
    setTestResult(null);
    try {
      const json = await apiFetch("competitions/WC", keyToTest);
      const n = json.name || "World Cup";
      const s = json.currentSeason?.startDate?.slice(0, 4) || "";
      setTestResult({
        ok: true,
        message: `Key valid. ${n}${s ? ` (${s})` : ""} accessible.`,
      });
    } catch (e) {
      setTestResult({ ok: false, message: e.message || "Test failed." });
    } finally {
      setTesting(false);
    }
  }

  function saveApiKey() {
    const t = apiKeyInput.trim();
    localStorage.setItem(AK, t);
    setApiKey(t);
    setApiKeyInput("");
    testApiKey(t);
  }

  async function syncFromApi() {
    if (!apiKey) {
      setSyncResult({ ok: false, message: "No API key saved." });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const newResults = { ...teamResults };
      let updatedGroups = 0,
        updatedKnockout = 0;

      const standingsJson = await apiFetch("competitions/WC/standings", apiKey);
      const standings = standingsJson.standings ?? [];
      if (!standings.length) throw new Error("No standings data yet.");

      for (const group of standings) {
        const table = group.table || [];
        for (const row of table) {
          const appName = normalizeApiName(
            row.team?.name || row.team?.shortName || "",
          );
          if (!TEAM_GROUP[appName]) continue;
          const won = row.won ?? 0,
            draw = row.draw ?? 0,
            lost = row.lost ?? 0;
          if (won + draw + lost === 0) continue;
          const matchArr = buildMatchResults(won, draw, lost);
          newResults[appName] = {
            ...(newResults[appName] || {}),
            m1: matchArr[0],
            m2: matchArr[1],
            m3: matchArr[2],
          };
          updatedGroups++;
        }
        const allPlayed = table.every((row) => (row.playedGames ?? 0) >= 3);
        if (allPlayed) {
          const fourth = table[3];
          if (fourth) {
            const appName = normalizeApiName(
              fourth.team?.name || fourth.team?.shortName || "",
            );
            if (TEAM_GROUP[appName] && !newResults[appName]?.eliminated) {
              newResults[appName] = {
                ...(newResults[appName] || {}),
                eliminated: true,
              };
            }
          }
        }
      }

      const matchesJson = await apiFetch(
        "competitions/WC/matches?season=2026",
        apiKey,
      );
      for (const m of matchesJson.matches ?? []) {
        if (m.stage === "GROUP_STAGE" || m.status !== "FINISHED") continue;
        const field = STAGE_MAP[m.stage];
        if (!field) continue;
        const home = normalizeApiName(m.homeTeam?.name || "");
        const away = normalizeApiName(m.awayTeam?.name || "");
        const hs = m.score?.fullTime?.home ?? 0,
          as_ = m.score?.fullTime?.away ?? 0;
        let winner = null,
          loser = null;
        if (hs > as_) {
          winner = home;
          loser = away;
        } else if (as_ > hs) {
          winner = away;
          loser = home;
        } else {
          const hp = m.score?.penalties?.home ?? 0,
            ap = m.score?.penalties?.away ?? 0;
          if (hp > ap) {
            winner = home;
            loser = away;
          } else if (ap > hp) {
            winner = away;
            loser = home;
          }
        }
        if (!winner || !loser) continue;
        if (TEAM_GROUP[winner]) {
          newResults[winner] = {
            ...(newResults[winner] || {}),
            [field]: true,
            eliminated: false,
          };
          updatedKnockout++;
        }
        if (TEAM_GROUP[loser]) {
          newResults[loser] = {
            ...(newResults[loser] || {}),
            eliminated: true,
          };
        }
      }

      setDraft(newResults);
      setTeamResults(newResults);
      persist(null, newResults);
      setSyncResult({
        ok: true,
        message: `Synced ${updatedGroups} group-stage teams${updatedKnockout > 0 ? ` · ${updatedKnockout} knockout results` : ""}.`,
      });
      loadFixtures();
    } catch (e) {
      setSyncResult({ ok: false, message: e.message || "Sync failed." });
    } finally {
      setSyncing(false);
    }
  }

  async function loadFixtures() {
    if (!apiKey) {
      setFixtures(STATIC_FIXTURES);
      return;
    }
    setFixturesLoading(true);
    try {
      const json = await apiFetch(
        "competitions/WC/matches?season=2026&stage=GROUP_STAGE",
        apiKey,
      );
      const scoreLookup = {};
      for (const m of json.matches ?? []) {
        const h = normalizeApiName(m.homeTeam?.name || "");
        const a = normalizeApiName(m.awayTeam?.name || "");
        scoreLookup[`${h}|${a}`] = {
          status: m.status,
          homeScore: m.score?.fullTime?.home,
          awayScore: m.score?.fullTime?.away,
        };
      }
      const merged = {};
      for (const [grp, matches] of Object.entries(STATIC_FIXTURES)) {
        merged[grp] = matches.map((m) => {
          const key = `${m.home}|${m.away}`;
          const live = scoreLookup[key] || scoreLookup[`${m.away}|${m.home}`];
          return { ...m, ...(live || {}) };
        });
      }
      setFixtures(merged);
    } catch (e) {
      console.warn("Fixtures load failed:", e.message);
      setFixtures(STATIC_FIXTURES);
    } finally {
      setFixturesLoading(false);
    }
  }

  const adminTeams = ALL_TEAMS.filter(
    ({ group }) => group === adminGroup,
  ).filter(({ team }) => team.toLowerCase().includes(search.toLowerCase()));

  const currentPlayer = players.find(
    (p) => p.name.toLowerCase() === currentUser.toLowerCase(),
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* NAV */}
        <nav className="nav">
          <span className="nav-brand">
            Abra Kadabra Tournament 2026 World Cup
          </span>
          <div className="nav-actions">
            <button
              className={`nav-btn ${page === "selection" ? "active" : ""}`}
              onClick={() => setPage("selection")}
            >
              Add Selection
            </button>
            <button
              className={`nav-btn ${page === "leaderboard" ? "active" : ""}`}
              onClick={() => setPage("leaderboard")}
            >
              Leaderboard
            </button>
            {isAdmin && (
              <button
                className="nav-btn"
                onClick={() => {
                  setDraft(teamResults);
                  setSyncResult(null);
                  setTestResult(null);
                  setAdminConfirmRemoveId(null);
                  setAdminOpen(true);
                  loadFixtures();
                }}
              >
                Admin
              </button>
            )}
          </div>
        </nav>

        {/* ── ADD SELECTION ── */}
        {page === "selection" && (
          <div className="page">
            <h1>Add Selection</h1>
            <p className="subtitle">
              Pick one team per group. Points are awarded based on how far your
              teams advance.
            </p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(pickedCount / 6) * 100}%` }}
              />
            </div>

            <div className="field">
              <label>Your name / alias</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Your name / alias"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div className="group-grid">
              {Object.entries(GROUPS).map(([g, teams]) => (
                <div key={g} className="group-card">
                  <div
                    className="group-card-header"
                    style={{ background: GROUP_COLORS[g] }}
                  >
                    <span className="group-card-title">Group {g}</span>
                    <span className="group-card-scoring">
                      W={SCORING.groupStage[g].W} D={SCORING.groupStage[g].D}
                    </span>
                  </div>
                  <div className="group-card-body">
                    {teams.map((t) => (
                      <button
                        key={t}
                        className={`team-chip ${picks[g] === t ? "selected" : ""}`}
                        onClick={() =>
                          setPicks((p) => ({ ...p, [g]: p[g] === t ? "" : t }))
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="picks-summary">
              <div className="picks-summary-label">
                Your picks — {pickedCount} of 6
              </div>
              <div className="picks-chips">
                {GROUPS_LIST.map((g) =>
                  picks[g] ? (
                    <span
                      key={g}
                      className="pick-chip"
                      style={{ background: GROUP_COLORS[g] }}
                    >
                      {g}: {picks[g]}
                    </span>
                  ) : (
                    <span key={g} className="pick-chip-empty">
                      Group {g}: —
                    </span>
                  ),
                )}
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button className="btn-primary" onClick={handleSubmit}>
              Submit Selection
            </button>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {page === "leaderboard" && (
          <div className="page-wide">
            {!currentUser && (
              <div className="login-card">
                <h2>View Leaderboard</h2>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 18 }}>
                  Enter the name you registered with to continue.
                </p>
                <div className="field">
                  <input
                    className="input"
                    value={viewerInput}
                    onChange={(e) => setViewerInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleViewerLogin()}
                    placeholder="Your name / alias"
                  />
                </div>
                {viewerError && <p className="error">{viewerError}</p>}
                <button className="btn-primary" onClick={handleViewerLogin}>
                  Continue
                </button>
              </div>
            )}

            {currentUser && (
              <>
                {editingPlayer && (
                  <div className="edit-banner">
                    <div>
                      <strong>
                        Editing selection for{" "}
                        {players.find((p) => p.id === editingPlayer)?.name}
                      </strong>
                      <div
                        style={{ fontSize: 12, color: "#7b6000", marginTop: 3 }}
                      >
                        Click teams below to change your picks. Changes apply
                        immediately on save.
                      </div>
                    </div>
                    <div className="edit-banner-actions">
                      <button className="btn-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        style={{ width: "auto", padding: "10px 20px" }}
                        onClick={saveEdit}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {editError && <p className="error">{editError}</p>}

                {editingPlayer && (
                  <div style={{ marginBottom: 32 }}>
                    <div className="group-grid">
                      {Object.entries(GROUPS).map(([g, teams]) => (
                        <div key={g} className="group-card">
                          <div
                            className="group-card-header"
                            style={{ background: GROUP_COLORS[g] }}
                          >
                            <span className="group-card-title">Group {g}</span>
                            <span className="group-card-scoring">
                              W={SCORING.groupStage[g].W} D=
                              {SCORING.groupStage[g].D}
                            </span>
                          </div>
                          <div className="group-card-body">
                            {teams.map((t) => (
                              <button
                                key={t}
                                className={`team-chip ${editPicks[g] === t ? "selected" : ""}`}
                                onClick={() =>
                                  setEditPicks((p) => ({
                                    ...p,
                                    [g]: p[g] === t ? "" : t,
                                  }))
                                }
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="lb-header">
                  <div>
                    <h1>Leaderboard</h1>
                    <p className="lb-meta">
                      {players.length} player{players.length !== 1 ? "s" : ""}
                      &nbsp;&nbsp;
                      <span
                        style={{
                          backgroundColor: "green",
                          color: "#092714",
                          padding: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Contender
                      </span>
                      &nbsp;&nbsp;
                      <span
                        style={{
                          backgroundColor: "red",
                          color: "#440c07",
                          padding: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Eliminated
                      </span>
                    </p>
                  </div>
                  <div className="lb-viewer">
                    <span>
                      Viewing as <strong>{currentUser}</strong>
                    </span>
                    {currentPlayer && !editingPlayer && (
                      <button
                        className="btn-secondary"
                        onClick={() => startEdit(currentPlayer)}
                      >
                        Edit My Selection
                      </button>
                    )}
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        persistUser("");
                        setPage("selection");
                        cancelEdit();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>

                {players.length === 0 ? (
                  <div className="empty-state">
                    No players yet. Be the first to add a selection.
                  </div>
                ) : (
                  <div className="lb-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>Rank</th>
                          <th>Name</th>
                          {GROUPS_LIST.map((g) => (
                            <th key={`th-t-${g}`}>Grp {g}</th>
                          ))}
                          {GROUPS_LIST.map((g) => (
                            <th key={`th-p-${g}`}>Pts {g}</th>
                          ))}
                          <th>Total</th>
                          {isAdmin && <th style={{ width: 48 }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((p, i) => (
                          <>
                            <tr
                              key={p.id}
                              className={
                                i === 0 && confirmRemoveId !== p.id
                                  ? "is-first"
                                  : ""
                              }
                            >
                              <td className="rank-cell">{p.rank}</td>
                              <td
                                style={{
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {p.name}
                              </td>
                              {GROUPS_LIST.map((g) => {
                                const { team, elim } = p.breakdown[g] || {};
                                return (
                                  <td
                                    key={`t-${g}`}
                                    className={`team-cell ${elim ? "elim" : "active"}`}
                                  >
                                    {team || "—"}
                                  </td>
                                );
                              })}
                              {GROUPS_LIST.map((g) => {
                                const { pts } = p.breakdown[g] || {};
                                return (
                                  <td key={`p-${g}`} className="pts-cell">
                                    {pts ?? 0}
                                  </td>
                                );
                              })}
                              <td className="total-cell">{p.total}</td>
                              {isAdmin && (
                                <td className="action-cell">
                                  {confirmRemoveId === p.id ? (
                                    <button
                                      className="btn-remove-player"
                                      title="Cancel"
                                      onClick={() => setConfirmRemoveId(null)}
                                      style={{
                                        borderColor: "#d4d4d0",
                                        background: "#f4f4f2",
                                        color: "#71717a",
                                      }}
                                    >
                                      ✕
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-remove-player"
                                      title={`Remove ${p.name}`}
                                      onClick={() => setConfirmRemoveId(p.id)}
                                    >
                                      —
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                            {isAdmin && confirmRemoveId === p.id && (
                              <tr
                                key={`confirm-${p.id}`}
                                className="confirm-row"
                              >
                                <td colSpan={2 + GROUPS_LIST.length * 2 + 2}>
                                  <div className="confirm-inline">
                                    <span>
                                      Remove <strong>{p.name}</strong> from the
                                      tournament?
                                    </span>
                                    <div className="confirm-actions">
                                      <button
                                        className="btn-cancel-delete"
                                        onClick={() => setConfirmRemoveId(null)}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        className="btn-confirm-delete"
                                        onClick={() => removePlayer(p.id)}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ fontWeight: 700 }}>
                            Total
                          </td>
                          {GROUPS_LIST.map((g) => (
                            <td key={`e-${g}`} />
                          ))}
                          {GROUPS_LIST.map((g) => (
                            <td
                              key={`tp-${g}`}
                              className="pts-cell"
                              style={{ fontWeight: 700 }}
                            >
                              {groupTotals[g]}
                            </td>
                          ))}
                          <td className="total-cell">{grandTotal}</td>
                          {isAdmin && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ADMIN MODAL ── */}
        {adminOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Admin — Team Results</h2>
                <button
                  className="modal-close"
                  onClick={() => setAdminOpen(false)}
                >
                  x
                </button>
              </div>

              {/* ── PLAYER MANAGEMENT ── */}
              <div className="admin-players-section">
                <div className="admin-players-header">
                  <span className="admin-players-title">Player Management</span>
                  <span className="admin-players-count">
                    {players.length} player{players.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {players.length === 0 ? (
                  <div
                    style={{
                      padding: "14px 16px",
                      fontSize: 13,
                      color: "#a1a1aa",
                    }}
                  >
                    No players yet.
                  </div>
                ) : (
                  players.map((p) => (
                    <div key={p.id} className="admin-player-row">
                      <span className="admin-player-name">{p.name}</span>
                      <div className="admin-player-picks">
                        {GROUPS_LIST.map((g) => (
                          <span
                            key={g}
                            className="admin-pick-badge"
                            style={{ background: GROUP_COLORS[g] }}
                            title={`Group ${g}: ${p.picks[g]}`}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                      {adminConfirmRemoveId === p.id ? (
                        <div className="admin-player-confirm">
                          <span>Remove {p.name}?</span>
                          <button
                            className="btn-cancel-delete"
                            onClick={() => setAdminConfirmRemoveId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-confirm-delete"
                            onClick={() => adminRemovePlayer(p.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-remove-player"
                          title={`Remove ${p.name}`}
                          onClick={() => setAdminConfirmRemoveId(p.id)}
                        >
                          —
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* API sync */}
              <div className="api-panel">
                {apiKey ? (
                  <div style={{ marginBottom: 10 }}>
                    <div className="api-row">
                      <span className="badge-ok">
                        Key saved ({apiKey.slice(0, 8)}...)
                      </span>
                      <button
                        className="btn-sm"
                        onClick={() => testApiKey(apiKey)}
                        disabled={testing}
                      >
                        {testing ? "Testing..." : "Test key"}
                      </button>
                      <button
                        className="btn-sm outline"
                        onClick={() => {
                          localStorage.removeItem(AK);
                          setApiKey("");
                          setTestResult(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    {testResult && (
                      <div className={`msg ${testResult.ok ? "ok" : "err"}`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input
                      className="input"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && apiKeyInput.trim() && saveApiKey()
                      }
                      placeholder="football-data.org API key"
                      style={{ flex: 1, fontSize: 12 }}
                    />
                    <button
                      className="btn-sm"
                      onClick={saveApiKey}
                      disabled={!apiKeyInput.trim()}
                    >
                      Save &amp; Test
                    </button>
                  </div>
                )}
                <button
                  className="btn-sync"
                  onClick={syncFromApi}
                  disabled={syncing || !apiKey}
                >
                  {syncing ? "Syncing..." : "Sync now"}
                </button>
                {syncResult && (
                  <div className={`msg ${syncResult.ok ? "ok" : "err"}`}>
                    {syncResult.message}
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
                  Syncs group-stage results, knockout progression, and
                  eliminations. Best 3rd-place qualification must be set
                  manually.
                </p>
              </div>

              {/* Group tabs */}
              <div className="group-tabs">
                {GROUPS_LIST.map((g) => (
                  <button
                    key={g}
                    className={`group-tab ${adminGroup === g ? "active" : ""}`}
                    onClick={() => setAdminGroup(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Fixtures */}
              <div style={{ marginBottom: 16 }}>
                <div className="fixtures-label">
                  {fixturesLoading
                    ? "Loading fixtures..."
                    : `Group ${adminGroup} Fixtures`}
                </div>
                {!fixturesLoading &&
                  (
                    fixtures[adminGroup] ||
                    STATIC_FIXTURES[adminGroup] ||
                    []
                  ).map((m, idx) => {
                    const played =
                      m.status === "FINISHED" ||
                      m.status === "IN_PLAY" ||
                      m.status === "PAUSED";
                    const statusColor =
                      m.status === "FINISHED"
                        ? "#1a472a"
                        : m.status === "IN_PLAY" || m.status === "PAUSED"
                          ? "#7b6000"
                          : "#888";
                    return (
                      <div key={idx} className="fixture-row">
                        <span className="fixture-md">
                          {m.matchday ? `M${m.matchday}` : ""}
                        </span>
                        <span className="fixture-team home">{m.home}</span>
                        <span
                          className="fixture-score"
                          style={{
                            color: played ? "#1a1a1a" : "#ccc",
                            background: played ? "#fff" : "#f0f0f0",
                          }}
                        >
                          {played
                            ? `${m.homeScore ?? "–"} – ${m.awayScore ?? "–"}`
                            : "vs"}
                        </span>
                        <span className="fixture-team">{m.away}</span>
                        <span
                          className="fixture-status"
                          style={{ color: statusColor }}
                        >
                          {m.status === "FINISHED"
                            ? "FT"
                            : m.status === "IN_PLAY"
                              ? "LIVE"
                              : m.status === "PAUSED"
                                ? "HT"
                                : m.date || ""}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="field">
                <input
                  className="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team..."
                />
              </div>

              <div className="admin-teams-grid">
                {adminTeams.map(({ team }) => {
                  const r = draft[team] || {};
                  const pts = computeTeamPoints(team, draft);
                  const elim = !!r.eliminated;
                  const { wins, draws } = getMatchTotals(r);
                  const losses = MATCHES.filter((m) => r[m] === "L").length;
                  return (
                    <div key={team} className="team-admin-card">
                      <div
                        className="team-admin-header"
                        style={{ background: elim ? "#922b21" : "#1a472a" }}
                      >
                        <span className="team-admin-name">{team}</span>
                        <span className="team-admin-pts">{pts} pts</span>
                      </div>
                      <div className="team-admin-body">
                        <label
                          className={`elim-toggle ${elim ? "is-elim" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={elim}
                            onChange={(e) =>
                              setTeamField(team, "eliminated", e.target.checked)
                            }
                          />
                          {elim ? "Eliminated" : "Active"}
                        </label>

                        <div className="section-label">
                          Group Stage — W={SCORING.groupStage[adminGroup].W} D=
                          {SCORING.groupStage[adminGroup].D}
                        </div>
                        {MATCHES.map((m, idx) => (
                          <div key={m} className="wdl-row">
                            <span className="wdl-match-label">
                              Match {idx + 1}
                            </span>
                            <div className="wdl-buttons">
                              {["W", "D", "L"].map((v) => (
                                <WDLButton
                                  key={v}
                                  value={v}
                                  current={r[m] || ""}
                                  onClick={(val) => setTeamField(team, m, val)}
                                />
                              ))}
                            </div>
                            <span className="wdl-pts">
                              {r[m] === "W"
                                ? `+${SCORING.groupStage[adminGroup].W}`
                                : r[m] === "D"
                                  ? `+${SCORING.groupStage[adminGroup].D}`
                                  : ""}
                            </span>
                          </div>
                        ))}
                        <p className="stat-line">
                          {wins}W {draws}D {losses}L —{" "}
                          <strong>
                            {wins * SCORING.groupStage[adminGroup].W +
                              draws * SCORING.groupStage[adminGroup].D}{" "}
                            pts
                          </strong>
                        </p>

                        <hr className="divider" />

                        <div
                          className="section-label"
                          style={{ opacity: elim ? 0.5 : 1 }}
                        >
                          Knockout Rounds
                          {elim && (
                            <span
                              style={{
                                fontStyle: "italic",
                                fontWeight: 400,
                                marginLeft: 6,
                              }}
                            >
                              (locked)
                            </span>
                          )}
                        </div>
                        <div
                          className="knockout-grid"
                          style={{ opacity: elim ? 0.4 : 1 }}
                        >
                          {[
                            [
                              "ro32",
                              "Round of 32",
                              SCORING.roundOf32[adminGroup],
                            ],
                            [
                              "ro16",
                              "Round of 16",
                              SCORING.roundOf16[adminGroup],
                            ],
                            ["quarters", "Quarter-final", SCORING.quarters],
                            ["semis", "Semi-final", SCORING.semis],
                            ["thirdPlace", "3rd Place", SCORING.thirdPlace],
                            ["final", "Final", SCORING.final],
                          ].map(([field, label, p]) => (
                            <label key={field} className="ko-check">
                              <input
                                type="checkbox"
                                checked={!!r[field]}
                                disabled={elim}
                                onChange={(e) =>
                                  setTeamField(team, field, e.target.checked)
                                }
                              />
                              {label} <span className="ko-pts">(+{p})</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="btn-group">
                <button className="btn-primary" onClick={saveAdmin}>
                  Save Results
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setAdminOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
