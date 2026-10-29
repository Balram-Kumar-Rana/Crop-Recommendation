# REST API Specification (API.md)
# AgroGenius AI: Smart Agriculture Platform

**Document Version:** 1.0.0  
**Status:** Approved Implementation-Ready API Contract  
**Protocol:** REST over HTTPS  
**Data Format:** JSON (`application/json`)  
**Author:** Senior Software Architect & Backend Engineer  

---

## 1. API Overview

### 1.1 Purpose
This document specifies the authoritative HTTP REST API contract for **AgroGenius AI**. The API serves as the communication bridge between the React single-page frontend (deployed on Vercel) and the Python FastAPI backend service (deployed on Render), orchestrating machine learning inference, rule-based agronomic guidance, real-time meteorological intelligence, and the agricultural marketplace.

### 1.2 Base URL Strategy
The API routes are uniformly organized under the `/api/v1` namespace. Base URLs are environment-configurable and must never be hardcoded into client code:
- **Local Development:** `http://localhost:8000/api/v1`
- **Staging / Production:** `https://<backend-host>.onrender.com/api/v1`
- **Frontend Configuration:** Configured via the `VITE_API_BASE_URL` environment variable.

### 1.3 Communication Conventions
- **Request & Response Body:** `application/json; charset=utf-8` (except file uploads if future multipart support is added).
- **Date & Time Standards:** ISO 8601 UTC format with explicit offset (`YYYY-MM-DDTHH:MM:SSZ`).
- **Currency Standard:** Indian Rupee (`INR`), formatted as floating-point decimals with 2 decimal places (`price: 1250.00`).
- **Measurement Standards:** Standard agronomic units ($kg/ha$, $pH$, $^\circ\text{C}$, $\%$, $mm$, $Acres$, $Hectares$, $Quintals$).
- **Pagination Standard:** Zero-indexed offset or 1-indexed page/size pagination: `page` (default: 1) and `page_size` (default: 12, max: 50).

---

## 2. Authentication and Authorization

### 2.1 Architectural Boundaries
In accordance with `PRD.md` and `ARCHITECTURE.md`:
1. **Frictionless Farmer Intelligence (Public / Unauthenticated):**  
   Executing ML crop recommendations, viewing seed and fertilizer advisories, inspecting weather forecasts, running economic estimations, and browsing approved marketplace products **require zero authentication**.
2. **Merchant Operations (Authenticated / Protected):**  
   Listing products, updating stock counts, and editing store profiles require a valid JSON Web Token (JWT) bearing `role: "shopkeeper"`.
3. **Administrative Governance (Authenticated / Protected):**  
   Approving or rejecting merchant catalog submissions requires a valid JWT bearing `role: "admin"`.

### 2.2 Token Transmission
Protected endpoints require an `Authorization` header containing an HTTP Bearer token:
```http
Authorization: Bearer <jwt_access_token>
```
Tokens are signed using HMAC-SHA256 (`HS256`) and expire 24 hours after issuance.

---

### 2.3 Endpoints

#### `POST /api/v1/auth/register`
Registers a new merchant user account along with their store profile.
- **Access Level:** Public
- **Request Body:**
```json
{
  "email": "kisan.kendra@example.com",
  "password": "StrongPassword123#",
  "business_name": "Kisan Seva Kendra",
  "license_number": "LIC-MH-AGR-2024-8891",
  "phone_number": "9876543210",
  "address_line": "Plot 14, APMC Market Yard",
  "city": "Nashik",
  "state": "Maharashtra",
  "pincode": "422003"
}
```
- **Response `201 Created`:**
```json
{
  "status": "success",
  "message": "Merchant account registered successfully.",
  "data": {
    "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "email": "kisan.kendra@example.com",
    "role": "shopkeeper",
    "business_name": "Kisan Seva Kendra",
    "created_at": "2026-10-27T18:30:00Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure on phone number or postal code.
  - `409 Conflict`: `{"status": "error", "code": "EMAIL_ALREADY_EXISTS", "message": "Email is already registered."}`

---

#### `POST /api/v1/auth/login`
Authenticates a merchant or administrator and returns an access token.
- **Access Level:** Public
- **Request Body:**
```json
{
  "email": "kisan.kendra@example.com",
  "password": "StrongPassword123#"
}
```
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in_seconds": 86400,
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "kisan.kendra@example.com",
      "role": "shopkeeper",
      "business_name": "Kisan Seva Kendra"
    }
  }
}
```
- **Error Response `401 Unauthorized`:**
```json
{
  "status": "error",
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password.",
  "timestamp": "2026-10-27T18:35:00Z"
}
```

---

