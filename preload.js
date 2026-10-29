const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('prepStore', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.invoke('store:save', data),
  platform: process.platform,
});
