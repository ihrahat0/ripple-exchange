import React, { useState, useEffect, useRef } from 'react';
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

const logoTextAnimate = keyframes`
  0% {
    opacity: 0.7;
    text-shadow: 0 0 10px #F7931A;
  }
  50% {
    opacity: 1;
    text-shadow: 0 0 20px #F7931A, 0 0 30px rgba(247, 147, 26, 0.5);
  }
  100% {
    opacity: 0.7;
    text-shadow: 0 0 10px #F7931A;
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-5px) rotate(2deg);
  }
  50% {
    transform: translateY(0px) rotate(0deg);
  }
  75% {
    transform: translateY(5px) rotate(-2deg);
  }
  100% {
    transform: translateY(0px) rotate(0deg);
  }
`;

const shine = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
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
  position: relative;
  
  @media (max-width: 992px) {
    padding: 0 15px;
  }
  
  @media (max-width: 768px) {
    height: 55px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.3s;
    
    &:hover {
      opacity: 0.9;
    }
  }
  
  @media (max-width: 768px) {
    margin-right: 20px;
    justify-content: flex-start;
  }
`;

const Logo = styled.img`
  height: 40px;
  width: auto;
  margin-right: 8px;
  transition: all 0.3s;
  
  @media (max-width: 768px) {
    height: 32px;
  }
  
  @media (max-width: 480px) {
    height: 28px;
  }