#### `GET /api/v1/auth/me`
Retrieves the profile of the currently authenticated user.
- **Access Level:** Protected (`shopkeeper` or `admin`)
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "email": "kisan.kendra@example.com",
    "role": "shopkeeper",
    "is_active": true,
    "profile": {
      "id": "b1ffbc99-9c0b-4ef8-bb6d-7cc9bd380b22",
      "business_name": "Kisan Seva Kendra",
      "license_number": "LIC-MH-AGR-2024-8891",
      "phone_number": "9876543210",
      "address_line": "Plot 14, APMC Market Yard",
      "city": "Nashik",
      "state": "Maharashtra",
      "pincode": "422003"
    }
  }
}
```

---

## 3. Crop Recommendation ML API

### 3.1 Overview
The crop recommendation endpoint is the core AI/ML capability of AgroGenius AI. It loads the Scikit-learn Random Forest model trained on the agricultural benchmark dataset and computes probabilistic predictions based on 7 empirical soil and climatic parameters.

### 3.2 Endpoint Specification
- **Method & Path:** `POST /api/v1/recommendation/predict`
- **Access Level:** Public (No authentication required)
- **Rate Limit Target:** 60 requests per minute per IP.

### 3.3 Request Schema (`RecommendationRequest`)

| Field Name | Type | Unit | Range / Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `nitrogen` | `float` | $kg/ha$ | $0.0 \le N \le 140.0$ | Nitrogen content ratio in soil |
| `phosphorus` | `float` | $kg/ha$ | $5.0 \le P \le 145.0$ | Phosphorus content ratio in soil |
| `potassium` | `float` | $kg/ha$ | $5.0 \le K \le 205.0$ | Potassium content ratio in soil |
| `ph` | `float` | $pH\ scale$ | $3.5 \le pH \le 9.5$ | Soil acidity/alkalinity level |
| `temperature`| `float` | $^\circ\text{C}$ | $5.0 \le T \le 50.0$ | Ambient temperature |
| `humidity` | `float` | $\%$ | $10.0 \le H \le 100.0$ | Relative ambient humidity |
| `rainfall` | `float` | $mm$ | $20.0 \le R \le 350.0$ | Seasonal rainfall precipitation |

### 3.4 Request Example
```json
{
  "nitrogen": 80.0,
  "phosphorus": 40.0,
  "potassium": 40.0,
  "ph": 6.5,
  "temperature": 26.5,
  "humidity": 82.0,
  "rainfall": 182.5
}
```

### 3.5 Successful Response Example (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "primary_recommendation": {
      "crop": "rice",
      "common_name": "Rice",
      "botanical_name": "Oryza sativa",
      "confidence_score": 94.2,
      "season": "Kharif",
      "water_requirement": "High",
      "synthesis": "Your high rainfall (182.5mm) and optimal nitrogen balance provide an ideal growing envelope for wetland rice cultivation."
    },
    "alternative_recommendations": [
      {
        "crop": "jute",
        "common_name": "Jute",
        "botanical_name": "Corchorus olitorius",
        "confidence_score": 82.1,
        "differentiator": "Tolerates similar humidity but requires lower nitrogen inputs."
      },
      {
        "crop": "maize",
        "common_name": "Maize",
        "botanical_name": "Zea mays",
        "confidence_score": 68.4,
        "differentiator": "Viable alternative if seasonal rainfall decreases below 100mm."
      }
    ],
    "suitability_analysis": {
      "nitrogen": { "user_value": 80.0, "optimal_min": 60.0, "optimal_max": 100.0, "status": "OPTIMAL" },
      "phosphorus": { "user_value": 40.0, "optimal_min": 35.0, "optimal_max": 60.0, "status": "OPTIMAL" },
      "potassium": { "user_value": 40.0, "optimal_min": 35.0, "optimal_max": 50.0, "status": "OPTIMAL" },
      "ph": { "user_value": 6.5, "optimal_min": 5.5, "optimal_max": 7.2, "status": "OPTIMAL" },
      "temperature": { "user_value": 26.5, "optimal_min": 20.0, "optimal_max": 35.0, "status": "OPTIMAL" },
      "humidity": { "user_value": 82.0, "optimal_min": 70.0, "optimal_max": 90.0, "status": "OPTIMAL" },
      "rainfall": { "user_value": 182.5, "optimal_min": 150.0, "optimal_max": 250.0, "status": "OPTIMAL" }
    },
    "model_metadata": {
      "model_type": "RandomForestClassifier",
      "version": "1.0.0",
      "target_accuracy": ">=95.0%"
    },
    "disclaimer": "AgroGenius AI predictions are probabilistic decision-support tools based on machine learning and empirical soil data. They do not constitute guaranteed yields or harvest insurance."
  }
}
```

---

## 4. Soil and Crop Input Validation

### 4.1 Boundary Constraints Table

