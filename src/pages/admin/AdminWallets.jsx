import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { formatAddress } from '../../utils/helpers';
import { SUPPORTED_CHAINS } from '../../services/walletService';

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
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
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

const UserId = styled.div`
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: monospace;
`;

const WalletList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const WalletItem = styled.div`
  background: var(--bg1);
  border-radius: 6px;
  padding: 16px;
  position: relative;
`;

const ChainInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ChainName = styled.div`
  font-weight: 600;
  color: var(--text);
`;

const ChainBadge = styled.div`
  background: ${props => {
    switch(props.chain) {
      case 'ethereum': return '#627EEA';
      case 'bsc': return '#F3BA2F';
      case 'polygon': return '#8247E5';
      case 'solana': return '#14F195';
      default: return 'var(--primary)';
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
`;

const AddressInfo = styled.div`
  margin-bottom: 12px;
`;

const AddressLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const Address = styled.div`
  font-family: monospace;
  background: var(--bg3);
  padding: 8px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 2px;
`;

const ActionButton = styled.button`
  width: 100%;
  background: ${props => props.primary ? 'var(--primary)' : 'var(--bg3)'};
  color: ${props => props.primary ? 'white' : 'var(--text)'};
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BalanceInfo = styled.div`
  margin: 12px 0;
`;

const BalanceLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const BalanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
`;

const AdminWallets = () => {
  const { currentUser } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingUser, setRefreshingUser] = useState(null);
  const [refreshingWallet, setRefreshingWallet] = useState(null);
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
      setRefreshingUser(userId);
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
      setRefreshingUser(null);
    }
  };
  
  const refreshAllBalances = async () => {
    for (const wallet of wallets) {
      await refreshUserBalance(wallet.userId);
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
            <RefreshButton 
              onClick={refreshAllBalances}
              disabled={!!refreshingUser}
            >
              <i className="bi bi-lightning-charge"></i>
              Refresh All Balances
            </RefreshButton>
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
                <ActionButton 
                  primary
                  onClick={() => refreshUserBalance(wallet.userId)}
                  disabled={refreshingUser === wallet.userId}
                >
                  {refreshingUser === wallet.userId ? (
                    <>Refreshing...</>
                  ) : (
                    <>
                      <i className="bi bi-lightning-charge"></i>
                      Refresh Balances
                    </>
                  )}
                </ActionButton>
              </UserInfo>
              
              <WalletList>
                {wallet.walletAddresses.map(w => (
                  <WalletItem key={`${w.chain}-${w.address}`}>
                    {refreshingWallet === `${wallet.userId}-${w.chain}` && (
                      <LoadingOverlay>Checking Balance...</LoadingOverlay>
                    )}
                    
                    <ChainInfo>
                      <ChainName>{getChainName(w.chain)}</ChainName>
                      <ChainBadge chain={w.chain}>{w.chain}</ChainBadge>
                    </ChainInfo>
                    
                    <AddressInfo>
                      <AddressLabel>Wallet Address</AddressLabel>
                      <Address>
                        <span>{formatAddress(w.address)}</span>
                        <CopyButton 
                          onClick={() => copyToClipboard(w.address)}
                          title="Copy Address"
                        >
                          {copiedAddress === w.address ? (
                            <i className="bi bi-check-lg"></i>
                          ) : (
                            <i className="bi bi-copy"></i>
                          )}
                        </CopyButton>
                      </Address>
                    </AddressInfo>
                    
                    <BalanceInfo>
                      <BalanceLabel>Recorded Balance</BalanceLabel>
                      <BalanceValue>
                        {(() => {
                          // Determine the token symbol based on chain
                          let tokenSymbol = w.chain.toUpperCase();
                          if (w.chain === 'ethereum') tokenSymbol = 'ETH';
                          if (w.chain === 'bsc') tokenSymbol = 'BNB';
                          
                          const balance = wallet.userInfo.balances?.[tokenSymbol] || 0;
                          return `${balance} ${tokenSymbol}`;
                        })()}
                      </BalanceValue>
                    </BalanceInfo>
                    
                    {getExplorerUrl(w.chain, w.address) && (
                      <a 
                        href={getExplorerUrl(w.chain, w.address)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <ActionButton>
                          <i className="bi bi-box-arrow-up-right"></i>
                          View on Explorer
                        </ActionButton>
                      </a>
                    )}
                  </WalletItem>
                ))}
              </WalletList>
            </WalletCard>
          ))}
        </>
      )}
    </Container>
  );
};

export default AdminWallets; 