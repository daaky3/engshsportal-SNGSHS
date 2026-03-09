const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

console.log('Electron app starting...');

const createWindow = () => {
  console.log('Creating window...');
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Start server and wait before loading app
  startServer().then(() => {
    console.log('Loading http://localhost:8080');
    mainWindow.loadURL('http://localhost:8080');
  }).catch(err => {
    console.error('Failed to start server:', err);
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
    if (serverProcess) serverProcess.kill();
    app.quit();
  });
};

const startServer = () => {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server.js');
    
    console.log('Starting server from:', serverPath);
    
    serverProcess = spawn('node', [serverPath], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
      reject(err);
    });

    // Resolve after timeout to ensure server has time to start
    setTimeout(() => {
      console.log('Server timeout - resolving');
      resolve();
    }, 3000);
  });
};

app.on('ready', () => {
  console.log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
