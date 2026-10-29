# Software Architecture Specification (ARCHITECTURE.md)
# AgroGenius AI: Smart Agriculture Platform

**Document Version:** 1.0.0  
**Status:** Approved Technical Architecture Single Source of Truth  
**Project:** AgroGenius AI  
**Author:** Senior Software Architect  

---

## 1. Architecture Overview

### 1.1 System Purpose & Architectural Principles
AgroGenius AI is an AI/ML-driven smart agricultural intelligence and marketplace platform. It bridges empirical agronomic soil data, meteorological observations, and agricultural commodity supply into an integrated, production-ready system.

The architecture is governed by five non-negotiable principles:

1. **Modular Monolith Simplicity:**  
   The application is structured as a cohesive, modular monolith (FastAPI backend + embedded ML inference pipeline) paired with a modern React SPA. This avoids premature microservice decomposition, minimizes latency, eliminates distributed transaction overhead, and provides an ideal velocity for both rapid milestone delivery and long-term production maintainability.
2. **Deterministic ML Boundary:**  
   Machine learning inference is treated as a deterministic, versioned service within the backend runtime. Model artifacts are compiled, evaluated, and serialized independently via Scikit-learn, then loaded into memory upon server startup. Predictions are validated against strict feature schemas and never mocked or hardcoded.
3. **Zero-Fabrication & Honest Degradation:**  
   If an external dependency (such as the weather API) fails or input data is outside valid agricultural thresholds, the system degrades gracefully into explicit manual-entry modes rather than producing synthetic or hallucinated metrics.
4. **Frictionless Farmer Access vs. Protected Commercial Operations:**  
   In compliance with PRD.md, agricultural intelligence (crop recommendations, agronomic guidance, weather intelligence, and economic estimators) is strictly stateless and unauthenticated. Conversely, marketplace operations (merchant catalog management, stock updates, and admin listing reviews) are strictly protected by cryptographic authentication and role-based access control.
5. **Decoupled Presentation & Defensive Server Validation:**  
   The React frontend provides responsive, mobile-first interactivity and instant client-side validation hints. However, the FastAPI backend defensively validates all constraints using typed Pydantic models, treating the client as untrusted.

### 1.2 Application Components & Boundary Matrix

```
+----------------------------------------------------------------------------------------------------+
|                                    APPLICATION SYSTEM BOUNDARIES                                   |
+---------------------+-------------------------------+----------------------------------------------+
| Component           | Responsibility                | Boundaries & Constraints                     |
+---------------------+-------------------------------+----------------------------------------------+
| React SPA (Vite)    | User Interface, Client Form   | - Browser runtime only.                      |
|                     | Validation, State Management, | - Talks exclusively to FastAPI over HTTPS.   |
|                     | Responsive Presentation       | - Zero database or raw ML model access.      |
+---------------------+-------------------------------+----------------------------------------------+
| FastAPI Gateway &   | Routing, Pydantic Schema      | - Server runtime (Python 3.10+).             |
| App Services        | Validation, JWT Auth, Domain  | - Orchestrates ML, DB, and Weather.          |
|                     | Business Logic, Error Normal. | - Thin controllers, rich service layers.     |
+---------------------+-------------------------------+----------------------------------------------+
| ML Inference Engine | Model Artifact Loading,       | - Embedded in backend runtime.               |
| (`ml-service`)      | Feature Matrix Construction,  | - Loads serialized joblib artifact.          |
|                     | Probability & Rank Generation | - Pure function inference: inputs -> output. |
+---------------------+-------------------------------+----------------------------------------------+
| PostgreSQL Database | Persistent Records for Users, | - Managed PostgreSQL 15+.                    |
|                     | Stores, Products, and Audits  | - Accessed via async SQLAlchemy / asyncpg.   |
|                     |                               | - Stateless predictions bypass DB writes.    |
+---------------------+-------------------------------+----------------------------------------------+
| External Weather    | Meteorological Ingestion,     | - Third-party HTTPS REST API (Open-Meteo).   |
| Service             | 5-Day Agricultural Forecasts  | - Backend cached with 30-min TTL.            |
|                     |                               | - Decoupled with client manual fallback.     |
+---------------------+-------------------------------+----------------------------------------------+
```

### 1.3 MVP Architecture vs. Future Scaling Strategy

- **Phase 1 MVP:** Single FastAPI instance embedding the Scikit-learn Random Forest model via `joblib`, running alongside a managed PostgreSQL database, serving the static React frontend deployed on Vercel.
- **Future Production Scaling (Post-MVP):** If daily prediction volume exceeds 500,000 requests, the ML inference engine can be extracted into an asynchronous Triton / TorchServe microservice, and Open-Meteo API caching can be migrated from in-memory TTL to Redis.

---

## 2. High-Level System Architecture

The following diagram illustrates the complete runtime architecture, detailing interaction flows between the farmer, merchant, administrator, application services, ML pipeline, and data stores.

