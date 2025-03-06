import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

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

const LogoPreview = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #1E1E2D;
    padding: 5px;
    object-fit: contain;
  }
`;

const CategoryBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(255, 114, 90, 0.1);
  color: #ff725a;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #161b22;
  border-radius: 10px;
  padding: 25px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    margin: 0;
    color: #e6edf3;
    font-size: 18px;
  }
  
  button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 20px;
    cursor: pointer;
    
    &:hover {
      color: #ff725a;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const StatusToggle = styled.span`
  color: ${props => props.isActive ? '#4cd964' : '#ff3b30'};
  background: ${props => props.isActive ? 'rgba(76, 217, 100, 0.1)' : 'rgba(255, 59, 48, 0.1)'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Predefined coin categories
const COIN_CATEGORIES = [
  { id: 'popular', name: 'Popular' },
  { id: 'recently_added', name: 'Recently Added' },
  { id: 'trending', name: 'Trending' },
  { id: 'memes', name: 'Memes' },
  { id: 'defi', name: 'DeFi' },
  { id: 'stablecoin', name: 'Stablecoin' },
  { id: 'layer1', name: 'Layer 1' },
  { id: 'layer2', name: 'Layer 2' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'ai', name: 'AI' },
  { id: 'metaverse', name: 'Metaverse' },
  { id: 'privacy', name: 'Privacy' },
  { id: 'other', name: 'Other' }
];

function CoinManagement() {
  const navigate = useNavigate();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  
  // For creating new coins
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'cex', // cex or dex
    chainId: 'ethereum',
    address: '',
    isActive: true,
    logoUrl: '',
    category: 'popular'
  });
  
  // For editing existing coins
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    symbol: '',
    type: 'cex',
    chainId: 'ethereum',
    address: '',
    isActive: true,
    logoUrl: '',
    category: 'popular',
    icon: '' // For backward compatibility
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
          ...data,
          // Normalize data between old and new formats
          logoUrl: data.logoUrl || data.icon || '',
          isActive: data.isActive === undefined ? (data.status === 'active') : data.isActive
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
  
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Update logo preview if editing logo URL
    if (name === 'logoUrl' || name === 'icon') {
      setLogoPreview(value);
    }
  };
  
  const handleLogoChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      logoUrl: url
    }));
    setLogoPreview(url);
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
        logoUrl: formData.logoUrl || null,
        icon: formData.logoUrl || null, // For backward compatibility
        category: formData.category
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
        logoUrl: '',
        category: 'popular'
      });
      setLogoPreview('');
      
      // Refresh coins list
      fetchCoins();
      
    } catch (error) {
      console.error('Error adding coin:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!editingCoin) {
        throw new Error('No coin selected for editing');
      }
      
      // Validate edit form data
      if (!editFormData.name || !editFormData.symbol) {
        throw new Error('Name and symbol are required');
      }
      
      // Create update data
      const updateData = {
        name: editFormData.name,
        symbol: editFormData.symbol.toUpperCase(),
        type: editFormData.type,
        isActive: editFormData.isActive,
        status: editFormData.isActive ? 'active' : 'inactive', // For backward compatibility
        logoUrl: editFormData.logoUrl || null,
        icon: editFormData.logoUrl || null, // For backward compatibility
        category: editFormData.category,
        updatedAt: serverTimestamp()
      };
      
      // Add chain-specific data for DEX tokens
      if (editFormData.type === 'dex') {
        updateData.chainId = editFormData.chainId;
        updateData.address = editFormData.address;
      }
      
      // Update in Firestore
      const coinRef = doc(db, 'coins', editingCoin.id);
      await updateDoc(coinRef, updateData);
      
      // Show success message
      setSuccess(`Coin ${editFormData.symbol.toUpperCase()} updated successfully!`);
      
      // Close modal and refresh
      setEditModalOpen(false);
      fetchCoins();
      
    } catch (error) {
      console.error('Error updating coin:', error);
      setError(`Failed to update coin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCoinStatus = async (coinId, currentStatus) => {
    try {
      setLoading(true);
      setError('');
      console.log('Toggling status for coin:', coinId, 'Current status:', currentStatus);
      
      const coinRef = doc(db, 'coins', coinId);
      
      // Update both isActive and status fields for compatibility
      await updateDoc(coinRef, {
        isActive: !currentStatus,
        status: !currentStatus ? 'active' : 'inactive', // For backward compatibility
        updatedAt: serverTimestamp()
      });
      
      // Update the UI
      setCoins(prevCoins => prevCoins.map(coin => 
        coin.id === coinId ? {...coin, isActive: !currentStatus} : coin
      ));
      
      setSuccess(`Coin status updated successfully!`);
    } catch (error) {
      console.error('Error updating coin status:', error);
      setError(`Failed to update coin status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCoin = async (coinId, symbol) => {
    if (window.confirm(`Are you sure you want to delete ${symbol}?`)) {
      try {
        setLoading(true);
        
        // Delete the coin
        const coinRef = doc(db, 'coins', coinId);
        await deleteDoc(coinRef);
        
        // Update UI
        setCoins(prevCoins => prevCoins.filter(c => c.id !== coinId));
        setSuccess(`${symbol} deleted successfully!`);
      } catch (error) {
        console.error('Error deleting coin:', error);
        setError(`Failed to delete coin: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const openEditModal = async (coin) => {
    try {
      setLoading(true);
      console.log('Opening edit modal for coin:', coin);
      
      // Get the latest data for this coin
      const coinRef = doc(db, 'coins', coin.id);
      const coinSnap = await getDoc(coinRef);
      
      if (!coinSnap.exists()) {
        throw new Error(`Coin with ID ${coin.id} not found`);
      }
      
      const coinData = coinSnap.data();
      
      // Set editing coin
      setEditingCoin({ id: coin.id, ...coinData });
      
      // Populate edit form
      setEditFormData({
        name: coinData.name || '',
        symbol: coinData.symbol || '',
        type: coinData.type || 'cex',
        chainId: coinData.chainId || 'ethereum',
        address: coinData.address || '',
        isActive: coinData.isActive === undefined ? (coinData.status === 'active') : coinData.isActive,
        logoUrl: coinData.logoUrl || coinData.icon || '',
        icon: coinData.icon || coinData.logoUrl || '', // For backward compatibility
        category: coinData.category || 'other'
      });
      
      // Set logo preview
      setLogoPreview(coinData.logoUrl || coinData.icon || '');
      
      // Open modal
      setEditModalOpen(true);
    } catch (error) {
      console.error('Error opening edit modal:', error);
      setError(`Failed to open edit form: ${error.message}`);
    } finally {
      setLoading(false);
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
          {console.log("Rendering coin form with data:", formData)}
          {console.log("Categories available:", COIN_CATEGORIES)}
          
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
          
          <FormGroup style={{ display: 'block', marginBottom: '15px' }}>
            <Label>Category</Label>
            <Select 
              name="category" 
              value={formData.category}
              onChange={handleChange}
              style={{ width: '100%' }}
            >
              {COIN_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
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
            {logoPreview && (
              <LogoPreview>
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/40?text=' + formData.symbol.charAt(0);
                    setError('Invalid logo URL or image not accessible. Please check the URL.');
                  }}
                />
                <span>Logo Preview</span>
              </LogoPreview>
            )}
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
              <th>Category</th>
              <th>Chain</th>
              <th>Logo</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && coins.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', borderTopColor: '#ff725a', animation: 'spin 1s linear infinite' }}></div>
                    Loading coins...
                  </div>
                </td>
              </tr>
            ) : coins.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px 0' }}>
                  No coins found. Create your first coin above.
                </td>
              </tr>
            ) : (
              coins.map(coin => (
                <tr key={coin.id}>
                  <td>{coin.symbol}</td>
                  <td>{coin.name}</td>
                  <td>{coin.type === 'dex' ? 'Decentralized' : 'Centralized'}</td>
                  <td>
                    <CategoryBadge>
                      {COIN_CATEGORIES.find(cat => cat.id === coin.category)?.name || 'Other'}
                    </CategoryBadge>
                  </td>
                  <td>{coin.type === 'dex' ? coin.chainId : 'N/A'}</td>
                  <td>
                    <img 
                      src={coin.logoUrl || coin.icon || `https://via.placeholder.com/30?text=${coin.symbol.charAt(0)}`}
                      alt={coin.symbol}
                      style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'contain', background: '#1E1E2D', padding: '3px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/30?text=${coin.symbol.charAt(0)}`;
                      }}
                    />
                  </td>
                  <td>
                    <StatusToggle 
                      isActive={coin.isActive || coin.status === 'active'}
                      onClick={() => toggleCoinStatus(coin.id, coin.isActive || coin.status === 'active')}
                    >
                      {coin.isActive || coin.status === 'active' ? 'Active' : 'Inactive'}
                    </StatusToggle>
                  </td>
                  <td>
                    <Button 
                      style={{ padding: '6px 10px', fontSize: '12px', marginRight: '5px' }}
                      onClick={() => openEditModal(coin)}
                      type="button"
                    >
                      <FaEdit /> Edit
                    </Button>
                    <Button 
                      style={{ 
                        padding: '6px 10px', 
                        fontSize: '12px',
                        background: 'rgba(255, 59, 48, 0.15)',
                        color: '#ff3b30',
                        borderColor: 'rgba(255, 59, 48, 0.3)'
                      }}
                      onClick={() => handleDeleteCoin(coin.id, coin.symbol)}
                      type="button"
                    >
                      <FaTrash /> Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </CoinsTable>
      </Card>
      
      {/* Edit Modal */}
      {editModalOpen && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h3>Edit {editFormData.name} ({editFormData.symbol})</h3>
              <button onClick={() => {
                setEditModalOpen(false);
                setEditingCoin(null);
              }}>×</button>
            </ModalHeader>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <Form onSubmit={handleEditSubmit}>
              <FormGroup>
                <Label>Coin Type</Label>
                <Select 
                  name="type" 
                  value={editFormData.type}
                  onChange={handleEditChange}
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
                  value={editFormData.name}
                  onChange={handleEditChange}
                  placeholder="e.g. Bitcoin"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Coin Symbol</Label>
                <Input 
                  type="text" 
                  name="symbol" 
                  value={editFormData.symbol}
                  onChange={handleEditChange}
                  placeholder="e.g. BTC"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Category</Label>
                <Select 
                  name="category" 
                  value={editFormData.category}
                  onChange={handleEditChange}
                >
                  {COIN_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Logo URL</Label>
                <Input 
                  type="text" 
                  name="logoUrl" 
                  value={editFormData.logoUrl}
                  onChange={handleEditChange}
                  placeholder="e.g. https://example.com/btc-logo.png"
                />
                {logoPreview && (
                  <LogoPreview>
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/40?text=' + editFormData.symbol.charAt(0);
                        setError('Invalid logo URL or image not accessible. Please check the URL.');
                      }}
                    />
                    <span>Logo Preview</span>
                  </LogoPreview>
                )}
              </FormGroup>
              
              {editFormData.type === 'dex' && (
                <>
                  <FormGroup>
                    <Label>Blockchain (for DEX tokens)</Label>
                    <Select 
                      name="chainId" 
                      value={editFormData.chainId}
                      onChange={handleEditChange}
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
                      value={editFormData.address}
                      onChange={handleEditChange}
                      placeholder="e.g. 0x..."
                    />
                  </FormGroup>
                </>
              )}
              
              <FormGroup>
                <Label>Status</Label>
                <Select 
                  name="isActive" 
                  value={editFormData.isActive}
                  onChange={(e) => {
                    setEditFormData(prev => ({
                      ...prev,
                      isActive: e.target.value === 'true'
                    }));
                  }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </FormGroup>
              
              <ButtonGroup>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingCoin(null);
                  }}
                  style={{ 
                    background: 'rgba(255, 59, 48, 0.15)',
                    color: '#ff3b30',
                    borderColor: 'rgba(255, 59, 48, 0.3)'
                  }}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default CoinManagement; 