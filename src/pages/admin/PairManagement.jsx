import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Container = styled.div`
  display: grid;
  gap: 30px;
`;

const Card = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 10px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #e6edf3;
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  
  i {
    color: #ff725a;
    font-size: 18px;
  }
`;

const CoinsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  th {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    font-size: 14px;
  }
  
  td {
    color: #e6edf3;
    font-size: 14px;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const Form = styled.form`
  display: grid;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const Input = styled.input`
  background: rgba(30, 35, 44, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #ff725a;
  }
`;

const Select = styled.select`
  background: rgba(30, 35, 44, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 12px) center;
  padding-right: 30px;
  
  &:focus {
    outline: none;
    border-color: #ff725a;
  }
`;

const Button = styled.button`
  background: rgba(255, 114, 90, 0.15);
  color: #ff725a;
  border: 1px solid rgba(255, 114, 90, 0.3);
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  
  &:hover {
    background: rgba(255, 114, 90, 0.25);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  i {
    font-size: 16px;
  }
`;

const ErrorMessage = styled.div`
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  color: #4cd964;
  background: rgba(76, 217, 100, 0.1);
  border: 1px solid rgba(76, 217, 100, 0.2);
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
`;

function CoinManagement() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'cex', // cex or dex
    chainId: 'ethereum',
    address: '',
    isActive: true,
    logoUrl: ''
  });
  
  useEffect(() => {
    fetchCoins();
  }, []);
  
  const fetchCoins = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching coins...');
      
      const coinsCollection = collection(db, 'coins');
      const coinsSnapshot = await getDocs(coinsCollection);
      
      if (coinsSnapshot.empty) {
        console.log('No coins found in database');
      } else {
        console.log(`Found ${coinsSnapshot.docs.length} coins`);
      }
      
      const coinsList = coinsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Coin data for ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      setCoins(coinsList);
    } catch (error) {
      console.error('Error fetching coins:', error);
      setError(`Failed to load coins: ${error.message}. Try refreshing the page.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleLogoChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      logoUrl: url
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate the form data
      if (!formData.name || !formData.symbol) {
        throw new Error('Name and symbol are required');
      }
      
      if (formData.type === 'dex' && !formData.address) {
        throw new Error('Contract address is required for DEX tokens');
      }
      
      // Create the coin data
      const coinData = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        createdAt: serverTimestamp(),
        isActive: true,
        logoUrl: formData.logoUrl || null
      };
      
      // Add chain-specific data for DEX tokens
      if (formData.type === 'dex') {
        coinData.chainId = formData.chainId;
        coinData.address = formData.address;
      }
      
      // Add to Firestore
      await addDoc(collection(db, 'coins'), coinData);
      
      // Show success message
      setSuccess(`Coin ${formData.symbol.toUpperCase()} created successfully!`);
      
      // Clear form
      setFormData({
        name: '',
        symbol: '',
        type: 'cex',
        chainId: 'ethereum',
        address: '',
        isActive: true,
        logoUrl: ''
      });
      
      // Refresh coins list
      fetchCoins();
      
    } catch (error) {
      console.error('Error adding coin:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCoinStatus = async (coinId, currentStatus) => {
    try {
      const coinRef = doc(db, 'coins', coinId);
      await updateDoc(coinRef, {
        isActive: !currentStatus
      });
      
      // Update the UI
      setCoins(prevCoins => prevCoins.map(coin => 
        coin.id === coinId ? {...coin, isActive: !currentStatus} : coin
      ));
      
      setSuccess(`Coin status updated successfully!`);
    } catch (error) {
      console.error('Error updating coin status:', error);
      setError(`Failed to update coin status: ${error.message}`);
    }
  };
  
  return (
    <Container>
      <Card>
        <SectionTitle>
          <i className="bi bi-coin"></i> Manage Coins
        </SectionTitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Coin Type</Label>
            <Select 
              name="type" 
              value={formData.type}
              onChange={handleChange}
            >
              <option value="cex">Centralized Exchange (CEX)</option>
              <option value="dex">Decentralized Exchange (DEX)</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Coin Name</Label>
            <Input 
              type="text" 
              name="name" 
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Bitcoin"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Coin Symbol</Label>
            <Input 
              type="text" 
              name="symbol" 
              value={formData.symbol}
              onChange={handleChange}
              placeholder="e.g. BTC"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Logo URL</Label>
            <Input 
              type="text" 
              name="logoUrl" 
              value={formData.logoUrl}
              onChange={handleLogoChange}
              placeholder="e.g. https://example.com/btc-logo.png"
            />
          </FormGroup>
          
          {formData.type === 'dex' && (
            <>
              <FormGroup>
                <Label>Blockchain (for DEX tokens)</Label>
                <Select 
                  name="chainId" 
                  value={formData.chainId}
                  onChange={handleChange}
                >
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="bsc">Binance Smart Chain (BSC)</option>
                  <option value="polygon">Polygon (MATIC)</option>
                  <option value="avalanche">Avalanche (AVAX)</option>
                  <option value="arbitrum">Arbitrum (ARB)</option>
                  <option value="solana">Solana (SOL)</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Contract Address</Label>
                <Input 
                  type="text" 
                  name="address" 
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 0x..."
                />
              </FormGroup>
              
              {formData.chainId === 'solana' && (
                <div style={{ 
                  padding: '10px', 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: '#FFC107'
                }}>
                  <strong>Note:</strong> For Solana tokens, ensure you use the correct program address format.
                </div>
              )}
            </>
          )}
          
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i> Creating...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle"></i> Add Coin
              </>
            )}
          </Button>
        </Form>
      </Card>
      
      <Card>
        <SectionTitle>
          <i className="bi bi-list"></i> Existing Coins
        </SectionTitle>
        
        <CoinsTable>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Type</th>
              <th>Chain</th>
              <th>Logo</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', borderTopColor: '#ff725a', animation: 'spin 1s linear infinite' }}></div>
                    Loading coins...
                  </div>
                </td>
              </tr>
            ) : coins.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px 0' }}>
                  No coins found. Create your first coin above.
                </td>
              </tr>
            ) : (
              coins.map(coin => (
                <tr key={coin.id}>
                  <td>{coin.symbol}</td>
                  <td>{coin.name}</td>
                  <td>{coin.type === 'cex' ? 'Centralized' : 'Decentralized'}</td>
                  <td>{coin.type === 'dex' ? coin.chainId : 'N/A'}</td>
                  <td>
                    {coin.logoUrl ? (
                      <img 
                        src={coin.logoUrl} 
                        alt={coin.symbol}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/30?text=' + coin.symbol.charAt(0);
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '50%', 
                        background: '#30363d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e6edf3',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {coin.symbol.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span 
                      style={{ 
                        color: coin.isActive ? '#4cd964' : '#ff3b30',
                        background: coin.isActive ? 'rgba(76, 217, 100, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleCoinStatus(coin.id, coin.isActive)}
                    >
                      {coin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Button 
                      style={{ padding: '6px 10px', fontSize: '12px', marginRight: '5px' }}
                      onClick={() => {
                        // In a real application, you would implement edit functionality
                        alert('Edit functionality would go here');
                      }}
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </Button>
                    <Button 
                      style={{ 
                        padding: '6px 10px', 
                        fontSize: '12px',
                        background: 'rgba(255, 59, 48, 0.15)',
                        color: '#ff3b30',
                        borderColor: 'rgba(255, 59, 48, 0.3)'
                      }}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${coin.symbol}?`)) {
                          // Delete the coin
                          const coinRef = doc(db, 'coins', coin.id);
                          deleteDoc(coinRef)
                            .then(() => {
                              setCoins(prevCoins => prevCoins.filter(c => c.id !== coin.id));
                              setSuccess(`${coin.symbol} deleted successfully!`);
                            })
                            .catch(error => {
                              console.error('Error deleting coin:', error);
                              setError(`Failed to delete coin: ${error.message}`);
                            });
                        }
                      }}
                    >
                      <i className="bi bi-trash"></i> Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </CoinsTable>
      </Card>
    </Container>
  );
}

export default CoinManagement; 