```mermaid
flowchart TD
    %% Actors
    Farmer["Farmer / Guest User<br>(Mobile / Tablet / Desktop)"]
    Merchant["Registered Shopkeeper<br>(Desktop / Mobile Web)"]
    Admin["System Administrator<br>(Backoffice Portal)"]

    %% Client Layer
    subgraph ClientLayer ["Frontend Layer (React 19 + Vite - Vercel)"]
        SPA["React SPA<br>(Pages, Components, Contexts)"]
        ClientStorage["SessionStorage<br>(Form Input Preservation)"]
        SPA <--> ClientStorage
    end

    %% Network Boundary
    Farmer -->|"HTTPS (Unauthenticated)"| SPA
    Merchant -->|"HTTPS (Credentials / JWT)"| SPA
    Admin -->|"HTTPS (Admin JWT)"| SPA

    %% API Gateway Layer
    subgraph BackendLayer ["Backend Layer (FastAPI - Render)"]
        APIGateway["FastAPI HTTP Router & Middleware<br>(CORS, Logging, Error Handler)"]
        AuthService["Auth & RBAC Service<br>(JWT Issuance & Verification)"]
        ValidationLayer["Pydantic Schema Validation<br>(Soil, Climate, Product Schemas)"]
        
        %% Domain Services
        subgraph DomainServices ["Application Services"]
            MLService["ML Inference Service<br>(Singleton Model Runner)"]
            AdvisoryService["Agronomic Advisory Service<br>(Seed & NPK Soil Logic)"]
            WeatherService["Weather Proxy Service<br>(Open-Meteo Client + Cache)"]
            EconomicsService["Farm Economics Service<br>(Cost & Profit Sensitivity)"]
            MarketService["Marketplace Service<br>(Catalog & Inventory Engine)"]
        end
    end

    SPA -->|"REST Calls (/api/v1/*)"| APIGateway
    APIGateway --> AuthService
    APIGateway --> ValidationLayer
    ValidationLayer --> MLService
    ValidationLayer --> AdvisoryService
    ValidationLayer --> WeatherService
    ValidationLayer --> EconomicsService
    ValidationLayer --> MarketService

    %% Machine Learning Subsystem
    subgraph MLSubsystem ["Machine Learning Artifacts (ml-service/)"]
        ModelArtifact[("Trained Model Artifact<br>crop_recommendation_model.joblib")]
        MetadataJSON["Model Metadata<br>model_metadata.json"]
        MLService -->|"Loads on Startup (Lifespan)"| ModelArtifact
        MLService -->|"Reads Schema & Features"| MetadataJSON
    end

    %% Persistence Layer
    subgraph DataLayer ["Persistence Layer (Managed PostgreSQL)"]
        DB[(PostgreSQL 15+ Database)]
        UsersTable["users (Merchants & Admins)"]
        ProductsTable["products (Marketplace Catalog)"]
        AuditTable["admin_audit_logs"]
        DB --- UsersTable
        DB --- ProductsTable
        DB --- AuditTable
        MarketService <-->|"SQLAlchemy 2.0 (asyncpg)"| DB
        AuthService <-->|"SQLAlchemy 2.0 (asyncpg)"| DB
    end

    %% External Services Layer
    subgraph ExternalServices ["External Services"]
        OpenMeteo["Open-Meteo Weather API<br>(Live Meteorological Observations)"]
        WeatherService -->|"HTTPS GET (30-min Cache)"| OpenMeteo
    end

    %% Styling & Boundaries
    classDef existing fill:#1c5234,stroke:#22c55e,stroke-width:2px,color:#fff;
    classDef planned fill:#0f291b,stroke:#a4c2b0,stroke-width:1px,color:#fff;
    classDef external fill:#082436,stroke:#38bdf8,stroke-width:1px,color:#fff;

    class SPA existing;
    class APIGateway,AuthService,ValidationLayer,MLService,AdvisoryService,WeatherService,EconomicsService,MarketService planned;
    class ModelArtifact,MetadataJSON planned;
    class DB,UsersTable,ProductsTable,AuditTable planned;
    class OpenMeteo external;
```

---

## 3. Frontend Architecture

