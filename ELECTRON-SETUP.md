# Serwaah Portal - Desktop Application Setup

Your web application has been configured to run as an Electron desktop app. Here's what I've set up for you:

## Files Created/Modified

1. **main.js** - Electron main process that:
   - Launches the Node.js server (server.js) in the background
   - Opens the app window pointing to http://localhost:8080
   - Manages app lifecycle

2. **preload.js** - Security layer for the Electron app

3. **package.json** - Updated with:
   - Electron and electron-builder as dev dependencies
   - electron-is-dev as a production dependency
   - New scripts for running the app and building installers
   - Build configuration for creating Windows/Mac/Linux installers

4. **.gitignore** - Includes node_modules and build directories

## Installation & Running

### Step 1: Install Dependencies
Open PowerShell or Command Prompt in your project directory and run:
```powershell
npm install
```

This will install Electron and all other dependencies. This may take 5-10 minutes.

### Step 2: Run in Development Mode
Once installation is complete, run:
```powershell
npm start
```

This will:
1. Start your Node.js server (server.js) automatically
2. Open the Electron app window
3. Load your application at http://localhost:8080

### Step 3: Build the Installer (Optional)
Once you're ready to distribute:

**For Windows (NSIS Installer + Portable):**
```powershell
npm run build-win
```

**For macOS:**
```powershell
npm run build-mac
```

**For Linux:**
```powershell
npm run build-linux
```

The installers will be created in the `dist/` folder.

## Important Notes

- The app is fully self-contained. No local server URL needed when distributed.
- Your server will run as a background process when the app launches
- The app window will automatically close the server when you exit
- Internet is not required for the app to function (unless you're using external APIs)

## Troubleshooting

If npm install takes too long or hangs, you can:
1. Run: `npm cache clean --force`
2. Try again with: `npm install`

If the app won't launch:
1. Check that your server.js has a console.log that includes "listening" or "started" so the app knows when to open the window
2. Make sure port 8080 is not already in use

## Next Steps

- Test the app by running `npm start`
- Customize the window size, icon, and app name in main.js if needed
- Once verified, you can build the installer for distribution
