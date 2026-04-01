# Portfolio Risk Analytics Platform — Full Project Specification

**Course:** Database Management Systems  
**Stack:** React.js + Chart.js (Frontend) | Python FastAPI + SQLAlchemy (Backend) | PostgreSQL (Database)  
**Scope:** Monte Carlo simulation-based portfolio risk analytics. No ML layer.

---

## 1. System Overview

The platform allows users to build investment portfolios from a library of financial assets, define named market stress scenarios, run Monte Carlo simulations to compute risk metrics, and compare results across portfolios and scenarios through an analytics dashboard.

Every piece of data the system produces — portfolios, scenarios, simulation runs, and risk metrics — lives in PostgreSQL. The frontend consumes a REST API. The simulation engine runs in Python and writes results atomically to the database.

---

## 2. Database Schema — Entities and Rules

### 2.1 ASSET

The global library of financial instruments available to all portfolios.

| Column | Type | Constraints | Description |
|---|---|---|---|
| asset_id | INT | PK, AUTO_INCREMENT | Unique identifier |
| asset_name | VARCHAR(100) | NOT NULL | e.g. "Apple Inc." |
| ticker_symbol | VARCHAR(20) | NOT NULL, UNIQUE | e.g. "AAPL" |
| asset_type | VARCHAR(20) | NOT NULL, CHECK IN ('equity','bond','derivative','commodity') | Asset class |
| currency | CHAR(3) | NOT NULL | ISO 4217 code e.g. "USD" |
| base_price | FLOAT | NOT NULL, CHECK > 0 | Reference price used in simulation |
| annual_volatility | FLOAT | NOT NULL, CHECK > 0 | Annualised σ, e.g. 0.25 = 25% |
| annual_return | FLOAT | NOT NULL | Annualised μ, e.g. 0.08 = 8% |

**Rules:** ticker_symbol must be unique system-wide. base_price, annual_volatility must be positive. annual_return may be negative (distressed assets).

---

### 2.2 PORTFOLIO

A named collection of assets belonging to a user session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| portfolio_id | INT | PK, AUTO_INCREMENT | Unique identifier |
| portfolio_name | VARCHAR(100) | NOT NULL | e.g. "Aggressive Growth" |
| description | TEXT | NULLABLE | Optional notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | UTC creation time |

---

### 2.3 PORTFOLIO_ASSET (Junction Table)

Resolves the many-to-many relationship between PORTFOLIO and ASSET. One asset can appear in multiple portfolios; one portfolio contains multiple assets.

| Column | Type | Constraints | Description |
|---|---|---|---|
| portfolio_id | INT | PK, FK → PORTFOLIO.portfolio_id | Part of composite PK |
| asset_id | INT | PK, FK → ASSET.asset_id | Part of composite PK |
| weight | FLOAT | NOT NULL, CHECK > 0 AND <= 1 | Portfolio allocation fraction |
| quantity | INT | NOT NULL, CHECK > 0 | Number of units held |

**Trigger — weight validation:** After any INSERT or UPDATE on PORTFOLIO_ASSET, a trigger checks that the sum of `weight` for all rows sharing the same `portfolio_id` equals 1.0 (±0.001 tolerance). If not, the transaction is rolled back with an error message: "Portfolio weights must sum to 1.0".

---

### 2.4 SCENARIO

A named, structured market stress condition. All three shock parameters are required — no free-text or vague fields.

| Column | Type | Constraints | Description |
|---|---|---|---|
| scenario_id | INT | PK, AUTO_INCREMENT | Unique identifier |
| scenario_name | VARCHAR(100) | NOT NULL | e.g. "2008 Financial Crisis" |
| description | TEXT | NULLABLE | Context for the scenario |
| interest_rate_shock_bps | INT | NOT NULL | Basis points; positive = rise, negative = cut. e.g. +300 |
| volatility_multiplier | FLOAT | NOT NULL, CHECK > 0 | Applied to each asset's σ. e.g. 1.5 = 50% more volatile |
| equity_shock_pct | FLOAT | NOT NULL, CHECK BETWEEN -1 AND 1 | Additive shock to equity asset returns. e.g. -0.20 = –20% |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | UTC creation time |

**Trigger — deletion guard:** A BEFORE DELETE trigger on SCENARIO checks whether any SIMULATION_RUN references the scenario_id. If yes, deletion is blocked with the message: "Cannot delete a scenario that has associated simulation runs."

**Trigger — parameter range check:** A BEFORE INSERT OR UPDATE trigger validates that volatility_multiplier > 0 and equity_shock_pct is between -1.0 and 1.0. Rejects out-of-range values before they reach the constraint.