### 3.1 Responsibilities & Technology Stack
- **Framework:** React 19 with Vite 8.
- **Styling:** CSS Custom Properties and modular BEM-style responsive CSS adhering strictly to [`DESIGN.md`](file:///c:/Users/Balram/Desktop/recommendation/DESIGN.md).
- **Core Mission:** Provide an accessible, zero-friction interface for farmers in rural mobile environments, ensuring instant input feedback, clear visual hierarchy, and offline-resilient state preservation.

### 3.2 Directory and Component Structure (`frontend/src/`)
```
frontend/src/
├── api/                   # Typed API client wrappers
│   ├── client.js          # Base fetch instance with interceptors & error handlers
│   ├── recommendation.js  # Crop prediction endpoints
│   ├── advisory.js        # Seed and fertilizer guidance endpoints
│   ├── weather.js         # Weather endpoints & manual fallback triggers
│   ├── economics.js       # Cost & profit calculation endpoints
│   └── marketplace.js     # Public product & merchant catalog endpoints
├── assets/                # Static brand images, crop photography, svg icons
│   ├── crops/             # Authentic photos for 22 crops (rice.webp, cotton.webp, etc.)
│   └── icons/             # Custom agricultural SVG symbols
├── components/            # Reusable design system UI components
│   ├── common/            # Button, Card, Badge, Modal, SkeletonLoader, DisclaimerBanner
│   ├── forms/             # NumericInput, RangeSlider, PresetsBar, StepControls
│   ├── layout/            # TopHeader, MobileNavBar, Footer, Breadcrumbs
│   ├── recommendation/    # RecommendationForm, ResultBanner, AlternativeCard, SuitabilityChart
│   ├── weather/           # WeatherWidget, ForecastCard, AlertNotice
│   ├── economics/         # ExpenseTable, ProfitSummaryCard, SensitivitySlider
│   └── marketplace/       # ProductCard, CategoryPills, StockBadge, MerchantContactModal
├── context/               # Lightweight React contexts (Theme, AuthContext, ToastContext)
├── hooks/                 # Custom React hooks
│   ├── useSessionStorage.js # Persists form state across refreshes
│   ├── useWeather.js      # Weather query with location auto-detect
│   └── usePrediction.js   # Encapsulates recommendation dispatch & loading states
├── pages/                 # Top-level screen components
│   ├── HomePage.jsx
│   ├── RecommendationPage.jsx
│   ├── AdvisoryPage.jsx
│   ├── WeatherPage.jsx
│   ├── EconomicsPage.jsx
│   ├── MarketplacePage.jsx
│   ├── MerchantLoginPage.jsx
│   └── MerchantDashboardPage.jsx
├── utils/                 # Unit conversions (Acres <-> Hectares), formatters (INR ₹)
├── App.jsx                # Route orchestration & application shell
├── main.jsx               # React DOM root entry point
└── index.css              # Global tokens, resets, typography, and theme definitions
```

### 3.3 State Management & Form Handling Approach
To maintain minimal bundle size ($\le 300\text{ KB}$) and avoid unnecessary third-party dependencies:
- **No Heavy Global Stores:** Redux, MobX, or Zustand are explicitly omitted.
- **Local Component State + Session Storage:** Soil inputs ($N, P, K, pH$) and climate metrics are held in component state, synchronized with `window.sessionStorage` via `useSessionStorage`. A farmer refreshing the browser or switching tabs never loses entered data.
- **Client Validation:** Instant boundaries validation on `onBlur` and `onChange` using mathematical limits defined in `PRD.md`. The "Run AI Recommendation" CTA is conditionally disabled until all 7 inputs satisfy physical limits.

---

## 4. Backend Architecture

### 4.1 Responsibilities & Technology Stack
- **Framework:** Python 3.10+ with FastAPI.
- **Server:** Uvicorn ASGI server with production Gunicorn worker process management.
- **Validation Engine:** Pydantic v2 schemas for strict serialization and deserialization.
- **Design Pattern:** Layered Service Architecture with thin route controllers, dedicated domain service classes, and isolated data access repositories.

### 4.2 Module Organization (`backend/app/`)
```
backend/app/
├── api/
│   ├── v1/
│   │   ├── endpoints/
│   │   │   ├── recommendation.py # /api/v1/recommendation/predict
│   │   │   ├── advisory.py       # /api/v1/advisory/*
│   │   │   ├── weather.py        # /api/v1/weather/*
│   │   │   ├── economics.py      # /api/v1/economics/*
│   │   │   ├── marketplace.py    # /api/v1/marketplace/products (public)
│   │   │   ├── merchant.py       # /api/v1/merchant/* (protected)
│   │   │   └── admin.py          # /api/v1/admin/* (protected)
│   │   └── router.py             # Assembles all v1 sub-routers
│   └── deps.py                   # Dependency injection (DB session, current user)
├── core/
│   ├── config.py                 # Pydantic BaseSettings for environment variables
│   ├── security.py               # Password hashing (bcrypt) & JWT token handlers
│   ├── exceptions.py             # Custom domain exceptions
│   └── logging.py                # Structured JSON logging setup
├── database/
│   ├── session.py                # Async engine & sessionmaker config
│   └── base.py                   # Declarative base & table metadata
├── models/                       # SQLAlchemy 2.0 ORM database entities
│   ├── user.py                   # Merchant and Admin accounts
│   ├── product.py                # Marketplace catalog listings
│   └── audit.py                  # Admin approval / rejection logs
├── schemas/                      # Pydantic validation schemas
│   ├── recommendation.py         # Prediction request & response schemas
│   ├── advisory.py               # Seed & fertilizer guidance schemas
│   ├── weather.py                # Normalized weather schemas
│   ├── economics.py              # Cost and profit request/response schemas
│   ├── product.py                # Product create/update/read schemas
│   └── user.py                   # Auth token & user schemas
├── services/                     # Pure business & domain logic
│   ├── ml_service.py             # Model loading, input matrix transformation, inference
│   ├── advisory_service.py       # Agronomic NPK calculations & seed catalog
│   ├── weather_service.py        # Open-Meteo HTTP client with 30-min in-memory cache
│   ├── economics_service.py      # Parametric cost, revenue, and sensitivity math
│   └── marketplace_service.py    # Catalog queries, stock adjustments, admin approvals
└── main.py                       # FastAPI application factory, middleware, lifespan hooks
```

### 4.3 Lifespan Management & Health Checks
- **Startup Lifespan Event:**
  - Reads `ML_MODEL_PATH` from settings.
  - Loads the Scikit-learn `.joblib` model into memory as a singleton attribute inside `MLService`.
  - Verifies presence of `model_metadata.json` and asserts feature parity.
  - Tests database connectivity with an asynchronous `SELECT 1` query.
- **Health Endpoints:**
  - `GET /health`: Liveness probe returning `{"status": "alive"}` (HTTP 200).
  - `GET /health/ready`: Readiness probe verifying that both the ML model is loaded in memory and the PostgreSQL database pool is active.

---

## 5. Machine Learning Architecture

### 5.1 End-to-End Crop Recommendation Lifecycle

```
[1. Dataset Sourcing: Crop_recommendation.csv (2200 rows, 22 classes)]
                              │
                              ▼
[2. Data Inspection & Cleaning: Check NaNs, Outliers, Feature Types]
                              │
                              ▼
[3. Feature Validation: N(0-140), P(5-145), K(5-205), pH(3.5-9.5), etc.]
                              │
                              ▼
[4. Preprocessing: Standardize/Verify Scale, Stratified Train/Val/Test Split (80/20)]
                              │
                              ▼
[5. Model Comparison: Decision Tree vs. Random Forest vs. XGBoost (Conditional)]
                              │
                              ▼
[6. Evaluation: Multi-Class Accuracy >= 95%, Precision/Recall/F1, Confusion Matrix]
                              │
                              ▼
[7. Persistence: joblib.dump(model) -> ml-service/models/crop_recommendation_model.joblib]
                              │
                              ▼
[8. Metadata Registry: Save feature order, training metrics, git commit hash in JSON]
                              │
                              ▼
[9. FastAPI Startup: Lifespan loads joblib artifact into RAM as singleton]
                              │
                              ▼
[10. Inference Request: Pydantic validates payload -> DataFrame with strict feature order]
                              │
                              ▼
[11. Prediction: model.predict_proba() -> Top-1 Recommendation + Top-2 Alternatives]
                              │
                              ▼
[12. Response Formatting: Validated JSON with Confidence % + Agronomic Disclaimer]
```

### 5.2 Feature Schema & Invariance Guarantees
The model requires exactly 7 input features in strict sequence:
1. `N` (Nitrogen ratio in soil, $kg/ha$)
2. `P` (Phosphorus ratio in soil, $kg/ha$)
3. `K` (Potassium ratio in soil, $kg/ha$)
4. `temperature` (Ambient temperature, $^\circ\text{C}$)
5. `humidity` (Relative ambient humidity, $\%$)
6. `ph` (Soil pH value, $0-14$ scale)
7. `rainfall` (Rainfall precipitation, $mm$)

**Feature Consistency Guarantee:**  
To prevent feature permutation errors between training and inference:
- The training script saves `feature_names: ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]` into `model_metadata.json`.
- At inference time, `ml_service.py` reads `feature_names` from metadata and enforces column order when constructing the Pandas DataFrame before passing it to `model.predict_proba()`.

### 5.3 Model Selection & Evaluation Criteria
- **Baseline Candidate:** `DecisionTreeClassifier` (Fast, interpretable, prone to variance).
- **Primary Production Candidate:** `RandomForestClassifier` (Ensemble bagging, high generalization, robust to noise, optimal for 2,200 records).
- **Conditional Candidate:** `XGBoostClassifier` (Only deployed if Random Forest achieves $< 95\%$ test accuracy or exhibits high inference latency; otherwise avoided to reduce runtime container size).
- **Minimum Exit Criteria:** Stratified test accuracy $\ge 95.0\%$, macro F1-score $\ge 0.94$, and zero degenerate classes.

### 5.4 Prediction Response Contract
The prediction endpoint returns a structured response:
```json
{
  "status": "success",
  "data": {
    "primary_recommendation": {
      "crop": "rice",
      "confidence_score": 94.2,
      "botanical_name": "Oryza sativa",
      "season": "Kharif",
      "water_requirement": "High"
    },
    "alternative_recommendations": [
      {
        "crop": "jute",
        "confidence_score": 82.1,
        "botanical_name": "Corchorus olitorius"
      },
      {
        "crop": "maize",
        "confidence_score": 68.4,
        "botanical_name": "Zea mays"
      }
    ],
    "suitability_analysis": {
      "nitrogen_status": "Optimal",
      "phosphorus_status": "Optimal",
      "potassium_status": "Optimal",
      "ph_status": "Optimal",
      "climate_match": "High"
    },
    "disclaimer": "Predictions are probabilistic agricultural guidance generated by machine learning. They do not constitute a harvest guarantee or crop insurance."
  }
}
```

---

## 6. Database Architecture

### 6.1 PostgreSQL Responsibilities
PostgreSQL 15+ is used exclusively for persistent application state:
- User accounts (registered shopkeepers and system administrators).
- Merchant store profiles (store name, commercial license, address, contact phone).
- Agricultural product catalog (title, brand, category, price, stock, approval status).
- Administrative audit logs (timestamped approvals/rejections with justification notes).

*Note:* Crop recommendation predictions, weather lookups, and financial estimates are **stateless** and do not write to the database during guest farmer workflows, preserving maximum read performance and privacy.

### 6.2 Data Access Layer & Connection Pool
- **ORM / Toolkit:** SQLAlchemy 2.0 using the asynchronous `AsyncSession` API.
- **Database Driver:** `asyncpg` for non-blocking I/O.
- **Connection Pooling:**
  - `pool_size`: 10 persistent connections.
  - `max_overflow`: 20 burst connections.
  - `pool_timeout`: 30 seconds.
  - `pool_pre_ping`: `True` (Discards stale connections automatically).
- **Session Lifecycle:** Managed via FastAPI dependency injection:
  ```python
  async def get_db() -> AsyncGenerator[AsyncSession, None]:
      async with AsyncSessionLocal() as session:
          try:
              yield session
              await session.commit()
          except Exception:
              await session.rollback()
              raise
  ```

### 6.3 Schema Migrations & Indexing Principles
- **Migration Engine:** Alembic (`backend/alembic/`).
- **Core Indexing Strategies:**
  - `users(email)`: Unique B-tree index.
  - `products(shopkeeper_id)`: Foreign key B-tree index.
  - `products(category, is_active, approval_status)`: Composite index for fast public marketplace catalog filtering.
  - `products(title)`: Trigram / full-text search index for keyword lookups.

---

## 7. API Architecture

### 7.1 REST Conventions & Grouping
All endpoints are versioned under `/api/v1/`. The API follows standard REST principles using nouns for resources and appropriate HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).

