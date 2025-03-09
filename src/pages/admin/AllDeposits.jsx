import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Container = styled.div`
  color: var(--text);
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  margin-bottom: 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #3a5bd9;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--bg2);
  color: var(--text);
  border: 1px solid var(--line);
`;

const DepositsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  th {
    background-color: rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .amount-cell {
    text-align: right;
    font-family: monospace;
    font-weight: 600;
    font-size: 14px;
    color: #00c853;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: ${props => 
    props.$status === 'completed' ? 'rgba(14, 203, 129, 0.2)' :
    props.$status === 'pending' ? 'rgba(243, 186, 47, 0.2)' :
    props.$status === 'failed' ? 'rgba(246, 70, 93, 0.2)' :
    'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => 
    props.$status === 'completed' ? '#0ECB81' :
    props.$status === 'pending' ? '#f3ba2f' :
    props.$status === 'failed' ? '#F6465D' :
    'white'
  };
  
  i {
    margin-right: 4px;
  }
`;

const NetworkBadge = styled.span`
  background: ${props => 
    props.network === 'ethereum' ? 'rgba(98, 126, 234, 0.2)' :
    props.network === 'bsc' ? 'rgba(243, 186, 47, 0.2)' :
    props.network === 'polygon' ? 'rgba(130, 71, 229, 0.2)' :
    props.network === 'solana' ? 'rgba(20, 241, 149, 0.2)' :
    props.network === 'arbitrum' ? 'rgba(40, 160, 240, 0.2)' :
    props.network === 'base' ? 'rgba(0, 137, 123, 0.2)' :
    'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => 
    props.network === 'ethereum' ? '#627eea' :
    props.network === 'bsc' ? '#f3ba2f' :
    props.network === 'polygon' ? '#8247e5' :
    props.network === 'solana' ? '#14f195' :
    props.network === 'arbitrum' ? '#28a0f0' :
    props.network === 'base' ? '#00897b' :
    'white'
  };
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const AddressLink = styled.a`
  color: var(--primary);
  text-decoration: none;
  font-family: monospace;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 4px;
  margin-left: 4px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const UserLink = styled.a`
  color: var(--primary);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.active ? 'var(--primary)' : 'var(--bg2)'};
  color: ${props => props.active ? 'white' : 'var(--text)'};
  border: 1px solid var(--line);
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--text-light);
  
  i {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
    opacity: 0.5;
  }
  
  p {
    margin: 8px 0;
  }
