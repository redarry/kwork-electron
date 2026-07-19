const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('in-process-gpu');

const injects = [
	{ file: 'projects.js', urls: ['projects'] },
	{ file: 'all_pages.js', urls: [''] },
	{ file: 'client_settings.js', urls: ['client_settings=true'] },
];

const settingsPath = path.join(__dirname, 'settings.json');

const loadSettings = () => {
	try {
		return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
	} catch {
		return {};
	}
};

const saveSettings = (settings) => {
	fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
};

let mainWindow;

const getInjectForUrl = (url) => {
	const scripts = [];
	for (const inject of injects) {
		if (inject.urls.length === 0 || inject.urls.some(pattern => url.includes(pattern))) {
			scripts.push(inject.file);
		}
	}
	return scripts;
};

const runInjects = (webContents, url) => {
	const files = getInjectForUrl(url);
	for (const file of files) {
		const script = fs.readFileSync(path.join(__dirname, 'injects', file), 'utf8');
		webContents.executeJavaScript(script).catch(err => {
			console.error(`Inject error (${file}):`, err.message);
		});
	}
};

const createWindow = () => {
	Menu.setApplicationMenu(null);

	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	mainWindow.webContents.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');

	mainWindow.loadURL('https://kwork.ru');

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.on('will-navigate', (event, url) => {
		if (url.includes('client_settings') && !url.includes('client_settings=true')) {
			event.preventDefault();
			mainWindow.webContents.loadURL('https://kwork.ru/projects?client_settings=true');
		}
	});

	mainWindow.webContents.on('did-navigate', (event, url) => {
		runInjects(mainWindow.webContents, url);
	});

	mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
		runInjects(mainWindow.webContents, url);
	});

	mainWindow.webContents.on('before-input-event', (event, input) => {
		if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
			mainWindow.webContents.toggleDevTools();
		} else if (input.key === 'F5') {
			mainWindow.webContents.reload();
		}
	});

	ipcMain.on('print', (event, data) => {
		console.log(data);
	});

	ipcMain.handle('get-settings', () => {
		return loadSettings();
	});

	ipcMain.handle('set-settings', (event, settings) => {
		saveSettings(settings);
		return true;
	});

	ipcMain.handle('get-html-content', (event, file) => {
		try {
			return fs.readFileSync(path.join(__dirname, 'injects', file), 'utf8');
		} catch {
			return '';
		}
	});
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow();
	}
});
