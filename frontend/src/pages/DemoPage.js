import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  CloudRain, Thermometer, Wind, Zap, MapPin, Loader2,
  CheckCircle, AlertTriangle, Coins, Shield, Navigation,
  RefreshCw, ChevronRight, Waves, Flame, CloudLightning,
  Sun, Play, Clock
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Demo Scenarios ────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'live',
    label: 'Live Weather',
    sublabel: 'Real-time OpenWeather data',
    icon: Navigation,
    color: '#2D6A85',
    bg: '#2D6A8510',
    border: '#2D6A8530',
    weather: null,
    badge: 'LIVE',
    badgeColor: '#2D6A85',
    description: 'Uses actual current weather from OpenWeatherMap API for your registered city.',
    expectedOutcome: 'Varies by real conditions',
  },
  {
    id: 'heavy_rain',
    label: 'Heavy Rain',
    sublabel: '55mm rainfall · Insurance payout',
    icon: CloudRain,
    color: '#D95D39',
    bg: '#D95D3910',
    border: '#D95D3930',
    weather: { rainfall_mm: 55, wind_speed_kmh: 25, temperature: 26, humidity: 90, description: 'heavy rain' },
    badge: 'PAYOUT',
    badgeColor: '#D95D39',
    description: 'Simulates a heavy monsoon event. Rainfall exceeds the 50mm parametric trigger threshold.',
    expectedOutcome: '₹ Insurance payout credited instantly',
    stats: [
      { label: 'Rainfall', value: '55mm', icon: CloudRain },
      { label: 'Wind', value: '25 km/h', icon: Wind },
      { label: 'Humidity', value: '90%', icon: Waves },
    ],
  },
  {
    id: 'cyclone',
    label: 'Cyclone Warning',
    sublabel: '85mm · 55km/h wind · Extreme',
    icon: CloudLightning,
    color: '#C44536',
    bg: '#C4453610',
    border: '#C4453630',
    weather: { rainfall_mm: 85, wind_speed_kmh: 55, temperature: 24, humidity: 95, description: 'cyclone conditions' },
    badge: 'EXTREME',
    badgeColor: '#C44536',
    description: 'Worst-case cyclone scenario. Both rainfall and wind speed breach extreme thresholds simultaneously.',
    expectedOutcome: 'Maximum payout — full income replacement',
    stats: [
      { label: 'Rainfall', value: '85mm', icon: CloudRain },
      { label: 'Wind', value: '55 km/h', icon: Wind },
      { label: 'Humidity', value: '95%', icon: Waves },
    ],
  },
  {
    id: 'extreme_heat',
    label: 'Extreme Heat',
    sublabel: '43°C · Heatwave payout',
    icon: Flame,
    color: '#E89B31',
    bg: '#E89B3110',
    border: '#E89B3130',
    weather: { rainfall_mm: 0, wind_speed_kmh: 8, temperature: 43, humidity: 30, description: 'extreme heat' },
    badge: 'HEAT',
    badgeColor: '#E89B31',
    description: 'Simulates a dangerous heatwave. Temperature above 42°C triggers parametric heat insurance.',
    expectedOutcome: '₹ Heat disruption payout credited',
    stats: [
      { label: 'Temperature', value: '43°C', icon: Thermometer },
      { label: 'Wind', value: '8 km/h', icon: Wind },
      { label: 'Humidity', value: '30%', icon: Sun },
    ],
  },
  {
    id: 'moderate_rain',
    label: 'Moderate Rain',
    sublabel: '35mm · Reward coins earned',
    icon: Coins,
    color: '#4A7C59',
    bg: '#4A7C5910',
    border: '#4A7C5930',
    weather: { rainfall_mm: 35, wind_speed_kmh: 15, temperature: 28, humidity: 80, description: 'moderate rain' },
    badge: 'COINS',
    badgeColor: '#4A7C59',
    description: 'Below the full payout threshold but still disruptive. Riders earn GigCoins for working through rain.',
    expectedOutcome: 'GigCoins credited to wallet',
    stats: [
      { label: 'Rainfall', value: '35mm', icon: CloudRain },
      { label: 'Wind', value: '15 km/h', icon: Wind },
      { label: 'Humidity', value: '80%', icon: Waves },
    ],
  },
  {
    id: 'clear',
    label: 'Clear Day',
    sublabel: 'No disruption · Normal ops',
    icon: Sun,
    color: '#5C5852',
    bg: '#F9F8F6',
    border: '#E3DFD8',
    weather: { rainfall_mm: 0, wind_speed_kmh: 5, temperature: 30, humidity: 55, description: 'clear sky' },
    badge: 'SAFE',
    badgeColor: '#4A7C59',
    description: 'Normal operating conditions. No trigger fired — shows the system correctly identifies non-events.',
    expectedOutcome: 'No action — system confirms safe conditions',
    stats: [
      { label: 'Rainfall', value: '0mm', icon: CloudRain },
      { label: 'Wind', value: '5 km/h', icon: Wind },
      { label: 'Temp', value: '30°C', icon: Sun },
    ],
  },
];

