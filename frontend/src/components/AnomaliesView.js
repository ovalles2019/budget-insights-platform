import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnomaliesView = ({ analyticsUrl, userId }) => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${analyticsUrl}/api/v1/analytics/anomalies`, {
        params: { user_id: userId }
      });
      setAnomalies(response.data.anomalies || []);
    } catch (error) {
      console.error('Error loading anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Detecting anomalies...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Anomaly Detection</h2>
        <p style={{ marginBottom: '2rem', color: '#86868b', fontSize: '0.9375rem', lineHeight: '1.47059' }}>
          Transactions that deviate significantly from your spending patterns are flagged as anomalies.
          These may indicate unusual purchases or potential fraud.
        </p>
        {anomalies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#86868b' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '0.5rem' }}>✅ No anomalies detected</h3>
            <p style={{ fontSize: '0.9375rem' }}>Your spending patterns look normal!</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem', fontSize: '1.0625rem', fontWeight: 500, color: '#1d1d1f', letterSpacing: '-0.011em' }}>
              Found {anomalies.length} anomaly{anomalies.length !== 1 ? 'ies' : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.transaction_id}>
                    <td>{new Date(anomaly.date).toLocaleDateString()}</td>
                    <td>{anomaly.description}</td>
                    <td>${Math.abs(anomaly.amount).toFixed(2)}</td>
                    <td>{anomaly.reason}</td>
                    <td>
                      <span className={`badge ${anomaly.severity}`}>
                        {anomaly.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <button
          onClick={loadAnomalies}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: '#0071e3',
            color: '#ffffff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: 500,
            letterSpacing: '-0.011em',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => e.target.style.background = '#0077ed'}
          onMouseLeave={(e) => e.target.style.background = '#0071e3'}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default AnomaliesView;
