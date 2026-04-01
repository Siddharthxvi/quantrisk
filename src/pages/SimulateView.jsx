import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Zap, AlertCircle, Download } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(val));

const SimulateView = () => {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    portfolio_id: '',
    scenario_id: '',
    simulation_type: 'monte_carlo_gbm',
    num_simulations: 10000,
    confidence_level: '95', // 90, 95, 99
    time_horizon_days: 252
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, sData, rData] = await Promise.all([
          apiClient('/portfolios/'),
          apiClient('/scenarios/'),
          apiClient('/simulation-runs/')
        ]);
        setPortfolios(pData);
        setScenarios(sData);
        setRecentRuns(rData.sort((a,b) => b.run_id - a.run_id).slice(0, 3)); // top 3 recent runs
        
        if (pData.length > 0 && sData.length > 0) {
          setFormData(prev => ({
            ...prev,
            portfolio_id: pData[0].portfolio_id,
            scenario_id: sData[0].scenario_id
          }));
        }
      } catch (err) {
        setError("Failed to load prerequisite data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      const run = await apiClient('/simulation-runs/', {
        method: 'POST',
        body: JSON.stringify({
          portfolio_id: parseInt(formData.portfolio_id),
          scenario_id: parseInt(formData.scenario_id),
          num_simulations: parseInt(formData.num_simulations),
          time_horizon_days: parseInt(formData.time_horizon_days),
          simulation_type: formData.simulation_type === 'monte_carlo_gbm' ? 'monte_carlo' : formData.simulation_type,
          confidence_level: parseFloat(formData.confidence_level) / 100,
          random_seed: Math.floor(Math.random() * 10000)
        })
      });
      // Redirect to results
      navigate(`/simulations/${run.run_id}`);
    } catch (err) {
      setError(err.message);
      setFormLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing High-Performance Engine...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Simulation Engine
        </h1>
        <p style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
          Configure and execute high-performance Monte Carlo simulations.
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-error)', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertCircle size={20} />
          <div style={{ fontSize: '0.875rem' }}>{error}</div>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '32px', color: 'var(--text-primary)', fontWeight: 500 }}>Configuration</h2>

        <form onSubmit={handleRun} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Portfolio & Scenario Selectors (Required by API) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Portfolio</label>
               <select 
                 value={formData.portfolio_id} 
                 onChange={e => setFormData({...formData, portfolio_id: e.target.value})} 
                 style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '1rem', appearance: 'none', cursor: 'pointer' }}
               >
                 {portfolios.map(p => (
                   <option key={p.portfolio_id} value={p.portfolio_id}>{p.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stress Scenario</label>
               <select 
                 value={formData.scenario_id} 
                 onChange={e => setFormData({...formData, scenario_id: e.target.value})} 
                 style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '1rem', appearance: 'none', cursor: 'pointer' }}
               >
                 {scenarios.map(s => (
                   <option key={s.scenario_id} value={s.scenario_id}>{s.name}</option>
                 ))}
               </select>
             </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simulation Type</label>
            <select 
              value={formData.simulation_type} 
              onChange={e => setFormData({...formData, simulation_type: e.target.value})} 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-emerald)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', cursor: 'pointer', appearance: 'none' }}
            >
              <option value="monte_carlo_gbm">✓ Monte Carlo (Geometric Brownian Motion)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Number of Iterations</label>
            <div style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '1.125rem', fontFamily: 'monospace', marginBottom: '12px' }}>
              {formData.num_simulations}
            </div>
            <input 
               type="range"
               min="1"
               max="10000"
               step="1"
               value={formData.num_simulations}
               onChange={e => setFormData({...formData, num_simulations: e.target.value})}
               style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
               {['90', '95', '99'].map(level => (
                 <button
                   key={level}
                   type="button"
                   onClick={() => setFormData({...formData, confidence_level: level})}
                   style={{
                     padding: '12px',
                     borderRadius: '8px',
                     border: `1px solid ${formData.confidence_level === level ? 'var(--accent-emerald)' : 'var(--border-color)'}`,
                     background: formData.confidence_level === level ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.5)',
                     color: formData.confidence_level === level ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                     fontSize: '0.875rem',
                     cursor: 'pointer',
                     transition: 'all 0.2s ease-in-out'
                   }}
                 >
                   {level}%
                 </button>
               ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={formLoading || portfolios.length === 0 || scenarios.length === 0} 
            style={{ 
              marginTop: '16px', padding: '16px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, #D946EF, #7C3AED)',
              color: '#ffffff', fontSize: '1.05rem',
              fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.03em',
              border: 'none', 
              cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              boxShadow: formLoading ? 'none' : '0 4px 18px rgba(217, 70, 239, 0.3)'
            }}
          >
            <Zap size={20} fill="#000" />
            {formLoading ? 'Executing Physics Engine...' : 'Execute Run'}
          </button>
        </form>
      </div>

      {/* Execution History Panel */}
      <div className="glass-panel" style={{ padding: '32px' }}>
         <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', color: 'var(--text-primary)', fontWeight: 500 }}>Execution History</h2>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentRuns.length === 0 ? (
               <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No previous runs found.</div>
            ) : recentRuns.map(run => {
               const var95 = run.risk_metrics?.find(m => m.metric_type === 'VaR_95')?.metric_value;
               
               return (
                 <Link to={`/simulations/${run.run_id}`} key={run.run_id} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Zap size={20} color="var(--accent-emerald)" fill="var(--accent-emerald)" />
                          </div>
                          <div>
                             <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>Run #{run.run_id}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{(run.num_simulations || 0).toLocaleString()} ITERATIONS &nbsp;&middot;&nbsp; {(run.status || 'pending').toUpperCase()}</div>
                          </div>
                       </div>
                       
                       <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                          {var95 && (
                            <div>
                               <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>VaR (95%)</div>
                               <div style={{ color: 'var(--status-error)', fontWeight: 600, fontSize: '1rem' }}>-${formatCurrency(var95).replace('$', '')}</div>
                            </div>
                          )}
                          <div>
                             <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Completed</div>
                             <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                               {run.started_at ? new Date(run.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                             </div>
                          </div>
                          <Download size={20} color="var(--text-secondary)" style={{ marginLeft: '16px' }} />
                       </div>
                    </div>
                 </Link>
               );
            })}
         </div>
      </div>

    </div>
  );
};

export default SimulateView;
