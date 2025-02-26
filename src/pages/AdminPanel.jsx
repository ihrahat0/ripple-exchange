import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import styled from 'styled-components';
import axios from 'axios';
import { DEFAULT_COINS } from '../utils/constants';

// Comment out unused imports for now to fix compilation
// When components are needed, uncomment them
// import UserManagement from './admin/UserManagement';
// import TokenManagement from './admin/TokenManagement';
// import BalanceManagement from './admin/BalanceManagement';

const AdminLayout = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  background: var(--bg);
`;

const Sidebar = styled.div`
  background: var(--bg1);
  color: var(--text);
  padding: 20px 0;
  border-right: 1px solid var(--line);
  height: 100vh;
  position: fixed;
  width: 250px;
  overflow-y: auto;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 600;
  padding: 0 20px 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line);
  color: var(--primary);
`;

const NavMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin: 5px 0;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: ${props => props.active === 'true' ? 'var(--primary)' : 'var(--text)'};
  background: ${props => props.active === 'true' ? 'rgba(71, 130, 218, 0.1)' : 'transparent'};
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid ${props => props.active === 'true' ? 'var(--primary)' : 'transparent'};
  
  &:hover {
    background: rgba(71, 130, 218, 0.05);
    color: var(--primary);
  }
  
  i {
    margin-right: 10px;
    font-size: 18px;
  }
`;

const MainContent = styled.div`
  grid-column: 2;
  padding: 20px;
  margin-left: 250px;
  width: calc(100% - 250px);
`;

const AdminContainer = styled.div`
  padding: 20px;
  background: var(--bg1);
  border-radius: 8px;
  margin-bottom: 20px;
`;

const AdminCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const AdminHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--line);
`;

const Title = styled.h2`
  margin: 0;
  color: var(--text);
  font-size: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const StatIcon = styled.div`
  font-size: 24px;
  color: var(--primary);
  margin-bottom: 15px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg1);
  color: var(--text);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(74, 107, 243, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg1);
  color: var(--text);
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(74, 107, 243, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  
  &:hover {
    background: #3a5bd9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled(Button)`
  background: var(--error);
  
  &:hover {
    background: #d14351;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg1);
  color: var(--text);
  width: 100%;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(74, 107, 243, 0.2);
  }
`;

const CoinList = styled.div`
  display: grid;
  gap: 15px;
`;

const CoinItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg1);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateX(5px);
  }
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoinLogo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const CoinDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CoinSymbol = styled.span`
  font-weight: 600;
  color: var(--text);
`;

const CoinName = styled.span`
  color: var(--text-secondary);
  font-size: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const InfoBox = styled.div`
  margin: 10px 0;
  padding: 15px;
  background: var(--bg1);
  border-radius: 8px;
  border-left: 4px solid var(--primary);
`;

const TabsContainer = styled.div`
  margin-bottom: 20px;
`;

