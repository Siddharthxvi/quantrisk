import { mockAssets, mockPortfolios, mockScenarios, mockRuns, delay } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://portfolio-risk-analytics-backend.onrender.com';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // Set via .env or Vercel config

export const apiClient = async (endpoint, options = {}) => {
  if (USE_MOCK) {
    await delay(300); // Simulate local network latency
    
    const isPost = options.method === 'POST';
    const isPut = options.method === 'PUT';
    
    if (endpoint.includes('/auth/login')) {
      const body = JSON.parse(options.body || '{}');
      const username = body.username || '';
      localStorage.setItem('mock_username', username);
      return { access_token: 'mock_token_123' };
    }
    if (endpoint.includes('/auth/me')) {
      const username = localStorage.getItem('mock_username') || 'user@analyst.quantrisk';
      let role = 'VIEWER';
      if (username.includes('@dbadmin.quantrisk')) role = 'ADMIN';
      else if (username.includes('@analyst.quantrisk')) role = 'ANALYST';
      return { user_id: 1, username, full_name: username.split('@')[0], email: username, role, is_active: true };
    }
    if (endpoint.includes('/auth/logout')) return { message: 'Logged out' };
    
    // Developer Mock Endpoints
    if (endpoint.includes('/health')) return { status: 'healthy', version: '1.0.0', db: 'connected' };
    if (endpoint.includes('/simulation-runs/test')) return { message: 'Test simulation engine fired successfully', status: 'ok' };
    if (endpoint.includes('/verify-schema')) return { status: 'verified', entities: 5, mappings: 'valid' };
    if (endpoint.match(/\/users\/\d+/)) {
      const id = parseInt(endpoint.split('/')[2]);
      if (options.method === 'PUT') {
        return { user_id: id, ...JSON.parse(options.body), role: 'ANALYST', is_active: true };
      }
      if (options.method === 'DELETE') {
        return { message: 'User deactivated' };
      }
      return { user_id: id, username: 'demo_user', email: 'demo@analyst.quantrisk', role: 'ANALYST', is_active: true, created_at: new Date().toISOString() };
    }
    if (endpoint.includes('/users')) {
      if (isPost) return { ...JSON.parse(options.body), user_id: Date.now() };
      return [
        { user_id: 1, username: 'siddharth@dbadmin.quantrisk', email: 'sid@admin.quantrisk', role: 'ADMIN', is_active: true, created_at: new Date().toISOString() },
        { user_id: 2, username: 'alice@analyst.quantrisk', email: 'alice@firm.com', role: 'ANALYST', is_active: true, created_at: new Date().toISOString() },
        { user_id: 3, username: 'bob@portviewer.quantrisk', email: 'bob@firm.com', role: 'VIEWER', is_active: false, created_at: new Date().toISOString() },
      ];
    }
    
    if (endpoint.includes('/settings')) {
      if (options.method === 'PUT') return { ...JSON.parse(options.body), user_id: 1 };
      return { default_iterations: 10000, default_horizon_days: 252, default_confidence_level: 0.95, user_id: 1 };
    }
    
    if (endpoint.match(/\/assets\/\d+/)) {
      const id = parseInt(endpoint.split('/')[2]);
      const idx = mockAssets.findIndex(a => a.asset_id === id);
      if (options.method === 'DELETE') {
         if (idx > -1) mockAssets.splice(idx, 1);
         return { message: 'Deleted' };
      }
      if (options.method === 'PUT') {
         if (idx > -1) {
            mockAssets[idx] = { ...mockAssets[idx], ...JSON.parse(options.body) };
            return mockAssets[idx];
         }
      }
      return mockAssets[idx] || null;
    }
    
    if (endpoint.includes('/assets/')) {
      if (isPost) {
         const newAsset = { ...JSON.parse(options.body), asset_id: mockAssets.length + 1 };
         mockAssets.push(newAsset);
         return newAsset;
      }
      return mockAssets;
    }
    
    if (endpoint.match(/\/portfolios\/\d+\/assets/)) {
      if (isPut) {
         const id = parseInt(endpoint.split('/')[2]);
         const p = mockPortfolios.find(x => x.portfolio_id === id);
         const body = JSON.parse(options.body);
         if (p) p.assets = body.assets;
         return { message: 'Updated' };
      }
    }
    
    if (endpoint.match(/\/portfolios\/\d+/)) {
      const id = parseInt(endpoint.split('/')[2]);
      const idx = mockPortfolios.findIndex(p => p.portfolio_id === id);
      
      if (options.method === 'DELETE') {
         if (idx > -1) mockPortfolios.splice(idx, 1);
         return { message: 'Deleted' };
      }
      if (options.method === 'PUT') {
         if (idx > -1) Object.assign(mockPortfolios[idx], JSON.parse(options.body));
         return mockPortfolios[idx];
      }
      return mockPortfolios[idx] || null;
    }
    
    if (endpoint.includes('/portfolios/')) {
       if (isPost) {
         const newP = { ...JSON.parse(options.body), portfolio_id: mockPortfolios.length + 1, assets: [] };
         mockPortfolios.push(newP);
         return newP;
       }
       return mockPortfolios;
    }
    
    if (endpoint.match(/\/scenarios\/\d+/)) {
      const id = parseInt(endpoint.split('/')[2]);
      const idx = mockScenarios.findIndex(s => s.scenario_id === id);
      
      if (options.method === 'DELETE') {
         if (idx > -1) mockScenarios.splice(idx, 1);
         return { message: 'Deleted' };
      }
      if (options.method === 'PUT') {
         if (idx > -1) Object.assign(mockScenarios[idx], JSON.parse(options.body));
         return mockScenarios[idx];
      }
      return mockScenarios[idx] || null;
    }

    if (endpoint.includes('/scenarios/')) {
      if (isPost) {
         const newS = { ...JSON.parse(options.body), scenario_id: mockScenarios.length + 1, created_at: new Date().toISOString() };
         mockScenarios.push(newS);
         return newS;
      }
      return mockScenarios;
    }
    
    if (endpoint.includes('/simulation-runs/ad-hoc')) {
       await delay(800);
       return {
         metrics: {
           VaR_95: 14500.5,
           ES_95: 21000.7,
           volatility: 0.18,
           max_drawdown: 35000.0
         },
         histogram: mockRuns[0].histogram_data
       };
    }
    
    if (endpoint.match(/\/simulation-runs\/\d+/)) {
       const id = parseInt(endpoint.split('/')[2]);
       const idx = mockRuns.findIndex(r => r.run_id === id);
       
       if (options.method === 'DELETE') {
          if (idx > -1) mockRuns.splice(idx, 1);
          return { message: 'Deleted' };
       }
       if (options.method === 'PUT') {
          if (idx > -1) Object.assign(mockRuns[idx], JSON.parse(options.body));
          return mockRuns[idx];
       }
       return mockRuns[idx] || mockRuns[0];
    }

    if (endpoint.match(/\/dashboard\/\d+/)) {
      const pid = parseInt(endpoint.split('/')[2]);
      const pRuns = mockRuns.filter(r => r.portfolio_id === pid);
      const latest = pRuns.sort((a,b) => new Date(b.started_at) - new Date(a.started_at))[0] || mockRuns[0];
      
      const portfolio = mockPortfolios.find(p => p.portfolio_id === pid) || mockPortfolios[0];
      
      return {
        latest_metrics: {
          VaR_95: latest.risk_metrics.find(m => m.metric_type === 'VaR_95')?.metric_value || 0.042,
          ES_95: latest.risk_metrics.find(m => m.metric_type === 'ES_95')?.metric_value || 0.085,
          volatility: latest.risk_metrics.find(m => m.metric_type === 'volatility')?.metric_value || 0.18,
          max_drawdown: latest.risk_metrics.find(m => m.metric_type === 'max_drawdown')?.metric_value || 0.25
        },
        histogram: latest.histogram_data,
        holdings: portfolio.assets.map(pa => {
          const asset = mockAssets.find(a => a.asset_id === pa.asset_id);
          return {
            ticker: asset?.ticker || 'N/A',
            weight: pa.weight,
            risk_contribution: pa.weight * (asset?.annual_volatility || 0.2) / 0.35 // Mock calc
          };
        }),
        runs_summary: {
          total: pRuns.length,
          completed: pRuns.filter(r => r.status === 'completed').length,
          failed: pRuns.filter(r => r.status === 'failed').length,
          last_run_id: latest.run_id,
          last_run_at: latest.started_at
        }
      };
    }
    
    if (endpoint.includes('/simulation-runs/')) {
      if (isPost) {
         await delay(1500);
         const req = JSON.parse(options.body);
         const newRun = {
           run_id: mockRuns.length + 1,
           status: 'completed',
           run_type: req.simulation_type || 'monte_carlo',
           num_simulations: req.num_simulations || 10000,
           time_horizon_days: req.time_horizon_days || 252,
           ...req,
           started_at: new Date().toISOString(),
           completed_at: new Date().toISOString(),
           risk_metrics: mockRuns[0].risk_metrics,
           histogram_data: mockRuns[0].histogram_data
         };
         mockRuns.push(newRun);
         return newRun;
      }
      return mockRuns;
    }
    
    throw new Error('Mock endpoint not found: ' + endpoint);
  }

  // Original Fetch implementation
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    const contentType = response.headers.get('content-type');
    const data = (contentType && contentType.includes('application/json')) ? await response.json() : await response.text();
    
    if (!response.ok) throw new Error(typeof data === 'string' ? data : (data.detail ? JSON.stringify(data.detail) : data.message || response.statusText));
    return data;
  } catch (error) {
    throw error;
  }
};
