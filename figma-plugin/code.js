// ============================================================
// SCOREPION FIGMA DESIGN GENERATOR  v4
// Pixel-perfect match to actual app codebase
// ============================================================

var SW = 375, SH = 812, GAP = 80, PER_ROW = 4;
var OFFSET_X = 0, OFFSET_Y = 0;

// ── EXACT colors from constants/ and theme files ─────────────
var C = {
  // Backgrounds
  navy:      { r: 0.039, g: 0.067, b: 0.157 },  // #0A1128 - primary bg
  navyCard:  { r: 0.086, g: 0.125, b: 0.220 },  // #162038 - card bg
  navyLight: { r: 0.106, g: 0.157, b: 0.271 },  // #1B2845 - elevated card
  navyDeep:  { r: 0.027, g: 0.055, b: 0.118 },  // #070E1E - deepest bg

  // Brand
  emerald:   { r: 0.000, g: 0.784, b: 0.325 },  // #00C853
  emeraldDk: { r: 0.000, g: 0.659, b: 0.267 },  // #00A844
  gold:      { r: 1.000, g: 0.843, b: 0.000 },  // #FFD700
  goldMuted: { r: 0.788, g: 0.659, b: 0.212 },  // #C9A836

  // Status
  red:       { r: 1.000, g: 0.231, b: 0.361 },  // #FF3B5C
  orange:    { r: 1.000, g: 0.549, b: 0.000 },  // #FF8C00
  blue:      { r: 0.231, g: 0.510, b: 0.965 },  // #3B82F6
  purple:    { r: 0.878, g: 0.251, b: 0.984 },  // #E040FB

  // Medal / Podium
  gold1st:   { r: 1.000, g: 0.702, b: 0.000 },  // #FFB300
  silver2nd: { r: 0.753, g: 0.753, b: 0.753 },  // #C0C0C0
  bronze3rd: { r: 0.722, g: 0.451, b: 0.200 },  // #B87333

  // Text
  white:     { r: 1.000, g: 1.000, b: 1.000 },
  textPri:   { r: 0.910, g: 0.922, b: 0.941 },  // #E8EBF0 - primary text dark mode
  textSec:   { r: 0.557, g: 0.584, b: 0.639 },  // #8E95A3
  textMuted: { r: 0.353, g: 0.376, b: 0.439 },  // #5A6070
};

// Semi-transparent fills used in app
function alphaFill(color, opacity) {
  return { type: 'SOLID', color: color, opacity: opacity };
}

// ── Helpers ───────────────────────────────────────────────────

function calcOffset() {
  var ch = figma.currentPage.children;
  if (!ch || ch.length === 0) return;
  var maxY = -Infinity;
  for (var i = 0; i < ch.length; i++) {
    var b = ch[i].y + ch[i].height;
    if (b > maxY) maxY = b;
  }
  OFFSET_Y = maxY + 140;
}

function addRect(p, name, x, y, w, h, color, r, opacity) {
  var n = figma.createRectangle();
  n.name = name; n.x = x; n.y = y;
  n.resize(Math.max(w, 1), Math.max(h, 1));
  n.fills = [{ type: 'SOLID', color: color, opacity: opacity !== undefined ? opacity : 1 }];
  if (r) n.cornerRadius = r;
  p.appendChild(n); return n;
}

function addEllipse(p, name, x, y, w, h, color, opacity) {
  var n = figma.createEllipse();
  n.name = name; n.x = x; n.y = y;
  n.resize(Math.max(w, 1), Math.max(h, 1));
  n.fills = [{ type: 'SOLID', color: color, opacity: opacity !== undefined ? opacity : 1 }];
  p.appendChild(n); return n;
}

async function addText(p, content, x, y, size, weight, color, align, fw, opacity) {
  align = align || 'LEFT'; fw = fw || 0;
  var n = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: weight });
  n.fontName = { family: 'Inter', style: weight };
  n.fontSize = size;
  n.fills = [{ type: 'SOLID', color: color, opacity: opacity !== undefined ? opacity : 1 }];
  if (fw > 0) {
    n.textAutoResize = 'HEIGHT'; n.resize(fw, 20);
    n.textAlignHorizontal = align;
  } else {
    n.textAutoResize = 'WIDTH_AND_HEIGHT';
    n.textAlignHorizontal = align;
  }
  n.characters = content;
  n.x = x; n.y = y;
  p.appendChild(n); return n;
}

function makeScreen(name, idx) {
  var row = Math.floor(idx / PER_ROW), col = idx % PER_ROW;
  var f = figma.createFrame();
  f.name = name; f.resize(SW, SH);
  f.x = OFFSET_X + col * (SW + GAP);
  f.y = OFFSET_Y + row * (SH + GAP + 48);
  f.fills = [{ type: 'SOLID', color: C.navy }];
  f.clipsContent = true;
  return f;
}

// Gradient header simulation (navy to transparent)
function addGradientHeader(f, height) {
  addRect(f, 'header_base', 0, 0, SW, height, C.navyDeep);
  // Fade overlay
  var overlay = figma.createRectangle();
  overlay.name = 'header_fade';
  overlay.x = 0; overlay.y = Math.floor(height * 0.5);
  overlay.resize(SW, Math.floor(height * 0.5));
  overlay.fills = [{ type: 'SOLID', color: C.navy }];
  overlay.opacity = 0.7;
  f.appendChild(overlay);
}

async function addStatusBar(f) {
  addRect(f, 'status_bar', 0, 0, SW, 44, C.navyDeep);
  await addText(f, '9:41', 16, 14, 14, 'Semi Bold', C.white);
  await addText(f, 'lll  *  )))', SW - 72, 14, 11, 'Regular', C.white);
}

// Tab bar matching actual app (Ionicons + labels)
async function addTabBar(f, active) {
  active = active || 0;
  var tb = figma.createFrame();
  tb.name = 'TabBar'; tb.x = 0; tb.y = SH - 84;
  tb.resize(SW, 84);
  tb.fills = [{ type: 'SOLID', color: C.navyCard }];
  // top border line
  addRect(tb, 'border_top', 0, 0, SW, 1, C.navyLight);
  var labels = ['Today', 'Matches', 'Standings', 'Groups', 'Profile'];
  var tabW = Math.floor(SW / 5);
  for (var i = 0; i < 5; i++) {
    var cx = i * tabW;
    var col = i === active ? C.emerald : C.textSec;
    // Icon placeholder (24×24 Ionicons)
    var icon = figma.createRectangle();
    icon.name = 'icon_' + labels[i]; icon.x = cx + Math.floor((tabW - 24) / 2); icon.y = 12;
    icon.resize(24, 24); icon.fills = [{ type: 'SOLID', color: i === active ? C.emerald : C.textMuted }]; icon.cornerRadius = 6;
    tb.appendChild(icon);
    await addText(tb, labels[i], cx, 40, 11, 'Medium', i === active ? C.emerald : C.textMuted, 'CENTER', tabW);
    if (i === active) {
      var dot = figma.createEllipse();
      dot.name = 'active_dot'; dot.x = cx + Math.floor((tabW - 4) / 2); dot.y = 66;
      dot.resize(4, 4); dot.fills = [{ type: 'SOLID', color: C.emerald }];
      tb.appendChild(dot);
    }
  }
  f.appendChild(tb); return tb;
}

// Active pill (white bg, navy text) — matches actual app filter pills
async function addActivePill(p, label, x, y, w, h) {
  addRect(p, 'pill_active_' + label, x, y, w, h, C.white, Math.floor(h / 2));
  await addText(p, label, x, y + Math.floor((h - 13) / 2), 13, 'Semi Bold', C.navy, 'CENTER', w);
}

// Inactive pill (semi-transparent)
async function addInactivePill(p, label, x, y, w, h) {
  addRect(p, 'pill_inactive_' + label, x, y, w, h, C.white, Math.floor(h / 2), 0.08);
  await addText(p, label, x, y + Math.floor((h - 13) / 2), 13, 'Regular', C.white, 'CENTER', w, 0.5);
}

