import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Shield, CloudRain, Zap, CheckCircle, XCircle, AlertTriangle, Loader2,
  ArrowRight, Clock, Brain, FileCheck, Banknote, BarChart3, RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [totalPayout, setTotalPayout] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [testScenario, setTestScenario] = useState('current');
  const [triggerHistory, setTriggerHistory] = useState([]);

  const TEST_SCENARIOS = {
    current: { label: 'Live Weather', weather: null },
    heavy_rain: { label: 'Heavy Rain', weather: { rainfall_mm: 55, wind_speed_kmh: 25, temperature: 26, humidity: 90, description: 'heavy rain' } },
    cyclone: { label: 'Cyclone', weather: { rainfall_mm: 85, wind_speed_kmh: 55, temperature: 24, humidity: 95, description: 'cyclone conditions' } },
    extreme_heat: { label: 'Extreme Heat', weather: { rainfall_mm: 0, wind_speed_kmh: 8, temperature: 43, humidity: 30, description: 'extreme heat' } },
    traffic_heat: { label: 'Traffic + Heat', weather: { rainfall_mm: 5, wind_speed_kmh: 5, temperature: 41, humidity: 45, description: 'hot and congested' } },
    moderate_rain: { label: 'Moderate Rain', weather: { rainfall_mm: 35, wind_speed_kmh: 15, temperature: 28, humidity: 80, description: 'moderate rain' } },
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [claimsRes, triggersRes] = await Promise.all([
        axios.get(`${API}/claims/history`, { withCredentials: true }),
        axios.get(`${API}/triggers/history`, { withCredentials: true })
      ]);
      setClaims(claimsRes.data.claims || []);
      setTotalPayout(claimsRes.data.total_payout || 0);
      setApprovedCount(claimsRes.data.approved_count || 0);
      setTriggerHistory(triggersRes.data.triggers || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runTriggerEvaluation = async () => {
    setEvaluating(true);
    setTriggerResult(null);
    try {
      const scenario = TEST_SCENARIOS[testScenario];
      const body = { city: user?.city || 'Chennai' };
      if (scenario.weather) body.manual_weather = scenario.weather;
      
      const res = await axios.post(`${API}/triggers/evaluate`, body, { withCredentials: true });
      setTriggerResult(res.data);
      setShowResult(true);
      fetchData(); // Refresh history
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      setTriggerResult({ error: msg });
      setShowResult(true);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6" data-testid="claims-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Claims & Triggers
          </h1>
          <p className="text-[#5C5852] text-base mt-1">
            Automated insurance claims — zero-touch processing
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Payouts', value: `\u20B9${totalPayout}`, icon: Banknote, color: '#4A7C59' },
          { label: 'Claims Made', value: claims.length, icon: FileCheck, color: '#D95D39' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle, color: '#4A7C59' },
          { label: 'Triggers Evaluated', value: triggerHistory.length, icon: BarChart3, color: '#2D6A85' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">{label}</p>
                  <p className="text-xl font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trigger Evaluation Panel */}
      <Card className="border-[#D95D39] border-2 shadow-none" data-testid="trigger-evaluation-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <Zap className="w-5 h-5 text-[#D95D39]" />
            Run Trigger Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#5C5852]">
            Evaluate current conditions against parametric triggers. Use live weather or test scenarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={testScenario} onValueChange={setTestScenario}>
              <SelectTrigger data-testid="scenario-select" className="border-[#E3DFD8] sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEST_SCENARIOS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              data-testid="evaluate-trigger-btn"
              onClick={runTriggerEvaluation}
              disabled={evaluating}
              className="bg-[#D95D39] hover:bg-[#C24D2C] text-white rounded-full font-semibold px-6"
            >
              {evaluating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</> : <><Zap className="w-4 h-4 mr-2" /> Evaluate Triggers</>}
            </Button>
          </div>
          {testScenario !== 'current' && TEST_SCENARIOS[testScenario].weather && (
            <div className="bg-[#F9F8F6] rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <span><strong>Rain:</strong> {TEST_SCENARIOS[testScenario].weather.rainfall_mm}mm</span>
              <span><strong>Wind:</strong> {TEST_SCENARIOS[testScenario].weather.wind_speed_kmh}km/h</span>
              <span><strong>Temp:</strong> {TEST_SCENARIOS[testScenario].weather.temperature}°C</span>
              <span><strong>Condition:</strong> {TEST_SCENARIOS[testScenario].weather.description}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Claims History / Trigger History */}
      <Tabs defaultValue="claims" className="w-full">
        <TabsList className="bg-[#EBE8E3] mb-4">
          <TabsTrigger value="claims" data-testid="tab-claims" className="data-[state=active]:bg-white data-[state=active]:text-[#D95D39]">
            Claims History
          </TabsTrigger>
          <TabsTrigger value="triggers" data-testid="tab-triggers" className="data-[state=active]:bg-white data-[state=active]:text-[#D95D39]">
            Trigger Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          {claims.length === 0 ? (
            <Card className="border-[#E3DFD8] shadow-none">
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-[#E3DFD8] mx-auto mb-3" />
                <p className="text-[#5C5852] text-sm">No claims yet. Run a trigger evaluation to auto-process claims.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <ClaimCard key={claim.claim_id} claim={claim} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="triggers">
          {triggerHistory.length === 0 ? (
            <Card className="border-[#E3DFD8] shadow-none">
              <CardContent className="text-center py-12">
                <Zap className="w-12 h-12 text-[#E3DFD8] mx-auto mb-3" />
                <p className="text-[#5C5852] text-sm">No triggers evaluated yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {triggerHistory.map((trigger) => (
                <TriggerCard key={trigger.trigger_id} trigger={trigger} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trigger Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="trigger-result-dialog">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Trigger Evaluation Result</DialogTitle>
            <DialogDescription>Auto-processed by GigInsure AI Engine</DialogDescription>
          </DialogHeader>
          {triggerResult && !triggerResult.error ? (
            <div className="space-y-4">
              {/* Decision */}
              <div className={`p-4 rounded-xl border ${
                triggerResult.decision === 'insurance_payout' ? 'bg-[#D95D39]/5 border-[#D95D39]/20' :
                triggerResult.decision === 'reward_coins' ? 'bg-[#E89B31]/5 border-[#E89B31]/20' :
                triggerResult.decision === 'partial_insurance' ? 'bg-[#2D6A85]/5 border-[#2D6A85]/20' :
                'bg-[#F9F8F6] border-[#E3DFD8]'
              }`}>
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#5C5852]">Decision</p>
                <p className="text-lg font-bold text-[#1C1A17] mt-1 capitalize" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {triggerResult.decision?.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Weather Severity */}
              <div className="bg-[#F9F8F6] rounded-xl p-3">
                <p className="text-xs font-semibold text-[#5C5852] mb-2">Weather Severity</p>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={triggerResult.weather_severity?.severity} />
                  <span className="text-sm text-[#1C1A17]">{triggerResult.weather_severity?.description}</span>
                </div>
              </div>

              {/* AI Assessment */}
              {triggerResult.ai_assessment && (
                <div className="bg-[#2D6A85]/5 rounded-xl p-3 border border-[#2D6A85]/10">
                  <p className="text-xs font-semibold text-[#2D6A85] flex items-center gap-1 mb-1">
                    <Brain className="w-3 h-3" /> AI Assessment
                  </p>
                  <p className="text-xs text-[#5C5852]">{triggerResult.ai_assessment?.assessment}</p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span>Risk: <strong>{triggerResult.ai_assessment?.risk_score}/100</strong></span>
                    <span>Income Loss: <strong>{triggerResult.ai_assessment?.income_loss_pct}%</strong></span>
                  </div>
                </div>
              )}

              {/* Claim Result */}
              {triggerResult.claim && (
                <div className={`rounded-xl p-3 border ${triggerResult.claim.status === 'approved' ? 'bg-[#4A7C59]/5 border-[#4A7C59]/20' : 'bg-[#C44536]/5 border-[#C44536]/20'}`}>
                  <p className="text-xs font-semibold mb-2" style={{ color: triggerResult.claim.status === 'approved' ? '#4A7C59' : '#C44536' }}>
                    {triggerResult.claim.status === 'approved' ? 'Claim Approved' : 'Claim Rejected'}
                  </p>
                  {triggerResult.claim.status === 'approved' && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-[#5C5852]">
                      <div><span className="block text-[10px] uppercase">Expected</span><strong>{'\u20B9'}{triggerResult.claim.expected_earnings}</strong></div>
                      <div><span className="block text-[10px] uppercase">Actual</span><strong>{'\u20B9'}{triggerResult.claim.actual_earnings}</strong></div>
                      <div><span className="block text-[10px] uppercase">Payout</span><strong className="text-[#4A7C59]">{'\u20B9'}{triggerResult.claim.payout}</strong></div>
                    </div>
                  )}
                  {triggerResult.claim.status === 'rejected' && (
                    <p className="text-xs text-[#C44536]">{triggerResult.claim.reason}</p>
                  )}
                </div>
              )}

              {/* Reward Result */}
              {triggerResult.reward && (
                <div className="bg-[#E89B31]/5 rounded-xl p-3 border border-[#E89B31]/20">
                  <p className="text-xs font-semibold text-[#E89B31] mb-1">Rewards Earned</p>
                  <p className="text-lg font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>+{triggerResult.reward.total_coins} coins</p>
                  <div className="mt-1 space-y-1">
                    {triggerResult.reward.triggers?.map((t, i) => (
                      <p key={i} className="text-xs text-[#5C5852]">+{t.coins} — {t.detail}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Steps */}
              {triggerResult.claim?.processing_steps && (
                <div>
                  <p className="text-xs font-semibold text-[#5C5852] mb-2">Processing Pipeline</p>
                  <div className="space-y-1">
                    {triggerResult.claim.processing_steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-[#4A7C59]" />
                        <span className="text-[#1C1A17]">{step.step}</span>
                        {step.result && <Badge className="rounded-full bg-[#EBE8E3] text-[#5C5852] text-[10px]">{step.result}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : triggerResult?.error ? (
            <div className="text-center py-6">
              <AlertTriangle className="w-10 h-10 text-[#E89B31] mx-auto" />
              <p className="text-sm text-[#5C5852] mt-3">{triggerResult.error}</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    extreme: { bg: 'bg-[#C44536]/10', text: 'text-[#C44536]', label: 'Extreme' },
    high: { bg: 'bg-[#D95D39]/10', text: 'text-[#D95D39]', label: 'High' },
    moderate: { bg: 'bg-[#E89B31]/10', text: 'text-[#E89B31]', label: 'Moderate' },
    none: { bg: 'bg-[#4A7C59]/10', text: 'text-[#4A7C59]', label: 'None' },
  };
  const s = map[severity] || map.none;
  return <Badge className={`${s.bg} ${s.text} rounded-full text-xs font-bold`}>{s.label}</Badge>;
}

function ClaimCard({ claim }) {
  const isApproved = claim.status === 'approved';
  return (
    <Card className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200" data-testid={`claim-${claim.claim_id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1C1A17]">{claim.claim_id}</span>
            <Badge className={`rounded-full text-xs ${isApproved ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-[#C44536]/10 text-[#C44536]'}`}>
              {isApproved ? 'Approved' : 'Rejected'}
            </Badge>
            {claim.severity && <SeverityBadge severity={claim.severity} />}
          </div>
          {isApproved && (
            <span className="text-lg font-bold text-[#4A7C59]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              +{'\u20B9'}{claim.payout}
            </span>
          )}
        </div>
        {isApproved && (
          <div className="flex gap-4 text-xs text-[#5C5852]">
            <span>Expected: {'\u20B9'}{claim.expected_earnings}</span>
            <span>Actual: {'\u20B9'}{claim.actual_earnings}</span>
            <span>Loss: {'\u20B9'}{claim.income_loss}</span>
            <span>Factor: {claim.severity_factor}x</span>
          </div>
        )}
        {!isApproved && <p className="text-xs text-[#C44536]">{claim.reason}</p>}
        <p className="text-[10px] text-[#5C5852] mt-2">{new Date(claim.timestamp).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function TriggerCard({ trigger }) {
  return (
    <Card className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200" data-testid={`trigger-${trigger.trigger_id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1C1A17]">{trigger.trigger_id}</span>
            <SeverityBadge severity={trigger.weather_severity?.severity} />
            <Badge className="rounded-full bg-[#EBE8E3] text-[#5C5852] text-xs capitalize">{trigger.decision?.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-[#5C5852]">
          <span>Rain: {trigger.weather_data?.rainfall_mm || 0}mm</span>
          <span>Wind: {trigger.weather_data?.wind_speed_kmh || 0}km/h</span>
          <span>Temp: {trigger.weather_data?.temperature || 0}°C</span>
          <span>Traffic: {trigger.traffic_delay_factor}x</span>
        </div>
        <p className="text-[10px] text-[#5C5852] mt-2">{new Date(trigger.timestamp).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
