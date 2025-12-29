# 🎮 Game Center - Startup Guide

## Quick Start

### Linux / macOS
```bash
./start.sh
```

### Windows
```batch
start.bat
```

## What the startup script does:

1. ✅ **Checks for Node.js** - If not installed, automatically installs it (Linux only)
2. ✅ **Checks for npm** - Verifies npm is available
3. ✅ **Installs Dependencies** - Runs `npm install` if needed
4. ✅ **Clears Cache** - Removes `.next` folder for fresh start
5. ✅ **Starts Server** - Runs `npm run dev`

## Requirements

- **Node.js** 18.x or higher (automatically installed on Linux)
- **npm** (comes with Node.js)

## Manual Installation

If the automatic script doesn't work:

### Install Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora/RHEL/CentOS:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

**Windows:**
Download from: https://nodejs.org/

**macOS:**
```bash
brew install node
```

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

## Access the Website

After starting, the website will be available at:
- **http://localhost:3000** (or next available port)

## Stopping the Server

Press `Ctrl + C` in the terminal

## Features

- 🎮 Game tracking with timers
- 🏆 Tournament bracket system
- 💰 Entry price management
- 🌐 Bilingual support (English/Persian)
- 🔔 Notification system
- 💾 Local data persistence
- 📊 Tournament history

## Troubleshooting

### Port already in use
The script will automatically use the next available port (3001, 3002, etc.)

### Permission denied (Linux)
```bash
chmod +x start.sh
```

### Dependencies fail to install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Clear cache and restart
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## Production Build

To create a production build:
```bash
npm run build
npm start
```

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **State Management:** React Context

## Support

For issues or questions, check the logs when running the startup script.

---

Made with ❤️ for gamers
