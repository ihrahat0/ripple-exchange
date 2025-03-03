import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import { DEFAULT_COINS } from '../utils/constants';

// Coin logos imports
import btcLogo from '../assets/images/coin/btc.png';
import ethLogo from '../assets/images/coin/eth.png';
import usdtLogo from '../assets/images/coin/usdt.png';
import xrpLogo from '../assets/images/coin/xrp.png';
import bnbLogo from '../assets/images/coin/bnb.png';
import solLogo from '../assets/images/coin/sol.png';
import solanLogo from '../assets/images/coin/solana.png';
import adaLogo from '../assets/images/coin/ada.png';
import dogeeLogo from '../assets/images/coin/doge.png';
import dotLogo from '../assets/images/coin/dot.png';
import maticLogo from '../assets/images/coin/matic.png';
import avaxLogo from '../assets/images/coin/avax.png';
import linkLogo from '../assets/images/coin/link.png';
import uniLogo from '../assets/images/coin/uni.png';
import atomLogo from '../assets/images/coin/atom.png';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 114, 90, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 114, 90, 0.6); }
  100% { box-shadow: 0 0 5px rgba(255, 114, 90, 0.2); }
`;

const exchangeAnimation = keyframes`
  0% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
  25% { transform: translateX(-20px) translateY(-10px) scale(1.1); opacity: 0.8; }
  50% { transform: translateX(20px) translateY(10px) scale(0.9); opacity: 0.6; }
  75% { transform: translateX(-10px) translateY(0) scale(1.05); opacity: 0.8; }
  100% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: #13141a;
  padding: 24px;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  color: #fff;
  border: 1px solid rgba(255, 114, 90, 0.3);
  box-shadow: 0 0 20px rgba(255, 114, 90, 0.2);
  animation: ${slideUp} 0.4s ease-out, ${glowAnimation} 6s infinite;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10100;
  
  &:hover {
    box-shadow: 0 0 25px rgba(255, 114, 90, 0.3);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #fff;
  margin: 0;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 114, 90, 0.3);
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: #8a8a8a;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
  
  &:hover {
    color: #fff;
    transform: rotate(45deg);
  }
`;

const AnimationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
`;

const CoinIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #1c1e27;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 15px rgba(255, 114, 90, 0.2);
  z-index: 2;
  
  img {
    width: 70%;
    height: 70%;
    object-fit: contain;
  }
  
  &:first-child {
    animation: ${floatAnimation} 3s ease-in-out infinite;
    margin-right: -15px;
  }
  
  &:last-child {
    animation: ${floatAnimation} 3s ease-in-out infinite 1.5s;
    margin-left: -15px;
  }
`;

const ExchangeCircle = styled.div`
  position: absolute;
  width: 40px;
  height: 40px;
  background: #FF725A;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  z-index: 3;
  animation: ${pulse} 2s infinite, ${exchangeAnimation} 6s infinite;
  box-shadow: 0 0 15px rgba(255, 114, 90, 0.4);
`;

const Particles = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 114, 90, 0.3);
    top: 50%;
    left: 30%;
    animation: ${exchangeAnimation} 4s infinite;
  }
  
  &::after {
    width: 6px;
    height: 6px;
    top: 30%;
    left: 60%;
    background: rgba(255, 114, 90, 0.2);
    animation: ${exchangeAnimation} 4s infinite 1s;
  }
`;

const CurrencyContainer = styled.div`
  background: #1c1e27;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const CurrencyInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 30px;
  font-weight: 500;
  outline: none;
  margin-bottom: 10px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const CurrencySelectorButton = styled.button`
  display: flex;
  align-items: center;
  background: #2a2c36;
  border: none;
  border-radius: 24px;
  padding: 10px 16px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  z-index: 1;
  
  &:hover {
    background: #3a3c47;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 114, 90, 0.5);
  }
`;

const CurrencyIcon = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 50%;
  transition: transform 0.3s;
  
  ${CurrencySelectorButton}:hover & {
    transform: scale(1.1);
  }
`;

const DropdownIcon = styled.span`
  margin-left: 8px;
  display: flex;
  align-items: center;
  transition: transform 0.3s;
  
  ${CurrencySelectorButton}:hover & {
    transform: rotate(180deg);
  }
`;

const TokenInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;

const SwapButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: -10px 0;
  position: relative;
  z-index: 10;
