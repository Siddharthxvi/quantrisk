import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { Plus, X, Activity, Edit2, Trash2 } from 'lucide-react';

const ScenariosView = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [editScenarioId, setEditScenarioId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    interest_rate_shock_bps: '',
    volatility_multiplier: '1.0',
    equity_shock_pct: '0'
  });

  const resetForm = () => {
    setEditScenarioId(null);
    setFormData({
      name: '',
      description: '',
      interest_rate_shock_bps: '',
      volatility_multiplier: '1.0',
      equity_shock_pct: '0'
    });
  };

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/scenarios/');
      setScenarios(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScenarios(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        interest_rate_shock_bps: parseInt(formData.interest_rate_shock_bps),
        volatility_multiplier: parseFloat(formData.volatility_multiplier),
        equity_shock_pct: parseFloat(formData.equity_shock_pct) / 100
      };

      if (editScenarioId) {
        await apiClient(`/scenarios/${editScenarioId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiClient('/scenarios/', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      resetForm();
      fetchScenarios();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scenario?")) return;
    try {
      await apiClient(`/scenarios/${id}`, { method: 'DELETE' });
      fetchScenarios();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Scenario Builder</h1>
          <p style={{ margin: 0 }}>Define market shocks and stress tests for your models.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--accent-emerald), #059669)', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
          <Plus size={18} /> Create Scenario
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Scenario Name</th>
              <th>Interest Rate Shock</th>
              <th>Vol Multiplier</th>
              <th>Equity Shock</th>
              <th>Date Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(s => (
              <tr key={s.scenario_id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description}</div>
                </td>
                <td style={{ color: s.interest_rate_shock_bps < 0 ? 'var(--accent-cyan)' : s.interest_rate_shock_bps > 0 ? 'var(--status-error)' : 'inherit' }}>
                  {s.interest_rate_shock_bps > 0 ? '+' : ''}{s.interest_rate_shock_bps} bps
                </td>
                <td style={{ color: s.volatility_multiplier > 1 ? 'var(--status-error)' : 'inherit' }}>
                  {s.volatility_multiplier.toFixed(2)}x
                </td>
                <td style={{ color: s.equity_shock_pct < 0 ? 'var(--status-error)' : s.equity_shock_pct > 0 ? 'var(--status-success)' : 'inherit' }}>
                  {(s.equity_shock_pct * 100).toFixed(1)}%
                </td>
                <td style={{ fontSize: '0.875rem' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button title="Edit" onClick={() => {
                    setEditScenarioId(s.scenario_id);
                    setFormData({
                      name: s.name,
                      description: s.description || '',
                      interest_rate_shock_bps: s.interest_rate_shock_bps,
                      volatility_multiplier: s.volatility_multiplier,
                      equity_shock_pct: (s.equity_shock_pct * 100).toFixed(1)
                    });
                    setIsModalOpen(true);
                  }} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'var(--text-secondary)', marginRight: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={14} />
                  </button>
                  <button title="Delete" onClick={() => handleDelete(s.scenario_id)} style={{ background: 'transparent', border: '1px solid var(--status-error)', borderRadius: '4px', padding: '6px', color: 'var(--status-error)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} className="glass-panel modal-animate" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity color="var(--accent-emerald)" /> {editScenarioId ? 'Edit Scenario' : 'Create Scenario'}
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="e.g. 2008 Financial Crisis" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Description</label>
                <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>IR Shock (bps)</label>
                <input type="number" required value={formData.interest_rate_shock_bps} onChange={e => setFormData({...formData, interest_rate_shock_bps: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="e.g. 300" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Volatility Multiplier</label>
                <input type="number" step="0.1" min="0.1" required value={formData.volatility_multiplier} onChange={e => setFormData({...formData, volatility_multiplier: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="e.g. 1.5" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Equity Shock (%)</label>
                <input type="number" step="0.1" min="-100" max="100" required value={formData.equity_shock_pct} onChange={e => setFormData({...formData, equity_shock_pct: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="e.g. -20" />
              </div>
              <button type="submit" disabled={formLoading} style={{ marginTop: '8px', padding: '12px', borderRadius: '6px', background: 'var(--accent-emerald)', color: '#000000', fontWeight: 'bold', border: 'none' }}>
                {formLoading ? 'Saving...' : (editScenarioId ? 'Update Scenario' : 'Save Scenario')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenariosView;
