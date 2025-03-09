import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import toast, { Toaster } from 'react-hot-toast';
import { formatAddress } from '../../utils/helpers';
import AdminNavbar from '../../components/AdminNavbar';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: #e6edf3;
  background-color: #0d1117;
  min-height: 100vh;
`;

const Title = styled.h1`
  color: #e6edf3;
  margin-bottom: 30px;
  font-size: 2.5rem;
`;

const WalletCard = styled.div`
  background: #161b22;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid #30363d;
`;

const UserInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #30363d;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserEmail = styled.h3`
  color: #ff725a;
  margin: 0;
  margin-bottom: 5px;
  font-size: 1.5rem;
`;

const UserId = styled.div`
  color: #8b949e;
  font-size: 12px;
  font-family: monospace;
  opacity: 0.6;
`;

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WalletItem = styled.div`
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 15px;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 0 15px rgba(255, 114, 90, 0.2);
    border-color: rgba(255, 114, 90, 0.3);
  }
`;

const WalletNetwork = styled.h4`
  color: #ff725a;
  text-transform: capitalize;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  
  i {
    margin-right: 8px;
  }
`;

const WalletAddress = styled.div`
  background: #161b22;
  padding: 10px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 10px;
  font-family: monospace;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #c9d1d9;
  border: 1px solid #30363d;
`;

const WalletPrivateKey = styled.div`
  background: #201c1c;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-family: monospace;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  color: #c9d1d9;
  border: 1px solid #3d3030;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #58a6ff;
  font-size: 14px;
  
  &:hover {
    color: #ff725a;
  }
`;

const RefreshButton = styled.button`
  background: rgba(33, 150, 243, 0.2);
  color: #58a6ff;
  border: 1px solid #1f6feb;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: rgba(33, 150, 243, 0.4);
  }
  
  &:disabled {
    background: rgba(204, 204, 204, 0.1);
    color: #8b949e;
    border-color: #30363d;
    cursor: not-allowed;
  }
  
  i {
    font-size: 16px;
  }
`;

const RefreshAllButton = styled(RefreshButton)`
  background: rgba(76, 175, 80, 0.2);
  color: #4cd964;
  border-color: #2ea043;
  margin-left: 10px;
  
  &:hover {
    background: rgba(76, 175, 80, 0.4);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: #e6edf3;
  font-size: 24px;
  font-weight: bold;
  
  &::after {
    content: '';
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 114, 90, 0.3);
    border-radius: 50%;
    border-top-color: #ff725a;
    animation: spinner 1s ease-in-out infinite;
    margin-left: 10px;
  }
  
  @keyframes spinner {
    to {
      transform: rotate(360deg);
    }
  }
`;

const BalanceDisplay = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  font-weight: bold;
  color: #4cd964;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(76, 175, 80, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  background-color: #0d1117;
`;

const getNetworkIcon = (network) => {
  switch (network) {
    case 'ethereum': return <i className="bi bi-currency-ethereum"></i>;
    case 'bsc': return <i className="bi bi-coin"></i>;
    case 'polygon': return <i className="bi bi-hexagon"></i>;
    case 'solana': return <i className="bi bi-sun"></i>;
    default: return <i className="bi bi-wallet2"></i>;
  }
};

const getNetworkAddresses = (wallet) => {
  if (!wallet || !wallet.addresses) {
    return [];
  }
  
  return Object.entries(wallet.addresses || {})
    .filter(([_, address]) => address)
    .map(([network, address]) => ({ network, address }));
};

const AdminWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshingWallet, setRefreshingWallet] = useState(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      console.log('Fetching wallets data...');
      const response = await axios.get('/api/admin/wallets');
      console.log('Wallet data received:', response.data);
      
      if (Array.isArray(response.data)) {
        // Process each wallet to ensure it has user email
        const processedWallets = response.data.map(wallet => {
          // If wallet already has userEmail, keep it
          if (wallet.userEmail) {
            return wallet;
          }
          
          // Otherwise generate placeholder based on userId
          return {
            ...wallet,
            userEmail: wallet.userId ? `user-${wallet.userId.substring(0, 6)}@example.com` : 'unknown@email.com'
          };
        });
        
        setWallets(processedWallets);
        toast.success(`Successfully loaded ${processedWallets.length} wallets`);
      } else if (response.data.error) {
        console.error('Error in response:', response.data.error);
        toast.error(`Error: ${response.data.error}`);
        setWallets([]);
      } else {
        console.warn('Unexpected response format:', response.data);
        toast.error('Received unexpected data format from server');
        setWallets([]);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error(`Failed to fetch wallets: ${error.message || 'Unknown error'}`);
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (userId) => {
    try {
      setRefreshingWallet(userId);
      console.log(`Refreshing balance for user ${userId}`);
      
      // Show loading toast while refreshing
      toast.loading(`Refreshing balances for user ${userId}...`, { id: `refresh-${userId}` });
      
      // Set a longer timeout for balance checking (60 seconds)
      const response = await axios.post('/api/admin/refresh-balance', { userId }, {
        timeout: 60000 // 60 seconds timeout
      });
      
      console.log('Balance refresh response:', response.data);
      
      if (response.data && response.data.balances) {
        // Update the wallets state with the new data
        setWallets(prevWallets => 
          prevWallets.map(wallet => 
            wallet.userId === userId ? { ...wallet, balances: response.data.balances } : wallet
          )
        );
        
        const balanceCount = Object.keys(response.data.balances).length;
        
        if (response.data.updated) {
          toast.success(`Balances updated for user ${userId}! Found deposits.`, { id: `refresh-${userId}` });
        } else if (balanceCount > 0) {
          toast.success(`Balances refreshed for user ${userId}. No new deposits.`, { id: `refresh-${userId}` });
        } else {
          toast.error(`No balances found for user ${userId}`, { id: `refresh-${userId}` });
        }
      } else {
        console.error('Invalid response format:', response.data);
        toast.error(`Invalid response format from server`, { id: `refresh-${userId}` });
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error.response) {
        // Server responded with an error
        const serverError = error.response.data;
        errorMessage = serverError.message || serverError.error || `Server error: ${error.response.status}`;
        console.error('Server error details:', serverError);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Request timeout. This may take longer than expected.';
      } else {
        // Error setting up the request
        errorMessage = error.message || 'Failed to send request';
      }
      
      console.error('Error refreshing balances:', error);
      toast.error(`Failed to refresh balances: ${errorMessage}`, { id: `refresh-${userId}` });
    } finally {
      setRefreshingWallet(null);
    }
  };

  const refreshAllBalances = async () => {
    try {
      setRefreshingAll(true);
      toast.loading('Refreshing all wallet balances...', { id: 'refresh-all' });
      
      // Use the new bulk refresh endpoint with increased timeout
      const response = await axios.post('/api/admin/refresh-all-balances', {}, {
        timeout: 180000 // 3 minutes timeout
      });
      
      console.log('Bulk refresh response:', response.data);
      
      // Fetch wallets again to get updated data
      await fetchWallets();
      
      if (response.data && response.data.processed) {
        toast.success(
          `All balances refreshed! Processed ${response.data.processed} wallets, updated ${response.data.updated} users.`, 
          { id: 'refresh-all', duration: 5000 }
        );
      } else {
        toast.error('Invalid response from server', { id: 'refresh-all' });
      }
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error.response) {
        // Server responded with an error
        const serverError = error.response.data;
        errorMessage = serverError.message || serverError.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Request timeout. The operation may still be running on the server.';
      } else {
        // Error setting up the request
        errorMessage = error.message || 'Failed to send request';
      }
      
      console.error('Error refreshing all balances:', error);
      toast.error(`Failed to refresh all balances: ${errorMessage}`, { id: 'refresh-all' });
    } finally {
      setRefreshingAll(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedAddress(text);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedAddress(null), 2000);
      })
      .catch((err) => {
        toast.error('Failed to copy');
        console.error('Could not copy text: ', err);
      });
  };
  
  // Format balance data for display
  const formatBalanceData = (network, wallet) => {
    if (wallet.balances && wallet.balances[network]) {
      return `${wallet.balances[network]} ${network.toUpperCase()}`;
    }
    
    return `0 ${network.toUpperCase()}`;
  };

  if (loading) {
    return (
      <ContentWrapper>
        <AdminNavbar />
        <LoadingOverlay>Loading wallets...</LoadingOverlay>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <AdminNavbar />
      <Container>
        <Title>User Wallets</Title>
        
        <ButtonContainer>
          <RefreshButton 
            onClick={fetchWallets} 
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i> Reload Wallet List
          </RefreshButton>
          
          <RefreshAllButton 
            onClick={refreshAllBalances} 
            disabled={refreshingAll || wallets.length === 0}
          >
            <i className="bi bi-lightning-charge"></i> Refresh All Balances
          </RefreshAllButton>
        </ButtonContainer>
        
        {wallets.length === 0 ? (
          <div style={{ color: '#e6edf3', padding: '20px', textAlign: 'center' }}>
            No wallets found
          </div>
        ) : (
          wallets.map((wallet) => (
            <WalletCard key={wallet.userId}>
              <UserInfo>
                <UserDetails>
                  <UserEmail>
                    <i className="bi bi-envelope"></i> {wallet.userEmail || `user-${wallet.userId.substring(0, 6)}@example.com`}
                  </UserEmail>
                  <UserId><i className="bi bi-person-badge"></i> {wallet.userId}</UserId>
                </UserDetails>
                <RefreshButton 
                  onClick={() => refreshBalance(wallet.userId)}
                  disabled={refreshingWallet === wallet.userId}
                >
                  {refreshingWallet === wallet.userId ? (
                    <>Refreshing...</>
                  ) : (
                    <>
                      <i className="bi bi-arrow-repeat"></i>
                      Refresh Balance
                    </>
                  )}
                </RefreshButton>
              </UserInfo>
              
              <WalletGrid>
                {getNetworkAddresses(wallet).map(({ network, address }) => (
                  <WalletItem key={network}>
                    <WalletNetwork>
                      {getNetworkIcon(network)} {network.charAt(0).toUpperCase() + network.slice(1)}
                    </WalletNetwork>
                    <WalletAddress>
                      <span>{formatAddress(address)}</span>
                      <CopyButton onClick={() => copyToClipboard(address)}>
                        {copiedAddress === address ? <i className="bi bi-check-lg"></i> : <i className="bi bi-clipboard"></i>}
                      </CopyButton>
                    </WalletAddress>
                    
                    {wallet.privateKeys && wallet.privateKeys[network] && (
                      <WalletPrivateKey>
                        <span>{formatAddress(wallet.privateKeys[network])}</span>
                        <CopyButton onClick={() => copyToClipboard(wallet.privateKeys[network])}>
                          <i className="bi bi-key"></i>
                        </CopyButton>
                      </WalletPrivateKey>
                    )}
                    
                    <BalanceDisplay>
                      <span>Balance:</span> {formatBalanceData(network, wallet)}
                    </BalanceDisplay>
                  </WalletItem>
                ))}
              </WalletGrid>
            </WalletCard>
          ))
        )}
        <Toaster position="bottom-right" />
      </Container>
    </ContentWrapper>
  );
};

export default AdminWallets; 