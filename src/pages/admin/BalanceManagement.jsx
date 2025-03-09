import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';

const Container = styled.div`
  padding: 20px;
  color: var(--text);
`;

const SearchContainer = styled.div`
  margin-bottom: 30px;
  background: var(--bg2);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const UserCard = styled.div`
  background: var(--bg2);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 15px;
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
  margin-right: 15px;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const BalanceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const BalanceCard = styled.div`
  background: var(--bg1);
  padding: 15px;
  border-radius: 8px;
  position: relative;
`;

const EditIcon = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  
  &:hover {
    color: var(--primary);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--bg1);
  color: var(--text);
  margin-bottom: 8px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #3a5bd9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff3b30;
  margin: 10px 0;
  padding: 10px;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #4cd964;
  margin: 10px 0;
  padding: 10px;
  background: rgba(76, 217, 100, 0.1);
  border-radius: 4px;
`;

const NoResultsMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg2);
  border-radius: 8px;
  margin-top: 20px;
`;

const QuickCoinButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 15px;
`;

const QuickCoinButton = styled.button`
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 5px 10px;
  color: var(--text);
  cursor: pointer;
  
  &:hover {
    background: var(--primary);
    color: white;
  }
`;

// Common coins for quick selection
const COMMON_COINS = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE'];

const UserSearch = () => {
  const { userId } = useParams(); // Get userId from URL parameters if available
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingBalance, setEditingBalance] = useState({ userId: '', coin: '', amount: '' });
  const [userBalances, setUserBalances] = useState({});
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editBalance, setEditBalance] = useState({ userId: '', token: '', amount: 0, operation: 'set' });

  // Check for userId in URL params on component mount
  useEffect(() => {
    const loadUserFromId = async () => {
      if (userId) {
        setLoading(true);
        setError('');
        
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSearchResults({
              id: userId,
              ...userData
            });
            setSearchEmail(userData.email || '');
            
            // Load user balances
            await fetchUserBalances(userId);
            
            setSuccess('User loaded successfully');
          } else {
            setError('User not found with that ID');
          }
        } catch (err) {
          console.error('Error loading user from ID:', err);
          setError('Failed to load user details: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadUserFromId();
  }, [userId]);

  const searchUserByEmail = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      setError('Please enter an email to search');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSearchResults(null);

    try {
      // Query Firestore for the user with the given email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No user found with that email');
        setLoading(false);
        return;
      }

      // Get the first matching user
      const userData = querySnapshot.docs[0].data();
      const userId = querySnapshot.docs[0].id;
      
      // Fetch user balances
      await fetchUserBalances(userId);

      setSearchResults({
        id: userId,
        ...userData
      });
      
      setSuccess('User found successfully');
    } catch (err) {
      console.error('Error searching for user:', err);
      setError('Failed to search for user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalances = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists() && userDoc.data().balances) {
        setUserBalances(userDoc.data().balances);
      } else {
        setUserBalances({});
      }
    } catch (err) {
      console.error('Error fetching user balances:', err);
      setError('Failed to fetch user balances');
    }
  };

  const handleEditBalance = (userId, coin) => {
    setEditBalance({
      userId,
      token: coin,
      amount: userBalances[coin] || 0,
      operation: 'set'
    });
    setShowEditForm(true);
  };

  const handleAddDeposit = () => {
    if (!searchResults) return;
    
    setEditBalance({
      userId: searchResults.id,
      token: Object.keys(DEFAULT_COINS)[0] || 'USDT',
      amount: 0,
      operation: 'deposit'
    });
    setShowEditForm(true);
  };

  const handleSubmitBalanceChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { userId, token, amount, operation } = editBalance;
      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount)) {
        throw new Error('Amount must be a valid number');
      }

      // For deposit operation, we'll use the dedicated API endpoint
      if (operation === 'deposit') {
        const response = await fetch('/api/mock-deposit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            token,
            amount: numericAmount
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(`Successfully added deposit of ${numericAmount} ${token}`);
          // Refresh the user's balances
          await fetchUserBalances(userId);
        } else {
          toast.error(`Failed to add deposit: ${data.error}`);
        }
      } else {
        // Existing code for setting or updating balance
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const updatedBalances = { ...userData.balances } || {};
        updatedBalances[token] = numericAmount;

        await updateDoc(userRef, { balances: updatedBalances });

        // Update local state
        setUserBalances(updatedBalances);
        setEditBalance({ userId: '', token: '', amount: '', operation: 'set' });
        setSuccess(`Successfully updated ${token} balance to ${numericAmount}`);
      }
    } catch (err) {
      console.error('Error updating balance:', err);
      setError('Failed to update balance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Container>
      <h2>User Search</h2>
      
      <SearchContainer>
        <form onSubmit={searchUserByEmail}>
          <FormGroup>
            <Label htmlFor="searchEmail">Search User by Email</Label>
            <Input
              id="searchEmail"
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter user email"
              required
            />
          </FormGroup>
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search User'}
          </Button>
        </form>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </SearchContainer>

      {searchResults ? (
        <div>
          <UserCard>
            <UserInfo>
              <Avatar>{getUserInitials(searchResults.displayName)}</Avatar>
              <UserDetails>
                <h3>{searchResults.displayName || 'No Name'}</h3>
                <p>Email: {searchResults.email}</p>
                <p>User ID: {searchResults.id}</p>
              </UserDetails>
            </UserInfo>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>User Balances</h3>
              <button 
                onClick={handleAddDeposit}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Deposit
              </button>
            </div>
            
            {Object.keys(userBalances).length > 0 ? (
              <BalanceGrid>
                {Object.entries(userBalances).map(([coin, balance]) => (
                  <BalanceCard key={coin}>
                    <h4>{coin.toUpperCase()}</h4>
                    <p>{balance}</p>
                    <EditIcon onClick={() => handleEditBalance(searchResults.id, coin)}>
                      <i className="bi bi-pencil"></i>
                    </EditIcon>
                  </BalanceCard>
                ))}
              </BalanceGrid>
            ) : (
              <p>No balances found for this user.</p>
            )}
            
            {showEditForm && (
              <div style={{ marginTop: '30px' }}>
                <h3>Edit {editBalance.token.toUpperCase()} Balance</h3>
                <form onSubmit={handleSubmitBalanceChange}>
                  <FormGroup>
                    <Label htmlFor="balanceAmount">Amount</Label>
                    <Input
                      id="balanceAmount"
                      type="number"
                      step="any"
                      value={editBalance.amount}
                      onChange={(e) => setEditBalance({...editBalance, amount: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Balance'}
                  </Button>
                  <Button 
                    type="button" 
                    style={{ marginLeft: '10px', background: '#666' }} 
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </Button>
                </form>
              </div>
            )}
            
            {/* Option to add a new balance */}
            {!showEditForm && (
              <div style={{ marginTop: '30px' }}>
                <h3>Add New Balance</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const coin = e.target.elements.coin.value.trim().toUpperCase();
                  const amount = parseFloat(e.target.elements.amount.value);
                  if (coin && !isNaN(amount)) {
                    setEditBalance({
                      userId: searchResults.id,
                      token: coin,
                      amount: amount.toString(),
                      operation: 'set'
                    });
                  }
                }}>
                  <FormGroup>
                    <Label htmlFor="coin">Coin</Label>
                    <Input
                      id="coin"
                      type="text"
                      placeholder="e.g. BTC, ETH, USDT"
                      required
                    />
                    <Label>Quick Select:</Label>
                    <QuickCoinButtons>
                      {COMMON_COINS.map(coin => (
                        <QuickCoinButton 
                          key={coin} 
                          type="button"
                          onClick={() => {
                            document.getElementById('coin').value = coin;
                          }}
                        >
                          {coin}
                        </QuickCoinButton>
                      ))}
                    </QuickCoinButtons>
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder="Enter amount"
                      required
                    />
                  </FormGroup>
                  <Button type="submit">
                    Add Balance
                  </Button>
                </form>
              </div>
            )}
          </UserCard>
        </div>
      ) : (
        searchEmail && !loading && error && (
          <NoResultsMessage>
            <i className="bi bi-search" style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}></i>
            <p>No user found with that email. Please try a different search.</p>
          </NoResultsMessage>
        )
      )}
    </Container>
  );
};

export default UserSearch; 