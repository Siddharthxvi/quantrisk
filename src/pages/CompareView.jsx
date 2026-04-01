import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { Bar, Line } from 'react-chartjs-2';
import { ShieldAlert, Activity, AlertCircle } from 'lucide-react';

const CompareView = () => {
  const [runs, setRuns] = useState([]);
  const [portfolios, setPortfolios] = useState({});
  const [scenarios, setScenarios] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedMetric, setSelectedMetric] = useState('VaR_95');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rData, pData, sData] = await Promise.all([
          apiClient('/simulation-runs/').catch(() => []), 
          apiClient('/portfolios/').catch(() => []), 
          apiClient('/scenarios/').catch(() => [])
        ]);
        
        let pMap = {}; pData.forEach(p => pMap[p.portfolio_id] = p.name);
        let sMap = {}; sData.forEach(s => sMap[s.scenario_id] = s);
        
        setPortfolios(pMap);
        setScenarios(sMap);
        setRuns(rData.filter(r => r.status === 'completed' && r.risk_metrics));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metricLabels = {
    'VaR_95': 'Value at Risk (95%)',
    'VaR_99': 'Value at Risk (99%)',
    'ES_95': 'Expected Shortfall (95%)',
    'volatility': 'Volatility',
    'max_drawdown': 'Max Drawdown'
  };

  const colors = [
    'rgba(6, 182, 212, 0.8)', // Cyan
    'rgba(139, 92, 246, 0.8)', // Purple
    'rgba(16, 185, 129, 0.8)', // Emerald
    'rgba(245, 158, 11, 0.8)', // Amber
    'rgba(239, 68, 68, 0.8)'   // Red
  ];

  if (loading) return <div>Loading Analytics...</div>;

  // Build the Bar Chart: Grouped by Portfolio, showing the metric across a Baseline Scenario vs Stress Scenario.
  // Actually, to keep it simple, X-axis: Portfolios. Bars per portfolio: Scenarios.
  const uniquePortfolios = [...new Set(runs.map(r => r.portfolio_id))];
  const uniqueScenarios = [...new Set(runs.map(r => r.scenario_id))];
  
  const barData = {
    labels: uniquePortfolios.map(id => portfolios[id] || `P${id}`), // X-Axis
    datasets: uniqueScenarios.map((sId, index) => {
      return {
        label: scenarios[sId]?.name || `S${sId}`,
        backgroundColor: colors[index % colors.length],
        data: uniquePortfolios.map(pId => {
          // Find run for this P & S
          const run = runs.find(r => r.portfolio_id === pId && r.scenario_id === sId);
          if (!run) return null;
          const metricVal = run.risk_metrics.find(m => m.metric_type === selectedMetric)?.metric_value;
          return metricVal || 0;
        })
      };
    })
  };

  const lineData = {
    // Sort scenarios by severity (volatility multiplier)
    labels: Object.values(scenarios).sort((a,b) => a.volatility_multiplier - b.volatility_multiplier).map(s => s.name),
    datasets: uniquePortfolios.map((pId, index) => {
      return {
        label: portfolios[pId] || `P${pId}`,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('0.8)', '0.1)'),
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        data: Object.values(scenarios).sort((a,b) => a.volatility_multiplier - b.volatility_multiplier).map(s => {
          const run = runs.find(r => r.portfolio_id === pId && r.scenario_id === s.scenario_id);
          if (!run) return null;
          const metricVal = run.risk_metrics.find(m => m.metric_type === selectedMetric)?.metric_value;
          return metricVal || 0;
        })
      };
    })
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9CA3AF' } }
    },
    scales: {
      x: { grid: { display: false, color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } },
      y: { grid: { borderDash: [4, 4], color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9CA3AF' } }
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="var(--accent-cyan)" /> Analytics Comparison
          </h1>
          <p style={{ margin: 0 }}>Cross-sectional and stress-scaling analysis</p>
        </div>
        <div>
          <select 
            value={selectedMetric} 
            onChange={e => setSelectedMetric(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          >
            {Object.entries(metricLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {runs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem', background: 'var(--glass-bg)', borderRadius: '12px' }}>
          <AlertCircle size={48} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
          <div>No completed simulation runs available to compare.</div>
          <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>Run a few simulations across different portfolios and scenarios first.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Portfolio Resiliency Breakdown</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Comparing Portfolios across all available Stress Scenarios.</p>
            <div style={{ height: '350px' }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
             <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Scenario Severity Scaling</h3>
             <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Observing how {metricLabels[selectedMetric]} scales as the scenario volatility multiplier increases.</p>
             <div style={{ height: '350px' }}>
               <Line data={lineData} options={{...chartOptions, plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF' } }, tooltip: { mode: 'index', intersect: false }}}} />
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default CompareView;
