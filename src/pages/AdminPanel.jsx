import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import styled from 'styled-components';
import axios from 'axios';

const AdminContainer = styled.div`
  padding: 20px;
  margin-top: 80px;
  background: var(--bg1);
  min-height: 100vh;
`;

const AdminCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg1);
  color: var(--text);
`;

const Button = styled.button`
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CoinList = styled.div`
  margin-top: 20px;
  display: grid;
  gap: 10px;
`;

const CoinItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--bg2);
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg1);
  color: var(--text);
  width: 100%;
`;

function AdminPanel() {
  const [coins, setCoins] = useState([]);
  const [newCoin, setNewCoin] = useState({
    symbol: '',
    name: '',
    icon: '',
    description: '',
    contractAddress: '',
    chain: 'ethereum', // default chain
    baseAsset: '',
    quoteAsset: 'USDT',
    type: 'cex' // 'cex' or 'dex'
  });
  
  const [dexData, setDexData] = useState(null);
  const [error, setError] = useState('');
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
        await fetchCoins();
      }
    };
    init();
  }, [currentUser, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
          pairAddress: dexData.pairAddress.toLowerCase(), // Ensure lowercase
          dexId: dexData.dexId.toLowerCase(), // Ensure lowercase
          baseToken: {
            symbol: cleanSymbol,
            name: newCoin.name,
            address: newCoin.contractAddress.toLowerCase() // Ensure lowercase
          }
        };
      }

      console.log('Adding coin:', coinData);
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
      
      await fetchCoins();
      setError('');
    } catch (error) {
      console.error('Error adding coin:', error);
      setError(error.message || 'Failed to add coin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (coinId) => {
    if (window.confirm('Are you sure you want to delete this coin?')) {
      try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) {
          setError('You do not have admin privileges');
          return;
        }

        await deleteDoc(doc(db, 'coins', coinId));
        await fetchCoins();
        setError('');
      } catch (error) {
        console.error('Error deleting coin:', error);
        setError(error.message || 'Failed to delete coin');
      }
    }
  };

  return (
    <AdminContainer>
      <AdminCard>
        <h2>Add New Coin</h2>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <Form onSubmit={handleSubmit}>
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
                  if (address.length >= 42) { // Valid address length
                    fetchDexScreenerData(address, newCoin.chain);
                  }
                }}
                required
              />

              {dexData && (
                <div style={{ margin: '10px 0', padding: '10px', background: 'var(--bg1)' }}>
                  <p>Price: ${dexData.price}</p>
                  <p>24h Volume: ${dexData.volume24h}</p>
                  <p>Liquidity: ${dexData.liquidity}</p>
                  <p>DEX: {dexData.dexId}</p>
                </div>
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
          <Input
            type="text"
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

      <AdminCard>
        <h2>Existing Coins</h2>
        <CoinList>
          {coins.map(coin => (
            <CoinItem key={coin.id}>
              <div>
                <img src={coin.icon} alt={coin.name} style={{ width: 24, height: 24, marginRight: 10 }} />
                <strong>{coin.symbol}</strong> - {coin.name}
              </div>
              <Button onClick={() => handleDelete(coin.id)} style={{ background: 'var(--error)' }}>
                Delete
              </Button>
            </CoinItem>
          ))}
        </CoinList>
      </AdminCard>
    </AdminContainer>
  );
}

export default AdminPanel; 