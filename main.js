// PulseVoice desktop (Electron) — a native shell around the PulseVoice web client.
// It loads the deployed app, auto-grants the microphone for WebRTC calls, and
// lives in the system tray so the softphone stays registered for inbound calls
// even when the window is closed (like Teams/Zoom). Content is the hosted app, so
// it auto-updates with each deploy — no desktop rebuild needed for app changes.

// Chromium's HTTPS-SVCB DNS path can fail (-105 NAME_NOT_RESOLVED) for some hosts
// while the OS resolver succeeds — seen on stun/turn.telnyx.com, which breaks WebRTC
// media. Disable it so Electron resolves those hosts like the rest of the system.
// Must be pushed onto process.argv BEFORE `electron` is required: as of Electron 36,
// app.commandLine.appendSwitch() lowercases both the switch and its value, and these
// Chromium feature names are case-sensitive — lowercased, this switch is silently
// ignored and the DNS bug (and the WebRTC audio breakage it causes) comes back.
process.argv.push('--disable-features=UseDnsHttpsSvcb,UseDnsHttpsSvcbAlpn');

const { app, BrowserWindow, Tray, Menu, shell, nativeImage } = require('electron');
const path = require('node:path');

const APP_URL = process.env.PULSEVOICE_APP_URL || 'https://app.pulsevoice.pulsetechnologies.ai';
const ICON = path.join(__dirname, 'build', 'icon.png');

let win = null;
let tray = null;
let quitting = false;

// Single instance: focus the existing window instead of launching a second copy.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(createWindow);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    title: 'PulseVoice',
    backgroundColor: '#140B29', // brand night — matches the app splash
    icon: ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // WebRTC calls need the mic; auto-grant media, deny everything else.
  win.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === 'media' || permission === 'audioCapture');
  });

  win.loadURL(APP_URL);

  // External links (support, docs) open in the OS browser, not the app shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Close hides to tray so the softphone keeps its connection for inbound calls.
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      win.hide();
    }
  });

  createTray();
}

function showWindow() {
  if (!win) return;
  win.show();
  win.focus();
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(ICON).resize({ width: 18, height: 18 });
  tray = new Tray(trayIcon);
  tray.setToolTip('PulseVoice');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open PulseVoice', click: showWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => { quitting = true; app.quit(); } },
    ]),
  );
  tray.on('click', showWindow);
}

app.on('before-quit', () => { quitting = true; });
// Stay alive in the tray when the window is hidden — keeps inbound working.
app.on('window-all-closed', () => { /* intentionally do not quit */ });
app.on('activate', showWindow); // macOS dock click
