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
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Transactions that deviate significantly from your spending patterns are flagged as anomalies.
          These may indicate unusual purchases or potential fraud.
        </p>
        {anomalies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>✅ No anomalies detected</h3>
            <p>Your spending patterns look normal!</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
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
          Refresh
        </button>
      </div>
    </div>
  );
};

export default AnomaliesView;
