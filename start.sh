#!/bin/bash

# Game Center Website Startup Script
# This script will check for dependencies and start the development server

echo "🎮 Game Center - Starting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}📥 Installing Node.js...${NC}"
    
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # RedHat/CentOS/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    elif [ -f /etc/arch-release ]; then
        # Arch Linux
        sudo pacman -S nodejs npm
    else
        echo -e "${RED}❌ Unsupported Linux distribution${NC}"
        echo "Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js is installed: $(node --version)${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm is installed: $(npm --version)${NC}"
fi

echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Starting development server...${NC}"
echo ""
echo -e "${YELLOW}📌 The website will be available at:${NC}"
echo -e "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Clear Next.js cache
rm -rf .next

# Start the development server
npm run dev

# Check if the server failed to start
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Server failed to start!${NC}"
    echo -e "${YELLOW}🔄 Attempting to fix by reinstalling dependencies...${NC}"
    echo -e "${YELLOW}   (This might take a minute)${NC}"
    
    rm -rf node_modules package-lock.json
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies reinstalled successfully.${NC}"
        echo -e "${GREEN}🚀 Restarting server...${NC}"
        npm run dev
    else
        echo -e "${RED}❌ Failed to reinstall dependencies.${NC}"
        exit 1
    fi
fi