```
+--------------------+------------+------------+---------------+--------------------------------------+
| Field              | Min Value  | Max Value  | Native Unit   | Violation Error Code                 |
+--------------------+------------+------------+---------------+--------------------------------------+
| nitrogen           | 0.0        | 140.0      | kg/ha         | N_OUT_OF_RANGE                       |
| phosphorus         | 5.0        | 145.0      | kg/ha         | P_OUT_OF_RANGE                       |
| potassium          | 5.0        | 205.0      | kg/ha         | K_OUT_OF_RANGE                       |
| ph                 | 3.5        | 9.5        | pH scale      | PH_OUT_OF_RANGE                      |
| temperature        | 5.0        | 50.0       | °C            | TEMPERATURE_OUT_OF_RANGE             |
| humidity           | 10.0       | 100.0      | %             | HUMIDITY_OUT_OF_RANGE                |
| rainfall           | 20.0       | 350.0      | mm            | RAINFALL_OUT_OF_RANGE                |
+--------------------+------------+------------+---------------+--------------------------------------+
```

### 4.2 Validation Failure Response (`422 Unprocessable Entity`)
When a submitted payload violates type or boundary rules:
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Input parameter failed boundary constraints.",
  "details": [
    {
      "field": "nitrogen",
      "issue": "Value 250.0 exceeds maximum allowed limit of 140.0 kg/ha"
    },
    {
      "field": "ph",
      "issue": "Value 2.0 is below minimum allowed limit of 3.5"
    }
  ],
  "timestamp": "2026-10-27T18:40:00Z"
}
```

### 4.3 Missing Model Artifact Error (`503 Service Unavailable`)
If the serialized `.joblib` model file cannot be read from the filesystem:
```json
{
  "status": "error",
  "code": "MODEL_UNAVAILABLE",
  "message": "The machine learning prediction service is currently initializing or unavailable. Please retry shortly.",
  "timestamp": "2026-10-27T18:40:00Z"
}
```

---

## 5. Weather API Integration

### 5.1 Architecture & Policy
The weather service integrates strictly server-side with **Open-Meteo REST API**. 
- In-memory backend caching: **30-minute Time-To-Live (TTL)** per coordinate cluster.
- **Zero Fabrication:** If Open-Meteo fails or times out, the backend returns a structured unavailable state. The system never generates imaginary weather metrics.

### 5.2 Endpoints

#### `GET /api/v1/weather/current`
Fetches live and cached meteorological metrics for a specific coordinate pair.
- **Query Parameters:**
  - `latitude` (`float`, required, e.g. `20.00`)
  - `longitude` (`float`, required, e.g. `73.78`)
- **Response `200 OK` (Live Data Available):**
```json
{
  "status": "success",
  "data": {
    "is_available": true,
    "is_cached": false,
    "source": "Open-Meteo Meteorological Service",
    "coordinates": { "latitude": 20.00, "longitude": 73.78 },
    "current": {
      "temperature_c": 28.4,
      "relative_humidity_pct": 64.0,
      "precipitation_mm": 0.0,
      "wind_speed_kmh": 14.2,
      "condition": "Clear / Sunny",
      "observed_at": "2026-10-27T18:30:00Z"
    },
    "farming_alert": {
      "severity": "INFO",
      "title": "Favorable Spraying Window",
      "message": "Low wind velocity (14.2 km/h) and zero precipitation expected over next 24 hours."
    }
  }
}
```
- **Response `200 OK` (Graceful Fallback on External Outage):**
```json
{
  "status": "partial",
  "data": {
    "is_available": false,
    "is_cached": false,
    "message": "Real-time weather station currently unreachable. Please enter manual temperature and rainfall readings.",
    "current": null,
    "farming_alert": null
  }
}
```

#### `GET /api/v1/weather/forecast`
Fetches 5-day daily agricultural forecast.
- **Query Parameters:**
  - `latitude` (`float`, required)
  - `longitude` (`float`, required)
  - `days` (`int`, optional, default `5`, max `7`)
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "is_available": true,
    "forecast": [
      {
        "date": "2026-10-28",
        "temperature_max_c": 29.5,
        "temperature_min_c": 19.2,
        "precipitation_sum_mm": 0.0,
        "condition": "Sunny"
      },
      {
        "date": "2026-10-29",
        "temperature_max_c": 27.0,
        "temperature_min_c": 18.5,
        "precipitation_sum_mm": 18.0,
        "condition": "Heavy Rain"
      }
    ]
  }
}
```

---

## 6. Crop Guidance and Farming Recommendations

These endpoints provide domain-verified seed cultivars and soil-specific fertilizer adjustment schedules, served from verified reference datasets (`crop_guidance.json`).

### 6.1 Endpoints

