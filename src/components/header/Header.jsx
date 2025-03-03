import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DarkMode from './DarkMode';
import menus from '../../pages/menu';
import './styles.scss';
import defaultAvatar from '../../assets/user.png';
import logo from '../../assets/images/logo/logo.png';
import 'react-tabs/style/react-tabs.css';
import { useAuth } from '../../contexts/AuthContext';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import styled, { keyframes } from 'styled-components';
import Notifications from '../Notifications';
import { notificationService } from '../../services/notificationService';

const glowPulse = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(247, 147, 26, 0.2);
  }
  50% {
    box-shadow: 0 0 15px rgba(247, 147, 26, 0.5);
  }
  100% {
    box-shadow: 0 0 5px rgba(247, 147, 26, 0.2);
  }
`;

const textGlow = keyframes`
  0% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.2);
  }
  50% {
    text-shadow: 0 0 15px rgba(247, 147, 26, 0.5);
  }
  100% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.2);
  }
`;

const HeaderContainer = styled.header`
  background-color: #0b0b0f;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled.img`
  height: 28px;
  margin-right: 30px;
  &:hover {
    animation: ${glowPulse} 2s ease-in-out infinite;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  flex: 1;
  height: 100%;
`;

const MenuItem = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  transition: color 0.2s;
  
  &:hover {
    color: #F7931A;
    animation: ${textGlow} 1.5s ease-in-out infinite;
  }

  ${props => props.$hasDropdown && `
    &::after {
      content: '▼';
      font-size: 8px;
      margin-left: 6px;
      position: relative;
      top: 1px;
    }
  `}
`;

const SearchContainer = styled.div`
  position: relative;
  margin: 0 20px;
`;

const SearchInput = styled.input`
  background-color: #1a1a1f;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #fff;
  padding: 8px 18px 8px 40px;
  font-size: 14px;
  width: 220px;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    background-color: #25252d;
    border-color: rgba(247, 147, 26, 0.5);
    width: 260px;
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a1a1f;
  border-radius: 10px;
  margin-top: 5px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  padding: 10px;
  display: ${props => props.$visible ? 'block' : 'none'};
`;

const SearchResultItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background-color: #25252d;
    box-shadow: 0 0 8px rgba(247, 147, 26, 0.3);
  }
`;

const ResultIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const ResultName = styled.div`
  font-size: 14px;
  color: #fff;
`;

const LoginButton = styled(Link)`
  color: #fff;
  text-decoration: none;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  margin-right: 12px;
  transition: all 0.3s;
  
  &:hover {
    color: #F7931A;
    animation: ${textGlow} 1.5s ease-in-out infinite;
  }
`;

const SignUpButton = styled(Link)`
  background-color: #F7931A;
  color: #fff;
  text-decoration: none;
  padding: 8px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  
  &:hover {
    background-color: #e88a18;
    box-shadow: 0 0 15px rgba(247, 147, 26, 0.5);
  }
`;

const UserControls = styled.div`
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  margin-left: 16px;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s;
  
  &:hover {
    color: #F7931A;
    transform: scale(1.1);
    animation: ${textGlow} 1.5s ease-in-out infinite;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  margin-left: 16px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.5);
    transform: scale(1.1);
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AdminLink = styled(Link)`
  color: #F7931A;
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid #F7931A;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 14px;
  transition: all 0.3s;
  
  &:hover {
    background: #F7931A;
    color: white;
    box-shadow: 0 0 15px rgba(247, 147, 26, 0.5);
  }
`;

const NavLink = styled(Link)`
  color: var(--text);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg2);
  }

  &.active {
    color: var(--primary);
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #f7931a;
  color: white;
  font-size: 10px;
  font-weight: bold;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${glowPulse} 2s ease-in-out infinite;
`;