```
+------------------------------------------------------------------------------------+
|                               API ROUTE REGISTRY                                   |
+------------------------------------------------------------------------------------+
| METHOD | ROUTE                                | AUTH LEVEL  | PURPOSE              |
+--------+--------------------------------------+-------------+----------------------+
| POST   | /api/v1/recommendation/predict       | Public      | Crop ML Inference    |
| GET    | /api/v1/advisory/seed/{crop}         | Public      | Seed Cultivar Info   |
| POST   | /api/v1/advisory/fertilizer          | Public      | NPK Soil Balance     |
| GET    | /api/v1/weather/current              | Public      | Live Weather & Alert |
| GET    | /api/v1/weather/forecast             | Public      | 5-Day Forecast       |
| POST   | /api/v1/economics/estimate           | Public      | Cost & Profit Model  |
| GET    | /api/v1/marketplace/products         | Public      | Approved Catalog     |
| GET    | /api/v1/marketplace/products/{id}    | Public      | Single Product View  |
| POST   | /api/v1/merchant/register            | Public      | Merchant Account Req |
| POST   | /api/v1/merchant/login               | Public      | JWT Token Issuance   |
| GET    | /api/v1/merchant/products            | Merchant    | Own Catalog List     |
| POST   | /api/v1/merchant/products            | Merchant    | Create Product Draft |
| PUT    | /api/v1/merchant/products/{id}       | Merchant    | Update Owned Product |
| DELETE | /api/v1/merchant/products/{id}       | Merchant    | Archive Product      |
| POST   | /api/v1/admin/products/{id}/approve  | Admin       | Approve Listing      |
| POST   | /api/v1/admin/products/{id}/reject   | Admin       | Reject with Feedback |
| GET    | /health                              | Public      | Liveness Check       |
| GET    | /health/ready                        | Public      | Readiness Check      |
+------------------------------------------------------------------------------------+
```

