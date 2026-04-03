import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, Shield, FileCheck, Banknote, AlertTriangle, MapPin, TrendingUp, Coins } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [riders, setRiders] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, ridersRes, activityRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/riders`, { withCredentials: true }),
        axios.get(`${API}/admin/recent-activity`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setRiders(ridersRes.data.riders || []);
      setActivity(activityRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin w-8 h-8 border-2 border-[#D95D39] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6" data-testid="admin-dashboard">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Admin Dashboard
        </h1>
        <p className="text-[#5C5852] text-base mt-1">System monitoring & analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Riders', value: stats?.total_riders || 0, icon: Users, color: '#2D6A85' },
          { label: 'Active Policies', value: stats?.active_policies || 0, icon: Shield, color: '#4A7C59' },
          { label: 'Total Claims', value: stats?.total_claims || 0, icon: FileCheck, color: '#D95D39' },
          { label: 'Total Payouts', value: `\u20B9${stats?.total_payouts || 0}`, icon: Banknote, color: '#4A7C59' },
          { label: 'Premiums Collected', value: `\u20B9${stats?.total_premiums || 0}`, icon: TrendingUp, color: '#2D6A85' },
          { label: 'Approved Claims', value: stats?.approved_claims || 0, icon: FileCheck, color: '#4A7C59' },
          { label: 'Fraud Rate', value: `${stats?.fraud_rate || 0}%`, icon: AlertTriangle, color: '#E89B31' },
          { label: 'Total Triggers', value: stats?.total_triggers || 0, icon: Coins, color: '#D95D39' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-[#E3DFD8] shadow-none hover:shadow-lg hover:shadow-[#EBE8E3] transition-all duration-200" data-testid={`admin-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#5C5852]">{label}</p>
                  <p className="text-lg font-bold text-[#1C1A17]" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="riders" className="w-full">
        <TabsList className="bg-[#EBE8E3]">
          <TabsTrigger value="riders" data-testid="admin-tab-riders" className="data-[state=active]:bg-white data-[state=active]:text-[#D95D39]">Riders</TabsTrigger>
          <TabsTrigger value="cities" data-testid="admin-tab-cities" className="data-[state=active]:bg-white data-[state=active]:text-[#D95D39]">Cities</TabsTrigger>
          <TabsTrigger value="activity" data-testid="admin-tab-activity" className="data-[state=active]:bg-white data-[state=active]:text-[#D95D39]">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="riders">
          <Card className="border-[#E3DFD8] shadow-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E3DFD8] bg-[#F9F8F6]">
                      <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold text-[#5C5852]">Name</th>
                      <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold text-[#5C5852]">Email</th>
                      <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold text-[#5C5852]">City</th>
                      <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold text-[#5C5852]">Coins</th>
                      <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold text-[#5C5852]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.map((rider, i) => (
                      <tr key={i} className="border-b border-[#E3DFD8] hover:bg-[#F9F8F6]">
                        <td className="p-3 font-medium text-[#1C1A17]">{rider.name}</td>
                        <td className="p-3 text-[#5C5852]">{rider.email}</td>
                        <td className="p-3 text-[#5C5852] capitalize">{rider.city}</td>
                        <td className="p-3 text-[#E89B31] font-medium">{rider.reward_coins || 0}</td>
                        <td className="p-3">
                          <Badge className={`rounded-full text-[10px] ${rider.activity_status === 'active' ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-[#EBE8E3] text-[#5C5852]'}`}>
                            {rider.activity_status || 'offline'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats?.city_stats?.map((cs) => (
              <Card key={cs.city} className="border-[#E3DFD8] shadow-none">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-5 h-5 mx-auto mb-1" style={{ color: cs.risk === 'high' ? '#C44536' : cs.risk === 'medium' ? '#E89B31' : '#4A7C59' }} />
                  <p className="text-sm font-semibold text-[#1C1A17]">{cs.city}</p>
                  <Badge className={`rounded-full text-[10px] mt-1 ${cs.risk === 'high' ? 'bg-[#C44536]/10 text-[#C44536]' : cs.risk === 'medium' ? 'bg-[#E89B31]/10 text-[#E89B31]' : 'bg-[#4A7C59]/10 text-[#4A7C59]'}`}>
                    {cs.risk} risk
                  </Badge>
                  <p className="text-xs text-[#5C5852] mt-1">{cs.policies} policies</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-2">
            {activity?.recent_claims?.map((claim) => (
              <div key={claim.claim_id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#E3DFD8]">
                <div className="flex items-center gap-2">
                  <Badge className={`rounded-full text-[10px] ${claim.status === 'approved' ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-[#C44536]/10 text-[#C44536]'}`}>{claim.status}</Badge>
                  <span className="text-sm text-[#1C1A17]">{claim.claim_id}</span>
                  {claim.severity && <Badge className="rounded-full bg-[#EBE8E3] text-[#5C5852] text-[9px]">{claim.severity}</Badge>}
                </div>
                {claim.payout > 0 && <span className="text-sm font-bold text-[#4A7C59]">{'\u20B9'}{claim.payout}</span>}
              </div>
            ))}
            {(!activity?.recent_claims || activity.recent_claims.length === 0) && (
              <p className="text-sm text-[#5C5852] text-center py-4">No recent activity</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
