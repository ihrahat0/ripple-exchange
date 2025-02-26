import React, { useState } from 'react';
import styled from 'styled-components';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import TokenManagement from './TokenManagement';
import PairManagement from './PairManagement';
import BalanceManagement from './BalanceManagement';
import Settings from './Settings';

const AdminContainer = styled.div`
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
  color: ${props => props.active ? 'var(--primary)' : 'var(--text)'};
  background: ${props => props.active ? 'rgba(71, 130, 218, 0.1)' : 'transparent'};
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  
  &:hover {
    background: rgba(71, 130, 218, 0.05);
    color: var(--primary);
  }
  
  i {
    margin-right: 10px;
    font-size: 18px;
  }
`;

const Content = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line);
`;

const PageTitle = styled.h1`
  color: var(--text);
  margin: 0;
  font-size: 24px;
`;

const AdminPanel = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true); // You should implement proper admin check

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('users')) return 'User Management';
    if (path.includes('tokens')) return 'Token Management';
    if (path.includes('pairs')) return 'Trading Pair Management';
    if (path.includes('balances')) return 'Balance Management';
    if (path.includes('settings')) return 'Admin Settings';
    return 'Admin Dashboard';
  };

  return (
    <AdminContainer>
      <Sidebar>
        <Logo>Exchange Admin</Logo>
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
          <NavItem>
            <NavLink to="/admin/tokens" active={location.pathname.includes('/admin/tokens') ? 'true' : undefined}>
              <i className="bi bi-coin"></i> Tokens
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/pairs" active={location.pathname.includes('/admin/pairs') ? 'true' : undefined}>
              <i className="bi bi-diagram-3"></i> Trading Pairs
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/balances" active={location.pathname.includes('/admin/balances') ? 'true' : undefined}>
              <i className="bi bi-wallet2"></i> User Balances
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/settings" active={location.pathname.includes('/admin/settings') ? 'true' : undefined}>
              <i className="bi bi-gear"></i> Settings
            </NavLink>
          </NavItem>
        </NavMenu>
      </Sidebar>
      <Content>
        <Header>
          <PageTitle>{getPageTitle()}</PageTitle>
        </Header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users/*" element={<UserManagement />} />
          <Route path="/tokens/*" element={<TokenManagement />} />
          <Route path="/pairs/*" element={<PairManagement />} />
          <Route path="/balances/*" element={<BalanceManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Content>
    </AdminContainer>
  );
};

export default AdminPanel; 