// ── 01: Splash ────────────────────────────────────────────────
async function buildSplash(idx) {
  var f = makeScreen('01 - Splash Screen', idx);
  // Radial glow
  var glow = addEllipse(f, 'glow', (SW - 300) / 2, 180, 300, 300, C.emeraldDk, 0.15);
  // Logo box (76×76 rounded)
  addRect(f, 'logo_bg', (SW - 76) / 2, 290, 76, 76, C.emerald, 18);
  addRect(f, 'logo_inner', (SW - 38) / 2, 309, 38, 38, C.emeraldDk, 10);
  // App name
  await addText(f, 'Scorepion', 0, 388, 32, 'Bold', C.white, 'CENTER', SW);
  await addText(f, 'The ultimate football prediction game', 0, 432, 14, 'Regular', C.white, 'CENTER', SW, 0.5);
  // Loading bar
  addRect(f, 'loader_track', 80, 520, SW - 160, 4, C.navyCard, 2);
  addRect(f, 'loader_fill',  80, 520, (SW - 160) * 0.55, 4, C.emerald, 2);
  figma.currentPage.appendChild(f);
}

// ── 02: Auth ──────────────────────────────────────────────────
async function buildAuth(idx) {
  var f = makeScreen('02 - Auth Screen', idx);
  // Full gradient bg
  addRect(f, 'bg_top', 0, 0, SW, SH, C.navyDeep);
  var glow = addEllipse(f, 'bg_glow', (SW - 320) / 2, -60, 320, 320, C.emeraldDk, 0.1);

  // Logo (76×76)
  addRect(f, 'logo_bg', (SW - 76) / 2, 84, 76, 76, C.emerald, 18);
  addRect(f, 'logo_inner', (SW - 38) / 2, 103, 38, 38, C.emeraldDk, 10);
  await addText(f, 'Scorepion', 0, 174, 32, 'Bold', C.white, 'CENTER', SW);
  await addText(f, 'Sign in to continue', 0, 214, 14, 'Regular', C.white, 'CENTER', SW, 0.5);

  // Tab toggle: "Sign In" / "Create Account"
  var hw = Math.floor((SW - 44) / 2);
  addRect(f, 'toggle_bg', 16, 250, SW - 32, 46, C.navyLight, 23);
  addRect(f, 'toggle_active', 18, 252, hw, 42, C.emerald, 21);
  await addText(f, 'Sign In', 18, 262, 14, 'Semi Bold', C.white, 'CENTER', hw);
  await addText(f, 'Create Account', 18 + hw, 262, 14, 'Semi Bold', C.white, 'CENTER', hw, 0.5);

  // Username input (rgba white bg)
  addRect(f, 'input_user_bg', 16, 314, SW - 32, 52, C.white, 12, 0.07);
  addRect(f, 'input_user_border', 16, 314, SW - 32, 52, C.white, 12, 0.08);
  var ub = f.children[f.children.length - 1]; ub.fills = []; ub.strokes = [{type:'SOLID', color: C.white, opacity: 0.08}]; ub.strokeWeight = 1;
  addRect(f, 'user_icon', 28, 327, 18, 18, C.white, 4, 0.4);
  await addText(f, 'Username', 56, 330, 14, 'Regular', C.white, 'LEFT', SW - 80, 0.45);

  // Password input
  addRect(f, 'input_pass_bg', 16, 378, SW - 32, 52, C.white, 12, 0.07);
  addRect(f, 'input_pass_border', 16, 378, SW - 32, 52, C.white, 12, 0.08);
  var pb = f.children[f.children.length - 1]; pb.fills = []; pb.strokes = [{type:'SOLID', color: C.white, opacity: 0.08}]; pb.strokeWeight = 1;
  addRect(f, 'pass_icon', 28, 391, 18, 18, C.white, 4, 0.4);
  await addText(f, 'Password', 56, 394, 14, 'Regular', C.white, 'LEFT', SW - 80, 0.45);
  addRect(f, 'eye_icon', SW - 46, 391, 18, 18, C.white, 4, 0.4);

  // Submit button (emerald gradient simulation)
  addRect(f, 'btn_submit', 16, 448, SW - 32, 52, C.emerald, 26);
  addRect(f, 'btn_submit_shine', 16, 448, Math.floor((SW - 32) * 0.5), 52, C.emeraldDk, 26, 0.3);
  await addText(f, 'Sign In', 16, 460, 16, 'Semi Bold', C.white, 'CENTER', SW - 32);

  // Divider
  addRect(f, 'div_l', 16, 518, (SW - 128) / 2, 1, C.white, 0, 0.15);
  await addText(f, 'or', (SW - 16) / 2, 508, 13, 'Regular', C.white, 'CENTER', 16, 0.4);
  addRect(f, 'div_r', 16 + (SW - 128) / 2 + 28, 518, (SW - 128) / 2, 1, C.white, 0, 0.15);

  // Google button
  addRect(f, 'btn_google', 16, 534, SW - 32, 52, C.white, 26, 0.07);
  addRect(f, 'google_icon', 28, 548, 22, 22, C.white, 5, 0.4);
  await addText(f, 'Continue with Google', 58, 550, 14, 'Regular', C.textPri);

  // Switch mode text
  await addText(f, 'Don\'t have an account?  Create one', 0, 606, 13, 'Regular', C.white, 'CENTER', SW, 0.5);
  figma.currentPage.appendChild(f);
}

// ── 03: Onboarding ────────────────────────────────────────────
async function buildOnboarding(idx) {
  var f = makeScreen('03 - Onboarding Wizard', idx);
  addRect(f, 'bg', 0, 0, SW, SH, C.navyDeep);
  // Progress steps
  for (var d = 0; d < 4; d++) {
    var dw = d === 0 ? 24 : 8, dh = 8;
    var dot = figma.createRectangle();
    dot.name = 'step_' + d; dot.resize(dw, dh);
    dot.x = SW / 2 - 28 + d * 18; dot.y = 60;
    dot.cornerRadius = 4;
    dot.fills = [{ type: 'SOLID', color: d === 0 ? C.emerald : C.white, opacity: d === 0 ? 1 : 0.2 }];
    f.appendChild(dot);
  }
  // Illustration area
  var ill = addRect(f, 'illus_bg', (SW - 220) / 2, 90, 220, 200, C.navyLight, 28);
  addEllipse(f, 'illus_ball', (SW - 90) / 2, 130, 90, 90, C.emerald);
  addRect(f, 'illus_inner', (SW - 46) / 2, 152, 46, 46, C.emeraldDk, 23);
  // Step 1: Welcome
  await addText(f, 'Welcome to Scorepion', 24, 314, 26, 'Bold', C.white, 'LEFT', SW - 48);
  await addText(f, 'Your ultimate football prediction companion. Compete with friends and climb the leaderboard.', 24, 350, 14, 'Regular', C.textPri, 'LEFT', SW - 48, 0.7);
  // Feature list
  var features = [
    { icon: C.emerald,  label: 'Predict exact match scores daily' },
    { icon: C.gold,     label: 'Compete on global leaderboards'   },
    { icon: C.blue,     label: 'Join private prediction groups'   },
    { icon: C.orange,   label: 'Build streaks and earn badges'    },
  ];
  for (var fi = 0; fi < 4; fi++) {
    var fy = 424 + fi * 50;
    addRect(f, 'feat_bg_' + fi, 24, fy, SW - 48, 42, C.navyCard, 10);
    addRect(f, 'feat_icon_' + fi, 36, fy + 12, 18, 18, features[fi].icon, 9);
    await addText(f, features[fi].label, 64, fy + 12, 13, 'Regular', C.textPri);
  }
  addRect(f, 'btn_next', 16, SH - 120, SW - 32, 52, C.emerald, 26);
  await addText(f, 'Get Started', 16, SH - 108, 16, 'Semi Bold', C.white, 'CENTER', SW - 32);
  await addText(f, 'Skip', SW - 52, SH - 108, 14, 'Regular', C.white, 'LEFT', 40, 0.5);
  figma.currentPage.appendChild(f);
}