`;

const Card = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: var(--bg);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--line);
  
  h3 {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-light);
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 24px;
    font-weight: 600;
    color: var(--text);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px;
  
  .spinner {
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const RefreshButton = styled.button`
  background: rgba(255, 114, 90, 0.1);
  color: #ff725a;
  border: 1px solid rgba(255, 114, 90, 0.2);
  border-radius: 4px;
  padding: 8px 15px;
  margin-right: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  
  &:hover {
    background: rgba(255, 114, 90, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  i {
    margin-right: 6px;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .left {
    display: flex;
    align-items: center;
  }
  
  .right {
    display: flex;
    align-items: center;
  }
  
  .last-updated {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin-right: 15px;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  
  .empty-icon {
    font-size: 60px;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 20px;
  }
  
  .message {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 30px;
  }
  
  .create-button {
    background: rgba(255, 114, 90, 0.1);
    color: #ff725a;
    border: 1px solid rgba(255, 114, 90, 0.2);
    border-radius: 4px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255, 114, 90, 0.2);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const AllDeposits = () => {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalDepositAmount: 0,
    totalUsers: 0,
    pendingDeposits: 0,
    lastUpdated: null
  });
  const [filters, setFilters] = useState({
    status: 'all',
    network: 'all',
    currency: 'all',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [userMap, setUserMap] = useState({});
  const [walletMap, setWalletMap] = useState({});
  const [copiedText, setCopiedText] = useState(null);
  
  // Store the last timestamp we received deposits for
  const [lastTimestamp, setLastTimestamp] = useState(null);
  
  // Use a ref to keep track of the polling interval
  const pollingIntervalRef = React.useRef(null);

  const [creatingTestData, setCreatingTestData] = useState(false);

  // Fetch deposits with the cached endpoint
  const fetchDeposits = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh && refreshing) return; // Prevent concurrent refreshes
      
      const isInitialFetch = !lastTimestamp || forceRefresh;
      
      if (forceRefresh) {
        setRefreshing(true);
      } else if (isInitialFetch) {
        setLoading(true);
      }
      
      // Build the URL with query params if we have a lastTimestamp
      const url = '/api/admin/cached-deposits' + 
        (isInitialFetch ? '' : `?lastTimestamp=${lastTimestamp.toISOString()}`);
      
      console.log(`Fetching deposits: ${isInitialFetch ? 'initial' : 'incremental'} fetch`);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.success) {
        const { deposits: newDeposits, summary } = response.data;
        
        if (isInitialFetch) {
          // Initial load - replace all deposits
          setDeposits(newDeposits || []);
        } else if (newDeposits && newDeposits.length > 0) {
          // Incremental update - add new deposits to the beginning
          setDeposits(prevDeposits => {
            // Combine arrays avoiding duplicates (by id)
            const depositIds = new Set(prevDeposits.map(d => d.id));
            const uniqueNewDeposits = newDeposits.filter(d => !depositIds.has(d.id));
            
            // Sort combined array by timestamp (newest first)
            return [...uniqueNewDeposits, ...prevDeposits].sort((a, b) => {
              return new Date(b.timestamp) - new Date(a.timestamp);
            });
          });
        }
        
        // Update stats
        if (summary) {
          setStats({
            totalDeposits: summary.totalDeposits || 0,
            totalDepositAmount: summary.totalAmount?.toFixed(2) || 0,
            totalUsers: summary.uniqueUsers || 0,
            pendingDeposits: 0, // We don't track this in summary yet
            lastUpdated: summary.lastUpdated ? new Date(summary.lastUpdated) : new Date()
          });
        }
        
        // Set the lastTimestamp to the current time for future incremental updates
        setLastTimestamp(new Date());
      }
      
      // Fetch user and wallet info for the visible deposits
      const visibleDeposits = getVisibleDeposits();
      await fetchUserInfo(visibleDeposits);
      
    } catch (error) {
      console.error("Error fetching deposits:", error);
      // Optionally show an error message to the user
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastTimestamp, refreshing]);
  
  // Get the visible deposits (filtered and paginated)
  const getVisibleDeposits = useCallback(() => {
    // Apply filters
    let filteredDeposits = deposits;
    
    if (filters.status !== 'all') {
      filteredDeposits = filteredDeposits.filter(deposit => deposit.status === filters.status);
    }
    
    if (filters.network !== 'all') {
      filteredDeposits = filteredDeposits.filter(deposit => deposit.chain === filters.network.toLowerCase());
    }
    
    if (filters.currency !== 'all') {
      filteredDeposits = filteredDeposits.filter(deposit => deposit.token === filters.currency);
    }
    
    // Calculate pagination
    const totalItems = filteredDeposits.length;
    const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
      // Reset to page 1 if current page is out of bounds
      if (page > calculatedTotalPages) {
        setPage(1);
      }
    }
    
    // Return paginated results
    return filteredDeposits.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
  }, [deposits, filters, page, totalPages]);
  
  // Set up initial fetch and polling
  useEffect(() => {
    // Initial fetch
    fetchDeposits(true);
    
    // Set up polling for new deposits every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (lastTimestamp) {
        fetchDeposits();
      }
    }, 30000);
    
    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
  // Re-fetch when filters or page changes
  useEffect(() => {
    // No need to fetch from backend, just recalculate visible deposits
  }, [filters, page]);
  
  // Manual refresh handler
  const handleRefresh = () => {
    fetchDeposits(true);
  };

  const fetchUserInfo = async (depositsList) => {
    // Get unique user IDs from the deposits
    const userIds = [...new Set(depositsList.map(deposit => deposit.userId))];
    
    if (userIds.length === 0) return;
    
    console.log(`Fetching user info for ${userIds.length} users`);
    
    // Create a map of user IDs to user data
    const newUserMap = { ...userMap };
    const newWalletMap = { ...walletMap };
    
    // Only fetch for users we don't already have in the map
    const usersToFetch = userIds.filter(id => !newUserMap[id]);
    
    // Fetch user data and wallet addresses for each user
    for (const userId of usersToFetch) {
      if (!userId) continue;
      
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          newUserMap[userId] = {
            id: userId,
            ...userDoc.data()
          };
          console.log(`Fetched user data for ${userId}: ${newUserMap[userId].email || 'No email'}`);
        } else {
          console.log(`User document does not exist for ID: ${userId}`);
        }
        
        // Fetch wallet address
        const walletDoc = await getDoc(doc(db, 'walletAddresses', userId));
        if (walletDoc.exists()) {
          const walletData = walletDoc.data();
          
          // Handle different wallet data structures
          let wallets = {};
          
          if (walletData.wallets) {
            wallets = walletData.wallets;
          } else if (walletData.addresses) {
            wallets = walletData.addresses;
          }
          
          newWalletMap[userId] = {
            ...walletData,
            wallets: wallets
          };
          
          console.log(`Fetched wallet data for ${userId}, chains: ${Object.keys(wallets).join(', ')}`);
        } else {
          console.log(`Wallet document does not exist for ID: ${userId}`);
        }
      } catch (userError) {
        console.error(`Error fetching info for user ${userId}:`, userError);
      }
    }
    
    // Update state only if we fetched new data
    if (usersToFetch.length > 0) {
      setUserMap(newUserMap);
      setWalletMap(newWalletMap);
    }
  };

  // Function to get blockchain explorer URL based on chain and hash
  const getExplorerUrl = (chain, hash) => {
    if (!hash) return '#';
    
    // If this is a test hash, extract the chain prefix if present
    if (hash.startsWith('eth-') || hash.startsWith('bsc-') || 
        hash.startsWith('poly-') || hash.startsWith('sol-')) {
      hash = hash.substring(4); // Remove prefix
    }
    
    switch (chain) {
      case 'ethereum':
        return `https://etherscan.io/tx/${hash}`;
      case 'bsc':
        return `https://bscscan.com/tx/${hash}`;
      case 'polygon':
        return `https://polygonscan.com/tx/${hash}`;
      case 'solana':
        return `https://solscan.io/tx/${hash}`;
      default:
        return `https://etherscan.io/tx/${hash}`;
    }
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address || address === 'N/A') return 'N/A';
    
    // If address is longer than 12 characters, truncate it
    if (address.length > 16) {
      return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
    }
    
    return address;
  };

  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleCopyClick = text => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  // Handle creating test deposits
  const handleCreateTestDeposits = async () => {
    try {
      setCreatingTestData(true);
      toast.loading('Creating test deposits...', { id: 'create-test' });
      
      const response = await axios.post('/api/admin/create-test-deposits');
      
      if (response.data && response.data.success) {
        toast.success(`${response.data.message}`, { id: 'create-test' });
        
        // Refresh the deposits after a short delay
        setTimeout(() => {
          fetchDeposits(true);
        }, 1000);
      } else {
        throw new Error('Failed to create test deposits');
      }
    } catch (error) {
      console.error('Error creating test deposits:', error);
      toast.error(`Error creating test deposits: ${error.message}`, { id: 'create-test' });
    } finally {
      setCreatingTestData(false);
    }
  };

  // Empty state render
  const renderEmptyState = () => {
    return (
      <EmptyStateContainer>
        <div className="empty-icon">
          <i className="bi bi-inbox"></i>
        </div>
        <div className="message">
          No deposits found. Create some test deposits to see how it works.
        </div>
        <button 
          className="create-button"
          onClick={handleCreateTestDeposits}
          disabled={creatingTestData}
        >
          {creatingTestData ? 'Creating...' : 'Create Test Deposits'}
        </button>
      </EmptyStateContainer>
    );
  };

  const visibleDeposits = getVisibleDeposits();

  // Add this helper function to format currency amounts properly
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '0';
    
    // Parse the amount as a number
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    // Format with up to 6 decimal places, but remove trailing zeros
    return num.toFixed(6).replace(/\.?0+$/, '');
  };

  return (
    <Container>
      <h1>Deposit Transactions</h1>
      
      <ActionBar>
        <div className="left">
          <RefreshButton 
            onClick={handleRefresh} 
            disabled={refreshing || creatingTestData}
          >
            <i className="bi bi-arrow-clockwise"></i>
            {refreshing ? 'Refreshing...' : 'Refresh Deposits'}
          </RefreshButton>
          
          <span className="last-updated">
            Last updated: {stats.lastUpdated ? formatTimestamp(stats.lastUpdated) : 'Never'}
          </span>
        </div>
        
        <div className="right">
          <FilterContainer>
            <Select 
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Select>
            
            <Select 
              value={filters.network}
              onChange={e => setFilters({...filters, network: e.target.value})}
            >
              <option value="all">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="polygon">Polygon</option>
              <option value="solana">Solana</option>
            </Select>
            
            <Select 
              value={filters.currency}
              onChange={e => setFilters({...filters, currency: e.target.value})}
            >
              <option value="all">All Currencies</option>
              <option value="ETH">ETH</option>
              <option value="BNB">BNB</option>
              <option value="MATIC">MATIC</option>
              <option value="SOL">SOL</option>
            </Select>
          </FilterContainer>
        </div>
      </ActionBar>
      
      <Card>
        <h2>Deposit Statistics</h2>
        <StatsContainer>
          <StatCard>
            <h3>Total Deposits</h3>
            <div className="value">{stats.totalDeposits}</div>
          </StatCard>
          <StatCard>
            <h3>Total Deposit Amount</h3>
            <div className="value">{stats.totalDepositAmount}</div>
          </StatCard>
          <StatCard>
            <h3>Unique Users</h3>
            <div className="value">{stats.totalUsers}</div>
          </StatCard>
          <StatCard>
            <h3>Pending Deposits</h3>
            <div className="value">{stats.pendingDeposits}</div>
          </StatCard>
        </StatsContainer>
      </Card>
      
      <Card>
        <h2>All User Deposits</h2>
        {loading ? (
          <LoadingSpinner>
            <div className="spinner"></div>
            <div>Loading deposits...</div>
          </LoadingSpinner>
        ) : visibleDeposits.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <DepositsTable>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Network</th>
                  <th>From Address</th>
                  <th>Wallet Address</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Transaction Hash</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {visibleDeposits.map(deposit => (
                  <tr key={deposit.id}>
                    <td>
                      <UserLink onClick={() => navigate(`/admin/deposits/${deposit.userId}`)}>
                        {userMap[deposit.userId]?.email || userMap[deposit.userId]?.displayName || 'Unknown User'}
                      </UserLink>
                    </td>
                    <td>
                      <NetworkBadge network={deposit.chain}>
                        {deposit.chain?.charAt(0).toUpperCase() + deposit.chain?.slice(1) || 'Unknown'}
                      </NetworkBadge>
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deposit.fromAddress || 'N/A'}
                      {deposit.fromAddress && (
                        <CopyButton onClick={() => handleCopyClick(deposit.fromAddress)}>
                          {copiedText === deposit.fromAddress ? 
                            <i className="bi bi-check-circle"></i> : 
                            <i className="bi bi-clipboard"></i>}
                        </CopyButton>
                      )}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deposit.toAddress || walletMap[deposit.userId]?.wallets?.[deposit.chain] || 'N/A'}
                      {(deposit.toAddress || walletMap[deposit.userId]?.wallets?.[deposit.chain]) && (
                        <CopyButton onClick={() => handleCopyClick(deposit.toAddress || walletMap[deposit.userId]?.wallets?.[deposit.chain] || '')}>
                          {copiedText === (deposit.toAddress || walletMap[deposit.userId]?.wallets?.[deposit.chain]) ? 
                            <i className="bi bi-check-circle"></i> : 
                            <i className="bi bi-clipboard"></i>}
                        </CopyButton>
                      )}
                    </td>
                    <td className="amount-cell">
                      {formatAmount(deposit.amount)}
                    </td>
                    <td>{deposit.token || 'Unknown'}</td>
                    <td>
                      <StatusBadge $status={deposit.status}>
                        <i className={`bi bi-${
                          deposit.status === 'completed' ? 'check-circle' : 
                          deposit.status === 'pending' ? 'hourglass' : 
                          'x-circle'
                        }`}></i>
                        {deposit.status?.charAt(0).toUpperCase() + deposit.status?.slice(1) || 'Unknown'}
                      </StatusBadge>
                    </td>
                    <td>
                      {deposit.txHash ? (
                        <>
                          <AddressLink 
                            href={getExplorerUrl(deposit.chain, deposit.txHash)} 
                            target="_blank"
                            rel="noopener noreferrer"
                            title={deposit.txHash}
                          >
                            {formatAddress(deposit.txHash)}
                          </AddressLink>
                          <CopyButton onClick={() => handleCopyClick(deposit.txHash)}>
                            {copiedText === deposit.txHash ? 
                              <i className="bi bi-check-circle"></i> : 
                              <i className="bi bi-clipboard"></i>}
                          </CopyButton>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{formatTimestamp(deposit.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </DepositsTable>
            
            <Pagination>
              <PageButton 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <i className="bi bi-chevron-left"></i>
              </PageButton>
              
              {[...Array(totalPages).keys()].map(pageNum => (
                <PageButton 
                  key={pageNum + 1}
                  active={page === pageNum + 1}
                  onClick={() => setPage(pageNum + 1)}
                >
                  {pageNum + 1}
                </PageButton>
              ))}
              
              <PageButton 
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </PageButton>
            </Pagination>
          </>
        )}
      </Card>
      
      <Toaster position="top-right" />
    </Container>
  );
};

export default AllDeposits; 