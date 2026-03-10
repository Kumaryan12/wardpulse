# URBAN SOLUTIONS
# WardPulse

**Hyperlocal Pollution Attribution, Priority & Mitigation Copilot**

WardPulse is a civic-tech platform designed to help cities move from passive air-quality monitoring to **intelligent, accountable, ward-level action**. Instead of showing only broad city-wide AQI, WardPulse ingests node-level pollution readings, detects hotspots, infers likely source types, prioritizes response using a human-risk aware scoring engine, generates action guidance, tracks field response, and evaluates whether interventions actually improved air quality.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Why WardPulse](#why-wardpulse)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Current MVP Scope](#current-mvp-scope)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Workflow](#core-workflow)
- [Data Model](#data-model)
- [Intelligence Engine](#intelligence-engine)
- [Dashboard Modules](#dashboard-modules)
- [Deployment](#deployment)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Project Locally](#running-the-project-locally)
- [Using the Deployed Backend with Local Simulation](#using-the-deployed-backend-with-local-simulation)
- [API Overview](#api-overview)
- [Demo Flow](#demo-flow)
- [Current Limitations](#current-limitations)
- [Future Roadmap](#future-roadmap)
- [Impact](#impact)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

WardPulse is a cloud-deployed civic intelligence platform for **hyperlocal air pollution response**.

It combines:

- real-time node-level monitoring
- hotspot detection
- source attribution
- confidence scoring
- human-centered prioritization
- ticketing and proof-of-action
- impact evaluation
- recurring hotspot memory
- AI-generated operational and citizen communication

The current MVP uses a **mock live data simulator** to continuously send ward-level readings into the backend, allowing full end-to-end validation of the product workflow. The same ingestion architecture can later be connected to real hardware sensor nodes.

---

## Problem Statement

Most urban pollution systems expose only broad, city-level air-quality information. That creates major gaps:

- city-wide averages hide local spikes
- pollution is highly variable across roads, markets, construction zones, schools, and residential areas
- officials need to know not only **where** pollution is high, but **why**
- vulnerable zones such as schools and hospitals are not always prioritized appropriately
- repeat hotspots often go untreated as long-term structural issues
- field action is rarely tracked with strong accountability
- intervention effectiveness is usually not measured

WardPulse addresses these gaps by creating a complete **detect → prioritize → act → verify → learn** loop.

---

## Why WardPulse

WardPulse is not just an AQI dashboard.

It is a **pollution operations copilot** that answers:

- Where is the hotspot?
- What is likely causing it?
- How confident is the system?
- Is it near a sensitive zone?
- Which location should be prioritized first?
- What action should the city take?
- Has this happened before?
- Was previous action effective?
- Does the case require escalation?

---

## Key Features

### 1. Hyperlocal Monitoring
- Node-level air pollution monitoring
- Ward-level view instead of only city-wide averages
- Supports PM2.5, PM10, temperature, humidity, battery, timestamp

### 2. Hotspot Detection
- Detects node-level pollution spikes based on PM thresholds
- Highlights active hotspots in the dashboard

### 3. Severity Classification
- Classifies each node as:
  - good
  - moderate
  - poor
  - severe

### 4. Source Attribution
Rule-based AI-style inference engine that estimates likely source type:
- construction dust
- road dust
- traffic emissions
- burning
- mixed / uncertain

### 5. Confidence Scoring
For every source prediction, WardPulse also returns:
- confidence score
- source score breakdown
- attribution rationale

### 6. Sensitive-Zone Awareness
Detects whether a hotspot is associated with:
- school
- hospital / clinic
- residential zone
- market
- transit / bus stop
- anganwadi

### 7. Priority Shield
A human-centered prioritization engine that computes:
- priority score
- priority level
- priority reasons
- escalation requirement

Inputs include:
- severity
- hotspot state
- source risk
- sensitive-zone presence
- recurrence count

### 8. Recommendation Engine
Maps likely source + urgency to:
- target response team
- recommended mitigation actions

### 9. AI Brief Generator
Generates:
- officer brief
- citizen advisory
- escalation note

### 10. Recurring Hotspot Memory
Tracks chronic risk by identifying:
- repeated hotspot nodes
- dominant repeated source
- chronic-risk recommendation

### 11. Ticketing Workflow
Allows users to:
- create action tickets
- assign response
- track status
- maintain action lifecycle

### 12. Proof-of-Action
Stores:
- before image
- after image
- remarks

### 13. Impact Evaluation
Evaluates intervention effectiveness using:
- before/after PM averages
- improvement percentage
- effectiveness score
- verdict

### 14. Interactive Dashboard
Includes:
- situation room
- hotspot banner
- ward map
- node cards
- trend charts
- chronic risk panel
- AI brief panel
- ticket pages
- proof / impact pages

---

## System Architecture

WardPulse is structured into the following layers:

### 1. Data Input Layer
Currently:
- mock sensor data simulator

Future-ready for:
- ESP32 sensor nodes
- PM sensors
- real telemetry

### 2. API / Ingestion Layer
FastAPI backend exposing APIs for:
- node registration
- reading ingestion
- history
- dashboard summary
- tickets
- proof upload
- impact reports
- AI briefs
- recurring hotspot memory

### 3. Storage Layer
Current MVP uses SQLite with tables for:
- nodes
- sensor readings
- tickets
- proof logs
- impact reports

### 4. Civic Intelligence Engine
Includes:
- severity classification
- hotspot detection
- source attribution
- confidence scoring
- sensitive-zone detection
- Priority Shield
- recommendation engine
- recurring hotspot memory
- AI brief generation
- impact evaluation

### 5. Frontend Command Center
Next.js dashboard visualizing:
- summary cards
- situation room
- chronic risk panel
- ward map
- node cards
- trend charts
- tickets
- proof logs
- impact reports

### 6. Action & Accountability Loop
- detect hotspot
- prioritize
- generate actions
- create ticket
- upload proof
- evaluate impact
- escalate if needed

### 7. Deployment Layer
- frontend on Vercel
- backend on Render

---

## Current MVP Scope

The current MVP is designed to validate the **full workflow** end to end.

### Included
- live simulated ingestion
- source attribution
- confidence scoring
- Priority Shield
- chronic-risk memory
- AI briefs
- ticketing
- proof upload
- impact evaluation
- deployed cloud demo

### Not yet included
- live hardware node deployment
- production auth / RBAC
- GIS-linked sensitive zone datasets
- weather / wind data fusion
- CV-based evidence
- large-scale production database

---

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- Recharts

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Python

### Database
- SQLite (current MVP)

### Deployment
- Vercel (frontend)
- Render (backend)

---

## Project Structure

```text
wardpulse/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_nodes.py
│   │   │   ├── routes_readings.py
│   │   │   ├── routes_dashboard.py
│   │   │   ├── routes_tickets.py
│   │   │   ├── routes_proofs.py
│   │   │   ├── routes_impact.py
│   │   │   ├── routes_briefs.py
│   │   │   └── routes_memory.py
│   │   ├── models/
│   │   │   ├── node.py
│   │   │   ├── sensor_reading.py
│   │   │   ├── ticket.py
│   │   │   ├── proof_log.py
│   │   │   └── impact_report.py
│   │   ├── schemas/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── simulate_readings.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── tickets/
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── NodeCard.tsx
│   │   │   ├── NodeTrendChart.tsx
│   │   │   ├── SituationRoomPanel.tsx
│   │   │   ├── WardMapPanel.tsx
│   │   │   ├── ChronicRiskPanel.tsx
│   │   │   └── AIBriefPanel.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── package.json
│   └── README.md
│
└── README.md
```
Core Workflow:

Register nodes with metadata such as node ID, ward, location name, coordinates, and type

Generate / ingest readings from the mock simulator.

Store readings in the database.

Compute severity and hotspot status.

Infer likely source using pollution profile + location context.

Generate confidence score and rationale

Compute Priority Shield using pollution severity, source risk, recurrence, and sensitive-zone logic.

Generate recommended actions and response team.

Generate officer brief / citizen advisory / escalation note.

Visualize everything in the dashboard.

Create action ticket if intervention is needed.

Upload proof-of-action with before/after images.

Generate impact report after new readings arrive.

Track recurring hotspots and chronic-risk zones.

Data Model
Nodes
Stores:
node_id
ward_id
location_name
latitude
longitude
node_type

Sensor Readings
Stores:
node_id
timestamp
pm25
pm10
temperature
humidity
battery

Tickets
Stores:
node_id
location_name
ward_id
likely_source
urgency
target_team
status
assigned_to
remarks
timestamps

Proof Logs
Stores:
ticket_id
before_image_path
after_image_path
remarks
uploaded_at

Impact Reports
Stores:
ticket_id
before_pm25_avg
after_pm25_avg
before_pm10_avg
after_pm10_avg
improvement_percent
effectiveness_score
verdict

Intelligence Engine
Severity Classification
Current PM2.5 mapping:
0–60 → good
61–120 → moderate
121–250 → poor
>250 → severe
Hotspot Detection
Hotspot if:
PM2.5 > threshold or
PM10 > threshold
Source Attribution
Source inference is based on:
PM2.5
PM10
PM10 / PM2.5 ratio
location context
severity pattern

Confidence Scoring
WardPulse computes:
likelihood for each source
normalized confidence score
human-readable rationale

Sensitive-Zone Detection
Infers vulnerability from location context:
school
hospital
clinic
residential zone
market
transit/bus stop
anganwadi

Priority Shield
Combines:
severity
hotspot status
source risk
sensitive-zone presence
recurrence count
Outputs:
priority_score
priority_level
priority_reasons
escalation_required

Recommendation Engine
Maps likely source to:
urgency
target team
recommended actions
Recurring Hotspot Memory

Analyzes recent history to find:
recurrence count
dominant repeated source
chronic-risk recommendations

AI Brief Generator

Produces:
officer brief
citizen advisory
escalation note
Impact Evaluation
Compares pre/post action readings to estimate intervention effectiveness.

Dashboard Modules
Dashboard Header
Top-level identity and navigation.
Hotspot Banner
Displays active hotspots at a glance.
Situation Room
Operational summary including:
active hotspots
severe nodes
ticket counts
sensitive-zone risk
escalations required
top source type
top priority node
highest PM2.5 node
Ward Map Panel
Visual node layout with:
marker severity
hotspot emphasis
drill-down selection
Summary Cards
High-level aggregate metrics:
total nodes
total readings
average PM2.5
average PM10
Node Cards
Per-node intelligence:
PM values
source
confidence
Priority Shield
recommendations
AI brief trigger
create ticket action
Trend Charts
Time-series charts for PM2.5 and PM10.
Recurring Hotspot Memory Panel
Highlights:
chronic nodes
recurrence count
dominant repeated source
chronic-risk recommendation
Tickets Page
Action tracking page for response operations.
Proof / Impact Pages
Support accountability and effectiveness evaluation.
Deployment
Frontend
Deployed on Vercel
Backend
Deployed on Render
Current Live Setup
dashboard is cloud accessible
backend APIs are live
local simulator can post to deployed backend
Local Setup
Prerequisites
Python 3.10+
Node.js 18+
npm
Git
Environment Variables
Frontend
Create frontend/.env.local
Env
Copy code
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
For production:
Env
Copy code
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url/api/v1
Backend
Create backend/.env
Env
Copy code
DATABASE_URL=sqlite:///./wardpulse.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
UPLOAD_DIR=uploads
Running the Project Locally
1. Clone the repo
Bash
Copy code
git clone <your-repo-url>
cd wardpulse
2. Backend setup
Bash
Copy code
cd backend
python -m venv .venv
Activate environment:
Windows PowerShell
Powershell
Copy code
.venv\Scripts\Activate.ps1
macOS/Linux
Bash
Copy code
source .venv/bin/activate
Install dependencies:
Bash
Copy code
pip install -r requirements.txt
Start backend:
Bash
Copy code
uvicorn app.main:app --reload
Backend runs at:
Text
Copy code
http://127.0.0.1:8000
3. Frontend setup
```Bash

cd ../frontend
npm install
npm run dev
```
Frontend runs at:
```bash
http://localhost:3000
```
Using the Deployed Backend with Local Simulation
If you want to feed data into the deployed backend instead of local backend, update the simulator:
```BASH
BASE_URL = "https://your-render-backend-url.onrender.com/api/v1/readings/"
```
Then run:
Bash
Copy code
python simulate_readings.py
Important
Make sure nodes are already registered in the deployed backend.
API Overview
Nodes
POST /api/v1/nodes/register
GET /api/v1/nodes/
Readings
POST /api/v1/readings/
GET /api/v1/readings/latest
GET /api/v1/readings/history/{node_id}
Dashboard
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/situation-room
Memory
GET /api/v1/memory/chronic-risk
Tickets
POST /api/v1/tickets/
GET /api/v1/tickets/
PATCH /api/v1/tickets/{ticket_id}
Proofs
POST /api/v1/proofs/{ticket_id}
GET /api/v1/proofs/{ticket_id}
Impact
POST /api/v1/impact/{ticket_id}
GET /api/v1/impact/{ticket_id}
Briefs
GET /api/v1/briefs/{node_id}
Swagger docs:
Text
Copy code
http://127.0.0.1:8000/docs
or deployed:
Text
Copy code
https://your-backend-url/docs
Demo Flow
A recommended demo sequence:
Show live nodes on the ward map
Highlight an active hotspot
Open node card and explain source attribution + confidence
Show Priority Shield and why the node is prioritized
Generate AI brief
Create action ticket
Upload proof-of-action
Generate impact report
Show chronic-risk panel for repeated hotspot memory
Current Limitations
This is an MVP.
Current constraints
live data is simulated, not yet from deployed physical nodes
source attribution is rule-based, not ML-trained
sensitive-zone logic currently uses location context rather than GIS-linked public datasets
SQLite is used for MVP simplicity
proof upload storage is MVP-grade
no production auth / RBAC yet
Why this is acceptable
The current version validates the complete product workflow and proves the architecture is ready for future real-world expansion.
Future Roadmap
Hardware
integrate ESP32-based environmental nodes
connect real PM sensors
support field deployments
Data Fusion
weather feeds
wind direction
traffic feeds
GIS layers
sensitive-zone datasets
Vision Layer
smoke detection
dust plume detection
traffic density estimation
construction evidence
Intelligence Upgrades
ML-based source attribution
forecasting
intervention learning
anomaly detection
Infrastructure
PostgreSQL
cloud object storage
audit logs
auth / user roles
Impact
WardPulse can improve urban pollution response by helping cities:
detect localized pollution faster
prioritize vulnerable areas first
identify chronic civic-risk zones
recommend targeted interventions
communicate clearly with officers and citizens
track field response with accountability
measure whether interventions actually worked
This makes WardPulse especially relevant in pollution-heavy urban environments like Delhi, where local context matters and broad city-wide averages are often insufficient.
Contributing
Contributions are welcome.
Recommended workflow:
create a new branch
make focused changes
test locally
open a pull request
Suggested areas for contribution
sensor integration
UI refinements
stronger inference engine
GIS support
role-based access
cloud storage migration
License
Add the license your team chooses, for example:
Text
Copy code
MIT License
or keep this placeholder until finalized.
Final Positioning
WardPulse is a cloud-deployed civic intelligence platform that transforms hyperlocal pollution readings into prioritized, explainable, accountable, and measurable ward-level action.