#### `GET /api/v1/advisory/seed/{crop_slug}`
Returns certified commercial seed cultivars and agronomic sowing specifications.
- **Path Parameter:** `crop_slug` (e.g. `rice`, `maize`, `cotton`)
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "crop": "rice",
    "common_name": "Rice",
    "certified_cultivars": [
      { "name": "Pusa Basmati 1121", "duration_days": "140-145", "yield_potential_q_acre": "20-25" },
      { "name": "IR 64", "duration_days": "115-120", "yield_potential_q_acre": "22-26" }
    ],
    "sowing_guidance": {
      "seed_rate_kg_acre": "20 - 25 kg",
      "sowing_depth_cm": "2.0 - 3.0 cm",
      "spacing_cm": "20 x 15 cm",
      "germination_temp_c": "20 - 35 °C",
      "recommended_treatment": "Soak seeds in Carbendazim (2g/kg) for 24h prior to nursery sowing."
    },
    "citation": "ICAR - Indian Institute of Rice Research (IIRR) Standard Agronomy Guidelines"
  }
}
```

#### `POST /api/v1/advisory/fertilizer`
Calculates soil nutrient deficits and recommends structured basal and top-dressing application timelines.
- **Request Body:**
```json
{
  "crop": "rice",
  "nitrogen": 40.0,
  "phosphorus": 20.0,
  "potassium": 25.0
}
```
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "crop": "rice",
    "nutrient_status": {
      "nitrogen": { "status": "DEFICIENT", "deficit_kg_ha": 40.0 },
      "phosphorus": { "status": "DEFICIENT", "deficit_kg_ha": 20.0 },
      "potassium": { "status": "DEFICIENT", "deficit_kg_ha": 15.0 }
    },
    "application_schedule": [
      {
        "stage": "Basal (At Sowing / Transplanting)",
        "recommendation": "Apply 50% Nitrogen, 100% Phosphorus (DAP/SSP), and 100% Potassium (MOP)."
      },
      {
        "stage": "Active Tillering (Day 21-25)",
        "recommendation": "Top-dress 25% Nitrogen as Neem-Coated Urea."
      },
      {
        "stage": "Panicle Initiation (Day 45-50)",
        "recommendation": "Top-dress remaining 25% Nitrogen."
      }
    ],
    "organic_amendment": "Incorporate 4-5 tonnes/acre of well-decomposed Farmyard Manure (FYM) during land preparation.",
    "advisory_disclaimer": "Calibrate final chemical application with your local official district Soil Health Card."
  }
}
```

---

## 7. Cultivation Cost and Profit Estimation

### 7.1 Overview
The economics endpoint calculates expected farm operational costs, expected gross market revenue, and estimated net returns in Indian Rupees (`INR` / `₹`). All calculations clearly cite regional yield averages and official Minimum Support Prices (MSP).

### 7.2 Endpoint: `POST /api/v1/economics/estimate`
- **Access Level:** Public
- **Request Body:**
```json
{
  "crop": "rice",
  "land_area": 2.5,
  "land_unit": "acre",
  "cultivation_type": "irrigated",
  "custom_unit_costs": {
    "seeds": 1800.0,
    "land_preparation": 3500.0,
    "fertilizers": 4200.0,
    "plant_protection": 1500.0,
    "irrigation_energy": 2000.0,
    "labor": 8000.0
  }
}
```
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "crop": "rice",
    "land_area_acres": 2.5,
    "currency": "INR",
    "itemized_expenses": {
      "land_preparation_inr": 8750.0,
      "seeds_inr": 4500.0,
      "fertilizers_inr": 10500.0,
      "plant_protection_inr": 3750.0,
      "irrigation_energy_inr": 5000.0,
      "labor_inr": 20000.0,
      "total_cultivation_cost_inr": 52500.0
    },
    "yield_and_revenue": {
      "baseline_yield_per_acre_q": 22.0,
      "total_expected_yield_q": 55.0,
      "projected_market_price_per_q_inr": 2183.0,
      "price_benchmark_source": "Government Minimum Support Price (MSP) Baseline",
      "estimated_gross_revenue_inr": 120065.0,
      "estimated_net_profit_inr": 67565.0,
      "return_on_investment_pct": 128.7
    },
    "sensitivity_analysis": [
      { "scenario": "-20% Price Drop", "projected_price_inr": 1746.4, "net_profit_inr": 43552.0 },
      { "scenario": "Baseline MSP", "projected_price_inr": 2183.0, "net_profit_inr": 67565.0 },
      { "scenario": "+20% Market Surge", "projected_price_inr": 2619.6, "net_profit_inr": 91578.0 }
    ],
    "disclaimer": "Calculations represent parametric estimates based on regional historical averages. Actual farmgate prices and yields depend on weather conditions, grain moisture, and mandi market demand."
  }
}
```

---

## 8. Marketplace APIs

### 8.1 Public Marketplace Endpoints

#### `GET /api/v1/marketplace/categories`
Lists all standardized product categories.
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": [
    { "id": "c111bc99-9c0b-4ef8-bb6d-8dd9bd380c11", "slug": "seeds", "name": "Seeds & Seedlings" },
    { "id": "c222bc99-9c0b-4ef8-bb6d-8dd9bd380c22", "slug": "fertilizers", "name": "Fertilizers & Nutrients" },
    { "id": "c333bc99-9c0b-4ef8-bb6d-8dd9bd380c33", "slug": "crop_protection", "name": "Crop Protection" },
    { "id": "c444bc99-9c0b-4ef8-bb6d-8dd9bd380c44", "slug": "machinery_tools", "name": "Machinery & Tools" }
  ]
}
```

