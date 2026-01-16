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
        <p style={{ marginBottom: '2rem', color: '#86868b', fontSize: '0.9375rem', lineHeight: '1.47059' }}>
          AI-powered insights to help you understand your spending patterns and make better financial decisions.
        </p>
        {insights.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#86868b' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '0.5rem' }}>No insights available</h3>
            <p style={{ fontSize: '0.9375rem' }}>Import some transactions to see insights!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  border: '0.5px solid rgba(0, 0, 0, 0.06)',
                  color: '#1d1d1f',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{getInsightIcon(insight.type)}</span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.022em' }}>
                    {insight.type === 'top_category' && 'Top Spending Category'}
                    {insight.type === 'trend' && 'Spending Trend'}
                    {insight.type === 'average' && 'Average Transaction'}
                  </h3>
                </div>
                <p style={{ fontSize: '1.0625rem', margin: 0, color: '#1d1d1f', lineHeight: '1.47059' }}>
                  {insight.message}
                </p>
                {insight.change_percentage !== undefined && (
                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#86868b' }}>
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
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: '#ffffff',
            color: '#0071e3',
            border: '0.5px solid rgba(0, 113, 227, 0.3)',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: 500,
            letterSpacing: '-0.011em',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#0071e3';
            e.target.style.color = '#ffffff';
            e.target.style.borderColor = '#0071e3';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#ffffff';
            e.target.style.color = '#0071e3';
            e.target.style.borderColor = 'rgba(0, 113, 227, 0.3)';
          }}
        >
          Refresh Insights
        </button>
      </div>
    </div>
  );
};

export default InsightsView;
