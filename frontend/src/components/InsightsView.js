import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InsightsView = ({ analyticsUrl, userId }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${analyticsUrl}/api/v1/analytics/insights`, {
        params: { user_id: userId }
      });
      setInsights(response.data.insights || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Generating insights...</div>;
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'top_category':
        return '🏆';
      case 'trend':
        return '📈';
      case 'average':
        return '📊';
      default:
        return '💡';
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Spending Insights</h2>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          AI-powered insights to help you understand your spending patterns and make better financial decisions.
        </p>
        {insights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No insights available</h3>
            <p>Import some transactions to see insights!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>{getInsightIcon(insight.type)}</span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                    {insight.type === 'top_category' && 'Top Spending Category'}
                    {insight.type === 'trend' && 'Spending Trend'}
                    {insight.type === 'average' && 'Average Transaction'}
                  </h3>
                </div>
                <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.95 }}>
                  {insight.message}
                </p>
                {insight.change_percentage !== undefined && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                    Current: ${insight.current_month.toFixed(2)} | 
                    Previous: ${insight.previous_month.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={loadInsights}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          Refresh Insights
        </button>
      </div>
    </div>
  );
};

export default InsightsView;
