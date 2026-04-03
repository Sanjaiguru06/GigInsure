# GigInsure - Product Requirements Document

## Problem Statement
AI-Powered Parametric Insurance for Food Delivery Partners (Swiggy/Zomato riders). Hybrid financial protection combining parametric insurance (major disruptions) with reward-based system (minor disruptions). Built for Guidewire DEV Trails University Hackathon Phase 2.

## Architecture
- **Frontend**: React.js + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Groq API (llama-3.3-70b-versatile) for risk assessment & severity analysis
- **Weather**: OpenWeatherMap API (real data)
- **Payment**: Simulated/Mock flow
- **Auth**: JWT (httpOnly cookies)

## What's Been Implemented

### Phase 1 (April 3, 2026) - Module 1: Ground Floor + Subscription
- JWT auth (register/login/logout/refresh/me)
- Brute force protection
- Dynamic premium pricing with Groq AI + OpenWeatherMap
- Policy CRUD + mock payment flow
- Rider dashboard, subscription page

### Phase 2 (April 3, 2026) - Module 3 & 4: Risk Engine + Financial Engine
- **5 Automated Triggers**:
  1. Heavy Rain (>=50mm) → Insurance payout
  2. Cyclone (>=70mm + wind>=40km/h) → Insurance payout (extreme)
  3. Moderate Rain (>=30mm) → Partial insurance
  4. Traffic Delay (>=1.5x) → Reward coins
  5. Extreme Heat (>=40°C) → Reward coins + combo bonus
- **Zero-Touch Claims**: Auto-processing with AI severity assessment
- **Payout Calculation**: (Expected - Actual) × Severity Factor
- **Fraud Detection**: Device validation, duplicate check, zone validation
- **Reward System**: Coins for traffic/heat, combo bonuses
- **Wallet**: Coin accumulation, redemption (100 coins = ₹1)
- **Claims & Rewards Pages**: Full history, trigger evaluation panel
- **Dashboard Summary**: Stats, recent claims/rewards

## Hackathon Deliverables Status
- [x] Registration Process
- [x] Insurance Policy Management
- [x] Dynamic Premium Calculation (AI-powered)
- [x] Claims Management (zero-touch, automated)
- [x] 3-5 Automated Triggers (5 implemented)
- [x] Seamless zero-touch claim process

## Prioritized Backlog
### P0
- Module 2: Activity & Intent Tracking (simulated)

### P1
- Admin dashboard
- Policy renewal auto-reminder
- Charts/analytics for earnings/payouts

### P2
- Mobile responsive improvements
- Multilingual support
- Dynamic premium adjustment based on history
