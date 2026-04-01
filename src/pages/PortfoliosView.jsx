import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { Plus, X, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PortfoliosView = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [editPortfolioId, setEditPortfolioId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', base_currency: 'USD' });

  const resetForm = () => {
    setEditPortfolioId(null);
    setFormData({ name: '', description: '', base_currency: 'USD' });
  };

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/portfolios/');
      setPortfolios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolios(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editPortfolioId) {
        await apiClient(`/portfolios/${editPortfolioId}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        await apiClient('/portfolios/', { method: 'POST', body: JSON.stringify(formData) });
      }
      setIsModalOpen(false);
      resetForm();
      fetchPortfolios();
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this portfolio?")) return;
    try {
      await apiClient(`/portfolios/${id}`, { method: 'DELETE' });
      fetchPortfolios();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Portfolios</h1>
          <p style={{ margin: 0 }}>Manage collections of assets</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(90deg, #8B5CF6, #D946EF)', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
          <Plus size={18} /> New Portfolio
        </button>
      </div>

      {loading ? <div>Loading portfolios...</div> : error ? <div style={{ color: 'var(--status-error)' }}>{error}</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {portfolios.map(p => (
            <div key={p.portfolio_id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                {p.name}
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--bg-dark)', color: 'var(--text-secondary)' }}>
                  {p.base_currency}
                </span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', flexGrow: 1, minHeight: '40px' }}>
                {p.description || 'No description provided.'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Link to={`/portfolios/${p.portfolio_id}`} style={{ textDecoration: 'none', color: 'var(--accent-purple)', fontWeight: 600, fontSize: '0.875rem' }}>
                  Manage Assets &rarr;
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    title="Edit"
                    onClick={() => {
                       setEditPortfolioId(p.portfolio_id);
                       setFormData({ name: p.name, description: p.description || '', base_currency: p.base_currency || 'USD' });
                       setIsModalOpen(true);
                    }}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    title="Delete"
                    onClick={() => handleDelete(p.portfolio_id)}
                    style={{ background: 'transparent', border: '1px solid var(--status-error)', borderRadius: '4px', padding: '6px', color: 'var(--status-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {portfolios.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--glass-bg)', borderRadius: '12px' }}>
              No portfolios created yet.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '24px' }}>{editPortfolioId ? 'Edit Portfolio' : 'Create Portfolio'}</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Portfolio Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="e.g. Aggressive Growth" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Base Currency</label>
                <select value={formData.base_currency} onChange={e => setFormData({...formData, base_currency: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="Optional notes..."></textarea>
              </div>
              <button type="submit" disabled={formLoading} style={{ marginTop: '8px', padding: '12px', borderRadius: '6px', background: 'var(--accent-purple)', color: '#ffffff', fontWeight: 'bold', border: 'none' }}>
                {formLoading ? 'Saving...' : (editPortfolioId ? 'Update Settings' : 'Create Portfolio')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfoliosView;
