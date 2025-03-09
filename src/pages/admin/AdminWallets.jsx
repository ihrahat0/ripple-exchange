import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatAddress } from '../../utils/helpers';
import AdminNavbar from '../../components/AdminNavbar';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 30px;
`;

const WalletCard = styled.div`
  background: #fff;
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
  border-bottom: 1px solid #eee;
`;

const UserId = styled.h3`
  color: #333;
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
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  position: relative;
`;

const WalletNetwork = styled.h4`
  color: #666;
  text-transform: capitalize;
  margin-top: 0;
  margin-bottom: 10px;
`;

const WalletAddress = styled.div`
  background: #f9f9f9;
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
  background: #fff4f4;
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
  color: #0066cc;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RefreshButton = styled.button`
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
  
  &:hover {
    background: #0d8aee;
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const RefreshAllButton = styled(RefreshButton)`
  background: #4caf50;
  margin-left: 10px;
  
  &:hover {
    background: #3d8b40;
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
  color: #4caf50;
`;

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
      const response = await axios.get('/api/admin/wallets');
      console.log('Wallets data received:', response.data);
      setWallets(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error fetching wallets:', error);
      toast.error(`Failed to fetch wallets: ${errorMessage}`);
      // Set empty array to avoid undefined errors
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

  if (loading) {
    return <LoadingOverlay>Loading wallets...</LoadingOverlay>;
  }

  return (
    <>
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
          <p>No wallets found</p>
        ) : (
          wallets.map((wallet) => (
            <WalletCard key={wallet.userId}>
              <UserInfo>
                <UserId>User ID: {wallet.userId}</UserId>
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
                    <WalletNetwork>{network}</WalletNetwork>
                    <WalletAddress>
                      <span>{formatAddress(address)}</span>
                      <CopyButton onClick={() => copyToClipboard(address)}>
                        {copiedAddress === address ? "Copied!" : "Copy"}
                      </CopyButton>
                    </WalletAddress>
                    
                    {wallet.privateKeys && wallet.privateKeys[network] && (
                      <WalletPrivateKey>
                        <span>{formatAddress(wallet.privateKeys[network])}</span>
                        <CopyButton onClick={() => copyToClipboard(wallet.privateKeys[network])}>
                          Copy Key
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
          ))
        )}
        <ToastContainer position="bottom-right" />
      </Container>
    </>
  );
};

export default AdminWallets; 