`;

const SwapButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FF725A;
  border: 4px solid #13141a;
  color: #fff;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
  
  &:hover {
    background: #ff8670;
    transform: scale(1.1) rotate(180deg);
    box-shadow: 0 0 15px rgba(255, 114, 90, 0.5);
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  border: none;
  margin-top: 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: ${props => props.disabled ? '#3a3c47' : '#FF725A'};
  color: #fff;
  transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.disabled ? '#3a3c47' : '#ff8670'};
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 5px 15px rgba(255, 114, 90, 0.3)'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: rotate(30deg);
    transition: transform 0.3s;
  }
  
  &:hover::after {
    transform: ${props => props.disabled ? 'rotate(30deg)' : 'rotate(30deg) translate(50%, 50%)'};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(19, 20, 26, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  z-index: 20000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 5px solid rgba(255, 114, 90, 0.2);
  border-top: 5px solid #FF725A;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
  margin-bottom: 16px;
`;

const LoadingText = styled.div`
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
  animation: ${pulse} 1.5s infinite;
`;

const PoweredBy = styled.div`
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 16px;
`;

const ConversionInfo = styled.div`
  padding: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  background: rgba(255, 114, 90, 0.1);
  border-radius: 8px;
  margin-top: 8px;
`;

const ErrorMessage = styled.div`
  color: #ff4d4d;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
  padding: 8px;
  background: rgba(255, 77, 77, 0.1);
  border-radius: 8px;
  animation: ${pulse} 2s infinite;
`;

// Position the dropdown in the document body, not inside the modal
const CurrencyDropdownPortal = styled.div`
  position: fixed;
  width: 280px;
  max-height: 350px;
  overflow-y: auto;
  background: #1a1b23;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  z-index: 99999; /* Ultra high z-index */
  padding: 16px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 114, 90, 0.3);
  animation: ${slideUp} 0.2s ease-out;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1c1e27;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #FF725A;
    border-radius: 3px;
  }
`;

const CurrencyOption = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  margin-bottom: 6px;
  
  &:hover {
    background: #2a2d3a;
    transform: translateX(5px);
  }
  
  .name {
    margin-left: 12px;
    flex: 1;
    font-weight: 500;
  }
  
  .balance {
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    margin-top: 4px;
  }
