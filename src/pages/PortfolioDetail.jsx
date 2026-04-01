import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import { ArrowLeft, Save, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PortfolioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [allAssets, setAllAssets] = useState([]);
  const [portfolioAssets, setPortfolioAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Selector state
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [tempWeight, setTempWeight] = useState('');
  const [tempQuantity, setTempQuantity] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const pData = await apiClient(`/portfolios/${id}`);
      setPortfolio(pData);
      setPortfolioAssets(pData.assets || []);
      
      const aData = await apiClient('/assets/');
      setAllAssets(aData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddAsset = () => {
    if (!selectedAssetId || !tempWeight || !tempQuantity) return;
    
    // Check if already in list
    if (portfolioAssets.find(a => a.asset_id === parseInt(selectedAssetId))) {
      alert("Asset already in portfolio");
      return;
    }

    const newAsset = {
      asset_id: parseInt(selectedAssetId),
      weight: parseFloat(tempWeight) / 100, // UX inputs % e.g. 50 -> 0.5
      quantity: parseFloat(tempQuantity),
      asset: allAssets.find(a => a.asset_id === parseInt(selectedAssetId))
    };

    setPortfolioAssets([...portfolioAssets, newAsset]);
    setSelectedAssetId('');
    setTempWeight('');
    setTempQuantity('');
  };

  const handleRemoveAsset = (assetId) => {
    setPortfolioAssets(portfolioAssets.filter(a => a.asset_id !== assetId));
  };

  const handleSave = async () => {
    // Validate sum = 1.0
    const sum = portfolioAssets.reduce((acc, curr) => acc + curr.weight, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      setError(`Total weight must equal exactly 100%. Current sum: ${(sum * 100).toFixed(1)}%`);
      return;
    }
    
    setError(null);
    setSaving(true);
    try {
      // The openapi definition for update_portfolio_assets corresponds to PUT /portfolios/{id}/assets
      // Expected body: PortfolioCreate schema {"name": "...", "assets": [{"asset_id": X, "weight": Y, "quantity": Z}]}
      await apiClient(`/portfolios/${id}/assets`, {
        method: 'PUT',
        body: JSON.stringify(portfolioAssets.map(a => ({
          asset_id: a.asset_id,
          weight: a.weight,
          quantity: a.quantity
        })))
      });
      fetchData(); // reload
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentWeightSum = portfolioAssets.reduce((acc, curr) => acc + curr.weight, 0);
  const isWeightValid = Math.abs(currentWeightSum - 1.0) <= 0.001;

  if (loading) return <div>Loading...</div>;
  if (!portfolio) return <div>Portfolio not found</div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <Link to="/portfolios" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Portfolios
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{portfolio.name}</h1>
          <p style={{ margin: 0 }}>{portfolio.description} | {portfolio.base_currency}</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || portfolioAssets.length === 0}
          style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--status-success)', color: '#000', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Allocation'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-error)', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', fontSize: '0.875rem', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Left Col: Asset List */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Current Assets</h3>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Weight</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioAssets.map(pa => {
                    const matchedAsset = pa.asset || allAssets.find(a => a.asset_id === pa.asset_id);
                    return (
                      <tr key={pa.asset_id}>
                        <td style={{ fontWeight: 600 }}>{matchedAsset ? matchedAsset.ticker : `ID: ${pa.asset_id}`}</td>
                        <td style={{ textTransform: 'capitalize' }}>{matchedAsset?.asset_type || '-'}</td>
                        <td style={{ color: 'var(--accent-cyan)' }}>{(pa.weight * 100).toFixed(1)}%</td>
                        <td>{pa.quantity}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleRemoveAsset(pa.asset_id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {portfolioAssets.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No assets added yet.</td></tr>
                  )}
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    <td colSpan="2" style={{ fontWeight: 700, textAlign: 'right' }}>Total Weight:</td>
                    <td style={{ fontWeight: 700, color: isWeightValid ? 'var(--status-success)' : 'var(--status-error)' }}>
                      {(currentWeightSum * 100).toFixed(1)}%
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {!isWeightValid && portfolioAssets.length > 0 && (
               <div style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--status-error)' }}>
                 * Warning: Portfolio weights must sum to exactly 100% before saving.
               </div>
            )}
          </div>
        </div>

        {/* Right Col: Add Asset Form */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add Position</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Select Asset</label>
              <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">-- Choose Asset --</option>
                {allAssets.map(a => (
                  <option key={a.asset_id} value={a.asset_id}>{a.ticker} - {a.asset_name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Weight (%)</label>
              <input type="number" step="0.1" value={tempWeight} onChange={e => setTempWeight(e.target.value)} placeholder="e.g. 25" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>Quantity</label>
              <input type="number" step="0.01" value={tempQuantity} onChange={e => setTempQuantity(e.target.value)} placeholder="e.g. 100" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>

            <button onClick={handleAddAsset} disabled={!selectedAssetId || !tempWeight || !tempQuantity} style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}>
              Add to Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetail;
