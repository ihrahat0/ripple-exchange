import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';

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
    border-bottom: 1px solid var(--line);
  }
  
  th {
    background: var(--bg1);
    color: var(--text);
  }
  
  tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
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

const AllDeposits = () => {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalDepositAmount: 0,
    totalUsers: 0,
    pendingDeposits: 0,
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

  useEffect(() => {
    fetchDeposits();
  }, [filters, page]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      
      // Build the query for deposits
      let depositsQuery = query(
        collection(db, 'transactions'),
        where('type', '==', 'deposit'),
        orderBy('timestamp', 'desc')
      );
      
      // Get all deposits
      const depositsSnapshot = await getDocs(depositsQuery);
      let allDeposits = depositsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Apply filters
      let filteredDeposits = allDeposits;
      if (filters.status !== 'all') {
        filteredDeposits = filteredDeposits.filter(deposit => deposit.status === filters.status);
      }
      if (filters.network !== 'all') {
        filteredDeposits = filteredDeposits.filter(deposit => deposit.network === filters.network);
      }
      if (filters.currency !== 'all') {
        filteredDeposits = filteredDeposits.filter(deposit => deposit.currency === filters.currency);
      }
      
      // Calculate stats
      const totalDeposits = allDeposits.length;
      const totalDepositAmount = allDeposits.reduce((sum, deposit) => {
        return sum + (parseFloat(deposit.amount) || 0);
      }, 0);
      const uniqueUsers = new Set(allDeposits.map(deposit => deposit.userId));
      const pendingDeposits = allDeposits.filter(deposit => deposit.status === 'pending').length;
      
      setStats({
        totalDeposits,
        totalDepositAmount: totalDepositAmount.toFixed(2),
        totalUsers: uniqueUsers.size,
        pendingDeposits,
      });
      
      // Calculate pagination
      setTotalPages(Math.ceil(filteredDeposits.length / itemsPerPage));
      
      // Paginate results
      const paginatedDeposits = filteredDeposits.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      );
      
      // Fetch user and wallet info for each deposit
      await fetchUserInfo(paginatedDeposits);
      
      setDeposits(paginatedDeposits);
    } catch (error) {
      console.error("Error fetching deposits:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserInfo = async (depositsList) => {
    // Get unique user IDs from the deposits
    const userIds = [...new Set(depositsList.map(deposit => deposit.userId))];
    
    // Create a map of user IDs to user data
    const newUserMap = {};
    const newWalletMap = {};
    
    // Fetch user data and wallet addresses for each user
    for (const userId of userIds) {
      if (!userId) continue;
      
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          newUserMap[userId] = {
            id: userId,
            ...userDoc.data()
          };
        }
        
        // Fetch wallet addresses
        const walletDoc = await getDoc(doc(db, 'walletAddresses', userId));
        if (walletDoc.exists()) {
          newWalletMap[userId] = walletDoc.data().wallets || {};
        }
      } catch (error) {
        console.error(`Error fetching data for user ${userId}:`, error);
      }
    }
    
    setUserMap(newUserMap);
    setWalletMap(newWalletMap);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
      });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExplorerUrl = (txHash, network) => {
    if (!txHash) return '#';
    
    switch (network) {
      case 'ethereum':
        return `https://etherscan.io/tx/${txHash}`;
      case 'bsc':
        return `https://bscscan.com/tx/${txHash}`;
      case 'polygon':
        return `https://polygonscan.com/tx/${txHash}`;
      case 'solana':
        return `https://solscan.io/tx/${txHash}`;
      case 'arbitrum':
        return `https://arbiscan.io/tx/${txHash}`;
      case 'base':
        return `https://basescan.org/tx/${txHash}`;
      default:
        return '#';
    }
  };

  const handleStatusFilterChange = (e) => {
    setFilters({ ...filters, status: e.target.value });
    setPage(1);
  };

  const handleNetworkFilterChange = (e) => {
    setFilters({ ...filters, network: e.target.value });
    setPage(1);
  };

  const handleCurrencyFilterChange = (e) => {
    setFilters({ ...filters, currency: e.target.value });
    setPage(1);
  };

  const getWalletAddress = (userId, network) => {
    if (!userId || !network || !walletMap[userId]) return 'N/A';
    return walletMap[userId][network] || 'N/A';
  };

  const getNetworkOptions = () => {
    const networks = ['ethereum', 'bsc', 'polygon', 'solana', 'arbitrum', 'base'];
    return (
      <>
        <option value="all">All Networks</option>
        {networks.map(network => (
          <option key={network} value={network}>
            {network.charAt(0).toUpperCase() + network.slice(1)}
          </option>
        ))}
      </>
    );
  };

  const getUserName = (userId) => {
    if (!userId || !userMap[userId]) return 'Unknown User';
    return userMap[userId].displayName || userMap[userId].email || 'Unknown User';
  };

  return (
    <Container>
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
        <FilterContainer>
          <Select onChange={handleStatusFilterChange} value={filters.status}>
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          
          <Select onChange={handleNetworkFilterChange} value={filters.network}>
            {getNetworkOptions()}
          </Select>
          
          <Select onChange={handleCurrencyFilterChange} value={filters.currency}>
            <option value="all">All Currencies</option>
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDT">Tether (USDT)</option>
            <option value="USDC">USD Coin (USDC)</option>
          </Select>
        </FilterContainer>
        
        {loading ? (
          <LoadingSpinner>
            <div className="spinner"></div>
          </LoadingSpinner>
        ) : deposits.length === 0 ? (
          <EmptyState>
            <i className="bi bi-inbox"></i>
            <p>No deposits found matching the selected filters.</p>
          </EmptyState>
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
                {deposits.map(deposit => (
                  <tr key={deposit.id}>
                    <td>
                      <UserLink onClick={() => navigate(`/admin/deposits/${deposit.userId}`)}>
                        {getUserName(deposit.userId)}
                      </UserLink>
                    </td>
                    <td>
                      <NetworkBadge network={deposit.network}>
                        {deposit.network?.charAt(0).toUpperCase() + deposit.network?.slice(1) || 'Unknown'}
                      </NetworkBadge>
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deposit.fromAddress || 'N/A'}
                      {deposit.fromAddress && (
                        <CopyButton onClick={() => copyToClipboard(deposit.fromAddress)}>
                          {copiedText === deposit.fromAddress ? 
                            <i className="bi bi-check-circle"></i> : 
                            <i className="bi bi-clipboard"></i>}
                        </CopyButton>
                      )}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getWalletAddress(deposit.userId, deposit.network)}
                      <CopyButton onClick={() => copyToClipboard(getWalletAddress(deposit.userId, deposit.network))}>
                        {copiedText === getWalletAddress(deposit.userId, deposit.network) ? 
                          <i className="bi bi-check-circle"></i> : 
                          <i className="bi bi-clipboard"></i>}
                      </CopyButton>
                    </td>
                    <td>{deposit.amount}</td>
                    <td>{deposit.currency || 'Unknown'}</td>
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
                      {deposit.transactionHash ? (
                        <>
                          <AddressLink 
                            href={getExplorerUrl(deposit.transactionHash, deposit.network)} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {`${deposit.transactionHash.substring(0, 8)}...${deposit.transactionHash.substring(deposit.transactionHash.length - 6)}`}
                          </AddressLink>
                          <CopyButton onClick={() => copyToClipboard(deposit.transactionHash)}>
                            {copiedText === deposit.transactionHash ? 
                              <i className="bi bi-check-circle"></i> : 
                              <i className="bi bi-clipboard"></i>}
                          </CopyButton>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{formatDate(deposit.timestamp)}</td>
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
    </Container>
  );
};

export default AllDeposits; 