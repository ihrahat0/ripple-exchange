import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
  color: var(--text);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--bg1);
  color: var(--text);
  margin-bottom: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--line);
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
  font-weight: 500;
  
  &:hover {
    background: #3a5bd9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButton = styled(Button)`
  margin-bottom: 20px;
`;

const UserCard = styled.div`
  background: var(--bg2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceTable = styled.table`
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

const ErrorMessage = styled.div`
  color: var(--error);
  background: rgba(246, 70, 93, 0.1);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  color: #0ECB81;
  background: rgba(14, 203, 129, 0.1);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
`;

const BalanceManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBalances, setUserBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editBalance, setEditBalance] = useState({
    coin: '',
    amount: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  };

  const fetchUserBalances = async (userId) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUser({
          id: userId,
          ...userData
        });
        setUserBalances(userData.balances || {});
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Error fetching user balances:', error);
      setError('Failed to fetch user balances');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    if (!selectedUser || !editBalance.coin || editBalance.amount === '') {
      setError('Please select a user, coin, and enter an amount');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedBalances = { ...userData.balances };
        updatedBalances[editBalance.coin] = parseFloat(editBalance.amount);
        
        await updateDoc(userRef, {
          balances: updatedBalances
        });
        
        setUserBalances(updatedBalances);
        setSuccess(`Successfully updated ${editBalance.coin} balance for ${selectedUser.email}`);
        setEditBalance({ coin: '', amount: '' });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      setError('Failed to update balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ActionButton onClick={() => navigate('/admin')}>
        ← Back to Admin Dashboard
      </ActionButton>
      
      <h2>User Balance Management</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <FormGroup>
        <Label>Select User</Label>
        <Select 
          value={selectedUser?.id || ''}
          onChange={(e) => {
            const userId = e.target.value;
            if (userId) {
              fetchUserBalances(userId);
            } else {
              setSelectedUser(null);
              setUserBalances({});
            }
          }}
        >
          <option value="">-- Select a user --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.email || user.displayName || user.id}
            </option>
          ))}
        </Select>
      </FormGroup>
      
      {selectedUser && (
        <>
          <h3>Balances for {selectedUser.email || selectedUser.displayName}</h3>
          
          <form onSubmit={handleUpdateBalance}>
            <FormGroup>
              <Label>Select Coin</Label>
              <Select
                value={editBalance.coin}
                onChange={(e) => setEditBalance({...editBalance, coin: e.target.value})}
                required
              >
                <option value="">-- Select coin --</option>
                {Object.keys(userBalances).map(coin => (
                  <option key={coin} value={coin}>{coin}</option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>New Balance Amount</Label>
              <Input
                type="number"
                value={editBalance.amount}
                onChange={(e) => setEditBalance({...editBalance, amount: e.target.value})}
                placeholder="Enter new balance amount"
                step="0.00000001"
                required
              />
            </FormGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Balance'}
            </Button>
          </form>
          
          <BalanceTable>
            <thead>
              <tr>
                <th>Coin</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(userBalances).map(([coin, balance]) => (
                <tr key={coin}>
                  <td>{coin}</td>
                  <td>{balance}</td>
                  <td>
                    <Button
                      onClick={() => setEditBalance({
                        coin,
                        amount: balance.toString()
                      })}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </BalanceTable>
        </>
      )}
    </Container>
  );
};

export default BalanceManagement; 