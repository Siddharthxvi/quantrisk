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
  const [tempQuantity, setTempQuantity] = useState('');

  const calculateWeights = (assets, assetsLibrary) => {
    const totalValue = assets.reduce((sum, item) => {
      const assetInfo = item.asset || assetsLibrary.find(a => a.asset_id === item.asset_id);
      return sum + (parseFloat(item.quantity || 0) * (assetInfo?.base_price || 0));
    }, 0);
    
    if (totalValue === 0) return assets.map(a => ({ ...a, weight: 0 }));
    
    return assets.map(item => {
      const assetInfo = item.asset || assetsLibrary.find(a => a.asset_id === item.asset_id);
      return {
        ...item,
        weight: (parseFloat(item.quantity || 0) * (assetInfo?.base_price || 0)) / totalValue
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const pData = await apiClient(`/portfolios/${id}`);
      const aData = await apiClient('/assets/');
      setAllAssets(aData);
      setPortfolio(pData);
      setPortfolioAssets(pData.assets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddAsset = () => {
    if (!selectedAssetId || !tempQuantity) return;
    
    // Check if already in list
    if (portfolioAssets.find(a => a.asset_id === parseInt(selectedAssetId))) {
      alert("Asset already in portfolio");
      return;
    }

    const assetInfo = allAssets.find(a => a.asset_id === parseInt(selectedAssetId));
    const newAsset = {
      asset_id: parseInt(selectedAssetId),
      quantity: parseFloat(tempQuantity),
      asset: assetInfo,
      weight: 0 // Will be recalculated
    };

    const updatedList = calculateWeights([...portfolioAssets, newAsset], allAssets);
    setPortfolioAssets(updatedList);
    setSelectedAssetId('');
    setTempQuantity('');
  };

  const handleUpdateQuantity = (assetId, newQty) => {
    const updatedList = portfolioAssets.map(a => 
      a.asset_id === assetId ? { ...a, quantity: parseFloat(newQty) || 0 } : a
    );
    setPortfolioAssets(calculateWeights(updatedList, allAssets));
  };

  const handleRemoveAsset = (assetId) => {
    const updatedList = portfolioAssets.filter(a => a.asset_id !== assetId);
    setPortfolioAssets(calculateWeights(updatedList, allAssets));
  };

  const handleSave = async () => {
    // Validate sum = 1.0 (with small tolerance)
    const sum = portfolioAssets.reduce((acc, curr) => acc + curr.weight, 0);
    if (portfolioAssets.length > 0 && Math.abs(sum - 1.0) > 0.001) {
      setError(`Total weight must equal exactly 100%. Current sum: ${(sum * 100).toFixed(1)}%`);
      return;
    }
    
    setError(null);
    setSaving(true);
    try {
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
  const isWeightValid = portfolioAssets.length === 0 || Math.abs(currentWeightSum - 1.0) <= 0.001;

  // Calculation for the "preview" in add form
  const getProjectedWeight = () => {
    if (!selectedAssetId || !tempQuantity) return 0;
    const assetInfo = allAssets.find(a => a.asset_id === parseInt(selectedAssetId));
    if (!assetInfo) return 0;
    
    const newVal = parseFloat(tempQuantity) * assetInfo.base_price;
    const currentVal = portfolioAssets.reduce((sum, item) => {
      const a = item.asset || allAssets.find(x => x.asset_id === item.asset_id);
      return sum + (item.quantity * (a?.base_price || 0));
    }, 0);
    
    return (newVal / (currentVal + newVal)) * 100;
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading portfolio data...</div>;
  if (!portfolio) return <div style={{ padding: '40px', textAlign: 'center' }}>Portfolio not found</div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <Link to="/portfolios" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Back to Portfolios
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{portfolio.name}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{portfolio.description || 'No description'} | {portfolio.base_currency}</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || portfolioAssets.length === 0}
          style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--status-success)', color: '#000', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: (saving || portfolioAssets.length === 0) ? 'not-allowed' : 'pointer', opacity: (saving || portfolioAssets.length === 0) ? 0.6 : 1 }}
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
                    <th>Price</th>
                    <th style={{ width: '120px' }}>Quantity</th>
                    <th>Weight</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioAssets.map(pa => {
                    const matchedAsset = pa.asset || allAssets.find(a => a.asset_id === pa.asset_id);
                    return (
                      <tr key={pa.asset_id}>
                        <td style={{ fontWeight: 600 }}>{matchedAsset ? matchedAsset.ticker : `ID: ${pa.asset_id}`}</td>
                        <td style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{matchedAsset?.asset_type || '-'}</td>
                        <td>{matchedAsset?.base_price?.toFixed(2)}</td>
                        <td>
                          <input 
                            type="number" 
                            value={pa.quantity} 
                            onChange={(e) => handleUpdateQuantity(pa.asset_id, e.target.value)}
                            style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{(pa.weight * 100).toFixed(1)}%</td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleRemoveAsset(pa.asset_id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-error)', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {portfolioAssets.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No assets added yet.</td></tr>
                  )}
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    <td colSpan="4" style={{ fontWeight: 700, textAlign: 'right' }}>Total Weight:</td>
                    <td style={{ fontWeight: 700, color: isWeightValid ? 'var(--status-success)' : 'var(--status-error)' }}>
                      {(currentWeightSum * 100).toFixed(1)}%
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {!isWeightValid && portfolioAssets.length > 0 && (
               <div style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <AlertCircle size={14} />
                 Weights must sum to 100% (currently {(currentWeightSum * 100).toFixed(1)}%).
               </div>
            )}
          </div>
        </div>

        {/* Right Col: Add Asset Form */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add Position</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Select Asset</label>
              <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">-- Choose Asset --</option>
                {allAssets.map(a => (
                  <option key={a.asset_id} value={a.asset_id}>{a.ticker} - {a.asset_name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Quantity</label>
              <input type="number" step="0.01" value={tempQuantity} onChange={e => setTempQuantity(e.target.value)} placeholder="e.g. 100" style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>

            {selectedAssetId && tempQuantity && (
              <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Projected Weight</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{getProjectedWeight().toFixed(1)}%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>* Relative to new total portfolio value</div>
              </div>
            )}

            <button onClick={handleAddAsset} disabled={!selectedAssetId || !tempQuantity} style={{ width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: (!selectedAssetId || !tempQuantity) ? 'not-allowed' : 'pointer' }}>
              Add to Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetail;