#### `GET /api/v1/marketplace/products`
Browses and searches approved public listings.
- **Access Level:** Public
- **Query Parameters:**
  - `category` (`string`, optional, slug e.g. `seeds`)
  - `search` (`string`, optional, keyword match)
  - `min_price` (`float`, optional)
  - `max_price` (`float`, optional)
  - `in_stock_only` (`bool`, optional, default `false`)
  - `sort_by` (`string`, optional, values: `price_asc`, `price_desc`, `newest`, default: `newest`)
  - `page` (`int`, optional, default `1`)
  - `page_size` (`int`, optional, default `12`, max `50`)
- **Public Visibility Enforcement:** The query strictly filters `WHERE approval_status = 'APPROVED' AND is_active = TRUE`.
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "d0eebc99-9c0b-4ef8-bb6d-9ee9bd380d11",
      "title": "Certified Paddy Seeds (Pusa 1121)",
      "brand_name": "Mahyco",
      "category": "seeds",
      "price": 1250.00,
      "currency": "INR",
      "unit": "25kg bag",
      "stock_quantity": 42,
      "in_stock": true,
      "image_url": "/assets/products/paddy_seed.webp",
      "merchant": {
        "id": "b1ffbc99-9c0b-4ef8-bb6d-7cc9bd380b22",
        "business_name": "Kisan Seva Kendra",
        "city": "Nashik",
        "phone_number": "9876543210"
      }
    }
  ],
  "meta": {
    "total_items": 1,
    "total_pages": 1,
    "current_page": 1,
    "page_size": 12,
    "has_next": false,
    "has_prev": false
  }
}
```

#### `GET /api/v1/marketplace/products/{id}`
Returns complete details for a single approved product.
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "id": "d0eebc99-9c0b-4ef8-bb6d-9ee9bd380d11",
    "title": "Certified Paddy Seeds (Pusa 1121)",
    "brand_name": "Mahyco",
    "description": "High-yielding certified basmati paddy seeds. 140 days duration with high grain elongation.",
    "category": "seeds",
    "price": 1250.00,
    "currency": "INR",
    "unit": "25kg bag",
    "stock_quantity": 42,
    "in_stock": true,
    "merchant": {
      "business_name": "Kisan Seva Kendra",
      "license_number": "LIC-MH-AGR-2024-8891",
      "phone_number": "9876543210",
      "address_line": "Plot 14, APMC Market Yard",
      "city": "Nashik",
      "state": "Maharashtra",
      "pincode": "422003"
    }
  }
}
```

---

### 8.2 Merchant Catalog Operations (Protected: `role = 'shopkeeper'`)

#### `GET /api/v1/merchant/products`
Retrieves all products owned by the authenticated shopkeeper across all lifecycle states (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `ARCHIVED`).
- **Response `200 OK`:** Array of owned products including approval status and admin rejection feedback if present.

#### `POST /api/v1/merchant/products`
Creates a new product listing.
- **Request Body:**
```json
{
  "title": "Neem Coated Urea",
  "brand_name": "IFFCO",
  "category_slug": "fertilizers",
  "description": "46% Nitrogen standard agricultural fertilizer bag.",
  "price": 266.50,
  "unit": "45kg bag",
  "stock_quantity": 150
}
```
- **Response `201 Created`:**
```json
{
  "status": "success",
  "message": "Product listing submitted for administrator review.",
  "data": {
    "id": "e0eebc99-9c0b-4ef8-bb6d-0ff9bd380e11",
    "title": "Neem Coated Urea",
    "price": 266.50,
    "currency": "INR",
    "stock_quantity": 150,
    "approval_status": "PENDING_APPROVAL",
    "is_active": true,
    "created_at": "2026-10-27T18:45:00Z"
  }
}
```

#### `PUT /api/v1/merchant/products/{id}`
Updates details of an owned product.
- **Ownership Rule:** Asserted strictly via `WHERE id = :id AND merchant_id = :current_merchant_id`. Violations return `403 Forbidden`.
- **Approval Rule:** Modifying `title`, `brand_name`, or `category_slug` of an already approved product resets its `approval_status` back to `PENDING_APPROVAL`.