### 7.2 Standard Error Response Shape
All error responses adhere to a consistent JSON structure:
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Input parameter failed boundary constraints.",
  "details": [
    {
      "field": "nitrogen",
      "issue": "Nitrogen value 350.0 exceeds maximum physical limit of 140.0 kg/ha"
    }
  ],
  "timestamp": "2026-10-27T23:15:00Z"
}
```

---

## 8. External Integrations

### 8.1 Open-Meteo Meteorological Service
- **Type:** Public REST API (`https://api.open-meteo.com/v1/forecast`).
- **Integration Boundary:** Handled strictly server-side by `WeatherService` via `httpx.AsyncClient`.
- **Caching Strategy:** Responses for a given latitude/longitude coordinate pair (rounded to 2 decimal places) are cached in memory with a **30-minute Time-To-Live (TTL)**.
- **Failure Handling:** Timeout configured at $3.0\text{ seconds}$. If the remote service fails, times out, or returns HTTP 5xx, the backend responds with HTTP 200 containing a structured fallback:
  ```json
  {
    "status": "partial",
    "weather_available": false,
    "message": "Real-time weather station currently unreachable. Please enter manual temperature and rainfall.",
    "data": null
  }
  ```
  The system never hallucinates or fabricates fake temperature, humidity, or precipitation data.

### 8.2 Managed PostgreSQL Provider
- **Provider:** Render Managed PostgreSQL / Supabase.
- **Connection Security:** Enforces TLS/SSL (`sslmode=require`).
- **Failover & Reconnect:** Handled transparently by `asyncpg` connection pool with pre-ping validation.

---

## 9. Security Architecture

