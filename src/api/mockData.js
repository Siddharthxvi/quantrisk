export const mockAssets = [
  { asset_id: 1, ticker: 'AAPL', asset_name: 'Apple Inc.', asset_type: 'equity', currency: 'USD', base_price: 150.0, annual_volatility: 0.28, annual_return: 0.12 },
  { asset_id: 2, ticker: 'MSFT', asset_name: 'Microsoft', asset_type: 'equity', currency: 'USD', base_price: 320.0, annual_volatility: 0.24, annual_return: 0.15 },
  { asset_id: 3, ticker: 'TSLA', asset_name: 'Tesla', asset_type: 'equity', currency: 'USD', base_price: 210.0, annual_volatility: 0.55, annual_return: 0.20 },
  { asset_id: 4, ticker: 'US10Y', asset_name: 'US 10-Year Treasury', asset_type: 'bond', currency: 'USD', base_price: 100.0, annual_volatility: 0.05, annual_return: 0.04 },
];

export const mockPortfolios = [
  { 
    portfolio_id: 1, name: 'Aggressive Growth', description: 'High risk tech equity portfolio', base_currency: 'USD', 
    assets: [
      { asset_id: 1, weight: 0.6, quantity: 100 },
      { asset_id: 3, weight: 0.4, quantity: 50 }
    ] 
  },
  { 
    portfolio_id: 2, name: 'Conservative Bond', description: 'Low risk treasury allocations', base_currency: 'USD', 
    assets: [
      { asset_id: 4, weight: 1.0, quantity: 500 }
    ] 
  }
];

export const mockScenarios = [
  { scenario_id: 1, name: 'Baseline Data', description: 'Normal market conditions', interest_rate_shock_bps: 0, volatility_multiplier: 1.0, equity_shock_pct: 0, created_at: new Date().toISOString() },
  { scenario_id: 2, name: '2008 Financial Crisis', description: 'Severe market crash', interest_rate_shock_bps: -150, volatility_multiplier: 2.5, equity_shock_pct: -0.35, created_at: new Date().toISOString() },
];

export const mockRuns = [
  {
    run_id: 1,
    portfolio_id: 1,
    scenario_id: 2,
    num_simulations: 10000,
    time_horizon_days: 252,
    status: 'completed',
    run_type: 'monte_carlo',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    risk_metrics: [
      { metric_type: 'VaR_95', metric_value: 24500.0 },
      { metric_type: 'VaR_99', metric_value: 38200.0 },
      { metric_type: 'ES_95', metric_value: 31000.0 },
      { metric_type: 'volatility', metric_value: 0.35 },
      { metric_type: 'max_drawdown', metric_value: 45000.0 },
    ],
    histogram_data: {
      bin_edges: [-50000, -40000, -30000, -20000, -10000, 0, 10000, 20000, 30000],
      counts: [20, 50, 150, 400, 800, 1200, 600, 200, 50],
      bin_width: 10000,
      pnl_min: -48000,
      pnl_max: 32000,
      mean_pnl: -2000
    }
  }
];

// Helper to simulate network latency
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
