# 🏥 RehabMonitor – Real-Time Rehabilitation Monitoring System

Production-ready full-stack rehabilitation monitoring system using MediaPipe Pose for real-time joint angle detection.

---

## 📁 Complete Folder Structure

```
rehab-monitor/
├── backend/
│   ├── main.py                          # FastAPI entry point
│   ├── database.py                      # SQLAlchemy engine + get_db dependency
│   ├── requirements.txt
│   ├── .env.example
│   ├── outputs/
│   │   ├── graphs/                      # Generated PNG charts
│   │   └── reports/                     # Generated PDF reports
│   ├── models/
│   │   ├── models.py                    # Patient + RehabSession SQLAlchemy models
│   │   └── schemas.py                   # Pydantic request/response schemas
│   ├── routers/
│   │   ├── sessions.py                  # POST /submit, GET /patient/:id
│   │   ├── patients.py                  # Patient CRUD
│   │   └── reports.py                   # PDF download endpoint
│   └── services/
│       ├── injury_detection.py          # Metrics + injury classification logic
│       ├── graph_service.py             # Matplotlib chart generation
│       ├── pdf_service.py               # ReportLab PDF generation
│       └── email_service.py             # SMTP email with attachment
│
└── frontend/
    ├── index.html
    ├── vite.config.js                   # Proxy /api → FastAPI port 8000
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                      # Demo patient → PatientDashboard
        ├── index.css                    # Global dark theme + animations
        ├── hooks/
        │   └── useMediaPipe.js          # MediaPipe Pose lifecycle hook
        ├── utils/
        │   ├── api.js                   # Axios client
        │   └── angleUtils.js            # Angle math + session stats
        ├── components/
        │   ├── MonitoringSession.jsx    # ⭐ Main: webcam + timer + live chart
        │   └── SessionHistory.jsx       # Past sessions + progress chart
        └── pages/
            └── PatientDashboard.jsx     # Tabs: Monitor | History
```

---

## 🔄 Complete Workflow

```
Patient clicks "Start 30-Second Monitoring"
     ↓
useMediaPipe hook loads MediaPipe Pose from CDN
     ↓
Camera opens → pose.send() runs every frame
     ↓
MediaPipe returns 33 body landmarks per frame
     ↓
extractJoints() picks shoulder/elbow/wrist (best visibility side)
     ↓
calculateAngle(shoulder, elbow, wrist) → degrees
     ↓
Angle stored in angleBuffer + displayed on canvas overlay
     ↓
30-second countdown completes
     ↓
computeSessionStats() → avg, max, min, accuracy, consistency
     ↓
POST /api/sessions/submit with full angle series
     ↓
Backend: calculate_metrics() validates and processes
     ↓
Backend: detect_injury_status() compares with previous session
     ↓
Backend: save RehabSession to database
     ↓
Background tasks (parallel):
  ├── generate_angle_vs_time() → Matplotlib PNG
  ├── generate_progress_chart() → Multi-session PNG
  ├── generate_pdf_report() → ReportLab PDF
  └── send_report_to_doctor() → SMTP email with PDF attachment
     ↓
Frontend shows summary + download link
```

---

## 🧠 Injury Detection Logic

```python
delta = current_avg_angle - previous_avg_angle

if delta > 5.0:    → IMPROVING      ✅ Range of motion increased
elif delta < -5.0: → NEEDS_ATTENTION ⚠️ Range of motion decreased  
else:              → STABLE          ➡️ Within ±5° of last session
# No previous:    → FIRST_SESSION   📊 Baseline recorded
```

---

## 🗄️ Database Schema

### patients
| Column       | Type    | Description              |
|---|---|---|
| id           | INTEGER | Primary key              |
| name         | VARCHAR | Full name                |
| email        | VARCHAR | Unique login email       |
| doctor_email | VARCHAR | Report recipient         |
| condition    | VARCHAR | e.g. Shoulder Rehab      |
| target_angle | FLOAT   | Prescribed ROM target    |
| created_at   | DATETIME| Registration timestamp   |

### rehab_sessions
| Column        | Type    | Description               |
|---|---|---|
| id            | INTEGER | Primary key               |
| patient_id    | INTEGER | FK → patients.id          |
| avg_angle     | FLOAT   | Mean elbow angle          |
| max_angle     | FLOAT   | Maximum detected          |
| min_angle     | FLOAT   | Minimum detected          |
| accuracy      | FLOAT   | % match to target         |
| consistency   | FLOAT   | 100 - std_deviation       |
| injury_status | ENUM    | improving/stable/needs_attention/first_session |
| angle_delta   | FLOAT   | Change vs previous session|
| angle_series  | JSON    | [{t, angle}, ...] raw data|
| graph_path    | VARCHAR | Path to PNG graph         |
| progress_path | VARCHAR | Path to progress PNG      |
| pdf_path      | VARCHAR | Path to PDF report        |
| created_at    | DATETIME| Session timestamp         |

---

## 🚀 Quick Start

### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB URL and SMTP settings

# Start server
uvicorn main:app --reload --port 8000
```
API runs at **http://localhost:8000**
Swagger docs at **http://localhost:8000/docs**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at **http://localhost:5173**

### Create a demo patient first
```bash
curl -X POST http://localhost:8000/api/patients/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "doctor_email": "doctor@clinic.com",
    "condition": "Shoulder Rehabilitation",
    "target_angle": 90
  }'
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/patients/` | Create patient |
| GET  | `/api/patients/{id}` | Get patient |
| POST | `/api/sessions/submit` | Submit session (full pipeline) |
| GET  | `/api/sessions/patient/{id}` | All patient sessions |
| GET  | `/api/sessions/{id}` | Single session |
| GET  | `/api/reports/{id}/download` | Download PDF |
| GET  | `/api/health` | Health check |

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Set in `.env`:
```env
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_16_char_app_password
```

---

## 🔧 Switch to PostgreSQL

```env
# In .env
DATABASE_URL=postgresql://username:password@localhost:5432/rehab_monitor
```
Then create the database:
```sql
CREATE DATABASE rehab_monitor;
```
Tables auto-create on startup.

---

## 📦 Key Dependencies

### Backend
- `fastapi` – async REST API
- `sqlalchemy` – ORM (SQLite/PostgreSQL)
- `matplotlib` – graph generation
- `reportlab` – PDF creation
- `pydantic` – input validation

### Frontend
- `react` – UI framework
- `@mediapipe/pose` – real-time body tracking (CDN)
- `chart.js` + `react-chartjs-2` – live charts
- `axios` – HTTP client