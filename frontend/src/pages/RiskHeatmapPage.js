import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CloudRain, Thermometer, Wind, Droplets, AlertTriangle, MapPin } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SEVERITY_COLORS = {
  extreme: { bg: '#C44536', ring: '#C4453640', text: 'Extreme' },
  high: { bg: '#D95D39', ring: '#D95D3940', text: 'High' },
  moderate: { bg: '#E89B31', ring: '#E89B3140', text: 'Moderate' },
  none: { bg: '#4A7C59', ring: '#4A7C5940', text: 'Safe' },
};

// Approximate SVG positions for Indian cities on a simple map
const CITY_POSITIONS = {
  Delhi: { x: 290, y: 130 }, Jaipur: { x: 248, y: 168 }, Lucknow: { x: 338, y: 165 },
  Ahmedabad: { x: 210, y: 230 }, Kolkata: { x: 425, y: 230 }, Mumbai: { x: 205, y: 300 },
  Pune: { x: 225, y: 320 }, Hyderabad: { x: 290, y: 340 }, Bangalore: { x: 265, y: 400 },
  Chennai: { x: 320, y: 400 },
};

export default function RiskHeatmapPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/heatmap`, { withCredentials: true });
        setCities(res.data.cities || []);
      } catch (err) {
        console.error('Heatmap error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6" data-testid="risk-heatmap-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Live Risk Heatmap
        </h1>
        <p className="text-[#5C5852] text-base mt-1">Real-time disruption severity across Indian cities via OpenWeatherMap</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2 border-[#E3DFD8] shadow-none" data-testid="heatmap-map-card">
          <CardContent className="p-4">
            <div className="relative bg-[#F9F8F6] rounded-2xl overflow-hidden" style={{ height: 500 }}>
              {/* India outline simplified */}
              <svg viewBox="150 80 350 400" className="w-full h-full">
                {/* Simplified India shape */}
                <path d="M250,100 L340,95 L380,120 L420,140 L450,200 L440,250 L430,280 L400,300 L380,330 L350,360 L320,400 L300,440 L280,460 L260,440 L240,400 L220,370 L200,330 L190,290 L195,250 L210,210 L220,170 L240,130 Z" fill="#EBE8E3" stroke="#E3DFD8" strokeWidth="2" />
                
                {/* City markers */}
                {cities.map((city) => {
                  const pos = CITY_POSITIONS[city.city];
                  if (!pos) return null;
                  const sev = SEVERITY_COLORS[city.severity] || SEVERITY_COLORS.none;
                  return (
                    <g key={city.city} onClick={() => setSelected(city)} className="cursor-pointer">
                      {/* Pulse ring */}
                      <circle cx={pos.x} cy={pos.y} r={city.severity !== 'none' ? 16 : 10} fill={sev.ring} className={city.severity !== 'none' ? 'animate-pulse' : ''} />
                      {/* Dot */}
                      <circle cx={pos.x} cy={pos.y} r={8} fill={sev.bg} stroke="white" strokeWidth="2" />
                      {/* Label */}
                      <text x={pos.x} y={pos.y - 14} textAnchor="middle" className="text-[9px] font-semibold fill-[#1C1A17]" style={{ fontFamily: 'Manrope' }}>{city.city}</text>
                      {/* Temp label */}
                      <text x={pos.x + 14} y={pos.y + 4} className="text-[8px] fill-[#5C5852]">{city.weather?.temperature}°</text>
                    </g>
                  );
                })}
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-[#E3DFD8]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[#5C5852] mb-2">Severity</p>
                <div className="space-y-1.5">
                  {Object.entries(SEVERITY_COLORS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: val.bg }} />
                      <span className="text-[10px] text-[#5C5852] capitalize">{val.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* City Details */}
        <div className="space-y-4">
          {selected ? (
            <CityDetailCard city={selected} onClose={() => setSelected(null)} />
          ) : (
            <Card className="border-[#E3DFD8] shadow-none">
              <CardContent className="p-6 text-center">
                <MapPin className="w-10 h-10 text-[#E3DFD8] mx-auto mb-3" />
                <p className="text-sm text-[#5C5852]">Click a city on the map to see details</p>
              </CardContent>
            </Card>
          )}

          {/* All Cities List */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">All Cities</p>
            {cities.map((city) => {
              const sev = SEVERITY_COLORS[city.severity] || SEVERITY_COLORS.none;
              return (
                <div
                  key={city.city}
                  onClick={() => setSelected(city)}
                  className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#E3DFD8] cursor-pointer hover:shadow-md transition-all duration-200"
                  data-testid={`heatmap-city-${city.city.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sev.bg }} />
                    <div>
                      <p className="text-sm font-medium text-[#1C1A17]">{city.city}</p>
                      <p className="text-[10px] text-[#5C5852] capitalize">{city.weather?.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1C1A17]">{city.weather?.temperature}°C</p>
                    <Badge className="text-[9px] rounded-full px-1.5 py-0" style={{ backgroundColor: `${sev.bg}15`, color: sev.bg }}>{sev.text}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CityDetailCard({ city, onClose }) {
  const sev = SEVERITY_COLORS[city.severity] || SEVERITY_COLORS.none;
  return (
    <Card className="border-[#E3DFD8] shadow-none" data-testid="city-detail-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{city.city}</CardTitle>
          <Badge className="rounded-full text-xs font-bold" style={{ backgroundColor: `${sev.bg}15`, color: sev.bg }}>{sev.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-[#5C5852]">{city.description}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F9F8F6] rounded-lg p-2">
            <span className="flex items-center gap-1 text-[10px] text-[#5C5852]"><Thermometer className="w-3 h-3" /> Temperature</span>
            <p className="text-sm font-bold text-[#1C1A17]">{city.weather?.temperature}°C</p>
          </div>
          <div className="bg-[#F9F8F6] rounded-lg p-2">
            <span className="flex items-center gap-1 text-[10px] text-[#5C5852]"><Droplets className="w-3 h-3" /> Rainfall</span>
            <p className="text-sm font-bold text-[#1C1A17]">{city.weather?.rainfall_mm}mm</p>
          </div>
          <div className="bg-[#F9F8F6] rounded-lg p-2">
            <span className="flex items-center gap-1 text-[10px] text-[#5C5852]"><Wind className="w-3 h-3" /> Wind</span>
            <p className="text-sm font-bold text-[#1C1A17]">{city.weather?.wind_speed_kmh}km/h</p>
          </div>
          <div className="bg-[#F9F8F6] rounded-lg p-2">
            <span className="flex items-center gap-1 text-[10px] text-[#5C5852]"><AlertTriangle className="w-3 h-3" /> Risk Level</span>
            <p className="text-sm font-bold text-[#1C1A17] capitalize">{city.risk_level}</p>
          </div>
        </div>
        <div className="text-xs text-[#5C5852]">Base premium: {'\u20B9'}{city.base_premium}/week</div>
      </CardContent>
    </Card>
  );
}
