import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Sale01 from '../components/sale/Sale01';
import { auth } from '../firebase';
import { 
    updateProfile, 
    signOut, 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updatePassword 
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
    getDoc, 
    doc, 
    collection, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import img from '../assets/images/avt/avt.png'
import axios from 'axios';
import styled from 'styled-components';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PageTitle from '../components/pagetitle';

import btcLogo from '../assets/images/coin/btc.png';
import ethLogo from '../assets/images/coin/eth.png';
import usdtLogo from '../assets/images/coin/usdt.png';
import { DEFAULT_COINS } from '../utils/constants';
import ConvertModal from '../components/ConvertModal';
import DepositButton from '../components/DepositButton';
import { tradingService } from '../services/tradingService';
import { referralService } from '../services/referralService';
import solLogo from '../assets/images/coin/sol.png';
import bnbLogo from '../assets/images/coin/bnb.png';
import dogeLogo from '../assets/images/coin/doge.png';
import xrpLogo from '../assets/images/coin/xrp.png';
import adaLogo from '../assets/images/coin/ada.png';
import maticLogo from '../assets/images/coin/matic.png';
import dotLogo from '../assets/images/coin/dot.png';
import avaxLogo from '../assets/images/coin/avax.png';
import linkLogo from '../assets/images/coin/link.png';
import uniLogo from '../assets/images/coin/uni.png';
import atomLogo from '../assets/images/coin/atom.png';
import ripplexLogo from '../assets/images/logo/logo.png'; // Import Ripple Exchange logo for RIPPLEX token

UserProfile.propTypes = {
    
};

const COIN_LOGOS = {
  BTC: btcLogo,
  ETH: ethLogo,
  USDT: usdtLogo,
  SOL: solLogo,
  BNB: bnbLogo,
  DOGE: dogeLogo,
  XRP: xrpLogo,
  ADA: adaLogo,
  MATIC: maticLogo,
  DOT: dotLogo,
  AVAX: avaxLogo,
  LINK: linkLogo,
  UNI: uniLogo,
  ATOM: atomLogo,
  RIPPLEX: ripplexLogo // Add RIPPLEX token logo
};

const AnimatedBorder = styled.div`
  position: relative;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(
    60deg,
    #f79533,
    #f37055,
    #ef4e7b,
    #a166ab,
    #5073b8,
    #1098ad,
    #07b39b,
    #6fba82
  );
  background-size: 300% 300%;
  animation: animatedgradient 6s ease infinite;
  
  &:before {
    content: '';
    position: absolute;
    inset: 1px;
    background: #1a1b23;
    border-radius: 15px;
    z-index: 0;
  }
  
  @media (max-width: 768px) {
    border-radius: 12px;
    
    &:before {
      border-radius: 11px;
    }
  }
`;

const GalaxyBackground = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  
  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(74,107,243,0.1) 0%, rgba(0,0,0,0) 70%);
    animation: rotate 20s linear infinite;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(42,42,60,0.95) 0%, rgba(30,30,45,0.95) 100%);
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ProfileContainer = styled.div`
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
  }
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  
  @media (max-width: 992px) {
    grid-template-columns: 250px 1fr;
    gap: 15px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ProfileSidebar = styled.div`
  background: rgba(26, 27, 35, 0.6);
  border-radius: 16px;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 12px;
  }
`;

const ProfileContent = styled.div`
  background: rgba(26, 27, 35, 0.6);
  border-radius: 16px;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 12px;
  }
`;

const ProfileAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 20px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    margin-bottom: 15px;
  }
  
  @media (max-width: 480px) {
    width: 80px;
    height: 80px;
    margin-bottom: 10px;
  }
`;

const ProfileName = styled.h2`
  font-size: 24px;
  color: #fff;
  text-align: center;
  margin-bottom: 10px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const ProfileEmail = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 20px;
  
  @media (max-width: 480px) {
    font-size: 12px;
    margin-bottom: 15px;
  }
`;

const ProfileMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ProfileMenuItem = styled.li`
  margin-bottom: 10px;
  
  a, button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    border-radius: 8px;
    color: #fff;
    text-decoration: none;
    transition: all 0.3s;
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-size: 16px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  @media (max-width: 768px) {
    margin-bottom: 8px;
    
    a, button {
      padding: 10px 12px;
      font-size: 14px;
    }
  }
`;

const WalletCard = styled.div`
  background: rgba(26, 27, 35, 0.8);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    padding: 12px;
    margin-bottom: 15px;
  }
`;

const WalletHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  h3 {
    font-size: 18px;
    color: #fff;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 12px;
    
    h3 {
      font-size: 16px;
    }
  }
`;

const WalletBalance = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 12px;
  }
`;

const WalletActions = styled.div`
  display: flex;
  gap: 10px;
  
  button {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
  
  @media (max-width: 768px) {
    gap: 8px;
    
    button {
      padding: 8px;
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const AssetList = styled.div`
  margin-top: 20px;
  
  @media (max-width: 768px) {
    margin-top: 15px;
  }
`;

const AssetItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    padding: 10px 0;
  }
`;

const AssetInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  img {
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }
  
  @media (max-width: 768px) {
    gap: 8px;
    
    img {
      width: 24px;
      height: 24px;
    }
  }
`;

const AssetName = styled.div`
  h4 {
    font-size: 16px;
    color: #fff;
    margin: 0 0 4px;
  }
  
  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }
  
  @media (max-width: 768px) {
    h4 {
      font-size: 14px;
      margin: 0 0 2px;
    }
    
    p {
      font-size: 11px;
    }
  }
`;

const AssetValue = styled.div`
  text-align: right;
  
  h4 {
    font-size: 16px;
    color: #fff;
    margin: 0 0 4px;
  }
  
  p {
    font-size: 12px;
    color: ${props => props.$isPositive ? '#0ECB81' : '#F6465D'};
    margin: 0;
  }
  
  @media (max-width: 768px) {
    h4 {
      font-size: 14px;
      margin: 0 0 2px;
    }
    
    p {
      font-size: 11px;
    }
  }
