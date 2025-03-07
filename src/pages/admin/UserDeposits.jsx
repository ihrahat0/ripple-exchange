import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { SUPPORTED_CHAINS } from '../../services/walletService';

const Container = styled.div`
  padding: 20px;
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

const UserInfoCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBlock = styled.div`
  padding: 16px;
  background: var(--bg);
  border-radius: 6px;
  border: 1px solid var(--line);
`;

const InfoTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
  margin-bottom: 8px;
`;

const InfoValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
`;

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const WalletCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--line);
`;

const WalletTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  h3 {
    font-size: 16px;
    margin: 0;
    margin-left: 8px;
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
  margin-left: auto;
`;

const AddressField = styled.div`
  background: var(--bg);
  padding: 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 12px;
  word-break: break-all;
  border: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const DepositTable = styled.table`
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

const ErrorMessage = styled.div`
  color: var(--error);
  background: rgba(246, 70, 93, 0.1);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
`;

const UserDeposits = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userWallets, setUserWallets] = useState({});
  const [deposits, setDeposits] = useState([]);
  const [error, setError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserWallets();
      fetchUserDeposits();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUser({
          id: userId,
          ...userDoc.data()
        });
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to fetch user details');
    }
  };

  const fetchUserWallets = async () => {
    try {
      const walletDoc = await getDoc(doc(db, 'walletAddresses', userId));
      if (walletDoc.exists()) {
        setUserWallets(walletDoc.data().wallets || {});
      }
    } catch (err) {
      console.error('Error fetching user wallets:', err);
      setError('Failed to fetch user wallet addresses');
    }
  };

  const fetchUserDeposits = async () => {
    try {
      const depositsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', '==', 'deposit'),
        orderBy('timestamp', 'desc')
      );
      
      const depositsSnapshot = await getDocs(depositsQuery);
      const depositsList = depositsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      
      setDeposits(depositsList);
    } catch (err) {
      console.error('Error fetching user deposits:', err);
      setError('Failed to fetch user deposit history');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedAddress(text);
        setTimeout(() => setCopiedAddress(null), 2000);
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
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getExplorerUrl = (txHash, chain) => {
    if (!txHash || !chain) return '#';
    
    const explorer = SUPPORTED_CHAINS[chain]?.explorer;
    if (!explorer) return '#';
    
    if (chain === 'solana') {
      return `${explorer}/tx/${txHash}`;
    } else {
      return `${explorer}/tx/${txHash}`;
    }
  };

  if (loading) {
    return <Container>Loading user deposit data...</Container>;
  }

  return (
    <Container>
      <ActionButton onClick={() => navigate('/admin/users')}>
        ← Back to Users
      </ActionButton>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {user && (
        <>
          <h2>Deposit History for {user.email || user.displayName || userId}</h2>
          
          <UserInfoCard>
            <InfoBlock>
              <InfoTitle>Email</InfoTitle>
              <InfoValue>{user.email || 'N/A'}</InfoValue>
            </InfoBlock>
            <InfoBlock>
              <InfoTitle>Total Deposits</InfoTitle>
              <InfoValue>{deposits.length}</InfoValue>
            </InfoBlock>
            <InfoBlock>
              <InfoTitle>Account Created</InfoTitle>
              <InfoValue>
                {user.createdAt ? formatDate(user.createdAt.toDate ? user.createdAt.toDate() : user.createdAt) : 'N/A'}
              </InfoValue>
            </InfoBlock>
            <InfoBlock>
              <InfoTitle>User ID</InfoTitle>
              <InfoValue style={{ fontSize: '14px' }}>{userId}</InfoValue>
            </InfoBlock>
          </UserInfoCard>
          
          <h3>User Wallet Addresses</h3>
          
          <WalletGrid>
            {Object.entries(userWallets).length > 0 ? (
              Object.entries(userWallets).map(([chain, address]) => (
                <WalletCard key={chain}>
                  <WalletTitle>
                    <h3>{SUPPORTED_CHAINS[chain]?.name || chain}</h3>
                    <NetworkBadge network={chain}>{chain}</NetworkBadge>
                  </WalletTitle>
                  <AddressField>
                    <span>{address}</span>
                    <CopyButton onClick={() => copyToClipboard(address)}>
                      {copiedAddress === address ? 
                        <i className="bi bi-check-circle"></i> : 
                        <i className="bi bi-clipboard"></i>}
                    </CopyButton>
                  </AddressField>
                  <a 
                    href={`${SUPPORTED_CHAINS[chain]?.explorer}/address/${address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)', fontSize: '14px', textDecoration: 'none' }}
                  >
                    <i className="bi bi-box-arrow-up-right"></i> View on Explorer
                  </a>
                </WalletCard>
              ))
            ) : (
              <EmptyState>
                <i className="bi bi-wallet2"></i>
                <p><strong>No wallet addresses found</strong></p>
                <p>This user does not have any wallet addresses generated.</p>
              </EmptyState>
            )}
          </WalletGrid>
          
          <h3>Deposit History</h3>
          
          {deposits.length > 0 ? (
            <DepositTable>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Token</th>
                  <th>Amount</th>
                  <th>Chain</th>
                  <th>From Address</th>
                  <th>To Address</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map(deposit => (
                  <tr key={deposit.id}>
                    <td>{formatDate(deposit.timestamp)}</td>
                    <td>{deposit.token || deposit.currency || 'Unknown'}</td>
                    <td>{deposit.amount}</td>
                    <td>
                      <NetworkBadge network={deposit.chain || deposit.network}>
                        {SUPPORTED_CHAINS[deposit.chain || deposit.network]?.name || deposit.chain || deposit.network || 'Unknown'}
                      </NetworkBadge>
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deposit.fromAddress || 'N/A'}
                      {deposit.fromAddress && (
                        <CopyButton onClick={() => copyToClipboard(deposit.fromAddress)}>
                          {copiedAddress === deposit.fromAddress ? 
                            <i className="bi bi-check-circle"></i> : 
                            <i className="bi bi-clipboard"></i>}
                        </CopyButton>
                      )}
                    </td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deposit.toAddress || userWallets[deposit.chain || deposit.network] || 'N/A'}
                      {(deposit.toAddress || userWallets[deposit.chain || deposit.network]) && (
                        <CopyButton onClick={() => copyToClipboard(deposit.toAddress || userWallets[deposit.chain || deposit.network])}>
                          {copiedAddress === (deposit.toAddress || userWallets[deposit.chain || deposit.network]) ? 
                            <i className="bi bi-check-circle"></i> : 
                            <i className="bi bi-clipboard"></i>}
                        </CopyButton>
                      )}
                    </td>
                    <td>
                      <StatusBadge $status={deposit.status}>
                        <i className={
                          deposit.status === 'completed' ? 'bi bi-check-circle' :
                          deposit.status === 'pending' ? 'bi bi-hourglass-split' :
                          deposit.status === 'failed' ? 'bi bi-x-circle' :
                          'bi bi-question-circle'
                        }></i>
                        {deposit.status}
                      </StatusBadge>
                    </td>
                    <td>
                      {(deposit.txHash || deposit.transactionHash) ? (
                        <a 
                          href={getExplorerUrl(deposit.txHash || deposit.transactionHash, deposit.chain || deposit.network)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)' }}
                        >
                          {(deposit.txHash || deposit.transactionHash).substring(0, 8)}...
                        </a>
                      ) : (
                        'N/A'
                      )}
                      {(deposit.txHash || deposit.transactionHash) && (
                        <CopyButton onClick={() => copyToClipboard(deposit.txHash || deposit.transactionHash)}>
                          {copiedAddress === (deposit.txHash || deposit.transactionHash) ? 
                            <i className="bi bi-check-circle"></i> : 
                            <i className="bi bi-clipboard"></i>}
                        </CopyButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DepositTable>
          ) : (
            <EmptyState>
              <i className="bi bi-inbox"></i>
              <p><strong>No deposits found</strong></p>
              <p>This user has not made any deposits yet.</p>
            </EmptyState>
          )}
        </>
      )}
    </Container>
  );
};

export default UserDeposits; 