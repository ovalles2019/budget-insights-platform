import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ transactions, analyticsUrl, userId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await axios.get(`${analyticsUrl}/api/v1/analytics/summary`, {
        params: { user_id: userId }
      });
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="error">Failed to load dashboard data</div>;
  }

  // Prepare chart data
  const categoryData = transactions.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  const COLORS = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00', '#8e8e93'];

  // Monthly spending data
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const lineData = Object.entries(monthlyData)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([month, value]) => ({ month, spending: parseFloat(value.toFixed(2)) }));

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <div className="value">{summary.total_transactions}</div>
        </div>
        <div className="stat-card">
          <h3>Total Spent</h3>
          <div className="value">${summary.total_spent.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Anomalies Detected</h3>
          <div className="value">{summary.anomalies_count}</div>
        </div>
        <div className="stat-card">
          <h3>Average Transaction</h3>
          <div className="value">${summary.statistics?.mean?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="card">
        <h2>Spending by Category</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Monthly Spending Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="spending" stroke="#0071e3" strokeWidth={2.5} dot={{ fill: '#0071e3', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Recent Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 10).map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.description}</td>
                <td>{t.category}</td>
                <td>${Math.abs(t.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
