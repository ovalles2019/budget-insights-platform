import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BudgetView = ({ transactions, analyticsUrl, userId }) => {
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [budgetLimits, setBudgetLimits] = useState({
    'Food & Dining': 500,
    'Shopping': 300,
    'Transportation': 200,
    'Bills & Utilities': 400,
    'Entertainment': 150,
    'Healthcare': 200,
    'Travel': 500,
    'Other': 100
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudgetStatus();
  }, [budgetLimits]);

  const loadBudgetStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${analyticsUrl}/api/v1/analytics/budget`, {
        user_id: userId,
        budget_limits: budgetLimits
      });
      setBudgetStatus(response.data.budget_status || []);
    } catch (error) {
      console.error('Error loading budget status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBudgetLimit = (category, value) => {
    setBudgetLimits({
      ...budgetLimits,
      [category]: parseFloat(value) || 0
    });
  };

  if (loading) {
    return <div className="loading">Loading budget data...</div>;
  }

  const chartData = budgetStatus.map(item => ({
    category: item.category,
    spent: item.spent,
    remaining: item.remaining > 0 ? item.remaining : 0,
    limit: item.budget_limit
  }));

  return (
    <div>
      <div className="card">
        <h2>Budget Limits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {Object.entries(budgetLimits).map(([category, limit]) => (
            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>{category}</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => updateBudgetLimit(category, e.target.value)}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={loadBudgetStatus}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Update Budget
        </button>
      </div>

      <div className="card">
        <h2>Budget Status</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spent" fill="#667eea" name="Spent" />
            <Bar dataKey="remaining" fill="#10b981" name="Remaining" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Budget Details</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Budget Limit</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>% Used</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {budgetStatus.map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>${item.budget_limit.toFixed(2)}</td>
                <td>${item.spent.toFixed(2)}</td>
                <td>${item.remaining.toFixed(2)}</td>
                <td>{item.percentage_used.toFixed(1)}%</td>
                <td>
                  <span className={`badge ${item.status}`}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetView;