// ── 04: Today / Daily Picks ───────────────────────────────────
async function buildToday(idx) {
  var f = makeScreen('04 - Today (Daily Picks)', idx);
  addGradientHeader(f, 300);
  await addStatusBar(f);

  // Header
  await addText(f, 'Good morning, Player!', 16, 56, 26, 'Bold', C.white);
  await addText(f, 'Make your picks for extra points', 16, 88, 14, 'Regular', C.white, 'LEFT', SW - 80, 0.5);
  // Streak icon
  addRect(f, 'streak_icon_bg', SW - 52, 52, 38, 38, C.orange, 19, 0.15);
  addEllipse(f, 'streak_dot', SW - 40, 64, 14, 14, C.orange);

  // Stats row (4 boxes with colored icon backgrounds)
  var stats = [
    { label: 'Streak',  val: '5',    color: C.orange },
    { label: 'Best',    val: '12',   color: C.gold   },
    { label: 'Weekly',  val: '340',  color: C.emerald},
    { label: 'Resets',  val: '08:24',color: C.blue   },
  ];
  var statW = Math.floor((SW - 44) / 4);
  for (var si = 0; si < 4; si++) {
    var sx = 16 + si * (statW + 4);
    addRect(f, 'stat_bg_' + si, sx, 134, statW, 62, C.navyCard, 12);
    addRect(f, 'stat_icon_bg_' + si, sx + 10, 144, 18, 18, stats[si].color, 9, 0.15);
    addRect(f, 'stat_icon_' + si, sx + 13, 147, 12, 12, stats[si].color, 3);
    await addText(f, stats[si].val, sx + 4, 165, 15, 'Bold', C.white, 'CENTER', statW - 8);
    await addText(f, stats[si].label, sx + 4, 182, 10, 'Regular', C.textSec, 'CENTER', statW - 8);
  }

  // Progress bar (6px, with notch markers)
  await addText(f, '6 of 8 predicted', 16, 212, 14, 'Semi Bold', C.white);
  await addText(f, 'Next kickoff in 1h 24m', SW - 148, 214, 11, 'Regular', C.textSec);
  addRect(f, 'prog_track', 16, 232, SW - 32, 6, C.navyLight, 3);
  addRect(f, 'prog_fill', 16, 232, Math.floor((SW - 32) * 0.75), 6, C.emerald, 3);
  // Notch markers
  for (var ni = 1; ni < 8; ni++) {
    addRect(f, 'notch_' + ni, 16 + Math.floor((SW - 32) * ni / 8), 232, 2, 6, C.white, 0, 0.3);
  }

  // 3 Daily Pick cards
  var picks = [
    { league: 'Premier League', lc: C.blue,   t1: 'Man City',   t2: 'Arsenal',    score: '1 - 1', status: 'live',  min: '67' },
    { league: 'La Liga',        lc: C.red,    t1: 'Barcelona',  t2: 'Real Madrid', score: '18:30', status: 'upcoming', min: '' },
    { league: 'Champions Lg',   lc: C.gold,   t1: 'PSG',        t2: 'Bayern',      score: '21:00', status: 'upcoming', min: '' },
  ];
  for (var pi = 0; pi < 3; pi++) {
    var pk = picks[pi], cy = 252 + pi * 118;
    // Card bg
    addRect(f, 'card_bg_' + pi, 16, cy, SW - 32, 106, C.navyCard, 14);
    if (pi === 0) {
      // Green tint for predicted card
      addRect(f, 'card_tint_' + pi, 16, cy, SW - 32, 106, C.emerald, 14, 0.04);
      addRect(f, 'card_border_' + pi, 16, cy, SW - 32, 106, C.emerald, 14, 0.3);
      var cb = f.children[f.children.length - 1]; cb.fills = [];
      cb.strokes = [{type:'SOLID', color: C.emerald, opacity: 0.3}]; cb.strokeWeight = 1;
    }

    // TOP ROW: League + status
    addEllipse(f, 'ldot_' + pi, 28, cy + 12, 8, 8, pk.lc);
    await addText(f, pk.league, 42, cy + 9, 11, 'Medium', C.textSec);
    if (pk.status === 'live') {
      addRect(f, 'live_bg_' + pi, SW - 84, cy + 8, 62, 18, C.red, 9);
      await addText(f, 'LIVE ' + pk.min + '\'', SW - 82, cy + 10, 9, 'Semi Bold', C.white);
    } else {
      addRect(f, 'upcoming_bg_' + pi, SW - 80, cy + 8, 58, 18, C.navyLight, 9);
      await addText(f, pk.score, SW - 80, cy + 10, 10, 'Medium', C.textSec, 'CENTER', 58);
    }

    // MIDDLE ROW: Team1 logo | score/time | Team2 logo
    addRect(f, 't1_logo_' + pi, 28, cy + 32, 40, 40, C.navyLight, 20);
    await addText(f, pk.t1, 28, cy + 75, 12, 'Semi Bold', C.textPri, 'CENTER', 40);
    // Score/time center
    if (pk.status === 'live') {
      addRect(f, 'score_bg_' + pi, (SW - 70) / 2, cy + 38, 70, 28, C.navyLight, 8);
      await addText(f, pk.score, (SW - 70) / 2, cy + 43, 16, 'Bold', C.white, 'CENTER', 70);
    } else {
      await addText(f, pk.score, (SW - 70) / 2, cy + 43, 13, 'Medium', C.textSec, 'CENTER', 70);
    }
    addRect(f, 't2_logo_' + pi, SW - 68, cy + 32, 40, 40, C.navyLight, 20);
    await addText(f, pk.t2, SW - 68, cy + 75, 12, 'Semi Bold', C.textPri, 'CENTER', 40);

    // BOTTOM ROW: prediction status
    if (pi === 0) {
      addRect(f, 'pred_badge_bg', 28, cy + 88, 84, 14, C.emerald, 7, 0.15);
      await addText(f, '✓  Predicted  2 - 1', 28, cy + 89, 10, 'Semi Bold', C.emerald, 'LEFT', 140);
    } else {
      await addText(f, 'Tap to predict', (SW - 90) / 2, cy + 89, 11, 'Regular', C.textMuted, 'CENTER', 90);
    }
  }

  await addTabBar(f, 0);
  figma.currentPage.appendChild(f);
}