---

### 2.5 SIMULATION_RUN

Records one execution of the simulation engine against a specific portfolio and scenario.

| Column | Type | Constraints | Description |
|---|---|---|---|
| run_id | INT | PK, AUTO_INCREMENT | Unique identifier |
| portfolio_id | INT | NOT NULL, FK → PORTFOLIO.portfolio_id | Portfolio being simulated |
| scenario_id | INT | NOT NULL, FK → SCENARIO.scenario_id | Scenario being applied |
| run_type | VARCHAR(20) | NOT NULL, CHECK = 'monte_carlo' | Only supported type |
| num_iterations | INT | NOT NULL, CHECK BETWEEN 1000 AND 100000 | Number of MC paths |
| random_seed | INT | NOT NULL | Numpy RNG seed for reproducibility |
| time_horizon_days | INT | NOT NULL, CHECK IN (1, 10, 252) | 1 day, 10 days, or 1 year (252 trading days) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending', CHECK IN ('pending','running','completed','failed') | Lifecycle state |
| run_timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() | UTC time run was initiated |

**Index:** Composite index on `(portfolio_id, scenario_id)` to accelerate comparison dashboard queries that aggregate across runs.

**Transaction rule:** The backend inserts the SIMULATION_RUN row first (status = 'running'), executes the Python simulation, then inserts all RISK_METRIC rows and updates status to 'completed' — all within a single database transaction. If the simulation fails, the transaction rolls back and status is set to 'failed'.

---

### 2.6 RISK_METRIC

Stores the computed outputs of one simulation run. One run produces exactly five metric rows.

| Column | Type | Constraints | Description |
|---|---|---|---|
| run_id | INT | PK, FK → SIMULATION_RUN.run_id | Part of composite PK |
| metric_type | VARCHAR(20) | PK, CHECK IN ('VaR_95','VaR_99','ES_95','volatility','max_drawdown') | Part of composite PK |
| metric_value | FLOAT | NOT NULL | Computed value (see interpretation below) |
| confidence_level | FLOAT | NULLABLE | 0.95 or 0.99 for VaR/ES; NULL for volatility and max_drawdown |

**Metric interpretation:**
- `VaR_95`: Maximum expected loss at 95% confidence. Value is in portfolio currency units (positive number representing a loss). e.g. 24500.00 means "you will not lose more than $24,500 with 95% confidence."
- `VaR_99`: Same as above at 99% confidence. Always ≥ VaR_95.
- `ES_95`: Expected Shortfall — average loss in the worst 5% of simulated outcomes. Always ≥ VaR_95.
- `volatility`: Standard deviation of the simulated P&L distribution, expressed as a decimal fraction. e.g. 0.18 = 18% annualised volatility.
- `max_drawdown`: The single largest loss observed across all simulation paths, in currency units.

**Trigger — value sanity check:** A BEFORE INSERT trigger on RISK_METRIC verifies that VaR_99 ≥ VaR_95 ≥ 0 and ES_95 ≥ VaR_95. Rejects logically inconsistent results before they are stored.

---

## 3. Relationships Summary

| Relationship | Type | Description |
|---|---|---|
| PORTFOLIO → PORTFOLIO_ASSET | One-to-Many | One portfolio has many asset allocation rows |
| ASSET → PORTFOLIO_ASSET | One-to-Many | One asset appears in many portfolios |
| PORTFOLIO → SIMULATION_RUN | One-to-Many | One portfolio is simulated many times |
| SCENARIO → SIMULATION_RUN | One-to-Many | One scenario is applied in many simulation runs |
| SIMULATION_RUN → RISK_METRIC | One-to-Many | One run produces many metric rows (exactly 5) |

---

## 4. Monte Carlo Simulation — How It Works

The simulation engine (Python, NumPy) runs server-side via FastAPI. This section describes what the Quantitative Risk Developer implements.

### 4.1 Inputs Consumed from the Database
- All assets in the portfolio with their `weight`, `base_price`, `annual_volatility` (σ), and `annual_return` (μ)
- The selected scenario's `interest_rate_shock_bps`, `volatility_multiplier`, and `equity_shock_pct`
- `num_iterations`, `random_seed`, `time_horizon_days` from the run configuration

### 4.2 Simulation Steps

**Step 1 — Apply Scenario Adjustments**  
For each asset, compute the effective parameters after applying the scenario:
- Effective σ = `annual_volatility × volatility_multiplier`
- For equity assets only: effective μ = `annual_return + equity_shock_pct`
- The `interest_rate_shock_bps` is applied as an additional drag on bond assets: effective μ for bonds = `annual_return − (interest_rate_shock_bps / 10000)`