#### `PATCH /api/v1/merchant/products/{id}/stock`
Quickly updates inventory count without resetting product approval status.
- **Request Body:** `{"stock_quantity": 80}`
- **Response `200 OK`:** `{"status": "success", "stock_quantity": 80}`

#### `DELETE /api/v1/merchant/products/{id}`
Soft-deactivates an owned product listing (`is_active = FALSE`, `approval_status = 'ARCHIVED'`).

---

## 9. User Profile and Dashboard APIs

#### `GET /api/v1/merchant/dashboard/summary`
Returns metric cards for the merchant backoffice portal.
- **Access Level:** Protected (`shopkeeper`)
- **Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "total_products": 12,
    "approved_products": 9,
    "pending_approval": 2,
    "rejected_products": 1,
    "out_of_stock_products": 2
  }
}
```

#### `PUT /api/v1/merchant/profile`
Updates merchant shop contact and address details.
- **Access Level:** Protected (`shopkeeper`)
- **Request Body:**
```json
{
  "business_name": "Kisan Seva Kendra",
  "phone_number": "9876543210",
  "address_line": "Shop 12, Main Mandi Road",
  "city": "Nashik",
  "state": "Maharashtra",
  "pincode": "422003"
}
```
- **Response `200 OK`:** Updated merchant profile object.

---

## 10. Admin APIs (Moderation & Governance)

These endpoints allow platform administrators to review merchant submissions and prevent counterfeit agricultural products from appearing in farmer searches.

#### `GET /api/v1/admin/products/pending`
Lists all products awaiting administrative review.
- **Access Level:** Protected (`role: "admin"`)
- **Response `200 OK`:** Paginated array of pending products with merchant profile details.

#### `POST /api/v1/admin/products/{id}/approve`
Approves a pending product listing, making it visible to the public.
- **Access Level:** Protected (`role: "admin"`)
- **Request Body (Optional Notes):** `{"notes": "Verified valid commercial fertilizer batch."}`
- **Response `200 OK`:**
```json
{
  "status": "success",
  "message": "Product listing approved successfully.",
  "data": {
    "product_id": "e0eebc99-9c0b-4ef8-bb6d-0ff9bd380e11",
    "approval_status": "APPROVED",
    "reviewed_at": "2026-10-27T18:50:00Z"
  }
}
```

#### `POST /api/v1/admin/products/{id}/reject`
Rejects a product listing with mandatory feedback for the merchant.
- **Access Level:** Protected (`role: "admin"`)
- **Request Body:**
```json
{
  "rejection_reason": "Incomplete product composition details and unverified manufacturer name."
}
```
- **Response `200 OK`:**
```json
{
  "status": "success",
  "message": "Product listing rejected.",
  "data": {
    "product_id": "e0eebc99-9c0b-4ef8-bb6d-0ff9bd380e11",
    "approval_status": "REJECTED",
    "rejection_reason": "Incomplete product composition details and unverified manufacturer name."
  }
}
```

---

## 11. Standard Request and Response Schemas

All API endpoints strictly follow uniform JSON wrapping:

### 11.1 Success Response Envelope
```json
{
  "status": "success",
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {}
}
```

### 11.2 Error Response Envelope
```json
{
  "status": "error",
  "code": "SPECIFIC_ERROR_CODE",
  "message": "Human-readable explanation of what went wrong.",
  "details": [],
  "timestamp": "2026-10-27T18:55:00Z"
}
```

---

## 12. HTTP Status Codes

| Status Code | Meaning | Standard API Application |
| :--- | :--- | :--- |
| **`200 OK`** | Request succeeded | Standard response for `GET`, `PUT`, `PATCH`, and successful prediction calls. |
| **`201 Created`** | Resource created | Returned by `POST /auth/register` and `POST /merchant/products`. |
| **`204 No Content`** | Action succeeded with no body | Returned on successful deletion or archival. |
| **`400 Bad Request`** | Malformed request | Syntax errors, unparseable JSON, or invalid query parameters. |
| **`401 Unauthorized`** | Missing or invalid auth | Missing Bearer token or invalid/expired JWT. |
| **`403 Forbidden`** | Insufficient permissions | Accessing admin endpoints without `admin` role, or editing another merchant's product. |
| **`404 Not Found`** | Resource does not exist | Invalid product ID, crop slug, or merchant profile. |
| **`409 Conflict`** | Resource conflict | Email address already registered during merchant signup. |
| **`422 Unprocessable`** | Schema validation failed | Boundary breach on N, P, K, pH, rainfall, or negative pricing. |
| **`500 Internal Error`** | Unhandled server exception | Server-side fault (traceback logged privately; generic message returned). |
| **`503 Unavailable`** | Dependency down | ML model artifact missing or database pool failure. |

---

## 13. Endpoint Reference Table

| Method | Endpoint Path | Purpose | Auth Required | Required Role | Request Format | Expected Success |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Register merchant account & store | No | None | JSON body | `201 Created` |
| **POST** | `/api/v1/auth/login` | Login and receive JWT access token | No | None | JSON body | `200 OK` |
| **GET** | `/api/v1/auth/me` | Fetch active user profile | Yes | Any valid user | None | `200 OK` |
| **POST** | `/api/v1/recommendation/predict` | Generate ML crop recommendation | No | None | JSON body | `200 OK` |
| **GET** | `/api/v1/weather/current` | Get current weather & farming alerts | No | None | Query params | `200 OK` |
| **GET** | `/api/v1/weather/forecast` | Get 5-day weather forecast | No | None | Query params | `200 OK` |
| **GET** | `/api/v1/advisory/seed/{crop}` | Get seed varieties & sowing guide | No | None | Path param | `200 OK` |
| **POST** | `/api/v1/advisory/fertilizer` | Calculate soil NPK balance & schedule | No | None | JSON body | `200 OK` |
| **POST** | `/api/v1/economics/estimate` | Calculate costs, gross & net profit | No | None | JSON body | `200 OK` |
| **GET** | `/api/v1/marketplace/categories` | List product categories | No | None | None | `200 OK` |
| **GET** | `/api/v1/marketplace/products` | Browse approved product catalog | No | None | Query params | `200 OK` |
| **GET** | `/api/v1/marketplace/products/{id}`| View single product & merchant info | No | None | Path param | `200 OK` |
| **GET** | `/api/v1/merchant/products` | List own products (all statuses) | Yes | `shopkeeper` | Query params | `200 OK` |
| **POST** | `/api/v1/merchant/products` | Create product (sets PENDING status) | Yes | `shopkeeper` | JSON body | `201 Created` |
| **PUT** | `/api/v1/merchant/products/{id}` | Update owned product details | Yes | `shopkeeper` | JSON body | `200 OK` |
| **PATCH**| `/api/v1/merchant/products/{id}/stock`| Update inventory quantity | Yes | `shopkeeper` | JSON body | `200 OK` |
| **DELETE**| `/api/v1/merchant/products/{id}`| Soft-archive owned product | Yes | `shopkeeper` | None | `200 OK` / `204` |
| **GET** | `/api/v1/merchant/dashboard/summary`| Fetch merchant inventory summary | Yes | `shopkeeper` | None | `200 OK` |
| **PUT** | `/api/v1/merchant/profile` | Update store details | Yes | `shopkeeper` | JSON body | `200 OK` |
| **GET** | `/api/v1/admin/products/pending` | Fetch pending moderation queue | Yes | `admin` | Query params | `200 OK` |
| **POST** | `/api/v1/admin/products/{id}/approve` | Approve listing for public viewing | Yes | `admin` | JSON body (opt) | `200 OK` |
| **POST** | `/api/v1/admin/products/{id}/reject` | Reject listing with feedback | Yes | `admin` | JSON body | `200 OK` |
| **GET** | `/health` | Liveness probe | No | None | None | `200 OK` |
| **GET** | `/health/ready` | Readiness probe (ML & DB check) | No | None | None | `200 OK` |

---

## 14. Pagination, Filtering, and Sorting

### 14.1 Standard Query Conventions
For collections (e.g. `/marketplace/products`, `/merchant/products`, `/admin/products/pending`):
- `page`: 1-based index (default `1`, minimum `1`).
- `page_size`: Number of items per page (default `12`, minimum `1`, maximum `50`).
- `sort_by`:
  - `newest`: `created_at DESC` (default)
  - `price_asc`: `price ASC`
  - `price_desc`: `price DESC`

### 14.2 Metadata Block
Paginated endpoints always return a `meta` dictionary alongside `data`:
```json
"meta": {
  "total_items": 45,
  "total_pages": 4,
  "current_page": 1,
  "page_size": 12,
  "has_next": true,
  "has_prev": false
}
```

---

## 15. Security Requirements

1. **Password Hashing:** Passwords must be hashed using `bcrypt` (work factor 12) via `passlib`. Plaintext passwords never appear in database records or log outputs.
2. **JWT Secret Management:** Signed using a high-entropy `JWT_SECRET_KEY` loaded from server environment variables.
3. **Cross-Tenant Guard:** A shopkeeper can never read, modify, or delete listings of another shopkeeper. The backend query enforces:
   `WHERE products.id = :product_id AND merchant_profiles.user_id = :current_user_id`
4. **CORS Restrictions:** Allowed browser origins are restricted via `CORS_ORIGINS` in FastAPI (`http://localhost:5173` in dev; Vercel production domain in prod). Wildcards (`*`) are prohibited.
5. **SQL Injection Defense:** Fully prevented via SQLAlchemy 2.0 parameterized queries.
6. **XSS Defense:** Client responses escape untrusted merchant input; React JSX auto-escapes string content.

