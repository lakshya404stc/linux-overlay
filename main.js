const { app, BrowserWindow, Tray, Menu, screen } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

// Wayland ignores always-on-top / click-through; run through XWayland.
app.commandLine.appendSwitch('ozone-platform', 'x11');
app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration();

if (!app.requestSingleInstanceLock()) app.exit(0);

const LEVELS = [0, 10, 20, 30, 40, 50, 60, 70];
let overlays = [];
let tray;
let level = 40;
let hideTimer = null; // set while temporarily hidden for a screenshot
const HIDE_SECONDS = 10;

// Electron's setIgnoreMouseEvents doesn't take effect under XWayland, so set an
// empty X11 input shape directly.
function clickThrough(win) {
  if (win.isDestroyed() || win.clickThroughStarted) return;
  win.clickThroughStarted = true;
  win.setIgnoreMouseEvents(true);
  const xid = win.getNativeWindowHandle().readUInt32LE(0);
  execFile('/usr/bin/python3', [path.join(__dirname, 'clickthrough.py'), String(process.pid), String(xid)], () => {});
}

function createOverlay(display) {
  const { x, y, width, height } = display.bounds;
  const win = new BrowserWindow({
    x, y, width, height,
    show: false,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    fullscreenable: false,
    backgroundColor: '#00000000',
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  clickThrough(win);
  win.loadFile('overlay.html');
  win.once('ready-to-show', () => {
    win.setBounds({ x, y, width, height });
    win.showInactive();
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    // Set after creation: `focusable: false` in the constructor makes the window
    // override-redirect, and GNOME then ignores its empty input shape.
    win.setFocusable(false);
    win.blur();
    clickThrough(win);
    applyLevel();
  });
  // X11 input shape can be reset when the window is mapped/resized; re-apply.
  win.on('show', () => clickThrough(win));
  win.on('resize', () => clickThrough(win));
  return win;
}

function applyLevel() {
  level = Math.min(level, 70);
  paint(hideTimer ? 0 : level);
}

function paint(pct) {
  for (const w of overlays) {
    if (w.isDestroyed()) continue;
    w.webContents
      .executeJavaScript(`document.getElementById('d').style.background='rgba(0,0,0,${pct / 100})'`)
      .catch(() => {});
  }
}

// Screenshots capture the overlay too, so go fully transparent for a few seconds.
// (Opacity only: hiding/re-showing the window would reset click-through and stickiness.)
function hideForScreenshot() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { hideTimer = null; applyLevel(); buildMenu(); }, HIDE_SECONDS * 1000);
  applyLevel();
  buildMenu();
}

function buildMenu() {
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `Dim: ${level}%`, enabled: false },
    { type: 'separator' },
    ...LEVELS.map((l) => ({
      label: `${l}%`,
      type: 'radio',
      checked: l === level,
      click: () => { clearTimeout(hideTimer); hideTimer = null; level = l; applyLevel(); buildMenu(); },
    })),
    { type: 'separator' },
    { label: hideTimer ? 'Hidden for screenshot…' : `Hide for screenshot (${HIDE_SECONDS}s)`, click: hideForScreenshot },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit(0) },
  ]));
}

function start() {
  overlays = screen.getAllDisplays().map(createOverlay);
  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setToolTip('Dim Overlay');
  buildMenu();
}

app.whenReady().then(() => setTimeout(start, 300));
app.on('window-all-closed', (e) => e.preventDefault());
