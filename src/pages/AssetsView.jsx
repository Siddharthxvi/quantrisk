import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { Plus, X, AlertCircle, Edit2, Trash2 } from 'lucide-react';

const AssetsView = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  
  const [editAssetId, setEditAssetId] = useState(null);
  
  const resetForm = () => {
    setEditAssetId(null);
    setFormData({
      ticker: '',
      asset_name: '',
      currency: 'USD',
      base_price: '',
      annual_volatility: '',
      annual_return: '',
      type_name: 'equity'
    });
  };
  
  const [formData, setFormData] = useState({
    ticker: '',
    asset_name: '',
    currency: 'USD',
    base_price: '',
    annual_volatility: '',
    annual_return: '',
    type_name: 'equity'
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await apiClient('/assets/');
      setAssets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        annual_volatility: parseFloat(formData.annual_volatility) / 100,
        annual_return: parseFloat(formData.annual_return) / 100
      };

      if (editAssetId) {
        await apiClient(`/assets/${editAssetId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiClient('/assets/', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      resetForm();
      fetchAssets();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await apiClient(`/assets/${id}`, { method: 'DELETE' });
      fetchAssets();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="page-animate">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Asset Library</h1>
          <p style={{ margin: 0 }}>Manage universe of base financial assets</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {error ? (
        <div style={{ color: 'var(--status-error)' }}>Failed to load assets: {error}</div>
      ) : loading ? (
        <div>Loading assets...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Name</th>
                <th>Type</th>
                <th>Price</th>
                <th>Vol (σ)</th>
                <th>Return (μ)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.asset_id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{asset.ticker}</td>
                  <td>{asset.asset_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                     <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-dark)', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                        {/* the DB expects a type_id or we just show the base entity type, asset_type is returned occasionally */}
                        {asset.asset_type || 'Asset'}
                     </span>
                  </td>
                  <td>{asset.base_price?.toFixed(2)} {asset.currency}</td>
                  <td>{(asset.annual_volatility * 100).toFixed(1)}%</td>
                  <td style={{ color: asset.annual_return >= 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
                    {(asset.annual_return * 100).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button title="Edit" onClick={() => {
                      setEditAssetId(asset.asset_id);
                      setFormData({
                        ticker: asset.ticker,
                        asset_name: asset.asset_name,
                        currency: asset.currency,
                        base_price: asset.base_price,
                        annual_volatility: (asset.annual_volatility * 100).toFixed(1),
                        annual_return: (asset.annual_return * 100).toFixed(1),
                        type_name: asset.asset_type || 'equity'
                      });
                      setIsModalOpen(true);
                    }} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px', color: 'var(--text-secondary)', marginRight: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 size={14} />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(asset.asset_id)} style={{ background: 'transparent', border: '1px solid var(--status-error)', borderRadius: '4px', padding: '6px', color: 'var(--status-error)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No assets in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Basic Modal */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 15, 28, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px' }}>{editAssetId ? 'Edit Asset' : 'Add New Asset'}</h2>
            
            {formError && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-error)', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAsset} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Asset Name</label>
                <input required name="asset_name" value={formData.asset_name} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="Apple Inc." />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Ticker</label>
                <input required name="ticker" value={formData.ticker} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textTransform: 'uppercase' }} placeholder="AAPL" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Type</label>
                <select name="type_name" value={formData.type_name} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="equity">Equity</option>
                  <option value="bond">Bond</option>
                  <option value="commodity">Commodity</option>
                  <option value="derivative">Derivative</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Base Price</label>
                <input type="number" step="0.01" min="0.01" required name="base_price" value={formData.base_price} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="150.00" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Annual Volatility (%)</label>
                <input type="number" step="0.1" min="0.1" required name="annual_volatility" value={formData.annual_volatility} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="25" />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Expected Annual Return (%)</label>
                <input type="number" step="0.1" required name="annual_return" value={formData.annual_return} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} placeholder="8.5" />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                <button type="submit" disabled={formLoading} style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--accent-cyan)', color: '#000', fontWeight: 'bold', border: 'none', cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                  {formLoading ? 'Saving...' : (editAssetId ? 'Update Asset' : 'Save Asset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsView;
