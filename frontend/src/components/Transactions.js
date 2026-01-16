import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Transactions({ userId, apiBase }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/api/v1/transactions`, {
        params: { user_id: userId }
      });
      setTransactions(response.data.transactions || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiBase}/api/v1/transactions`, {
        ...newTransaction,
        user_id: userId,
        amount: parseFloat(newTransaction.amount)
      });
      setNewTransaction({ description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      await fetchTransactions();
    } catch (err) {
      setError('Failed to add transaction: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiBase}/api/v1/transactions/${id}`);
      await fetchTransactions();
    } catch (err) {
      setError('Failed to delete transaction: ' + err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Add New Transaction</h2>
        <form onSubmit={handleAddTransaction} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Description"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
            required
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', flex: '1', minWidth: '200px' }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            required
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', width: '150px' }}
          />
          <input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            required
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button type="submit" className="button">Add Transaction</button>
        </form>
      </div>

      <div className="card">
        <h2>Transaction History</h2>
        {error && <div className="error">{error}</div>}
        
        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No transactions found. Add one above to get started.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>{transaction.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: '#667eea',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                      }}>
                        {transaction.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#c33' }}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        style={{
                          background: '#c33',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
