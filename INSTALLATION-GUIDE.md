# 📱 SERWAAH PORTAL - Installation Guide for Other Computers

## ✅ Quick Start (Recommended)

### Step 1: Copy All Files to Other Computer
Copy the **entire** Serwaah Portal folder to the other computer.

### Step 2: Install Node.js (First Time Only)
If Node.js is not installed on the target computer:
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Install it (accept all defaults)
4. **Restart the computer**

### Step 3: Run the App
Double-click **`START-APP.bat`**

That's it! The app will:
- Automatically install dependencies (first time only, ~2 mins)
- Open your Serwaah Portal application

---

## 📊 What Gets Copied

The folder includes:
- ✅ All your portal code (HTML, CSS, JS)
- ✅ Server files (Node.js backend)
- ✅ Dependencies cache
- ✅ Easy launcher scripts

**Note:** The `node_modules` folder will be recreated on first run if needed.

---

## ⚙️ System Requirements

- **Windows 7 or newer**
- **Node.js LTS** (installed from nodejs.org)
- **100 MB free disk space**
- **Internet connection** (for first-time setup only)

---

## 🆘 Troubleshooting

### "Node.js not found"
- Install Node.js from https://nodejs.org/
- Restart the computer
- Run START-APP.bat again

### "Permission denied"
- Right-click START-APP.bat → Run as Administrator

### App won't open
- Check that port 8080 is not in use
- Close other applications using port 8080

---

## 🚀 Alternative: Portable USB Drive

To run the app from USB drive:
1. Copy entire Serwaah Portal folder to USB
2. Plug USB into any computer with Node.js
3. Run START-APP.bat from the USB

---

## 📝 Technical Details

- **Runtime:** Node.js + Electron
- **Port:** http://localhost:8080
- **Database:** Stores data in browser (IndexedDB)
- **Storage:** Data persists on that computer

---

**Questions?** Check any error messages in the console window.
