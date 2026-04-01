import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { apiClient } from '../api/apiClient';

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
  const [activeRange, setActiveRange] = useState('1M');
  const [chartData, setChartData] = useState(null);
  
  // Static mock UI configuration to match the high-fidelity screenshot exactly
  const mockHoldings = [
    { ticker: 'AAPL', weight: 0.40, risk: 0.45, status: 'High' },
    { ticker: 'US10Y', weight: 0.35, risk: 0.10, status: 'Low' },
    { ticker: 'GLD', weight: 0.25, risk: 0.15, status: 'Low' }
  ];

  useEffect(() => {
    // Generate mock random walk performance data for the Line chart to match the UI spec
    const generatePath = (days, startPrice = 100) => {
        let path = [startPrice];
        for(let i=1; i<days; i++) {
           path.push(path[i-1] * (1 + (Math.random() * 0.02 - 0.009)));
        }
        return path;
    };
    
    const days = activeRange === '1M' ? 30 : activeRange === '3M' ? 90 : 365;
    const path = generatePath(days);
    const labels = Array.from({length: days}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - i));
        return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    });

    setChartData({
      labels,
      datasets: [{
        label: 'Portfolio Value',
        data: path,
        borderColor: '#D946EF',
        backgroundColor: 'rgba(217, 70, 239, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0
      }]
    });
  }, [activeRange]);

  // Generate Risk Histogram mock to match UI
  const histBins = 40;
  const histData = {
    labels: Array.from({length: histBins}).map((_, i) => `${-15 + i*0.75}%`),
    datasets: [{
      label: 'Frequency',
      data: Array.from({length: histBins}).map((_, i) => Math.exp(-Math.pow(i - 20, 2) / 50) * 100),
      backgroundColor: Array.from({length: histBins}).map((_, i) => i < 12 ? '#F0007B' : '#A855F7'),
      borderWidth: 0,
      barPercentage: 0.9,
      categoryPercentage: 1.0
    }]
  };

  return (
    <div className="page-animate" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px' }}>Portfolio Intelligence</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
            Real-time risk exposure and performance analytics
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <MetricCard 
          title="Value At Risk (95%)"
          value="-4.20%"
          trend={-1.2}
          isPositiveTrend={false}
          color="var(--status-error)"
          desc="Maximum expected loss over a 1-day horizon with 95% confidence."
        />
        <MetricCard 
          title="Expected Shortfall"
          value="-8.50%"
          trend={0.5}
          isPositiveTrend={true}
          color="var(--status-error)"
          desc="Average loss in the worst 5% of scenarios."
        />
        <MetricCard 
          title="Annualized Volatility"
          value="18.50%"
          trend={2.1}
          isPositiveTrend={true}
          color="var(--accent-lavender)"
          desc="Standard deviation of portfolio returns over the last 252 trading days."
        />
        <MetricCard 
          title="Sharpe Ratio"
          value="1.42"
          trend={4.5}
          isPositiveTrend={true}
          color="var(--text-primary)"
          desc="Risk-adjusted return relative to the risk-free rate."
        />
      </div>

      {/* Performance History Line Chart */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <TrendingUp color="var(--accent-emerald)" /> Performance History
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
               {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(range => (
                 <button 
                   key={range}
                   onClick={() => setActiveRange(range)}
                   style={{ 
                     background: activeRange === range ? 'rgba(16, 185, 129, 0.15)' : 'transparent', 
                     border: `1px solid ${activeRange === range ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)'}`,
                     color: activeRange === range ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                     padding: '6px 16px',
                     borderRadius: '6px',
                     fontSize: '0.75rem',
                     fontWeight: 600,
                     cursor: 'pointer'
                   }}>
                   {range}
                 </button>
               ))}
            </div>
         </div>
         <div style={{ height: '300px' }}>
            {chartData && (
              <Line 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                  scales: {
                     x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: '#666' } },
                     y: { 
                       grid: { color: 'rgba(255,255,255,0.05)' }, 
                       ticks: { callback: (val) => `$${val}`, color: '#666' } 
                     }
                  }
                }} 
              />
            )}
         </div>
      </div>

      {/* Risk Histogram & Top Holdings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
           <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <AlertTriangle color="#EF4444" /> Risk Distribution (Monte Carlo)
           </h2>
           <div style={{ height: '300px' }}>
              <Bar 
                 data={histData}
                 options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                       x: { 
                          grid: { display: false }, 
                          ticks: { maxTicksLimit: 12, color: '#666' },
                          title: { display: true, text: 'SIMULATED PORTFOLIO RETURNS (%)', color: '#666', font: { family: 'monospace', size: 12 }, padding: { top: 20 } }
                       },
                       y: { display: false, grid: { display: false } }
                    }
                 }}
              />
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