// ── 05: Matches ───────────────────────────────────────────────
async function buildMatches(idx) {
  var f = makeScreen('05 - Matches / Fixtures', idx);
  addGradientHeader(f, 220);
  await addStatusBar(f);

  await addText(f, 'Matches', 16, 56, 26, 'Bold', C.white);
  // Settings icon
  addRect(f, 'settings_btn', SW - 48, 52, 32, 32, C.white, 8, 0.08);
  addRect(f, 'settings_icon', SW - 40, 60, 16, 16, C.textPri, 4, 0.7);

  // Filter pills — active=white/navy, inactive=transparent/white
  var filters = ['All', 'Live', 'Upcoming', 'Finished'];
  var pillW = [52, 64, 84, 72], px = 16;
  for (var fi = 0; fi < 4; fi++) {
    if (fi === 0) {
      await addActivePill(f, filters[fi], px, 96, pillW[fi], 30);
    } else {
      await addInactivePill(f, filters[fi], px, 96, pillW[fi], 30);
      if (fi === 1) {
        addRect(f, 'live_count_bg', px + pillW[fi] - 18, 90, 16, 14, C.red, 7);
        await addText(f, '3', px + pillW[fi] - 18, 91, 9, 'Bold', C.white, 'CENTER', 16);
      }
    }
    px += pillW[fi] + 8;
  }

  // Date header: TODAY
  var dateY = 142;
  addEllipse(f, 'date_dot', 16, dateY + 4, 8, 8, C.emerald);
  await addText(f, 'Today', 30, dateY, 13, 'Semi Bold', C.textPri);
  await addText(f, '23 Feb', SW - 50, dateY, 12, 'Regular', C.textSec);
  addRect(f, 'date_line', 16, dateY + 22, SW - 32, 1, C.white, 0, 0.06);

  // Premier League section
  addRect(f, 'pl_header', 16, 172, SW - 32, 38, C.navyCard, 10);
  addEllipse(f, 'pl_dot', 28, 182, 18, 18, C.blue);
  await addText(f, 'PREMIER LEAGUE', 52, 181, 11, 'Semi Bold', C.textPri);
  await addText(f, '6', SW - 36, 182, 12, 'Semi Bold', C.textSec);
  addRect(f, 'pl_chevron', SW - 48, 183, 8, 12, C.textMuted, 2);

  var plMatches = [
    { t1: 'Man City',   t2: 'Arsenal',   score: '1 - 0', status: 'live', stage: '67\''},
    { t1: 'Liverpool',  t2: 'Chelsea',   score: '19:30', status: 'upcoming', stage: '' },
    { t1: 'Man Utd',    t2: 'Tottenham', score: '22:00', status: 'upcoming', stage: '' },
  ];
  for (var mi = 0; mi < 3; mi++) {
    var mm = plMatches[mi], my = 218 + mi * 72;
    addRect(f, 'pl_card_' + mi, 16, my, SW - 32, 64, C.navyCard, 16);
    // Top: status
    if (mm.status === 'live') {
      addRect(f, 'pl_live_bg_' + mi, 28, my + 10, 52, 16, C.red, 8);
      await addText(f, 'LIVE ' + mm.stage, 28, my + 11, 9, 'Semi Bold', C.white, 'CENTER', 52);
    } else {
      addRect(f, 'pl_time_bg_' + mi, 28, my + 10, 48, 16, C.navyLight, 8);
      await addText(f, mm.score, 28, my + 11, 9, 'Medium', C.textSec, 'CENTER', 48);
    }
    // Match row
    addRect(f, 'pl_t1l_' + mi, 28, my + 30, 36, 36, C.navyLight, 18);
    await addText(f, mm.t1, 28, my + 68, 10, 'Regular', C.textSec, 'CENTER', 36);
    // Score
    addRect(f, 'pl_sc_bg_' + mi, (SW - 60) / 2, my + 36, 60, 24, C.navyLight, 8);
    await addText(f, mm.score, (SW - 60) / 2, my + 40, mm.status === 'live' ? 15 : 12, mm.status === 'live' ? 'Bold' : 'Regular', mm.status === 'live' ? C.white : C.textSec, 'CENTER', 60);
    addRect(f, 'pl_t2l_' + mi, SW - 64, my + 30, 36, 36, C.navyLight, 18);
    await addText(f, mm.t2, SW - 64, my + 68, 10, 'Regular', C.textSec, 'CENTER', 36);
    // Prediction badge
    if (mi === 0) {
      addRect(f, 'pl_pred_bg_' + mi, SW - 110, my + 12, 90, 16, C.emerald, 8, 0.15);
      await addText(f, '✓ Predicted', SW - 110, my + 13, 9, 'Semi Bold', C.emerald, 'CENTER', 90);
    }
  }

  // La Liga section (after gap)
  var laY = 218 + 3 * 72 + 16;
  addRect(f, 'll_header', 16, laY, SW - 32, 38, C.navyCard, 10);
  addEllipse(f, 'll_dot', 28, laY + 10, 18, 18, C.red);
  await addText(f, 'LA LIGA', 52, laY + 10, 11, 'Semi Bold', C.textPri);
  await addText(f, '5', SW - 36, laY + 11, 12, 'Semi Bold', C.textSec);

  var llMatches = [
    { t1: 'Barcelona',   t2: 'Sevilla',  score: '18:00', status: 'upcoming' },
    { t1: 'Real Madrid', t2: 'Atletico', score: '20:30', status: 'upcoming' },
  ];
  for (var mi2 = 0; mi2 < 2; mi2++) {
    var mm2 = llMatches[mi2], my2 = laY + 46 + mi2 * 72;
    addRect(f, 'll_card_' + mi2, 16, my2, SW - 32, 64, C.navyCard, 16);
    addRect(f, 'll_time_bg_' + mi2, 28, my2 + 10, 48, 16, C.navyLight, 8);
    await addText(f, mm2.score, 28, my2 + 11, 9, 'Medium', C.textSec, 'CENTER', 48);
    addRect(f, 'll_t1l_' + mi2, 28, my2 + 30, 36, 36, C.navyLight, 18);
    await addText(f, mm2.t1, 28, my2 + 68, 10, 'Regular', C.textSec, 'CENTER', 36);
    addRect(f, 'll_sc_bg_' + mi2, (SW - 60) / 2, my2 + 36, 60, 24, C.navyLight, 8);
    await addText(f, mm2.score, (SW - 60) / 2, my2 + 40, 12, 'Regular', C.textSec, 'CENTER', 60);
    addRect(f, 'll_t2l_' + mi2, SW - 64, my2 + 30, 36, 36, C.navyLight, 18);
    await addText(f, mm2.t2, SW - 64, my2 + 68, 10, 'Regular', C.textSec, 'CENTER', 36);
  }

  await addTabBar(f, 1);
  figma.currentPage.appendChild(f);
}

