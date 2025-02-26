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

  return (
    <Container>
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
          <thead>
            <tr>
              <TableHeader>User ID</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <TableCell colSpan="6" style={{textAlign: 'center'}}>Loading...</TableCell>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <TableCell colSpan="6" style={{textAlign: 'center'}}>No users found</TableCell>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <TableCell>{user.id.substring(0, 8)}...</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.displayName || 'N/A'}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleString() : 'N/A'}
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
                </tr>
              ))
            )}
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
    </Container>
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

const UserManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<UsersList />} />
      <Route path="/add" element={<AddUser />} />
      <Route path="/edit/:id" element={<EditUser />} />
    </Routes>
  );
};

export default UserManagement; 