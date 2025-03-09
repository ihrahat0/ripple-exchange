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

const AdminWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      console.log('Fetching wallets from server...');
      const response = await axios.get('/api/admin/wallets');
      console.log('Wallets data received:', response.data);
      
      // Handle different response formats
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Process the wallet data
          const processedWallets = response.data.map(wallet => {
            // If wallet already has userEmail, use it
            if (wallet.userEmail) {
              return wallet;
            }
            
            // Otherwise generate a placeholder email from userId
            return {
              ...wallet,
              userEmail: `user-${wallet.userId.substring(0, 6)}@example.com`
            };
          });
          
          setWallets(processedWallets);
          toast.success(`Found ${processedWallets.length} wallets`);
        } else if (response.data.error) {
          // Handle error in response data
          toast.error(`Server error: ${response.data.message || response.data.error}`);
          setWallets([]);
        } else {
          // Unexpected response format
          console.warn('Unexpected response format:', response.data);
          toast.error('Received unexpected data format from server');
          setWallets([]);
        }
      } else {
        // Empty response
        toast.error('No data received from server');
        setWallets([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error fetching wallets:', error);
      toast.error(`Failed to fetch wallets: ${errorMessage}`);
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (userId) => {
    try {
      setRefreshing(true);
      console.log(`Refreshing balance for user ${userId}`);
      const response = await axios.post('/api/admin/refresh-balance', { userId });
      console.log('Balance refresh response:', response.data);
      
      // Update the wallets state with the new data
      setWallets(prevWallets => 
        prevWallets.map(wallet => 
          wallet.userId === userId ? { ...wallet, balances: response.data.balances } : wallet
        )
      );
      
      toast.success(`Balances refreshed for user ${userId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error refreshing balance:', error);
      toast.error(`Failed to refresh balances: ${errorMessage}`);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshAllBalances = async () => {
    try {
      setRefreshingAll(true);
      
      // Sequentially refresh each wallet to prevent overwhelming the server
      for (const wallet of wallets) {
        try {
          const response = await axios.post('/api/admin/refresh-balance', { userId: wallet.userId });
          
          // Update the wallets state with the new data
          setWallets(prevWallets => 
            prevWallets.map(w => 
              w.userId === wallet.userId ? { ...w, balances: response.data.balances } : w
            )
          );
          
          toast.success(`Refreshed balances for user ${wallet.userId}`);
        } catch (err) {
          console.error(`Error refreshing balance for ${wallet.userId}:`, err);
        }
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success('All balances have been refreshed');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error refreshing all balances:', error);
      toast.error(`Failed to refresh all balances: ${errorMessage}`);
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
                  disabled={refreshing}
                >
                  {refreshing ? (
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
                {Object.entries(wallet.addresses || {}).map(([network, address]) => (
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