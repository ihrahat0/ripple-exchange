import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Sale01 from '../components/sale/Sale01';
import { auth } from '../firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
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

UserProfile.propTypes = {
    
};

const COIN_LOGOS = {
  BTC: btcLogo,
  ETH: ethLogo,
  USDT: usdtLogo
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

  @keyframes animatedgradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
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
            title: 'Referrals',
            icon: 'fa-share-nodes'
        },
        {
            id: 4,
            title: 'API keys',
            icon: 'fa-gear'
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
    const [tokenPrices, setTokenPrices] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [editBalance, setEditBalance] = useState({ token: '', amount: '' });
    const [showConvertModal, setShowConvertModal] = useState(false);

    const calculateTotalBalance = useMemo(() => {
        return Object.entries(balances).reduce((total, [asset, balance]) => {
            const usdValue = balance * (tokenPrices[asset] || 0);
            return total + usdValue;
        }, 0);
    }, [balances, tokenPrices]);

    // Check if user is authenticated
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserData({
                    displayName: user.displayName || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    photoURL: user.photoURL || img,
                });
            } else {
                // Redirect to login if not authenticated
                navigate('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
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
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const currentBalances = userDoc.data().balances || {};
                const updatedBalances = {};
                
                // Initialize all coins with 0 if they don't exist
                Object.keys(DEFAULT_COINS).forEach(coin => {
                    updatedBalances[coin] = currentBalances[coin] || 0;
                });
                
                // Update the user document with complete balance set
                await updateDoc(userRef, {
                    balances: updatedBalances
                });
                
                return updatedBalances;
            }
        } catch (error) {
            console.error('Error initializing balances:', error);
            throw error;
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

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                    params: {
                        ids: 'bitcoin,ethereum,solana,binancecoin,dogecoin,ripple,cardano,matic-network,polkadot',
                        vs_currencies: 'usd'
                    }
                });
                
                setTokenPrices({
                    BTC: response.data.bitcoin?.usd || 0,
                    ETH: response.data.ethereum?.usd || 0,
                    SOL: response.data.solana?.usd || 0,
                    BNB: response.data.binancecoin?.usd || 0,
                    DOGE: response.data.dogecoin?.usd || 0,
                    XRP: response.data.ripple?.usd || 0,
                    ADA: response.data.cardano?.usd || 0,
                    MATIC: response.data['matic-network']?.usd || 0,
                    DOT: response.data.polkadot?.usd || 0,
                    USDT: 1 // USDT is pegged to USD
                });
            } catch (error) {
                console.error('Error fetching prices:', error);
                // Set default prices if API fails
                setTokenPrices({
                    BTC: 0,
                    ETH: 0,
                    SOL: 0,
                    BNB: 0,
                    DOGE: 0,
                    XRP: 0,
                    ADA: 0,
                    MATIC: 0,
                    DOT: 0,
                    USDT: 1
                });
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update prices every minute
        return () => clearInterval(interval);
    }, []);

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
                await updateProfile(user, {
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                });
                setSuccess('Profile updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserData(prev => ({
                    ...prev,
                    photoURL: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
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
                Deposit
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
                                        <input
                                            type="file"
                                            className="custom-file-input"
                                            id="imgInp"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
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
                                                            const usdValue = balance * (tokenPrices[asset] || 0);
                                                            return (
                                                                <tr key={asset} style={{
                                                                    transition: 'all 0.3s'
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
                                                                                    background: '#2A2A3C'
                                                                                }}
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.src = 'https://cryptologos.cc/logos/question-mark.png';
                                                                                }}
                                                                            />
                                                                            <div>
                                                                                <div style={{
                                                                                    fontWeight: '500',
                                                                                    color: '#fff'
                                                                                }}>{asset}</div>
                                                                                <div style={{
                                                                                    fontSize: '12px',
                                                                                    color: '#7A7A7A',
                                                                                    marginTop: '2px'
                                                                                }}>{asset === 'USDT' ? 'Tether USD' : asset}</div>
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
                                <div className="content-inner referrals">
                                    <h6>Total rewards</h6>
                                    <h4>$1,056.00 <span>USD</span></h4>
                                    <p>
                                    You're earning 20% of the trading fees your referrals pay.
                                    Learn more
                                    </p>
                                    <div className="main">
                                    <h6>Invite friends to earn 20%</h6>

                                    <div className="refe">
                                        <div>
                                        <p>Referral link</p>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value="https://accounts.Ripple Exchange.com/login"
                                        />
                                        </div>
                                        <div>
                                        <p>Referral code</p>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value="N84CRDKK"
                                        />
                                        <span className="btn-action">Copied</span>
                                        </div>
                                    </div>
                                    </div>

                                    <Link to="/wallet" className="btn-action">My Wallet</Link>
                                </div>
                            </TabPanel>
                            <TabPanel>
                                <div className="content-inner api">
                                    <h6>Enable API access on your account to generate keys.</h6>
                                    <h4>API Access is <span>Disabled</span></h4>
                                    <p className="mail">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M20 5H4C3.44772 5 3 5.44772 3 6V18C3 18.5523 3.44772 19 4 19H20C20.5523 19 21 18.5523 21 18V6C21 5.44772 20.5523 5 20 5ZM4 3C2.34315 3 1 4.34315 1 6V18C1 19.6569 2.34315 21 4 21H20C21.6569 21 23 19.6569 23 18V6C23 4.34315 21.6569 3 20 3H4Z"
                                        fill="#23262F"
                                        />
                                        <path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M5.2318 7.35984C5.58537 6.93556 6.21593 6.87824 6.64021 7.2318L11.3598 11.1648C11.7307 11.4739 12.2694 11.4739 12.6402 11.1648L17.3598 7.2318C17.7841 6.87824 18.4147 6.93556 18.7682 7.35984C19.1218 7.78412 19.0645 8.41468 18.6402 8.76825L13.9206 12.7013C12.808 13.6284 11.192 13.6284 10.0795 12.7013L5.35984 8.76825C4.93556 8.41468 4.87824 7.78412 5.2318 7.35984Z"
                                        fill="#23262F"
                                        />
                                    </svg>
                                    petersonkenn@demo.com
                                    </p>
                                    <div className="main">
                                    <h6>Enable API keys</h6>
                                    <p>Enter your password and 2FA code to Enable the API keys</p>

                                    <div className="refe">
                                        <div className="form-group">
                                        <p>Your Password</p>
                                        <input
                                            className="form-control"
                                            type="password"
                                            placeholder="Passworld"
                                        />
                                        </div>
                                        <div className="form-group">
                                        <p>2FA Code</p>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="2FA code"
                                        />
                                        </div>
                                    </div>
                                    <Link to="#" className="btn-action">Enable API keys</Link>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel>
                                <div className="content-inner api">
                                    <h4>2FA <span className="color-success">Enabled</span></h4>
                                    <p>
                                    If you want to turn off 2FA, input your account password and
                                    the six-digit code provided by the Google Authenticator app
                                    below, then click <strong>"Disable 2FA"</strong>.
                                    </p>

                                    <div className="main">
                                    <h6>Disable 2FA</h6>
                                    <p>
                                        Enter your password and 2FA code to Disable the 2FA
                                        verification
                                    </p>

                                    <div className="refe">
                                        <div className="form-group">
                                        <p>Your Password</p>
                                        <input
                                            className="form-control"
                                            type="password"
                                            placeholder="Passworld"
                                        />
                                        </div>
                                        <div className="form-group">
                                        <p>2FA Code</p>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="2FA code"
                                        />
                                        </div>
                                    </div>
                                    <Link to="#" className="btn-action">Disable 2FA verification</Link>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel>
                                <div className="content-inner profile change-pass">
                                    <h4>Change Password</h4>
                                    <h6>New Passworld</h6>
                                    <form action="#">
                                    <div className="form-group">
                                        <div>
                                        <label>Old Passworld<span>*</span>:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value="123456789"
                                        />
                                        </div>
                                        <div>
                                        <label>2FA Code<span>*</span>:</label>
                                        <input type="text" className="form-control" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div>
                                        <label>New Passworld<span>*</span>:</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="New Passworld"
                                        />
                                        </div>
                                        <div>
                                        <label>Confirm Passworld<span>*</span>:</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Confirm Passworld"
                                        />
                                        </div>
                                    </div>
                                    </form>
                                    <button type="submit" className="btn-action">
                                    Change Passworld
                                    </button>
                                </div>
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