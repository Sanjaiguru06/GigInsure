import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { policies, wallet, weather } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  Shield, CloudRain, Thermometer, Wind, Coins, ArrowRight,
  CheckCircle, AlertTriangle, XCircle, Clock, Droplets, TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePolicy, setActivePolicy] = useState(null);
  const [hasPolicy, setHasPolicy] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policyRes, walletRes] = await Promise.all([
          policies.getActive(),
          wallet.get()
        ]);
        setHasPolicy(policyRes.data.has_active_policy);
        setActivePolicy(policyRes.data.policy);
        setWalletData(walletRes.data);

        const city = user?.city || 'Chennai';
        const weatherRes = await weather.get(city);
        setWeatherData(weatherRes.data);
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
      </div>
    );
  }

  const daysLeft = activePolicy ? Math.max(0, Math.ceil((new Date(activePolicy.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const severity = getSeverityFromWeather(weatherData?.current);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6" data-testid="rider-dashboard">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Welcome, {user?.name || 'Rider'}
          </h1>
          <p className="text-[#5C5852] text-base mt-1">
            {hasPolicy ? 'Your coverage is active. Stay safe on the road.' : 'Subscribe to get protected today.'}
          </p>
        </div>
        {!hasPolicy && (
          <Button
            data-testid="subscribe-now-btn"
            onClick={() => navigate('/subscribe')}
            className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full px-6 h-11 font-semibold"
          >
            Subscribe Now <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Policy Status Card */}
        <Card className="md:col-span-2 border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid="policy-status-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <Shield className="w-5 h-5 text-[#D95D39]" />
                Policy Status
              </CardTitle>
              <Badge
                data-testid="policy-status-badge"
                className={hasPolicy ? 'bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20 rounded-full' : 'bg-[#E89B31]/10 text-[#E89B31] border-[#E89B31]/20 rounded-full'}
              >
                {hasPolicy ? 'Active' : 'No Coverage'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {hasPolicy && activePolicy ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Policy ID</p>
                    <p className="text-sm font-medium text-[#1C1A17] mt-1">{activePolicy.policy_id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Premium Paid</p>
                    <p className="text-sm font-medium text-[#1C1A17] mt-1">{'\u20B9'}{activePolicy.premium}/week</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">City</p>
                    <p className="text-sm font-medium text-[#1C1A17] mt-1 capitalize">{activePolicy.city}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Days Left</p>
                    <p className="text-sm font-medium text-[#1C1A17] mt-1">{daysLeft} days</p>
                  </div>
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
                <p className="text-[#5C5852] text-sm">You don't have an active policy</p>
                <Button
                  data-testid="subscribe-cta-btn"
                  onClick={() => navigate('/subscribe')}
                  className="mt-3 bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full text-sm"
                >
                  Get Protected
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Wallet Card */}
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
                {walletData?.available_coins || 0}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852] mt-1">Available Coins</p>
              <div className="mt-4 pt-3 border-t border-[#E3DFD8]">
                <div className="flex justify-between text-xs text-[#5C5852]">
                  <span>Cash Value</span>
                  <span className="font-semibold text-[#4A7C59]">{'\u20B9'}{walletData?.cash_value || '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs text-[#5C5852] mt-1">
                  <span>Total Earned</span>
                  <span className="font-medium">{walletData?.total_coins || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Card */}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Condition</span>
                  <span className="text-sm font-medium text-[#1C1A17] capitalize">{weatherData.current.description}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#5C5852]"><Thermometer className="w-3 h-3" /> Temp</span>
                  <span className="text-sm font-medium text-[#1C1A17]">{weatherData.current.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#5C5852]"><Droplets className="w-3 h-3" /> Rain</span>
                  <span className="text-sm font-medium text-[#1C1A17]">{weatherData.current.rainfall_mm} mm</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#5C5852]"><Wind className="w-3 h-3" /> Wind</span>
                  <span className="text-sm font-medium text-[#1C1A17]">{weatherData.current.wind_speed_kmh} km/h</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#5C5852]">Loading weather...</p>
            )}
          </CardContent>
        </Card>

        {/* Risk & Severity Panel */}
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
            {/* Auto Processing Pipeline */}
            <div className="mt-4 pt-4 border-t border-[#E3DFD8]" data-testid="processing-pipeline">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852] mb-3">Auto Processing Pipeline</p>
              <div className="flex items-center gap-2 flex-wrap">
                {['Data Received', 'Severity Calc', 'Fraud Check', 'Decision', 'Payout'].map((step, i) => (
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

        {/* Coverage Details */}
        <Card className="md:col-span-2 border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200 hover:-translate-y-0.5" data-testid="coverage-details-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <TrendingUp className="w-5 h-5 text-[#4A7C59]" />
              What's Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#F9F8F6] rounded-xl">
                <div className="w-8 h-8 bg-[#2D6A85]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CloudRain className="w-4 h-4 text-[#2D6A85]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1A17]">Major Disruption Insurance</p>
                  <p className="text-xs text-[#5C5852] mt-0.5">Heavy rain, cyclone — automatic payout based on income loss</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#F9F8F6] rounded-xl">
                <div className="w-8 h-8 bg-[#E89B31]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Coins className="w-4 h-4 text-[#E89B31]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1A17]">Minor Disruption Rewards</p>
                  <p className="text-xs text-[#5C5852] mt-0.5">Traffic delays, extreme heat — earn coins redeemable for cash</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getSeverityFromWeather(current) {
  if (!current) return { level: 'None', color: 'text-[#4A7C59]', description: 'No weather data', icon: <CheckCircle className="w-5 h-5 text-[#4A7C59]" /> };
  const rain = current.rainfall_mm || 0;
  const wind = current.wind_speed_kmh || 0;
  
  if (rain >= 70 && wind >= 40) return { level: 'Extreme', color: 'text-[#C44536]', description: 'Cyclone-level conditions', icon: <XCircle className="w-5 h-5 text-[#C44536]" /> };
  if (rain >= 50) return { level: 'High', color: 'text-[#D95D39]', description: 'Heavy rainfall detected', icon: <AlertTriangle className="w-5 h-5 text-[#D95D39]" /> };
  if (rain >= 30) return { level: 'Moderate', color: 'text-[#E89B31]', description: 'Significant rain activity', icon: <AlertTriangle className="w-5 h-5 text-[#E89B31]" /> };
  return { level: 'None', color: 'text-[#4A7C59]', description: 'Conditions are clear', icon: <CheckCircle className="w-5 h-5 text-[#4A7C59]" /> };
}
