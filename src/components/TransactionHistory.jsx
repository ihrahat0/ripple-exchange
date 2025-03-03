import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 30px;
`;

const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--bg1);
  border-radius: 8px;
  overflow: hidden;
`;

const TableHead = styled.thead`
  background: var(--bg2);
  border-bottom: 1px solid var(--line);
`;

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid var(--line);
  }
  
  &:hover {
    background: var(--bg2);
  }
  
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 15px;
  font-weight: 500;
  color: var(--text);
`;

const TableCell = styled.td`
  padding: 12px 15px;
  color: var(--text);
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'completed':
        return 'rgba(14, 203, 129, 0.1)';
      case 'pending':
        return 'rgba(247, 147, 26, 0.1)';
      case 'failed':
        return 'rgba(255, 59, 48, 0.1)';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'completed':
        return '#0ECB81';
      case 'pending':
        return '#F7931A';
      case 'failed':
        return '#F6465D';
      default:
        return 'var(--text)';
    }
  }};
`;

const TransactionIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: ${props => {
    switch (props.$type) {
      case 'deposit':
        return 'rgba(14, 203, 129, 0.1)';
      case 'withdrawal':
        return 'rgba(246, 70, 93, 0.1)';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'deposit':
        return '#0ECB81';
      case 'withdrawal':
        return '#F6465D';
      default:
        return 'var(--text)';
    }
  }};
  border-radius: 50%;
  margin-right: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  
  i {
    font-size: 36px;
    margin-bottom: 10px;
    opacity: 0.5;
  }
  
  p {
    margin: 5px 0;
  }
`;

const TransactionDetails = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .detail-label {
    opacity: 0.7;
  }
  
  .detail-value {
    text-align: right;
    word-break: break-all;
  }
`;

const ViewTxLink = styled.a`
  color: var(--primary);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DetailsRow = styled.tr`
  background: rgba(0, 0, 0, 0.1);
`;

const DetailsCell = styled.td`
  padding: 0 15px 15px 15px;
  color: var(--text-secondary);
  font-size: 14px;
`;

const TransactionHistory = ({ limit = 5, type = null }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Create query based on parameters
        let transactionsQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        // Add type filter if specified
        if (type) {
          transactionsQuery = query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid),
            where('type', '==', type),
            orderBy('timestamp', 'desc')
          );
        }
        
        const querySnapshot = await getDocs(transactionsQuery);
        const transactionList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .slice(0, limit); // Apply limit
        
        setTransactions(transactionList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser, limit, type]);

  const toggleDetails = (transactionId) => {
    if (expandedTransaction === transactionId) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(transactionId);
    }
  };

  const getExplorerUrl = (txHash, chain) => {
    if (!txHash) return '#';
    
    switch (chain) {
      case 'ethereum':
        return `https://etherscan.io/tx/${txHash}`;
      case 'bsc':
        return `https://bscscan.com/tx/${txHash}`;
      case 'solana':
        return `https://solscan.io/tx/${txHash}`;
      case 'bitcoin':
        return `https://www.blockchain.com/explorer/transactions/btc/${txHash}`;
      default:
        return '#';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore timestamps
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <Container>Loading transaction history...</Container>;
  }

  return (
    <Container>
      <Title>Transaction History {type && `(${type === 'deposit' ? 'Deposits' : 'Withdrawals'})`}</Title>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <EmptyState>
          <i className={`bi ${type === 'deposit' ? 'bi-arrow-down-circle' : type === 'withdrawal' ? 'bi-arrow-up-circle' : 'bi-clock-history'}`}></i>
          <p><strong>No transactions found</strong></p>
          <p>{type === 'deposit' ? 'You haven\'t made any deposits yet.' : 
              type === 'withdrawal' ? 'You haven\'t made any withdrawals yet.' : 
              'No transaction history available.'}</p>
        </EmptyState>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {transactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <TableRow $clickable={true} onClick={() => toggleDetails(transaction.id)}>
                  <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                  <TableCell>
                    <TransactionIcon $type={transaction.type}>
                      {transaction.type === 'deposit' ? 
                        <i className="bi bi-arrow-down-circle"></i> : 
                        <i className="bi bi-arrow-up-circle"></i>}
                    </TransactionIcon>
                    {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </TableCell>
                  <TableCell>
                    <strong>{transaction.amount}</strong> {transaction.token}
                  </TableCell>
                  <TableCell>
                    <StatusBadge $status={transaction.status}>
                      {transaction.status}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
                {expandedTransaction === transaction.id && (
                  <DetailsRow>
                    <DetailsCell colSpan="4">
                      <TransactionDetails>
                        <div className="detail-row">
                          <span className="detail-label">Transaction ID:</span>
                          <span className="detail-value">{transaction.id}</span>
                        </div>
                        {transaction.chain && (
                          <div className="detail-row">
                            <span className="detail-label">Network:</span>
                            <span className="detail-value">{transaction.chain}</span>
                          </div>
                        )}
                        {transaction.destinationAddress && (
                          <div className="detail-row">
                            <span className="detail-label">Destination Address:</span>
                            <span className="detail-value">{transaction.destinationAddress}</span>
                          </div>
                        )}
                        {transaction.txHash && (
                          <div className="detail-row">
                            <span className="detail-label">Transaction Hash:</span>
                            <span className="detail-value">
                              <ViewTxLink href={getExplorerUrl(transaction.txHash, transaction.chain)} target="_blank" rel="noopener noreferrer">
                                {transaction.txHash.substring(0, 8)}...{transaction.txHash.substring(transaction.txHash.length - 8)}
                                <i className="bi bi-box-arrow-up-right" style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                              </ViewTxLink>
                            </span>
                          </div>
                        )}
                      </TransactionDetails>
                    </DetailsCell>
                  </DetailsRow>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default TransactionHistory; 