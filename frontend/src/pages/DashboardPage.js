import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Shield, CloudRain, Thermometer, Wind, Coins, ArrowRight,
  CheckCircle, AlertTriangle, XCircle, Clock, Droplets, TrendingUp,
  Banknote, Zap, FileCheck, RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const city = user?.city || 'Chennai';
        const [summaryRes, weatherRes, analyticsRes] = await Promise.all([
          axios.get(`${API}/dashboard/summary`, { withCredentials: true }),
          axios.get(`${API}/weather/${city}`, { withCredentials: true }),
          axios.get(`${API}/analytics/earnings`, { withCredentials: true }).catch(() => ({ data: null }))
        ]);
        setSummary(summaryRes.data);
        setWeatherData(weatherRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await axios.post(`${API}/policies/renew`, {}, { withCredentials: true });
      window.location.reload();
    } catch (err) {
      console.error('Renew error:', err);
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
      </div>
    );
  }

  const policy = summary?.policy;
  const hasPolicy = summary?.has_active_policy;
  const daysLeft = policy ? Math.max(0, Math.ceil((new Date(policy.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const severity = getSeverityFromWeather(weatherData?.current);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6" data-testid="rider-dashboard">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Welcome, {user?.name || 'Rider'}
          </h1>
          <p className="text-[#5C5852] text-base mt-1">
            {hasPolicy ? 'Your coverage is active. Stay safe on the road.' : 'Subscribe to get protected today.'}
          </p>
        </div>
        <div className="flex gap-2">
          {!hasPolicy && !summary?.policy && (
            <Button data-testid="subscribe-now-btn" onClick={() => navigate('/subscribe')} className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full px-6 h-11 font-semibold">
              Subscribe Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          {!hasPolicy && summary?.policy && (
            <Button data-testid="renew-policy-btn" onClick={handleRenew} disabled={renewing} className="bg-[#E89B31] hover:bg-[#d08a2a] text-white rounded-full px-6 h-11 font-semibold">
              <RefreshCw className={`mr-2 w-4 h-4 ${renewing ? 'animate-spin' : ''}`} /> Renew Policy
            </Button>
          )}
          {hasPolicy && (
            <Button data-testid="run-triggers-btn" onClick={() => navigate('/claims')} className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full px-6 h-11 font-semibold">
              <Zap className="mr-2 w-4 h-4" /> Run Trigger Check
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Payouts', value: `\u20B9${summary?.total_payout || 0}`, icon: Banknote, color: '#4A7C59' },
          { label: 'Claims', value: `${summary?.approved_claims || 0}/${summary?.total_claims || 0}`, icon: FileCheck, color: '#D95D39' },
          { label: 'Coins Earned', value: summary?.total_coins_earned || 0, icon: Coins, color: '#E89B31' },
          { label: 'Wallet Balance', value: `\u20B9${summary?.wallet_balance || 0}`, icon: TrendingUp, color: '#2D6A85' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid={`dash-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#5C5852]">{label}</p>
                  <p className="text-xl font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Policy Status */}
        <Card className="md:col-span-2 border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid="policy-status-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <Shield className="w-5 h-5 text-[#D95D39]" />
                Policy Status
              </CardTitle>
              <Badge data-testid="policy-status-badge" className={hasPolicy ? 'bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20 rounded-full' : 'bg-[#E89B31]/10 text-[#E89B31] border-[#E89B31]/20 rounded-full'}>
                {hasPolicy ? 'Active' : 'No Coverage'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {hasPolicy && policy ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoCell label="Policy ID" value={policy.policy_id} />
                  <InfoCell label="Premium Paid" value={`\u20B9${policy.premium}/week`} />
                  <InfoCell label="City" value={policy.city} capitalize />
                  <InfoCell label="Days Left" value={`${daysLeft} days`} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#5C5852] mb-1">
                    <span>Coverage Period</span>
                    <span>{daysLeft}/7 days remaining</span>
                  </div>
                  <Progress value={(daysLeft / 7) * 100} className="h-2 bg-[#EBE8E3]" />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="w-12 h-12 text-[#E3DFD8] mx-auto mb-3" />
                <p className="text-[#5C5852] text-sm">No active policy</p>
                <Button data-testid="subscribe-cta-btn" onClick={() => navigate('/subscribe')} className="mt-3 bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full text-sm">
                  Get Protected
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Wallet */}
        <Card className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-br from-[#F9F8F6] to-[#EBE8E3]" data-testid="reward-wallet-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Coins className="w-5 h-5 text-[#E89B31]" />
              Reward Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-[#D95D39]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {summary?.available_coins || 0}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852] mt-1">Available Coins</p>
              <div className="mt-4 pt-3 border-t border-[#E3DFD8] space-y-1">
                <div className="flex justify-between text-xs text-[#5C5852]">
                  <span>Cash Value</span>
                  <span className="font-semibold text-[#4A7C59]">{'\u20B9'}{summary?.cash_value || '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs text-[#5C5852]">
                  <span>Total Earned</span>
                  <span className="font-medium">{summary?.total_coins_earned || 0}</span>
                </div>
              </div>
              <Button data-testid="view-rewards-btn" onClick={() => navigate('/rewards')} variant="outline" className="mt-3 rounded-full text-xs border-[#E3DFD8] w-full">
                View Rewards <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Weather */}
        <Card className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid="weather-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <CloudRain className="w-5 h-5 text-[#2D6A85]" />
              Live Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherData?.current ? (
              <div className="space-y-3">
                <WeatherRow icon={null} label="Condition" value={weatherData.current.description} capitalize />
                <WeatherRow icon={Thermometer} label="Temp" value={`${weatherData.current.temperature}°C`} />
                <WeatherRow icon={Droplets} label="Rain" value={`${weatherData.current.rainfall_mm} mm`} />
                <WeatherRow icon={Wind} label="Wind" value={`${weatherData.current.wind_speed_kmh} km/h`} />
              </div>
            ) : <p className="text-sm text-[#5C5852]">Loading...</p>}
          </CardContent>
        </Card>

        {/* Risk & Severity */}
        <Card className="md:col-span-2 border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid="risk-severity-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <AlertTriangle className="w-5 h-5 text-[#E89B31]" />
              Risk & Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F9F8F6] rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Current Severity</p>
                <div className="mt-2 flex items-center gap-2">
                  {severity.icon}
                  <span className={`text-lg font-bold ${severity.color}`}>{severity.level}</span>
                </div>
                <p className="text-xs text-[#5C5852] mt-1">{severity.description}</p>
              </div>
              <div className="bg-[#F9F8F6] rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">System Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse" />
                  <span className="text-sm font-medium text-[#4A7C59]">Monitoring</span>
                </div>
                <p className="text-xs text-[#5C5852] mt-1">Real-time data collection active</p>
              </div>
            </div>
            {/* Processing Pipeline */}
            <div className="mt-4 pt-4 border-t border-[#E3DFD8]" data-testid="processing-pipeline">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852] mb-3">Auto Processing Pipeline</p>
              <div className="flex items-center gap-2 flex-wrap">
                {['Data Received', 'Severity Calc', 'Fraud Check', 'Decision', 'Payout/Reward'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      i < 2 ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-[#EBE8E3] text-[#5C5852]'
                    }`}>
                      {i < 2 ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {step}
                    </div>
                    {i < 4 && <ArrowRight className="w-3 h-3 text-[#E3DFD8]" />}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card className="md:col-span-2 border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid="recent-claims-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <FileCheck className="w-5 h-5 text-[#D95D39]" />
                Recent Claims
              </CardTitle>
              <Button data-testid="view-all-claims-btn" onClick={() => navigate('/claims')} variant="ghost" className="text-[#D95D39] text-xs rounded-full">
                View All <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {summary?.recent_claims?.length > 0 ? (
              <div className="space-y-2">
                {summary.recent_claims.map((claim) => (
                  <div key={claim.claim_id} className="flex items-center justify-between p-2 bg-[#F9F8F6] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className={`rounded-full text-[10px] ${claim.status === 'approved' ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-[#C44536]/10 text-[#C44536]'}`}>
                        {claim.status}
                      </Badge>
                      <span className="text-xs text-[#1C1A17] font-medium">{claim.claim_id}</span>
                    </div>
                    {claim.payout > 0 && <span className="text-sm font-bold text-[#4A7C59]">+{'\u20B9'}{claim.payout}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#5C5852] text-center py-4">No claims yet. Use trigger evaluation to auto-process.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings Charts */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="earnings-charts">
          {/* Earnings Line Chart */}
          <Card className="border-[#E3DFD8] shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <TrendingUp className="w-4 h-4 text-[#4A7C59]" /> 7-Day Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.daily_earnings}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5C5852' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#5C5852' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E3DFD8', fontSize: 12 }} />
                  <Line type="monotone" dataKey="expected" stroke="#4A7C59" strokeWidth={2} dot={false} name="Expected" />
                  <Line type="monotone" dataKey="actual" stroke="#D95D39" strokeWidth={2} dot={false} name="Actual" />
                  <Line type="monotone" dataKey="payout" stroke="#2D6A85" strokeWidth={2} dot={false} name="Payout" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-[10px] text-[#5C5852] justify-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A7C59]" /> Expected</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D95D39]" /> Actual</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2D6A85]" /> Payout</span>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Bar Chart + Claim Pie */}
          <Card className="border-[#E3DFD8] shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <Coins className="w-4 h-4 text-[#E89B31]" /> Coins & Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#5C5852] mb-1 text-center">Coins per Day</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={analytics.daily_earnings}>
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#5C5852' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E3DFD8', fontSize: 11 }} />
                      <Bar dataKey="coins" fill="#E89B31" radius={[4, 4, 0, 0]} name="Coins" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] text-[#5C5852] mb-1">Claims Status</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Approved', value: analytics.claim_distribution.approved || 0 },
                        { name: 'Rejected', value: analytics.claim_distribution.rejected || 0 }
                      ]} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                        <Cell fill="#4A7C59" />
                        <Cell fill="#C44536" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E3DFD8', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 text-[10px] text-[#5C5852]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A7C59]" /> Approved</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C44536]" /> Rejected</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#E3DFD8] flex justify-between text-xs">
                <span className="text-[#5C5852]">Premium vs Payout ROI:</span>
                <span className="font-bold text-[#4A7C59]">{analytics.roi}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, capitalize }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">{label}</p>
      <p className={`text-sm font-medium text-[#1C1A17] mt-1 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

function WeatherRow({ icon: Icon, label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 text-xs text-[#5C5852]">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </span>
      <span className={`text-sm font-medium text-[#1C1A17] ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

function getSeverityFromWeather(current) {
  if (!current) return { level: 'None', color: 'text-[#4A7C59]', description: 'No data', icon: <CheckCircle className="w-5 h-5 text-[#4A7C59]" /> };
  const rain = current.rainfall_mm || 0;
  const wind = current.wind_speed_kmh || 0;
  if (rain >= 70 && wind >= 40) return { level: 'Extreme', color: 'text-[#C44536]', description: 'Cyclone-level conditions', icon: <XCircle className="w-5 h-5 text-[#C44536]" /> };
  if (rain >= 50) return { level: 'High', color: 'text-[#D95D39]', description: 'Heavy rainfall detected', icon: <AlertTriangle className="w-5 h-5 text-[#D95D39]" /> };
  if (rain >= 30) return { level: 'Moderate', color: 'text-[#E89B31]', description: 'Significant rain activity', icon: <AlertTriangle className="w-5 h-5 text-[#E89B31]" /> };
  return { level: 'None', color: 'text-[#4A7C59]', description: 'Conditions are clear', icon: <CheckCircle className="w-5 h-5 text-[#4A7C59]" /> };
}
