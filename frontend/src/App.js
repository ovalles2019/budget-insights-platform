import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import BudgetView from './components/BudgetView';
import AnomaliesView from './components/AnomaliesView';
import InsightsView from './components/InsightsView';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
const ANALYTICS_BASE_URL = process.env.REACT_APP_ANALYTICS_BASE_URL || 'http://localhost:5002';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId] = useState('default_user');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/transactions`, {
        params: { user_id: userId }
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const importMockData = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/transactions/import`, {
        user_id: userId,
        count: 50
      });
      await loadTransactions();
    } catch (error) {
      console.error('Error importing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>💰 Budget Insights Platform</h1>
        <p>Cloud-First Personal Finance Management</p>
      </header>

      <nav className="App-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'budget' ? 'active' : ''}
          onClick={() => setActiveTab('budget')}
        >
          Budget
        </button>
        <button
          className={activeTab === 'anomalies' ? 'active' : ''}
          onClick={() => setActiveTab('anomalies')}
        >
          Anomalies
        </button>
        <button
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button className="import-btn" onClick={importMockData} disabled={loading}>
          {loading ? 'Loading...' : 'Import Mock Data'}
        </button>
      </nav>

      <main className="App-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            analyticsUrl={ANALYTICS_BASE_URL}
            userId={userId}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetView
            transactions={transactions}
            analyticsUrl={ANALYTICS_BASE_URL}
            userId={userId}
          />
        )}
        {activeTab === 'anomalies' && (
          <AnomaliesView
            analyticsUrl={ANALYTICS_BASE_URL}
            userId={userId}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsView
            analyticsUrl={ANALYTICS_BASE_URL}
            userId={userId}
          />
        )}
      </main>
    </div>
  );
}

export default App;