const TabButtons = styled.div`
  display: flex;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.active ? 'var(--bg2)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary)' : 'var(--text)'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  
  &:hover {
    color: var(--primary);
  }
`;

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [coins, setCoins] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoins: 0,
    activeUsers: 0
  });
  const [newCoin, setNewCoin] = useState({
    symbol: '',
    name: '',
    icon: '',
    description: '',
    contractAddress: '',
    chain: 'ethereum',
    baseAsset: '',
    quoteAsset: 'USDT',
    type: 'cex'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalance, setUserBalance] = useState({});
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user'
  });
  const [dexData, setDexData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const chains = [
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'bsc', name: 'BNB Smart Chain' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'avalanche', name: 'Avalanche' }
  ];

  useEffect(() => {
    const init = async () => {
      const isAdmin = await checkAdminAccess();
      if (isAdmin) {
        await fetchData();
      }
    };
    init();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchCoins(),
        fetchUsers(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateStats = async () => {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = currentUserDoc.data();
      
      if (!userData || (userData.role !== 'admin' && !userData.isAdmin)) {
        setError('You do not have admin privileges to view statistics');
        return;
      }
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const coinsSnapshot = await getDocs(collection(db, 'coins'));
      
      // Calculate active users (logged in within the last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let activeCount = 0;
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.lastLogin) {
          const lastLogin = new Date(userData.lastLogin);
          if (lastLogin > sevenDaysAgo) {
            activeCount++;
          }
        }
      });
      
      setStats({
        totalUsers: usersSnapshot.size,
        totalCoins: coinsSnapshot.size,
        activeUsers: activeCount
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      setError('Failed to calculate statistics. Please ensure you have proper permissions.');
    }
  };

  const checkAdminAccess = async () => {
    try {
      if (!currentUser) {
        console.log('No user logged in');
        navigate('/login');
        return false;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('User document not found');
        navigate('/');
        return false;
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        console.log('User is not an admin');
        navigate('/');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
      return false;
    }
  };

  const fetchCoins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'coins'));
      const coinsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoins(coinsList);
    } catch (error) {
      console.error('Error fetching coins:', error);
      setError('Failed to fetch coins');
    }
  };

  const fetchUsers = async () => {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = currentUserDoc.data();
      
      if (!userData || (userData.role !== 'admin' && !userData.isAdmin)) {
        setError('You do not have admin privileges to view user data');
        return [];
      }
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Make sure to update the state
      setUsers(usersList);
      return usersList;
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please ensure you have proper permissions.');
      return [];
    }
  };

  const getUserBalance = async (userId) => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUser({
          id: userId,
          ...userData
        });
        
        // If user has no balances, initialize with DEFAULT_COINS
        if (!userData.balances || Object.keys(userData.balances).length === 0) {
          const initialBalances = {};
          Object.keys(DEFAULT_COINS).forEach(coin => {
            initialBalances[coin] = DEFAULT_COINS[coin].initialBalance;
          });
          
          // Update the user's document in Firebase with the initialized balances
          await updateDoc(doc(db, 'users', userId), {
            balances: initialBalances
          });
          
          setUserBalance(initialBalances);
        } else {
          setUserBalance(userData.balances || {});
        }
        
        setActiveTab('balances'); // Switch to the balances tab
      } else {
        setError('User not found');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setError('Failed to fetch user balance');
      setLoading(false);
    }
  };

  const updateUserBalance = async (userId, coin, amount) => {
    try {
      setLoading(true);
      
      // Convert amount to a number
      const numericAmount = parseFloat(amount);
      
      // Update the balance in Firestore
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedBalances = { ...userData.balances };
        updatedBalances[coin] = numericAmount;
        
        await updateDoc(userRef, {
          balances: updatedBalances
        });
        
        // Update local state
        setUserBalance(updatedBalances);
        setSuccess(`Successfully updated ${coin} balance to ${numericAmount}`);
        
        // Refresh users list to show updated data
        await fetchUsers();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating balance:', error);
      setError('Failed to update balance');
      setLoading(false);
    }
  };

  const fetchDexScreenerData = async (address, chain) => {
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const pairs = response.data.pairs;
      if (pairs && pairs.length > 0) {
        // Get the most liquid pair
        const mainPair = pairs[0];
        setDexData({
          price: mainPair.priceUsd,
          volume24h: mainPair.volume.h24,
          liquidity: mainPair.liquidity.usd,
          pairAddress: mainPair.pairAddress,
          dexId: mainPair.dexId
        });
        
        // Auto-fill some fields
        setNewCoin(prev => ({
          ...prev,
          symbol: mainPair.baseToken.symbol,
          name: mainPair.baseToken.name,
          price: mainPair.priceUsd
        }));
      }
    } catch (error) {
      console.error('Error fetching DEX data:', error);
      setError('Failed to fetch DEX data');
    }
  };

  const handleAddCoin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const isAdmin = await checkAdminAccess();
      if (!isAdmin) {
        setError('You do not have admin privileges');
        return;
      }

      // Clean up the symbol for trading
      const cleanSymbol = newCoin.symbol.replace(/[^A-Z0-9]/g, '').toUpperCase();

      const coinData = {
        ...newCoin,
        symbol: cleanSymbol,
        type: newCoin.type,
        addedAt: new Date(),
        addedBy: currentUser.uid,
        status: 'active'
      };

      if (newCoin.type === 'dex' && dexData) {
        // Store the exact data structure we need for trading
        coinData.contractAddress = newCoin.contractAddress;
        coinData.dexData = {
          ...dexData,
          pairAddress: dexData.pairAddress.toLowerCase(),
          dexId: dexData.dexId.toLowerCase(),
          baseToken: {
            symbol: cleanSymbol,
            name: newCoin.name,
            address: newCoin.contractAddress.toLowerCase()
          }
        };
      }

      await addDoc(collection(db, 'coins'), coinData);

      setNewCoin({
        symbol: '',
        name: '',
        icon: '',
        description: '',
        contractAddress: '',
        chain: 'ethereum',
        baseAsset: '',
        quoteAsset: 'USDT',
        type: 'cex'
      });
      setDexData(null);
      setSuccess('Coin added successfully!');
      await fetchCoins();
      await calculateStats();
    } catch (error) {
      console.error('Error adding coin:', error);
      setError(error.message || 'Failed to add coin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoin = async (coinId) => {
    if (window.confirm('Are you sure you want to delete this coin?')) {
      try {
        setLoading(true);
        
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) {
          setError('You do not have admin privileges');
          return;
        }

        await deleteDoc(doc(db, 'coins', coinId));
        
        setSuccess('Coin deleted successfully!');
        await fetchCoins();
        await calculateStats();
      } catch (error) {
        console.error('Error deleting coin:', error);
        setError(error.message || 'Failed to delete coin');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const renderDashboard = () => (
    <AdminContainer>
      <AdminHeader>
        <Title>Admin Dashboard</Title>
      </AdminHeader>
      
      <StatsGrid>
        <StatCard>
          <StatIcon><i className="fa fa-users"></i></StatIcon>
          <StatValue>{stats.totalUsers}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><i className="fa fa-coins"></i></StatIcon>
          <StatValue>{stats.totalCoins}</StatValue>
          <StatLabel>Available Coins</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon><i className="fa fa-user-check"></i></StatIcon>
          <StatValue>{stats.activeUsers}</StatValue>
          <StatLabel>Active Users (7 days)</StatLabel>
        </StatCard>
      </StatsGrid>
      
      <AdminCard>
        <Title>Recent Activity</Title>
        <p>Welcome to the admin dashboard. Use the sidebar to navigate to different sections.</p>
      </AdminCard>
    </AdminContainer>
  );
  
  const renderCoinManagement = () => (
    <AdminContainer>
      <AdminHeader>
        <Title>Coin Management</Title>
      </AdminHeader>
      
      <TabsContainer>
        <TabButtons>
          <TabButton 
            active={(activeTab === 'addCoin').toString()} 
            onClick={() => setActiveTab('addCoin')}
          >
            Add New Coin
          </TabButton>
          <TabButton 
            active={(activeTab === 'coinList').toString()} 
            onClick={() => setActiveTab('coinList')}
          >
            Coin List
          </TabButton>
        </TabButtons>
        
        {activeTab === 'addCoin' && (
          <AdminCard>
            {error && <div style={{ color: 'var(--error)', marginBottom: '15px', padding: '10px', background: 'rgba(246, 70, 93, 0.1)', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ color: '#0ECB81', marginBottom: '15px', padding: '10px', background: 'rgba(14, 203, 129, 0.1)', borderRadius: '4px' }}>{success}</div>}
            
            <Form onSubmit={handleAddCoin}>
              <Select
                value={newCoin.type}
                onChange={(e) => setNewCoin({ ...newCoin, type: e.target.value })}
              >
                <option value="cex">CEX Token</option>
                <option value="dex">DEX Token</option>
              </Select>

              {newCoin.type === 'dex' && (
                <>
                  <Select
                    value={newCoin.chain}
                    onChange={(e) => setNewCoin({ ...newCoin, chain: e.target.value })}
                  >
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </Select>

                  <Input
                    type="text"
                    placeholder="Contract Address"
                    value={newCoin.contractAddress}
                    onChange={(e) => {
                      const address = e.target.value;
                      setNewCoin({ ...newCoin, contractAddress: address });
                      if (address.length >= 42) {
                        fetchDexScreenerData(address, newCoin.chain);
                      }
                    }}
                    required
                  />

                  {dexData && (
                    <InfoBox>
                      <p><strong>Price:</strong> ${dexData.price}</p>
                      <p><strong>24h Volume:</strong> ${dexData.volume24h}</p>
                      <p><strong>Liquidity:</strong> ${dexData.liquidity}</p>
                      <p><strong>DEX:</strong> {dexData.dexId}</p>
                    </InfoBox>
                  )}
                </>
              )}

              <Input
                type="text"
                placeholder="Symbol (e.g., BTC)"
                value={newCoin.symbol}
                onChange={(e) => setNewCoin({ ...newCoin, symbol: e.target.value.toUpperCase() })}
                required
              />
              
              <Input
                type="text"
                placeholder="Name (e.g., Bitcoin)"
                value={newCoin.name}
                onChange={(e) => setNewCoin({ ...newCoin, name: e.target.value })}
                required
              />
              
              <Input
                type="url"
                placeholder="Icon URL"
                value={newCoin.icon}
                onChange={(e) => setNewCoin({ ...newCoin, icon: e.target.value })}
                required
              />
              
              <TextArea
                placeholder="Description"
                value={newCoin.description}
                onChange={(e) => setNewCoin({ ...newCoin, description: e.target.value })}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Coin'}
              </Button>
            </Form>
          </AdminCard>
        )}
        
        {activeTab === 'coinList' && (
          <AdminCard>
            {error && <div style={{ color: 'var(--error)', marginBottom: '15px', padding: '10px', background: 'rgba(246, 70, 93, 0.1)', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ color: '#0ECB81', marginBottom: '15px', padding: '10px', background: 'rgba(14, 203, 129, 0.1)', borderRadius: '4px' }}>{success}</div>}
            
            <CoinList>
              {coins.length === 0 ? (
                <p>No coins available. Add your first coin!</p>
              ) : (
                coins.map(coin => (
                  <CoinItem key={coin.id}>
                    <CoinInfo>
                      <CoinLogo src={coin.icon} alt={coin.name} />
                      <CoinDetails>
                        <CoinSymbol>{coin.symbol}</CoinSymbol>
                        <CoinName>{coin.name}</CoinName>
                      </CoinDetails>
                    </CoinInfo>
                    <ButtonGroup>
                      <DeleteButton onClick={() => handleDeleteCoin(coin.id)}>
                        Delete
                      </DeleteButton>
                    </ButtonGroup>
                  </CoinItem>
                ))
              )}
            </CoinList>
          </AdminCard>
        )}
      </TabsContainer>
    </AdminContainer>
  );
  
  const renderUserManagement = () => (
    <AdminContainer>
      <AdminHeader>
        <Title>User Management</Title>
      </AdminHeader>
      
      <TabsContainer>
        <TabButtons>
          <TabButton 
            active={(activeTab === 'userList').toString()} 
            onClick={() => setActiveTab('userList')}
          >
            User List
          </TabButton>
          <TabButton 
            active={(activeTab === 'balances').toString()} 
            onClick={() => setActiveTab('balances')}
          >
            User Balances
          </TabButton>
        </TabButtons>
        
        {activeTab === 'userList' && (
          <AdminCard>
            {error && <div style={{ color: 'var(--error)', marginBottom: '15px', padding: '10px', background: 'rgba(246, 70, 93, 0.1)', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ color: '#0ECB81', marginBottom: '15px', padding: '10px', background: 'rgba(14, 203, 129, 0.1)', borderRadius: '4px' }}>{success}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Total Users: {users.length}</h3>
              <Link to="/admin/users">
                <Button>
                  Advanced User Management
                </Button>
              </Link>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--line)' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--line)' }}>User ID</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--line)' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--line)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No users found</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>{user.email}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)', fontSize: '12px' }}>{user.id}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>{user.role || 'user'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>
                        <ButtonGroup>
                          <Button onClick={() => getUserBalance(user.id)}>
                            Manage Balances
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminCard>
        )}
        
        {activeTab === 'balances' && (
          <AdminCard>
            {error && <div style={{ color: 'var(--error)', marginBottom: '15px', padding: '10px', background: 'rgba(246, 70, 93, 0.1)', borderRadius: '4px' }}>{error}</div>}
            {success && <div style={{ color: '#0ECB81', marginBottom: '15px', padding: '10px', background: 'rgba(14, 203, 129, 0.1)', borderRadius: '4px' }}>{success}</div>}
            
            <Link to="/admin/balances">
              <Button style={{ marginBottom: '20px' }}>
                Go to Balance Management Dashboard
              </Button>
            </Link>
            
            <Select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const userId = e.target.value;
                if (userId) {
                  getUserBalance(userId);
                } else {
                  setSelectedUser(null);
                  setUserBalance({});
                }
              }}
              style={{ marginBottom: '20px' }}
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </Select>
            
            {selectedUser && (
              <>
                <InfoBox>
                  <p><strong>User:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role || 'user'}</p>
                </InfoBox>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--line)' }}>Coin</th>
                      <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--line)' }}>Balance</th>
                      <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid var(--line)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(userBalance).length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>
                          No balances found for this user. Initializing default coins...
                        </td>
                      </tr>
                    ) : (
                      Object.entries(userBalance).map(([coin, balance]) => (
                        <tr key={coin}>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--line)' }}>{coin}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--line)', textAlign: 'right' }}>{balance}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--line)', textAlign: 'center' }}>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const amount = e.target.elements.amount.value;
                                updateUserBalance(selectedUser.id, coin, amount);
                              }}
                              style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}
                            >
                              <Input
                                type="number"
                                name="amount"
                                placeholder="New Balance"
                                defaultValue={balance}
                                step="0.00000001"
                                style={{ width: '150px' }}
                              />
                              <Button type="submit" disabled={loading}>
                                Update
                              </Button>
                            </form>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </AdminCard>
        )}
      </TabsContainer>
    </AdminContainer>
  );

  return (
    <AdminLayout>
      <Sidebar>
        <Logo>Admin Panel</Logo>
        <NavMenu>
          <NavItem>
            <NavLink 
              to="#" 
              active={(activeTab === 'dashboard').toString()} 
              onClick={() => setActiveTab('dashboard')}
            >
              <i className="fa fa-tachometer-alt"></i> Dashboard
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink 
              to="#" 
              active={(activeTab === 'users' || activeTab === 'userList' || activeTab === 'balances').toString()} 
              onClick={() => setActiveTab('userList')}
            >
              <i className="fa fa-users"></i> Users & Balances
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink 
              to="#" 
              active={(activeTab === 'coins' || activeTab === 'addCoin' || activeTab === 'coinList').toString()} 
              onClick={() => setActiveTab('addCoin')}
            >
              <i className="fa fa-coins"></i> Coin Management
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin">
              <i className="fa fa-th-large"></i> Advanced Dashboard
            </NavLink>
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <MainContent>
        {activeTab === 'dashboard' && renderDashboard()}
        {(activeTab === 'addCoin' || activeTab === 'coinList') && renderCoinManagement()}
        {(activeTab === 'userList' || activeTab === 'balances') && renderUserManagement()}
      </MainContent>
    </AdminLayout>
  );
}

export default AdminPanel; 