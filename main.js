import { app, BrowserWindow, ipcMain, desktopCapturer, session, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEFAULT_PORT = process.env.PORT || 3000;

/**
 * Checks if the local dev/express server is responding
 */
function checkServerReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Waits for the dev/local server to be ready before loading URL
 */
async function waitForServer(port, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    const ready = await checkServerReady(port);
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Zara AI - Voice Companion',
    backgroundColor: '#020617', // Slate-950
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false, // Ensures audio & vision stream smoothly when minimized or unfocused
      webSecurity: true,
    },
  });

  // Handle media permissions (Microphone & DisplayMedia screen capture)
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = ['media', 'microphone', 'camera', 'display-capture', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Configure Screen Sharing handler for getDisplayMedia in Electron
  if (session.defaultSession.setDisplayMediaRequestHandler) {
    session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
        // Automatically select primary screen or first available source
        const primary = sources.find((s) => s.name.toLowerCase().includes('entire') || s.name.toLowerCase().includes('screen 1')) || sources[0];
        if (primary) {
          callback({ video: primary });
        } else {
          callback({});
        }
      }).catch((err) => {
        console.error('[Electron] Error getting desktop sources:', err);
        callback({});
      });
    });
  }

  // Window IPC controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    mainWindow.webContents.send('window-state-changed', {
      isMaximized: mainWindow.isMaximized(),
    });
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('get-desktop-sources', async (_event, options) => {
    return await desktopCapturer.getSources(options || { types: ['screen', 'window'] });
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load App: Either local dev server or production static build
  const loadApp = async () => {
    const isServerOnline = await checkServerReady(DEFAULT_PORT);
    if (isServerOnline) {
      mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}`);
    } else if (isDev) {
      const ready = await waitForServer(DEFAULT_PORT, 20);
      if (ready) {
        mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}`);
      } else {
        // Fallback to static dist if server not launched
        const distIndex = path.join(__dirname, 'dist', 'index.html');
        mainWindow.loadFile(distIndex).catch(() => {
          mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}`);
        });
      }
    } else {
      // Production packaged application
      const distIndex = path.join(__dirname, 'dist', 'index.html');
      mainWindow.loadFile(distIndex).catch((err) => {
        console.error('[Electron] Failed to load dist/index.html:', err);
        mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}`);
      });
    }
  };

  loadApp();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