// ─── Result Display ────────────────────────────────────────────────────────
function ResultPanel({ result, onClose }) {
  const decision = result?.decision;
  const isPayout = decision === 'insurance_payout' || decision === 'partial_insurance';
  const isCoins  = decision === 'reward_coins';
  const isNone   = decision === 'no_action';

  const config = isPayout
    ? { color: '#D95D39', bg: '#D95D3908', icon: CheckCircle, title: 'Insurance Payout Triggered', label: 'CLAIM APPROVED' }
    : isCoins
    ? { color: '#E89B31', bg: '#E89B3108', icon: Coins,        title: 'GigCoins Awarded',           label: 'COINS CREDITED' }
    : { color: '#4A7C59', bg: '#4A7C5908', icon: Shield,       title: 'No Disruption Detected',     label: 'ALL CLEAR' };

  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ border: `1.5px solid ${config.color}30` }}
      >
        {/* Header */}
        <div className="p-6 pb-4" style={{ background: config.bg }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                <Icon className="w-6 h-6" style={{ color: config.color }} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest" style={{ color: config.color }}>{config.label}</span>
                <h3 className="text-lg font-bold text-[#1C1A17] leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {config.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Payout amount */}
          {isPayout && result?.claim?.payout != null && (
            <div className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${config.color}20` }}>
              <p className="text-xs text-[#5C5852] mb-1">Amount Credited</p>
              <p className="text-4xl font-black" style={{ color: config.color, fontFamily: 'Manrope, sans-serif' }}>
                ₹{result.claim.payout}
              </p>
              <p className="text-xs text-[#5C5852] mt-1">Zero-touch · Auto-processed</p>
            </div>
          )}

          {/* Coins */}
          {isCoins && result?.reward?.coins_awarded != null && (
            <div className="bg-white rounded-2xl p-4 text-center" style={{ border: `1px solid ${config.color}20` }}>
              <p className="text-xs text-[#5C5852] mb-1">GigCoins Earned</p>
              <p className="text-4xl font-black" style={{ color: config.color, fontFamily: 'Manrope, sans-serif' }}>
                +{result.reward.coins_awarded}
              </p>
              <p className="text-xs text-[#5C5852] mt-1">Redeemable for premium discounts</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 pt-4 space-y-4">
          {/* Weather snapshot */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5C5852] mb-2">Weather Snapshot</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Rainfall', value: `${result?.weather_data?.rainfall_mm ?? 0}mm`, icon: CloudRain },
                { label: 'Temp', value: `${result?.weather_data?.temperature ?? '--'}°C`, icon: Thermometer },
                { label: 'Wind', value: `${result?.weather_data?.wind_speed_kmh ?? 0}km/h`, icon: Wind },
              ].map(({ label, value, icon: I }) => (
                <div key={label} className="bg-[#F9F8F6] rounded-xl p-2.5 text-center">
                  <I className="w-3.5 h-3.5 text-[#5C5852] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#1C1A17]">{value}</p>
                  <p className="text-[9px] text-[#5C5852]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="flex items-center justify-between bg-[#F9F8F6] rounded-xl p-3">
            <span className="text-xs text-[#5C5852]">AI Severity Assessment</span>
            <span className="text-xs font-bold capitalize" style={{ color: config.color }}>
              {result?.weather_severity?.severity ?? 'none'}
            </span>
          </div>

          {/* AI note */}
          {result?.ai_assessment?.assessment && (
            <div className="bg-[#F9F8F6] rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5C5852] mb-1">AI Reasoning</p>
              <p className="text-xs text-[#1C1A17] leading-relaxed">{result.ai_assessment.assessment}</p>
            </div>
          )}

          <Button
            onClick={onClose}
            className="w-full rounded-xl h-11 text-white font-semibold"
            style={{ backgroundColor: config.color }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Location Badge ────────────────────────────────────────────────────────
function LocationBadge({ city, gpsCity, gpsLoading }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#E3DFD8] rounded-full px-4 py-2 w-fit">
      {gpsLoading ? (
        <Loader2 className="w-3.5 h-3.5 text-[#2D6A85] animate-spin" />
      ) : gpsCity ? (
        <span className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse inline-block" />
      ) : (
        <MapPin className="w-3.5 h-3.5 text-[#D95D39]" />
      )}
      <span className="text-xs font-semibold text-[#1C1A17]">
        {gpsLoading ? 'Detecting location…' : gpsCity ? `GPS: ${gpsCity}` : `Profile city: ${city}`}
      </span>
    </div>
  );
}

// ─── Scenario Card ─────────────────────────────────────────────────────────
function ScenarioCard({ scenario, selected, onSelect, running }) {
  const Icon = scenario.icon;
  const isSelected = selected?.id === scenario.id;

  return (
    <button
      onClick={() => onSelect(scenario)}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200 group"
      style={{
        background: isSelected ? scenario.bg : 'white',
        border: `1.5px solid ${isSelected ? scenario.color : '#E3DFD8'}`,
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isSelected ? `0 4px 20px ${scenario.color}20` : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${scenario.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: scenario.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {scenario.label}
            </span>
            <span
              className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${scenario.badgeColor}15`, color: scenario.badgeColor }}
            >
              {scenario.badge}
            </span>
          </div>
          <p className="text-[11px] text-[#5C5852]">{scenario.sublabel}</p>
          {isSelected && (
            <p className="text-[11px] text-[#1C1A17] mt-2 leading-relaxed">{scenario.description}</p>
          )}
          {isSelected && scenario.stats && (
            <div className="flex gap-3 mt-3">
              {scenario.stats.map(({ label, value, icon: I }) => (
                <div key={label} className="flex items-center gap-1">
                  <I className="w-3 h-3" style={{ color: scenario.color }} />
                  <span className="text-[10px] font-semibold text-[#1C1A17]">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200"
          style={{ color: isSelected ? scenario.color : '#E3DFD8', transform: isSelected ? 'rotate(90deg)' : 'none' }}
        />
      </div>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function DemoPage() {
  const { user } = useAuth();
  const [selected, setSelected]     = useState(SCENARIOS[0]);
  const [running, setRunning]       = useState(false);
  const [result, setResult]         = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory]       = useState([]);
  const [hasPolicy, setHasPolicy]   = useState(false);
  const [gpsCity, setGpsCity]       = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [activeCity, setActiveCity] = useState(user?.city || 'Chennai');

  // ── Check active policy on mount ──
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/policies/active`, { withCredentials: true });
        setHasPolicy(res.data.has_active_policy);
      } catch {}
    })();
    fetchHistory();
    tryGPS();
  }, []);

  // ── GPS detection ──
  const tryGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode via a free API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county || null;
          if (city) {
            setGpsCity(city);
            setActiveCity(city);
          }
        } catch {}
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 6000 }
    );
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/triggers/history`, { withCredentials: true });
      setHistory((res.data.triggers || []).slice(0, 5));
    } catch {}
  };

  const runScenario = async () => {
    if (!hasPolicy) return;
    setRunning(true);
    setResult(null);
    try {
      const body = { city: activeCity };
      if (selected.weather) body.manual_weather = selected.weather;
      const res = await axios.post(`${API}/triggers/evaluate`, body, { withCredentials: true });
      setResult(res.data);
      setShowResult(true);
      fetchHistory();
    } catch (err) {
      setResult({ error: err.response?.data?.detail || err.message });
      setShowResult(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-[#D95D39] uppercase">Hackathon Demo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D95D39] animate-pulse" />
          </div>
          <h1
            className="text-2xl sm:text-3xl font-black text-[#1C1A17] tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Parametric Trigger Demo
          </h1>
          <p className="text-[#5C5852] text-sm mt-1">
            Live GPS detection + preset weather scenarios for demonstration
          </p>
        </div>
        <LocationBadge city={user?.city} gpsCity={gpsCity} gpsLoading={gpsLoading} />
      </div>

      {/* No policy warning */}
      {!hasPolicy && (
        <div className="flex items-center gap-3 bg-[#E89B31]/10 border border-[#E89B31]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#E89B31] flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#1C1A17]">No active policy</p>
            <p className="text-xs text-[#5C5852]">Subscribe first to run trigger evaluations.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — Scenario Selector */}
        <div className="lg:col-span-3 space-y-3">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5C5852]">
            Select Scenario
          </p>
          <div className="space-y-2">
            {SCENARIOS.map(s => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                selected={selected}
                onSelect={setSelected}
                running={running}
              />
            ))}
          </div>
        </div>

        {/* Right — Run Panel + History */}
        <div className="lg:col-span-2 space-y-4">

          {/* Run card */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: selected.bg, border: `1.5px solid ${selected.border}` }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: selected.color }}>
                Ready to run
              </p>
              <h3 className="text-lg font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {selected.label}
              </h3>
              <p className="text-xs text-[#5C5852] mt-1">{selected.description}</p>
            </div>

            {/* Expected outcome */}
            <div
              className="rounded-xl p-3"
              style={{ background: `${selected.color}10`, border: `1px solid ${selected.color}20` }}
            >
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: selected.color }}>
                Expected outcome
              </p>
              <p className="text-xs font-semibold text-[#1C1A17]">{selected.expectedOutcome}</p>
            </div>

            {/* City info */}
            <div className="flex items-center gap-2 text-xs text-[#5C5852]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Evaluating for: <span className="font-semibold text-[#1C1A17]">{activeCity}</span></span>
              {selected.id === 'live' && (
                <button onClick={tryGPS} className="ml-auto">
                  <RefreshCw className="w-3.5 h-3.5 text-[#2D6A85]" />
                </button>
              )}
            </div>

            {/* Run button */}
            <Button
              onClick={runScenario}
              disabled={running || !hasPolicy}
              className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: hasPolicy ? selected.color : '#E3DFD8',
                color: hasPolicy ? 'white' : '#5C5852',
              }}
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Scenario
                </>
              )}
            </Button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5C5852]">
                Recent Runs
              </p>
              {history.map((t) => {
                const isPayout = t.decision === 'insurance_payout' || t.decision === 'partial_insurance';
                const isCoins  = t.decision === 'reward_coins';
                const dotColor = isPayout ? '#D95D39' : isCoins ? '#E89B31' : '#4A7C59';
                const label    = isPayout ? 'Payout' : isCoins ? 'Coins' : 'No action';
                const ts       = new Date(t.timestamp);
                const timeAgo  = `${ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <div
                    key={t.trigger_id}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#E3DFD8]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <div>
                        <p className="text-xs font-semibold text-[#1C1A17] capitalize">{t.city}</p>
                        <p className="text-[10px] text-[#5C5852]">{t.trigger_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: dotColor }}>{label}</p>
                      <p className="text-[10px] text-[#5C5852] flex items-center gap-1 justify-end">
                        <Clock className="w-2.5 h-2.5" />{timeAgo}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* How it works */}
          <div className="bg-[#F9F8F6] rounded-2xl p-4 border border-[#E3DFD8]">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#5C5852] mb-3">
              How it works
            </p>
            <div className="space-y-2.5">
              {[
                { step: '01', text: 'Weather data ingested (live or preset)' },
                { step: '02', text: 'Groq AI assesses severity & disruption impact' },
                { step: '03', text: 'Parametric trigger fires if threshold crossed' },
                { step: '04', text: 'Payout or GigCoins credited — zero manual claims' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="text-[10px] font-black text-[#D95D39] w-5 flex-shrink-0 mt-0.5">{step}</span>
                  <p className="text-[11px] text-[#5C5852] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result overlay */}
      {showResult && result && !result.error && (
        <ResultPanel result={result} onClose={() => setShowResult(false)} />
      )}
      {showResult && result?.error && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowResult(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E3DFD8]" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="w-8 h-8 text-[#D95D39] mb-3" />
            <p className="font-semibold text-[#1C1A17] mb-1">Error</p>
            <p className="text-sm text-[#5C5852] mb-4">{result.error}</p>
            <Button onClick={() => setShowResult(false)} className="w-full rounded-xl bg-[#D95D39] text-white">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
