# 🌬️ VayuSense — Urban Air Quality Intelligence Platform

> **Air quality intelligence for Indian cities.** Real-time monitoring, AI-powered source attribution, predictive forecasting, and citizen engagement — all in one platform.

[![Built for ET AI Hackathon](https://img.shields.io/badge/Built%20For-ET%20AI%20Hackathon%202026-00D4B4?style=flat-square)](https://github.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)](https://vite.dev)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Pages & Modules](#pages--modules)
- [AI Integration](#ai-integration)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**VayuSense** is an Urban Air Quality Intelligence platform designed for Indian city administrators, enforcement officers, and citizens. It combines real-time AQI data from CPCB stations, AI-powered pollution source attribution (via Groq/Llama), 72-hour ward-level forecasts, and a citizen-facing PWA — enabling data-driven decisions to combat urban air pollution.

### The Problem
Indian cities face severe air pollution with limited tools for:
- **Real-time ward-level monitoring** (existing tools show city averages, not granular data)
- **Source attribution** (what's causing pollution right now in a specific ward?)
- **Predictive forecasting** (when will air quality worsen tomorrow?)
- **Enforcement prioritization** (which areas need immediate inspection?)
- **Citizen engagement** (personalized, multilingual health advisories)

### Our Solution
VayuSense addresses all five gaps with an integrated platform that connects monitoring → attribution → prediction → action → citizen communication in a single workflow.

---

## Key Features

| Module | Feature | AI-Powered? |
|--------|---------|:-----------:|
| 🗺️ Live Heatmap | Real-time ward-level AQI visualization on dark map | — |
| 🔍 Source Attribution | Groq AI determines pollution sources per ward | ✅ Groq/Llama |
| 📈 72-hr Forecast | Ward-level AQI predictions with confidence bands | ✅ Groq/Llama |
| 🎯 Enforcement Queue | AI-ranked inspection priorities with route optimization | ✅ Groq/Llama |
| 📊 Accuracy Tracker | Forecast RMSE vs persistence baseline comparison | — |
| 📱 Citizen PWA | Personalized multilingual health advisories | ✅ Groq/Llama |
| 🏥 Vulnerability Map | Schools/hospitals overlaid with forecast risk zones | — |
| 🌍 Multi-city | Comparative analytics across Mumbai, Delhi, Bengaluru | — |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (React/Vite)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Dashboard │ │   Map    │ │ Forecast │ │ Citizen │ │
│  │  (Admin)  │ │(Leaflet) │ │(Recharts)│ │  (PWA)  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       └─────────────┴────────────┴─────────────┘      │
│                          │ REST API                    │
├──────────────────────────┼────────────────────────────┤
│                    SERVER (Express.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │   Auth   │ │   AQI    │ │ Forecast │ │  Groq   │ │
│  │(JWT/HTTP)│ │  Routes  │ │  Routes  │ │  Engine │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │             │       │
│  ┌────┴────────────┴────────────┴─────────────┴────┐ │
│  │                 MongoDB (Atlas)                  │ │
│  └──────────────────────────────────────────────────┘ │
│                          │                            │
│  ┌──────────┐  ┌─────────┴──┐  ┌──────────────────┐ │
│  │ CPCB API │  │ OpenWeather│  │   Groq Cloud API  │ │
│  │ (Sensor) │  │  (Weather) │  │  (GPT-OSS 20B)    │ │
│  └──────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite 8** | Build tool & dev server |
| **Vanilla CSS** | Styling (custom design system with CSS variables) |
| **Leaflet.js** | Interactive maps (upcoming) |
| **Recharts** | Data visualization charts (upcoming) |
| **Lucide React** | Icon library |
| **Vite PWA** | Progressive Web App for citizen view (upcoming) |

### Backend (upcoming)
| Technology | Purpose |
|-----------|---------|
| **Express.js** | REST API server |
| **MongoDB Atlas** | Database |
| **JWT** | Authentication |
| **Groq SDK** | AI inference (GPT-OSS 20B) |
| **OpenWeatherMap** | Weather data for forecasting |
| **PDFKit** | Evidence package generation |

---

## Project Structure

```
AQI_ET_AI_HACKATHON/
├── README.md                              # This file
├── client/                                # Frontend (React + Vite)
│   ├── index.html                         # HTML entry point
│   ├── package.json                       # Frontend dependencies
│   ├── vite.config.ts                     # Vite configuration
│   ├── tsconfig.json                      # TypeScript config
│   ├── public/                            # Static assets
│   │   └── favicon.svg                    # VayuSense favicon
│   └── src/
│       ├── main.tsx                       # React entry point
│       ├── App.tsx                        # Root application component
│       ├── index.css                      # Global design system (tokens + animations)
│       ├── types/
│       │   └── index.ts                   # Shared TypeScript types & utilities
│       └── components/
│           ├── common/                    # Reusable components
│           │   ├── AQIBadge.tsx/.css       # AQI value badge with auto-coloring
│           │   ├── StatCard.tsx/.css       # Metric card with trend indicators
│           │   └── WindParticles.tsx       # Canvas wind particle animation
│           └── layout/                    # App shell components
│               ├── AppLayout.tsx/.css      # Root layout (sidebar + topbar + content)
│               ├── Sidebar.tsx/.css        # Collapsible navigation sidebar
│               └── TopBar.tsx/.css         # City selector, clock, live indicator
├── server/                                # Backend (Express.js)
│   ├── package.json                       # Backend dependencies
│   ├── tsconfig.json                      # TS configuration
│   ├── .env.example                       # Environmental templates
│   └── src/
│       ├── index.ts                       # Express server entry point
│       ├── config/db.ts                   # MongoDB connection configuration
│       ├── middleware/auth.middleware.ts  # Session verify middleware
│       ├── models/User.ts                 # Mongoose model and dynamic dev-fallback proxy
│       ├── controllers/auth.controller.ts # Handlers (login, register, logout, etc)
│       └── validators/auth.validator.ts   # Express validation rules
└── docs/                                  # Documentation & architecture
    └── (to be populated)
```

---

## Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### Running the Application

1. **Start the Backend API Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *Note: If no MongoDB connection is configured, the server will automatically fallback to a clean, transient in-memory database to allow out-of-the-box development testing.*

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

The frontend will start on `http://localhost:5173` and communicate with the backend on `http://localhost:5000`.


### Building for Production

```bash
cd client
npm run build
```

---

## Environment Variables

Environment variables will be configured as pages are built. Expected variables:

```env
# Server (.env in /server)
MONGODB_URI=                    # MongoDB Atlas connection string
JWT_SECRET=                     # JWT signing secret
GROQ_API_KEY=                   # Groq Cloud API key
OPENWEATHERMAP_API_KEY=         # OpenWeatherMap API key
GOOGLE_MAPS_API_KEY=            # Google Maps (enforcement route optimizer)
CLOUDINARY_CLOUD_NAME=          # Cloudinary (citizen photo uploads)
CLOUDINARY_API_KEY=             #
CLOUDINARY_API_SECRET=          #
```

> **Note:** API keys are stored in `.env` files (never in code or database). Each key variable name will be confirmed before implementation.

---

## Pages & Modules

### Phase 1 — Foundation (Days 1–6)
| # | Page | Status | Route |
|---|------|--------|-------|
| 1 | Design System + Global Layout | ✅ Complete | — |
| 2 | Auth (Login / Register / Role Hierarchy) | ✅ Complete | `/login`, `/register`, `/citizen`, `/dashboard` |
| 3 | Base Map with Ward Boundaries | ✅ Complete | `/map` |


### Phase 2 — Live Intelligence (Days 7–14)
| # | Page | Status | Route |
|---|------|--------|-------|
| 4 | Live AQI Heatmap Dashboard | 🔲 Pending | `/dashboard` |
| 5 | Ward Detail Panel (Source Attribution) | 🔲 Pending | Component |
| 6 | Historical Time-lapse Explorer | 🔲 Pending | `/history` |

### Phase 3 — Prediction + Enforcement (Days 15–21)
| # | Page | Status | Route |
|---|------|--------|-------|
| 7 | 72-hour Ward Forecast | ✅ Complete | `/forecast` |
| 8 | Forecast Accuracy Tracker | ✅ Complete | `/accuracy` |
| 9 | Enforcement Officer Dashboard | ✅ Complete | `/enforcement` |
| 10 | Evidence Package Generator | ✅ Complete | API endpoint |

### Phase 4 — Citizen Layer (Days 22–26)
| # | Page | Status | Route |
|---|------|--------|-------|
| 11 | Citizen PWA Home | ✅ Complete | `/citizen` |
| 12 | Citizen Health Profile Setup | ✅ Complete | `/citizen/profile` |
| 13 | Commute AQI Advisor | ✅ Complete | `/citizen/commute` |
| 14 | Community Pollution Report | ✅ Complete | `/citizen/report` |

### Phase 5 — Scale + Polish (Days 27–30)
| # | Page | Status | Route |
|---|------|--------|-------|
| 15 | Multi-city Comparison Dashboard | 🔲 Pending | `/cities` |
| 16 | Vulnerability Zone Map + Alerts | 🔲 Pending | `/vulnerability` |
| 17 | Admin Settings + Data Source Config | 🔲 Pending | `/settings` |

---

## AI Integration

VayuSense uses **Groq Cloud API** with **GPT-OSS 20B** for multiple AI features:

| Feature | Endpoint | Groq Use |
|---------|----------|----------|
| Source Attribution | `POST /api/attribution/:wardId` | Determines pollution source breakdown per ward |
| Forecast Narrative | `POST /api/forecast/:wardId` | Generates 72-hr AQI predictions with explanations |
| Enforcement Queue | `POST /api/enforcement/queue` | Ranks wards by intervention priority |
| Citizen Advisory | `POST /api/citizen/advisory` | Personalized multilingual health advice |
| Evidence Package | `POST /api/enforcement/evidence/:wardId` | Formal enforcement narrative generation |
| Vulnerability Alert | `GET /api/alerts/vulnerability` | Draft advisory emails for schools/hospitals |

All Groq prompts use structured JSON output mode for reliable parsing.

---

## Design System

The UI uses a **dark command-center aesthetic** with the following design principles:

### Color Palette
- **Background**: Deep navy/charcoal tones (`#0A0E1A` → `#1E2A3D`)
- **Accent**: Teal (`#00D4B4`) — used sparingly for active states and key metrics
- **AQI Scale**: 6-color gradient from green (Good) to dark red (Severe)

### Typography
- **UI Text**: Inter (400–800 weights)
- **Data Values**: JetBrains Mono — gives AQI readings a precise, scientific feel

### Visual Effects
- **Wind Particles**: Canvas-based flowing particle animation as background
- **Glassmorphism**: Backdrop-filter blur on cards and panels
- **Glow Effects**: Teal neon glow on active navigation and key elements
- **Micro-animations**: Hover lift, shimmer borders, stagger fade-in
- **Live Indicators**: Triple-ring expanding pulse animation

---

## Contributing

This project is being built for the ET AI Hackathon 2026. To contribute:

1. Follow the existing design system — all colors must use CSS variables
2. Components go in `client/src/components/` organized by feature
3. No external libraries without explicit approval
4. Use TypeScript for all new files
5. Maintain this README as new pages are added

---

## License

This project is built for the ET AI Hackathon 2026. License to be determined.

---

<p align="center">
  <strong>VayuSense</strong> — Making every breath count. 🌿
</p>