---

## 16. External Service and Failure Handling

```
+------------------------------------------------------------------------------------+
|                         FAILURE HANDLING PROTOCOLS                                 |
+---------------------+-------------------------------+------------------------------+
| Service Dependency  | Failure Mode                  | API Behavior                 |
+---------------------+-------------------------------+------------------------------+
| Open-Meteo Weather  | Timeout (>3.0s) or HTTP 5xx   | Returns HTTP 200 with        |
|                     |                               | is_available: false; permits |
|                     |                               | manual entry without error.  |
+---------------------+-------------------------------+------------------------------+
| ML Model Artifact   | .joblib file missing or crash | Returns HTTP 503             |
|                     |                               | MODEL_UNAVAILABLE with alert.|
+---------------------+-------------------------------+------------------------------+
| PostgreSQL Database | Connection drop / pool timeout| Caught by global handler;    |
|                     |                               | returns HTTP 503 SERVICE_UN. |
+---------------------+-------------------------------+------------------------------+
```

---

## 17. API Testing Plan

Before deployment, endpoints must pass the following test suites using `pytest` and `httpx`:
1. **ML Boundary Tests:** Verify that submitting $N=150$ or $pH=2.0$ returns HTTP 422 with precise field descriptors.
2. **Deterministic Prediction Check:** Verify that benchmark soil inputs yield valid predicted crop strings matching model classes.
3. **Authentication Tests:** Verify that login with bad password returns 401; valid login yields a verified JWT.
4. **Authorization Tests:** Verify that non-admin token attempting `/admin/products/{id}/approve` yields 403 Forbidden.
5. **Cross-Tenant Product Guard:** Verify that Merchant A attempting to edit Merchant B's product receives 403 Forbidden.
6. **Admin Moderation Workflow:** Verify that a product created by Merchant A remains hidden from `/marketplace/products` until approved by Admin.
7. **Weather Fallback Test:** Mock Open-Meteo returning 500; verify that `/weather/current` degrades gracefully to `is_available: false`.

