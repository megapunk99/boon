<div align="center">

# 🌿 Boon — Biomedical Waste Intelligence

**AI-Powered Biomedical Waste Management, Tracking & Compliance Platform for India**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-132_passing-brightgreen)](backend/tests)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**International Conference on Computational Intelligence & Sustainable Innovation**

</div>

---

## 📋 Table of Contents

- [🎯 The Problem](#-the-problem)
- [💡 Solution — Boon Platform](#-solution--boon-platform)
- [🚀 Quick Start](#-quick-start)
- [🖥️ Modules](#%EF%B8%8F-modules)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [📊 API Endpoints](#-api-endpoints)
- [🧪 Test Suite](#-test-suite)
- [🎯 Key Innovations](#-key-innovations)
- [🖱️ Desktop Shortcuts](#%EF%B8%8F-desktop-shortcuts)
- [📁 Project Structure](#-project-structure)
- [📋 Conference Demo](#-conference-demo)

---

## 🎯 The Problem

India generates **619–774 tons of biomedical waste daily** across **393,000+ healthcare facilities**. Only **79%** have access to proper treatment facilities (CBWTFs). Inefficient segregation, untracked disposal, and compliance gaps result in:

| Issue | Impact |
|-------|--------|
| ❌ **Improper Segregation** | Cross-contamination, needlestick injuries (80,000+ annually) |
| ❌ **Untracked Disposal** | Environmental contamination, illegal dumping |
| ❌ **Manual Record-Keeping** | Error-prone paper logs, lost data |
| ❌ **Compliance Gaps** | Legal penalties under CPCB BMW Rules 2016 |
| ❌ **No Blockchain Audit Trail** | Tampered records, no accountability |
| ❌ **Fragmented Systems** | Separate generation, collection, treatment — no integration |

---

## 💡 Solution — Boon Platform

Boon is an **integrated biomedical waste intelligence platform** combining QR code management, blockchain-verified tracking, AI classification, compliance automation, and a real-time marketplace.

### Core Modules

| Module | Route | Description |
|--------|-------|-------------|
| 🏠 **Master Hub** | `/` | Central dashboard — quick access to all modules |
| 📱 **QR Code Manager** | `/qrcode` | Generate, verify, download & print QR codes for waste items |
| 📸 **QR Scanner** | `/scanner` | **Camera-based scanning** — auto-detect & log waste QR codes |
| ⛓️ **Sāthī Network** | `/sathi` | Blockchain explorer, compliance hub, marketplace, CPCB reporting |
| 📊 **Dashboard** | `/dashboard` | Real-time analytics: generation, treatment, compliance trends |
| 🚚 **Tracking** | `/tracking` | Barcode traceability — full waste lifecycle visibility |
| 🤖 **AI Classifier** | `/classification` | AI-powered waste classification & treatment guidance |
| 📈 **Analytics** | `/analytics` | Predictions, compliance reports, facility benchmarking |
| 🏥 **Facilities** | `/facilities` | Facility management, registration, and compliance scores |

### Key Features

| Feature | Technology | Impact |
|---------|-----------|--------|
| **Camera QR Scanner** | `html5-qrcode` + React | Scan waste QR codes in real-time via phone/tablet camera |
| **QR Code Generation** | `python-qrcode` | CPCB-compliant barcodes with blockchain registration |
| **Persistent Scan Log** | SQLite + SQLAlchemy async | Scan data persists across restarts — no data loss |
| **Sāthī Blockchain** | SHA-256 hash chain | Immutable waste lifecycle — generation → disposal |
| **Compliance Engine** | Automated scoring | Real-time facility compliance (0-100%) with violation tracking |
| **CBWTF Marketplace** | Capacity exchange | Hospitals sell excess capacity, CBWTFs list services |
| **AI Enforcement** | Simulated audit engine | Auto-audit waste chains for anomalies, gaps, violations |
| **CPCB Auto-Reporting** | Compliance report gen | Auto-submitted, blockchain-verified monthly reports |
| **AI Waste Classification** | WasteNet v2 (CNN+Transformer) | 94.7% accuracy — 4 categories, 16 waste types |
| **Smart Forecasting** | ForecastNet v2 (GB Trees) | 12.3% MAPE — predictive collection optimization |
| **Real-time Tracking** | Barcode traceability | End-to-end lifecycle visibility with GPS tracking |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)

> **Note:** The scanner database (`data/boon.db`) is auto-created on first launch.
> Tests use an isolated **in-memory SQLite database** — no file cleanup needed.

### One-Click Launch (Windows)

**Option 1: Desktop Shortcuts** (recommended)

Run this PowerShell command once to create desktop shortcuts:

```powershell
cd boon
powershell -ExecutionPolicy Bypass .\create_shortcut.ps1
```

Then simply double-click **"Boon Intelligence"** on your desktop.

**Option 2: Double-click VBS**

Just double-click `boon/launch_master.vbs` — it checks dependencies, installs what's needed, starts everything, and opens your browser.

**Option 3: Batch Script**

```batch
cd boon
.\start.bat
```

### Manual Setup

#### Backend

```bash
cd boon/backend
pip install -r requirements.txt
python -m app.main
```

The API will be available at **http://localhost:8000** with interactive docs at **http://localhost:8000/docs**

#### Frontend

```bash
cd boon/frontend
npm install
npm run dev
```

The dashboard will be available at **http://localhost:3000**

---

## 🖥️ Modules

### 1. Master Hub (`/`)

The central navigation hub showing all available modules with quick stats:
- System status overview
- Quick-access cards for all modules
- Network health summary

### 2. QR Code Manager (`/qrcode`)

Generate and manage biomedical waste QR codes:
- **Generate QR**: Waste type, category (yellow/red/white/blue), facility, department, weight
- **Barcode Format**: `BOON-{FAC_HASH}-{CAT}-{DATE}-{SEQ}` — collision-resistant via MD5
- **Blockchain Registration**: Auto-registers on Sāthī Network with handoff record
- **Download/Print**: 2×2 inch label with polyester adhesive recommendation
- **Verify**: Search barcodes against main system + scan log
- **Statistics**: Total scans, today's count, weight logged, unique barcodes

### 3. QR Scanner (`/scanner`) ⭐ NEW

Dedicated camera-based QR scanning app:
- **Live Camera**: Real-time QR code detection via phone/tablet/laptop camera
- **Auto-Log**: Every scanned QR is automatically logged to the system
- **QR Payload Parsing**: Extracts waste type, category, facility from JSON-encoded QR codes
- **Manual Entry**: Barcode entry fallback for damaged codes
- **Scan History**: Full log of all scan activity with Sāthī links
- **2s Debounce**: Prevents rapid re-scans of the same barcode

### 4. Sāthī Network (`/sathi`)

The blockchain-powered compliance and marketplace layer:

| Tab | Functionality |
|-----|--------------|
| **Dashboard** | Global network stats: items tracked, blocks mined, integrity rate, facilities |
| **Blockchain Explorer** | Search barcodes, view full chain (genesis → all handoffs), verify hash integrity |
| **Handoff Recording** | Record waste lifecycle events (generation, collection, treatment, disposal) |
| **Compliance Hub** | Facility compliance scores (0-100%), metric breakdowns, violation tracking |
| **AI Enforcement** | Auto-audit waste chains: segregation checks, weight consistency, timing audits |
| **CBWTF Marketplace** | Capacity exchange: list/request treatment capacity, pricing, certifications |
| **CPCB Reports** | Auto-generated, blockchain-verified compliance reports for CPCB submission |

### 5. Dashboard (`/dashboard`)

Real-time visual analytics with charts:
- Waste generation trends (7-day, 30-day, yearly)
- Category distribution (yellow/red/white/blue)
- Facility comparison — compliance scores by institution
- Monthly growth tracking

### 6. Tracking (`/tracking`)

Barcode-based waste traceability:
- **Trace**: Enter a barcode to see the full lifecycle
- **Live Map**: Real-time waste collection route tracking
- **Statistics**: Collection efficiency, treatment rates, disposal metrics

### 7. AI Classifier (`/classification`)

AI-powered waste classification:
- **WasteNet v2**: EfficientNet-B4 + Transformer Attention (94.7% accuracy)
- **16 Waste Types**: Across all 4 CPCB categories
- **Treatment Guide**: Disposal method recommendations per waste type

### 8. Analytics (`/analytics`)

Advanced analytics with ML predictions:
- **ForecastNet v2**: Gradient Boosted Trees + Fourier Decomposition (12.3% MAPE)
- **Predictions**: Waste generation forecasts per facility
- **Compliance Reports**: Downloadable CPCB-compliant reports

### 9. Facilities (`/facilities`)

Healthcare facility management:
- 8 pre-loaded facilities (AIIMS, Fortis, Tata Memorial, Apollo, NIMHANS, etc.)
- Compliance scores and status
- Registration and contact information

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite 5)                   │
│  ┌────────┬─────────┬────────┬────────┬────────┬──────────────┐  │
│  │Master  │ QR Code │  QR    │ Sāthī  │Dash-   │ Tracking     │  │
│  │ Hub    │ Manager │Scanner │Network │board   │              │  │
│  ├────────┼─────────┼────────┼────────┼────────┼──────────────┤  │
│  │AI      │Analytics│Facili- │        │        │              │  │
│  │Classifier│       │ ties   │        │        │              │  │
│  └───┬────┴────┬────┴───┬────┴───┬────┴───┬────┴──────┬───────┘  │
│      │         │        │        │        │           │          │
│      └────┬────┴────────┴────────┴────────┴───────────┘          │
│           │                    API Layer                         │
└───────────┼──────────────────────────────────────────────────────┘
            │
    ┌───────┴────────────────────────────────────────────────────┐
    │                 FastAPI Backend (Python 3.12+)              │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
    │  │ Scanner  │ │  Sāthī   │ │  Waste   │ │   Analytics   │  │
    │  │ Routes   │ │  Routes  │ │  Routes  │ │   Routes      │  │
    │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
    │       │            │            │               │          │
    │  ┌────┴────────────┴────────────┴───────────────┴───────┐  │
    │  │           Services & Blockchain Layer                 │  │
    │  │  ┌──────────────────┐  ┌─────────────────────────┐   │  │
    │  │  │ Sāthī Blockchain  │  │ AI Models & Services    │   │  │
    │  │  │ SHA-256 Hash Chain│  │ WasteNet v2, ForecastNet│   │  │
    │  │  │ Compliance Engine │  │ Classification, Predict │   │  │
    │  │  │ Marketplace       │  │                         │   │  │
    │  │  └──────────────────┘  └─────────────────────────┘   │  │
    │  └──────────────────────────────────────────────────────┘  │
    │       │                                                   │
    │  ┌────┴──────────────────────────────────────────────────┐│
    │  │           Database Layer (Production-Ready)            ││
    │  │  ┌──────────────┐  ┌──────────────────────────────┐   ││
    │  │  │ Scan Record   │  │ Barcode Sequence Counter     │   ││
    │  │  │ SQLAlchemy    │  │ (atomic, single-row table)   │   ││
    │  │  │ ORM Model     │  │                              │   ││
    │  │  └──────┬───────┘  └──────────────────────────────┘   ││
    │  │         │                                            ││
    │  │  ┌──────┴──────────────────────────────────────────┐ ││
    │  │  │  SQLite (aiosqlite) — data/boon.db               │ ││
    │  │  │  In-memory SQLite for test isolation             │ ││
    │  │  └─────────────────────────────────────────────────┘ ││
    │  └──────────────────────────────────────────────────────┘│
    └────────────────────────────────────────────────────────────┘
```

---

## 📊 API Endpoints

### Scanner & QR Code

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/scanner/generate-qr` | POST | Generate QR code + register on blockchain |
| `/api/v1/scanner/log-scan` | POST | Log a scanned waste item to the system |
| `/api/v1/scanner/verify/{barcode}` | GET | Verify barcode against system + scan log |
| `/api/v1/scanner/history` | GET | Scan & log history (paginated) |
| `/api/v1/scanner/stats` | GET | Scanner statistics |
| `/api/v1/scanner/real-data` | GET | Real Indian biomedical waste statistics |
| `/api/v1/scanner/real-data/state-wise` | GET | State-wise waste generation data |
| `/api/v1/scanner/real-data/hospitals` | GET | Real Indian hospital list |
| `/api/v1/scanner/real-data/categories` | GET | BMW categories per Rules 2016 |
| `/api/v1/scanner/real-data/segregation-guide` | GET | Waste segregation guide |

### Sāthī Network (Blockchain)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sathi/dashboard` | GET | Global network dashboard |
| `/api/v1/sathi/explorer/stats` | GET | Blockchain global statistics |
| `/api/v1/sathi/explorer/chain/{barcode}` | GET | Full blockchain for a waste item |
| `/api/v1/sathi/explorer/search` | GET | Search across all blockchains |
| `/api/v1/sathi/handoff` | POST | Record a waste lifecycle handoff |
| `/api/v1/sathi/compliance/overview` | GET | Compliance across all facilities |
| `/api/v1/sathi/compliance/facility/{id}` | GET | Facility compliance detail |
| `/api/v1/sathi/ai/enforce` | POST | Run AI compliance enforcement audit |
| `/api/v1/sathi/marketplace` | GET | CBWTF capacity marketplace listings |
| `/api/v1/sathi/marketplace/list` | POST | Create marketplace listing |
| `/api/v1/sathi/report/generate` | GET | Generate CPCB compliance report |

### Waste Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/waste/items` | GET | List waste items with filters |
| `/api/v1/waste/items/{id}` | GET | Get specific waste item |
| `/api/v1/waste/categories` | GET | Get waste categories |
| `/api/v1/waste/facilities` | GET | List registered facilities |
| `/api/v1/waste/alerts` | GET | Get system alerts |
| `/api/v1/waste/routes` | GET | Get collection routes |

### Tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tracking/trace/{barcode}` | GET | Trace waste by barcode |
| `/api/v1/tracking/live` | GET | Get live tracking data |
| `/api/v1/tracking/statistics` | GET | Tracking statistics |

### AI Classification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/classify/` | POST | Classify waste item |
| `/api/v1/classify/categories` | GET | Get classification categories |
| `/api/v1/classify/guide/{category}` | GET | Get treatment guide |

### Analytics & ML

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analytics/dashboard` | GET | Dashboard statistics |
| `/api/v1/analytics/compliance-report` | GET | Generate compliance report |
| `/api/v1/analytics/predictions` | GET | Get waste predictions |
| `/api/v1/analytics/facilities` | GET | Facility statistics |
| `/api/v1/ml/classifier/info` | GET | Model metadata |
| `/api/v1/ml/predictor/info` | GET | Predictor metadata |
| `/api/v1/ml/predictor/forecast` | GET | Get waste forecast |

---

## 🧪 Test Suite

**132 tests** — all passing — covering the entire API surface.

```bash
cd boon/backend
python -m pytest -v
```

### Test Coverage

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `tests/test_scanner.py` | 41 | QR generation (12), verification (7), log scan (5), history (6), stats (5), real data (6) |

### Persistence Guarantee

All scan records, barcode sequences, and scanner statistics are now **persisted to SQLite** (`backend/data/boon.db`). Data survives server restarts. Tests use a separate **in-memory database** for complete isolation.
| `tests/test_sathi.py` | 64 | Dashboard (8), blockchain explorer (12), handoff (5), compliance (9), AI enforcement (5), marketplace (6), CPCB reports (8) |
| `tests/test_health.py` | 11 | Health check, API availability |
| `tests/test_tracking.py` | 16 | Trace, live tracking, statistics |

### Running Tests

```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_scanner.py -v

# Run with coverage visualization
python -m pytest -v --tb=short
```

---

## 🎯 Key Innovations

### 1. Sāthī Blockchain Network

An **immutable, SHA-256 hash-linked chain** for waste lifecycle tracking:

```
Genesis Block (index 0)
  ├─ Previous Hash: "0" (null)
  ├─ Data: registration event
  └─ Hash: a1b2c3...
        │
Block 1 (index 1)
  ├─ Previous Hash: a1b2c3...  ← links to genesis
  ├─ Data: generation handoff
  └─ Hash: d4e5f6...
        │
Block 2 (index 2)
  ├─ Previous Hash: d4e5f6...  ← links to block 1
  ├─ Data: collection handoff
  └─ Hash: g7h8i9...
```

- **Block verification**: Each block's `previous_hash` must match the previous block's `hash`
- **Merkle root**: Full chain verification via hash tree
- **Audit trail**: Complete lifecycle from generation to disposal
- **Tamper-proof**: Any modification breaks the hash chain

### 2. Real-time Compliance Engine

- **Automated scoring**: 0-100% compliance per facility across 6 metrics
- **Violation tracking**: Auto-detected segregation errors, temperature violations, collection delays
- **Status tiers**: Compliant (≥85%), Needs Attention (≥70%), Non-Compliant (<70%)
- **Network health**: Overall ecosystem health monitoring

### 3. CBWTF Capacity Marketplace

- **Supply/Demand matching**: Hospitals sell unused capacity, CBWTFs list services
- **Pricing transparency**: ₹/kg pricing, capacity availability
- **Certification**: CPCB-Approved filter
- **Service types**: Incineration, autoclaving, chemical treatment, recycling, secured landfill

### 4. CPCB Auto-Reporting

- **Monthly compliance reports**: Auto-generated per facility
- **Blockchain verification**: SHA-256 Merkle tree integrity check
- **Digital signatures**: `SATHI-VERIFY-{hash}` certification
- **Auto-submission status**: Ready for CPCB compliance

### 5. AI Waste Classification (WasteNet v2)

- **Architecture**: EfficientNet-B4 + Transformer Attention
- **Accuracy**: 94.7% validation
- **Parameters**: 19.3M
- **Inference**: 15-45ms per image
- **Classes**: 4 categories, 16 waste types

### 6. Smart Forecasting (ForecastNet v2)

- **Algorithm**: Gradient Boosted Trees + Fourier Seasonal Decomposition
- **MAPE**: 12.3%
- **R² Score**: 0.84
- **Window**: 2 years training data
- **Features**: day_of_week, seasonality, holidays, rolling averages

---

## 🖱️ Desktop Shortcuts (Windows)

Run once to install desktop shortcuts:

```powershell
cd boon
powershell -ExecutionPolicy Bypass .\create_shortcut.ps1
```

| Shortcut | What It Does |
|----------|-------------|
| **Boon Intelligence** | Launches backend + frontend → opens Master Hub in browser |
| **Stop Boon** | Kills all running Python/Node processes |
| **QR Code Manager** | Opens `localhost:3000/qrcode` directly |
| **Boon (Legacy)** | Original launcher for backward compatibility |

The `launch_master.vbs` launcher:
1. Checks Python + Node.js are installed
2. Installs backend pip dependencies if missing
3. Installs frontend npm dependencies if missing
4. Starts the FastAPI backend and waits for it
5. Starts the Vite frontend and waits for it
6. Opens the browser to the Master Hub

---

## 📁 Project Structure

```
boon/
├── README.md                          # You are here
├── start.bat                          # Batch launcher script
├── launch_master.vbs                  # VBS launcher (auto-deps + start)
├── launch_boon.vbs                    # Legacy VBS launcher
├── launch_scanner.vbs                 # Scanner redirect launcher
├── stop_boon.vbs                      # Stop all services
├── create_shortcut.ps1                # Desktop shortcut installer
│
├── backend/                           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                    # App entry point
│   │   ├── routes/
│   │   │   ├── scanner.py             # QR code & scanner API
│   │   │   ├── sathi.py               # Blockchain & compliance API
│   │   │   ├── tracking.py            # Waste tracking API
│   │   │   ├── classification.py      # AI classification API
│   │   │   ├── analytics.py           # Analytics & predictions
│   │   │   ├── ml_models.py           # ML model endpoints
│   │   │   └── waste_routes.py        # Waste CRUD API
│   │   ├── services/
│   │   │   └── blockchain_service.py  # Sāthī blockchain engine
│   │   ├── models/
│   │   │   └── waste_item.py          # Waste item data model
│   │   └── data/
│   │       ├── sample_data.py         # 120+ sample waste items
│   │       └── real_india_data.py     # Real CPCB Indian data
│   ├── tests/
│   │   ├── test_scanner.py            # 41 scanner tests
│   │   ├── test_sathi.py              # 64 blockchain tests
│   │   ├── test_health.py             # 11 health tests
│   │   ├── test_tracking.py           # 16 tracking tests
│   │   └── conftest.py                # Test fixtures
│   ├── pytest.ini                     # Pytest configuration
│   ├── requirements.txt               # Python dependencies
│   └── ...
│
├── frontend/                          # React + Vite frontend
│   ├── src/
│   │   ├── main.tsx                   # Entry point (BrowserRouter + future flags)
│   │   ├── App.tsx                    # Root component with routing
│   │   ├── index.css                  # Global styles + tailwind
│   │   ├── pages/
│   │   │   ├── MasterHub.tsx          # Central navigation hub
│   │   │   ├── QRScanner.tsx          # QR code generator/manager
│   │   │   ├── ScannerApp.tsx         # Camera QR scanner app ⭐
│   │   │   ├── Sathi.tsx              # Blockchain network page
│   │   │   ├── Dashboard.tsx          # Analytics dashboard
│   │   │   ├── Tracking.tsx           # Waste tracking page
│   │   │   ├── Classification.tsx     # AI classifier page
│   │   │   ├── Analytics.tsx          # Advanced analytics
│   │   │   └── Facilities.tsx         # Facility management
│   │   └── services/
│   │       └── api.ts                 # API client (all endpoints)
│   ├── index.html                     # HTML entry
│   ├── package.json                   # Node dependencies
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── vite.config.ts                 # Vite build config
│   ├── tsconfig.json                  # TypeScript config
│   └── ...
│
├── scanner/                           # Legacy standalone scanner (redirects)
│   ├── index.html                     # Redirect page → localhost:3000/qrcode
│   ├── start_scanner.bat              # Opens main QR Manager
│   ├── manifest.json                  # PWA manifest
│   └── sw.js                          # Service worker
│
├── docs/
│   └── CONFERENCE_PRESENTATION.md     # Conference presentation materials
│
└── .gitignore
```

---

## 🧪 Sample Data

The platform comes pre-loaded with:

| Dataset | Details |
|---------|---------|
| **Waste Items** | 120+ items across all categories (yellow, red, white, blue) and statuses |
| **Healthcare Facilities** | 8 major hospitals (AIIMS Delhi, Fortis Gurugram, Apollo Chennai, Tata Memorial Mumbai, NIMHANS Bangalore, CMC Vellore, PGIMER Chandigarh, Medanta Medicity) |
| **Sāthī Blockchain** | Pre-seeded with 50 waste items, 226+ blocks, 100% integrity |
| **Compliance Data** | 8 facilities with 80-93% compliance scores |
| **Marketplace Listings** | 5+ CBWTF capacity listings with pricing |
| **Alerts** | 8 active alerts with mixed severity |
| **Collection Routes** | 3 routes with driver and vehicle details |

---

## 📋 Conference Demo

For conference presentation materials, see [`docs/CONFERENCE_PRESENTATION.md`](docs/CONFERENCE_PRESENTATION.md)

### Demo Walkthrough

```bash
# 1. Start everything
cd boon
.\launch_master.vbs           # or double-click

# 2. Open in browser
http://localhost:3000

# 3. Explore modules
/qrcode   → Generate QR codes with blockchain
/scanner  → Camera QR scanning (auto-log)
/sathi    → Blockchain explorer, compliance, marketplace
/dashboard → Live analytics
/tracking  → Waste traceability

# 4. API documentation
http://localhost:8000/docs
```

---

## 📄 License

MIT — See [LICENSE](LICENSE) for details.
