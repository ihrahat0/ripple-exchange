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

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.h3`
  color: #333;
  margin: 0;
  margin-bottom: 5px;
`;

const UserEmail = styled.div`
  color: #666;
  font-size: 14px;
`;

const UserId = styled.div`
  color: #999;
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
        
        {wallets.length === 0 ? (
          <p>No wallets found</p>
        ) : (
          wallets.map((wallet) => (
            <WalletCard key={wallet.userId}>
              <UserInfo>
                <UserDetails>
                  <UserName>{wallet.userName || 'Unknown User'}</UserName>
                  <UserEmail>{wallet.userEmail || 'No Email'}</UserEmail>
                  <UserId>ID: {wallet.userId}</UserId>
                </UserDetails>
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
        <Toaster position="bottom-right" />
      </Container>
    </>
  );
};

export default AllWallets; 