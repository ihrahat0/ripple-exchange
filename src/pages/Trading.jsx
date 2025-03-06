import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styled, { css, keyframes, useTheme } from 'styled-components';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  updateDoc,
  writeBatch,
  getDoc,
  runTransaction,
  setDoc,
  onSnapshot,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import TradingChartComponent from '../components/TradingChart';
import { tradingService } from '../services/tradingService';
import btcIcon from '../assets/images/coin/btc.png';
import LightweightChartComponent from '../components/LightweightChartComponent';
import soundEffect from '../assets/sound/sound-effect.wav';

// Simple notification function using console.log
const addNotification = ({ title, message, type, playSound = false }) => {
  console.log(`[${type || 'info'}] ${title}: ${message}`);
  // Play sound if requested
  if (playSound) {
    try {
      const audio = new Audio(soundEffect);
      audio.play().catch(error => {
        console.warn('Error playing notification sound:', error);
      });
    } catch (error) {
      console.warn('Error initializing notification sound:', error);
    }
  }
  // In a real app, we would use a proper notification library
};

const TradingContainer = styled.div`
  padding: 0;
  background: var(--bg1);
  min-height: calc(100vh - 60px);
  margin-top: 0;
  
  @media (max-width: 768px) {
    padding: 0;
    margin-top: 0;
  }
`;

const TradingGrid = styled.div`
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 0;
  margin: 0;
  background: var(--bg);
  
  @media (max-width: 1200px) {
    grid-template-columns: 65% 35%;
  }
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSection = styled.div`
  background: var(--bg);
  border-right: 1px solid var(--line);
  height: calc(100vh - 200px);
  min-height: 500px;
  
  @media (max-width: 992px) {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
`;

const RightSection = styled.div`
  width: 100%;
  background: var(--bg);
  display: grid;
  grid-template-rows: auto;
  height: calc(100vh - 200px);
  min-height: 500px;
  
  @media (max-width: 992px) {
    width: 100%;
  }
`;

const TradingInterface = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const OrderBookSection = styled.div`
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: none;
  box-shadow: none;
  border-radius: 0;
  margin: 0;
  overflow: hidden;
  
  @media (max-width: 992px) {
    height: 330px;
  }
`;

const OrderFormSection = styled.div`
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: none;
  box-shadow: none;
  border-radius: 0;
  margin: 0;
  
  @media (max-width: 992px) {
    height: 330px;
  }
`;

const ChartCard = styled.div`
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

const OrderCard = styled.div`
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
`;

const CoinIcon = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: contain;
  background: ${props => props.$theme === 'dark' ? '#2A2A3C' : '#fff'};
  padding: 2px;
  
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const CoinDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CoinName = styled.h2`
  color: #fff;
  margin: 0;
  font-size: 24px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const CoinSymbol = styled.span`
  color: #7A7A7A;
  font-size: 16px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const PriceInfo = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 15px;
    flex-direction: column;
  }
`;

const Price = styled.div`
  color: #fff;
  font-size: 24px;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Change = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.$isPositive ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)'};
  color: ${props => props.$isPositive ? '#0ECB81' : '#F6465D'};
  margin-left: 8px;
  
  @media (max-width: 768px) {
    font-size: 12px;
    padding: 1px 6px;
  }
`;

const OrderForm = styled.form`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
`;

const TabGroup = styled.div`
  display: flex;
  margin-bottom: 6px;
  gap: 6px;
  
  @media (max-width: 768px) {
    margin-bottom: 4px;
    gap: 3px;
  }
`;

const OrderTab = styled.button`
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: ${props => props.active ? 'var(--text1)' : 'var(--text2)'};
  border-bottom: 2px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--text1);
  }
`;

const AmountInput = styled.input`
  background: var(--bg2);
  color: var(--text);
  border: 1px solid var(--line);
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
  width: 100%;
  margin: 2px 0;

  &:focus {
    border-color: #D4AF37;
    box-shadow: 0 0 4px rgba(212, 175, 55, 0.3);
  }

  @media (max-width: 768px) {
    padding: 5px 8px;
    font-size: 12px;
    margin: 1px 0;
  }
