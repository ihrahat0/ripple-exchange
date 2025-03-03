import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { tradingService } from '../services/tradingService';
import styled from 'styled-components';

// Import coin logos
import btcLogo from '../assets/images/coin/btc.png';
import ethLogo from '../assets/images/coin/eth.png';
import usdtLogo from '../assets/images/coin/usdt.png';
import xrpLogo from '../assets/images/coin/xrp.png';
import bnbLogo from '../assets/images/coin/bnb.png';
import solLogo from '../assets/images/coin/sol.png';
import adaLogo from '../assets/images/coin/ada.png';
import dogeLogo from '../assets/images/coin/doge.png';
import dotLogo from '../assets/images/coin/dot.png';
import maticLogo from '../assets/images/coin/matic.png';
import avaxLogo from '../assets/images/coin/avax.png';
import linkLogo from '../assets/images/coin/link.png';
import uniLogo from '../assets/images/coin/uni.png';
import atomLogo from '../assets/images/coin/atom.png';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Sale01 from '../components/sale/Sale01';
import PageTitle from '../components/pagetitle';

const CoinLogo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: contain;
  background: #1c1e27;
  padding: 5px;
  display: inline-block;
  vertical-align: middle;
`;

const AssetContainer = styled.div`
  display: flex;
  align-items: center;
`;

const AssetInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AssetSymbol = styled.span`
  font-weight: bold;
  font-size: 16px;
  color: #fff;
`;

const AssetName = styled.span`
  color: #999;
  font-size: 12px;
  margin-top: 2px;