`;

function ConvertModal({ isOpen, onClose, balances, tokenPrices, onConvert }) {
  const [fromCoin, setFromCoin] = useState('');
  const [toCoin, setToCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [conversionRate, setConversionRate] = useState(null);
  const [estimatedAmount, setEstimatedAmount] = useState(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({});
  
  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);

  // Expanded coin logos mapping with more coins
  const COIN_LOGOS = {
    BTC: btcLogo,
    ETH: ethLogo,
    USDT: usdtLogo,
    XRP: xrpLogo,
    BNB: bnbLogo,
    SOL: solLogo || solanLogo, // Try both versions
    ADA: adaLogo,
    DOGE: dogeeLogo,
    DOT: dotLogo,
    MATIC: maticLogo,
    AVAX: avaxLogo,
    LINK: linkLogo,
    UNI: uniLogo,
    ATOM: atomLogo
  };

  const sortedCoins = useMemo(() => {
    return Object.entries(DEFAULT_COINS)
      .map(([symbol, coin]) => {
        const balance = balances[symbol] || 0;
        const price = tokenPrices[symbol] || 0;
        const usdValue = balance * price;
        
        return {
          symbol,
          ...coin,
          balance,
          usdValue: symbol === 'USDT' ? balance : usdValue // USDT is pegged to USD
        };
      })
      .sort((a, b) => {
        // If both have zero balance, sort alphabetically
        if (a.balance === 0 && b.balance === 0) {
          return a.symbol.localeCompare(b.symbol);
        }
        // Sort by USD value first
        if (a.usdValue !== b.usdValue) {
          return b.usdValue - a.usdValue;
        }
        // If USD values are equal, sort by balance
        return b.balance - a.balance;
      });
  }, [balances, tokenPrices]);

  // Add an effect to append the dropdown to body when needed
  useEffect(() => {
    // Clean up function to remove any leftovers
    return () => {
      if (dropdownRef.current && dropdownRef.current.parentNode) {
        document.body.removeChild(dropdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Set default coins if none selected
      if (!fromCoin && sortedCoins.length > 0) {
        // Default to ETH if available, otherwise first coin
        const defaultFrom = sortedCoins.find(c => c.symbol === 'ETH') || sortedCoins[0];
        setFromCoin(defaultFrom.symbol);
      }
      if (!toCoin && sortedCoins.length > 1) {
        // Default to USDT if available and not same as fromCoin
        const defaultTo = sortedCoins.find(c => c.symbol === 'USDT' && c.symbol !== fromCoin) || 
                          sortedCoins.find(c => c.symbol !== fromCoin);
        if (defaultTo) setToCoin(defaultTo.symbol);
      }
    }
  }, [isOpen, fromCoin, toCoin, sortedCoins]);

  useEffect(() => {
    if (fromCoin && toCoin && tokenPrices && amount) {
      const fromPrice = tokenPrices[fromCoin];
      const toPrice = tokenPrices[toCoin];
      if (fromPrice && toPrice) {
        const rate = fromPrice / toPrice;
        setConversionRate(rate);
        setEstimatedAmount(parseFloat(amount) * rate);
      }
    } else {
      setConversionRate(null);
      setEstimatedAmount(null);
    }
  }, [fromCoin, toCoin, amount, tokenPrices]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !fromDropdownRef.current?.contains(event.target) && 
          !toDropdownRef.current?.contains(event.target)) {
        setShowFromDropdown(false);
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fromCoin || !toCoin || !amount) {
      setError('Please fill in all fields');
      return;
    }

    const fromBalance = balances[fromCoin] || 0;
    if (parseFloat(amount) > fromBalance) {
      setError('Insufficient balance');
      return;
    }

    // Show loading animation for 1-2 seconds
    setIsLoading(true);
    const loadingTime = 1000 + Math.random() * 1000; // 1-2 seconds
    
    setTimeout(() => {
      setIsLoading(false);
      onConvert({
        fromCoin,
        toCoin,
        fromAmount: parseFloat(amount),
        toAmount: estimatedAmount
      });
      onClose();
    }, loadingTime);
  };

  const handleSwap = () => {
    const temp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(temp);
    
    if (amount && estimatedAmount) {
      setAmount(estimatedAmount.toString());
    }
  };

  const handleFromCoinSelect = (symbol) => {
    if (symbol === toCoin) {
      // If selecting the same coin as the "to" coin, swap them
      setToCoin(fromCoin);
    }
    setFromCoin(symbol);
    setShowFromDropdown(false);
    
    // Set focus back to amount input
    document.getElementById('from-amount')?.focus();
  };

  const handleToCoinSelect = (symbol) => {
    if (symbol === fromCoin) {
      // If selecting the same coin as the "from" coin, swap them
      setFromCoin(toCoin);
    }
    setToCoin(symbol);
    setShowToDropdown(false);
  };
  
  // Calculate dropdown position based on the clicked button
  const calculateDropdownPosition = (buttonRef, isFromDropdown) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Determine if dropdown should appear above or below button
    const spaceBelow = windowHeight - rect.bottom;
    const positionAbove = spaceBelow < 350; // Show above if space below is limited
    
    // Position calculation
    const position = {
      left: rect.left,
      width: Math.max(280, rect.width)
    };
    
    if (positionAbove) {
      position.bottom = windowHeight - rect.top + 5;
      position.maxHeight = rect.top - 10;
    } else {
      position.top = rect.bottom + 5;
      position.maxHeight = windowHeight - rect.bottom - 10;
    }
    
    return position;
  };
  
  // Handle dropdown toggle with proper positioning
  const handleFromDropdownToggle = () => {
    if (showToDropdown) setShowToDropdown(false);
    
    if (!showFromDropdown) {
      const position = calculateDropdownPosition(fromDropdownRef, true);
      setDropdownPosition(position);
    }
    
    setShowFromDropdown(!showFromDropdown);
  };
  
  const handleToDropdownToggle = () => {
    if (showFromDropdown) setShowFromDropdown(false);
    
    if (!showToDropdown) {
      const position = calculateDropdownPosition(toDropdownRef, false);
      setDropdownPosition(position);
    }
    
    setShowToDropdown(!showToDropdown);
  };

  // Get token icon with fallback
  const getTokenIcon = (symbol) => {
    // First try from our local imported images
    if (COIN_LOGOS[symbol]) {
      return COIN_LOGOS[symbol];
    }
    
    // Fallback to online crypto logos
    return `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png?v=024`;
  };

  const renderCurrencyDropdown = () => {
    if (!showFromDropdown && !showToDropdown) return null;
    
    const currentDropdown = showFromDropdown ? 'from' : 'to';
    const currentCoin = showFromDropdown ? fromCoin : toCoin;
    const excludedCoin = showFromDropdown ? toCoin : fromCoin;
    const handleSelect = showFromDropdown ? handleFromCoinSelect : handleToCoinSelect;
    
    return (
      <CurrencyDropdownPortal 
        ref={dropdownRef}
        style={dropdownPosition}
      >
        <div style={{ 
          padding: '0 0 10px 5px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          marginBottom: '12px',
          color: '#FF725A',
          fontWeight: 'bold'
        }}>
          Select Currency
        </div>
        {sortedCoins
          .filter(coin => coin.symbol !== excludedCoin)
          .map(coin => (
            <CurrencyOption key={coin.symbol} onClick={() => handleSelect(coin.symbol)}>
              <CurrencyIcon 
                src={getTokenIcon(coin.symbol)} 
                alt={coin.symbol}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://cryptologos.cc/logos/question-mark.png";
                }}
              />
              <div className="name">
                <div>{coin.symbol}</div>
                <div className="balance">{coin.balance.toFixed(6)}</div>
              </div>
            </CurrencyOption>
          ))
        }
      </CurrencyDropdownPortal>
    );
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent ref={modalRef} onClick={e => e.stopPropagation()}>
        {isLoading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingText>Converting {amount} {fromCoin} to {toCoin}...</LoadingText>
          </LoadingOverlay>
        )}
        
        <ModalHeader>
          <Title>Swap Responsibly</Title>
          <SettingsButton>⚙️</SettingsButton>
        </ModalHeader>
        
        <AnimationContainer>
          <Particles />
          <CoinIcon>
            <img 
              src={getTokenIcon(fromCoin)} 
              alt={fromCoin || "From"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cryptologos.cc/logos/question-mark.png";
              }}
            />
          </CoinIcon>
          
          <ExchangeCircle>
            <span>⇄</span>
          </ExchangeCircle>
          
          <CoinIcon>
            <img 
              src={getTokenIcon(toCoin)} 
              alt={toCoin || "To"}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cryptologos.cc/logos/question-mark.png";
              }}
            />
          </CoinIcon>
        </AnimationContainer>
        
        <form onSubmit={handleSubmit}>
          <CurrencyContainer>
            <CurrencyInput
              id="from-amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="any"
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div ref={fromDropdownRef} style={{ position: 'relative' }}>
                <CurrencySelectorButton 
                  type="button" 
                  onClick={handleFromDropdownToggle}
                >
                  {fromCoin && (
                    <CurrencyIcon 
                      src={getTokenIcon(fromCoin)} 
                      alt={fromCoin}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://cryptologos.cc/logos/question-mark.png";
                      }}
                    />
                  )}
                  {fromCoin || "Select"}
                  <DropdownIcon>▼</DropdownIcon>
                </CurrencySelectorButton>
              </div>
              
              {fromCoin && (
                <TokenInfoRow>
                  Balance: {(balances[fromCoin] || 0).toFixed(4)} {fromCoin}
                </TokenInfoRow>
              )}
            </div>
          </CurrencyContainer>
          
          <SwapButtonContainer>
            <SwapButton type="button" onClick={handleSwap}>
              ↓
            </SwapButton>
          </SwapButtonContainer>
          
          <CurrencyContainer>
            <CurrencyInput
              type="text"
              value={estimatedAmount ? estimatedAmount.toFixed(6) : ''}
              readOnly
              placeholder="-"
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div ref={toDropdownRef} style={{ position: 'relative' }}>
                <CurrencySelectorButton 
                  type="button" 
                  onClick={handleToDropdownToggle}
                >
                  {toCoin && (
                    <CurrencyIcon 
                      src={getTokenIcon(toCoin)} 
                      alt={toCoin}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://cryptologos.cc/logos/question-mark.png";
                      }}
                    />
                  )}
                  {toCoin || "Select"}
                  <DropdownIcon>▼</DropdownIcon>
                </CurrencySelectorButton>
              </div>
              
              {toCoin && (
                <TokenInfoRow>
                  Balance: {(balances[toCoin] || 0).toFixed(4)} {toCoin}
                </TokenInfoRow>
              )}
            </div>
          </CurrencyContainer>

          {fromCoin && toCoin && conversionRate && (
            <ConversionInfo>
              1 {fromCoin} = {conversionRate.toFixed(6)} {toCoin}
            </ConversionInfo>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ActionButton 
            type="submit" 
            disabled={!fromCoin || !toCoin || !amount || !estimatedAmount}
          >
            Review Swap
          </ActionButton>
          
          <PoweredBy>
            Powered by Ripple Exchange
          </PoweredBy>
        </form>
        
        {(showFromDropdown || showToDropdown) && renderCurrencyDropdown()}
      </ModalContent>
    </ModalOverlay>
  );
}

ConvertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  balances: PropTypes.object.isRequired,
  tokenPrices: PropTypes.object.isRequired,
  onConvert: PropTypes.func.isRequired
};

export default ConvertModal; 