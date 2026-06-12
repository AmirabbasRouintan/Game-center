<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=28&pause=800&color=2196F3&center=true&vCenter=true&width=600&height=60&lines=Game+Center" alt="Typing Animation" />
</div>

<p align="center">
  A web-based billiard hall management system built with Next.js and React. Manage tables, timers, clients, tournaments, and payments.
</p>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radixui&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)

</div>

## About

Game Center is a full-featured management system for billiard and pool halls. It handles table timers with cost calculation, client management with auto-generated codes, tournament brackets with prize pools, and payment tracking — all with a bilingual English/Persian interface and animated UI.

## Features

<div align="center">

- **Table Timers** — Start/stop timers for Snooker and Eight-Ball tables with automatic cost calculation
- **Client Management** — Auto-generated client codes, search, and repeat customer tracking
- **Tournament Brackets** — Create tournaments, manage players, visualize brackets, and calculate prize pools (50/30/20 split)
- **Payment Tracking** — Partial/full payments, payment history with edit and delete
- **Bilingual UI** — Full English and Persian (Farsi) language support
- **Admin Authentication** — Password-protected admin panel with bcrypt
- **Customizable Settings** — Cost per hour, background image, default tab, table visibility
- **Animated Background** — WebGL-powered dark veil with configurable opacity
- **Data Export/Import** — JSON/CSV export and import for backup

</div>

## Tech Stack

<div align="center">

| Frontend | Backend |
|----------|---------|
| Next.js 16 | Next.js API Routes |
| React 19 | File-based JSON storage |
| TypeScript 5 | bcryptjs |
| Tailwind CSS 4 | |
| Radix UI | |
| GSAP / Motion | |
| OGL (WebGL) | |

</div>

## Getting Started

### Prerequisites

- Node.js

### Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

<div align="center">

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/db?key=X` | Read data by key |
| POST | `/api/db` | Write data `{ key, data }` |

</div>

## Deployment

The app can be deployed on [Vercel](https://vercel.com).
