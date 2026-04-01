import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { Link } from 'react-router-dom';
import { History, CheckCircle, XCircle, Clock, Eye, Edit2, Trash2 } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(val));

const HistoryView = () => {
  const [runs, setRuns] = useState([]);
  const [portfolios, setPortfolios] = useState({});
  const [scenarios, setScenarios] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [rData, pData, sData] = await Promise.all([
        apiClient('/simulation-runs/'),
        apiClient('/portfolios/'),
        apiClient('/scenarios/')
      ]);
      
      const pMap = {}; pData.forEach(p => pMap[p.portfolio_id] = p.name);
      const sMap = {}; sData.forEach(s => sMap[s.scenario_id] = s.name);
      
      setPortfolios(pMap);
      setScenarios(sMap);
      setRuns(rData.sort((a,b) => b.run_id - a.run_id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this simulation run?")) return;
    try {
      await apiClient(`/simulation-runs/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert("Failed to delete simulation: " + err.message);
    }
  };

  const handleEdit = async (run) => {
    // Faking an edit by mutating the number of iterations using the mock PUT handler
    const newIters = window.prompt("Edit Simulation: Enter new number of iterations:", "10000");
    if (!newIters) return;
    try {
      await apiClient(`/simulation-runs/${run.run_id}`, {
        method: 'PUT',
        body: JSON.stringify({ num_simulations: parseInt(newIters) })
      });
      alert(`Simulation ${run.run_id} updated. Note: Real production runs are typically immutable.`);
      fetchData();
    } catch (err) {
      alert("Failed to update simulation: " + err.message);
    }
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'completed':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-success)', border: '1px solid rgba(34, 197, 94, 0.2)' }}><CheckCircle size={12} /> {status}</span>;
      case 'failed':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}><XCircle size={12} /> {status}</span>;
      default:
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}><Clock size={12} /> {status}</span>;
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History color="var(--accent-purple)" /> Run History
          </h1>
          <p style={{ margin: 0 }}>Log of all system Monte Carlo executions</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID &nbsp;&nbsp;&nbsp; Timestamp</th>
              <th>Portfolio</th>
              <th>Scenario</th>
              <th>Status</th>
              <th>VaR (95%)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading runs...</td></tr>
            ) : runs.map(run => {
              const var95 = run.risk_metrics?.find(m => m.metric_type === 'VaR_95')?.metric_value;
              return (
                <tr key={run.run_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{run.run_id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(run.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td>{portfolios[run.portfolio_id] || `ID ${run.portfolio_id}`}</td>
                  <td>{scenarios[run.scenario_id] || `ID ${run.scenario_id}`}</td>
                  <td><StatusBadge status={run.status} /></td>
                  <td style={{ fontWeight: var95 ? 600 : 400, color: var95 ? 'var(--status-error)' : 'inherit' }}>
                    {var95 ? `$${formatCurrency(var95).replace('$', '')}` : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link title="View" to={`/simulations/${run.run_id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--accent-cyan)', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '4px', textDecoration: 'none' }}>
                        <Eye size={14} />
                      </Link>
                      <button title="Edit" onClick={() => handleEdit(run)} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={14} />
                      </button>
                      <button title="Delete" onClick={() => handleDelete(run.run_id)} style={{ background: 'transparent', border: '1px solid var(--status-error)', borderRadius: '4px', padding: '6px', color: 'var(--status-error)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && runs.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No simulations have been run yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryView;