**Step 2 — Generate Return Paths**  
Using the random seed for reproducibility, draw `num_iterations` random return samples for each asset from a normal distribution N(μ_daily, σ_daily), where:
- μ_daily = (effective μ) / 252
- σ_daily = (effective σ) / √252

This uses the standard square-root-of-time scaling for daily returns.

**Step 3 — Compute Portfolio P&L**  
For each of the `num_iterations` paths, compute the portfolio P&L:
```
P&L[i] = Σ (weight[j] × base_price[j] × quantity[j] × return[i][j])
```
This gives a distribution of `num_iterations` P&L values.

**Step 4 — Compute Risk Metrics from the Distribution**
- Sort the P&L distribution ascending (worst losses first)
- VaR_95 = −(5th percentile of P&L) — converted to a positive loss figure
- VaR_99 = −(1st percentile of P&L)
- ES_95 = −(mean of all P&L values below the 5th percentile)
- Volatility = standard deviation of the full P&L distribution ÷ portfolio total value
- Max Drawdown = −(minimum P&L value across all paths)

**Step 5 — Write to Database**  
All five metric rows are inserted into RISK_METRIC within the same transaction as the SIMULATION_RUN status update.

---

## 5. User Journey — Step by Step

### Step 1: Land on Dashboard
The user opens the app and sees the main dashboard. If no data exists yet, the dashboard shows empty-state prompts: "No assets yet — add assets to get started." If data exists, it shows summary statistics: total portfolios, total scenarios defined, total simulation runs completed.

### Step 2: Add Assets to the Library
The user navigates to **Assets → Asset Library**. They see a table of existing assets. They click **"+ Add Asset"** and fill in a form:
- Asset Name (text)
- Ticker Symbol (text, must be unique)
- Asset Type (dropdown: equity / bond / derivative / commodity)
- Currency (dropdown: USD / EUR / GBP / JPY)
- Base Price (number, > 0)
- Annual Volatility % (number, > 0) — e.g. enter 25 for 25%
- Expected Annual Return % (number) — e.g. enter 8 for 8%

On submit, the asset is saved to ASSET and appears in the table. The user repeats this for all assets they plan to use. A realistic minimum is 4–6 assets for a meaningful portfolio.

**What happens in the DB:** INSERT INTO ASSET with validation.

### Step 3: Create a Portfolio
The user navigates to **Portfolios → New Portfolio**. They enter a name and optional description, then click **"Create"**. This creates an empty PORTFOLIO row.

They are then taken to the **Portfolio Detail** page where they add assets:
- A searchable dropdown lists all assets in the library
- For each selected asset, they enter weight (%) and quantity
- A running total shows the current sum of weights — it must reach exactly 100% to save
- Once all assets are added and weights sum to 100%, they click **"Save Portfolio"**

The system inserts rows into PORTFOLIO_ASSET. The trigger validates the weight sum and rejects if not equal to 1.0.

**What happens in the DB:** INSERT INTO PORTFOLIO, then multiple INSERTs into PORTFOLIO_ASSET, validated by trigger.

### Step 4: Define a Scenario
The user navigates to **Scenarios → New Scenario**. They fill in:
- Scenario Name (text, required)
- Description (text, optional)
- Interest Rate Shock (integer, basis points) — a tooltip explains: "100 bps = 1% rate change"
- Volatility Multiplier (decimal, > 0) — tooltip: "1.0 = no change, 2.0 = double volatility"
- Equity Shock % (number, –100 to +100) — tooltip: "Applied to all equity assets' expected returns"

On submit, the scenario is saved. They can view and manage all scenarios in a table on **Scenarios → All Scenarios**.

**What happens in the DB:** INSERT INTO SCENARIO, validated by trigger.

### Step 5: Run a Simulation
The user navigates to **Simulate → New Run**. They configure the run:
- Select Portfolio (dropdown showing all saved portfolios with asset count)
- Select Scenario (dropdown showing all scenarios with key parameter values visible)
- Number of Iterations (slider or input: 1,000 / 5,000 / 10,000 / 50,000)
- Time Horizon (radio buttons: 1 Day / 10 Days / 1 Year)

They click **"Run Simulation"**. The frontend POSTs to `/simulation-runs`. The backend:
1. Inserts a SIMULATION_RUN row with status = 'running'
2. Fetches portfolio assets and scenario parameters from DB
3. Executes the Python Monte Carlo engine
4. Inserts 5 RISK_METRIC rows
5. Updates SIMULATION_RUN status to 'completed'
6. Returns the run_id and all metric values

