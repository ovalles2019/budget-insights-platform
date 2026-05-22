import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const DEFAULT_LIMITS = {
  'Food & Dining': 500,
  Shopping: 300,
  Transportation: 200,
  'Bills & Utilities': 400,
  Entertainment: 150,
  Healthcare: 200,
  Travel: 500,
  Other: 100,
};

const CHART_COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#f59e0b', '#6366f1', '#94a3b8'];

function money(n) {
  if (n == null || Number.isNaN(n)) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const Overview = ({ transactions, analyticsUrl, userId, onRefresh, refreshing }) => {
  const [summary, setSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, anomRes, insRes, budRes] = await Promise.all([
        axios.get(`${analyticsUrl}/api/v1/analytics/summary`, { params: { user_id: userId } }),
        axios.get(`${analyticsUrl}/api/v1/analytics/anomalies`, { params: { user_id: userId } }),
        axios.get(`${analyticsUrl}/api/v1/analytics/insights`, { params: { user_id: userId } }),
        axios.post(`${analyticsUrl}/api/v1/analytics/budget`, {
          user_id: userId,
          budget_limits: DEFAULT_LIMITS,
        }),
      ]);
      setSummary(sumRes.data.summary);
      setAnomalies(anomRes.data.anomalies || []);
      setInsights(insRes.data.insights || []);
      setBudgetStatus(budRes.data.budget_status || []);
    } catch (e) {
      console.error(e);
      setError('Could not load your dashboard. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const categoryChart = useMemo(() => {
    const totals = transactions.reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6),
    [transactions]
  );

  if (loading && !summary) {
    return (
      <div className="state-panel">
        <div className="spinner" aria-hidden="true" />
        <p>Loading your finances…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-panel error-panel">
        <p>{error}</p>
        <button type="button" className="btn-primary" onClick={loadAll}>
          Try again
        </button>
      </div>
    );
  }

  const stats = summary || {
    total_transactions: 0,
    total_spent: 0,
    anomalies_count: 0,
    statistics: { mean: 0 },
  };

  return (
    <div className="overview">
      <div className="stats-row">
        <article className="stat">
          <span className="stat-label">Total spent</span>
          <span className="stat-value">{money(stats.total_spent)}</span>
        </article>
        <article className="stat">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{stats.total_transactions}</span>
        </article>
        <article className="stat">
          <span className="stat-label">Avg purchase</span>
          <span className="stat-value">{money(stats.statistics?.mean)}</span>
        </article>
        <article className="stat stat-alert">
          <span className="stat-label">Unusual charges</span>
          <span className="stat-value">{stats.anomalies_count}</span>
        </article>
      </div>

      <div className="overview-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Where your money went</h2>
            <p className="panel-sub">Top categories this period</p>
          </div>
          {categoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(13,148,136,0.06)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                  {categoryChart.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-hint">No spending data yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Budget health</h2>
            <p className="panel-sub">Monthly limits vs spending</p>
          </div>
          <div className="budget-list">
            {budgetStatus.slice(0, 6).map((item) => (
              <div key={item.category} className="budget-row">
                <div className="budget-row-top">
                  <span>{item.category}</span>
                  <span className="budget-nums">
                    {money(item.spent)} <span className="muted">/ {money(item.budget_limit)}</span>
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill status-${item.status}`}
                    style={{ width: `${Math.min(item.percentage_used, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {insights.length > 0 && (
        <section className="panel panel-insights">
          <div className="panel-head">
            <h2>Quick insights</h2>
          </div>
          <ul className="insight-list">
            {insights.map((insight, i) => (
              <li key={i}>{insight.message}</li>
            ))}
          </ul>
        </section>
      )}

      {anomalies.length > 0 && (
        <section className="panel panel-alerts">
          <div className="panel-head">
            <h2>Needs attention</h2>
            <p className="panel-sub">{anomalies.length} unusual transaction{anomalies.length !== 1 ? 's' : ''}</p>
          </div>
          <ul className="alert-list">
            {anomalies.slice(0, 4).map((a) => (
              <li key={a.transaction_id} className={`alert-item severity-${a.severity}`}>
                <div>
                  <strong>{a.description}</strong>
                  <span className="alert-meta">
                    {new Date(a.date).toLocaleDateString()} · {money(Math.abs(a.amount))}
                  </span>
                </div>
                <span className={`badge ${a.severity}`}>{a.severity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="panel-head panel-head-row">
          <div>
            <h2>Recent activity</h2>
            <p className="panel-sub">Latest charges</p>
          </div>
          <button type="button" className="btn-ghost" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <ul className="txn-list">
          {recent.map((t) => (
            <li key={t.id} className="txn-item">
              <div className="txn-icon" aria-hidden="true">
                {(t.category || '?')[0]}
              </div>
              <div className="txn-body">
                <span className="txn-title">{t.description}</span>
                <span className="txn-meta">
                  {t.category} · {new Date(t.date).toLocaleDateString()}
                </span>
              </div>
              <span className="txn-amount">−{money(Math.abs(t.amount))}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Overview;
