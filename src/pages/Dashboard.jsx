import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { apiClient } from '../api/apiClient';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  annotationPlugin
);

// Helper metric card
const MetricCard = ({ title, value, trend, isPositiveTrend, desc, color }) => (
  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</div>
      <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        <Info size={14} />
      </button>
    </div>
    
    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: color, marginBottom: '16px', letterSpacing: '-0.025em' }}>
      {value}
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: isPositiveTrend ? 'var(--status-success)' : 'var(--status-error)', marginBottom: '24px' }}>
      {isPositiveTrend ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      {Math.abs(trend)}% <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>VS PREV RUN</span>
    </div>
    
    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
      {desc}
    </div>
  </div>
);

const Dashboard = () => {
  const [latestRun, setLatestRun] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(true);

  // Static mock UI configuration
  const mockHoldings = [
    { ticker: 'AAPL', weight: 0.40, risk: 0.45, status: 'High' },
    { ticker: 'US10Y', weight: 0.35, risk: 0.10, status: 'Low' },
    { ticker: 'GLD', weight: 0.25, risk: 0.15, status: 'Low' }
  ];

  useEffect(() => {
    const fetchLatestRun = async () => {
      setLoadingRuns(true);
      try {
        const runs = await apiClient('/simulation-runs/');
        if (runs && runs.length > 0) {
          const sorted = [...runs].sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
          setLatestRun(sorted[0]);
        }
      } catch (err) {
        console.error('Failed to fetch runs:', err);
      } finally {
        setLoadingRuns(false);
      }
    };
    fetchLatestRun();
  }, []);

  const stats = {
    varValue: latestRun?.risk_metrics?.VaR_95 || 0.042,
    esValue: latestRun?.risk_metrics?.ES_95 || 0.085,
    var: latestRun?.risk_metrics?.VaR_95 ? `${(latestRun.risk_metrics.VaR_95 * 100).toFixed(2)}%` : '-4.20%',
    es: latestRun?.risk_metrics?.ES_95 ? `${(latestRun.risk_metrics.ES_95 * 100).toFixed(2)}%` : '-8.50%',
    vol: latestRun?.risk_metrics?.volatility ? `${(latestRun.risk_metrics.volatility * 100).toFixed(2)}%` : '18.50%',
    sharpe: '1.42',
    runTitle: latestRun ? `Showing data for latest run: ${latestRun.simulation_type === 'monte_carlo_gbm' ? 'Monte Carlo' : latestRun.simulation_type} (#${latestRun.run_id})` : 'Showing aggregate portfolio risk estimates'
  };

  // Process Histogram Data
  const histBins = 40;
  let labels, counts;
  
  if (latestRun?.histogram_data) {
    const h = latestRun.histogram_data;
    labels = h.bin_edges.slice(0, -1).map((edge, i) => {
        const mid = (edge + h.bin_edges[i+1]) / 2;
        return mid;
    });
    counts = h.counts;
  } else {
    // High-fidelity Mock Histogram
    labels = Array.from({length: histBins}).map((_, i) => -0.15 + i*0.0075);
    counts = Array.from({length: histBins}).map((_, i) => Math.exp(-Math.pow(i - 20, 2) / 50) * 100);
  }

  // Find index for shading (ES Region)
  const varThreshold = -stats.varValue;
  const esIndex = labels.findIndex(l => l >= varThreshold);

  const histData = {
    labels: labels.map(l => `${(l*100).toFixed(1)}%`),
    datasets: [{
      label: 'Frequency',
      data: counts,
      backgroundColor: labels.map((l, i) => i < esIndex ? 'rgba(240, 0, 123, 0.6)' : 'rgba(168, 85, 247, 0.4)'),
      borderColor: labels.map((l, i) => i < esIndex ? '#F0007B' : 'transparent'),
      borderWidth: labels.map((l, i) => i < esIndex ? 1 : 0),
      barPercentage: 1.0,
      categoryPercentage: 1.0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Frequency: ${ctx.raw.toFixed(0)}`,
          afterBody: () => [
            `-------------------`,
            `VaR (95%): ${(stats.varValue * 100).toFixed(2)}%`,
            `Expected Shortfall: ${(stats.esValue * 100).toFixed(2)}%`,
            `Confidence: 95.0%`
          ]
        },
        backgroundColor: 'rgba(10, 15, 28, 0.9)',
        titleColor: 'var(--accent-emerald)',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      },
      annotation: {
        annotations: {
          varLine: {
            type: 'line',
            xMin: esIndex,
            xMax: esIndex,
            borderColor: '#F0007B',
            borderWidth: 2,
            borderDash: [6, 4],
            label: {
              display: true,
              content: 'VaR (95%)',
              position: 'start',
              backgroundColor: 'rgba(240, 0, 123, 0.8)',
              color: '#fff',
              font: { size: 10, weight: 'bold' },
              padding: 4
            }
          }
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { maxTicksLimit: 12, color: 'var(--text-muted)' },
        title: { 
          display: true, 
          text: 'SIMULATED PORTFOLIO RETURNS (%)', 
          color: 'var(--text-muted)', 
          font: { family: 'monospace', size: 10 }, 
          padding: { top: 20 } 
        }
      },
      y: { display: false }
    }
  };

  return (
    <div className="page-animate" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>Portfolio Intelligence</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
            {stats.runTitle}
          </p>
        </div>
        
        <div>
          <Link to="/simulate" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'var(--btn-bg)', border: '1px solid rgba(217,70,239,0.2)', padding: '11px 22px', borderRadius: '10px', color: 'var(--btn-color)', fontSize: '0.9rem', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: 'var(--btn-shadow)', letterSpacing: '0.01em', transition: 'all 0.2s' }}>
               <Play size={17} /> Run Simulation
            </button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <MetricCard 
          title="Value At Risk (95%)"
          value={stats.var}
          trend={-1.2}
          isPositiveTrend={false}
          color="var(--status-error)"
          desc="Maximum expected loss over a 1-day horizon with 95% confidence."
        />
        <MetricCard 
          title="Expected Shortfall"
          value={stats.es}
          trend={0.5}
          isPositiveTrend={true}
          color="var(--status-error)"
          desc="Average loss in lowest 5% scenarios."
        />
        <MetricCard 
          title="Annualized Volatility"
          value={stats.vol}
          trend={2.1}
          isPositiveTrend={true}
          color="var(--accent-lavender)"
          desc="Standard deviation of portfolio returns."
        />
        <MetricCard 
          title="Sharpe Ratio"
          value={stats.sharpe}
          trend={4.5}
          isPositiveTrend={true}
          color="var(--text-primary)"
          desc="Risk-adjusted return relative to risk-free rate."
        />
      </div>

      {/* Risk Histogram & Top Holdings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
           <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <AlertTriangle color="#F0007B" /> Risk Distribution (Monte Carlo Analysis)
           </h2>
           <div style={{ height: '350px' }}>
              <Bar data={histData} options={chartOptions} />
           </div>
           <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(240, 0, 123, 0.6)', borderRadius: '2px' }} />
                <span>ES Tail Region</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(168, 85, 247, 0.4)', borderRadius: '2px' }} />
                <span>Standard Scenarios</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '18px', height: '0', borderTop: '2px dashed #F0007B' }} />
                <span>95% VaR Threshold</span>
              </div>
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
           <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <ShieldCheck color="var(--accent-emerald)" /> Top Holdings & Risk Contribution
           </h2>
           <div className="table-container" style={{ margin: 0 }}>
              <table style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>ASSET</th>
                    <th style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>WEIGHT</th>
                    <th style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>RISK CONTRIB.</th>
                    <th style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockHoldings.map((h, i) => (
                    <tr key={i} style={{ borderBottom: 'none' }}>
                       <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.ticker}</td>
                       <td>{(h.weight * 100).toFixed(1)}%</td>
                       <td>{(h.risk * 100).toFixed(1)}%</td>
                       <td style={{ color: h.status === 'High' ? '#EF4444' : '#10B981' }}>{h.status} Risk Context</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