The frontend shows a loading spinner during computation. On completion, the user is automatically navigated to the **Run Results** page.

**What happens in the DB:** INSERT SIMULATION_RUN (pending → running → completed) + 5× INSERT RISK_METRIC, all in one transaction.

### Step 6: View Run Results
The **Run Results** page displays:

**Summary Cards (top row):**
- VaR at 95% — e.g. "$24,500"
- VaR at 99% — e.g. "$31,200"
- Expected Shortfall at 95% — e.g. "$28,700"
- Portfolio Volatility — e.g. "18.4%"
- Max Drawdown — e.g. "$38,100"

**P&L Distribution Histogram (Chart.js):**  
A bar chart with P&L bins on the x-axis and frequency on the y-axis. The 5th percentile cutoff (VaR_95 threshold) is marked with a vertical red line. Bars to the left of the line are coloured red; bars to the right are coloured green. This visualises the loss tail directly.

**Run Metadata panel:**  
Portfolio name, scenario name, run type, iterations, time horizon, timestamp, random seed.

**Action buttons:**  
"Run Again with Different Scenario" (pre-fills portfolio), "View in Comparison Dashboard", "Export Results as CSV".

**What happens in the DB:** SELECT SIMULATION_RUN JOIN RISK_METRIC WHERE run_id = X.

### Step 7: Compare Results (Main Analytical Screen)
The user navigates to **Dashboard → Comparison**. This is the most analytically significant screen.

**Filter Panel (left sidebar):**
- Multi-select: Choose one or more portfolios
- Multi-select: Choose one or more scenarios
- Metric selector: VaR_95 / VaR_99 / ES_95 / volatility / max_drawdown
- Date range filter: Restrict to runs within a time window

**Chart 1 — Portfolio Comparison Bar Chart (Chart.js):**  
Given a single scenario and multiple portfolios, shows a grouped bar chart with portfolios on the x-axis and the selected metric value on the y-axis. Answers: "Which portfolio is most resilient under Scenario X?"

**Chart 2 — Scenario Severity Line Chart (Chart.js):**  
Given a single portfolio and multiple scenarios, shows a line chart with scenarios on the x-axis (ordered by volatility_multiplier ascending) and the selected metric on the y-axis. Answers: "How does this portfolio's risk scale with scenario severity?"

**Chart 3 — Metric Overview Table:**  
A table of all runs matching the current filters, with columns: Portfolio | Scenario | VaR_95 | VaR_99 | ES_95 | Volatility | Max Drawdown | Date. Sortable by any column.

**What happens in the DB:**  
```sql
SELECT p.portfolio_name, s.scenario_name, rm.metric_type, rm.metric_value
FROM SIMULATION_RUN sr
JOIN PORTFOLIO p ON sr.portfolio_id = p.portfolio_id
JOIN SCENARIO s ON sr.scenario_id = s.scenario_id
JOIN RISK_METRIC rm ON sr.run_id = rm.run_id
WHERE sr.status = 'completed'
  AND sr.portfolio_id IN (...)
  AND sr.scenario_id IN (...)
ORDER BY p.portfolio_name, s.scenario_name;
```

This query uses the composite index on `(portfolio_id, scenario_id)`.

### Step 8: View Run History
The user navigates to **Simulate → Run History**. A paginated table shows every simulation run ever executed:

| Run ID | Portfolio | Scenario | Iterations | Horizon | VaR_95 | Status | Timestamp |
|---|---|---|---|---|---|---|---|

- Rows are filterable by portfolio, scenario, and status
- Clicking a row navigates to that run's Results page
- Completed runs show VaR_95 inline; failed runs show a red "Failed" badge

**What happens in the DB:** SELECT with JOIN and WHERE filters, ORDER BY run_timestamp DESC, paginated with LIMIT/OFFSET.

---

## 6. API Endpoints

### Assets
| Method | Endpoint | Description |
|---|---|---|
| GET | /assets | List all assets |
| POST | /assets | Create a new asset |
| GET | /assets/{asset_id} | Get a single asset |
| DELETE | /assets/{asset_id} | Delete an asset (blocked if used in any portfolio) |

### Portfolios
| Method | Endpoint | Description |
|---|---|---|
| GET | /portfolios | List all portfolios with asset count |
| POST | /portfolios | Create a new portfolio |
| GET | /portfolios/{portfolio_id} | Get portfolio with full asset breakdown |
| PUT | /portfolios/{portfolio_id}/assets | Replace all asset allocations (re-validates weight sum) |
| DELETE | /portfolios/{portfolio_id} | Delete portfolio (blocked if it has simulation runs) |

