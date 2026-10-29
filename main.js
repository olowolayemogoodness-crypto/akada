// Edulink Prep: Electron main process. Opens the window and saves progress to disk.
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const dataFile = () => path.join(app.getPath('userData'), 'progress.json');

ipcMain.handle('store:load', () => {
  try { return JSON.parse(fs.readFileSync(dataFile(), 'utf8')); } catch { return null; }
});
ipcMain.handle('store:save', (_e, data) => {
  const tmp = dataFile() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, dataFile());
  return true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: 'Edulink Prep',
    backgroundColor: '#FFFFFF',
    // macOS: content runs under the title bar, with the traffic lights inset.
    // Windows and Linux: a normal window frame (so close/minimise buttons always show), no menu bar.
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 18, y: 22 } }
      : { autoHideMenuBar: true }),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  // Open outside links (none by default) in the browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