`;

const StyledTabs = styled(Tabs)`
  .react-tabs__tab-list {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin: 0 0 20px;
    padding: 0;
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
  
  .react-tabs__tab {
    display: inline-block;
    border: none;
    border-bottom: 2px solid transparent;
    bottom: -1px;
    position: relative;
    list-style: none;
    padding: 12px 20px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.6);
    background: transparent;
    white-space: nowrap;
    
    &--selected {
      color: #fff;
      border-bottom: 2px solid #f79533;
    }
  }
  
  @media (max-width: 768px) {
    .react-tabs__tab-list {
      margin: 0 0 15px;
    }
    
    .react-tabs__tab {
      padding: 10px 15px;
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .react-tabs__tab {
      padding: 8px 12px;
      font-size: 13px;
    }
  }
`;

function UserProfile(props) {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({
        displayName: '',
        email: '',
        phoneNumber: '',
        photoURL: '',
    });

    const [dataCoinTab] = useState([
        {
            id: 1,
            title: 'User Profile',
            icon: 'fa-user'
        },
        {
            id: 2,
            title: 'Balances',
            icon: 'fa-wallet'
        },
        {
            id: 3,
            title: 'Bonus',
            icon: 'fa-gift'
        },
        {
            id: 4,
            title: 'Referrals',
            icon: 'fa-share-nodes'
        },
        {
            id: 5,
            title: '2FA',
            icon: 'fa-barcode'
        },
        {
            id: 6,
            title: 'Change password',
            icon: 'fa-lock'
        },
    ]);

    const [balances, setBalances] = useState({});
    const [positions, setPositions] = useState([]);
    const [totalPnL, setTotalPnL] = useState(0);
    const [tokenPrices, setTokenPrices] = useState({
        RIPPLEX: 1 // Set a fixed price of $1 for RIPPLEX token
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [editBalance, setEditBalance] = useState({ token: '', amount: '' });
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [sentVerificationCode, setSentVerificationCode] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [bonusAccount, setBonusAccount] = useState(null);
    const [loadingBonus, setLoadingBonus] = useState(true);
    const [referralData, setReferralData] = useState(null);
    const [loadingReferrals, setLoadingReferrals] = useState(true);
    const [copySuccess, setCopySuccess] = useState('');

    const calculateTotalBalance = useMemo(() => {
        return Object.entries(balances).reduce((total, [asset, balance]) => {
            // Use a fixed price of $1 for RIPPLEX token
            const price = asset === 'RIPPLEX' ? 1 : (tokenPrices[asset] || 0);
            const usdValue = balance * price;
            return total + usdValue;
        }, 0);
    }, [balances, tokenPrices]);

    // Check if user is authenticated
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            setError(''); // Clear any previous errors
            try {
                const user = auth.currentUser;
                
                if (!user) {
                    console.log("No authenticated user found");
                    navigate('/login');
                    return;
                }
                
                console.log("Current user:", user.uid);
                
                try {
                    // Get Firestore user document
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    
                    if (userDoc.exists()) {
                        console.log("User document exists in Firestore");
                        const userData = userDoc.data();
                        
                        // Check if this is a Google account (has provider data)
                        const isGoogleAccount = userData.authProvider === 'google';
                        
                        // Use default image for non-Google accounts
                        const photoURL = isGoogleAccount ? user.photoURL : img;
                        
                        setUserData({
                            displayName: user.displayName || '',
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            photoURL: photoURL
                        });
                    } else {
                        console.log("User document doesn't exist, creating default data");
                        // No user document, use auth data with default image
                        setUserData({
                            displayName: user.displayName || '',
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            photoURL: img
                        });
                        
                        // Create a default user document if it doesn't exist
                        try {
                            await setDoc(doc(db, 'users', user.uid), {
                                email: user.email,
                                displayName: user.displayName || '',
                                createdAt: serverTimestamp(),
                                emailVerified: true
                            });
                            console.log("Created new user document");
                        } catch (docCreateError) {
                            console.error("Error creating user document:", docCreateError);
                        }
                    }
                } catch (firestoreError) {
                    console.error("Error accessing Firestore:", firestoreError);
                    setError('Error retrieving user profile data');
                    return;
                }
                
                // Check if user is authenticated with Google
                const isGoogleAuth = user.providerData.some(
                    (provider) => provider.providerId === 'google.com'
                );
                setIsGoogleUser(isGoogleAuth);
                
                try {
                    // Fetch user balances
                    await fetchBalances();
                } catch (balanceError) {
                    console.error("Error fetching balances:", balanceError);
                    // Continue even if balances fail
                }
                
                try {
                    // Fetch prices
                    await fetchPrices();
                } catch (priceError) {
                    console.error("Error fetching prices:", priceError);
                    // Continue even if prices fail
                }
                
                try {
                    // Check 2FA status
                    await checkTwoFactorStatus(user.uid);
                } catch (twoFAError) {
                    console.error("Error checking 2FA status:", twoFAError);
                    // Continue even if 2FA check fails
                }
                
            } catch (error) {
                console.error('Error in fetchUserData:', error);
                setError('Failed to load user data: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [navigate]);

    // Fetch all users for admin
    useEffect(() => {
        if (isAdmin) {
            const fetchUsers = async () => {
                try {
                    const usersSnapshot = await getDocs(collection(db, 'users'));
                    const usersData = usersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        email: doc.data().email,
                        balances: doc.data().balances || {}
                    }));
                    setUsers(usersData);
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };
            fetchUsers();
        }
    }, [isAdmin]);

    // Initialize or update user balances
    const initializeUserBalances = async (userId) => {
        try {
            console.log("Initializing balances for user:", userId);
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                console.log("User document exists, updating balances");
                const currentBalances = userDoc.data().balances || {};
                const updatedBalances = {};
                
                // Initialize all coins with 0 if they don't exist
                Object.keys(DEFAULT_COINS).forEach(coin => {
                    updatedBalances[coin] = currentBalances[coin] || 0;
                });
                
                // Update the user document with complete balance set
                try {
                    await updateDoc(userRef, {
                        balances: updatedBalances,
                        updatedAt: serverTimestamp()
                    });
                    console.log("Updated user balances in Firestore");
                } catch (updateError) {
                    console.error("Error updating balances in Firestore:", updateError);
                    // Return the balances anyway even if we couldn't update Firestore
                }
                
                return updatedBalances;
            } else {
                console.log("User document doesn't exist, creating default balances");
                // If user doc doesn't exist, create default balances
                const defaultBalances = {};
                Object.keys(DEFAULT_COINS).forEach(coin => {
                    defaultBalances[coin] = 0;
                });
                
                // Try to create a user document with default balances
                try {
                    await setDoc(userRef, {
                        email: auth.currentUser.email,
                        displayName: auth.currentUser.displayName || '',
                        balances: defaultBalances,
                        createdAt: serverTimestamp(),
                        emailVerified: true
                    });
                    console.log("Created new user document with default balances");
                } catch (setError) {
                    console.error("Error creating user document with balances:", setError);
                }
                
                return defaultBalances;
            }
        } catch (error) {
            console.error('Error initializing balances:', error);
            // Return empty balances object as fallback
            const fallbackBalances = {};
            Object.keys(DEFAULT_COINS).forEach(coin => {
                fallbackBalances[coin] = 0;
            });
            return fallbackBalances;
        }
    };

    // Modified balance fetching
    useEffect(() => {
        if (auth.currentUser) {
            const fetchBalances = async () => {
                try {
                    const updatedBalances = await initializeUserBalances(auth.currentUser.uid);
                    setBalances(updatedBalances);
                } catch (error) {
                    console.error('Error fetching balances:', error);
                    setError('Failed to fetch balances');
                }
            };

            fetchBalances();
        }
    }, []);

    // Function to fetch cryptocurrency prices
    const fetchPrices = async () => {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,cardano,dogecoin,solana,binancecoin,matic-network,polkadot,avalanche-2,chainlink,uniswap,cosmos&vs_currencies=usd');
            const data = await response.json();
            
            // Create a mapping from our token symbols to prices
            const prices = {
                ...tokenPrices, // Preserve existing prices, especially RIPPLEX
                BTC: data.bitcoin?.usd || 0,
                ETH: data.ethereum?.usd || 0,
                XRP: data.ripple?.usd || 0,
                ADA: data.cardano?.usd || 0,
                DOGE: data.dogecoin?.usd || 0,
                SOL: data.solana?.usd || 0,
                BNB: data.binancecoin?.usd || 0,
                MATIC: data['matic-network']?.usd || 0,
                DOT: data.polkadot?.usd || 0,
                AVAX: data['avalanche-2']?.usd || 0,
                LINK: data.chainlink?.usd || 0,
                UNI: data.uniswap?.usd || 0,
                ATOM: data.cosmos?.usd || 0,
                USDT: 1
            };
            
            setTokenPrices(prices);
        } catch (error) {
            console.error('Error fetching token prices:', error);
        }
    };

    useEffect(() => {
        if (auth.currentUser) {
            const checkAdminStatus = async () => {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                setIsAdmin(userDoc.data()?.isAdmin || false);
            };
            checkAdminStatus();
        }
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const user = auth.currentUser;
            if (user) {
                // Only update displayName, never update photoURL
                // This ensures the profile picture remains unchanged
                const updateData = {
                    displayName: userData.displayName || user.displayName
                };
                
                // Only call updateProfile if we have data to update
                if (updateData.displayName) {
                    await updateProfile(user, updateData);
                    
                    // Also update the user document in Firestore, but preserve the photoURL
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, {
                        displayName: updateData.displayName,
                        updatedAt: serverTimestamp()
                    });
                    
                    setSuccess('Profile updated successfully!');
                    setTimeout(() => setSuccess(''), 3000);
                } else {
                    setError('No changes to update.');
                }
            }
        } catch (err) {
            setError(err.message);
            console.error('Error updating profile:', err);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (err) {
            setError(err.message);
            console.error('Error signing out:', err);
        }
    };

    // Remove image change functionality by making this a no-op function
    const handleImageChange = (e) => {
        // Do nothing - we don't want to allow image changes
        // This function is kept to avoid breaking any existing code
    };

    const handleUpdateBalance = async () => {
        if (!selectedUser || !editBalance.token || editBalance.amount === '') return;
        
        try {
            const userRef = doc(db, 'users', selectedUser);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const currentBalances = userDoc.data().balances || {};
                const updatedBalances = { ...currentBalances };
                updatedBalances[editBalance.token] = Number(editBalance.amount);
                
                await updateDoc(userRef, {
                    balances: updatedBalances
                });
                
                // Update local state if modifying current user
                if (selectedUser === auth.currentUser.uid) {
                    setBalances(updatedBalances);
                }
                
                // Update users list
                setUsers(prevUsers => 
                    prevUsers.map(user => 
                        user.id === selectedUser 
                            ? { ...user, balances: updatedBalances }
                            : user
                    )
                );
                
                setEditBalance({ token: '', amount: '' });
                alert('Balance updated successfully!');
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            setError('Failed to update balance');
        }
    };

    // Add conversion handler
    const handleConvert = async (conversionData) => {
        try {
            const { fromCoin, toCoin, fromAmount, toAmount } = conversionData;
            
            // Update balances in Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const currentBalances = userDoc.data().balances;
                const updatedBalances = { ...currentBalances };
                
                // Deduct from source coin
                updatedBalances[fromCoin] = (currentBalances[fromCoin] || 0) - fromAmount;
                // Add to destination coin
                updatedBalances[toCoin] = (currentBalances[toCoin] || 0) + toAmount;

                // Update Firestore
                await updateDoc(userRef, {
                    balances: updatedBalances
                });

                // Update local state
                setBalances(updatedBalances);
                setSuccess('Conversion successful!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Conversion error:', error);
            setError('Failed to convert currencies');
        }
    };

    // Check if 2FA is enabled for this user
    const checkTwoFactorStatus = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setIs2FAEnabled(userData.twoFactorEnabled || false);
            }
        } catch (error) {
            console.error('Error checking 2FA status:', error);
        }
    };
    
    // Send verification code for 2FA
    const sendTwoFactorVerificationCode = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (!userData.email) {
                setError('Email not found');
                return;
            }
            
            // Import dynamically to avoid server-side issues
            const { generateVerificationCode, sendVerificationEmail } = await import('../utils/emailService');
            
            // Generate a 6-digit code
            const code = generateVerificationCode();
            setSentVerificationCode(code);
            
            // Send the code via email
            await sendVerificationEmail(userData.email, code);
            
            setSuccess('Verification code sent to your email');
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            console.error('Error sending verification code:', error);
            setError('Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    // Verify the code and enable/disable 2FA
    const handleToggle2FA = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (verificationCode !== sentVerificationCode) {
                setError('Invalid verification code');
                setLoading(false);
                return;
            }
            
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                twoFactorEnabled: !is2FAEnabled,
                twoFactorUpdatedAt: serverTimestamp()
            });
            
            // Send email confirmation of 2FA status change
            const { send2FAStatusChangeEmail } = await import('../utils/emailService');
            await send2FAStatusChangeEmail(userData.email, !is2FAEnabled);
            
            setIs2FAEnabled(!is2FAEnabled);
            setSuccess(`Two-factor authentication ${!is2FAEnabled ? 'enabled' : 'disabled'} successfully`);
            
            // Reset verification code fields
            setVerificationCode('');
            setSentVerificationCode('');
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error toggling 2FA:', error);
            setError('Failed to update 2FA settings');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle password change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError('');
            
            // Validate passwords
            if (newPassword !== confirmPassword) {
                setError("New passwords don't match");
                return;
            }
            
            if (newPassword.length < 6) {
                setError("Password must be at least 6 characters");
                return;
            }
            
            // Reauthenticate with Firebase
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(
                user.email,
                oldPassword
            );
            
            await reauthenticateWithCredential(user, credential);
            
            // Update password
            await updatePassword(user, newPassword);
            
            // Send confirmation email
            const { sendPasswordChangeConfirmation } = await import('../utils/emailService');
            await sendPasswordChangeConfirmation(user.email);
            
            // Reset form
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            setSuccess('Password updated successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error changing password:', error);
            
            if (error.code === 'auth/wrong-password') {
                setError('Current password is incorrect');
            } else if (error.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later');
            } else {
                setError('Failed to change password: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    // Add functions to fetch bonus and referral data
    const fetchBonusAccount = async () => {
        if (!auth.currentUser) return;
        
        try {
            setLoadingBonus(true);
            const bonusData = await tradingService.getUserBonusAccount(auth.currentUser.uid);
            setBonusAccount(bonusData);
        } catch (error) {
            console.error('Error fetching bonus account:', error);
        } finally {
            setLoadingBonus(false);
        }
    };

    const fetchReferralData = async () => {
        if (!auth.currentUser) return;
        
        try {
            setLoadingReferrals(true);
            
            // First check if user has a referral code, generate one if not
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            const userData = userDoc.data();
            
            if (!userData.referralCode) {
                await referralService.generateReferralCode(
                    auth.currentUser.uid, 
                    userData.displayName || auth.currentUser.email.split('@')[0]
                );
            }
            
            // Then get full referral stats
            const referralStats = await referralService.getReferralStats(auth.currentUser.uid);
            setReferralData(referralStats);
        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setLoadingReferrals(false);
        }
    };

    const handleCopyReferralLink = async () => {
        if (!referralData?.referralLink) return;
        
        try {
            await navigator.clipboard.writeText(referralData.referralLink);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 3000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setCopySuccess('Failed to copy');
        }
    };

    const handleCopyReferralCode = async () => {
        if (!referralData?.referralCode) return;
        
        try {
            await navigator.clipboard.writeText(referralData.referralCode);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 3000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            setCopySuccess('Failed to copy');
        }
    };

    // Add useEffect to load bonus and referral data
    useEffect(() => {
        if (auth.currentUser) {
            fetchBonusAccount();
            fetchReferralData();
        }
    }, []);

    // Format wallet address for display

    // Fetch token prices periodically
    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update prices every minute
        return () => clearInterval(interval);
    }, []);
         
    // Only check admin status once when component mounts
    useEffect(() => {
        const checkAdminStatusOnMount = async () => {
            if (auth.currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                    setIsAdmin(userDoc.data()?.isAdmin || false);
                } catch (error) {
                    console.error('Error checking admin status:', error);
                }
            }
        };
        
        checkAdminStatusOnMount();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    // Update the admin controls JSX
    const renderAdminControls = () => (
        <div style={{
            marginTop: '24px',
            padding: '24px',
            background: '#1E1E2D',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <h4 style={{ marginBottom: '16px' }}>Admin Controls</h4>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <select 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                    style={{
                        background: '#2A2A3C',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px',
                        color: '#fff',
                        minWidth: '200px'
                    }}
                >
                    <option value="">Select User</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
                </select>
                <select 
                    value={editBalance.token}
                    onChange={(e) => setEditBalance(prev => ({ ...prev, token: e.target.value }))}
                    style={{
                        background: '#2A2A3C',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px',
                        color: '#fff',
                        minWidth: '150px'
                    }}
                >
                    <option value="">Select Token</option>
                    {Object.entries(DEFAULT_COINS).map(([symbol, coin]) => (
                        <option key={symbol} value={symbol}>
                            {coin.name} ({symbol})
                        </option>
                    ))}
                </select>
                <input 
                    type="number"
                    value={editBalance.amount}
                    onChange={(e) => setEditBalance(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Amount"
                    style={{
                        background: '#2A2A3C',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px',
                        color: '#fff',
                        minWidth: '120px'
                    }}
                />
                <button 
                    onClick={handleUpdateBalance}
                    className="btn-action"
                    style={{
                        background: '#4A6BF3',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#fff'
                    }}
                >
                    Update Balance
                </button>
            </div>
            {selectedUser && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'rgba(74,107,243,0.1)',
                    borderRadius: '8px'
                }}>
                    <h5 style={{ marginBottom: '12px', color: '#fff' }}>Current Balances</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {users.find(u => u.id === selectedUser)?.balances && 
                            Object.entries(users.find(u => u.id === selectedUser).balances).map(([coin, balance]) => (
                                <div key={coin} style={{
                                    padding: '8px',
                                    background: '#2A2A3C',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>{coin}:</span>
                                    <span>{balance}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );

    // Update the balance actions JSX in the return statement
    const renderBalanceActions = () => (
        <div className="balance-actions" style={{
            display: 'flex',
            gap: '12px'
        }}>
            <button 
                onClick={() => navigate('/deposit')}
                disabled={loading}
                className="btn-action" 
                style={{
                    background: '#4A6BF3',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}
            >
                Deposit Funds
            </button>
            <button 
                className="btn-action" 
                onClick={() => setShowConvertModal(true)}
                style={{
                    background: '#2A2A3C',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}
            >
                Convert
            </button>
            <button 
                className="btn-action" 
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}
            >
                Withdraw
            </button>
        </div>
    );

    return (
        <div>
            <PageTitle heading='User Profile' title='User' />

            <section className="user-profile flat-tabs">
                <div className="container">
                    <div className="row">
                        <Tabs>
                            <TabList>
                                <div className="user-info center">
                                    <div className="avt">
                                        <img id="blah" src={userData.photoURL || img} alt="Profile" />
                                    </div>
                                    
                                    <h6 className="name">{userData.displayName || 'Update your name'}</h6>
                                    <p>{userData.email}</p>
                                </div>
                                {
                                    dataCoinTab.map(idx => (
                                        <Tab key={idx.id}><h6 className="fs-16">
                                            <i className={`fa ${idx.icon}`}></i>
                                            {idx.title}
                                        </h6></Tab>
                                    ))
                                }
                            </TabList>

                            <TabPanel>
                                <div className="content-inner profile">
                                    <form onSubmit={handleUpdateProfile}>
                                        <h4>User Profile</h4>
                                        <h6>Information</h6>

                                        {success && <div className="alert alert-success">{success}</div>}
                                        {error && <div className="alert alert-danger">{error}</div>}

                                        <div className="form-group d-flex s1">
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="Display Name"
                                                value={userData.displayName}
                                                onChange={(e) => setUserData(prev => ({
                                                    ...prev,
                                                    displayName: e.target.value
                                                }))}
                                            />
                                        </div>
                                        <div className="form-group d-flex">
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={userData.email}
                                                disabled
                                            />
                                            <div className="sl">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Your Phone number"
                                                    value={userData.phoneNumber}
                                                    onChange={(e) => setUserData(prev => ({
                                                        ...prev,
                                                        phoneNumber: e.target.value
                                                    }))}
                                                />
                                            </div>
                                        </div>

                                        <button type="submit" className="btn-action">
                                            Update Profile
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleSignOut}
                                            className="btn-action"
                                            style={{marginTop: '10px', backgroundColor: '#dc3545'}}
                                        >
                                            Sign Out
                                        </button>
                                    </form>
                                </div>
                            </TabPanel>

                            <TabPanel>
                                <div className="content-inner profile">
                                    <h4 className="balance-title">Balances</h4>
                                    <AnimatedBorder>
                                        <GalaxyBackground>
                                            <div className="balance-overview" style={{
                                                padding: '24px',
                                                marginBottom: '24px',
                                                position: 'relative',
                                                zIndex: 1
                                            }}>
                                                <div className="balance-header" style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '20px'
                                                }}>
                                                    <div className="balance-info">
                                                        <p style={{ 
                                                            color: '#7A7A7A',
                                                            fontSize: '14px',
                                                            marginBottom: '8px'
                                                        }}>Total Balance (USDT)</p>
                                                        <h3 style={{
                                                            fontSize: '32px',
                                                            fontWeight: '600',
                                                            color: '#fff',
                                                            marginBottom: '8px'
                                                        }}>${calculateTotalBalance.toFixed(2)}</h3>
                                                        <p style={{
                                                            color: totalPnL >= 0 ? '#0ECB81' : '#F6465D',
                                                            fontSize: '14px',
                                                            fontWeight: '500'
                                                        }}>
                                                            Total PnL: ${totalPnL.toFixed(2)}
                                                        </p>
                                                    </div>
                                                    {renderBalanceActions()}
                                                </div>
                                            </div>
                                        </GalaxyBackground>
                                    </AnimatedBorder>

                                    <AnimatedBorder style={{ marginTop: '24px' }}>
                                        <div className="assets-table" style={{
                                            background: '#1E1E2D',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            <table className="table" style={{
                                                width: '100%',
                                                borderCollapse: 'separate',
                                                borderSpacing: '0',
                                                color: '#fff'
                                            }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{
                                                            padding: '16px',
                                                            color: '#7A7A7A',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            textAlign: 'left',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                                        }}>#</th>
                                                        <th style={{
                                                            padding: '16px',
                                                            color: '#7A7A7A',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            textAlign: 'left',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                                        }}>Asset</th>
                                                        <th style={{
                                                            padding: '16px',
                                                            color: '#7A7A7A',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            textAlign: 'right',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                                        }}>Available Balance</th>
                                                        <th style={{
                                                            padding: '16px',
                                                            color: '#7A7A7A',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            textAlign: 'right',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                                        }}>In Orders</th>
                                                        <th style={{
                                                            padding: '16px',
                                                            color: '#7A7A7A',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            textAlign: 'right',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                                        }}>Total Value (USDT)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.keys(balances).length > 0 ? (
                                                        Object.entries(balances).map(([asset, balance], index) => {
                                                            // Use a fixed price of $1 for RIPPLEX token
                                                            const price = asset === 'RIPPLEX' ? 1 : (tokenPrices[asset] || 0);
                                                            const usdValue = balance * price;
                                                            const isRipplex = asset === 'RIPPLEX';
                                                            return (
                                                                <tr key={asset} style={{
                                                                    transition: 'all 0.3s',
                                                                    background: isRipplex ? 'rgba(255, 145, 0, 0.1)' : 'transparent'
                                                                }}>
                                                                    <td style={{
                                                                        padding: '16px',
                                                                        fontSize: '14px',
                                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                                    }}>{index + 1}</td>
                                                                    <td style={{
                                                                        padding: '16px',
                                                                        fontSize: '14px',
                                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                                    }}>
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '12px'
                                                                        }}>
                                                                            <img 
                                                                                src={COIN_LOGOS[asset] || `https://cryptologos.cc/logos/${asset.toLowerCase()}-${asset.toLowerCase()}-logo.png`} 
                                                                                alt={asset}
                                                                                style={{
                                                                                    width: '32px',
                                                                                    height: '32px',
                                                                                    borderRadius: '50%',
                                                                                    background: '#2A2A3C',
                                                                                    boxShadow: isRipplex ? '0 0 10px rgba(255, 145, 0, 0.5)' : 'none'
                                                                                }}
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.src = 'https://cryptologos.cc/logos/question-mark.png';
                                                                                }}
                                                                            />
                                                                            <div>
                                                                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                                                                    {asset}
                                                                                    {isRipplex && (
                                                                                        <span style={{ 
                                                                                            marginLeft: '8px', 
                                                                                            background: 'linear-gradient(90deg, #FF9100, #FFC400)', 
                                                                                            padding: '2px 6px', 
                                                                                            borderRadius: '4px',
                                                                                            fontSize: '10px',
                                                                                            color: 'black',
                                                                                            fontWeight: 'bold',
                                                                                            verticalAlign: 'middle'
                                                                                        }}>
                                                                                            AIRDROP
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{
                                                                                    fontSize: '12px',
                                                                                    color: '#7A7A7A',
                                                                                    marginTop: '2px'
                                                                                }}>
                                                                                    {asset === 'USDT' ? 'Tether USD' : 
                                                                                     asset === 'RIPPLEX' ? 'Ripple Exchange Token' : 
                                                                                     asset}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{
                                                                        padding: '16px',
                                                                        fontSize: '14px',
                                                                        textAlign: 'right',
                                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                                    }}>
                                                                        <span style={{ fontWeight: '500' }}>{balance.toFixed(8)}</span>
                                                                        <span style={{ color: '#7A7A7A', marginLeft: '4px' }}>{asset}</span>
                                                                    </td>
                                                                    <td style={{
                                                                        padding: '16px',
                                                                        fontSize: '14px',
                                                                        textAlign: 'right',
                                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                                    }}>
                                                                        <span style={{ fontWeight: '500' }}>0.00000000</span>
                                                                        <span style={{ color: '#7A7A7A', marginLeft: '4px' }}>{asset}</span>
                                                                    </td>
                                                                    <td style={{
                                                                        padding: '16px',
                                                                        fontSize: '14px',
                                                                        textAlign: 'right',
                                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                                    }}>
                                                                        <span style={{ fontWeight: '500' }}>${usdValue.toFixed(2)}</span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" style={{
                                                                textAlign: 'center',
                                                                padding: '20px',
                                                                color: '#7A7A7A'
                                                            }}>
                                                                Loading balances...
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </AnimatedBorder>

                                    {isAdmin && renderAdminControls()}
                                </div>
                            </TabPanel>

                            <TabPanel>
                                <div className="content-inner profile">
                                    <h4 className="balance-title">Liquidation Protection Bonus</h4>
                                    
                                    {loadingBonus ? (
                                        <div style={{ textAlign: 'center', padding: '30px' }}>
                                            Loading bonus information...
                                        </div>
                                    ) : !bonusAccount || !bonusAccount.exists ? (
                                        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                                            <p>You don't have any active bonuses at the moment.</p>
                                        </div>
                                    ) : (
                                        <AnimatedBorder>
                                            <GalaxyBackground>
                                                <div style={{
                                                    padding: '24px',
                                                    position: 'relative',
                                                    zIndex: 1
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        marginBottom: '20px'
                                                    }}>
                                        <div>
                                                            <h3 style={{ color: '#0ECB81', fontSize: '28px', marginBottom: '10px' }}>
                                                                {bonusAccount.formattedAmount}
                                                            </h3>
                                                            <p style={{ color: '#fff' }}>
                                                                Status: <span style={{ 
                                                                    color: bonusAccount.isActive ? '#0ECB81' : '#F6465D', 
                                                                    fontWeight: '500' 
                                                                }}>
                                                                    {bonusAccount.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </p>
                                                            {bonusAccount.expiryDate && (
                                                                <p style={{ color: '#fff', marginTop: '5px' }}>
                                                                    Expires: {bonusAccount.expiryDate.toLocaleDateString()}
                                                                </p>
                                                            )}
                                        </div>
                                                        <div style={{
                                                            background: 'rgba(14, 203, 129, 0.1)',
                                                            borderRadius: '8px',
                                                            padding: '15px',
                                                            maxWidth: '300px'
                                                        }}>
                                                            <h5 style={{ color: '#0ECB81', marginBottom: '10px' }}>How it works</h5>
                                                            <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.5' }}>
                                                                This bonus is automatically used to protect your funds from liquidation 
                                                                when your position would otherwise be liquidated due to market movements.
                                                            </p>
                                    </div>
                                    </div>

                                                    <div style={{ marginTop: '30px' }}>
                                                        <h4 style={{ color: '#fff', marginBottom: '15px' }}>Protection Details</h4>
                                                        
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                            gap: '20px'
                                                        }}>
                                                            <div style={{
                                                                background: 'rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '8px',
                                                                padding: '15px'
                                                            }}>
                                                                <h5 style={{ color: '#F7931A', marginBottom: '10px' }}>Protected Amount</h5>
                                                                <p style={{ color: '#ddd', fontSize: '14px' }}>
                                                                    Your bonus can protect positions up to <strong>{bonusAccount.formattedAmount}</strong> from liquidation.
                                                                </p>
                                                            </div>
                                                            
                                                            <div style={{
                                                                background: 'rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '8px',
                                                                padding: '15px'
                                                            }}>
                                                                <h5 style={{ color: '#F7931A', marginBottom: '10px' }}>Eligibility</h5>
                                                                <p style={{ color: '#ddd', fontSize: '14px' }}>
                                                                    Any trading position you open with your deposited funds is eligible for liquidation protection.
                                                                </p>
                                                            </div>
                                                            
                                                            <div style={{
                                                                background: 'rgba(255, 255, 255, 0.05)',
                                                                borderRadius: '8px',
                                                                padding: '15px'
                                                            }}>
                                                                <h5 style={{ color: '#F7931A', marginBottom: '10px' }}>Activation</h5>
                                                                <p style={{ color: '#ddd', fontSize: '14px' }}>
                                                                    Bonus is automatically applied when a position would otherwise be liquidated.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {bonusAccount.bonusAccount?.usageHistory && bonusAccount.bonusAccount.usageHistory.length > 0 && (
                                                        <div style={{ marginTop: '30px' }}>
                                                            <h4 style={{ color: '#fff', marginBottom: '15px' }}>Usage History</h4>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                <thead>
                                                                    <tr>
                                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Date</th>
                                                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Amount</th>
                                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Position</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {bonusAccount.bonusAccount.usageHistory.map((usage, index) => (
                                                                        <tr key={index}>
                                                                            <td style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                                {usage.date ? new Date(usage.date.seconds * 1000).toLocaleString() : 'N/A'}
                                                                            </td>
                                                                            <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                                ${usage.amount.toFixed(2)}
                                                                            </td>
                                                                            <td style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                                {usage.positionId}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </GalaxyBackground>
                                        </AnimatedBorder>
                                    )}
                                </div>
                            </TabPanel>

                            <TabPanel>
                                <div className="content-inner referrals">
                                    <h4 style={{ marginBottom: '15px' }}>Referral Program</h4>
                                    
                                    {loadingReferrals ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            Loading referral information...
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ 
                                                background: 'linear-gradient(135deg, rgba(74,107,243,0.1) 0%, rgba(247,147,26,0.1) 100%)',
                                                padding: '20px',
                                                borderRadius: '10px',
                                                marginBottom: '20px'
                                            }}>
                                                <h5 style={{ color: '#F7931A', marginBottom: '10px' }}>How it works</h5>
                                                <p style={{ marginBottom: '15px' }}>
                                                    Invite friends to Ripple Exchange and earn 10% of their deposits as commission!
                                                </p>
                                                
                                                <ul style={{ listStyleType: 'none', padding: '0', margin: '0' }}>
                                                    <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                                        <span style={{ 
                                                            display: 'inline-block', 
                                                            width: '24px', 
                                                            height: '24px', 
                                                            borderRadius: '50%', 
                                                            background: '#F7931A', 
                                                            color: '#fff', 
                                                            textAlign: 'center', 
                                                            lineHeight: '24px', 
                                                            marginRight: '10px' 
                                                        }}>1</span>
                                                        Share your referral link with friends
                                                    </li>
                                                    <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                                        <span style={{ 
                                                            display: 'inline-block', 
                                                            width: '24px', 
                                                            height: '24px', 
                                                            borderRadius: '50%', 
                                                            background: '#F7931A', 
                                                            color: '#fff', 
                                                            textAlign: 'center', 
                                                            lineHeight: '24px', 
                                                            marginRight: '10px' 
                                                        }}>2</span>
                                                        They sign up using your link and make deposits
                                                    </li>
                                                    <li style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ 
                                                            display: 'inline-block', 
                                                            width: '24px', 
                                                            height: '24px', 
                                                            borderRadius: '50%', 
                                                            background: '#F7931A', 
                                                            color: '#fff', 
                                                            textAlign: 'center', 
                                                            lineHeight: '24px', 
                                                            marginRight: '10px' 
                                                        }}>3</span>
                                                        You earn 10% commission on their deposits
                                                    </li>
                                                </ul>
                                            </div>
                                            
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                marginBottom: '30px',
                                                flexWrap: 'wrap'
                                            }}>
                                                <div style={{ 
                                                    flex: '1 1 200px', 
                                                    background: 'rgba(255,255,255,0.05)', 
                                                    padding: '20px', 
                                                    borderRadius: '10px',
                                                    margin: '0 10px 10px 0'
                                                }}>
                                                    <h5 style={{ color: '#7A7A7A', fontSize: '14px', marginBottom: '5px' }}>Total Referrals</h5>
                                                    <h3 style={{ color: '#fff', fontSize: '24px' }}>
                                                        {referralData?.stats?.totalReferrals || 0}
                                                    </h3>
                                                </div>
                                                
                                                <div style={{ 
                                                    flex: '1 1 200px', 
                                                    background: 'rgba(255,255,255,0.05)', 
                                                    padding: '20px', 
                                                    borderRadius: '10px',
                                                    margin: '0 10px 10px 0'
                                                }}>
                                                    <h5 style={{ color: '#7A7A7A', fontSize: '14px', marginBottom: '5px' }}>Active Referrals</h5>
                                                    <h3 style={{ color: '#fff', fontSize: '24px' }}>
                                                        {referralData?.stats?.activeReferrals || 0}
                                                    </h3>
                                                </div>
                                                
                                                <div style={{ 
                                                    flex: '1 1 200px', 
                                                    background: 'rgba(255,255,255,0.05)', 
                                                    padding: '20px', 
                                                    borderRadius: '10px',
                                                    margin: '0 0 10px 0'
                                                }}>
                                                    <h5 style={{ color: '#7A7A7A', fontSize: '14px', marginBottom: '5px' }}>Total Commission</h5>
                                                    <h3 style={{ color: '#0ECB81', fontSize: '24px' }}>
                                                        ${(referralData?.stats?.totalCommission || 0).toFixed(2)}
                                                    </h3>
                                                </div>
                                            </div>
                                            
                                            <div style={{ marginBottom: '30px' }}>
                                                <h4 style={{ marginBottom: '15px' }}>Your Referral Links</h4>
                                                
                                                <div style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '20px',
                                                    borderRadius: '10px',
                                                    marginBottom: '20px'
                                                }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', color: '#7A7A7A' }}>Referral Link</label>
                                                    <div style={{ display: 'flex', marginBottom: '15px' }}>
                                        <input
                                                            type="text"
                                                            readOnly
                                            className="form-control"
                                                            value={referralData?.referralLink || ''}
                                                            style={{ flex: '1', marginRight: '10px' }}
                                                        />
                                                        <button
                                                            onClick={handleCopyReferralLink}
                                                            className="btn-action"
                                                            style={{
                                                                background: '#4A6BF3',
                                                                border: 'none',
                                                                borderRadius: '5px',
                                                                color: '#fff',
                                                                padding: '0 15px'
                                                            }}
                                                        >
                                                            {copySuccess === 'Copied!' ? 'Copied!' : 'Copy'}
                                                        </button>
                                        </div>
                                                    
                                                    <label style={{ display: 'block', marginBottom: '5px', color: '#7A7A7A' }}>Referral Code</label>
                                                    <div style={{ display: 'flex' }}>
                                        <input
                                            type="text"
                                                            readOnly
                                                            className="form-control"
                                                            value={referralData?.referralCode || ''}
                                                            style={{ flex: '1', marginRight: '10px' }}
                                                        />
                                                        <button
                                                            onClick={handleCopyReferralCode}
                                                            className="btn-action"
                                                            style={{
                                                                background: '#4A6BF3',
                                                                border: 'none',
                                                                borderRadius: '5px',
                                                                color: '#fff',
                                                                padding: '0 15px'
                                                            }}
                                                        >
                                                            {copySuccess === 'Copied!' ? 'Copied!' : 'Copy'}
                                                        </button>
                                        </div>
                                    </div>
                                                
                                                <div style={{ 
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    marginTop: '20px'
                                                }}>
                                                    <button
                                                        className="btn-action"
                                                        style={{
                                                            background: '#F7931A',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            color: '#fff',
                                                            padding: '10px 20px'
                                                        }}
                                                        onClick={() => {
                                                            window.open("https://twitter.com/intent/tweet?text=Join%20me%20on%20Ripple%20Exchange%20and%20get%20$100%20in%20liquidation%20protection!%20" + encodeURIComponent(referralData?.referralLink || ''), '_blank');
                                                        }}
                                                    >
                                                        Share on Twitter
                                                    </button>
                                                    
                                                    <button
                                                        className="btn-action"
                                                        style={{
                                                            background: '#4267B2',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            color: '#fff',
                                                            padding: '10px 20px'
                                                        }}
                                                        onClick={() => {
                                                            window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(referralData?.referralLink || ''), '_blank');
                                                        }}
                                                    >
                                                        Share on Facebook
                                                    </button>
                                    </div>
                                            </div>
                                            
                                            {referralData?.referrals && referralData.referrals.length > 0 && (
                                                <div>
                                                    <h4 style={{ marginBottom: '15px' }}>Your Referrals</h4>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>User</th>
                                                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Date</th>
                                                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {referralData.referrals.map((referral, index) => (
                                                                <tr key={index}>
                                                                    <td style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                        {referral.userId.substring(0, 8)}...
                                                                    </td>
                                                                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                        {referral.date ? new Date(referral.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                                    </td>
                                                                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                                        <span style={{
                                                                            display: 'inline-block',
                                                                            padding: '3px 10px',
                                                                            borderRadius: '12px',
                                                                            background: referral.status === 'active' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                                                            color: referral.status === 'active' ? '#0ECB81' : '#ddd'
                                                                        }}>
                                                                            {referral.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            
                                            {referralData?.commissions && referralData.commissions.length > 0 && (
                                                <div style={{ marginTop: '30px' }}>
                                                    <h4 style={{ marginBottom: '15px' }}>Commission History</h4>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>From</th>
                                                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Date</th>
                                                                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Deposit</th>
                                                                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#7A7A7A' }}>Commission</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {referralData.commissions.map((commission, index) => (
                                                                <tr key={index}>
                                                                    <td style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                        {commission.fromUserId.substring(0, 8)}...
                                                                    </td>
                                                                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                        {commission.date ? new Date(commission.date.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                                    </td>
                                                                    <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ddd' }}>
                                                                        ${commission.depositAmount.toFixed(2)}
                                                                    </td>
                                                                    <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#0ECB81' }}>
                                                                        ${commission.amount.toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </TabPanel>
                            <TabPanel>
                                <div className="content-inner api">
                                    <h4>Two-Factor Authentication {is2FAEnabled ? <span className="color-success">Enabled</span> : <span>Disabled</span>}</h4>
                                    <p>
                                    {is2FAEnabled ? 
                                        "Two-factor authentication adds an extra layer of security to your account. To disable 2FA, you need to verify your email." : 
                                        "Enable two-factor authentication to add an extra layer of security to your account."}
                                    </p>

                                    <div className="main">
                                    <h6>{is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}</h6>
                                    <p>
                                        Enter your email verification code to {is2FAEnabled ? "disable" : "enable"} 2FA
                                    </p>

                                    <div className="refe">
                                        <div className="form-group">
                                        <p>Verification Code</p>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="6-digit code"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            maxLength={6}
                                        />
                                        <button 
                                            type="button"
                                            className="btn-action"
                                            onClick={sendTwoFactorVerificationCode}
                                            disabled={loading}
                                            style={{ marginTop: '10px' }}
                                        >
                                            {loading && !verificationCode ? "Sending..." : "Send Verification Code"}
                                        </button>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-action"
                                        onClick={handleToggle2FA}
                                        disabled={loading || !verificationCode || verificationCode.length !== 6}
                                    >
                                        {loading && verificationCode ? "Processing..." : is2FAEnabled ? "Disable 2FA verification" : "Enable 2FA verification"}
                                    </button>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel>
                                {isGoogleUser ? (
                                    <div className="content-inner profile change-pass">
                                        <h4>Password Change Not Available</h4>
                                        <p style={{ marginTop: '20px', lineHeight: '1.6' }}>
                                            Password change is not available for accounts that sign in with Google.
                                            <br /><br />
                                            To change your password, you need to update it through your Google account settings.
                                        </p>
                                    </div>
                                ) : (
                                <div className="content-inner profile change-pass">
                                    <h4>Change Password</h4>
                                        <h6>New Password</h6>
                                        <form onSubmit={handlePasswordChange}>
                                    <div className="form-group">
                                        <div>
                                                    <label>Current Password<span>*</span>:</label>
                                        <input
                                                        type="password"
                                            className="form-control"
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        required
                                        />
                                        </div>
                                                {is2FAEnabled && (
                                        <div>
                                                        <label>Verification Code<span>*</span>:</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={verificationCode}
                                                            onChange={(e) => setVerificationCode(e.target.value)}
                                                            placeholder="Enter verification code"
                                                            required={is2FAEnabled}
                                                        />
                                                        <button 
                                                            type="button"
                                                            className="btn-action"
                                                            onClick={sendTwoFactorVerificationCode}
                                                            style={{ marginTop: '10px', padding: '8px 15px', fontSize: '13px' }}
                                                        >
                                                            Send Code
                                                        </button>
                                        </div>
                                                )}
                                    </div>
                                    <div className="form-group">
                                        <div>
                                                    <label>New Password<span>*</span>:</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="New Password"
                                                        minLength="6"
                                                        required
                                        />
                                        </div>
                                        <div>
                                                    <label>Confirm Password<span>*</span>:</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm Password"
                                                        minLength="6"
                                                        required
                                        />
                                        </div>
                                    </div>
                                            
                                            {error && <div className="alert alert-danger">{error}</div>}
                                            {success && <div className="alert alert-success">{success}</div>}
                                            
                                            <button type="submit" className="btn-action" disabled={loading}>
                                                {loading ? "Processing..." : "Change Password"}
                                    </button>
                                        </form>
                                </div>
                                )}
                            </TabPanel>
                        </Tabs> 
                    </div>
                </div>
            </section>

            <Sale01 />
            
            <ConvertModal
                isOpen={showConvertModal}
                onClose={() => setShowConvertModal(false)}
                balances={balances}
                tokenPrices={tokenPrices}
                onConvert={handleConvert}
            />
            
        </div>
    );
}

export default UserProfile;