const Header = () => {
    const { currentUser } = useAuth();
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    // Check if we're on login or register page
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
            } else {
                setIsAdmin(false);
            }
        };
        checkAdminStatus();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setNotificationCount(0);
            return;
        }

        const fetchNotificationCount = async () => {
            try {
                const count = await notificationService.getUnreadCount(currentUser.uid);
                setNotificationCount(count);
            } catch (error) {
                console.error('Error fetching notification count:', error);
            }
        };

        fetchNotificationCount();

        // Set up a timer to periodically check for new notifications
        const intervalId = setInterval(fetchNotificationCount, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, [currentUser]);

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        try {
            // Normalize the search term to handle cases like "BTC/USDT" or "btcusdt"
            const normalizedTerm = term.toUpperCase().replace(/[^A-Z0-9]/g, '');
            
            // Query the coins collection
            const coinsRef = collection(db, 'coins');
            const q = query(coinsRef);
            const querySnapshot = await getDocs(q);
            
            // Filter results based on the search term
            const results = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(coin => {
                    const symbol = coin.symbol.toUpperCase();
                    const name = coin.name.toUpperCase();
                    
                    // Check for direct matches
                    if (symbol.includes(normalizedTerm) || name.includes(normalizedTerm)) {
                        return true;
                    }
                    
                    // Check for trading pairs (e.g. BTC/USDT or BTCUSDT)
                    // Main symbol is the coin symbol, and we check for "SYMBOLUSDT" pattern
                    if (symbol + 'USDT' === normalizedTerm) {
                        return true;
                    }
                    
                    // For pairs split by / or -
                    if (term.includes('/') || term.includes('-')) {
                        const parts = term.toUpperCase().replace(/-/g, '/').split('/');
                        if (parts.length === 2 && symbol === parts[0] && parts[1] === 'USDT') {
                            return true;
                        }
                    }
                    
                    return false;
                });
            
            setSearchResults(results);
            setShowResults(results.length > 0);
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const handleResultClick = (result) => {
        navigate(`/trading/${result.id}`);
        setShowResults(false);
        setSearchTerm('');
    };

    const handleProfileClick = () => {
        window.location.href = '/user-profile';
    };

    const renderUserAvatar = () => {
        if (!user) return defaultAvatar;
        return user.photoURL || defaultAvatar;
    };

    const toggleNotifications = (e) => {
        e.stopPropagation();
        setShowNotifications(!showNotifications);
        
        // Reset notification count when opening notifications
        if (!showNotifications && notificationCount > 0) {
            setNotificationCount(0);
        }
    };

    // Close notifications when clicking anywhere else
    const handleClickOutside = () => {
        if (showNotifications) {
            setShowNotifications(false);
        }
    };

    useEffect(() => {
        if (showNotifications) {
            document.addEventListener('click', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showNotifications]);

    return (
        <HeaderContainer>
            <HeaderWrapper>
                <LogoContainer>
                    <Link onClick={() => window.location.href = '/'} to="#">
                        <Logo src={logo} alt="Ripple Exchange" />
                    </Link>
                    <Navigation>
                        <NavLink onClick={() => window.location.href = '/market'} to="#">Market</NavLink>
                        <NavLink onClick={() => window.location.href = '/trading/btc'} to="#">Trade</NavLink>
                        <NavLink onClick={() => window.location.href = '/deposit'} to="#">Deposit</NavLink>
                        <NavLink onClick={() => window.location.href = '/withdraw'} to="#">Withdraw</NavLink>
                    </Navigation>
                </LogoContainer>

                <UserControls>
                    <SearchContainer>
                        <SearchIcon>🔍</SearchIcon>
                        <SearchInput 
                            placeholder="Search pair (e.g. BTC/USDT)" 
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) setShowResults(true);
                            }}
                            onBlur={() => {
                                // Delayed hiding to allow for item clicks
                                setTimeout(() => setShowResults(false), 200);
                            }}
                        />
                        <SearchResults $visible={showResults}>
                            {searchResults.map(result => (
                                <SearchResultItem
                                    key={result.id}
                                    onMouseDown={() => handleResultClick(result)}
                                >
                                    <ResultIcon src={result.icon} alt={result.symbol} />
                                    <ResultName>
                                        {result.name} ({result.symbol})
                                    </ResultName>
                                </SearchResultItem>
                            ))}
                        </SearchResults>
                    </SearchContainer>

                    {user ? (
                        <>
                            {!isAuthPage && isAdmin && (
                                <AdminLink to="/admin">
                                    Admin Panel
                                </AdminLink>
                            )}
                            <IconButton title="Settings">⚙️</IconButton>
                            <IconButton 
                                title="Notifications" 
                                onClick={toggleNotifications}
                                style={{ position: 'relative' }}
                            >
                                🔔
                                {notificationCount > 0 && (
                                    <NotificationBadge>{notificationCount > 9 ? '9+' : notificationCount}</NotificationBadge>
                                )}
                            </IconButton>
                            {showNotifications && (
                                <Notifications
                                    show={showNotifications}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                            <UserAvatar onClick={handleProfileClick}>
                                <AvatarImage src={renderUserAvatar()} alt="User" />
                            </UserAvatar>
                        </>
                    ) : (
                        !isAuthPage && (
                            <>
                                <LoginButton to="/login">Log In</LoginButton>
                                <SignUpButton to="/register">Sign Up</SignUpButton>
                            </>
                        )
                    )}
                </UserControls>
            </HeaderWrapper>
        </HeaderContainer>
    );
};

export default Header; 