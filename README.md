# Flame in Freefall — NASA Space Apps Challenge 2026

> **SI-Powered Fire Safety Insights from NASA Microgravity Combustion Data (PSI Repository)**

---

## 🔭 Project Overview

On Earth, gravity drives natural convection: hot gases rise, creating the familiar flickering teardrop flame. In microgravity (free fall), buoyancy is eliminated. Combustion transforms into a radially symmetric, diffusion-limited process resulting in **ghostly blue, spherical flames** that rely entirely on slow molecular diffusion or cabin forced airflow.

As humanity prepares for long-duration deep space exploration—including the **Artemis Lunar Base, pressurized rovers (34% O₂ at 10.2 psi)**, and Mars transit habitats—spacecraft fire safety (prevention, detection, suppression) is the single most critical crew-survival factor.

**Flame in Freefall** is a production-grade, aerospace-standard **Super-Intelligence (SI) Dashboard** that ingests, summarizes, ranks, and interprets decades of NASA microgravity combustion experiments from the **Physical Sciences Informatics (PSI)** data repository and the International Space Station (ISS).

---

## 🚀 Key System Features

1. **Investigation Explorer & Telemetry Breakdown:**
   - Deep inspection of key flight programs: **BASS / BASS-II**, **Saffire I/II/III**, **FLEX / FLEX-2**, **ACME (BRE, CFI-G, E-FIELD)**, **SAME / SAME-R**, **SPICE / SLICE**, and **DAFT / DAFT-2**.
   - Details experimental objectives, fuel geometries, atmospheric matrix (O₂ mole fraction, pressure, flow speed), sensor suites, and extinction mechanisms.

2. **Cross-Investigation Analysis Matrix:**
   - Multi-variable comparison across flight payloads with interactive visualization charts (oxygen ranges, airflow velocities, and relevance scores).

3. **Transparent Crew Fire-Safety Ranking:**
   - Explainable scoring algorithm weighting crew module applicability, exploration atmosphere testing (10.2 psi / 34% O₂), smoke particle sizing, and suppression capability.

4. **Predictive Flammability Modeler:**
   - Interactive engineering simulator calculating **Limiting Oxygen Concentration (LOC)**, **Flame Spread Rate (mm/s)**, **Relative Soot Yield**, and automated emergency ventilation shutdown guidance based on empirical flight data.

5. **Grounded Super-Intelligence (SI) Assistant:**
   - RAG-powered technical Q&A citing authoritative NASA PSI flight records.
   - Configurable for external LLMs (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) with graceful fallback to offline Grounded Aerospace Synthesis.

6. **Earth Benefits & Historical Lessons:**
   - Case studies on **Apollo 1**, **Apollo 13**, and the **1997 Mir fire**.
   - Terrestrial spinoffs: **Lightweight firefighter SCBA cylinders**, **PBI thermal turnout gear**, and **dust-discriminating mining smoke detectors**.

---

## 🛠️ Architecture & Tech Stack

- **Backend:** Python 3.12 + FastAPI + Pydantic + Uvicorn
- **Frontend:** React 19 + Vite + Recharts + Lucide Icons + Custom Aerospace Design System
- **Data Engine:** Structured JSON/SQLite schemas extracted from NASA technical literature & PSI repository
- **Containerization:** Production Dockerfiles + Docker Compose orchestration

---

## ⚡ Quick Start with Docker (Recommended)

To launch the complete platform with a single command:

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build and launch containers
docker compose up --build
```

- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend & Swagger API:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 Local Development Setup (Without Docker)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## 📚 Primary NASA References
- NASA Glenn Research Center: *A Researcher's Guide to International Space Station Combustion Science* (NP-2015-10-034-JSC)
- NASA Physical Sciences Informatics (PSI) Data Repository: [https://psi.nasa.gov](https://psi.nasa.gov)
- NASA Technical Standard NASA-STD-6001: *Flammability, Offgassing, and Compatibility Requirements and Test Procedures*