// ── 06: Leaderboard ───────────────────────────────────────────
async function buildLeaderboard(idx) {
  var f = makeScreen('06 - Leaderboard', idx);
  addGradientHeader(f, 500);
  await addStatusBar(f);

  await addText(f, 'Leaderboard', 16, 56, 26, 'Bold', C.white);

  // Time filters — active=white/navy
  var tfLabels = ['Weekly', 'Monthly', 'All Time'];
  var tfW = [72, 80, 76], tfX = 16;
  for (var ti = 0; ti < 3; ti++) {
    if (ti === 0) {
      await addActivePill(f, tfLabels[ti], tfX, 94, tfW[ti], 30);
    } else {
      await addInactivePill(f, tfLabels[ti], tfX, 94, tfW[ti], 30);
    }
    tfX += tfW[ti] + 8;
  }

  // Podium (3 bars + avatars)
  var podiumBaseY = 190;
  // 2nd place (silver, 44px bar)
  addEllipse(f, 'pod2_av', 32, podiumBaseY - 56, 48, 48, C.silver2nd);
  await addText(f, 'ScoreKing', 20, podiumBaseY - 66, 10, 'Semi Bold', C.textPri, 'CENTER', 72);
  addRect(f, 'pod2_medal', 52, podiumBaseY - 58, 22, 22, C.silver2nd, 11, 0.9);
  await addText(f, '2', 52, podiumBaseY - 54, 12, 'Bold', C.navyDeep, 'CENTER', 22);
  addRect(f, 'pod2_bar', 20, podiumBaseY, 72, 44, C.silver2nd, 8, 0.12);
  await addText(f, '480 pts', 20, podiumBaseY + 14, 11, 'Bold', C.silver2nd, 'CENTER', 72);

  // 1st place (gold, 60px bar)
  addEllipse(f, 'pod1_av', (SW - 56) / 2, podiumBaseY - 72, 56, 56, C.gold1st);
  await addText(f, 'ProPredictor', (SW - 88) / 2, podiumBaseY - 82, 10, 'Semi Bold', C.textPri, 'CENTER', 88);
  addRect(f, 'pod1_medal', (SW - 22) / 2, podiumBaseY - 76, 22, 22, C.gold1st, 11, 0.9);
  await addText(f, '1', (SW - 22) / 2, podiumBaseY - 72, 12, 'Bold', C.navyDeep, 'CENTER', 22);
  addRect(f, 'pod1_bar', (SW - 88) / 2, podiumBaseY, 88, 60, C.gold1st, 8, 0.12);
  await addText(f, '520 pts', (SW - 88) / 2, podiumBaseY + 22, 12, 'Bold', C.gold, 'CENTER', 88);

  // 3rd place (bronze, 32px bar)
  addEllipse(f, 'pod3_av', SW - 80, podiumBaseY - 48, 48, 48, C.bronze3rd);
  await addText(f, 'GoalMaster', SW - 84, podiumBaseY - 58, 10, 'Semi Bold', C.textPri, 'CENTER', 72);
  addRect(f, 'pod3_medal', SW - 60, podiumBaseY - 50, 22, 22, C.bronze3rd, 11, 0.9);
  await addText(f, '3', SW - 60, podiumBaseY - 46, 12, 'Bold', C.navyDeep, 'CENTER', 22);
  addRect(f, 'pod3_bar', SW - 84, podiumBaseY + 28, 72, 32, C.bronze3rd, 8, 0.12);
  await addText(f, '440 pts', SW - 84, podiumBaseY + 38, 11, 'Bold', C.bronze3rd, 'CENTER', 72);

  var afterPodY = podiumBaseY + 70;

  // My rank card
  addRect(f, 'myrank_bg', 16, afterPodY, SW - 32, 52, C.navyCard, 12);
  addRect(f, 'myrank_accent', 16, afterPodY, 3, 52, C.emerald);
  addEllipse(f, 'myrank_av', 27, afterPodY + 10, 32, 32, C.emerald);
  await addText(f, 'P', 27, afterPodY + 18, 14, 'Bold', C.white, 'CENTER', 32);
  await addText(f, '#42', 67, afterPodY + 11, 14, 'Bold', C.emerald);
  await addText(f, 'You', 90, afterPodY + 11, 14, 'Semi Bold', C.textPri);
  await addText(f, '340 pts', SW - 82, afterPodY + 11, 12, 'Semi Bold', C.emerald);
  addEllipse(f, 'myrank_str', SW - 110, afterPodY + 21, 8, 8, C.orange);
  await addText(f, '68%', SW - 96, afterPodY + 32, 10, 'Regular', C.textSec);

  // Chase panel
  var chaseY = afterPodY + 60;
  addRect(f, 'chase_bg', 16, chaseY, SW - 32, 68, C.navyCard, 12);
  addRect(f, 'chase_l', 16, chaseY, 3, 68, C.orange);
  await addText(f, 'Chase Mode', 26, chaseY + 10, 12, 'Semi Bold', C.orange);
  await addText(f, '60 pts behind #41 PitchWizard', 26, chaseY + 27, 11, 'Regular', C.textSec, 'LEFT', SW - 48);
  addRect(f, 'chase_track', 26, chaseY + 50, SW - 60, 6, C.navyLight, 3);
  addRect(f, 'chase_fill', 26, chaseY + 50, Math.floor((SW - 60) * 0.72), 6, C.orange, 3);

  // Leaderboard rows
  var lbUsers = ['ProPredictor', 'ScoreKing', 'GoalMaster', 'PitchWizard', 'MatchGuru', 'FootballAce'];
  var lbPts = ['520', '480', '440', '410', '390', '370'];
  var lbChange = ['+2', '-1', '0', '+3', '-1', '+1'];
  var lbRowY = chaseY + 86;
  for (var ri = 0; ri < 6; ri++) {
    var ry = lbRowY + ri * 54;
    addRect(f, 'lb_row_' + ri, 16, ry, SW - 32, 46, C.navyCard, 12);
    // Rank
    await addText(f, String(ri + 4), 24, ry + 15, 13, 'Bold', C.textSec, 'CENTER', 20);
    // Avatar
    addEllipse(f, 'lb_av_' + ri, 52, ry + 7, 32, 32, C.navyLight);
    await addText(f, lbUsers[ri].substring(0, 2), 52, ry + 15, 13, 'Bold', C.textSec, 'CENTER', 32);
    // Name + stats
    await addText(f, lbUsers[ri], 92, ry + 10, 13, 'Semi Bold', C.textPri);
    addEllipse(f, 'lb_str_' + ri, 92, ry + 30, 8, 8, C.orange);
    await addText(f, '7 streak', 106, ry + 28, 10, 'Regular', C.textSec);
    await addText(f, '62%', 160, ry + 28, 10, 'Regular', C.textSec);
    // Points + change
    await addText(f, lbPts[ri], SW - 90, ry + 12, 14, 'Bold', C.white);
    var chColor = lbChange[ri].charAt(0) === '+' ? C.emerald : lbChange[ri] === '0' ? C.textMuted : C.red;
    await addText(f, lbChange[ri], SW - 50, ry + 28, 10, 'Semi Bold', chColor);
  }

  await addTabBar(f, 2);
  figma.currentPage.appendChild(f);
}

// ── 07: Groups ────────────────────────────────────────────────
async function buildGroups(idx) {
  var f = makeScreen('07 - Groups', idx);
  addGradientHeader(f, 300);
  await addStatusBar(f);

  await addText(f, 'Groups', 16, 56, 26, 'Bold', C.white);
  // Create button (42×42 circular)
  addRect(f, 'create_btn', SW - 58, 50, 42, 42, C.emerald, 21);
  await addText(f, '+', SW - 43, 54, 22, 'Bold', C.white);

  // Search bar
  addRect(f, 'search_bg', 16, 106, SW - 32, 44, C.white, 22, 0.08);
  addRect(f, 'search_icon', 30, 119, 18, 18, C.textPri, 5, 0.5);
  await addText(f, 'Search groups or enter code...', 56, 121, 13, 'Regular', C.white, 'LEFT', SW - 80, 0.4);

  // Tabs: My Groups / Discover
  await addActivePill(f, 'My Groups', 16, 162, 102, 32);
  await addInactivePill(f, 'Discover', 126, 162, 88, 32);

  // Group cards
  var grps = [
    { name: 'PL Predictions',    sub: '12 members',  code: '#PL2024', lc: C.blue,   tag: 'EPL'  },
    { name: 'La Liga Masters',   sub: '8 members',   code: '#LL2024', lc: C.red,    tag: 'ESP'  },
    { name: 'Champions League',  sub: '24 members',  code: '#CL2024', lc: C.gold,   tag: 'UCL'  },
  ];
  for (var gi = 0; gi < 3; gi++) {
    var g = grps[gi], gcy = 208 + gi * 100;
    addRect(f, 'grp_card_' + gi, 16, gcy, SW - 32, 88, C.navyCard, 16);
    // Icon box 44×44
    addRect(f, 'grp_icon_bg_' + gi, 28, gcy + 22, 44, 44, g.lc, 10, 0.15);
    addRect(f, 'grp_icon_' + gi, 38, gcy + 32, 24, 24, g.lc, 6);
    // Name + meta
    await addText(f, g.name, 84, gcy + 20, 15, 'Bold', C.textPri, 'LEFT', SW - 136);
    await addText(f, g.sub, 84, gcy + 42, 12, 'Regular', C.textSec, 'LEFT', SW - 136);
    // Tags
    addRect(f, 'grp_tag_bg_' + gi, 84, gcy + 62, 30, 16, g.lc, 8, 0.15);
    await addText(f, g.tag, 84, gcy + 63, 9, 'Semi Bold', g.lc, 'CENTER', 30);
    // Code badge
    addRect(f, 'code_bg_' + gi, SW - 88, gcy + 20, 72, 22, C.navyLight, 11);
    await addText(f, g.code, SW - 88, gcy + 24, 10, 'Semi Bold', C.emerald, 'CENTER', 72);
    // Chevron
    addRect(f, 'chev_' + gi, SW - 36, gcy + 36, 8, 14, C.textMuted, 2);
  }

  // FAB
  addRect(f, 'fab_bg', SW - 72, SH - 162, 52, 52, C.emerald, 26);
  await addText(f, '+', SW - 57, SH - 152, 22, 'Bold', C.white);

  await addTabBar(f, 3);
  figma.currentPage.appendChild(f);
}

