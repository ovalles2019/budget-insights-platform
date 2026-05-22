import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Overview from './components/Overview';

const IS_DEMO = process.env.REACT_APP_DEMO_MODE === 'true';
const API_BASE_URL = IS_DEMO
  ? ''
  : process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
const ANALYTICS_BASE_URL = IS_DEMO
  ? ''
  : process.env.REACT_APP_ANALYTICS_BASE_URL || 'http://localhost:5002';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState('default_user');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/transactions`, {
        params: { user_id: userId },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            BI
          </span>
          <div>
            <h1>Budget Insights</h1>
            <p>Your spending at a glance</p>
          </div>
        </div>
        {IS_DEMO && <span className="demo-pill">Live demo</span>}
      </header>

      <main className="main-content">
        <Overview
          transactions={transactions}
          analyticsUrl={ANALYTICS_BASE_URL}
          userId={userId}
          onRefresh={loadTransactions}
          refreshing={loading}
        />
      </main>

      <footer className="site-footer">
        <span>Transaction + analytics microservices · Flask & React</span>
        {!IS_DEMO && (
          <button type="button" className="btn-ghost" onClick={loadTransactions} disabled={loading}>
            Reload data
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;