### 9.1 Authentication & Authorization Matrix
- **Password Protection:** Passwords hashed with `bcrypt` using 12 salt rounds via `passlib`. Plaintext passwords are never logged or stored.
- **JWT Authorization:** Stateless Bearer tokens signed with `HS256` using `JWT_SECRET_KEY` loaded from environment variables. Tokens expire after 24 hours.
- **Role-Based Access Control (RBAC):**
  - `FARMER / GUEST`: Default access. No token required.
  - `SHOPKEEPER`: Token contains `sub: user_id`, `role: "shopkeeper"`.
  - `ADMIN`: Token contains `sub: user_id`, `role: "admin"`.
- **Resource Ownership Guard:** Shopkeepers cannot edit or delete products unless `product.shopkeeper_id == current_user.id`.

### 9.2 Mandatory Merchant Approval Policy
In accordance with user decisions and `DESIGN.md`:
- Newly created merchant listings default to status `PENDING_ADMIN_APPROVAL`.
- Products with status `PENDING_ADMIN_APPROVAL` or `REJECTED` are strictly filtered out of the public `/api/v1/marketplace/products` queries.
- Only users with the `ADMIN` role can execute `/api/v1/admin/products/{id}/approve`.

### 9.3 Data Sanitization & CORS
- **CORS:** Whitelisted origins configured strictly via `CORS_ORIGINS` environment variable (e.g. `http://localhost:5173` in development; Vercel production domain in production). Wildcard `*` origins are strictly forbidden in production.
- **Injection Defenses:** Parameterized queries via SQLAlchemy prevent SQL injection. React’s JSX rendering engine automatically escapes string inputs, preventing Cross-Site Scripting (XSS).

---

## 10. Repository and Folder Structure

