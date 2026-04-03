# GigInsure - Product Requirements Document

## Problem Statement
AI-Powered Parametric Insurance for Food Delivery Partners. Guidewire DEV Trails Hackathon.

## Architecture
- Frontend: React.js + Tailwind CSS + Shadcn UI + Recharts
- Backend: FastAPI (Python)
- Database: MongoDB
- AI: Groq API (llama-3.3-70b-versatile)
- Weather: OpenWeatherMap API
- Payment: Simulated/Mock

## All Implemented Features (April 3, 2026)

### Module 1: User Subscription
- JWT auth, brute force protection, admin/rider seeding
- Dynamic AI premium pricing (Groq + OpenWeatherMap)
- Policy CRUD + mock payment

### Module 3: Risk & Severity Engine
- 5 automated parametric triggers (rain, cyclone, moderate rain, traffic, heat)
- AI severity assessment, risk scoring, decision routing

### Module 4: Financial Engine
- Zero-touch claims, payout calculation, fraud detection
- Reward coin system, wallet, coin redemption

### Module 2: Activity Tracking
- Intent-to-work verification, session simulation
- Activity status (active/idle/offline), movement tracking

### New Features
- Landing Page with hero, how-it-works, triggers
- AI Risk Advisor Chatbot (Groq-powered)
- Earnings Analytics Charts (Recharts - line, bar, pie)
- Risk Heatmap (10 Indian cities, live weather)
- Admin Dashboard (stats, riders, cities, activity)
- Payment History page
- Policy Renewal flow

## Pages
- / (Landing), /login, /dashboard, /subscribe, /claims, /rewards, /heatmap, /activity, /payments, /admin

## Credentials
- Admin: admin@giginsure.com / admin123
- Rider: rider@test.com / rider123
