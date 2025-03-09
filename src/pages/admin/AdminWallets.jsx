import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { formatAddress } from '../../utils/helpers';
import { SUPPORTED_CHAINS } from '../../services/walletService';
import AdminNavbar from '../../components/AdminNavbar';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: var(--text);
  margin: 0;
`;

const RefreshButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const WalletCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const UserInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--line);
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  margin-right: 16px;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const UserId = styled.h3`
  color: var(--text);
  margin: 0;
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
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 15px;
  position: relative;
`;

const WalletNetwork = styled.h4`
  color: var(--text-secondary);
  text-transform: capitalize;
  margin-top: 0;
  margin-bottom: 10px;
`;

const WalletAddress = styled.div`
  background: var(--bg3);
  padding: 10px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 10px;
  font-family: monospace;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WalletPrivateKey = styled.div`
  background: var(--bg3);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-family: monospace;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--primary);
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RefreshAllButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
  margin-left: 10px;
  
  &:hover {
    background: var(--primary-hover);
  }
  
  &:disabled {
    background: var(--primary-disabled);
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-size: 24px;
  font-weight: bold;
`;

const BalanceDisplay = styled.div`
  margin-top: 6px;
  font-weight: bold;
  color: var(--text);
`;

const AdminWallets = () => {
  const { currentUser } = useAuth();
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
      const response = await axios.get('/api/admin/wallets');
      
      if (response.data.success) {
        setWallets(response.data.wallets || []);
      } else {
        toast.error('Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Error fetching wallets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshUserBalance = async (userId) => {
    try {
      setRefreshing(true);
      const response = await axios.post('/api/admin/refresh-balance', { userId });
      
      if (response.data.success) {
        toast.success('Balance refreshed successfully');
        
        // Check if any balances were updated
        const updates = response.data.updates || {};
        const updateKeys = Object.keys(updates);
        
        if (updateKeys.length > 0) {
          updateKeys.forEach(token => {
            const update = updates[token];
            toast.success(
              `Updated ${token} balance: ${update.oldBalance} → ${update.newBalance} (+${update.depositAmount})`
            );
          });
          
          // Refresh the wallet list to show updated balances
          fetchWallets();
        } else {
          toast.info('No balance changes detected');
        }
      } else {
        toast.error('Failed to refresh balance');
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Error refreshing balance: ' + error.message);
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
      toast.error('Failed to refresh all balances');
      console.error('Error refreshing all balances:', error);
    } finally {
      setRefreshingAll(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };
  
  const getInitials = (name) => {
    if (!name || name === 'Unknown User' || name === 'No Name') return 'U';
    return name.charAt(0).toUpperCase();
  };
  
  const getChainName = (chain) => {
    return SUPPORTED_CHAINS[chain]?.name || chain.toUpperCase();
  };
  
  const getExplorerUrl = (chain, address) => {
    const explorer = SUPPORTED_CHAINS[chain]?.explorer;
    if (!explorer) return null;
    return `${explorer}/address/${address}`;
  };
  
  return (
    <>
      <AdminNavbar />
      <Container>
        <Header>
          <Title>Admin Wallet Manager</Title>
          <RefreshButton 
            onClick={fetchWallets} 
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh List
          </RefreshButton>
        </Header>
        
        {loading ? (
          <div>Loading wallet data...</div>
        ) : wallets.length === 0 ? (
          <div>No wallets found</div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <ButtonContainer>
                <RefreshAllButton 
                  onClick={refreshAllBalances}
                  disabled={refreshingAll || wallets.length === 0}
                >
                  <i className="bi bi-lightning-charge"></i>
                  Refresh All Balances
                </RefreshAllButton>
              </ButtonContainer>
            </div>
            
            {wallets.map(wallet => (
              <WalletCard key={wallet.userId}>
                <UserInfo>
                  <Avatar>{getInitials(wallet.userInfo.displayName)}</Avatar>
                  <UserDetails>
                    <UserName>{wallet.userInfo.displayName}</UserName>
                    <UserEmail>{wallet.userInfo.email}</UserEmail>
                    <UserId>{wallet.userId}</UserId>
                  </UserDetails>
                  <RefreshButton 
                    onClick={() => refreshUserBalance(wallet.userId)}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <>Refreshing...</>
                    ) : (
                      <>
                        <i className="bi bi-lightning-charge"></i>
                        Refresh Balances
                      </>
                    )}
                  </RefreshButton>
                </UserInfo>
                
                <WalletGrid>
                  {Object.entries(wallet.addresses).map(([network, address]) => (
                    <WalletItem key={network}>
                      <WalletNetwork>{network}</WalletNetwork>
                      <WalletAddress>
                        <span>{formatAddress(address)}</span>
                        <CopyButton 
                          onClick={() => copyToClipboard(address)}
                          title="Copy Address"
                        >
                          {copiedAddress === address ? (
                            <i className="bi bi-check-lg"></i>
                          ) : (
                            <i className="bi bi-copy"></i>
                          )}
                        </CopyButton>
                      </WalletAddress>
                      
                      {wallet.privateKeys && wallet.privateKeys[network] && (
                        <WalletPrivateKey>
                          <span>{formatAddress(wallet.privateKeys[network])}</span>
                          <CopyButton 
                            onClick={() => copyToClipboard(wallet.privateKeys[network])}
                            title="Copy Private Key"
                          >
                            <i className="bi bi-key"></i>
                          </CopyButton>
                        </WalletPrivateKey>
                      )}
                      
                      {wallet.balances && wallet.balances[network] && (
                        <BalanceDisplay>
                          Balance: {wallet.balances[network]} {network.toUpperCase()}
                        </BalanceDisplay>
                      )}
                    </WalletItem>
                  ))}
                </WalletGrid>
              </WalletCard>
            ))}
          </>
        )}
      </Container>
    </>
  );
};

export default AdminWallets; 