### 10.1 Existing Repository Inspection
Inspection of `C:\Users\Balram\Desktop\recommendation` confirms the current state:
- Root files present: [`PRD.md`](file:///c:/Users/Balram/Desktop/recommendation/PRD.md), [`DESIGN.md`](file:///c:/Users/Balram/Desktop/recommendation/DESIGN.md).
- Directory scaffolds present:
  - `backend/`: Scaffold directories (`app/api`, `app/core`, `app/database`, `app/schemas`, `app/services`, `tests`), currently without application code.
  - `datasets/`: Empty domain directories (`crop-recommendation`, `fertilizers`, `seeds`, `shops`, `soil`, `weather`).
  - `ml-service/`: Empty pipeline directories (`data/processed`, `data/raw`, `models`, `notebooks`, `src`).
  - `docs/`: Empty.
  - `frontend/`: Standard Vite + React 19 boilerplate (`package.json`, `vite.config.js`, `src/App.jsx`, etc.).

### 10.2 Proposed Target Repository Layout
The project will be organized cleanly into self-contained modules without altering the top-level structure:

```
C:\Users\Balram\Desktop\recommendation\
├── PRD.md                             # Product Requirements Document
├── DESIGN.md                          # Visual Design System & UX Specification
├── ARCHITECTURE.md                    # Technical Architecture Specification (This Document)
├── DATABASE.md                        # Database Schema & Migration Specification (Future)
├── API.md                             # API Contract Specification (Future)
│
├── datasets/                          # Agricultural raw and reference data
│   └── crop-recommendation/
│       ├── Crop_recommendation.csv    # Real 2,200-row agricultural benchmark dataset
│       └── crop_guidance.json         # Verified seed, NPK, and cost reference baselines
│
├── ml-service/                        # Isolated ML training & evaluation pipeline
│   ├── models/
│   │   ├── crop_recommendation_model.joblib # Serialized production model artifact
│   │   └── model_metadata.json        # Feature order, accuracy, and training metrics
│   ├── notebooks/                     # Exploratory analysis and evaluation notebooks
│   └── src/
│       ├── dataset.py                 # Data loading and boundary validation
│       ├── evaluate.py                # Metrics generation (F1, Confusion Matrix)
│       └── train.py                   # Model training and artifact serialization
│
├── backend/                           # FastAPI REST application
│   ├── app/
│   │   ├── api/v1/endpoints/          # Route controllers (recommendation, weather, market)
│   │   ├── core/                      # Config, security, exceptions, logging
│   │   ├── database/                  # SQLAlchemy async session setup
│   │   ├── models/                    # ORM entities (User, Product, AuditLog)
│   │   ├── schemas/                   # Pydantic request/response validation
│   │   ├── services/                  # Business logic (ML runner, Weather proxy, Marketplace)
│   │   └── main.py                    # Application entrypoint & middleware setup
│   ├── alembic/                       # Database schema migrations
│   ├── tests/                         # Pytest test suites (unit, integration, ML tests)
│   ├── requirements.txt               # Backend Python dependencies
│   └── Dockerfile                     # Container definition for Render deployment
│
└── frontend/                          # React + Vite application
    ├── public/
    │   ├── assets/crops/              # Authentic photography for 22 crops
    │   └── favicon.svg
    ├── src/
    │   ├── api/                       # Modular API clients (recommendation, weather, market)
    │   ├── components/                # Reusable UI components conforming to DESIGN.md
    │   ├── hooks/                     # Custom React hooks (session storage, weather query)
    │   ├── pages/                     # Full-screen view pages
    │   ├── utils/                     # Formatting and conversion utilities
    │   ├── App.jsx                    # Routing & global navigation shell
    │   ├── index.css                  # Global design tokens and responsive CSS
    │   └── main.jsx
    ├── package.json                   # Frontend dependencies
    └── vite.config.js                 # Vite build & proxy configuration
```

---

## 11. Configuration and Environment

### 11.1 Configuration Management Strategy
Configuration values are loaded using `pydantic-settings` from environment variables, validating presence and typing at process startup. Secrets are never hardcoded or committed to source control.

### 11.2 Backend Environment Variables (`backend/.env`)
```ini
# Application Environment
ENVIRONMENT=development               # development | staging | production
DEBUG=False
LOG_LEVEL=INFO

# Server & Network
PORT=8000
CORS_ORIGINS=["http://localhost:5173","https://agrogenius-ai.vercel.app"]

# PostgreSQL Database Connection
DATABASE_URL=postgresql+asyncpg://postgres:secret@localhost:5432/agrogenius_db

# Cryptography & Authentication
JWT_SECRET_KEY=generate_high_entropy_256_bit_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440       # 24 Hours

# Machine Learning Artifacts
ML_MODEL_PATH=../ml-service/models/crop_recommendation_model.joblib
ML_METADATA_PATH=../ml-service/models/model_metadata.json

# External Meteorological Services
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
WEATHER_CACHE_TTL_SECONDS=1800        # 30 Minutes
```

### 11.3 Frontend Environment Variables (`frontend/.env.development` / `.env.production`)
```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
*Rule:* Only variables prefixed with `VITE_` are bundled into client assets. Server credentials must never appear in frontend configuration.

---

## 12. Error Handling and Observability

### 12.1 Error Handling Strategy
The backend implements a centralized error handler catching both anticipated domain exceptions and unhandled system faults:
- **`ValidationError` (HTTP 422):** Returns specific field-level validation errors.
- **`ModelNotLoadedException` (HTTP 503):** Returns a service-unavailable alert if the ML model file is missing or corrupt.
- **`WeatherServiceException` (HTTP 200 with fallback flag):** Caught gracefully; permits continued crop recommendation without meteorological data.
- **`UnauthorizedException` (HTTP 401 / 403):** Returns clear authentication requirements without leaking system internals.
- **Unhandled 500 Errors:** Logs the internal traceback privately while returning a sanitized generic error to the client: `"An internal server error occurred. Please try again later."`

### 12.2 Structured Logging & Observability
- Python’s standard `logging` library is configured to emit JSON-formatted logs containing: timestamp, log level, request ID, endpoint path, response status, and latency.
- Passwords, authorization tokens, and personal contact details are scrubbed from log outputs prior to emission.

---

## 13. Testing Strategy

```
+------------------------------------------------------------------------------------+
|                               TESTING MATRIX                                       |
+------------------------------------------------------------------------------------+
| TEST LEVEL          | TARGET MODULE               | TOOL       | SCOPE             |
+---------------------+-----------------------------+------------+-------------------+
| Unit (ML Pipeline)  | ml-service/src/dataset.py   | pytest     | Feature bounds &  |
|                     | ml-service/src/train.py     |            | train-test split  |
+---------------------+-----------------------------+------------+-------------------+
| Unit (Model Eval)   | ml-service/src/evaluate.py  | pytest     | Accuracy >= 95%   |
|                     |                             |            | & confusion matrix|
+---------------------+-----------------------------+------------+-------------------+
| Unit (Schemas)      | backend/app/schemas/*       | pytest     | Pydantic boundary |
|                     |                             |            | validation checks |
+---------------------+-----------------------------+------------+-------------------+
| Integration (API)   | backend/app/api/v1/*        | pytest +   | Endpoint contracts|
|                     |                             | httpx      | & error codes     |
+---------------------+-----------------------------+------------+-------------------+
| Integration (Auth)  | backend/app/services/auth   | pytest     | JWT generation &  |
|                     |                             |            | RBAC guards       |
+---------------------+-----------------------------+------------+-------------------+
| Integration (ML Run)| backend/app/services/ml     | pytest     | Model loading &   |
|                     |                             |            | predict_proba()   |
+---------------------+-----------------------------+------------+-------------------+
| E2E (Crop Recom.)   | Frontend -> Backend Flow    | Vitest /   | Form fill -> API  |
|                     |                             | Playwright | -> Output cards   |
+------------------------------------------------------------------------------------+
```

### 13.1 Testing Without Production Credentials
- **Mocking External APIs:** Open-Meteo HTTP calls are mocked in tests using `pytest-mock` or `respx` returning representative JSON fixtures.
- **In-Memory SQLite for DB Tests:** Database integration tests utilize SQLite (`sqlite+aiosqlite:///:memory:`) to verify queries without requiring a live PostgreSQL instance.

---

## 14. Deployment Architecture

### 14.1 Deployment Topology

```
+------------------------------------------------------------------------------------+
|                               DEPLOYMENT TOPOLOGY                                  |
+------------------------------------------------------------------------------------+
|                                                                                    |
|   [ CLIENT BROWSER ]                                                               |
|          │                                                                         |
|          │ HTTPS (Port 443)                                                        |
|          ▼                                                                         |
|   ┌────────────────────────────────┐                                               |
|   │     VERCEL EDGE CDN            │                                               |
|   │     Frontend React SPA         │                                               |
|   │     (Static HTML/CSS/JS Assets)│                                               |
|   └────────────────────────────────┘                                               |
|          │                                                                         |
|          │ REST API Calls over HTTPS                                               |
|          ▼                                                                         |
|   ┌────────────────────────────────┐       HTTPS       ┌────────────────────────┐  |
|   │     RENDER WEB SERVICE         │ ────────────────> │    OPEN-METEO API      │  |
|   │     FastAPI + Uvicorn          │                   │    (Weather Data)      │  |
|   │     Loaded ML Model in RAM     │                   └────────────────────────┘  |
|   └────────────────────────────────┘                                               |
|          │                                                                         |
|          │ TLS Connection (Port 5432)                                              |
|          ▼                                                                         |
|   ┌────────────────────────────────┐                                               |
|   │     RENDER MANAGED POSTGRESQL  │                                               |
|   │     Database Engine (v15+)     │                                               |
|   └────────────────────────────────┘                                               |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

### 14.2 Deployment Constraints & Resource Sizing
- **Backend Memory Budget:** The Scikit-learn Random Forest model occupies approximately $15 - 25\text{ MB}$ of memory when deserialized. The entire FastAPI process baseline memory footprint is $\sim 120\text{ MB}$, well within Render's 512 MB Free/Starter tier limits.
- **Model Artifact Shipping:** The serialized model artifact (`crop_recommendation_model.joblib`) is committed to git or packaged during container build to ensure immediate availability upon startup without external S3/storage dependencies.
- **Continuous Deployment:** Git-triggered builds on Vercel (frontend) and Render (backend).

---

## 15. Architecture Decisions, Risks & Mitigations

### 15.1 Architecture Decision Records (ADRs)

| ADR ID | Decision Summary | Rationale & Alternatives Considered | Status |
| :--- | :--- | :--- | :--- |
| **ADR-01** | In-Process Embedded ML Inference | Load the Scikit-learn model artifact directly into FastAPI memory via `joblib`. *Alternative considered:* Dedicated Triton/Flask ML microservice. *Reasoning:* Embedded inference eliminates network hops, simplifies hackathon/MVP deployment, and provides sub-10ms inference. | **Approved** |
| **ADR-02** | Stateless Guest Recommendation | Crop prediction, guidance, and calculations do not write to PostgreSQL for guest farmers. *Alternative:* Require user accounts for all actions. *Reasoning:* Removes all friction for rural farmers, ensures instant time-to-value, and protects user privacy. | **Approved** |
| **ADR-03** | Open-Meteo with 30-min Cache & Manual Fallback | Use Open-Meteo for weather with backend caching and graceful manual fallback. *Alternative:* OpenWeatherMap. *Reasoning:* Open-Meteo requires no API key, has no restrictive rate limits, and caching prevents upstream overload. | **Approved** |
| **ADR-04** | Admin Approval Gate for Marketplace | Merchant listings default to `PENDING_APPROVAL` and require admin review before public visibility. *Alternative:* Immediate activation with badge. *Reasoning:* Enforces strict quality control and protects farmers against counterfeit products. | **Approved** |
| **ADR-05** | Single Managed PostgreSQL Database | Store users and products in PostgreSQL via async SQLAlchemy. *Alternative:* MongoDB or SQLite. *Reasoning:* Relational integrity is essential for marketplace inventory, accounts, and audit logging. | **Approved** |

### 15.2 Risks & Mitigations

| Risk Description | Severity | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Model Drift / Out-of-Distribution Inputs** | High | Inaccurate crop recommendations if extreme weather or soil values are supplied. | Strict client and server boundary validation; explicit model confidence percentages; prominent agronomic disclaimers. |
| **Weather API Outage / Latency Spike** | Medium | User unable to get automatic environmental data. | 3.0-second timeout on weather calls; automatic graceful degradation to manual temperature/rainfall entry fields. |
| **Startup Memory Exhaustion on Free Tier** | Medium | Backend container crashes during `joblib.load()`. | Model pruning (`max_depth`, `n_estimators=100`) ensures artifact remains $< 30\text{ MB}$; verified inside 512 MB RAM footprint. |
| **Unauthorized Product Listing Mutation** | High | Malicious merchants editing products of other vendors. | Strict database-level ownership check (`WHERE shopkeeper_id == current_user.id`) enforced in service layer. |

### 15.3 Deferred Features (Post-MVP)
1. **IoT Sensor Ingestion:** Telemetry streaming via MQTT/LoRaWAN.
2. **In-App Payment Gateway:** Razorpay / Stripe escrow processing.
3. **Satellite NDVI Raster Processing:** Sentinel-2 multispectral vegetation health analysis.
4. **Automated Drone Spraying Dispatch:** Hardware integration with aerial spraying APIs.

---
*End of Software Architecture Specification (ARCHITECTURE.md)*
