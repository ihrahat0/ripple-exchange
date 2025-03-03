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
  orderBy, 
  limit, 
  startAfter,
  where,
  addDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

const Container = styled.div`
  background: var(--bg1);
  border-radius: 8px;
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: #fff;
`;

const UserGrid = styled.div`
  width: 100%;
  margin-top: 20px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
`;

const UserTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: rgba(44, 47, 54, 0.5);
`;

const TableHeader = styled.th`
  padding: 15px;
  text-align: left;
  background: var(--bg2);
  color: var(--text);
  font-weight: 500;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
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

const PaginationControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
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

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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

const WalletSearchSection = styled.div`
  margin-top: 20px;
  background: rgba(25, 27, 31, 0.8);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const WalletSearchTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 15px;
  color: #fff;
`;

const WalletSearchForm = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const WalletSearchInput = styled.input`
  flex-grow: 1;
  background: rgba(44, 47, 54, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  
  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.5);
  }
`;

const WalletSearchButton = styled.button`
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
  border: 1px solid rgba(33, 150, 243, 0.3);
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(33, 150, 243, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WalletInfoCard = styled.div`
  background: rgba(44, 47, 54, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
`;

const WalletInfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const WalletUserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const WalletUserName = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #fff;
`;

const WalletUserEmail = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;

const WalletAddressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const WalletFinderAddressCard = styled.div`
  background: rgba(30, 35, 44, 0.5);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px;
`;

const WalletChainName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #2196f3;
  margin-bottom: 8px;
`;

const WalletAddress = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #fff;
  word-break: break-all;
  margin-bottom: 8px;
`;

const WalletPrivateKey = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #ff9800;
  word-break: break-all;
  background: rgba(255, 152, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(33, 150, 243, 0.2);
  color: #2196f3;
  border: none;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  
  &:hover {
    background: rgba(33, 150, 243, 0.3);
  }
`;

const MessageBox = styled.div`
  color: ${props => props.$error ? 'var(--error)' : 'var(--success)'};
  padding: 10px;
  background: ${props => props.$error ? 'rgba(246, 70, 93, 0.1)' : 'rgba(14, 203, 129, 0.1)'};
  border-radius: 4px;
  margin-bottom: 20px;
`;

const WalletFinderCard = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const WalletFinderHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  
  h3 {
    margin: 0;
    color: #e6edf3;
    font-size: 18px;
    font-weight: 500;
  }
  
  .icon {
    width: 36px;
    height: 36px;
    background: rgba(255, 114, 90, 0.1);
    color: #ff725a;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
`;

const WalletFormContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const WalletInputField = styled.input`
  flex-grow: 1;
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
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const WalletButtonStyled = styled.button`
  background: rgba(255, 114, 90, 0.15);
  color: #ff725a;
  border: 1px solid rgba(255, 114, 90, 0.3);
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
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

const WalletResultCard = styled.div`
  background: rgba(15, 19, 25, 0.5);
  border-radius: 8px;
  padding: 20px;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WalletUserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #273142;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff725a;
    font-size: 18px;
    font-weight: 500;
  }
  
  .info {
    .name {
      font-weight: 500;
      font-size: 18px;
      color: #e6edf3;
      margin-bottom: 4px;
    }
    
    .email {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }
  }
`;

const WalletAddressesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 15px;
`;

const WalletAddressCard = styled.div`
  background: rgba(30, 35, 44, 0.5);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const WalletChainHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  
  h4 {
    margin: 0;
    color: #4dabf7;
    font-size: 16px;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .icon {
    width: 24px;
    height: 24px;
    background: rgba(77, 171, 247, 0.1);
    color: #4dabf7;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
`;

const AddressBox = styled.div`
  margin-bottom: 12px;
  
  label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 5px;
  }
  
  .value {
    background: rgba(0, 0, 0, 0.2);
    padding: 8px 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    color: #e6edf3;
    word-break: break-all;
    position: relative;
  }
  
  button {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`;

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (startAfterDoc = null) => {
    setLoading(true);
    try {
      let userQuery;
      
      if (searchTerm) {
        userQuery = query(
          collection(db, 'users'),
          where('email', '>=', searchTerm),
          where('email', '<=', searchTerm + '\uf8ff'),
          limit(pageSize)
        );
      } else {
        userQuery = startAfterDoc 
          ? query(collection(db, 'users'), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(pageSize))
          : query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(pageSize));
      }
      
      const snapshot = await getDocs(userQuery);
      
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(userData);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        // Remove from local state
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleNextPage = () => {
    if (lastVisible) {
      fetchUsers(lastVisible);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <FilterBar>
        <form onSubmit={handleSearch}>
          <SearchInput 
            type="text" 
            placeholder="Search by email" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </form>
        <ActionButton primary onClick={() => navigate('/admin/users/add')}>
          Add New User
        </ActionButton>
      </FilterBar>
      
      <UserGrid>
        <UserTable>
          <TableHead>
            <tr>
              <TableHeader>User ID</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.id.substring(0, 8)}...</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName || 'N/A'}</TableCell>
                <TableCell>
                  {user.createdAt 
                    ? (typeof user.createdAt.toDate === 'function' 
                        ? new Date(user.createdAt.toDate()).toLocaleString() 
                        : new Date(user.createdAt).toLocaleString())
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <span style={{
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: user.disabled ? 'rgba(246, 70, 93, 0.2)' : 'rgba(14, 203, 129, 0.2)',
                    color: user.disabled ? '#F6465D' : '#0ECB81'
                  }}>
                    {user.disabled ? 'Disabled' : 'Active'}
                  </span>
                </TableCell>
                <TableCell>
                  <ActionButton primary onClick={() => navigate(`/admin/users/edit/${user.id}`)}>
                    Edit
                  </ActionButton>
                  <ActionButton onClick={() => navigate(`/admin/balances/${user.id}`)}>
                    Balances
                  </ActionButton>
                  <ActionButton danger onClick={() => handleDelete(user.id)}>
                    Delete
                  </ActionButton>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </UserTable>
      </UserGrid>
      
      <PaginationControls>
        <ActionButton 
          onClick={handleNextPage} 
          disabled={!lastVisible || users.length < pageSize}
        >
          Next Page
        </ActionButton>
      </PaginationControls>
    </div>
  );
};

const AddUser = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
    isAdmin: false
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
    setLoading(true);
    
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Create the user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        isAdmin: formData.isAdmin,
        createdAt: new Date(),
        balances: {
          USDT: 0.00,
          BTC: 0.00,
          ETH: 0.00
        }
      });
      
      navigate('/admin/users');
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ActionButton onClick={() => navigate('/admin/users')}>
        ← Back to Users
      </ActionButton>
      
      <h2 style={{ color: 'var(--text)' }}>Add New User</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Email</Label>
            <Input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Password</Label>
            <Input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Display Name</Label>
            <Input 
              type="text" 
              name="displayName" 
              value={formData.displayName} 
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Role</Label>
            <Select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="vip">VIP</option>
              <option value="admin">Admin</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <CheckboxGroup>
              <Input 
                type="checkbox" 
                name="isAdmin" 
                checked={formData.isAdmin} 
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <Label>Admin Access</Label>
            </CheckboxGroup>
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </Form>
      </FormContainer>
    </Container>
  );
};

const EditUser = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    role: 'user',
    isAdmin: false,
    disabled: false
  });
  
  // Extract user ID from URL
  const userId = window.location.pathname.split('/').pop();
  
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);
  
  const fetchUser = async (id) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({ id, ...userData });
        setFormData({
          displayName: userData.displayName || '',
          role: userData.role || 'user',
          isAdmin: userData.isAdmin || false,
          disabled: userData.disabled || false
        });
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
    setLoading(true);
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        displayName: formData.displayName,
        role: formData.role,
        isAdmin: formData.isAdmin,
        disabled: formData.disabled,
        updatedAt: new Date()
      });
      
      navigate('/admin/users');
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Container>Loading user data...</Container>;
  }
  
  if (!user && !loading) {
    return (
      <Container>
        <ErrorMessage>{error || 'User not found'}</ErrorMessage>
        <ActionButton onClick={() => navigate('/admin/users')}>
          Back to Users
        </ActionButton>
      </Container>
    );
  }
  
  return (
    <Container>
      <ActionButton onClick={() => navigate('/admin/users')}>
        ← Back to Users
      </ActionButton>
      
      <h2 style={{ color: 'var(--text)' }}>Edit User: {user.email}</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Display Name</Label>
            <Input 
              type="text" 
              name="displayName" 
              value={formData.displayName} 
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Role</Label>
            <Select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="vip">VIP</option>
              <option value="admin">Admin</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <CheckboxGroup>
              <Input 
                type="checkbox" 
                name="isAdmin" 
                checked={formData.isAdmin} 
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <Label>Admin Access</Label>
            </CheckboxGroup>
          </FormGroup>
          
          <FormGroup>
            <CheckboxGroup>
              <Input 
                type="checkbox" 
                name="disabled" 
                checked={formData.disabled} 
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              <Label>Disable Account</Label>
            </CheckboxGroup>
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Form>
      </FormContainer>
    </Container>
  );
};

function UserManagement() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchingWallet, setSearchingWallet] = useState(false);
  const [walletUser, setWalletUser] = useState(null);
  const [walletAddresses, setWalletAddresses] = useState(null);
  const [walletPrivateKeys, setWalletPrivateKeys] = useState(null);
  const [walletError, setWalletError] = useState('');
  const [walletSearchSection, setWalletSearchSection] = useState(false);

  const handleWalletSearch = async () => {
    if (!searchEmail.trim()) {
      setWalletError('Please enter a valid email address');
      return;
    }
    
    try {
      setSearchingWallet(true);
      setWalletError('');
      setWalletUser(null);
      setWalletAddresses(null);
      setWalletPrivateKeys(null);
      
      // Search for user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setWalletError('User not found with this email');
        return;
      }
      
      // Get user data
      const userData = querySnapshot.docs[0].data();
      const userId = querySnapshot.docs[0].id;
      
      setWalletUser({
        id: userId,
        ...userData
      });
      
      // Get wallet addresses
      const walletRef = doc(db, 'walletAddresses', userId);
      const walletDoc = await getDoc(walletRef);
      
      if (!walletDoc.exists()) {
        setWalletError('This user does not have a wallet yet');
        return;
      }
      
      const walletData = walletDoc.data();
      setWalletAddresses(walletData.wallets || {});
      setWalletPrivateKeys(walletData.privateKeys || {});
    } catch (error) {
      console.error('Error searching for wallet:', error);
      setWalletError('Failed to fetch wallet data');
    } finally {
      setSearchingWallet(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <Routes>
      <Route path="/" element={
        <Container>
          <Title>User Management</Title>
          
          <WalletFinderCard>
            <WalletFinderHeader>
              <div className="icon"><i className="bi bi-wallet2"></i></div>
              <h3>User Wallet Finder</h3>
            </WalletFinderHeader>
            
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
              Find a user's wallet addresses and private keys by entering their email address.
            </p>
            
            <WalletFormContainer>
              <WalletInputField
                type="email"
                placeholder="Enter user email address"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
              <WalletButtonStyled 
                onClick={handleWalletSearch}
                disabled={searchingWallet}
              >
                {searchingWallet ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      border: '2px solid rgba(255, 114, 90, 0.3)', 
                      borderTopColor: '#ff725a', 
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Searching
                  </>
                ) : (
                  <>
                    <i className="bi bi-search"></i> Find Wallet
                  </>
                )}
              </WalletButtonStyled>
            </WalletFormContainer>
            
            {walletError && (
              <MessageBox $error>
                <i className="bi bi-exclamation-triangle"></i> {walletError}
              </MessageBox>
            )}
            
            {walletUser && walletAddresses && (
              <WalletResultCard>
                <WalletUserHeader>
                  <div className="avatar">
                    {walletUser.email ? walletUser.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="info">
                    <div className="name">{walletUser.displayName || 'User'}</div>
                    <div className="email">{walletUser.email}</div>
                  </div>
                </WalletUserHeader>
                
                <WalletAddressesGrid>
                  {Object.entries(walletAddresses).map(([chain, address]) => (
                    <WalletFinderAddressCard key={chain}>
                      <WalletChainHeader>
                        <h4>{chain}</h4>
                        <div className="icon">
                          {chain === 'ethereum' ? 'Ξ' :
                           chain === 'solana' ? 'S' :
                           chain === 'bitcoin' ? '₿' :
                           chain === 'bsc' ? 'B' : '#'}
                        </div>
                      </WalletChainHeader>
                      
                      <AddressBox>
                        <label>Address</label>
                        <div className="value">
                          {address}
                          <button onClick={() => copyToClipboard(address)}>Copy</button>
                        </div>
                      </AddressBox>
                      
                      {walletPrivateKeys && walletPrivateKeys[chain] && (
                        <AddressBox>
                          <label>Private Key</label>
                          <div className="value" style={{ color: '#ff9800' }}>
                            {walletPrivateKeys[chain]}
                            <button onClick={() => copyToClipboard(walletPrivateKeys[chain])}>Copy</button>
                          </div>
                        </AddressBox>
                      )}
                    </WalletFinderAddressCard>
                  ))}
                </WalletAddressesGrid>
              </WalletResultCard>
            )}
          </WalletFinderCard>
          
          <UsersList />
        </Container>
      } />
      <Route path="/add" element={<AddUser />} />
      <Route path="/edit/:id" element={<EditUser />} />
    </Routes>
  );
}

export default UserManagement; 