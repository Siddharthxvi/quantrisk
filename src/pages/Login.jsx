import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, ArrowRight, User, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSlowWarning(false);

    const slowTimer = setTimeout(() => setSlowWarning(true), 3000);
    const result = await login(username, password);
    clearTimeout(slowTimer);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  const inputStyle = (focused) => ({
    width: '100%',
    padding: '13px 14px 13px 44px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: `1px solid ${focused ? 'rgba(217,70,239,0.5)' : 'rgba(217,70,239,0.14)'}`,
    borderRadius: '10px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.9375rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(217,70,239,0.12)' : 'none',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-dark)',
      backgroundImage: `
        radial-gradient(ellipse 70% 60% at 80% 5%,  rgba(168,85,247,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 10% 90%, rgba(217,70,239,0.12) 0%, transparent 55%)
      `,
    }}>
      {/* Decorative blurred blobs */}
      <div style={{ position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(217,70,239,0.08)', filter: 'blur(80px)', top: '10%', right: '18%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(124,58,237,0.10)', filter: 'blur(60px)', bottom: '12%', left: '14%', pointerEvents: 'none' }} />

      <div className="glass-panel modal-animate" style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {/* Logo mark */}
        <div style={{
          width: '68px', height: '68px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #D946EF 0%, #7C3AED 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.75rem',
          boxShadow: '0 8px 24px rgba(217,70,239,0.35), 0 0 0 1px rgba(217,70,239,0.2)',
        }}>
          <ShieldAlert size={32} color="#fff" strokeWidth={1.5} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.25rem', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Welcome Back
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Sign in to <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>QuantRisk</span> Platform
        </p>

        {slowWarning && !error && (
          <div style={{ width: '100%', padding: '11px 14px', borderRadius: '9px', background: 'rgba(232,121,249,0.08)', border: '1px solid rgba(232,121,249,0.2)', color: 'var(--status-warning)', fontSize: '0.8rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            Connecting… backend may take ~50s to wake up from sleep.
          </div>
        )}

        {error && (
          <div style={{ width: '100%', padding: '11px 14px', borderRadius: '9px', background: 'rgba(240,0,123,0.08)', border: '1px solid rgba(240,0,123,0.2)', color: 'var(--status-error)', fontSize: '0.8rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '7px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><User size={17} /></div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                placeholder="name@analyst.quantrisk"
                style={inputStyle(false)}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(217,70,239,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(217,70,239,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(217,70,239,0.14)'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '7px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Lock size={17} /></div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle(false)}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(217,70,239,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(217,70,239,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(217,70,239,0.14)'; e.target.style.boxShadow = 'none'; }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              width: '100%', padding: '14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D946EF 0%, #7C3AED 100%)',
              border: 'none', color: '#fff',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.03em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'filter 0.2s, transform 0.15s',
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(217,70,239,0.3)',
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
            onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} />
                Authenticating…
              </>
            ) : (
              <> Sign In <ArrowRight size={18} /> </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Use <code style={{ background: 'rgba(217,70,239,0.1)', padding: '1px 6px', borderRadius: '4px', color: 'var(--accent-lavender)' }}>name@dbadmin.quantrisk</code> for Admin
          &nbsp;·&nbsp;
          <code style={{ background: 'rgba(217,70,239,0.1)', padding: '1px 6px', borderRadius: '4px', color: 'var(--accent-lavender)' }}>name@analyst.quantrisk</code> for Analyst
        </div>
      </div>
    </div>
  );
};

export default Login;
