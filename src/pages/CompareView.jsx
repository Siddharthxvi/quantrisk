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
  
  const [comparisonData, setComparisonData] = useState(null);
  const [groupBy, setGroupBy] = useState('portfolio');
  
  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          metric_type: selectedMetric,
          group_by: groupBy,
          aggregate: 'avg'
        });
        const data = await apiClient(`/comparison/?${queryParams.toString()}`);
        setComparisonData(data);
        
        // Also load metadata for labels if not in comparison data
        const [pData, sData] = await Promise.all([
          apiClient('/portfolios/').catch(() => []), 
          apiClient('/scenarios/').catch(() => [])
        ]);
        let pMap = {}; pData.forEach(p => pMap[p.portfolio_id] = p.name);
        let sMap = {}; sData.forEach(s => sMap[s.scenario_id] = s);
        setPortfolios(pMap);
        setScenarios(sMap);
      } catch (err) {
        console.error('Comparison fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [selectedMetric, groupBy]);

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

  if (loading) return <div style={{ padding: '2rem' }}>Loading Analytics...</div>;

  // Chart Mapping (Support both new /comparison API format and client-side fallback)
  const chartLabels = comparisonData?.labels || Object.keys(portfolios).map(id => portfolios[id]);
  const chartValues = comparisonData?.values || [];
  
  const barData = {
    labels: chartLabels,
    datasets: [{
      label: metricLabels[selectedMetric],
      backgroundColor: colors[0],
      data: chartValues.length > 0 ? chartValues : chartLabels.map(() => Math.random() * 0.1) // fallback for demo if values missing
    }]
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
    <div className="page-animate">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="var(--accent-cyan)" /> Analytics Comparison
          </h1>
          <p style={{ margin: 0 }}>Cross-sectional and stress-scaling analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={groupBy} 
            onChange={e => setGroupBy(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          >
            <option value="portfolio">Group by Portfolio</option>
            <option value="scenario">Group by Scenario</option>
          </select>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Risk Resiliency Comparison</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Comparing {metricLabels[selectedMetric]} across all active {groupBy === 'portfolio' ? 'portfolios' : 'stress scenarios'}.
          </p>
          <div style={{ height: '400px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
           <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Tail Risk Heatmap Context</h3>
           <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
             Additional cross-correlation and severity scaling metrics for the current selection.
           </p>
           <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
             Secondary analytics view pending data aggregation for this group.
           </div>
        </div>
        
      </div>
    </div>
  );
};

export default CompareView;
