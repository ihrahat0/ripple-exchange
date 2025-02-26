import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

const Container = styled.div`
  background: var(--bg1);
  border-radius: 8px;
  padding: 20px;
`;

const TokenGrid = styled.div`
  width: 100%;
  margin-top: 20px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
`;

const TokenTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  padding: 15px;
  text-align: left;
  background: var(--bg2);
  color: var(--text);
  font-weight: 500;
`;

const TableCell = styled.td`
  padding: 15px;
  border-top: 1px solid var(--line);
  color: var(--text);
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  background: ${props => props.danger ? 'var(--error)' : props.primary ? 'var(--primary)' : 'var(--bg2)'};
  color: white;
  cursor: pointer;
  margin-right: 10px;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg2);
  color: var(--text);
  width: 300px;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: var(--text);
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg2);
  color: var(--text);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg2);
  color: var(--text);
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const Button = styled.button`
  padding: 12px;
  border-radius: 4px;
  border: none;
  background: var(--primary);
  color: white;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error);
  padding: 10px;
  background: rgba(246, 70, 93, 0.1);
  border-radius: 4px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  color: #0ECB81;
  padding: 10px;
  background: rgba(14, 203, 129, 0.1);
  border-radius: 4px;
  margin-bottom: 20px;
`;

const TokensList = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const tokensQuery = searchTerm 
        ? query(
            collection(db, 'tokens'), 
            where('symbol', '>=', searchTerm.toUpperCase()),
            where('symbol', '<=', searchTerm.toUpperCase() + '\uf8ff')
          )
        : collection(db, 'tokens');
      
      const snapshot = await getDocs(tokensQuery);
      
      const tokensData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTokens(tokensData);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTokens();
  };

  const handleDelete = async (tokenId) => {
    if (window.confirm('Are you sure you want to delete this token? This may affect trading pairs.')) {
      try {
        await deleteDoc(doc(db, 'tokens', tokenId));
        // Remove from local state
        setTokens(tokens.filter(token => token.id !== tokenId));
      } catch (error) {
        console.error('Error deleting token:', error);
        alert('Failed to delete token');
      }
    }
  };

  return (
    <Container>
      <FilterBar>
        <form onSubmit={handleSearch}>
          <SearchInput 
            type="text" 
            placeholder="Search by symbol" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </form>
        <ActionButton primary onClick={() => navigate('/admin/tokens/add')}>
          Add New Token
        </ActionButton>
      </FilterBar>
      
      <TokenGrid>
        <TokenTable>
          <thead>
            <tr>
              <TableHeader>Symbol</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Chain</TableHeader>
              <TableHeader>Address</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <TableCell colSpan="6" style={{textAlign: 'center'}}>Loading...</TableCell>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <TableCell colSpan="6" style={{textAlign: 'center'}}>No tokens found</TableCell>
              </tr>
            ) : (
              tokens.map(token => (
                <tr key={token.id}>
                  <TableCell>{token.symbol}</TableCell>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>{token.type === 'dex' ? 'DEX' : 'CEX'}</TableCell>
                  <TableCell>{token.chainId || 'N/A'}</TableCell>
                  <TableCell>
                    {token.address ? (
                      <div style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {token.address}
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <ActionButton primary onClick={() => navigate(`/admin/tokens/edit/${token.id}`)}>
                      Edit
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDelete(token.id)}>
                      Delete
                    </ActionButton>
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </TokenTable>
      </TokenGrid>
    </Container>
  );
};

const AddToken = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use more detailed form data with chainId
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'cex',
    chainId: 'ethereum',
    address: '',
    decimals: 18,
    logoUrl: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Validate the form data
      if (!formData.name || !formData.symbol) {
        throw new Error('Name and symbol are required');
      }
      
      if (formData.type === 'dex' && !formData.address) {
        throw new Error('Token address is required for DEX tokens');
      }
      
      // Check if token with this symbol already exists
      const tokenQuery = query(collection(db, 'tokens'), where('symbol', '==', formData.symbol.toUpperCase()));
      const existingTokens = await getDocs(tokenQuery);
      
      if (!existingTokens.empty) {
        throw new Error(`Token with symbol ${formData.symbol.toUpperCase()} already exists`);
      }
      
      // Create the token document in Firestore
      const tokenData = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        logoUrl: formData.logoUrl || null,
        decimals: parseInt(formData.decimals) || 18
      };
      
      // Add chain-specific data for DEX tokens
      if (formData.type === 'dex') {
        tokenData.chainId = formData.chainId;
        tokenData.address = formData.address;
      }
      
      await addDoc(collection(db, 'tokens'), tokenData);
      
      setSuccess(`Token ${formData.symbol.toUpperCase()} added successfully`);
      
      // Clear the form after success
      setFormData({
        name: '',
        symbol: '',
        type: 'cex',
        chainId: 'ethereum',
        address: '',
        decimals: 18,
        logoUrl: ''
      });
    } catch (error) {
      console.error('Error adding token:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ActionButton onClick={() => navigate('/admin/tokens')}>
        ← Back to Tokens
      </ActionButton>
      
      <h2 style={{ color: 'var(--text)' }}>Add New Token</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Token Name</Label>
            <Input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              placeholder="Bitcoin"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Token Symbol</Label>
            <Input 
              type="text" 
              name="symbol" 
              value={formData.symbol} 
              onChange={handleChange}
              placeholder="BTC"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Token Type</Label>
            <Select 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
            >
              <option value="cex">CEX (Centralized Exchange)</option>
              <option value="dex">DEX (Decentralized Exchange)</option>
            </Select>
          </FormGroup>
          
          {formData.type === 'dex' && (
            <>
              <FormGroup>
                <Label>Blockchain</Label>
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
                <Label>Token Contract Address</Label>
                <Input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  placeholder="0x..."
                  required={formData.type === 'dex'}
                />
              </FormGroup>
            </>
          )}
          
          <FormGroup>
            <Label>Decimals</Label>
            <Input 
              type="number" 
              name="decimals" 
              value={formData.decimals} 
              onChange={handleChange}
              min="0"
              max="18"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Logo URL (optional)</Label>
            <Input 
              type="text" 
              name="logoUrl" 
              value={formData.logoUrl} 
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Token'}
          </Button>
        </Form>
      </FormContainer>
    </Container>
  );
};

