import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { Bar } from 'react-chartjs-2';
import { ArrowLeft, Clock, Activity, ShieldAlert, BarChart3, TrendingDown } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(val));
const formatPct = (val) => `${(val * 100).toFixed(2)}%`;

const SimulationDetail = () => {
  const { id } = useParams();
  const [runData, setRunData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const run = await apiClient(`/simulation-runs/${id}`);
        setRunData(run);
        
        const [pData, sData] = await Promise.all([
          apiClient(`/portfolios/${run.portfolio_id}`).catch(() => ({ name: `Portfolio ${run.portfolio_id}` })),
          apiClient(`/scenarios/${run.scenario_id}`).catch(() => ({ name: `Scenario ${run.scenario_id}` }))
        ]);
        
        setPortfolio(pData);
        setScenario(sData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [id]);

  if (loading) return <div>Loading Simulation Results...</div>;
  if (!runData) return <div>Simulation Data not found.</div>;
  if (runData.status === 'running') return <div>Simulation is still computing... Please refresh shortly.</div>;
  if (runData.status === 'failed') return <div style={{ color: 'var(--status-error)' }}>Simulation failed to compute.</div>;

  const metrics = runData.risk_metrics || [];
  const getMetric = (type) => (metrics.find(m => m.metric_type === type)?.metric_value || 0);
  
  const var95 = getMetric('VaR_95');
  const var99 = getMetric('VaR_99');
  const es95 = getMetric('ES_95');
  const vol = getMetric('volatility');
  const maxDd = getMetric('max_drawdown');

  // Parse histogram data. Chart.js needs an array of bins (labels) and counts.
  const hist = runData.histogram_data;
  let chartData = null;
  const cutoffVar = -var95; // VaR represents a loss but the histogram values usually show negative P&L. Wait, the cutoff is `-var95`.

  if (hist && hist.bin_edges && hist.counts) {
    // Generate labels by taking the midpoint of each bin edge
    const labels = [];
    const counts = hist.counts;
    const backgroundColors = [];
    
    for (let i = 0; i < counts.length; i++) {
       const binStart = hist.bin_edges[i];
       const binEnd = hist.bin_edges[i+1];
       const mid = (binStart + binEnd) / 2;
       labels.push(formatCurrency(mid)); // Just formatting amount for labels
       
       // Conditional coloring: if the bin midpoint is worse (more negative) than -VaR95, color red (loss tail)
       if (mid <= cutoffVar) {
         backgroundColors.push('rgba(239, 68, 68, 0.8)'); // Red
       } else if (mid >= 0) {
         backgroundColors.push('rgba(34, 197, 94, 0.6)'); // Green
       } else {
         backgroundColors.push('rgba(139, 92, 246, 0.4)'); // Purple/Neutral for regular losses
       }
    }

    chartData = {
      labels,
      datasets: [
        {
          label: 'Frequency',
          data: counts,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: backgroundColors.map(c => c.replace(/0\.[468]\)/, '1)')), // Make borders solid
          barPercentage: 1.0,
          categoryPercentage: 1.0
        }
      ]
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          title: (context) => `P&L Bracket: ${context[0].label}`,
          label: (context) => `Count: ${context.raw}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false, color: 'rgba(255,255,255,0.05)' }, 
        ticks: { maxTicksLimit: 10, color: '#9CA3AF' }
      },
      y: { 
        grid: { borderDash: [4, 4], color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9CA3AF' }
      }
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link to="/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Back to History
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Simulation Results 
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--status-success)', border: '1px solid var(--status-success)' }}>Completed</span>
          </h1>
        </div>
      </div>

      {/* Meta Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Portfolio</div><div style={{ fontWeight: 600 }}>{portfolio?.name}</div></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Scenario</div><div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{scenario?.name}</div></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Run Type</div><div style={{ fontWeight: 600 }}>{runData.run_type?.replace('_', ' ').toUpperCase()}</div></div>
        <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Timestamp</div><div style={{ fontWeight: 600 }}>{new Date(runData.completed_at || runData.started_at).toLocaleString()}</div></div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ShieldAlert size={20} color="var(--status-error)" />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>VaR (95%)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${formatCurrency(var95).replace('$', '')}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ShieldAlert size={20} color="var(--status-error)" style={{ opacity: 0.7 }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>VaR (99%)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${formatCurrency(var99).replace('$', '')}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <TrendingDown size={20} color="var(--status-warning)" />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Expected Shortfall (95%)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${formatCurrency(es95).replace('$', '')}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Activity size={20} color="var(--accent-cyan)" />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Portfolio Volatility</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatPct(vol)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <BarChart3 size={20} color="#fff" style={{ opacity: 0.5 }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Max Drawdown</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>${formatCurrency(maxDd).replace('$', '')}</div>
        </div>
      </div>

      {/* Histogram Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          P&L Distribution
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Red bars indicate loss outcomes exceeding the 95% Value at Risk threshold ({(formatCurrency(-var95))}).
        </p>
        
        {chartData ? (
          <div style={{ height: '400px', width: '100%' }}>
             <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
             Histogram data is not available for this run. (Ad-hoc endpoints only)
          </div>
        )}
      </div>

    </div>
  );
};

export default SimulationDetail;
