const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('api', {
    print: (data) => ipcRenderer.send('print', data),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSettings: (settings) => ipcRenderer.invoke('set-settings', settings),
    getHtmlContent: (file) => ipcRenderer.invoke('get-html-content', file)
});