---

## 18. FastAPI and OpenAPI Compatibility

- **Automatic Swagger UI:** FastAPI automatically generates interactive OpenAPI documentation at `/docs` and ReDoc at `/redoc`.
- **Pydantic v2 Models:** Every request and response schema documented here directly maps to typed Pydantic models in `backend/app/schemas/`.
- **Docstrings & Tags:** Endpoints are tagged into logical groups: `["Authentication", "Crop Recommendation", "Weather", "Advisory", "Economics", "Marketplace", "Merchant", "Admin"]`.

---

## 19. Frontend Integration Notes

1. **Configuring Base URL:**  
   The React application initializes a centralized Axios / Fetch wrapper (`src/api/client.js`) using `import.meta.env.VITE_API_BASE_URL`.
2. **Handling Token Persistence:**  
   Upon successful merchant login, the JWT is stored in `localStorage` or memory, attached to subsequent requests via an `Authorization: Bearer <token>` header.
3. **Handling Form Errors:**  
   The frontend interceptor maps HTTP 422 `details` directly to inline field errors under soil input components.
4. **Handling Partial Weather:**  
   If `/weather/current` returns `is_available: false`, the frontend hides the weather forecast card and switches climate inputs to manual entry mode.

---

## 20. Assumptions and Pending Decisions

### 20.1 Assumptions
1. **Open-Meteo Free Tier Sufficiency:** Open-Meteo's hourly rate limits are assumed sufficient when combined with the backend's 30-minute in-memory cache.
2. **Stateless Farmer Workflow:** It is confirmed that guest farmers do not require database persistence for recommendation queries.
3. **Admin Listing Moderation:** Shopkeeper products must receive admin approval before appearing in public searches.

### 20.2 Pending Decisions Requiring Confirmation
1. **Product Image Storage:**  
   For Phase 1/2, product listings reference static asset URLs (`/assets/products/...`) or external verified URLs. If shopkeepers need direct image file uploads in Phase 3, an S3/Cloudinary integration or local multipart upload endpoint (`POST /api/v1/merchant/products/{id}/image`) will be specified.
2. **Farmer Saved Plans (Post-MVP):**  
   If user accounts are introduced for farmers in future phases, a new `/api/v1/farmer/saved-recommendations` endpoint can be introduced without breaking the existing public prediction contract.

---
*End of REST API Specification (API.md)*
