import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const NavbarContainer = styled.div`
  background-color: #161b22;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #30363d;
`;

const Logo = styled(Link)`
  color: #ff725a;
  font-size: 1.5rem;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: ${props => props.active ? '#ff725a' : '#c9d1d9'};
  text-decoration: none;
  font-weight: ${props => props.active ? '500' : 'normal'};
  transition: color 0.2s;
  
  &:hover {
    color: #ff725a;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  color: #c9d1d9;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #ff725a;
  }
`;

const AdminNavbar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  return (
    <NavbarContainer>
      <Logo to="/admin">
        <i className="bi bi-gem"></i>
        Ripple Admin
      </Logo>
      
      <NavLinks>
        <NavLink 
          to="/admin" 
          active={location.pathname === '/admin' ? 'true' : undefined}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/admin/users" 
          active={location.pathname.includes('/admin/users') ? 'true' : undefined}
        >
          Users
        </NavLink>
        <NavLink 
          to="/admin/deposits" 
          active={location.pathname.includes('/admin/deposits') ? 'true' : undefined}
        >
          Deposits
        </NavLink>
        <NavLink 
          to="/admin/withdrawal-management" 
          active={location.pathname.includes('/admin/withdrawal-management') ? 'true' : undefined}
        >
          Withdrawals
        </NavLink>
        <NavLink 
          to="/admin/wallets" 
          active={location.pathname.includes('/admin/wallets') ? 'true' : undefined}
        >
          Wallets
        </NavLink>
        <NavLink 
          to="/admin/balances" 
          active={location.pathname.includes('/admin/balances') ? 'true' : undefined}
        >
          User Search
        </NavLink>
      </NavLinks>
      
      <UserSection>
        <UserName>{currentUser?.email || 'Admin'}</UserName>
        <LogoutButton onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
        </LogoutButton>
      </UserSection>
    </NavbarContainer>
  );
};

export default AdminNavbar; 