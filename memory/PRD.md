# GigInsure - Product Requirements Document

## Problem Statement
AI-Powered Parametric Insurance for Food Delivery Partners (Swiggy/Zomato riders). Hybrid financial protection combining parametric insurance (major disruptions) with reward-based system (minor disruptions).

## Architecture
- **Frontend**: React.js + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **AI**: Groq API (llama-3.3-70b-versatile) for risk assessment
- **Weather**: OpenWeatherMap API (real data)
- **Payment**: Simulated/Mock flow
- **Auth**: JWT (httpOnly cookies)

## User Personas
1. **Food Delivery Rider** - Primary user, subscribes to weekly plans, earns rewards
2. **Admin** - System admin (future dashboard)

## Core Requirements
- Weekly subscription with dynamic premium pricing
- Parametric insurance for major disruptions (heavy rain, cyclone)
- Reward system for minor disruptions (traffic, heat)
- Automated claim processing (no manual claims)
- Fraud detection
- Real-time weather monitoring

## What's Been Implemented (Phase 1 - April 3, 2026)

### Ground Floor + Module 1: User Subscription
- JWT auth (register/login/logout/refresh/me)
- Brute force protection (5 attempts = 15 min lockout)
- Dynamic premium pricing with Groq AI + OpenWeatherMap forecast
- City risk-based base premium (₹20-₹40)
- AI multiplier (0.85x to 1.15x)
- Policy CRUD (create, active check, history)
- Mock UPI/wallet payment flow
- Rider dashboard with policy status, weather, wallet, risk panel
- Subscription page with city selector and AI pricing breakdown
- Admin + test rider seeding

## Prioritized Backlog

### P0 (Next)
- Module 3: Risk & Severity Engine (weather triggers, severity classification, decision routing)
- Module 4: Financial Engine (payout calculation, reward system, fraud detection)

### P1
- Module 2: Activity & Intent Tracking (simulated)
- Simulation mode with sliders (rain, traffic, temp)

### P2
- Module 5: Full UI (advanced dashboard, reward history, charts)
- Policy renewal system
- Admin dashboard
- Mobile responsive improvements

## Next Tasks
1. Build Module 3: Risk & Severity Engine
2. Build Module 4: Financial Engine (Claims + Rewards)
3. Add Simulation Mode for demo
4. Build complete reward wallet with history
