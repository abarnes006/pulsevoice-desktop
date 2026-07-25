# PulseVoice Desktop

The standalone desktop app for [PulseVoice](https://www.pulsetechnologies.ai/products/pulsevoice) — a thin [Electron](https://www.electronjs.org/) shell around the PulseVoice web client. It lives in your system tray and stays connected, so inbound calls ring you even when the window is closed (like Teams or Zoom).

The shell simply loads the hosted web app (`app.pulsevoice.pulsetechnologies.ai`) — it holds no secrets and auto-updates with each web deploy, so it rarely needs a rebuild.

## Download

Get the latest installer from the [**Releases**](../../releases/latest) page, or from [pulsetechnologies.ai/download](https://www.pulsetechnologies.ai/download):

- **Windows** — `PulseVoice-Setup.exe`
- **macOS** — `PulseVoice.dmg`
- **Linux** — `PulseVoice.AppImage`

## Build

Installers are built and published automatically by the **Build & publish desktop installers** GitHub Actions workflow (Windows/macOS/Linux runners), on a `v*` tag or manual run. To build locally: `npm install && npm run dist`.