`;

const Button = styled.button`
  background: ${props => props.$variant === 'buy' ? 'var(--success)' : props.$variant === 'sell' ? 'var(--danger)' : 'var(--primary)'};
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 5px;
  border: 1px solid ${props => {
    if (props.$variant === 'buy') return 'rgba(212, 175, 55, 0.5)';
    if (props.$variant === 'sell') return 'rgba(212, 175, 55, 0.5)';
    return '#D4AF37';
  }};
  box-shadow: 0 0 4px ${props => {
    if (props.$variant === 'buy') return 'rgba(52, 199, 89, 0.3)';
    if (props.$variant === 'sell') return 'rgba(255, 59, 48, 0.3)';
    return 'rgba(212, 175, 55, 0.3)';
  }};

  &:hover {
    filter: brightness(1.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 6px;
    font-size: 13px;
  }
`;

// Update the TIMEFRAMES object
const TIMEFRAMES = {
  '1D': { label: '1D', value: '1' },
  '1W': { label: '1W', value: '7' }
};

// Update the styled component for the chart
const ChartEmbed = styled.iframe`
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 8px;
  background: var(--bg2);
`;

const CurrentPrice = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  padding: 8px 0;
  margin: 5px 0;
  position: relative;
  color: ${props => props.$isUp ? '#0ECB81' : '#F6465D'};
  background: ${props => props.$isUp ? 'rgba(14, 203, 129, 0.15)' : 'rgba(246, 70, 93, 0.15)'};
  border-top: 1px solid ${props => props.$isUp ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)'};
  border-bottom: 1px solid ${props => props.$isUp ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)'};
  letter-spacing: 0.5px;
`;

// Replace the InternalTradingChart function
function InternalTradingChart({ symbol, theme }) {
  return (
    <TradingChartComponent
      symbol={`BINANCE:${symbol}`}
      theme={theme}
      container_id="tradingview_chart"
      autosize={true}
      timeframe="15"
      allow_symbol_change={false}
    />
  );
}

// Define accurate coin IDs for CoinGecko
const hardcodedPrices = {
  'btc': 90812.45,
  'bitcoin': 90812.45,
  'eth': 3452.67,
  'ethereum': 3452.67,
  'sol': 142.56,
  'bnb': 567.89,
  'doge': 0.12
};

// Define accurate coin IDs for CoinGecko
const COINGECKO_IDS = {
  'btc': 'bitcoin',
  'bitcoin': 'bitcoin',
  'eth': 'ethereum', 
  'ethereum': 'ethereum',
  'sol': 'solana',
  'bnb': 'binancecoin',
  'doge': 'dogecoin',
  'xrp': 'ripple',
  'ada': 'cardano',
  'dot': 'polkadot',
  'matic': 'matic-network',
  'avax': 'avalanche-2',
  'link': 'chainlink',
  'uni': 'uniswap',
  'atom': 'cosmos'
};

const fetchHistoricalData = async (coinId, days = '1', interval = 'minute') => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Convert the data to candlestick format
    const candlesticks = [];
    const prices = data.prices;
    
    for (let i = 0; i < prices.length; i += 1) {
      const candle = {
        time: prices[i][0] / 1000, // Convert to seconds
        open: prices[i][1],
        high: prices[i][1],
        low: prices[i][1],
        close: prices[i][1]
      };
      
      if (i > 0) {
        candle.open = prices[i-1][1];
        candle.high = Math.max(candle.open, candle.close);
        candle.low = Math.min(candle.open, candle.close);
      }
      
      candlesticks.push(candle);
    }
    
    return candlesticks;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
};

// Add these new styled components
const OrderTypeSelector = styled.div`
  display: flex;
  border-bottom: 1px solid var(--line);
  margin-bottom: 16px;
`;

const leverageOptions = [10, 20, 25, 30, 40];  // Updated leverage options

const LeverageSlider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg2);
  outline: none;
  margin: 10px 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${props => props.$value >= 30 ? '#F6465D' : 'var(--primary)'};
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${props => props.$value >= 30 ? '#F6465D' : 'var(--primary)'};
    cursor: pointer;
    border: none;
  }
`;

const LeverageDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  color: var(--text);
  font-size: 12px;
`;

const QuickLeverageButtons = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const QuickLeverageButton = styled.button`
  padding: 4px 8px;
  margin: 0 4px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  background: ${props => props.$active ? 'var(--primary)' : 'var(--bg1)'};
  color: ${props => props.$active ? '#fff' : 'var(--text)'};
  
  &:hover {
    background: var(--primary);
    color: #fff;
  }
`;

