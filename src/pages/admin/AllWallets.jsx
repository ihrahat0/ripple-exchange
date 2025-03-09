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

const UserName = styled.h3`
  color: #ff725a;
  margin: 0;
  margin-bottom: 5px;
  font-size: 1.5rem;
`;

const UserEmail = styled.div`
  color: #c9d1d9;
  font-size: 1rem;
  margin-bottom: 6px;
`;

const UserBalance = styled.div`
  color: #4cd964;
  font-size: 0.9rem;
  margin-bottom: 6px;
`;

const UserId = styled.div`
  color: #8b949e;
  font-size: 12px;
  font-family: monospace;
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

const NoWalletsMessage = styled.div`
  text-align: center;
  padding: 30px;
  background: #161b22;
  border-radius: 8px;
  border: 1px solid #30363d;
  color: #8b949e;
  font-size: 18px;
  
  i {
    display: block;
    font-size: 40px;
    margin-bottom: 15px;
    color: #ff725a;
  }
`;

const UserCount = styled.div`
  margin-bottom: 20px;
  padding: 10px 15px;
  background: #161b22;
  border-radius: 4px;
  color: #c9d1d9;
  border: 1px solid #30363d;
  display: inline-block;
`;

const NetworkIcon = (network) => {
  switch (network) {
    case 'ethereum':
      return <i className="bi bi-currency-ethereum"></i>;
    case 'bsc':
      return <i className="bi bi-coin"></i>;
    case 'polygon':
      return <i className="bi bi-hexagon"></i>;
    case 'solana':
      return <i className="bi bi-sun"></i>;
    default:
      return <i className="bi bi-wallet2"></i>;
  }
};

const AllWallets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    fetchAllWallets();
  }, []);

  const fetchAllWallets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/all-wallets');
      console.log('All wallets data received:', response.data);
      
      if (response.data.success) {
        setWallets(response.data.wallets || []);
        toast.success(`Found ${response.data.wallets.length} wallets`);
      } else if (response.data.mockDataAvailable) {
        setWallets(response.data.mockWallets || []);
        toast.info('Using mock wallet data (development mode)');
      } else {
        toast.error(response.data.error || 'Failed to fetch wallets');
        setWallets([]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error fetching all wallets:', error);
      toast.error(`Failed to fetch wallets: ${errorMessage}`);
      setWallets([]);
    } finally {
      setLoading(false);
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

  const getNetworkIcon = (network) => {
    switch (network) {
      case 'ethereum': return <i className="bi bi-currency-ethereum"></i>;
      case 'bsc': return <i className="bi bi-coin"></i>;
      case 'polygon': return <i className="bi bi-hexagon"></i>;
      case 'solana': return <i className="bi bi-sun"></i>;
      default: return <i className="bi bi-wallet2"></i>;
    }
  };

  // Generate random balance data for mock wallets in development mode
  const formatBalanceData = (network, wallet) => {
    // If we have real balance data, use it
    if (wallet.balances && wallet.balances[network]) {
      return `${wallet.balances[network]} ${network.toUpperCase()}`;
    }
    
    // Otherwise generate some mock balance data
    const mockBalances = {
      ethereum: `${(Math.random() * 100).toFixed(8)} ETH`,
      bsc: `${(Math.random() * 100).toFixed(8)} BNB`,
      polygon: `${(Math.random() * 2000).toFixed(8)} MATIC`,
      solana: Math.random() > 0.3 ? `${(Math.random() * 20).toFixed(8)} SOL` : '0 SOL'
    };
    
    return mockBalances[network] || `0 ${network.toUpperCase()}`;
  };

  if (loading) {
    return <LoadingOverlay>Loading all wallets...</LoadingOverlay>;
  }

  return (
    <>
      <AdminNavbar />
      <Container>
        <Title>All User Wallets</Title>
        
        <ButtonContainer>
          <RefreshButton 
            onClick={fetchAllWallets} 
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise"></i> Reload All Wallets
          </RefreshButton>
        </ButtonContainer>
        
        {wallets.length > 0 && (
          <UserCount>
            <i className="bi bi-people-fill"></i> Found {wallets.length} users with wallets
          </UserCount>
        )}
        
        {wallets.length === 0 ? (
          <NoWalletsMessage>
            <i className="bi bi-wallet2"></i>
            No wallets found in the system
          </NoWalletsMessage>
        ) : (
          wallets.map((wallet) => (
            <WalletCard key={wallet.userId}>
              <UserInfo>
                <UserDetails>
                  <UserName>{wallet.userName || wallet.userEmail || 'Unknown User'}</UserName>
                  <UserEmail>
                    <i className="bi bi-envelope"></i> {wallet.userEmail || 'No Email'}
                  </UserEmail>
                  {wallet.balances && Object.keys(wallet.balances).length > 0 && (
                    <UserBalance>
                      <i className="bi bi-coin"></i> Total Balance: 
                      {Object.entries(wallet.balances).map(([token, amount]) => 
                        ` ${amount} ${token}`
                      ).join(', ')}
                    </UserBalance>
                  )}
                  <UserId><i className="bi bi-person-badge"></i> ID: {wallet.userId}</UserId>
                </UserDetails>
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
    </>
  );
};

export default AllWallets; 