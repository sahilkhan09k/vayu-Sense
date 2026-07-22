# 🌬️ VayuSense — Urban Air Quality Intelligence Platform

> **Comprehensive Air Quality Intelligence for Indian Cities.** Real-time monitoring, AI-powered source attribution, 72-hour predictive forecasting, automated enforcement dispatch, sensitive receptor vulnerability tracking, and personalized citizen health advisories — all in one unified platform.

[![Built for ET AI Hackathon](https://img.shields.io/badge/Built%20For-ET%20AI%20Hackathon%202026-00D4B4?style=flat-square)](https://github.com/sahilkhan09k/vayu-Sense)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-F05032?style=flat-square)](https://groq.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture & How It Works](#-system-architecture--how-it-works)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Detailed Feature Breakdown](#-detailed-feature-breakdown)
  - [1. Real-Time Command Dashboard](#1-real-time-command-dashboard)
  - [2. Interactive GeoJSON Heatmap & Particle Field Map](#2-interactive-geojson-heatmap--particle-field-map)
  - [3. Historical Time-Lapse & Trend Explorer](#3-historical-time-lapse--trend-explorer)
  - [4. 72-Hour Predictive Forecast & AI Narratives](#4-72-hour-predictive-forecast--ai-narratives)
  - [5. AI Forecast Accuracy & Benchmark Tracker](#5-ai-forecast-accuracy--benchmark-tracker)
  - [6. Enforcement Officer Queue & PDF Evidence Package Generator](#6-enforcement-officer-queue--pdf-evidence-package-generator)
  - [7. Sensitive Vulnerability Zone Mapping](#7-sensitive-vulnerability-zone-mapping)
  - [8. Multi-City Comparative Analytics](#8-multi-city-comparative-analytics)
  - [9. Citizen PWA & Personalized Health Hub](#9-citizen-pwa--personalized-health-hub)
  - [10. Clean-Commute Route Exposure Advisor](#10-clean-commute-route-exposure-advisor)
  - [11. Community Pollution Incident Reporting](#11-community-pollution-incident-reporting)
  - [12. Admin Control Panel & Calibration Settings](#12-admin-control-panel--calibration-settings)
- [AI Integration & Prompt Architecture](#-ai-integration--prompt-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Production Deployment Guide](#-production-deployment-guide)
- [Environment Variables](#-environment-variables)
- [🔮 Future Improvements & Roadmap](#-future-improvements--roadmap)
- [License](#-license)

---

## 🌬️ Overview

**VayuSense** is an end-to-end Urban Air Quality Intelligence platform engineered to address the critical gaps in urban air quality management across Indian metropolises (Mumbai, Delhi, Bengaluru). Existing public tools provide static city-wide averages that fail to answer crucial operational questions: *Which specific ward is suffering right now? What is the dominant source of pollution? Where should enforcement officers inspect today? How can vulnerable citizens adjust their commute safely?*

VayuSense connects sensor telematics, meteorological data, and LLM intelligence into an actionable command loop: **Monitor $\rightarrow$ Attribute $\rightarrow$ Predict $\rightarrow$ Enforce $\rightarrow$ Protect Citizens**.

---

## 🏗️ System Architecture & How It Works

VayuSense operates as a decoupled client-server architecture with a hybrid authentication and API proxy proxying strategy to eliminate cross-site deployment barriers between Vercel and Render.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND (Vercel)                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Command Center   │  │ Interactive Map  │  │ Predictive Engine│  │ Citizen PWA    │  │
│  │ (React 19 / TS)  │  │ (Leaflet + GeoJS)│  │    (Recharts)    │  │ (Tailored App) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           └─────────────────────┴──────────┬──────────┴────────────────────┘           │
│                                            │ REST / Bearer Token & Cookies             │
├────────────────────────────────────────────┼───────────────────────────────────────────┤
│                                   BACKEND (Render)                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ Express 5 Server │  │   JWT Auth &     │  │ Route & Evidence │  │  Groq AI Engine│  │
│  │ (Trust Proxy)    │  │ RBAC Middleware  │  │   PDF Generator  │  │(Llama 3.3 70B) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           │                     │                     │                    │           │
│  ┌────────┴─────────────────────┴─────────────────────┴────────────────────┴─────────┐ │
│  │                                 MongoDB Atlas                                     │ │
│  │            (Users, AQI Snapshots, Enforcement Actions, Reports, Forecasts)         │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│  ┌──────────────────┐           ┌──────────────────┐        ┌───────────────────────┐  │
│  │ CPCB Live Stream │           │ OpenWeather API  │        │   Groq Cloud API      │  │
│  │ (Sensory Feed)   │           │ (Meteorological) │        │ (Llama 3.3 70B Engine)│  │
│  └──────────────────┘           └──────────────────┘        └───────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Telemetry & Weather Ingestion**: The backend periodically ingests live CPCB station data (PM2.5, PM10, NO2, SO2, CO, O3) and OpenWeatherMap parameters (wind speed, direction, temperature, humidity).
2. **AI Attribution & Forecasting**: Groq's high-speed inference engine synthesizes historical telemetry and meteorology to calculate ward-level source attribution breakdowns and 72-hour predictive trends.
3. **Enforcement Priority Calculation**: AI models score wards based on severity, vulnerability density, and wind direction to construct prioritized inspection queues and generate court-ready legal evidence PDFs.
4. **Citizen Delivery**: personalized advisories and clean commute routes are delivered via a responsive PWA tailored to the individual's age and health conditions.

---

## 🔐 Role-Based Access Control (RBAC)

VayuSense enforces strict role-based data visibility and permission boundaries:

| User Role | Target Audience | Primary Capabilities & Access |
|-----------|-----------------|-------------------------------|
| 👤 **Citizen** | General Public, Vulnerable Groups | Access to Citizen PWA, personalized health advisories, commute route pollution exposure analysis, and community incident reporting. |
| 🛡️ **City Authority** | Municipal Officers, Ward Managers | Access to Ward Heatmaps, Source Attribution breakdown, 72-hr Forecasts, Enforcement Inspection Queue, and PDF Evidence generation for their assigned city. |
| 🏛️ **State Authority** | State Pollution Control Board, Regional Directors | Full multi-city oversight (Mumbai, Delhi, Bengaluru), cross-city trend analytics, authority account creation/management, system calibration controls, and policy reports. |

---

## 🚀 Detailed Feature Breakdown

### 1. Real-Time Command Dashboard
- **Live Ward AQI Cards**: Granular display of real-time AQI values categorized into standard CPCB bands (*Good, Satisfactory, Moderate, Poor, Very Poor, Severe*).
- **Sub-Pollutant Breakdown**: Live metrics for PM2.5, PM10, NO2, SO2, CO, and O3 with individual target safety thresholds.
- **Dynamic Ward Filtering & Search**: Instant lookup by ward name, risk classification, or dominant pollutant.
- **Source Attribution Breakdown**: Visual breakdown of estimated contributing sources (e.g., *Vehicular Exhaust 42%, Construction Dust 28%, Industrial Emissions 18%, Biomass Burning 12%*).

### 2. Interactive GeoJSON Heatmap & Particle Field Map
- **Granular Ward Boundaries**: Vector-rendered GeoJSON layers for city ward maps.
- **Dynamic Choropleth Overlay**: Real-time color coding based on active ward AQI values with custom hover states and popup telemetry.
- **Wind Particle Field Vector Canvas**: Custom HTML5 Canvas overlay animating real-time wind speed and direction to visualize pollutant dispersion trajectories.
- **Station Markers & Telemetry Tooltips**: Interactive map markers representing CPCB monitoring stations.

### 3. Historical Time-Lapse & Trend Explorer
- **Interactive Time-Scrubber**: Slider animation allowing users to scrub through 24-hour, 7-day, and 30-day historical air quality progressions.
- **Diurnal Pollution Pattern Charts**: Visualizing peak rush-hour emission spikes vs. nocturnal thermal inversion effects.
- **Comparative Multi-Pollutant Timeline**: Multi-line charts isolating PM2.5 and PM10 fluctuations against meteorological variables.

### 4. 72-Hour Predictive Forecast & AI Narratives
- **Ward-Level Hourly Forecasts**: Predictive AQI trajectories with upper and lower 95% confidence bands using Recharts.
- **Groq AI Predictive Narratives**: Natural language summaries generated by Groq (Llama 3.3) explaining upcoming meteorological traps, stagnation events, or expected relief from incoming winds.
- **Weather Sensitivity Indicators**: Clear callouts showing wind vector effects and humidity impacts on predicted pollutant concentration.

### 5. AI Forecast Accuracy & Benchmark Tracker
- **Model Performance Metrics**: Continuous calculation of Root Mean Square Error (RMSE) and Mean Absolute Error (MAE).
- **CPCB Baseline Comparison**: Benchmarking VayuSense AI predictions against persistence models and historical CPCB baseline averages.
- **Model Drift Detection**: Tracking forecast accuracy degradation over extended forecast horizons to ensure transparent reliability.

### 6. Enforcement Officer Queue & PDF Evidence Package Generator
- **AI-Prioritized Inspection Queue**: Automated scoring algorithm ranking industrial and construction sites based on ward AQI severity, wind vector alignment, and proximity to sensitive receptors.
- **Automated Route Optimization**: Grouping priority inspections into optimized geographic routes for field enforcement teams.
- **Court-Ready PDF Evidence Package**: One-click generation of formal legal PDF reports (powered by PDFKit) containing timestamped sensor readouts, wind trajectories, AI source attribution, and inspection checklists for penalizing violators.

### 7. Sensitive Vulnerability Zone Mapping
- **Receptor Mapping Layer**: Geolocation database of schools, hospitals, eldercare homes, and dense residential clusters.
- **Forecast Risk Overlay**: Highlighting sensitive receptors falling inside predicted "Very Poor" or "Severe" pollution zones over the next 24–48 hours.
- **Automated Email Advisory Generator**: Generating pre-drafted emergency mitigation advisories (e.g., recommending outdoor activity suspension for schools) ready for dispatch to institution administrators.

### 8. Multi-City Comparative Analytics
- **Cross-City Overview**: Side-by-side comparative dashboard monitoring Mumbai, Delhi, and Bengaluru simultaneously.
- **Regional Dominance Ranking**: Comparing primary pollutant drivers (e.g., stubble/dust in Delhi vs. coastal humidity/marine aerosol in Mumbai).
- **Macro Trend Indicators**: Inter-city pollution index ranking for state pollution control boards.

### 9. Citizen PWA & Personalized Health Hub
- **Mobile-First Responsive Interface**: Optimized PWA experience designed specifically for smartphone usage.
- **Personalized Health Profiles**: Tailoring advice based on user demographic (Child, Adult, Elderly) and pre-existing respiratory conditions (Asthma, COPD, Cardiovascular).
- **Groq-Powered Daily Health Advisories**: AI-generated actionable guidance in plain language (e.g., N95 mask recommendations, outdoor exercise window suggestions).

### 10. Clean-Commute Route Exposure Advisor
- **Route Comparison Engine**: Comparing fastest commute routes against cleanest (lowest AQI exposure) routes.
- **Mode-Specific Exposure Estimator**: Calculating total inhaled PM2.5 dosage based on travel mode (Walking, Cycling, Open Auto-rickshaw, AC Car).
- **Peak Exposure Warnings**: Recommending optimal departure times to avoid severe atmospheric inversion windows.

### 11. Community Pollution Incident Reporting
- **Geotagged Incident Submissions**: Allowing citizens to report active pollution violations (uncovered construction dust, illegal garbage burning, industrial smoke stacks).
- **Photo Evidence Upload**: Citizens can attach photo evidence with automatic metadata extraction.
- **Community Feed & Moderation Queue**: Public transparency board showing submitted citizen reports and municipal resolution status.

### 12. Admin Control Panel & Calibration Settings
- **Live Infrastructure Health Monitor**: Live latency and status tracking for MongoDB Atlas, Groq AI Engine, OpenWeatherMap API, and CPCB feeds.
- **Sensor Calibration Scaling**: State authority controls to adjust optical sensor calibration multipliers ($R^2$ correction factors) to account for seasonal ambient humidity shifts.
- **City Authority Credential Generator**: State Authority interface for provisioning secure temporary credentials for municipal city managers.

---

## 🤖 AI Integration & Prompt Architecture

VayuSense leverages **Groq Cloud API** running **Llama 3.3 70B** in strict JSON output mode.

| AI Feature | Backend Endpoint | Prompt Objective |
|------------|------------------|------------------|
| **Source Attribution** | `POST /api/aqi/attribution` | Analyzes multi-pollutant ratios (e.g., high PM10/PM2.5 ratio indicates dust, high NO2/CO indicates vehicular) and outputs precise percentage breakdowns with explanation text. |
| **Forecast Narrative** | `POST /api/aqi/forecast-narrative` | Synthesizes 72-hour forecast vectors with wind speed/direction to produce executive summaries for city planners. |
| **Enforcement Ranking** | `POST /api/enforcement/prioritize` | Ranks non-compliant zones based on environmental risk scores and population density. |
| **Citizen Health Advice** | `POST /api/citizen/advisory` | Generates empathetic, medical-grade health guidance tailored to user health profiles. |
| **Vulnerability Advisories** | `GET /api/vulnerability/advisory` | Drafts formal administrative warning notices for school principals and hospital administrators. |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 8
- **Styling**: Custom Design System with CSS Custom Properties (Dark Command-Center Theme)
- **Mapping**: Leaflet.js & React-Leaflet with custom GeoJSON vector layers
- **Charts**: Recharts & Canvas API
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v18+) with Express 5
- **Database**: MongoDB Atlas via Mongoose ORM
- **Authentication**: JWT with HttpOnly Cookies & Bearer Header Fallback
- **PDF Generation**: PDFKit
- **External APIs**: Groq Cloud SDK (Llama 3.3), OpenWeatherMap API, CPCB Telematics

---

## 💻 Getting Started & Local Setup

### Prerequisites
- **Node.js** $\ge 18.0.0$
- **npm** $\ge 9.0.0$
- **MongoDB** (Local instance or MongoDB Atlas URI)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sahilkhan09k/vayu-Sense.git
   cd AQI_ET_AI_HACKATHON
   ```

2. **Setup and Run Server**:
   ```bash
   cd server
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Setup and Run Client**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Access the Application**:
   Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment Guide

VayuSense is optimized for seamless deployment across **Render** (Backend API) and **Vercel** (Frontend Client).

### 1. Backend on Render
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `PORT` = `5000`
  - `MONGODB_URI` = `mongodb+srv://...`
  - `JWT_SECRET` = `your_jwt_secret`
  - `GROQ_API_KEY` = `gsk_...`
  - `OPENWEATHER_API_KEY` = `your_openweather_key`
  - `CLIENT_URL` = `https://vayu-sense-psi.vercel.app`

### 2. Frontend on Vercel
- **Root Directory**: `client`
- **Framework Preset**: `Vite`
- **Environment Variables**:
  - `VITE_API_BASE_URL` = `https://vayu-sense.onrender.com`

---

## 🔑 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vayusense
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=gsk_your_groq_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🔮 Future Improvements & Roadmap

While VayuSense delivers a comprehensive feature suite, the following enhancements are planned for upcoming releases:

### 1. Hardware Sensor Integration & IoT Edge Nodes
- **Low-Cost Optical Sensor Mesh**: Direct integration with custom ESP32/PMS5003 low-cost sensor nodes deployed at hyper-local neighborhood intervals.
- **Edge Calibration Firmware**: On-device AI calibration algorithms adjusting for relative humidity and thermal noise before transmitting payload to the cloud server.

### 2. Advanced Satellite Data Ingestion
- **INSAT-3D & Sentinel-5P TROPOMI Feed**: Fusing satellite aerosol optical depth (AOD) data with ground station readings to estimate spatial air quality in unmonitored rural and peri-urban wards.

### 3. Automated Drone Inspection Dispatch
- **Autonomous Enforcement Drone Triggering**: Automatically triggering inspection drone flight paths to fly over top-ranked enforcement targets and collect high-resolution thermal/choke point footage.

### 4. Multilingual Voice-First Citizen Interface
- **Regional Voice Assistant**: Integrating Groq Whisper voice recognition to allow citizens to ask air quality and health questions in Hindi, Marathi, Kannada, and Bengali via voice commands.

### 5. Automated Municipal Action Plan Execution (GRAP Integration)
- **Graded Response Action Plan (GRAP) Automation**: Automated triggering of municipal directives (e.g., mechanized road sweeping, anti-smog gun deployment, truck entry bans) based on predicted 48-hour AQI thresholds.

### 6. Health Exposure Analytics & wearable Sync
- **Smartwatch Health Integration**: Syncing with Apple HealthKit and Google Fit to calculate individual daily particulate inhalation doses based on real-time heart rate, breathing volume, and GPS trace.

---

## 📄 License

This project is built for the **ET AI Hackathon 2026**. Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  <strong>VayuSense</strong> — Pure Air Intelligence for Greener Cities. 🌿
</p>
