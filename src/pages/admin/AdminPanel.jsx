import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import TokenManagement from './TokenManagement';
import CoinManagement from './PairManagement';
import BalanceManagement from './BalanceManagement';
import Settings from './Settings';
import WithdrawalManagement from './WithdrawalManagement';
import { getDoc, doc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AdminContainer = styled.div`
  display: grid;
  grid-template-columns: 270px 1fr;
  min-height: 100vh;
  background: #0d1117;
  color: #e6edf3;
`;

const Sidebar = styled.div`
  background: #161b22;
  color: #c9d1d9;
  padding: 20px 0;
  border-right: 1px solid #30363d;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 600;
  padding: 0 25px 25px;
  margin-bottom: 20px;
  border-bottom: 1px solid #30363d;
  color: #ff725a;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    width: 24px;
    height: 24px;
  }
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
  padding: 12px 25px;
  color: ${props => props.active ? '#ff725a' : '#c9d1d9'};
  background: ${props => props.active ? 'rgba(255, 114, 90, 0.1)' : 'transparent'};
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid ${props => props.active ? '#ff725a' : 'transparent'};
  font-weight: ${props => props.active ? '500' : 'normal'};
  
  &:hover {
    background: rgba(255, 114, 90, 0.05);
    color: #ff725a;
  }
  
  i {
    margin-right: 12px;
    font-size: 18px;
  }
`;

const Content = styled.div`
  padding: 25px;
  overflow-y: auto;
  animation: ${fadeIn} 0.3s ease;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 25px;
  border-bottom: 1px solid #30363d;
`;

const PageTitle = styled.h1`
  color: #e6edf3;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
`;

const AdminStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: #161b22;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #30363d;
  
  h3 {
    margin: 0 0 5px 0;
    color: ${props => props.$color || '#c9d1d9'};
    font-size: 14px;
    font-weight: 500;
  }
  
  .value {
    font-size: 28px;
    font-weight: 600;
    color: #e6edf3;
  }
  
  .change {
    display: flex;
    align-items: center;
    margin-top: 10px;
    font-size: 14px;
    color: ${props => props.$up ? '#4cd964' : '#ff3b30'};
  }
`;

const UserInfo = styled.div`
  margin-top: auto;
  background: #0d1117;
  padding: 15px 25px;
  border-top: 1px solid #30363d;
  margin-top: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #30363d;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e6edf3;
    font-weight: 600;
  }
  
  .info {
    flex: 1;
    
    .name {
      font-weight: 500;
      font-size: 14px;
    }
    
    .role {
      font-size: 12px;
      color: #8b949e;
    }
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0d1117;
  color: #e6edf3;
  
  h2 {
    margin-top: 15px;
    font-weight: 500;
  }
  
  .spinner {
    border: 3px solid rgba(255, 114, 90, 0.1);
    border-top: 3px solid #ff725a;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AdminPanel = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true); // Default to true for initial loading
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    users: 0,
    pendingWithdrawals: 0,
    totalTransactions: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        setUserData(userData);
        setIsAdmin(userDoc.exists() && userData.role === 'admin');
        
        // Fetch basic stats
        fetchDashboardStats();
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);
  
  const fetchDashboardStats = async () => {
    try {
      // Count users
      const usersQuery = query(collection(db, 'users'), limit(1000));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Count pending withdrawals
      const pendingWithdrawalsQuery = query(
        collection(db, 'transactions'),
        where('type', '==', 'withdrawal'),
        where('status', '==', 'pending')
      );
      const pendingWithdrawalsSnapshot = await getDocs(pendingWithdrawalsQuery);
      
      // Count total transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      // Count active users (logged in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLogin', '>=', thirtyDaysAgo),
        limit(1000)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      
      setStats({
        users: usersSnapshot.size,
        pendingWithdrawals: pendingWithdrawalsSnapshot.size,
        totalTransactions: transactionsSnapshot.size,
        activeUsers: activeUsersSnapshot.size
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  if (loading) {
    return (
      <LoadingScreen>
        <div className="spinner"></div>
        <h2>Checking admin privileges...</h2>
      </LoadingScreen>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (path) => {
    if (path === '/admin') return 'Dashboard';
    if (path.includes('user-management') || path.includes('users')) return 'User Management';
    if (path.includes('token-management') || path.includes('tokens')) return 'Token Management';
    if (path.includes('pair-management') || path.includes('coins')) return 'Coin Management';
    if (path.includes('balance-management') || path.includes('balances')) return 'Balance Management';
    if (path.includes('withdrawal-management')) return 'Withdrawal Management';
    if (path.includes('settings')) return 'Settings';
    return 'Admin Panel';
  };
  
  const getUserInitials = () => {
    if (!userData || !userData.displayName) return 'A';
    
    const names = userData.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userData.displayName[0].toUpperCase();
  };

  return (
    <AdminContainer>
      <Sidebar>
        <Logo>
          <svg viewBox="0 0 24 24" fill="#ff725a" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
          Ripple Admin
        </Logo>
        <NavMenu>
          <NavItem>
            <NavLink to="/admin" active={location.pathname === '/admin' ? 'true' : undefined}>
              <i className="bi bi-speedometer2"></i> Dashboard
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/users" active={location.pathname.includes('/admin/users') ? 'true' : undefined}>
              <i className="bi bi-people"></i> Users
            </NavLink>
          </NavItem>
          {/* <NavItem>
            <NavLink to="/admin/tokens" active={location.pathname.includes('/admin/tokens') ? 'true' : undefined}>
              <i className="bi bi-coin"></i> Tokens
            </NavLink>
          </NavItem> */}
          <NavItem>
            <NavLink to="/admin/coins" active={location.pathname.includes('/admin/coins') ? 'true' : undefined}>
              <i className="bi bi-coin"></i> Coins
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/balances" active={location.pathname.includes('/admin/balances') ? 'true' : undefined}>
              <i className="bi bi-wallet2"></i> User Balances
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/withdrawal-management" active={location.pathname.includes('/admin/withdrawal-management') ? 'true' : undefined}>
              <i className="bi bi-cash-stack"></i> Withdrawals
              {stats.pendingWithdrawals > 0 && (
                <span style={{
                  background: '#ff725a',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  marginLeft: 'auto'
                }}>
                  {stats.pendingWithdrawals}
                </span>
              )}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/settings" active={location.pathname.includes('/admin/settings') ? 'true' : undefined}>
              <i className="bi bi-gear"></i> Settings
            </NavLink>
          </NavItem>
        </NavMenu>
        
        <UserInfo>
          <div className="avatar">
            {getUserInitials()}
          </div>
          <div className="info">
            <div className="name">{userData?.displayName || 'Admin User'}</div>
            <div className="role">Administrator</div>
          </div>
        </UserInfo>
      </Sidebar>
      <Content>
        <Header>
          <PageTitle>{getPageTitle(location.pathname)}</PageTitle>
        </Header>
        
        {location.pathname === '/admin' && (
          <AdminStats>
            <StatCard>
              <h3>Total Users</h3>
              <div className="value">{stats.users}</div>
              <div className="change" style={{ color: '#4cd964' }}>
                <i className="bi bi-arrow-up"></i> 12%
              </div>
            </StatCard>
            <StatCard $color="#ff725a">
              <h3>Pending Withdrawals</h3>
              <div className="value">{stats.pendingWithdrawals}</div>
              <div className="change" style={{ color: stats.pendingWithdrawals > 0 ? '#ff3b30' : '#4cd964' }}>
                <i className={`bi bi-arrow-${stats.pendingWithdrawals > 0 ? 'up' : 'down'}`}></i> {stats.pendingWithdrawals > 0 ? 'Requires attention' : 'All clear'}
              </div>
            </StatCard>
            <StatCard>
              <h3>Total Transactions</h3>
              <div className="value">{stats.totalTransactions}</div>
              <div className="change" style={{ color: '#4cd964' }}>
                <i className="bi bi-arrow-up"></i> 8%
              </div>
            </StatCard>
            <StatCard>
              <h3>Active Users</h3>
              <div className="value">{stats.activeUsers}</div>
              <div className="change" style={{ color: '#4cd964' }}>
                <i className="bi bi-arrow-up"></i> 5%
              </div>
            </StatCard>
          </AdminStats>
        )}
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users/*" element={<UserManagement />} />
          <Route path="/tokens/*" element={<TokenManagement />} />
          <Route path="/coins/*" element={<CoinManagement />} />
          <Route path="/balances/*" element={<BalanceManagement />} />
          <Route path="/withdrawal-management/*" element={<WithdrawalManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Content>
    </AdminContainer>
  );
};

export default AdminPanel; 