// ── 08: Profile ───────────────────────────────────────────────
async function buildProfile(idx) {
  var f = makeScreen('08 - Profile', idx);

  // Hero gradient (navy to navy, 32px bottom radius)
  var hero = figma.createRectangle();
  hero.name = 'hero_bg'; hero.x = 0; hero.y = 0; hero.resize(SW, 280);
  hero.fills = [{ type: 'SOLID', color: C.navyDeep }]; hero.cornerRadius = 0;
  hero.topLeftRadius = 0; hero.topRightRadius = 0; hero.bottomLeftRadius = 32; hero.bottomRightRadius = 32;
  f.appendChild(hero);
  var glow = addEllipse(f, 'hero_glow', -40, -40, 240, 240, C.emeraldDk, 0.12);

  await addStatusBar(f);
  // Settings btn
  addRect(f, 'settings_btn', SW - 48, 52, 32, 32, C.white, 8, 0.1);
  addRect(f, 'settings_ic', SW - 40, 60, 16, 16, C.textPri, 4, 0.7);

  // Avatar 80×80
  addEllipse(f, 'av_ring', (SW - 88) / 2, 64, 88, 88, C.emerald, 0.2);
  addEllipse(f, 'av_bg', (SW - 80) / 2, 68, 80, 80, C.emerald);
  await addText(f, 'P', (SW - 80) / 2, 90, 28, 'Bold', C.white, 'CENTER', 80);

  // Username + PRO badge
  await addText(f, 'Player123', 0, 158, 24, 'Bold', C.white, 'CENTER', SW);
  addRect(f, 'pro_badge', (SW + 82) / 2, 160, 46, 22, C.gold, 11);
  await addText(f, 'PRO', (SW + 82) / 2, 164, 11, 'Bold', C.navyDeep, 'CENTER', 46);

  // Tier badge + progress
  addRect(f, 'tier_bg', (SW - 152) / 2, 190, 152, 28, C.navyLight, 14);
  addRect(f, 'tier_dot', (SW - 152) / 2 + 10, 198, 12, 12, C.gold, 6);
  await addText(f, 'Sharp Shooter', (SW - 152) / 2 + 30, 195, 12, 'Semi Bold', C.gold);
  addRect(f, 'tier_track', 60, 226, SW - 120, 5, C.navyLight, 3);
  addRect(f, 'tier_fill', 60, 226, Math.floor((SW - 120) * 0.65), 5, C.gold, 3);

  // Dashboard card (semi-transparent white bg)
  addRect(f, 'dash_bg', 16, 252, SW - 32, 84, C.white, 16, 0.06);
  addRect(f, 'dash_border', 16, 252, SW - 32, 84, C.white, 16, 0.08);
  var db = f.children[f.children.length - 1]; db.fills = []; db.strokes = [{type:'SOLID', color: C.white, opacity: 0.08}]; db.strokeWeight = 1;
  var dW = Math.floor((SW - 56) / 3);
  var dVals = ['1,240', '68%', '42'], dLabels = ['Points', 'Accuracy', 'Days Active'];
  for (var di = 0; di < 3; di++) {
    var dx = 24 + di * (dW + 8);
    await addText(f, dVals[di],   dx, 272, 20, 'Bold',    C.white, 'CENTER', dW);
    await addText(f, dLabels[di], dx, 298, 11, 'Regular', C.textPri, 'CENTER', dW, 0.7);
  }

  // Rank badge
  addRect(f, 'rank_bg', 16, 348, SW - 32, 40, C.navyCard, 12);
  addRect(f, 'rank_accent', 16, 348, 3, 40, C.gold);
  await addText(f, 'Global Rank', 28, 354, 12, 'Regular', C.textSec);
  await addText(f, '#42', 28, 370, 15, 'Bold', C.gold);
  await addText(f, '68% accuracy', SW - 120, 354, 11, 'Regular', C.textSec);
  await addText(f, '136 / 200 picks', SW - 128, 370, 11, 'Regular', C.textSec);

  // Stats section header
  await addText(f, 'Stats', 16, 402, 18, 'Semi Bold', C.textPri);
  var statData = [
    { icon: C.emerald, val: '136', lbl: 'Correct Picks' },
    { icon: C.blue,    val: '200', lbl: 'Total Picks'   },
    { icon: C.orange,  val: '5',   lbl: 'Current Streak'},
    { icon: C.gold,    val: '12',  lbl: 'Best Streak'   },
  ];
  var sW = Math.floor((SW - 48) / 2);
  for (var si = 0; si < 4; si++) {
    var ssx = 16 + (si % 2) * (sW + 8);
    var ssy = 426 + Math.floor(si / 2) * 72;
    addRect(f, 'st_bg_' + si, ssx, ssy, sW, 64, C.navyCard, 12);
    addRect(f, 'st_icon_bg_' + si, ssx + 12, ssy + 12, 20, 20, statData[si].icon, 10, 0.15);
    addRect(f, 'st_icon_' + si, ssx + 16, ssy + 16, 12, 12, statData[si].icon, 4);
    await addText(f, statData[si].val, ssx + 40, ssy + 16, 18, 'Bold', C.textPri);
    await addText(f, statData[si].lbl, ssx + 12, ssy + 42, 11, 'Regular', C.textSec);
  }

  // Achievements header
  await addText(f, 'Achievements', 16, 578, 18, 'Semi Bold', C.textPri);
  var achData = ['First Blood', 'Hat Trick', 'On Fire', '7-Day Streak'];
  var achColors = [C.emerald, C.gold, C.orange, C.blue];
  for (var ai = 0; ai < 3; ai++) {
    var aY = 602 + ai * 62;
    addRect(f, 'ach_bg_' + ai, 16, aY, SW - 32, 54, C.navyCard, 12);
    addRect(f, 'ach_icon_bg_' + ai, 28, aY + 13, 28, 28, achColors[ai], 8, 0.15);
    addRect(f, 'ach_icon_' + ai, 34, aY + 19, 16, 16, achColors[ai], 4);
    await addText(f, achData[ai], 68, aY + 12, 14, 'Semi Bold', C.textPri);
    await addText(f, 'Gold  ·  Earned Feb 2024', 68, aY + 32, 11, 'Regular', C.textSec);
    if (ai === 0) {
      addRect(f, 'ach_new', SW - 56, aY + 14, 32, 14, C.emerald, 7);
      await addText(f, 'NEW', SW - 56, aY + 15, 9, 'Bold', C.white, 'CENTER', 32);
    }
  }

  await addTabBar(f, 4);
  figma.currentPage.appendChild(f);
}

