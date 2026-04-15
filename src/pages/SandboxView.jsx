import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { PlaySquare, AlertCircle, Plus, Trash2, ShieldAlert, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(val));
const formatPct = (val) => `${(val * 100).toFixed(2)}%`;

const SandboxView = () => {
  const [allAssets, setAllAssets] = useState([]);
  const [sandboxAssets, setSandboxAssets] = useState([]);
  
  // Scenario states
  const [irShock, setIrShock] = useState(0);
  const [volMulti, setVolMulti] = useState(1.0);
  const [eqShock, setEqShock] = useState(0);
  
  // Controls
  const [iterations, setIterations] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState(10);
  
  // New Asset input
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [tempQuantity, setTempQuantity] = useState('');

  const calculateWeights = (assets, library) => {
    const totalValue = assets.reduce((sum, item) => {
      const asset = item.asset || library.find(a => a.asset_id === item.asset_id);
      return sum + (parseFloat(item.quantity || 0) * (asset?.base_price || 0));
    }, 0);
    
    if (totalValue === 0) return assets.map(a => ({ ...a, weight: 0 }));
    return assets.map(item => {
      const asset = item.asset || library.find(a => a.asset_id === item.asset_id);
      return {
        ...item,
        weight: (parseFloat(item.quantity || 0) * (asset?.base_price || 0)) / totalValue
      };
    });
  };

  const handleAddAsset = () => {
    if (!selectedAssetId || !tempQuantity) return;
    if (sandboxAssets.find(a => a.asset_id === parseInt(selectedAssetId))) return alert("Asset already in sandbox");

    const assetObj = allAssets.find(a => a.asset_id === parseInt(selectedAssetId));
    const newAsset = {
      asset_id: parseInt(selectedAssetId),
      quantity: parseFloat(tempQuantity),
      asset: assetObj,
      weight: 0 // placeholder
    };
    
    setSandboxAssets(calculateWeights([...sandboxAssets, newAsset], allAssets));
    setSelectedAssetId('');
    setTempQuantity('');
  };

  const handleRemoveAsset = (assetId) => {
    const updated = sandboxAssets.filter(x => x.asset_id !== assetId);
    setSandboxAssets(calculateWeights(updated, allAssets));
  };

  const getProjectedWeight = () => {
    if (!selectedAssetId || !tempQuantity) return 0;
    const assetObj = allAssets.find(a => a.asset_id === parseInt(selectedAssetId));
    if (!assetObj) return 0;
    const newVal = parseFloat(tempQuantity) * assetObj.base_price;
    const currentVal = sandboxAssets.reduce((sum, item) => {
      const a = item.asset || allAssets.find(x => x.asset_id === item.asset_id);
      return sum + (item.quantity * (a?.base_price || 0));
    }, 0);
    return (newVal / (currentVal + newVal)) * 100;
  };

  const handleRunAdHoc = async () => {
    const wSum = sandboxAssets.reduce((acc, curr) => acc + curr.weight, 0);
    if (sandboxAssets.length > 0 && Math.abs(wSum - 1.0) > 0.001) {
      setError(`Weights must sum to 100%. Currently ${(wSum * 100).toFixed(1)}%.`);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const payload = {
        portfolio_assets: sandboxAssets.map(a => ({ 
           asset_name: a.asset?.asset_name || a.asset?.ticker || 'Unknown Asset',
           asset_type: a.asset?.asset_type || a.asset?.type_name || 'equity',
           base_price: parseFloat(a.asset?.base_price || 100),
           annual_volatility: parseFloat(a.asset?.annual_volatility || 0.2),
           annual_return: parseFloat(a.asset?.annual_return || 0.05),
           weight: a.weight, 
           quantity: a.quantity 
        })),
        scenario: {
          interest_rate_shock_bps: parseInt(irShock),
          volatility_multiplier: parseFloat(volMulti),
          equity_shock_pct: parseFloat(eqShock) / 100
        },
        num_simulations: parseInt(iterations),
        time_horizon_days: parseInt(timeHorizon),
        simulation_type: 'monte_carlo',
        random_seed: Math.floor(Math.random() * 10000)
      };

      const res = await apiClient('/simulation-runs/ad-hoc', { method: 'POST', body: JSON.stringify(payload) });
      setResults(res);
    } catch (e) {
      setError("Ad-hoc simulation failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper bindings for chart
  let chartData = null;
  if (results?.histogram) {
    const hist = results.histogram;
    const var95 = results.metrics?.VaR_95 || 0;
    
    chartData = {
      labels: hist.counts.map((_, i) => formatCurrency((hist.bin_edges[i] + hist.bin_edges[i+1])/2)),
      datasets: [{
        label: 'Frequency',
        data: hist.counts,
        backgroundColor: hist.counts.map((_, i) => ((hist.bin_edges[i] + hist.bin_edges[i+1])/2) <= -var95 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(139, 92, 246, 0.4)'),
        borderWidth: 1,
        barPercentage: 1.0, categoryPercentage: 1.0
      }]
    };
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlaySquare color="var(--accent-emerald)" /> Simulation Sandbox
          </h1>
          <p style={{ margin: 0, lineHeight: '1.5', maxWidth: '800px' }}>
            Ad-hoc exploratory stress testing. The Sandbox allows you to dynamically build custom portfolios 
            and instantly run comprehensive Monte Carlo simulations using live parameter configuration. 
            Adjust holdings directly to view localized risk breakdowns and visualize exactly how potential losses scale.
          </p>
        </div>
      </div>

      {error && <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-error)', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        
        {/* Left Col: Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Test Portfolio</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">-- Asset --</option>
                {allAssets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.ticker}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" step="0.01" value={tempQuantity} onChange={e => setTempQuantity(e.target.value)} placeholder="Quantity" style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              
              {selectedAssetId && tempQuantity && (
                <div style={{ padding: '8px', fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  Projected Weight: {getProjectedWeight().toFixed(1)}%
                </div>
              )}

              <button onClick={handleAddAsset} disabled={!selectedAssetId || !tempQuantity} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', opacity: (!selectedAssetId || !tempQuantity) ? 0.5 : 1 }}>+ Add to Simulation</button>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              {sandboxAssets.map(a => (
                <div key={a.asset_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', marginBottom: '8px' }}>
                  <span><span style={{ fontWeight: 600 }}>{a.asset?.ticker}</span> ({a.quantity} units, {(a.weight*100).toFixed(1)}%)</span>
                  <button onClick={() => handleRemoveAsset(a.asset_id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-error)', cursor: 'pointer' }}><Trash2 size={14}/></button>
                </div>
              ))}
              <div style={{ marginTop: '8px', fontWeight: 600, fontSize: '0.875rem', color: sandboxAssets.length === 0 || Math.abs(sandboxAssets.reduce((s, a) => s + a.weight, 0) - 1) < 0.001 ? 'var(--status-success)' : 'var(--status-error)' }}>
                Total: {(sandboxAssets.reduce((s, a) => s + a.weight, 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Stress Parameters</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}><span>IR Shock</span> <span>{irShock} bps</span></label>
              <input type="range" min="-500" max="500" step="10" value={irShock} onChange={e => setIrShock(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}><span>Vol Multiplier</span> <span>{volMulti}x</span></label>
              <input type="range" min="0.1" max="5.0" step="0.1" value={volMulti} onChange={e => setVolMulti(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}><span>Equity Shock</span> <span>{eqShock}%</span></label>
              <input type="range" min="-100" max="100" step="5" value={eqShock} onChange={e => setEqShock(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Engine Config</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Iterations / Paths</span>
                <span>{iterations}</span>
              </label>
              <input 
                type="range"
                min="1"
                max="10000"
                step="1"
                value={iterations}
                onChange={e => setIterations(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span>Time Horizon (Days)</span>
                <span>{timeHorizon}</span>
              </label>
              <input 
                type="range"
                min="1"
                max="252"
                step="1"
                value={timeHorizon}
                onChange={e => setTimeHorizon(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <button onClick={handleRunAdHoc} disabled={loading || sandboxAssets.length === 0} style={{ padding: '16px', borderRadius: '8px', background: 'var(--accent-emerald)', color: '#000', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Evaluating...' : 'Run Analysis Live'}
          </button>

        </div>

        {/* Right Col: Instant Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {results ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>VaR (95%)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--status-error)' }}>${formatCurrency(results.metrics?.VaR_95 || 0).replace('$', '')}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Expected Shortfall</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--status-warning)' }}>${formatCurrency(results.metrics?.ES_95 || 0).replace('$', '')}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Volatility</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{formatPct(results.metrics?.volatility || 0)}</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Max Drawdown</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>${formatCurrency(results.metrics?.max_drawdown || 0).replace('$', '')}</div>
                </div>
              </div>

              {chartData && (
                <div className="glass-panel" style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '16px' }}>Simulated Impact Distribution</h3>
                  <div style={{ flexGrow: 1, minHeight: '400px' }}>
                     <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)', borderDash: [4, 4] } } } }} />
                  </div>
                </div>
              )}
            </>
          ) : (
             <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)' }}>
                <Activity size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>No Data Available</h3>
                <p style={{ maxWidth: '300px' }}>Configure your ad-hoc portfolio and scenario parameters on the left, then click Run to generate an instant risk histogram.</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SandboxView;