### Scenarios
| Method | Endpoint | Description |
|---|---|---|
| GET | /scenarios | List all scenarios |
| POST | /scenarios | Create a new scenario |
| GET | /scenarios/{scenario_id} | Get a single scenario |
| DELETE | /scenarios/{scenario_id} | Delete a scenario (blocked by trigger if runs exist) |

### Simulation Runs
| Method | Endpoint | Description |
|---|---|---|
| POST | /simulation-runs | Trigger a new simulation run |
| GET | /simulation-runs | List all runs with filters (portfolio_id, scenario_id, status, date range) |
| GET | /simulation-runs/{run_id} | Get full run details including all 5 risk metrics |

### Comparison
| Method | Endpoint | Description |
|---|---|---|
| GET | /comparison | Aggregated metrics across runs — accepts query params: portfolio_ids, scenario_ids, metric_type |

---

## 7. DBMS Features Demonstrated

| Feature | Where Used |
|---|---|
| Composite Primary Key | PORTFOLIO_ASSET (portfolio_id, asset_id); RISK_METRIC (run_id, metric_type) |
| Foreign Keys | All FK relationships enforced at DB level |
| Trigger — weight sum validation | PORTFOLIO_ASSET: weights must sum to 1.0 per portfolio |
| Trigger — scenario deletion guard | SCENARIO: cannot delete if referenced in SIMULATION_RUN |
| Trigger — scenario parameter range | SCENARIO: validates volatility_multiplier > 0, equity_shock_pct ∈ [−1, 1] |
| Trigger — risk metric sanity | RISK_METRIC: enforces VaR_99 ≥ VaR_95, ES_95 ≥ VaR_95 |
| Composite Index | SIMULATION_RUN on (portfolio_id, scenario_id) |
| Aggregation Query | Comparison dashboard: GROUP BY portfolio, scenario, metric_type |
| Atomic Transaction | Full simulation result (1 run + 5 metrics) inserted or rolled back together |
| CHECK Constraints | asset_type ENUM, run_type ENUM, status ENUM, num_iterations range, weight range |

---

## 8. Seed Data (for Demo Day)

The Validation & Testing developer should seed the database with the following before the demo:

**Assets (minimum 8):**
Apple Inc. (AAPL, equity, USD, σ=0.28, μ=0.12), Microsoft (MSFT, equity, USD, σ=0.24, μ=0.15), Tesla (TSLA, equity, USD, σ=0.55, μ=0.20), US 10-Year Treasury (US10Y, bond, USD, σ=0.05, μ=0.04), German Bund (DE10Y, bond, EUR, σ=0.04, μ=0.02), Gold Futures (GOLD, commodity, USD, σ=0.15, μ=0.06), EUR/USD Forward (EURUSD, derivative, EUR, σ=0.08, μ=0.01), S&P 500 ETF (SPY, equity, USD, σ=0.18, μ=0.10).

**Portfolios (minimum 3):**
- "Aggressive Growth" — 60% AAPL, 30% TSLA, 10% MSFT
- "Conservative Bond" — 50% US10Y, 30% DE10Y, 20% Gold Futures
- "Balanced" — 30% SPY, 20% MSFT, 20% US10Y, 20% Gold, 10% EURUSD

**Scenarios (minimum 4):**
- "Baseline" — 0 bps rate shock, 1.0x volatility, 0% equity shock
- "2008 Crisis" — −150 bps rate shock, 2.5x volatility, −35% equity shock
- "2022 Rate Hike" — +300 bps rate shock, 1.4x volatility, −18% equity shock
- "Mild Stress" — +100 bps rate shock, 1.2x volatility, −8% equity shock

**Pre-run simulations:** Run all 3 portfolios against all 4 scenarios (12 runs total) with 10,000 iterations each so the comparison dashboard has data to display immediately on demo.

---

## 9. What the TA's Concerns Were and How They Are Resolved

**"The scenario entity was vague."**  
Resolved: SCENARIO now has three explicit, typed, queryable parameters with units defined (basis points, multiplier, percentage). No free-text shocks.

**"The ER diagram was inconsistent."**  
Resolved: Every entity has a clear purpose. Every relationship has a direction and cardinality. The ML subsystem is removed entirely, eliminating the orphaned conceptual link between simulation outputs and ML training data that had no structural basis in the diagram.

**"Wrong idea about it."**  
The scope is now strictly a simulation-driven risk analytics platform. No ambiguity about what the system computes, how it stores results, or how the frontend uses the data.
