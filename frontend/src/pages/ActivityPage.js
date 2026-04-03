import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Activity, Wifi, WifiOff, MapPin, Clock, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ActivityPage() {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => { fetchActivity(); }, []);

  const fetchActivity = async () => {
    try {
      const res = await axios.get(`${API}/activity/status`, { withCredentials: true });
      setActivityData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const simulateActivity = async (status) => {
    setSimulating(true);
    try {
      await axios.post(`${API}/activity/simulate`, { status }, { withCredentials: true });
      fetchActivity();
    } catch (err) { console.error(err); }
    finally { setSimulating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
    </div>
  );

  const STATUS_MAP = {
    active: { color: '#4A7C59', bg: '#4A7C59', icon: Wifi, label: 'Active' },
    idle: { color: '#E89B31', bg: '#E89B31', icon: Clock, label: 'Idle' },
    offline: { color: '#5C5852', bg: '#5C5852', icon: WifiOff, label: 'Offline' },
  };
  const current = STATUS_MAP[activityData?.current_status] || STATUS_MAP.offline;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6" data-testid="activity-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Activity Tracking
        </h1>
        <p className="text-[#5C5852] text-base mt-1">Intent-to-work verification & session monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Status */}
        <Card className="border-[#E3DFD8] shadow-none" data-testid="activity-status-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Activity className="w-5 h-5 text-[#D95D39]" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${current.bg}15` }}>
              <current.icon className="w-8 h-8" style={{ color: current.color }} />
            </div>
            <Badge className="rounded-full text-sm px-4 py-1 font-bold" style={{ backgroundColor: `${current.bg}15`, color: current.color }}>
              {current.label}
            </Badge>
            <p className="text-xs text-[#5C5852] mt-3">Last active: {activityData?.last_active ? new Date(activityData.last_active).toLocaleString() : 'Never'}</p>
          </CardContent>
        </Card>

        {/* Intent Status */}
        <Card className="border-[#E3DFD8] shadow-none" data-testid="intent-status-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Zap className="w-5 h-5 text-[#E89B31]" />
              Intent to Work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
              activityData?.intent_status === 'active' ? 'bg-[#4A7C59]/10' : 'bg-[#C44536]/10'
            }`}>
              <p className="text-2xl font-extrabold" style={{ fontFamily: 'Manrope', color: activityData?.intent_status === 'active' ? '#4A7C59' : '#C44536' }}>
                {activityData?.intent_status === 'active' ? 'YES' : 'NO'}
              </p>
            </div>
            <p className="text-xs text-[#5C5852]">
              {activityData?.intent_status === 'active'
                ? `${activityData?.recent_active_sessions} active sessions in 48h`
                : 'No activity in last 48 hours'
              }
            </p>
            <p className="text-[10px] text-[#5C5852] mt-1">Required for claim eligibility</p>
          </CardContent>
        </Card>

        {/* Simulate Activity */}
        <Card className="border-[#D95D39] border-2 shadow-none" data-testid="simulate-activity-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1C1A17] flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <MapPin className="w-5 h-5 text-[#D95D39]" />
              Simulate Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-[#5C5852] mb-2">Simulate rider activity status for demo purposes</p>
            {['active', 'idle', 'offline'].map((status) => {
              const s = STATUS_MAP[status];
              return (
                <Button
                  key={status}
                  data-testid={`simulate-${status}-btn`}
                  onClick={() => simulateActivity(status)}
                  disabled={simulating}
                  variant="outline"
                  className="w-full rounded-lg border-[#E3DFD8] justify-start gap-2"
                >
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  <span className="capitalize">{status}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="border-[#E3DFD8] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {activityData?.recent_logs?.length > 0 ? (
            <div className="space-y-2">
              {activityData.recent_logs.map((log, i) => {
                const s = STATUS_MAP[log.status] || STATUS_MAP.offline;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#F9F8F6] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.bg }} />
                      <div>
                        <p className="text-sm font-medium text-[#1C1A17] capitalize">{log.status}</p>
                        <p className="text-[10px] text-[#5C5852]">{log.movement} | Speed: {log.speed}km/h | Session: {log.session_duration}h</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#5C5852]">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#5C5852] text-center py-4">No activity logs yet. Use the simulate buttons above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