const EditToken = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'cex',
    chainId: 'ethereum',
    address: '',
    decimals: 18,
    logoUrl: ''
  });
  
  // Extract token ID from URL
  const tokenId = window.location.pathname.split('/').pop();
  
  useEffect(() => {
    if (tokenId) {
      fetchToken(tokenId);
    }
  }, [tokenId]);
  
  const fetchToken = async (id) => {
    try {
      const tokenDoc = await getDoc(doc(db, 'tokens', id));
      if (tokenDoc.exists()) {
        const tokenData = tokenDoc.data();
        setToken({ id, ...tokenData });
        setFormData({
          name: tokenData.name || '',
          symbol: tokenData.symbol || '',
          type: tokenData.type || 'cex',
          chainId: tokenData.chainId || 'ethereum',
          address: tokenData.address || '',
          decimals: tokenData.decimals || 18,
          logoUrl: tokenData.logoUrl || ''
        });
      } else {
        setError('Token not found');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Validate the form data
      if (!formData.name || !formData.symbol) {
        throw new Error('Name and symbol are required');
      }
      
      if (formData.type === 'dex' && !formData.address) {
        throw new Error('Token address is required for DEX tokens');
      }
      
      // Create the token update data
      const tokenData = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        updatedAt: serverTimestamp(),
        logoUrl: formData.logoUrl || null,
        decimals: parseInt(formData.decimals) || 18
      };
      
      // Add chain-specific data for DEX tokens
      if (formData.type === 'dex') {
        tokenData.chainId = formData.chainId;
        tokenData.address = formData.address;
      } else {
        // Remove chain-specific fields if changing from DEX to CEX
        if (token.type === 'dex') {
          // Note: We can't actually remove fields with updateDoc,
          // but we can set them to null or empty values
          tokenData.chainId = null;
          tokenData.address = null;
        }
      }
      
      await updateDoc(doc(db, 'tokens', tokenId), tokenData);
      
      setSuccess(`Token ${formData.symbol.toUpperCase()} updated successfully`);
    } catch (error) {
      console.error('Error updating token:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Container>Loading token data...</Container>;
  }
  
  if (!token && !loading) {
    return (
      <Container>
        <ErrorMessage>{error || 'Token not found'}</ErrorMessage>
        <ActionButton onClick={() => navigate('/admin/tokens')}>
          Back to Tokens
        </ActionButton>
      </Container>
    );
  }
  
  return (
    <Container>
      <ActionButton onClick={() => navigate('/admin/tokens')}>
        ← Back to Tokens
      </ActionButton>
      
      <h2 style={{ color: 'var(--text)' }}>Edit Token: {token.symbol}</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Token Name</Label>
            <Input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Token Symbol</Label>
            <Input 
              type="text" 
              name="symbol" 
              value={formData.symbol} 
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Token Type</Label>
            <Select 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
            >
              <option value="cex">CEX (Centralized Exchange)</option>
              <option value="dex">DEX (Decentralized Exchange)</option>
            </Select>
          </FormGroup>
          
          {formData.type === 'dex' && (
            <>
              <FormGroup>
                <Label>Blockchain</Label>
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
                <Label>Token Contract Address</Label>
                <Input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  required={formData.type === 'dex'}
                />
              </FormGroup>
            </>
          )}
          
          <FormGroup>
            <Label>Decimals</Label>
            <Input 
              type="number" 
              name="decimals" 
              value={formData.decimals} 
              onChange={handleChange}
              min="0"
              max="18"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Logo URL (optional)</Label>
            <Input 
              type="text" 
              name="logoUrl" 
              value={formData.logoUrl} 
              onChange={handleChange}
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Form>
      </FormContainer>
    </Container>
  );
};

const TokenManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<TokensList />} />
      <Route path="/add" element={<AddToken />} />
      <Route path="/edit/:id" element={<EditToken />} />
    </Routes>
  );
};

export default TokenManagement; 