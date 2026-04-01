import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Briefcase, 
  PieChart, 
  Activity, 
  PlaySquare, 
  History, 
  LogOut, 
  User as UserIcon,
  Users,
  ShieldAlert,
  FlaskConical,
  Settings,
  Search
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',        path: '/',            icon: <BarChart3 size={18} />,   roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
    { name: 'Asset Library',    path: '/assets',      icon: <Briefcase size={18} />,   roles: ['ADMIN', 'ANALYST'] },
    { name: 'Portfolios',       path: '/portfolios',  icon: <PieChart size={18} />,    roles: ['ADMIN', 'ANALYST'] },
    { name: 'Scenarios',        path: '/scenarios',   icon: <Activity size={18} />,    roles: ['ADMIN', 'ANALYST'] },
    { name: 'Run Simulation',   path: '/simulate',    icon: <PlaySquare size={18} />,  roles: ['ADMIN', 'ANALYST'] },
    { name: 'Sandbox',          path: '/sandbox',     icon: <FlaskConical size={18} />, roles: ['ADMIN', 'ANALYST'] },
    { name: 'Comparison',       path: '/compare',     icon: <ShieldAlert size={18} />, roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
    { name: 'Run History',      path: '/history',     icon: <History size={18} />,     roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
    { name: 'Settings',         path: '/settings',    icon: <Settings size={18} />,    roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
    { name: 'User Management',  path: '/admin/users', icon: <Users size={18} />,       roles: ['ADMIN'] },
  ];

  const initials = (user?.username || user?.full_name || 'QR').substring(0, 2).toUpperCase();

  return (
    <div className="app-container">
      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 10,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
          {/* Stock market graph logo */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #D946EF, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(217,70,239,0.35)', flexShrink: 0
          }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Grid lines */}
              <line x1="0" y1="14" x2="22" y2="14" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              <line x1="0" y1="9"  x2="22" y2="9"  stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              <line x1="0" y1="4"  x2="22" y2="4"  stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
              {/* Fill under line */}
              <path d="M1 14 L4 11 L7 13 L10 8 L13 10 L16 5 L19 3 L21 2 L21 16 L1 16 Z"
                fill="rgba(255,255,255,0.12)" />
              {/* Main price line */}
              <polyline
                points="1,14 4,11 7,13 10,8 13,10 16,5 19,3 21,2"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Dots on key highs/lows */}
              <circle cx="10" cy="8"  r="1.5" fill="#ffffff"/>
              <circle cx="16" cy="5"  r="1.5" fill="#ffffff"/>
              <circle cx="21" cy="2"  r="1.5" fill="#ffffff"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Paralucent, Poppins, sans-serif', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            QuantRisk
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="nav-animate"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '9px',
                color: isActive ? '#F5EEFF' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(217, 70, 239, 0.15)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'all 0.18s',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                textDecoration: 'none',
              })}
              onMouseOver={(e) => { if (!e.currentTarget.style.backgroundColor.includes('0.15')) { e.currentTarget.style.backgroundColor = 'rgba(217,70,239,0.07)'; e.currentTarget.style.color = '#D4B8E8'; } }}
              onMouseOut={(e) => { if (!e.currentTarget.style.backgroundColor.includes('0.15')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              <span style={{ opacity: 0.85 }}>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(217,70,239,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '8px', borderRadius: '9px', background: 'rgba(217,70,239,0.06)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #D946EF, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.875rem', color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || user?.username || 'User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {user?.role || 'ANALYST'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', background: 'transparent', border: '1px solid rgba(217,70,239,0.15)', borderRadius: '9px', color: 'var(--text-muted)', fontSize: '0.875rem', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(240,0,123,0.4)'; e.currentTarget.style.color = 'var(--status-error)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(217,70,239,0.15)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Header */}
        <header style={{
          height: '66px',
          borderBottom: '1px solid rgba(217,70,239,0.1)',
          display: 'flex', alignItems: 'center', padding: '0 28px',
          backgroundColor: 'rgba(12, 0, 21, 0.85)',
          backdropFilter: 'blur(16px)',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'sticky', top: 0, zIndex: 9,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search assets, portfolios, simulations…"
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(217,70,239,0.12)',
                borderRadius: '10px', color: '#fff', fontSize: '0.875rem', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(217,70,239,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(217,70,239,0.12)'}
            />
          </div>

          {/* Right: user chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{user?.role}</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #D946EF, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.875rem', color: '#fff', border: '2px solid rgba(217,70,239,0.4)', boxShadow: '0 0 12px rgba(217,70,239,0.2)' }}>
              {initials}
            </div>
          </div>
        </header>

        <div className="page-container" style={{ scrollBehavior: 'smooth' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