const OrderDetails = styled.div`
  margin-top: 5px;
  margin-bottom: 5px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  color: var(--text);
  font-size: 12px;
`;

// Add these new styled components
const OrderBook = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg2);
  border-radius: 12px;
  border: 1px solid #D4AF37; /* Golden border color */
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.2); /* Subtle golden glow */
  overflow: hidden;
  
  @media (max-width: 768px) {
    max-height: 300px;
    overflow-y: auto;
  }
`;

const OrderBookHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
  color: var(--text2);
`;

const OrderBookRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  position: relative;
  
  &:hover {
    background: var(--bg2);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: ${props => props.$depth}%;
    background: ${props => props.$side === 'buy' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)'};
    z-index: 0;
  }

  & > span {
    position: relative;
    z-index: 1;
  }
`;

// Update OrderCard to include buy/sell colors
const OrderButton = styled.button`
  background: ${props => props.$orderType === 'buy' ? '#0ECB81' : '#F6465D'};
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  font-weight: 500;
  font-size: 13px;
  border: 1px solid ${props => props.$orderType === 'buy' ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)'};
  box-shadow: 0 0 4px ${props => props.$orderType === 'buy' ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)'};
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  
  @media (max-width: 768px) {
    padding: 6px;
    font-size: 12px;
  }
`;

// Add a new container for the right side
const RightPanel = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  height: 600px; // Match chart height
`;

// Update the positions table styling
const PositionsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--bg);
  
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }
  
  th {
    color: var(--text2);
    font-weight: normal;
  }
  
  td {
    color: var(--text1);
  }
`;

const TableHeader = styled.th`
  background: rgba(212, 175, 55, 0.2);
  color: #D4AF37;
  padding: 8px;
  font-size: 12px;
  text-align: left;
`;

const TableCell = styled.td`
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
`;

const PnLValue = styled.span`
  color: ${props => props.value >= 0 ? '#0ECB81' : '#F6465D'};
  font-weight: bold;
`;

// Add these styled components at the top with your other styled components
const TradeInfo = styled.div`
  margin-top: 5px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${props => props.$highlight ? 'var(--primary)' : 'var(--text-secondary)'};
  margin-bottom: 3px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// Add this helper function before the Trading component
const calculateRequiredMargin = (amount, price, leverage) => {
  if (!amount || !price || !leverage) return 0;
  return (parseFloat(amount) * price) / leverage;
};

// Update the leverage buttons handling
const LeverageButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const LeverageInput = styled.input`
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: var(--bg2);
  border: 1px solid var(--line);
  color: var(--text);
  border-radius: 4px;
`;

// Add these styled components
const ChartContainer = styled.div`
  position: relative;
  background: var(--bg1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #D4AF37; /* Golden border color */
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.2); /* Subtle golden glow */
`;

const DexLink = styled.a`
  display: inline-block;
  padding: 8px 12px;
  background: rgba(30, 34, 45, 0.8);
  color: var(--text-secondary);
  font-size: 13px;
  text-decoration: none;
  border-radius: 4px;
  position: absolute;
  right: 24px;
  bottom: 24px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--primary);
    color: white;
  }
  
  i {
    margin-left: 5px;
    font-size: 12px;
  }
`;

const TimeframeSelector = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px;
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: rgba(30, 34, 45, 0.8);
  border-radius: 4px;
`;

const TimeButton = styled.button`
  padding: 4px 12px;
  background: ${props => props.$active ? 'var(--primary)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#7a7a7a'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    color: white;
    background: ${props => props.$active ? 'var(--primary)' : 'rgba(71, 77, 87, 0.7)'};
  }
`;

// Add this styled component
const DexScreenerChart = styled.iframe`
  width: 100%;
  height: 500px;
  border: none;
  border-radius: 8px;
  background: var(--bg2);
`;

// Add these new styled components after the existing styled components
const TradesList = styled.div`
  max-height: 80px;
  overflow-y: auto;
  padding: 4px 0;
  background: var(--bg);
  border-top: none;
  border-bottom: none;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.3);
    border-radius: 4px;
  }
`;

const TradeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 4px 8px;
  font-size: 12px;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(${props => props.$isBuy ? '-10px' : '10px'});
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  & > span {
    &:first-child {
      color: ${props => props.$isBuy ? '#0ECB81' : '#F6465D'};
    }
    &:nth-child(2),
    &:last-child {
      text-align: right;
    }
  }
`;