// ── 09: Match Detail ──────────────────────────────────────────
async function buildMatchDetail(idx) {
  var f = makeScreen('09 - Match Detail', idx);
  addGradientHeader(f, 200);
  await addStatusBar(f);

  // Back + title
  addRect(f, 'back_btn', 16, 52, 36, 36, C.white, 10, 0.1);
  addRect(f, 'back_arrow', 24, 62, 20, 14, C.textPri, 3, 0.8);
  await addText(f, 'Match Detail', (SW - 100) / 2, 59, 15, 'Semi Bold', C.white);

  // Match header
  addRect(f, 'hdr_bg', 0, 44, SW, 134, C.navyCard);
  addRect(f, 't1_logo_ring', 28, 64, 68, 68, C.blue, 34, 0.2);
  addRect(f, 't1_logo', 34, 70, 56, 56, C.navyLight, 28);
  await addText(f, 'Man City', 22, 134, 12, 'Semi Bold', C.textPri, 'CENTER', 80);
  await addText(f, 'vs', 0, 90, 18, 'Bold', C.textSec, 'CENTER', SW);
  await addText(f, 'Premier League  ·  14:00 GMT', 0, 116, 12, 'Regular', C.textSec, 'CENTER', SW, 0.7);
  addRect(f, 't2_logo_ring', SW - 96, 64, 68, 68, C.red, 34, 0.2);
  addRect(f, 't2_logo', SW - 90, 70, 56, 56, C.navyLight, 28);
  await addText(f, 'Arsenal', SW - 102, 134, 12, 'Semi Bold', C.textPri, 'CENTER', 80);

  // Section tabs: Prediction H2H Details Stats
  var secTabs = ['Prediction', 'H2H', 'Details', 'Stats'];
  var secTW = Math.floor(SW / 4);
  for (var ti = 0; ti < 4; ti++) {
    addRect(f, 'stab_bg_' + ti, ti * secTW, 178, secTW, 40, C.navyDeep);
    await addText(f, secTabs[ti], ti * secTW, 190, 12, ti === 0 ? 'Semi Bold' : 'Regular', ti === 0 ? C.white : C.textSec, 'CENTER', secTW);
  }
  addRect(f, 'stab_line', 0, 216, secTW, 2, C.emerald);

  // Score selector
  await addText(f, 'Your Prediction', 16, 232, 14, 'Semi Bold', C.textPri);

  // Home score selector
  addRect(f, 'home_score_bg', 36, 258, 56, 56, C.emerald, 14, 0.15);
  addRect(f, 'home_score_border', 36, 258, 56, 56, C.emerald, 14, 0.3);
  var hsb = f.children[f.children.length - 1]; hsb.fills = [];
  hsb.strokes = [{type:'SOLID', color: C.emerald, opacity: 0.3}]; hsb.strokeWeight = 2;
  await addText(f, '2', 36, 270, 26, 'Bold', C.emerald, 'CENTER', 56);
  // Stepper buttons 36×36
  addRect(f, 'home_dec', 36, 324, 36, 36, C.navyLight, 12);
  await addText(f, '−', 36, 332, 18, 'Bold', C.textSec, 'CENTER', 36);
  addRect(f, 'home_inc', 80, 324, 36, 36, C.emerald, 12);
  await addText(f, '+', 80, 332, 18, 'Bold', C.white, 'CENTER', 36);
  await addText(f, 'Man City', 28, 366, 11, 'Regular', C.textSec, 'CENTER', 72);

  // VS / colon
  await addText(f, ':', (SW - 14) / 2, 274, 28, 'Bold', C.textSec, 'CENTER', 14);
  // Points badge
  addRect(f, 'pts_bg', (SW - 80) / 2, 286, 80, 22, C.navyLight, 11);
  await addText(f, '10 pts', (SW - 80) / 2, 290, 11, 'Semi Bold', C.gold, 'CENTER', 80);

  // Away score selector
  addRect(f, 'away_score_bg', SW - 92, 258, 56, 56, C.emerald, 14, 0.15);
  addRect(f, 'away_score_border', SW - 92, 258, 56, 56, C.emerald, 14, 0.3);
  var asb = f.children[f.children.length - 1]; asb.fills = [];
  asb.strokes = [{type:'SOLID', color: C.emerald, opacity: 0.3}]; asb.strokeWeight = 2;
  await addText(f, '1', SW - 92, 270, 26, 'Bold', C.emerald, 'CENTER', 56);
  addRect(f, 'away_dec', SW - 120, 324, 36, 36, C.navyLight, 12);
  await addText(f, '−', SW - 120, 332, 18, 'Bold', C.textSec, 'CENTER', 36);
  addRect(f, 'away_inc', SW - 76, 324, 36, 36, C.emerald, 12);
  await addText(f, '+', SW - 76, 332, 18, 'Bold', C.white, 'CENTER', 36);
  await addText(f, 'Arsenal', SW - 100, 366, 11, 'Regular', C.textSec, 'CENTER', 72);

  // Submit
  addRect(f, 'btn_submit', 16, 386, SW - 32, 52, C.emerald, 26);
  await addText(f, 'Submit Prediction', 16, 398, 16, 'Semi Bold', C.white, 'CENTER', SW - 32);

  // Community picks banner
  addRect(f, 'community_bg', 16, 450, SW - 32, 44, C.navyCard, 12);
  await addText(f, 'Community picks: 2-1 (34%)', 28, 462, 12, 'Regular', C.textSec);
  addRect(f, 'comm_bar_bg', 16, 496, SW - 32, 4, C.navyLight, 2);
  addRect(f, 'comm_bar1',   16, 496, Math.floor((SW - 32) * 0.34), 4, C.emerald, 2);

  // H2H rows
  await addText(f, 'Head-to-Head', 16, 514, 14, 'Semi Bold', C.textPri);
  var h2h = [
    { t1: 'MCY', s: '2 - 1', t2: 'ARS', date: 'Dec 2023' },
    { t1: 'ARS', s: '1 - 1', t2: 'MCY', date: 'Apr 2023' },
    { t1: 'MCY', s: '3 - 0', t2: 'ARS', date: 'Jan 2023' },
  ];
  for (var hi = 0; hi < 3; hi++) {
    var h = h2h[hi], hy = 538 + hi * 54;
    addRect(f, 'h2h_row_' + hi, 16, hy, SW - 32, 46, C.navyCard, 10);
    await addText(f, h.date, 24, hy + 16, 10, 'Regular', C.textMuted);
    addRect(f, 'h2h_t1_' + hi, 80, hy + 9, 32, 28, C.navyLight, 8);
    await addText(f, h.t1, 80, hy + 16, 10, 'Bold', C.textPri, 'CENTER', 32);
    addRect(f, 'h2h_sc_' + hi, (SW - 50) / 2, hy + 13, 50, 20, C.navyLight, 6);
    await addText(f, h.s, (SW - 50) / 2, hy + 16, 11, 'Bold', C.textPri, 'CENTER', 50);
    addRect(f, 'h2h_t2_' + hi, SW - 112, hy + 9, 32, 28, C.navyLight, 8);
    await addText(f, h.t2, SW - 112, hy + 16, 10, 'Bold', C.textPri, 'CENTER', 32);
  }

  figma.currentPage.appendChild(f);
}