`;

Wallet.propTypes = {
    
};

function Wallet() {
    const [balances, setBalances] = useState({});
    const [positions, setPositions] = useState([]);
    const [totalPnL, setTotalPnL] = useState(0);
    const [bonusAccount, setBonusAccount] = useState(null);
    const [loadingBonus, setLoadingBonus] = useState(true);
    const { currentUser } = useAuth();

    // Coin logos mapping
    const COIN_LOGOS = {
        BTC: btcLogo,
        ETH: ethLogo,
        USDT: usdtLogo,
        XRP: xrpLogo,
        BNB: bnbLogo,
        SOL: solLogo,
        ADA: adaLogo,
        DOGE: dogeLogo,
        DOT: dotLogo,
        MATIC: maticLogo,
        AVAX: avaxLogo,
        LINK: linkLogo,
        UNI: uniLogo,
        ATOM: atomLogo
    };

    // Coin full names
    const COIN_NAMES = {
        BTC: 'Bitcoin',
        ETH: 'Ethereum',
        USDT: 'Tether USD',
        XRP: 'Ripple',
        BNB: 'Binance Coin',
        SOL: 'Solana',
        ADA: 'Cardano',
        DOGE: 'Dogecoin',
        DOT: 'Polkadot',
        MATIC: 'Polygon',
        AVAX: 'Avalanche',
        LINK: 'Chainlink',
        UNI: 'Uniswap',
        ATOM: 'Cosmos'
    };

    useEffect(() => {
        if (currentUser) {
            fetchBalances();
            fetchPositions();
            fetchBonusAccount();
        }
    }, [currentUser]);

    const fetchBalances = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                setBalances(userDoc.data().balances || {});
            } else {
                // Initialize user with default balance
                const defaultBalances = {
                    USDT: 10000, // Default 10,000 USDT
                    BTC: 0,
                    ETH: 0,
                    XRP: 0,
                    BNB: 0,
                    SOL: 0,
                    ADA: 0,
                    DOGE: 0,
                    DOT: 0,
                    MATIC: 0,
                    AVAX: 0,
                    LINK: 0,
                    UNI: 0,
                    ATOM: 0
                };
                setBalances(defaultBalances);
            }
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    };

    const fetchPositions = async () => {
        try {
            const positionsRef = collection(db, 'positions');
            const q = query(positionsRef, where('userId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);
            
            const positionsData = [];
            let totalPnL = 0;
            
            querySnapshot.forEach((doc) => {
                const position = { id: doc.id, ...doc.data() };
                positionsData.push(position);
                totalPnL += position.currentPnL || 0;
            });
            
            setPositions(positionsData);
            setTotalPnL(totalPnL);
        } catch (error) {
            console.error('Error fetching positions:', error);
        }
    };

    const fetchBonusAccount = async () => {
        try {
            setLoadingBonus(true);
            const bonusData = await tradingService.getUserBonusAccount(currentUser.uid);
            setBonusAccount(bonusData);
        } catch (error) {
            console.error('Error fetching bonus account:', error);
        } finally {
            setLoadingBonus(false);
        }
    };

    const [dataCryptoTab] = useState([
        {
            id: 1,
            title: 'Overview',
        },
        {
            id: 2,
            title: 'Buy Crypto',
        },
        {
            id: 3,
            title: 'Sell Crypto',
        },
    ]);

    // Get coin logo with fallback
    const getCoinLogo = (symbol) => {
        if (COIN_LOGOS[symbol]) {
            return COIN_LOGOS[symbol];
        }
        return `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png?v=024`;
    };

    // Get full coin name
    const getCoinName = (symbol) => {
        return COIN_NAMES[symbol] || symbol;
    };

    return (
        <div>
            <PageTitle heading='Wallet' title='Wallet' />
            <section className="wallet buy-crypto flat-tabs">
                <div className="container">
                    <div className="row">
                    <Tabs>
                            <TabList>
                                {
                                    dataCryptoTab.map(idx => (
                                        <Tab key={idx.id}>{idx.title}</Tab>
                                    ))
                                }
                            </TabList>

                            <TabPanel>
                            <div className="content-inner">
                                <div className="wallet-main">
                                <h4 className="heading">Overview</h4>

                                <div className="wallet-body">
                                    <div className="left">
                                    <p>Total Balance (USDT)</p>

                                    <div className="price">
                                        <h6>{balances.USDT?.toFixed(2) || '0.00'}</h6>
                                    </div>
                                    <p>Total PnL: ${totalPnL.toFixed(2)}</p>
                                    
                                    {bonusAccount && bonusAccount.exists && (
                                        <div className="bonus-account">
                                            <h5 style={{ marginTop: '20px', color: '#0ECB81' }}>Liquidation Protection Bonus</h5>
                                            <div className="bonus-details" style={{ 
                                                padding: '15px', 
                                                backgroundColor: 'rgba(14, 203, 129, 0.1)', 
                                                borderRadius: '8px',
                                                marginTop: '10px' 
                                            }}>
                                                <p><strong>Amount:</strong> {bonusAccount.formattedAmount}</p>
                                                <p><strong>Status:</strong> {bonusAccount.isActive ? 'Active' : 'Inactive'}</p>
                                                {bonusAccount.expiryDate && (
                                                    <p><strong>Expires:</strong> {bonusAccount.expiryDate.toLocaleDateString()}</p>
                                                )}
                                                <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                                                    This bonus is used to protect your funds from liquidation.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                    <div className="right">
                                    <form action="/wallet">
                                        <div className="form-group">
                                        <input type="text" placeholder="Search" />
                                        <svg
                                            width="21"
                                            height="21"
                                            viewBox="0 0 21 21"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                            d="M20 20L15.514 15.506L20 20ZM18 9.5C18 11.7543 17.1045 13.9163 15.5104 15.5104C13.9163 17.1045 11.7543 18 9.5 18C7.24566 18 5.08365 17.1045 3.48959 15.5104C1.89553 13.9163 1 11.7543 1 9.5C1 7.24566 1.89553 5.08365 3.48959 3.48959C5.08365 1.89553 7.24566 1 9.5 1C11.7543 1 13.9163 1.89553 15.5104 3.48959C17.1045 5.08365 18 7.24566 18 9.5V9.5Z"
                                            stroke="#B1B5C3"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            />
                                        </svg>
                                        <select className="" aria-label="USD">
                                            <option selected>USD</option>
                                            <option value="1">VND</option>
                                            <option value="2">USDT</option>
                                            <option value="3">USDC</option>
                                        </select>
                                        </div>
                                        <button type="submit" className="btn-action">
                                        Show balance
                                        </button>
                                    </form>
                                    </div>
                                </div>
                                </div>

                                <div className="coin-list-wallet">
                                <table className="table" style={{ background: '#1a1b23', borderRadius: '10px' }}>
                                    <thead>
                                    <tr>
                                        <th scope="col">#</th>
                                        <th className="center" scope="col">Asset</th>
                                        <th scope="col">Earn</th>
                                        <th scope="col">On Orders</th>
                                        <th scope="col">Available balance</th>
                                        <th scope="col">Total balance</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(balances).map(([symbol, balance], index) => (
                                        <tr key={symbol}>
                                        <td className="number">
                                                <span>{index + 1}</span>
                                        </td>
                                        <td className="asset">
                                                <AssetContainer>
                                                    <CoinLogo 
                                                        src={getCoinLogo(symbol)} 
                                                        alt={symbol}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://cryptologos.cc/logos/question-mark.png";
                                                        }}
                                                    />
                                                    <AssetInfo>
                                                        <AssetSymbol>{symbol}</AssetSymbol>
                                                        <AssetName>{getCoinName(symbol)}</AssetName>
                                                    </AssetInfo>
                                                </AssetContainer>
                                        </td>
                                        <td className="color-success">
                                        <span className="boild">7.46% APR</span>
                                        </td>
                                        <td>
                                                <span className="boild">0.0000000 {symbol}</span>
                                                <span className="unit">$0.00</span>
                                        </td>
                                        <td>
                                                <span className="boild">{balance.toFixed(8)} {symbol}</span>
                                                <span className="unit">$0.00</span>
                                        </td>
                                        <td>
                                                <span className="boild">{balance.toFixed(8)} {symbol}</span>
                                                <span className="unit">$0.00</span>
                                        </td>
                                    </tr>
                                    ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                            </TabPanel>
                            {/* Rest of the tabs */}
                    </Tabs> 
                    </div>
                </div>
            </section>
            <Sale01 />
        </div>
    );
}

export default Wallet;