// Add these styled components after the existing styled components
const OrderBookContent = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--bg2);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--line);
    border-radius: 2px;
  }
`;

const AsksContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  /* Use more subtle background with less opacity */
  background: var(--bg); 
  display: flex;
  flex-direction: column-reverse;
  min-height: 200px;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(246, 70, 93, 0.1);
    border-radius: 4px;
  }
`;

const BidsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  /* Use same background as AsksContainer */
  background: var(--bg);
  min-height: 200px;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(14, 203, 129, 0.1);
    border-radius: 4px;
  }
`;

// Fix the calculatePnL function
const calculatePnL = (position, currentMarketPrice) => {
  try {
    const entryPrice = parseFloat(position.entryPrice);
    const margin = parseFloat(position.margin);
    const leverage = parseFloat(position.leverage);
  
    if (isNaN(entryPrice) || isNaN(margin) || isNaN(leverage)) {
      return 0;
    }
  
    if (position.type === 'buy') {
      const priceDiff = currentMarketPrice - entryPrice;
      const percentageChange = (priceDiff / entryPrice) * 100;
      return Number((margin * (percentageChange / 100) * leverage));
    } else {
      const priceDiff = entryPrice - currentMarketPrice;
      const percentageChange = (priceDiff / entryPrice) * 100;
      return Number((margin * (percentageChange / 100) * leverage));
    }
  } catch (error) {
    console.error('Error calculating PnL:', error);
    return 0;
  }
};

// Generate realistic order book data based on current price
const generateOrderBook = (currentPrice, bidAskSpread = 0.002) => {
  // Ensure we have a valid price to work with
  const validPrice = currentPrice && !isNaN(currentPrice) && currentPrice > 0 
    ? Number(currentPrice) // Ensure it's converted to a number 
    : 100;
  
  // Determine price step based on the current price - using 0.01% as requested
  const priceStep = Math.max(0.01, validPrice * 0.0001); // 0.01% of price, minimum 0.01
  
  const asks = [];
  const bids = [];
  const numOrders = 8; // Reduced number of asks and bids to generate to fit without scrolling
  
  // Calculate the spread price (very small spread)
  const spreadAmount = validPrice * 0.0001; // 0.01% spread
  const askStartPrice = validPrice + (spreadAmount / 2);
  const bidStartPrice = validPrice - (spreadAmount / 2);
  
  // Generate ask prices (sells above current price)
  for (let i = 0; i < numOrders; i++) {
    const price = Number(askStartPrice + (i * priceStep));
    // Generate random volume between 0.01 and 0.5 for high value coins
    const quantity = validPrice > 100 
      ? Number(Math.random() * 0.49 + 0.01) 
      : Number(Math.random() * 10 + 1);
    const total = Number(price * quantity);
    
    asks.push({
      price,
      quantity,
      total
    });
  }
  
  // Generate bid prices (buys below current price)
  for (let i = 0; i < numOrders; i++) {
    const price = Number(bidStartPrice - (i * priceStep));
    // Generate random volume between 0.01 and 0.5 for high value coins
    const quantity = validPrice > 100 
      ? Number(Math.random() * 0.49 + 0.01) 
      : Number(Math.random() * 10 + 1);
    const total = Number(price * quantity);
    
    bids.push({
      price,
      quantity, 
      total
    });
  }
  
  // Sort asks in descending order (highest sell at top)
  asks.sort((a, b) => b.price - a.price);
  
  // Return formatted order book data
  return {
    asks,
    bids,
    marketPrice: validPrice
  };
};

// Export a single function for order book data that everyone will use
const createOrderBookData = (marketPrice, symbol, buyRatio = 0.5) => {
  if (!marketPrice || isNaN(marketPrice)) {
    console.warn('Invalid market price for order book:', marketPrice);
    return { asks: [], bids: [] };
  }

  // Use very tight spread for all assets as requested
  const bidAskSpread = 0.0001; // 0.01% spread

  // Generate consistent order book data
  const orderBook = generateOrderBook(marketPrice, bidAskSpread);
  
  return orderBook;
};

// Replace all existing functions with this single implementation
const generateMockOrderBookData = createOrderBookData;
const generateDummyOrders = createOrderBookData;

const formatSmallNumber = (num) => {
  // Convert string to number if needed
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number) || number === null) return '0.00';
  
  // For extremely small numbers (less than 0.00000001)
  if (number < 0.00000001 && number > 0) {
    return '<0.00000001';
  }
  
  // For very small numbers (less than 0.0001)
  if (number < 0.0001 && number > 0) {
    // Display all significant digits for very small numbers
    const scientificNotation = number.toExponential();
    if (scientificNotation.includes('e-')) {
      // Format with appropriate decimal places based on the exponent
      const exponent = parseInt(scientificNotation.split('e-')[1], 10);
      return number.toFixed(exponent + 2).replace(/\.?0+$/, '');
    }
    return number.toFixed(8);
  }
  
  // For small numbers (0.0001 to 0.001)
  if (number < 0.001) {
    return number.toFixed(7);
  }
  
  // For numbers between 0.001 and 0.01
  if (number < 0.01) {
    return number.toFixed(6);
  }
  
  // For numbers between 0.01 and 0.1
  if (number < 0.1) {
    return number.toFixed(5);
  }
  
  // For numbers between 0.1 and 1
  if (number < 1) {
    return number.toFixed(4);
  }
  
  // For numbers between 1 and 100
  if (number < 100) {
    return number.toFixed(2);
  }
  
  // For larger numbers, format with commas and no decimal places
  return number.toLocaleString(undefined, {maximumFractionDigits: 0});
};

// Helper function to safely cleanup resources
const safelyCleanup = (resource) => {
  if (resource && typeof resource === 'function') {
    try {
      resource();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  } else if (resource && typeof resource.destroy === 'function') {
    try {
      resource.destroy();
    } catch (error) {
      console.error('Error destroying resource:', error);
    }
  } else if (resource && typeof resource.close === 'function') {
    try {
      resource.close();
    } catch (error) {
      console.error('Error closing resource:', error);
    }
  }
};

/**
 * Generates a random updated price based on the current price with realistic volatility
 * @param {number} currentPrice - The current market price
 * @returns {number} - A new price with slight random variation
 */
const getRandomUpdatedPrice = (currentPrice) => {
  if (!currentPrice || currentPrice <= 0) return 0.04;
  
  // Smaller price changes for more stable updates
  const volatilityPercentage = 0.002; // Max 0.2% change per update
  const changePercent = (Math.random() * 2 - 1) * volatilityPercentage;
  
  // Calculate new price
  let newPrice = currentPrice * (1 + changePercent);
  
  // Ensure price doesn't drop below minimum values
  if (newPrice < 0.01) {
    newPrice = Math.max(newPrice, 0.01);
  }
  
  // Round appropriately based on price magnitude
  if (newPrice < 0.1) {
    return Math.round(newPrice * 100000) / 100000;
  } else if (newPrice < 1) {
    return Math.round(newPrice * 10000) / 10000;
  } else if (newPrice < 10) {
    return Math.round(newPrice * 1000) / 1000;
  } else if (newPrice < 100) {
    return Math.round(newPrice * 100) / 100;
  }
  
  return Math.round(newPrice * 10) / 10;
};

// Add a function to play sound effect
const playTradeSound = () => {
  try {
    const audio = new Audio(soundEffect);
    audio.play().catch(error => {
      console.warn('Error playing trade sound:', error);
    });
  } catch (error) {
    console.warn('Error initializing trade sound:', error);
  }
};

// Move these styled components outside the Trading component function
const OrderPrice = styled.div`
  color: ${props => props.type === 'ask' ? 'var(--red)' : 'var(--green)'};
  font-family: 'Roboto Mono', monospace;
  
  sub {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const OrderBookTable = styled.div`
  width: 100%;
  font-size: 11px;
  border: 1px solid #D4AF37;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.2);
  height: 95%;
  display: flex;
  flex-direction: column;
  
  .header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 3px 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #666;
    font-size: 10px;
    position: sticky;
    top: 0;
    background: var(--bg2);
    z-index: 1;
  }
  
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 2px 4px;
    cursor: pointer;
    transition: background 0.1s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`;

// First, define the WebSocket setup function outside useEffect
const setupWebSocketConnection = useCallback((symbol, handlers) => {
  const formattedSymbol = symbol.endsWith('usdt') ? symbol : `${symbol}usdt`;
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${formattedSymbol}@trade`);
  
  ws.onmessage = handlers.onMessage;
  ws.onerror = handlers.onError;
  ws.onclose = handlers.onClose;
  
  return ws;
  }, []);

// Then update the price update effect
  useEffect(() => {
  if (!cryptoData || !isOnline) return;

  let wsConnection = null;
  let priceInterval = null;

    const updatePrice = async () => {
        try {
          const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btc';
      const coinId = symbol === 'btc' || symbol === 'btcusdt' ? 'bitcoin' :
                    symbol === 'eth' || symbol === 'ethusdt' ? 'ethereum' :
                    symbol.replace('usdt', '');
      
          const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
          
      if (response.data[coinId]?.usd) {
            const newPrice = parseFloat(response.data[coinId].usd);
            if (!isNaN(newPrice) && newPrice > 0) {
              setMarketPrice(newPrice);
              setLastPrice(newPrice);
              setCurrentPrice(newPrice);
              setOrderBook(generateDummyOrders(newPrice));
            }
          }
        } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const wsHandlers = {
    onMessage: (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.p) {
              const newPrice = parseFloat(data.p);
              if (!isNaN(newPrice) && newPrice > 0) {
                setMarketPrice(newPrice);
                setLastPrice(newPrice);
                setCurrentPrice(newPrice);
                setOrderBook(generateDummyOrders(newPrice));
              }
      }
    } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
    },
    onError: (error) => {
          console.error('WebSocket error:', error);
    },
    onClose: () => {
        console.log('WebSocket connection closed');
    }
    };

  // Initial price update
    updatePrice();

  // Set up WebSocket
  const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btc';
  wsConnection = setupWebSocketConnection(symbol, wsHandlers);

  // Fallback interval for price updates
  priceInterval = setInterval(updatePrice, 30000);

      return () => {
    if (wsConnection) {
      wsConnection.close();
    }
    if (priceInterval) {
      clearInterval(priceInterval);
    }
  };
}, [cryptoData, isOnline, setupWebSocketConnection]);

// Separate effect for order book updates
  useEffect(() => {
  if (!isOnline || !marketPrice) return;

  const interval = setInterval(() => {
    const newOrders = generateDummyOrders(marketPrice);
    setOrderBook(newOrders);
    
    const newBuyRatio = Math.floor(Math.random() * 40) + 10;
    setBuyRatio(newBuyRatio);
    
    const newFlash = {};
    newOrders.asks.forEach((_, i) => {
      if (Math.random() > 0.7) {
        newFlash[`ask-${i}`] = true;
      }
    });
    
    newOrders.bids.forEach((_, i) => {
      if (Math.random() > 0.7) {
        newFlash[`bid-${i}`] = true;
      }
    });
    
    setOrderBookFlash(newFlash);
    setTimeout(() => setOrderBookFlash({}), 600);
  }, 4000);

  return () => clearInterval(interval);
}, [isOnline, marketPrice]);

// Trading component function
const Trading = () => {
  // State declarations
  const { cryptoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [theme] = useState('dark');
  const [cryptoData, setCryptoData] = useState(location.state?.cryptoData || null);
  const [timeframe, setTimeframe] = useState('1H');
  const [orderType, setOrderType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [chartKey, setChartKey] = useState(0);
  const [orderMode, setOrderMode] = useState('market');
  const [leverage, setLeverage] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [positions, setPositions] = useState({ open: [], closed: [] });
  const [userPnL, setUserPnL] = useState(0);
  const [error, setError] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [userBalance, setUserBalance] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPending, setIsPending] = useState(false);
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [pendingLimitOrders, setPendingLimitOrders] = useState([]);
  const [inputKey, setInputKey] = useState(0);
  const [lastPrice, setLastPrice] = useState(0);
  const [marketPrice, setMarketPrice] = useState(0);
  const [closingPositionId, setClosingPositionId] = useState(null);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [priceData, setPriceData] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [buyRatio, setBuyRatio] = useState(0.5);
  const [orderBookFlash, setOrderBookFlash] = useState({});
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [lastCheckedPrice, setLastCheckedPrice] = useState(0);
  const [ordersBeingExecuted, setOrdersBeingExecuted] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editTargetPrice, setEditTargetPrice] = useState('');

  // Refs
  const ws = useRef(null);
  const priceUpdateInterval = useRef(null);
  const orderUpdateInterval = useRef(null);
  const unsubscribeOrders = useRef(null);
  const unsubscribePositions = useRef(null);

  // Callbacks
  const handleOnline = useCallback(() => setIsOnline(true), []);
  const handleOffline = useCallback(() => setIsOnline(false), []);

  // Price update function
  const updatePrice = useCallback(async () => {
    if (!cryptoData?.token?.symbol) return;
    
    try {
      const symbol = cryptoData.token.symbol.toLowerCase();
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
      
      if (response.data[symbol]?.usd) {
        const newPrice = parseFloat(response.data[symbol].usd);
          if (!isNaN(newPrice) && newPrice > 0) {
            setMarketPrice(newPrice);
            setLastPrice(newPrice);
            setCurrentPrice(newPrice);
            setOrderBook(generateDummyOrders(newPrice));
          }
        }
      } catch (error) {
      console.error('Error updating price:', error);
    }
  }, [cryptoData?.token?.symbol]);

  // Effects
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  useEffect(() => {
    if (!cryptoData || !isOnline) return;

    // Initial price update
    updatePrice();

    // Set up interval for price updates
    const interval = setInterval(updatePrice, 30000);

    return () => clearInterval(interval);
  }, [cryptoData, isOnline, updatePrice]);

  useEffect(() => {
    if (!isOnline || !marketPrice) return;

    const interval = setInterval(() => {
      const newOrders = generateDummyOrders(marketPrice);
      setOrderBook(newOrders);
      setBuyRatio(Math.floor(Math.random() * 40) + 10);

      const newFlash = {};
      [...Array(10)].forEach((_, i) => {
        if (Math.random() > 0.7) {
          newFlash[`ask-${i}`] = true;
          newFlash[`bid-${i}`] = true;
        }
      });

      setOrderBookFlash(newFlash);
      setTimeout(() => setOrderBookFlash({}), 600);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isOnline, marketPrice]);

  // ... rest of the component code ...

    return (
      <TradingContainer>
      {/* ... JSX content ... */}
      </TradingContainer>
    );
};

// Add new styled components
const LoginPrompt = styled.div`
  text-align: center;
  padding: 40px;
  background: var(--bg2);
  border-radius: 8px;
  margin: 20px 0;

  h3 {
    color: var(--text);
    margin-bottom: 16px;
  }

  p {
    color: var(--onsurface);
    margin-bottom: 24px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const StyledButton = styled.button`
  padding: 12px 24px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:first-child {
    background: var(--primary);
    color: white;

    &:hover {
      background: var(--primary-dark);
    }
  }

  &:last-child {
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);

    &:hover {
      background: var(--primary);
      color: white;
    }
  }
`;

const StatusMessage = styled.div`
  color: ${props => props.error ? '#F6465D' : '#0ECB81'};
  padding: 8px;
  text-align: center;
  background: ${props => props.error ? 'rgba(246, 70, 93, 0.1)' : 'rgba(14, 203, 129, 0.1)'};
  border-radius: 4px;
  margin-bottom: 16px;
`;

// Add these new styled components for the professional order book
const OrderBookArrow = styled.span`
  color: ${props => props.$direction === 'up' ? '#0ECB81' : '#F6465D'};
  margin-right: 4px;
  font-size: 14px;
`;

const OrderBookFlag = styled.span`
  color: #F0B90B;
  margin-left: 4px;
  font-size: 12px;
`;

const OrderBookRatio = styled.div`
  display: flex;
  align-items: center;
  height: 28px;
  background: linear-gradient(
    to right,
    rgba(14, 203, 129, 0.2) ${props => props.$buyPercent}%,
    rgba(246, 70, 93, 0.2) ${props => props.$buyPercent}%
  );
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
`;

const RatioIndicator = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 0 8px;
  align-items: center;
  
  span {
    font-size: 12px;
    font-weight: 500;
    padding: 3px 6px;
    border-radius: 4px;
    
    &:first-child {
      background: rgba(14, 203, 129, 0.3);
      color: #0ECB81;
    }
    
    &:last-child {
      background: rgba(246, 70, 93, 0.3);
      color: #F6465D;
    }
  }
`;

const TabsContainer = styled.div`
  .react-tabs {
    &__tab-list {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0;
      border-bottom: 1px solid var(--line);
    }
    
    &__tab {
      padding: 12px 24px;
      cursor: pointer;
      color: var(--text2);
      border: none;
      background: transparent;
      
      &--selected {
        color: var(--text1);
        border-bottom: 2px solid var(--primary);
      }
    }
    
    &__tab-panel {
      display: none;
      padding: 0;
      
      &--selected {
        display: block;
      }
    }
  }
`;

export default Trading; 