// ── 10: Premium ───────────────────────────────────────────────
async function buildPremium(idx) {
  var f = makeScreen('10 - Premium / Subscription', idx);
  addRect(f, 'bg', 0, 0, SW, SH, C.navyDeep);
  var glow = addEllipse(f, 'glow', (SW - 300) / 2, -80, 300, 300, C.gold, 0.06);
  await addStatusBar(f);

  addRect(f, 'close_btn', SW - 48, 52, 32, 32, C.white, 16, 0.08);
  await addText(f, '✕', SW - 38, 57, 14, 'Regular', C.textSec);

  // Crown + PRO
  var crownGlow = addEllipse(f, 'crown_glow', (SW - 90) / 2, 64, 90, 90, C.gold, 0.12);
  addRect(f, 'crown_bg', (SW - 60) / 2, 72, 60, 60, C.gold, 30, 0.9);
  addRect(f, 'crown_inner', (SW - 36) / 2, 84, 36, 36, C.gold1st, 10);
  addRect(f, 'pro_badge', (SW - 80) / 2, 144, 80, 26, C.gold, 13);
  await addText(f, 'PRO', (SW - 80) / 2, 149, 14, 'Bold', C.navyDeep, 'CENTER', 80);

  await addText(f, 'Unlock Premium', 0, 184, 24, 'Bold', C.white, 'CENTER', SW);
  await addText(f, 'Get the edge with advanced insights and analytics', 0, 216, 13, 'Regular', C.textSec, 'CENTER', SW);

  // Feature cards 2×3 grid
  var feats = [
    { l: 'Prediction Analytics', s: 'Detailed stats per league', c: C.blue   },
    { l: 'See Others\' Picks',   s: 'Before kickoff',           c: C.purple  },
    { l: 'Advanced H2H',        s: 'Last 10 matchups',         c: C.emerald },
    { l: 'Streak Insights',     s: 'Weekly patterns',          c: C.orange  },
    { l: 'Premium Badge',       s: 'On your profile',          c: C.gold    },
    { l: 'Unlimited Groups',    s: 'No cap on groups',         c: C.red     },
  ];
  var fW = Math.floor((SW - 40) / 2);
  for (var fi = 0; fi < 6; fi++) {
    var fft = feats[fi], ffx = 16 + (fi % 2) * (fW + 8), ffy = 252 + Math.floor(fi / 2) * 84;
    addRect(f, 'feat_bg_' + fi, ffx, ffy, fW, 76, C.navyCard, 12);
    addRect(f, 'feat_icon_bg_' + fi, ffx + 12, ffy + 12, 32, 32, fft.c, 10, 0.15);
    addRect(f, 'feat_icon_' + fi, ffx + 18, ffy + 18, 20, 20, fft.c, 5);
    await addText(f, fft.l, ffx + 52, ffy + 14, 12, 'Semi Bold', C.textPri, 'LEFT', fW - 60);
    await addText(f, fft.s, ffx + 52, ffy + 34, 10, 'Regular', C.textSec, 'LEFT', fW - 60);
  }

  // Pricing toggle
  var hw2 = Math.floor((SW - 36) / 2);
  addRect(f, 'pricing_bg', 16, 510, SW - 32, 44, C.navyLight, 22);
  addRect(f, 'pricing_active', 18, 512, hw2, 40, C.emerald, 20);
  await addText(f, 'Monthly  $4.99', 18, 522, 13, 'Semi Bold', C.white, 'CENTER', hw2);
  await addText(f, 'Yearly  $39.99', 18 + hw2, 522, 13, 'Regular', C.white, 'CENTER', hw2, 0.5);

  addRect(f, 'btn_cta', 16, 566, SW - 32, 52, C.gold, 26);
  await addText(f, 'Start Free Trial', 16, 578, 16, 'Semi Bold', C.navyDeep, 'CENTER', SW - 32);
  await addText(f, 'Cancel anytime · No commitment', 0, 632, 11, 'Regular', C.textMuted, 'CENTER', SW);
  figma.currentPage.appendChild(f);
}

// ── 11: Settings ──────────────────────────────────────────────
async function buildSettings(idx) {
  var f = makeScreen('11 - Settings', idx);
  addGradientHeader(f, 160);
  await addStatusBar(f);
  addRect(f, 'back_btn', 16, 52, 36, 36, C.white, 10, 0.1);
  addRect(f, 'back_arrow', 24, 63, 18, 12, C.textPri, 2, 0.8);
  await addText(f, 'Settings', (SW - 64) / 2, 59, 17, 'Semi Bold', C.white);

  // Mini profile card at top
  addRect(f, 'mini_profile', 16, 100, SW - 32, 72, C.navyCard, 16);
  addEllipse(f, 'mini_av', 28, 112, 48, 48, C.emerald);
  await addText(f, 'P', 28, 126, 18, 'Bold', C.white, 'CENTER', 48);
  await addText(f, 'Player123', 88, 116, 15, 'Semi Bold', C.textPri);
  await addText(f, 'player123@email.com', 88, 136, 12, 'Regular', C.textSec);
  addRect(f, 'profile_chev', SW - 36, 128, 8, 14, C.textMuted, 2);

  var sections = [
    { label: 'ACCOUNT',       rows: [{ l: 'Edit Username', v: 'player123' }, { l: 'Display Name', v: 'Player' }]          },
    { label: 'APPEARANCE',    rows: [{ l: 'Theme', v: 'System' }, { l: 'Language', v: 'English' }]                         },
    { label: 'NOTIFICATIONS', rows: [{ l: 'Match Reminders', toggle: true, on: true }, { l: 'Live Score Alerts', toggle: true, on: false }] },
    { label: 'SUPPORT',       rows: [{ l: 'Help Center', v: '' }, { l: 'Send Feedback', v: '' }]                           },
  ];
  var y = 188;
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    await addText(f, sec.label, 16, y, 11, 'Semi Bold', C.textMuted);
    y += 22;
    for (var ri = 0; ri < sec.rows.length; ri++) {
      var row = sec.rows[ri];
      addRect(f, 'row_bg_' + si + '_' + ri, 16, y, SW - 32, 52, C.navyCard, 12);
      addRect(f, 'row_icon_bg_' + si + '_' + ri, 24, y + 14, 24, 24, C.navyLight, 8);
      addRect(f, 'row_icon_' + si + '_' + ri, 28, y + 18, 16, 16, C.textSec, 4, 0.7);
      await addText(f, row.l, 56, y + 18, 14, 'Regular', C.textPri);
      if (row.toggle) {
        addRect(f, 'tog_track_' + ri, SW - 62, y + 15, 42, 22, row.on ? C.emerald : C.navyLight, 11);
        addEllipse(f, 'tog_thumb_' + ri, row.on ? SW - 34 : SW - 50, y + 18, 16, 16, C.white);
      } else if (row.v) {
        await addText(f, row.v, SW - 16 - row.v.length * 7, y + 18, 12, 'Regular', C.textSec);
        addRect(f, 'row_chev_' + si + '_' + ri, SW - 30, y + 21, 7, 12, C.textMuted, 2);
      } else {
        addRect(f, 'row_chev_' + si + '_' + ri, SW - 30, y + 21, 7, 12, C.textMuted, 2);
      }
      y += 58;
    }
    y += 14;
  }
  addRect(f, 'btn_logout', 16, Math.min(y + 8, SH - 136), SW - 32, 52, C.red, 26, 0.9);
  await addText(f, 'Log Out', 16, Math.min(y + 8, SH - 136) + 14, 16, 'Semi Bold', C.white, 'CENTER', SW - 32);
  await addText(f, 'Scorepion v1.0.0', 0, Math.min(y + 8, SH - 136) + 76, 12, 'Regular', C.textMuted, 'CENTER', SW);
  figma.currentPage.appendChild(f);
}

// ── MAIN ──────────────────────────────────────────────────────
figma.showUI(__html__, { width: 260, height: 360, title: 'Scorepion Generator' });

function errStr(e) {
  if (!e) return 'unknown error';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  try { return JSON.stringify(e); } catch(_) { return String(e); }
}

figma.ui.onmessage = async function(msg) {
  if (msg.type !== 'run') return;
  try {
    var weights = ['Regular', 'Medium', 'Semi Bold', 'Bold'];
    for (var wi = 0; wi < weights.length; wi++) {
      await figma.loadFontAsync({ family: 'Inter', style: weights[wi] });
    }
    calcOffset();

    var names = ['01-Splash','02-Auth','03-Onboarding','04-Today','05-Matches',
                 '06-Leaderboard','07-Groups','08-Profile','09-MatchDetail','10-Premium','11-Settings'];
    var builders = [buildSplash, buildAuth, buildOnboarding, buildToday, buildMatches,
                    buildLeaderboard, buildGroups, buildProfile, buildMatchDetail, buildPremium, buildSettings];

    for (var i = 0; i < builders.length; i++) {
      try {
        await builders[i](i);
      } catch (e) {
        var m2 = 'Screen ' + names[i] + ': ' + errStr(e);
        figma.ui.postMessage({ type: 'error', text: m2 });
        figma.notify('Error — ' + m2, { error: true });
        return;
      }
    }

    figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
    figma.ui.postMessage({ type: 'done', text: '11 screens generated!' });
    figma.notify('Scorepion — 11 screens generated!', { timeout: 5000 });

  } catch (err) {
    var m = 'Setup error: ' + errStr(err);
    figma.ui.postMessage({ type: 'error', text: m });
    figma.notify(m, { error: true });
  }
};
