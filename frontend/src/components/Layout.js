import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from './ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Shield, LayoutDashboard, CreditCard, LogOut, Menu, Zap, Coins, Map, Activity, Receipt, Settings } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const NAV_ITEMS = isAdmin ? [
    { path: '/admin', label: 'Admin', icon: Settings },
    { path: '/heatmap', label: 'Heatmap', icon: Map },
  ] : [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/subscribe', label: 'Subscribe', icon: CreditCard },
    { path: '/claims', label: 'Claims', icon: Zap },
    { path: '/rewards', label: 'Rewards', icon: Coins },
    { path: '/heatmap', label: 'Heatmap', icon: Map },
  ];

  const MORE_ITEMS = isAdmin ? [] : [
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/payments', label: 'Payments', icon: Receipt },
  ];

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <header className="bg-white/70 backdrop-blur-xl border-b border-[#E3DFD8] z-50 sticky top-0" data-testid="main-header">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="w-6 h-6 text-[#D95D39]" />
            <span className="text-lg font-extrabold text-[#1C1A17] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>GigInsure</span>
            {isAdmin && <span className="text-[10px] bg-[#D95D39]/10 text-[#D95D39] font-bold px-2 py-0.5 rounded-full">ADMIN</span>}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button variant="ghost" data-testid={`nav-${label.toLowerCase()}`} className={`text-sm font-medium rounded-lg px-3 h-9 ${location.pathname === path ? 'bg-[#D95D39]/10 text-[#D95D39]' : 'text-[#5C5852] hover:text-[#1C1A17] hover:bg-[#EBE8E3]'}`}>
                  <Icon className="w-4 h-4 mr-1.5" />{label}
                </Button>
              </Link>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" data-testid="user-menu-trigger" className="h-9 px-2 text-[#5C5852] hover:text-[#1C1A17]">
                <div className="w-7 h-7 rounded-full bg-[#D95D39] text-white flex items-center justify-center text-xs font-bold mr-2">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{user?.name || 'User'}</span>
                <Menu className="w-4 h-4 ml-1 sm:hidden" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[#1C1A17]">{user?.name}</p>
                <p className="text-xs text-[#5C5852]">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              {/* Mobile nav */}
              <div className="md:hidden">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                  <DropdownMenuItem key={path} onClick={() => navigate(path)}><Icon className="w-4 h-4 mr-2" />{label}</DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              {MORE_ITEMS.map(({ path, label, icon: Icon }) => (
                <DropdownMenuItem key={path} onClick={() => navigate(path)}><Icon className="w-4 h-4 mr-2" />{label}</DropdownMenuItem>
              ))}
              {MORE_ITEMS.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={handleLogout} data-testid="logout-button" className="text-[#C44536]"><LogOut className="w-4 h-4 mr-2" />Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
