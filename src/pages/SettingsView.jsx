import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../api/apiClient';
import { User, Terminal, Server, Command, Lock, CheckCircle, Save, AlertCircle, Eye, EyeOff, Sun, Moon, Palette } from 'lucide-react';

const SettingsView = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    bio: '',
  });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { text, success }

  // Simulation defaults state
  const [simSettings, setSimSettings] = useState({ 
    default_iterations: 10000, 
    default_horizon_days: 252, 
    default_confidence_level: 0.95,
    risk_threshold_pct: 0.10 // 10% default
  });
  const [simSaving, setSimSaving] = useState(false);

  // Dev Actions
  const [devLogs, setDevLogs] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || '',
      });
    }
    // Load sim settings
    apiClient('/settings/').then(s => setSimSettings({
      default_iterations: s.default_iterations,
      default_horizon_days: s.default_horizon_days,
      default_confidence_level: s.default_confidence_level,
      risk_threshold_pct: s.risk_threshold_pct || 0.10
    })).catch(() => {});
  }, [user]);

  const addLog = (msg, success = true) => {
    setDevLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, success }, ...prev].slice(0, 10));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (passwordForm.password && passwordForm.password !== passwordForm.confirm) {
      setProfileMsg({ text: 'Passwords do not match.', success: false });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const payload = {
        full_name: profileForm.full_name || undefined,
        email: profileForm.email || undefined,
        phone: profileForm.phone || undefined,
        department: profileForm.department || undefined,
        bio: profileForm.bio || undefined,
      };
      if (passwordForm.password) payload.password = passwordForm.password;

      await apiClient(`/users/${user.user_id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setProfileMsg({ text: 'Profile saved successfully!', success: true });
      setPasswordForm({ password: '', confirm: '' });
      // Optimistically reflect name update
      if (setUser) setUser(prev => ({ ...prev, ...payload }));
    } catch (err) {
      setProfileMsg({ text: `Save failed: ${err.message}`, success: false });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveSimSettings = async () => {
    setSimSaving(true);
    try {
      await apiClient('/settings/', { method: 'PUT', body: JSON.stringify(simSettings) });
      addLog('Simulation defaults updated.', true);
    } catch (e) {
      addLog(`Settings save failed: ${e.message}`, false);
    } finally {
      setSimSaving(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const res = await apiClient('/health');
      addLog(`System Health: ${res.status} (v${res.version})`);
    } catch (e) {
      addLog(`Health Check Failed: ${e.message}`, false);
    }
  };

  const handleDevAction = async (endpoint, name) => {
    try {
      addLog(`Triggering ${name}...`, true);
      const res = await apiClient(endpoint);
      addLog(`Success: ${JSON.stringify(res).slice(0, 80)}...`);
    } catch (e) {
      addLog(`Failure: ${e.message}`, false);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem', maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Settings</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Account preferences and platform configuration</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── APPEARANCE / THEME TOGGLE ── */}
        <section className="glass-panel" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={22} color="var(--accent-primary)" />
              </div>
              <div>
                <h3 style={{ marginBottom: '2px', fontFamily: 'Paralucent, Poppins, sans-serif' }}>Appearance</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Toggle between {theme === 'dark' ? 'light' : 'dark'} mode
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sun size={18} color={theme === 'light' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              <label className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                <input type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
                <div className="theme-toggle-track" />
                <div className="theme-toggle-thumb" />
              </label>
              <Moon size={18} color={theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              <span style={{ marginLeft: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>
          </div>
        </section>

        {/* ── PROFILE EDIT ── */}
        <section className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px', marginBottom: '28px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={32} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{user?.full_name || user?.username || 'User'}</h2>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user?.username}</div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '6px 12px', background: 'var(--bg-dark)', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', border: '1px solid var(--accent-emerald)' }}>
              {user?.role} ACCESS
            </div>
          </div>

          {profileMsg && (
            <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: profileMsg.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${profileMsg.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: profileMsg.success ? 'var(--status-success)' : 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
              {profileMsg.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                <input
                  value={profileForm.full_name}
                  onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                <input
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</label>
                <input
                  value={profileForm.department}
                  onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                  placeholder="e.g. Quantitative Risk"
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                rows={2}
                placeholder="Short bio or title..."
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Role (read-only) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Lock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Role (Contact Admin to Change)
              </label>
              <input disabled value={user?.role || ''} style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
            </div>

            {/* Password Change */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Change Password</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.password}
                    onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="Repeat new password"
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Hide' : 'Show'} password
              </button>
            </div>

            <button type="submit" disabled={profileSaving} style={{ alignSelf: 'flex-start', padding: '10px 24px', background: 'var(--accent-emerald)', color: '#000', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        {/* ── SIMULATION DEFAULTS ── */}
        <section className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '24px', color: 'var(--text-primary)' }}>Simulation Defaults</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Default Iterations</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{simSettings.default_iterations.toLocaleString()}</span>
              </label>
              <input type="range" min="100" max="10000" step="100" value={simSettings.default_iterations} onChange={e => setSimSettings({ ...simSettings, default_iterations: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--accent-emerald)' }} />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Default Time Horizon (Days)</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{simSettings.default_horizon_days}</span>
              </label>
              <input type="range" min="1" max="252" step="1" value={simSettings.default_horizon_days} onChange={e => setSimSettings({ ...simSettings, default_horizon_days: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--accent-emerald)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default Confidence Level</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[0.90, 0.95, 0.99].map(lvl => (
                  <button key={lvl} type="button" onClick={() => setSimSettings({ ...simSettings, default_confidence_level: lvl })}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${simSettings.default_confidence_level === lvl ? 'var(--accent-emerald)' : 'var(--border-color)'}`, background: simSettings.default_confidence_level === lvl ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.3)', color: simSettings.default_confidence_level === lvl ? 'var(--accent-emerald)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                    {(lvl * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>
            {/* ── NEW: RISK THRESHOLD ── */}
            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Risk Alert Threshold (% of NAV)</span>
                <span style={{ color: 'var(--status-error)', fontWeight: 600 }}>{(simSettings.risk_threshold_pct * 100).toFixed(0)}%</span>
              </label>
              <input 
                type="range" 
                min="0.01" 
                max="0.25" 
                step="0.01" 
                value={simSettings.risk_threshold_pct} 
                onChange={e => setSimSettings({ ...simSettings, risk_threshold_pct: parseFloat(e.target.value) })} 
                style={{ width: '100%', accentColor: 'var(--status-error)' }} 
              />
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Flags simulations where VaR exceeds this percentage of total portfolio value.
              </p>
            </div>
          </div>
          <button onClick={handleSaveSimSettings} disabled={simSaving} style={{ marginTop: '20px', alignSelf: 'flex-start', padding: '10px 24px', background: 'var(--accent-cyan)', color: '#000', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {simSaving ? 'Saving...' : 'Save Defaults'}
          </button>
        </section>

        {/* ── DEVELOPER TOOLS ── */}
        <section className="glass-panel" style={{ padding: '32px', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Terminal size={20} /> Developer Tools
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleHealthCheck} style={{ padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Server size={18} /> System Health Check</button>
              <button onClick={() => handleDevAction('/verify-schema', 'Schema Verification')} style={{ padding: '12px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><CheckCircle size={18} /> Verify Core Schemas</button>
            </div>
            <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', minHeight: '150px', overflowY: 'auto' }}>
              {devLogs.length === 0 ? 'System console ready. Waiting for events...' : devLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#555' }}>[{log.time}]</span>
                  <span style={{ color: log.success ? '#10B981' : '#EF4444' }}>&rang; {log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsView;