`;

const LogoText = styled.span`
  font-family: 'Poppins', 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 20px;
  color: #fff;
  margin-left: 4px;
  letter-spacing: 0.5px;
  transition: all 0.3s;
  position: relative;
  text-transform: uppercase;
  
  span {
    color: #F7931A;
    font-weight: 800;
  }
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
  
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  margin-left: 10px;
  
  @media (max-width: 992px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  position: absolute;
  left: 20px;
  height: 100%;
  
  @media (max-width: 992px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background-color: #0b0b0f;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
  
  @media (max-width: 768px) {
    top: 55px;
    padding: 15px;
  }
`;

const NavLink = styled.a`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 0 20px;
  height: 100%;
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    color: #F7931A;
  }
  
  @media (max-width: 992px) {
    padding: 12px 0;
    width: 100%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    height: auto;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin: 0 20px;
  
  @media (max-width: 992px) {
    width: 100%;
    margin: 15px 0;
  }
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
  
  @media (max-width: 992px) {
    width: 100%;
    
    &:focus {
      width: 100%;
    }
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
  position: absolute;
  right: 20px;
  
  @media (max-width: 992px) {
    margin-left: auto;
  }
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  margin-left: 16px;
  transition: all 0.3s;
  border: 2px solid #F7931A;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1f;
  
  &:hover {
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.5);
    transform: scale(1.1);
    animation: ${glowPulse} 1.5s ease-in-out infinite;
  }
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  
  &:not([src]), &[src=""] {
    &::after {
      content: attr(alt);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F7931A;
      color: #1a1a1f;
      font-weight: bold;
      font-size: 18px;
    }
  }
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
    const { currentUser, isEmailVerified } = useAuth();
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [userData, setUserData] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchInputRef = useRef(null);
    const searchResultsRef = useRef(null);

    // Check if we're on login or register page
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    // Add the missing checkAdminStatus function
    const checkAdminStatus = async () => {
        if (!user) return false;
        
        try {
            // Check if user document exists and has admin role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            const isUserAdmin = userDoc.exists() && userData.role === 'admin';
            
            setIsAdmin(isUserAdmin);
            return isUserAdmin;
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            return false;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            
            if (user) {
                // Get user data including photoURL or profilePic
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
                
                // Now it's safe to call checkAdminStatus since it's defined
                await checkAdminStatus();
            } else {
                setUserData(null);
                setIsAdmin(false);
            }
        });
        
        return () => unsubscribe();
    }, []);

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
            
            // Query both collections: coins and tokens
            const coinsRef = collection(db, 'coins');
            const tokensRef = collection(db, 'tokens');
            
            const [coinsSnapshot, tokensSnapshot] = await Promise.all([
                getDocs(query(coinsRef)),
                getDocs(query(tokensRef))
            ]);
            
            // Combine results from both collections
            const allTokens = [
                ...coinsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'coins' })),
                ...tokensSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'tokens' }))
            ];
            
            // Filter results based on the search term
            const results = allTokens
                .filter(coin => {
                    const symbol = (coin.symbol || '').toUpperCase();
                    const name = (coin.name || '').toUpperCase();
                    
                    // Check for direct matches
                    if (symbol.includes(normalizedTerm) || name.includes(normalizedTerm)) {
                        return true;
                    }
                    
                    // Check for trading pairs (e.g. BTC/USDT or BTCUSDT)
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
                })
                .map(coin => ({
                    ...coin,
                    // Ensure logo/icon is available by checking multiple fields
                    icon: coin.icon || coin.logoUrl || coin.logo || 
                          `https://coinicons-api.vercel.app/api/icon/${coin.symbol?.toLowerCase()}`
                }));
            
            setSearchResults(results);
            setShowResults(results.length > 0);
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    const handleResultClick = (result) => {
        // Create trading data object from the result
        const tradingData = {
            token: {
                id: result.id,
                name: result.name,
                symbol: result.symbol,
                type: result.source === 'tokens' ? 'dex' : 'cex',
                chainId: result.chainId || 'ethereum',
                image: result.logo || result.icon || result.logoUrl || `https://coinicons-api.vercel.app/api/icon/${result.symbol?.toLowerCase()}`
            },
            pairInfo: {
                symbol: `${result.symbol}/USDT`,
                baseAsset: 'USDT',
                quoteAsset: result.symbol,
                address: result.address || ''
            },
            chartData: {
                lastPrice: parseFloat(result.price) || 0,
                change24h: parseFloat(result.priceChange24h) || 0,
                volume24h: result.volume24h || 0
            }
        };
        
        console.log('Navigating to trading with data:', tradingData);
        
        // Navigate with state
        navigate(`/trading/${result.id}`, { 
            state: { cryptoData: tradingData } 
        });
        
        setShowResults(false);
        setSearchTerm('');
    };

    const handleProfileClick = (e) => {
        if (!isEmailVerified) {
            e.preventDefault();
            alert('Please verify your email before accessing your profile.');
        }
    };

    const renderUserAvatar = () => {
        if (userData?.photoURL) {
            return userData.photoURL;
        } else if (userData?.profilePic) {
            return userData.profilePic;
        } else {
            // Use first letter of email or username as avatar fallback
            return defaultAvatar;
        }
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

    // Add this function to ensure all image URLs are properly loaded
    const ensureValidImageUrl = (url) => {
        if (!url) return defaultAvatar;
        
        // Check if URL is already absolute
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // Check if it's a storage URL
        if (url.startsWith('gs://')) {
            // Convert to a public URL if needed
            return url.replace('gs://', 'https://storage.googleapis.com/');
        }
        
        return url;
    };

    // Add click handler to close mobile menu when a link is clicked
    const handleNavLinkClick = (url) => {
        setMobileMenuOpen(false); // Close mobile menu
        if (url) {
            window.location.href = url;
        }
    };

    return (
        <HeaderContainer>
            <HeaderWrapper>
                <LogoContainer>
                    <Link onClick={() => window.location.href = '/'} to="#">
                        <Logo src={logo} alt="Ripple Exchange" />
                        <LogoText>Ripple <span>Exchange</span></LogoText>
                    </Link>
                </LogoContainer>

                <MobileMenuToggle onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? '✕' : '☰'}
                </MobileMenuToggle>

                <Navigation $isOpen={mobileMenuOpen}>
                    <NavLink onClick={() => handleNavLinkClick('/market')}>Market</NavLink>
                    <NavLink onClick={() => handleNavLinkClick('/deposit')}>Deposit</NavLink>
                    <NavLink onClick={() => handleNavLinkClick('/withdraw')}>Withdraw</NavLink>
                </Navigation>

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
                                    <ResultIcon 
                                        src={ensureValidImageUrl(result.icon || result.logoUrl || result.logo)}
                                        alt={result.symbol}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://coinicons-api.vercel.app/api/icon/${result.symbol?.toLowerCase()}`;
                                        }}
                                    />
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
                                <AvatarImage 
                                    src={ensureValidImageUrl(userData?.photoURL || userData?.profilePic)}
                                    alt={userData?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = defaultAvatar;
                                    }}
                                />
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