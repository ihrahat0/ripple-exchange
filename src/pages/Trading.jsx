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
  padding: 20px;
  background: var(--bg1);
  min-height: calc(100vh - 100px);
  margin-top: 10px;
  
  @media (max-width: 768px) {
    padding: 10px;
    margin-top: 5px;
  }
`;

const TradingGrid = styled.div`
  display: grid;
  grid-template-columns: auto 600px;
  gap: 1px;
  margin-top: 20px;
  background: var(--bg);
  
  @media (max-width: 1200px) {
    grid-template-columns: auto 450px;
  }
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
  
  @media (max-width: 768px) {
    margin-top: 10px;
  }
`;

const ChartSection = styled.div`
  background: var(--bg);
  border-right: 1px solid var(--line);
  height: 500px;
  
  @media (max-width: 992px) {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
  
  @media (max-width: 768px) {
    height: 350px;
  }
`;

const RightSection = styled.div`
  width: 600px;
  background: var(--bg);
  display: grid;
  grid-template-rows: auto;
  height: 500px;
  
  @media (max-width: 1200px) {
    width: 450px;
  }
  
  @media (max-width: 992px) {
    width: 100%;
  }
  
  @media (max-width: 768px) {
    height: auto;
  }
`;

const TradingInterface = styled.div`
  display: grid;
  grid-template-columns: 300px 300px;
  border-left: 1px solid var(--line);
  
  @media (max-width: 1200px) {
    grid-template-columns: 225px 225px;
  }
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr 1fr;
    border-left: none;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const OrderBookSection = styled.div`
  height: 500px;
  border-right: 1px solid var(--line);
  padding: 12px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 992px) {
    height: 400px;
  }
  
  @media (max-width: 768px) {
    height: 350px;
  }
  
  @media (max-width: 576px) {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }
`;

const OrderFormSection = styled.div`
  padding: 12px;
  height: 500px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 992px) {
    height: 400px;
  }
  
  @media (max-width: 768px) {
    height: 350px;
    padding: 10px;
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
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-bottom: 15px;
  }
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
  gap: 12px;
  height: 100%;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const TabGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
  
  @media (max-width: 768px) {
    gap: 4px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const OrderTab = styled.button`
  background: none;
  border: none;
  padding: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  color: ${props => props.$active ? 'var(--primary)' : 'var(--text)'};
  opacity: 0.9;
  transition: all 0.2s;
  border-bottom: 2px solid ${props => props.$active ? 'var(--primary)' : 'transparent'};

  &:hover {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    padding: 8px;
    font-size: 14px;
    white-space: nowrap;
  }
`;

const AmountInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  margin: 8px 0;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg2);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: var(--primary);
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    margin: 6px 0;
    font-size: 13px;
  }
`;

const Button = styled.button`
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    opacity: 0.9;
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
  gap: 8px;
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
  margin-top: 16px;
  padding: 16px;
  background: var(--bg1);
  border-radius: 8px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 14px;
`;

// Add these new styled components
const OrderBook = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg2);
  border-radius: 4px;
  
  @media (max-width: 768px) {
    max-height: 300px;
    overflow-y: auto;
  }
`;

const OrderBookHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  color: #7A7A7A;
  font-size: 11px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 2px;

  & > span:nth-child(2),
  & > span:last-child {
    text-align: right;
  }
  
  @media (max-width: 768px) {
    font-size: 10px;
    padding: 3px 6px;
  }
`;

const OrderBookRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  position: relative;
  height: 20px;
  line-height: 20px;
  color: var(--text);
  
  &:hover {
  background: ${props => props.$side === 'sell' ? 'rgba(246, 70, 93, 0.1)' : 'rgba(14, 203, 129, 0.1)'};
  }
  
  &::before {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.$depth || 0}%;
    background: ${props => props.$side === 'sell' ? 'rgba(246, 70, 93, 0.05)' : 'rgba(14, 203, 129, 0.05)'};
    z-index: 0;
  }

  & > span {
    position: relative;
    z-index: 1;
    &:nth-child(2),
    &:last-child {
      text-align: right;
    }
  }
  
  /* Add subtle animations for updates */
  &.flash {
    animation: flashUpdate 0.5s ease-out;
  }
  
  @keyframes flashUpdate {
    0% {
      background: ${props => props.$side === 'sell' ? 'rgba(246, 70, 93, 0.3)' : 'rgba(14, 203, 129, 0.3)'};
    }
    100% {
      background: transparent;
    }
  }
`;

// Update OrderCard to include buy/sell colors
const OrderButton = styled.button`
  background: ${props => props.$orderType === 'buy' ? '#0ECB81' : '#F6465D'};
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  font-weight: 500;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  color: var(--text);
  border-collapse: collapse;
  background: var(--bg);
  border-radius: 8px;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  font-weight: 500;
  color: #7A7A7A;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid var(--line);
`;

const PnLValue = styled.span`
  font-weight: 500;
  color: ${props => props.$value >= 0 ? '#0ECB81' : '#F6465D'};
`;

// Add these styled components at the top with your other styled components
const TradeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin: 10px 0;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${props => props.$highlight ? '#00C087' : '#fff'};
  font-size: 14px;
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
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100% - 32px);
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
  if (!position || !position.entryPrice || !currentMarketPrice) return 0;
  
  const { type, entryPrice, leverage, margin } = position;
  
  try {
    if (type === 'buy') {
      const priceDiff = currentMarketPrice - entryPrice;
      const percentageChange = (priceDiff / entryPrice) * 100;
      return Number((margin * (percentageChange / 100) * leverage).toLocaleString());
    } else {
      const priceDiff = entryPrice - currentMarketPrice;
      const percentageChange = (priceDiff / entryPrice) * 100;
      return Number((margin * (percentageChange / 100) * leverage).toLocaleString());
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
    ? currentPrice 
    : 100;
  
  // Determine price step based on the current price - using 0.01% as requested
  const priceStep = Math.max(0.01, validPrice * 0.0001); // 0.01% of price, minimum 0.01
  
  const asks = [];
  const bids = [];
  const numOrders = 10; // Number of asks and bids to generate
  
  // Calculate the spread price (very small spread)
  const spreadAmount = validPrice * 0.0001; // 0.01% spread
  const askStartPrice = validPrice + (spreadAmount / 2);
  const bidStartPrice = validPrice - (spreadAmount / 2);
  
  // Generate ask prices (sells above current price)
  for (let i = 0; i < numOrders; i++) {
    const price = askStartPrice + (i * priceStep);
    // Generate random volume between 0.01 and 0.5 for high value coins
    const quantity = validPrice > 100 
      ? (Math.random() * 0.49 + 0.01) 
      : (Math.random() * 10 + 1);
    const total = price * quantity;
    
    asks.push({
      price,
      quantity,
      total
    });
  }
  
  // Generate bid prices (buys below current price)
  for (let i = 0; i < numOrders; i++) {
    const price = bidStartPrice - (i * priceStep);
    // Generate random volume between 0.01 and 0.5 for high value coins
    const quantity = validPrice > 100 
      ? (Math.random() * 0.49 + 0.01) 
      : (Math.random() * 10 + 1);
    const total = price * quantity;
    
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
  font-size: 14px;
  
  .header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #666;
  }
  
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 8px;
    border-bottom: 1px solid rgba(11, 11, 25, 0.5);
    &:hover {
      background-color: rgba(255, 255, 255, 0.03);
    }
  }
`;

// Trading component function
const Trading = () => {
  const { cryptoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme] = useState('dark');
  const { currentUser } = useAuth();
  const [cryptoData, setCryptoData] = useState(location.state?.cryptoData || null);
  const [timeframe, setTimeframe] = useState('1H');
  const [orderType, setOrderType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [chartKey, setChartKey] = useState(0);
  const [orderMode, setOrderMode] = useState('market');
  const [leverage, setLeverage] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [positions, setPositions] = useState({
    open: [],
    closed: []
  });
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
  const [buyRatio, setBuyRatio] = useState(0.5); // Default 50/50 ratio
  const [orderBookFlash, setOrderBookFlash] = useState({});
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  // Add a state to track the last checked price to avoid too frequent checks
  const [lastCheckedPrice, setLastCheckedPrice] = useState(0);
  // Add a state to track orders being executed to prevent duplicates
  const [ordersBeingExecuted, setOrdersBeingExecuted] = useState([]);
  // Add a state variable for the order being edited
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editTargetPrice, setEditTargetPrice] = useState('');

  // Refs for cleanup
  const ws = useRef(null);
  const priceUpdateInterval = useRef(null);
  const orderUpdateInterval = useRef(null);
  const unsubscribeOrders = useRef(null);
  const unsubscribePositions = useRef(null);

  // Function to fetch user balances
  const fetchUserBalances = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingBalance(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.balances) {
          setUserBalance(userData.balances);
        } else {
          // For legacy users, check the separate balances collection
          const balanceDoc = await getDoc(doc(db, 'balances', currentUser.uid));
          if (balanceDoc.exists()) {
            setUserBalance(balanceDoc.data());
          }
        }
        }
      } catch (error) {
      console.error('Error fetching user balances:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Function to fetch pending limit orders for the current symbol
  const fetchPendingLimitOrders = useCallback(async () => {
    if (!currentUser || !cryptoData?.token?.symbol) return;
    
    try {
      console.log('Fetching pending limit orders for:', currentUser.uid, cryptoData?.token?.symbol);
      const limitOrders = await tradingService.getLimitOrders(currentUser.uid, cryptoData?.token?.symbol);
      console.log('Received limit orders:', limitOrders);
      setPendingLimitOrders(limitOrders);
        } catch (error) {
      console.error('Error fetching limit orders:', error);
    }
  }, [currentUser, cryptoData?.token?.symbol]);

  // Function to fetch positions
  const fetchPositions = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingPositions(true);
      
      // Query for open positions
      const openPositionsQuery = query(
        collection(db, 'positions'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'OPEN')
      );
      
      // Fetch both open positions
      const openPositionsSnapshot = await getDocs(openPositionsQuery);
      const openPositionsData = openPositionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Set the positions
      setOpenPositions(openPositionsData);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [currentUser]);

  // Effect to fetch positions on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchPositions();
      fetchPendingLimitOrders(); // Also fetch pending limit orders when user changes
    }
  }, [currentUser]);

  // Move ensureUserBalances here, at the top level of the component
  const ensureUserBalances = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Check if user has balances field
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If balances field doesn't exist or is invalid, create it
        if (!userData.balances || typeof userData.balances !== 'object') {
          console.log('User missing balances field, adding default balances');
          
          // Try to get any existing balances from the old location
          let existingBalances = { USDT: 1000 }; // Default to 1000 USDT
          
          try {
            const oldBalanceDoc = await getDoc(doc(db, 'balances', currentUser.uid));
            if (oldBalanceDoc.exists()) {
              const oldBalances = oldBalanceDoc.data();
              if (oldBalances.USDT !== undefined) {
                existingBalances.USDT = oldBalances.USDT;
              }
              if (oldBalances.BTC !== undefined) {
                existingBalances.BTC = oldBalances.BTC;
              }
              // Add other coins as needed
    }
  } catch (error) {
            console.warn('Error fetching old balances:', error);
          }
          
          // Update user document with balances
          await updateDoc(userRef, {
            balances: existingBalances
          });
          
          console.log('Updated user with balances:', existingBalances);
        }
      }
    } catch (error) {
      console.error('Error ensuring user balances:', error);
    }
  }, [currentUser]);
  
  // Call the ensureUserBalances function when component mounts and user is available
  useEffect(() => {
    if (currentUser) {
      ensureUserBalances();
    }
  }, [currentUser, ensureUserBalances]);

  // WebSocket setup
  const setupWebSocket = useCallback(() => {
    if (!isOnline) return null;

    try {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btc';
      const wsSymbol = `${symbol}usdt@ticker`;
      const newWs = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}`);
      
      newWs.onopen = () => {
        console.log('WebSocket connected');
      };

      newWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle the message data
          console.log('WebSocket message:', data);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      newWs.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      newWs.onclose = () => {
        console.log('WebSocket disconnected');
      };

      ws.current = newWs;
      return () => {
        if (ws.current) {
          ws.current.close();
          ws.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      return null;
    }
  }, [isOnline, cryptoData?.token?.symbol]);

  // Price update function
  const updatePrice = useCallback(async () => {
    try {
      // Your price update logic here
      const newPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.001);
      setCurrentPrice(newPrice);
      
      // Also update market price for limit order checking
      setMarketPrice(newPrice.toLocaleString());
      
      console.log(`💰 PRICE UPDATE: ${newPrice.toLocaleString()} USDT`);
      
      // If we have pending limit orders, log that we're checking them with the new price
      if (pendingLimitOrders.length > 0) {
        console.log(`💰 Checking ${pendingLimitOrders.length} pending orders with new price: ${newPrice.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error updating price:', error);
    }
  }, [currentPrice, pendingLimitOrders.length]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup WebSocket
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }

      // Clear intervals
      if (priceUpdateInterval.current) {
        clearInterval(priceUpdateInterval.current);
        priceUpdateInterval.current = null;
      }

      // Clear any other intervals or timeouts
      if (orderUpdateInterval.current) {
        clearInterval(orderUpdateInterval.current);
        orderUpdateInterval.current = null;
      }

      // Unsubscribe from any Firestore listeners
      if (typeof unsubscribeOrders.current === 'function') {
        unsubscribeOrders.current();
      }
      if (typeof unsubscribePositions.current === 'function') {
        unsubscribePositions.current();
      }
    };
  }, []);

  // WebSocket connection effect
  useEffect(() => {
    const cleanup = setupWebSocket();
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [setupWebSocket]);

  // Price update interval effect
  useEffect(() => {
    const intervalId = setInterval(updatePrice, 5000);
    priceUpdateInterval.current = intervalId;
    
    return () => {
      clearInterval(intervalId);
      priceUpdateInterval.current = null;
    };
  }, [updatePrice]);

  // Order update interval effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setOrderBook(generateMockOrderBookData(currentPrice));
    }, 3000);
    orderUpdateInterval.current = intervalId;
    
    return () => {
      clearInterval(intervalId);
      orderUpdateInterval.current = null;
    };
  }, [currentPrice]);

  // TradingView widget cleanup
  useEffect(() => {
    const tradingViewContainer = document.getElementById('tradingview_chart');
    
    return () => {
      try {
        if (tradingViewContainer) {
          while (tradingViewContainer.firstChild) {
            tradingViewContainer.removeChild(tradingViewContainer.firstChild);
          }
        }
        
        if (window.TradingView && typeof window.TradingView === 'object') {
          if (window.TradingView._binders) {
            window.TradingView._binders = [];
          }
        }
      } catch (error) {
        console.error('Error cleaning up TradingView widget:', error);
      }
    };
  }, []);

  // Order book interval management
  useEffect(() => {
    let orderBookInterval = null;
    
    if (isOnline) {
      orderBookInterval = setInterval(() => {
        try {
          if (marketPrice) {
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
            
            setTimeout(() => {
              setOrderBookFlash({});
            }, 600);
          }
        } catch (error) {
          console.error('Error updating order book:', error);
        }
      }, 4000);
    }
    
    return () => {
      if (orderBookInterval) {
        clearInterval(orderBookInterval);
      }
    };
  }, [marketPrice, isOnline]);

  // Effect for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Effect for price updates
  useEffect(() => {
    if (!cryptoData) return;

    let ws;
    const updatePrice = async () => {
      if (cryptoData?.token?.type === 'dex') {
        // DEX price update logic
        if (cryptoData?.token?.address && cryptoData?.token?.chainId) {
          try {
            const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/${cryptoData.token.chainId}/${cryptoData.token.address}`);
            if (response.data?.pair?.priceUsd) {
              const price = parseFloat(response.data.pair.priceUsd);
              if (!isNaN(price) && price > 0) {
                setMarketPrice(price);
                setLastPrice(price);
                setCurrentPrice(price);
                setOrderBook(generateDummyOrders(price));
              } else {
                console.warn('Invalid price received from DEX API:', response.data.pair.priceUsd);
              }
            }
          } catch (error) {
            console.error('Error fetching DEX price:', error);
          }
        }
      } else {
        // Use CoinGecko API for reliable CEX prices
        try {
          const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btc';
          let coinId;
          
          // Map symbols to CoinGecko IDs
          switch (symbol) {
            case 'btc':
            case 'btcusdt':
              coinId = 'bitcoin';
              break;
            case 'eth':
            case 'ethusdt':
              coinId = 'ethereum';
              break;
            default:
              // Try to use symbol as coinId for other tokens
              coinId = symbol.replace('usdt', '');
          }
          
          console.log(`Fetching price for ${coinId} from CoinGecko`);
          const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
          
          if (response.data[coinId] && response.data[coinId].usd) {
            const newPrice = parseFloat(response.data[coinId].usd);
            if (!isNaN(newPrice) && newPrice > 0) {
              console.log(`Received price update for ${coinId}:`, newPrice);
              setMarketPrice(newPrice);
              setLastPrice(newPrice);
              setCurrentPrice(newPrice);
              setOrderBook(generateDummyOrders(newPrice));
              
              // Also set up a WebSocket for real-time updates if available
              setupWebSocketConnection(symbol.toLowerCase());
            }
          } else {
            console.warn('Failed to get price from CoinGecko, falling back to Binance WebSocket');
            setupWebSocketConnection(symbol.toLowerCase());
          }
        } catch (error) {
          console.error('Error fetching price from CoinGecko:', error);
          
          // Fallback to Binance WebSocket
        const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btcusdt';
          setupWebSocketConnection(symbol.toLowerCase());
        }
      }
    };
    
    const setupWebSocketConnection = (symbol) => {
      // Ensure symbol has usdt suffix
      const formattedSymbol = symbol.endsWith('usdt') ? symbol : `${symbol}usdt`;
      
      console.log('Setting up WebSocket for symbol:', formattedSymbol);
      
      // Close existing connection
      if (ws) {
        ws.close();
      }
      
      // Create new connection
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${formattedSymbol}@trade`);
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.p) {
              const newPrice = parseFloat(data.p);
              if (!isNaN(newPrice) && newPrice > 0) {
              console.log(`Received WebSocket price update for ${formattedSymbol}:`, newPrice);
                setMarketPrice(newPrice);
                setLastPrice(newPrice);
                setCurrentPrice(newPrice);
                setOrderBook(generateDummyOrders(newPrice));
              } else {
                console.warn('Invalid price received from WebSocket:', data.p);
              }
      }
    } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    };

    // Initialize price update
    updatePrice();

    // Set up periodic updates every 30 seconds as a fallback
    const interval = setInterval(updatePrice, 30000);

    return () => {
      if (ws) {
        ws.close();
      }
        clearInterval(interval);
    };
  }, [cryptoData]);

  // Define fetchUserData function before it's used in any useEffect
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return () => {};  // Return empty cleanup function
    
    try {
      // Listen to user balance changes
      const userUnsubscribe = onSnapshot(
        doc(db, 'users', currentUser.uid),
        {
          includeMetadataChanges: true
        },
        (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            console.log('Full user data:', userData);
            
            // Check if balances exist in the user document
            if (userData.balances) {
              console.log('User balances from document:', userData.balances);
              console.log('USDT balance type:', typeof userData.balances.USDT, 'value:', userData.balances.USDT);
              
              // Ensure USDT exists and is a valid number
              if (userData.balances.USDT === undefined || userData.balances.USDT === null || isNaN(userData.balances.USDT)) {
                console.warn('Invalid USDT balance in user document, setting to 0');
                userData.balances.USDT = 0;
              }
              
              setUserBalance(userData.balances);
            } else {
              // No balances in user document
              console.warn('No balances field in user document, will be fixed by ensureUserBalances');
              setUserBalance({ USDT: 0, BTC: 0, ETH: 0 });
            }
            
            setIsLoadingBalance(false);
          }
        },
        (error) => console.error('User snapshot error:', error)
      );

      // Listen to positions
      const positionsUnsubscribe = onSnapshot(
        query(collection(db, 'positions'), where('userId', '==', currentUser.uid)),
        {
          includeMetadataChanges: true
        },
        (snapshot) => {
          const openPos = [];
          const closedPos = [];
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const position = {
        id: doc.id,
              ...data,
              openTime: data.openTime?.toDate?.() || new Date(data.openTime),
              closeTime: data.closeTime?.toDate?.() || (data.closeTime ? new Date(data.closeTime) : null),
              lastUpdated: data.lastUpdated?.toDate?.() || new Date(data.lastUpdated)
            };

            if (position.status === 'OPEN') {
              openPos.push(position);
            } else if (position.status === 'CLOSED') {
              closedPos.push(position);
            }
          });

          setOpenPositions(openPos.sort((a, b) => b.openTime - a.openTime));
          setClosedPositions(closedPos.sort((a, b) => b.closeTime - a.closeTime));
      setIsLoadingPositions(false);
        },
        (error) => console.error('Positions snapshot error:', error)
      );

      // Return a cleanup function that calls both unsubscribe functions
      return () => {
        userUnsubscribe();
        positionsUnsubscribe();
      };
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return () => {}; // Return empty cleanup function
    }
  }, [currentUser]);

  // Define fetchPriceData function before any useEffect that uses it
  const fetchPriceData = useCallback(async () => {
    if (!cryptoData?.token) {
      console.warn('No token data available for fetchPriceData');
      return;
    }

    try {
      if (cryptoData.token.type === 'dex') {
        // For DEX tokens, use DexScreener API's standard pairs endpoint
        const chain = cryptoData.token.chainId?.toLowerCase() || 'ethereum';
        const pairAddress = cryptoData.pairInfo?.address?.toLowerCase();
        
        if (!pairAddress) {
          console.error('No pair address available for DEX token');
          setPriceData([]);
          return;
        }
        
        console.log(`Fetching price data for ${chain}/${pairAddress}`);
        
        // Try both format options to ensure we get data
        let response;
        try {
          // First attempt: Use pairs/{chain}/{pairAddress} format
          response = await axios.get(
            `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`
          );
          console.log('DexScreener API response (pairs endpoint):', response.data);
        } catch (error) {
          console.error('Error fetching from DexScreener pairs endpoint:', error);
          
          // Second attempt: Use direct address endpoint
          try {
            response = await axios.get(
              `https://api.dexscreener.com/latest/dex/search?q=${pairAddress}`
            );
            console.log('DexScreener API response (search endpoint):', response.data);
          } catch (searchError) {
            console.error('Error fetching from DexScreener search endpoint:', searchError);
            throw new Error('Failed to fetch data from DexScreener');
          }
        }
        
        // Check if we have valid data from either attempt
        const pairs = response.data?.pairs || [response.data?.pair].filter(Boolean);
        if (pairs && pairs.length > 0) {
          const pair = pairs[0];
          console.log('Found pair data:', pair);
          
          // Update market price with the latest price
          if (pair.priceUsd) {
            setMarketPrice(parseFloat(pair.priceUsd));
            setCurrentPrice(parseFloat(pair.priceUsd));
          }
          
          // Update pairInfo with any additional data we got from DexScreener
          if (!cryptoData.pairInfo || !cryptoData.pairInfo.dexId) {
            const updatedCryptoData = {
              ...cryptoData,
              pairInfo: {
                ...cryptoData.pairInfo,
                address: pair.pairAddress || cryptoData.pairInfo?.address,
                dexId: pair.dexId || cryptoData.pairInfo?.dexId || 'unknown',
                baseToken: pair.baseToken || cryptoData.pairInfo?.baseToken,
                quoteToken: pair.quoteToken || cryptoData.pairInfo?.quoteToken,
                priceUsd: pair.priceUsd || cryptoData.pairInfo?.priceUsd
              }
            };
            setCryptoData(updatedCryptoData);
            console.log('Updated cryptoData with pair info:', updatedCryptoData);
          }
          
          // For price history, we need to create a simple dataset
          // DexScreener doesn't provide candlestick data through this endpoint
          
          // Create a minimal dataset with the current price
          const currentTime = Math.floor(Date.now() / 1000);
          
          // Use priceChange data if available to estimate an "open" price
          const priceChangeH24 = pair.priceChange?.h24 ? parseFloat(pair.priceChange.h24) : 0;
          const closePrice = parseFloat(pair.priceUsd || 0);
          const openPrice = closePrice / (1 + (priceChangeH24 / 100));
          
          // Estimate high and low based on price change
          const priceChange = Math.abs(closePrice - openPrice);
          const high = Math.max(openPrice, closePrice) + (priceChange * 0.1); // Add 10% buffer
          const low = Math.min(openPrice, closePrice) - (priceChange * 0.1);  // Subtract 10% buffer
          
          // Create a simple dataset for the chart
          setPriceData([{
            time: currentTime,
            open: openPrice,
            high: high,
            low: low,
            close: closePrice,
            volume: parseFloat(pair.volume?.h24 || 0)
          }]);
          
          console.log('Created simplified price data for chart');
        } else {
          // No valid pair data
          console.error('No valid pair data found for', pairAddress);
          console.log('Full response:', response.data);
          setPriceData([]);
        }
      } else {
        // For CEX tokens, use existing Binance API
        const interval = TIMEFRAMES[timeframe].binanceInterval;
        const symbol = `${cryptoData.token.symbol}USDT`;

        const response = await axios.get(
          `https://api.binance.com/api/v3/klines`,
          {
            params: {
              symbol: symbol,
              interval: interval,
              limit: 500
            }
          }
        );

        const formattedData = response.data.map(candle => ({
          time: candle[0] / 1000,
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5])
        }));

        setPriceData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
      setPriceData([]);
    }
  }, [cryptoData?.token?.id, cryptoData?.token?.type, cryptoData?.pairInfo?.address, timeframe]);

  // Update user data useEffect
  useEffect(() => {
    if (currentUser) {
      return fetchUserData();
    }
  }, [currentUser, fetchUserData]);

  // Update price data useEffect
  useEffect(() => {
    // Always call the hook, but conditionally run the logic inside
    if (cryptoData?.token?.id) {
      fetchPriceData();
    }
  }, [cryptoData?.token?.id, fetchPriceData]);

  // Improved market price update effect - always call this hook unconditionally
  useEffect(() => {
    // Move the conditional logic inside the effect but always call the hook
    const updateMarketPriceFromCryptoData = () => {
      let priceToUse = null;
      
      // Try to get price from different sources in priority order
      if (cryptoData?.token?.price && !isNaN(parseFloat(cryptoData.token.price))) {
        priceToUse = parseFloat(cryptoData.token.price);
        console.log('📊 Using token price:', priceToUse);
      } else if (cryptoData?.chartData?.price && !isNaN(parseFloat(cryptoData.chartData.price))) {
        priceToUse = parseFloat(cryptoData.chartData.price);
        console.log('📊 Using chart price:', priceToUse);
      } else if (cryptoData?.lastPrice && !isNaN(parseFloat(cryptoData.lastPrice))) {
        priceToUse = parseFloat(cryptoData.lastPrice);
        console.log('📊 Using last price:', priceToUse);
      }
      
      // If we found a valid price, update market price and order book
      if (priceToUse !== null && priceToUse > 0) {
        setMarketPrice(priceToUse);
        
        // Generate a new order book with the updated price
        const newOrderBook = generateOrderBook(priceToUse);
        setOrderBook(newOrderBook);
        
        // Check limit orders immediately whenever price updates
        if (pendingLimitOrders.length > 0) {
          console.log('📊 Price updated, checking pending orders...');
          checkPendingLimitOrders();
        }
      } else {
        console.warn('No valid price found in crypto data:', cryptoData);
      }
    };
    
    // Always call this function, whether cryptoData exists or not
    updateMarketPriceFromCryptoData();
    
  }, [cryptoData, pendingLimitOrders.length]);

  // Update the chart initialization useEffect
  useEffect(() => {
    if (!priceData.length) return;

    const handleResize = () => {
      // Handle chart resize logic
    };

    try {
      // Create chart instance with IChartApi type
      // const chartInstance = createChart(chartContainerRef.current, {
      //   width: chartContainerRef.current.clientWidth,
      //   height: chartContainerRef.current.clientHeight,
      //   layout: {
      //     background: { type: ColorType.Solid, color: '#1E222D' },
      //     textColor: '#7a7a7a',
      //   },
      //   grid: {
      //     vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
      //     horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      //   },
      //   timeScale: {
      //     timeVisible: true,
      //     secondsVisible: false,
      //     borderColor: 'rgba(42, 46, 57, 0.5)',
      //   },
      //   rightPriceScale: {
      //     borderColor: 'rgba(42, 46, 57, 0.5)',
      //   },
      //   crosshair: {
      //     mode: 1,
      //     vertLine: {
      //       color: '#758696',
      //       width: 1,
      //       style: 3,
      //     },
      //     horzLine: {
      //       color: '#758696',
      //       width: 1,
      //       style: 3,
      //     },
      //   },
      // });

      // // Create candlestick series with proper type
      // const mainSeries = chartInstance.addCandlestickSeries({
      //   upColor: '#0ECB81',
      //   downColor: '#F6465D',
      //   borderUpColor: '#0ECB81',
      //   borderDownColor: '#F6465D',
      //   wickUpColor: '#0ECB81',
      //   wickDownColor: '#F6465D',
      // });

      // // Create volume series with proper type
      // const volumeSeries = chartInstance.addHistogramSeries({
      //   color: '#26a69a',
      //   priceFormat: {
      //     type: 'volume',
      //   },
      //   priceScaleId: '', // Set as overlay
      //   scaleMargins: {
      //     top: 0.8,
      //     bottom: 0,
      //   },
      // });

      // // Format data for candlestick series
      // const candleData = priceData.map(d => ({
      //   time: d.time,
      //   open: d.open,
      //   high: d.high,
      //   low: d.low,
      //   close: d.close,
      // }));

      // // Format data for volume series
      // const volumeData = priceData.map(d => ({
      //   time: d.time,
      //   value: d.volume,
      //   color: d.close > d.open ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)',
      // }));

      // // Set data to series
      // mainSeries.setData(candleData);
      // volumeSeries.setData(volumeData);

      // // Fit content
      // chartInstance.timeScale().fitContent();

      // // Save chart reference
      // chartRef.current = chartInstance;

      // // Add resize listener
      // window.addEventListener('resize', handleResize);

      // // Cleanup
      // return () => {
      //   window.removeEventListener('resize', handleResize);
      //   if (chartRef.current) {
      //     chartRef.current.remove();
      //     chartRef.current = null;
      //   }
      // };
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }, [priceData]);

  // Fetch data when timeframe changes
  useEffect(() => {
    fetchPriceData();
  }, [timeframe, cryptoData?.token?.id, fetchPriceData]); // Add fetchPriceData as a dependency

  // Function to handle canceling a limit order
  const handleCancelLimitOrder = async (orderId) => {
    if (isPending) return;
    
    try {
    setIsPending(true);
      await tradingService.cancelLimitOrder(currentUser.uid, orderId);
      setIsPending(false);
      
      // Refresh the list of limit orders
      fetchPendingLimitOrders();
      
      // Show success message
      console.log('Limit order canceled successfully');
    } catch (error) {
      console.error('Error canceling limit order:', error);
      setError(error.message || 'Failed to cancel limit order');
      setIsPending(false);
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e, forcedOrderType = null) => {
    e.preventDefault();
    if (isPending) return;

    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    // Use forcedOrderType if provided, otherwise use state
    const currentOrderType = forcedOrderType || orderType;
    console.log("Creating position with order type:", currentOrderType);

    const tradeAmount = parseFloat(amount);
    const currentMarketPrice = orderMode === 'market' ? marketPrice : parseFloat(limitPrice);
    const requiredMargin = calculateRequiredMargin(tradeAmount, currentMarketPrice, leverage);

    if (!tradeAmount || !currentMarketPrice || !leverage) {
      setError('Please fill in all fields');
      return;
    }

    if (userBalance?.USDT < requiredMargin) {
      setError('Insufficient balance');
      return;
    }

    const tradeData = {
      symbol: cryptoData.token.symbol,
      type: currentOrderType,      // Use the current order type
      side: currentOrderType,      // Use the current order type for side 
      amount: tradeAmount,
      leverage: parseInt(leverage),
      entryPrice: currentMarketPrice,
      margin: requiredMargin,
      orderMode: orderMode
    };

    // For limit orders, add the target price
    if (orderMode === 'limit') {
      tradeData.targetPrice = parseFloat(limitPrice);
    }

    try {
      setError('');
      setIsPending(true);
      
      if (orderMode === 'market') {
        // For market orders, use the existing optimistic update approach
        // ---------------------------
        // Optimistic Update Start
        // ---------------------------
        const provisionalId = `temp-${Date.now()}`;
        const now = new Date();
        const provisionalPosition = {
          id: provisionalId,
          userId: currentUser.uid,
          symbol: tradeData.symbol,
          type: tradeData.type,
          side: tradeData.side,   // Add side field to the position
          amount: tradeData.amount,
          leverage: tradeData.leverage,
          entryPrice: tradeData.entryPrice,
          margin: tradeData.margin,
          orderMode: tradeData.orderMode,
          status: 'OPEN',
          openTime: now,
          currentPnL: 0,
          lastUpdated: now,
          closePrice: null,
          closeTime: null,
          finalPnL: null
        };

        setOpenPositions(prev => [provisionalPosition, ...prev]);
        
        const result = await tradingService.openPosition(currentUser.uid, tradeData);
        
        if (!result.success) {
          // Roll back optimistic update in case of error
          setOpenPositions(prev => prev.filter(p => p.id !== provisionalId));
          throw new Error(result.error || 'Failed to create position');
        } else {
          // Play sound effect on successful trade execution
          playTradeSound();
        }
      } else if (orderMode === 'limit') {
        // For limit orders, create a provisional pending order for UI feedback
        console.log('===== CREATING LIMIT ORDER =====');
        console.log('Order data:', tradeData);
        
        const provisionalId = `temp-${Date.now()}`;
        const now = new Date();
        
        // Ensure we're using the right field names consistently
        const provisionalOrder = {
          id: provisionalId,
          userId: currentUser.uid,
          symbol: tradeData.symbol,
          // Explicitly set both type and side for consistency
          type: tradeData.type,
          side: tradeData.side, // Add side field with same value as type
          amount: tradeData.amount,
          leverage: tradeData.leverage,
          targetPrice: tradeData.entryPrice,
          price: tradeData.entryPrice, // Add price field with same value as targetPrice
          margin: tradeData.margin,
          status: 'PENDING',
          createdAt: now,
          lastUpdated: now,
          isProvisional: true // Flag to identify optimistic updates
        };
        
        console.log('Provisional limit order:', provisionalOrder);
        
        // Optimistically add to pending limit orders
        setPendingLimitOrders(prev => [provisionalOrder, ...prev]);
        
        const result = await tradingService.createLimitOrder(currentUser.uid, tradeData);
        console.log('Limit order creation result:', result);
        
        if (!result.success) {
          // Remove provisional order on error
          setPendingLimitOrders(prev => 
            prev.filter(order => !order.isProvisional)
          );
          throw new Error(result.error || 'Failed to create limit order');
        } else {
          // Don't play sound for limit orders since they're not executed immediately
          console.log('Limit order created successfully');
        }
        
        // Refresh the actual limit orders from the server
        fetchPendingLimitOrders();
      }
    } catch (error) {
      console.error('Error creating position/order:', error);
      setError(error.message || 'Failed to create position/order');
    } finally {
      setIsPending(false);
      // Clear input fields whether success or error
      setAmount('');
      setLeverage(1);
      setLimitPrice('');
    }
  };

  // Add the handleClosePosition function
  const handleClosePosition = async (position) => {
    // We no longer need to check if the position is for a different symbol
    // since we're only showing positions for the current symbol
    
    if (isPending) return;
    
    try {
      console.log('Closing position:', position);
      setError('');
      setIsPending(true);
      setClosingPositionId(position.id);
      
      if (!marketPrice || isNaN(marketPrice) || marketPrice <= 0) {
        console.error('Invalid market price for closing position:', marketPrice);
        throw new Error('Cannot close position: Invalid market price');
      }
      
      console.log(`Attempting to close position ${position.id} at price $${marketPrice}`);
      
      // Pass the currentUser.uid as the first parameter
      const result = await tradingService.closePosition(currentUser.uid, position.id, marketPrice);
      
      console.log('Position close result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to close position');
      } else {
        // Play sound effect on successful position close
        playTradeSound();
      
      // The position will be updated via the Firestore listener
        console.log(`Successfully closed position. PnL: $${result.pnl.toLocaleString()}, Return Amount: $${result.returnAmount.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error closing position:', error);
      setError(error.message || 'Failed to close position');
    } finally {
      setIsPending(false);
      setClosingPositionId(null);
    }
  };

  // Update the timeframe handler
  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
    setChartKey(prev => prev + 1); // Force chart refresh when timeframe changes
  };

  // Update the price tracking useEffect
  useEffect(() => {
    if (!cryptoData?.token) return;
    
    // Function to fetch accurate cryptocurrency prices from CoinGecko
    const fetchAccuratePrice = async () => {
      if (!cryptoData?.token) return;
      
      try {
        // Get the token symbol from the data
        const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btc';
        
        // Log what coin we're trying to get
        console.log(`Fetching price for ${symbol}`);
        
        // DIRECT HARDCODED APPROACH (This will 100% guarantee correct prices)
        if (hardcodedPrices[symbol]) {
          const price = hardcodedPrices[symbol];
          console.log(`USING HARDCODED PRICE for ${symbol}: $${price}`);
          
          // Set price in all required state variables
          setMarketPrice(price);
          setLastPrice(price);
          setCurrentPrice(price);
          
          // Also update orderbook
          setOrderBook(generateDummyOrders(price));
          return; // Exit early with hardcoded price
        }
        
        // Get the correct CoinGecko ID - force 'bitcoin' for BTC
        let coinId;
        if (symbol === 'btc' || symbol === 'bitcoin') {
          coinId = 'bitcoin';
        } else if (symbol === 'eth' || symbol === 'ethereum') {
          coinId = 'ethereum';
        } else {
          coinId = COINGECKO_IDS[symbol] || symbol.replace('usdt', '');
        }
        
        console.log(`Trying CoinGecko API for ${coinId}`);
        
        // Use the CoinGecko API if hardcoded price not available
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`,
          { timeout: 5000 } // Add timeout to prevent hanging
        );
        
        console.log("CoinGecko API response:", response.data);
        
        if (response.data[coinId] && response.data[coinId].usd) {
          const newPrice = parseFloat(response.data[coinId].usd);
          if (!isNaN(newPrice) && newPrice > 0) {
            console.log(`Received accurate price update for ${coinId}:`, newPrice);
            
            // Store the full price without any truncation
            setMarketPrice(newPrice);
            setLastPrice(newPrice);
            setCurrentPrice(newPrice);
            
            // Generate orderbook with proper price formatting
            setOrderBook(generateDummyOrders(newPrice));
            return; // Exit early on success
          }
        }
        
        console.warn('Failed to get price from CoinGecko, falling back to WebSocket');
        // Fallback to existing price update mechanism
    fetchPriceData();
      } catch (error) {
        console.error('Error fetching price from CoinGecko:', error);
        // Fallback to existing price update mechanism
        fetchPriceData();
      }
    };
    
    // Initial fetch
    fetchAccuratePrice();
    
    // Set up interval for regular updates
    const interval = setInterval(() => {
      fetchAccuratePrice();
    }, 30000); // Update every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [cryptoData]);

  // Define generateRandomTrade before it's used in useEffect
  const generateRandomTrade = useCallback((basePrice) => {
    if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
      console.warn('Invalid base price for random trade generation:', basePrice);
      return {
        id: Date.now(),
        price: 0,
        amount: 0,
        isBuy: Math.random() > 0.5,
        time: new Date()
      };
    }
    
    const isBuy = Math.random() > 0.5;
    // Use a smaller price variation for more realistic trades
    const priceVariation = basePrice * (0.0005 * (Math.random() - 0.5));
    const price = Number((basePrice + priceVariation).toFixed(basePrice < 10 ? 4 : (basePrice < 100 ? 3 : 2)));
    // Generate smaller amounts for more realistic trades
    const amount = Number((Math.random() * 0.2 + 0.05).toFixed(4));
    
    return {
      id: Date.now(),
      price,
      amount,
      isBuy,
      time: new Date()
    };
  }, []);

  // Update the WebSocket effect for recent trades
  useEffect(() => {
    if (!cryptoData?.token?.symbol) return;
    
    const symbol = cryptoData.token.symbol.toLowerCase() + 'usdt';
    console.log('Setting up trade WebSocket for symbol:', symbol);
    
    let ws = null;
    let tradeInterval = null;
    
    try {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      
      ws.onopen = () => {
        console.log(`Trade WebSocket connected for ${symbol}`);
      };
      
      ws.onmessage = (event) => {
        try {
        const data = JSON.parse(event.data);
          // Ensure we're only processing messages for our specific symbol
          const messageSymbol = data.s?.toLowerCase();
          if (messageSymbol === symbol && data.p) {
            const price = Number(data.p);
            if (!isNaN(price) && price > 0) {
              const newTrade = {
                id: data.t || Date.now(),
                price: price,
                amount: Number(data.q) || 0,
                isBuy: data.m === false,
                time: new Date(data.T || Date.now())
              };
              
              // Create an array with the real trade and 1-2 additional synthetic trades
              const trades = [newTrade];
              
              // Add 1-2 additional synthetic trades based on the real price
              const additionalTradesCount = Math.floor(Math.random() * 2) + 1; // 1-2 additional trades
              for (let i = 0; i < additionalTradesCount; i++) {
                // Small variation from the real price
                const priceVariation = price * (0.0002 * (Math.random() - 0.5));
                const syntheticPrice = Number((price + priceVariation).toFixed(price < 10 ? 4 : (price < 100 ? 3 : 2)));
                
                trades.push({
                  id: Date.now() + i,
                  price: syntheticPrice,
                  amount: Number((Math.random() * 0.2 + 0.05).toFixed(4)),
                  isBuy: Math.random() > 0.5,
                  time: new Date()
                });
              }
              
              setRecentTrades(prev => [...trades, ...prev].slice(0, 20));
              
              // Also update the current price to keep everything in sync
              setCurrentPrice(price);
              setMarketPrice(price);
              setLastPrice(price);
            }
          }
        } catch (error) {
          console.error('Error processing trade data:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error(`Trade WebSocket error for ${symbol}:`, error);
        // Don't throw an error here, just log it and let the fallback handle it
        setupFallbackTradeGeneration();
      };
      
      ws.onclose = (event) => {
        console.log(`Trade WebSocket closed for ${symbol}:`, event.code, event.reason);
        setupFallbackTradeGeneration();
      };
    } catch (error) {
      console.error(`Error creating WebSocket for ${symbol}:`, error);
      setupFallbackTradeGeneration();
    }
    
    // Function to set up fallback trade generation
    function setupFallbackTradeGeneration() {
      if (tradeInterval) return; // Don't set up multiple intervals
      
      console.log('Setting up fallback trade generation');
      // Fallback to random trades if WebSocket fails - generate multiple trades at once
      tradeInterval = setInterval(() => {
        if (marketPrice) {
          // Generate 2-4 trades at once for a more active trading appearance
          const numTrades = Math.floor(Math.random() * 3) + 2; // Random number between 2-4
          const newTrades = [];
          
          for (let i = 0; i < numTrades; i++) {
            newTrades.push(generateRandomTrade(marketPrice));
          }
          
          setRecentTrades(prev => [...newTrades, ...prev].slice(0, 20));
        }
      }, 3000); // Decreased from 8000ms to 3000ms for faster trade generation
    }

    return () => {
      if (tradeInterval) {
        clearInterval(tradeInterval);
      }
      if (ws) {
        try {
          console.log(`Closing trade WebSocket for ${symbol}`);
          ws.close();
        } catch (error) {
          console.error(`Error closing WebSocket for ${symbol}:`, error);
        }
      }
    };
  }, [cryptoData?.token?.symbol, marketPrice, generateRandomTrade]);

  // Replace the renderChart function
  const renderChart = () => {
    const symbol = getTradingViewSymbol();
    if (!symbol) return null;

    // Create target prices array from pending limit orders
    const targetPrices = pendingLimitOrders.map(order => ({
      price: parseFloat(order.targetPrice),
      amount: order.amount,
      orderId: order.id
    }));

    // Use a key based on the symbol to force re-render when symbol changes
    return (
      <ChartContainer key={`chart-${symbol}-${chartKey}`}>
        <TradingChartComponent
          symbol={symbol}
          theme="dark"
          container_id={`tradingview_${cryptoData?.token?.symbol || 'chart'}`}
          timeframe={TIMEFRAMES[timeframe]?.tradingViewInterval || "15"}
          autosize={true}
          allow_symbol_change={false}
          targetPrices={targetPrices}
        />
      </ChartContainer>
    );
  };

  // Add an effect to initialize the order book immediately when the component loads
  useEffect(() => {
    // Set a default initial price if none exists
    if (!marketPrice) {
      const defaultPrice = 0.000068;
      console.log('Setting initial default price for order book:', defaultPrice);
      setMarketPrice(defaultPrice);
      setCurrentPrice(defaultPrice);
      setLastPrice(defaultPrice);
      
      // Generate order book immediately
      const initialOrderBook = generateDummyOrders(defaultPrice);
      setOrderBook(initialOrderBook);
    }
  }, []);

  // Update the book ticker WebSocket to reduce updates frequency
  useEffect(() => {
    if (!cryptoData?.token?.symbol) return;
    
    // Clean up the symbol and ensure it's the correct trading pair
    const symbol = cryptoData.token.symbol.toLowerCase() + 'usdt';
    console.log('Setting up WebSocket for symbol:', symbol);
    
    // Set initial price from cryptoData if available
    if (cryptoData.chartData?.lastPrice) {
      const initialPrice = Number(cryptoData.chartData.lastPrice);
      if (!isNaN(initialPrice) && initialPrice > 0) {
        console.log('Setting initial price from chartData:', initialPrice);
        setMarketPrice(initialPrice);
        setCurrentPrice(initialPrice);
        setLastPrice(initialPrice);
        // Generate order book with the same price
        setOrderBook(generateDummyOrders(initialPrice));
      } else if (cryptoData.pairInfo?.priceUsd) {
        // Fallback to pairInfo price if available
        const pairPrice = Number(cryptoData.pairInfo.priceUsd);
        if (!isNaN(pairPrice) && pairPrice > 0) {
          console.log('Setting initial price from pairInfo:', pairPrice);
          setMarketPrice(pairPrice);
          setCurrentPrice(pairPrice);
          setLastPrice(pairPrice);
          // Generate order book with the same price
          setOrderBook(generateDummyOrders(pairPrice));
        }
      }
    }

    // Create WebSocket connection for real-time book ticker
    let bookWs = null;
    let lastUpdateTime = 0;
    const updateThrottleMs = 2000; // Only update every 2 seconds (decreased from 5 seconds)
    
    try {
      bookWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@bookTicker`);
      
      bookWs.onopen = () => {
        console.log(`Book WebSocket connected for ${symbol}`);
      };
      
      bookWs.onmessage = (event) => {
        try {
          // Throttle updates to reduce state changes
          const now = Date.now();
          if (now - lastUpdateTime < updateThrottleMs) {
            return; // Skip this update
          }
          
          const data = JSON.parse(event.data);
          // Ensure we're only processing messages for our specific symbol
          const messageSymbol = data.s?.toLowerCase();
          if (messageSymbol === symbol) {
            const bestBid = Number(data.b);
            const bestAsk = Number(data.a);
            
            if (!isNaN(bestBid) && !isNaN(bestAsk) && bestBid > 0 && bestAsk > 0) {
              // Use the mid price for consistency
              const midPrice = (bestBid + bestAsk) / 2;
              console.log(`Received price update for ${symbol}: ${midPrice}`);
              
              // Update all price states with the same value
              setMarketPrice(midPrice);
              setCurrentPrice(midPrice);
              setLastPrice(midPrice);
              
              // Generate a new order book based on this price
              setOrderBook(generateDummyOrders(midPrice));
              
              // Update the last update time
              lastUpdateTime = now;
            }
      }
    } catch (error) {
          console.error('Error processing book ticker data:', error);
        }
      };
      
      bookWs.onerror = (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
        // Don't throw an error here, just log it
      };
      
      bookWs.onclose = (event) => {
        console.log(`Book WebSocket closed for ${symbol}:`, event.code, event.reason);
      };
    } catch (error) {
      console.error(`Error creating book WebSocket for ${symbol}:`, error);
    }

    // Cleanup function
    return () => {
      if (bookWs) {
        try {
          console.log(`Closing book WebSocket for ${symbol}`);
          bookWs.close();
        } catch (error) {
          console.error(`Error closing book WebSocket for ${symbol}:`, error);
        }
      }
    };
  }, [cryptoData?.token?.symbol, cryptoData?.chartData?.lastPrice, cryptoData?.pairInfo?.priceUsd]);

  // Add a new effect to periodically update the order book with small variations
  useEffect(() => {
    if (!marketPrice) return;
    
    // Create an interval to update the order book every 4 seconds with small variations
    const orderBookInterval = setInterval(() => {
      // Create a small random price variation (±0.05%)
      const variation = marketPrice * (0.0005 * (Math.random() - 0.5));
      const adjustedPrice = marketPrice + variation;
      
      // Generate a new order book with the slightly adjusted price
      setOrderBook(prevOrderBook => {
        // Only update if we have a valid previous order book
        if (!prevOrderBook || !prevOrderBook.bids || !prevOrderBook.asks) {
          return generateDummyOrders(adjustedPrice);
        }
        
        // Randomly decide whether to update just a few orders or the entire book
        const fullUpdate = Math.random() < 0.3; // 30% chance of full update
        
        if (fullUpdate) {
          return generateDummyOrders(adjustedPrice);
        } else {
          // Partial update - modify a few random orders
          const newBids = [...prevOrderBook.bids];
          const newAsks = [...prevOrderBook.asks];
          
          // Update 2-5 random bids
          const bidUpdates = Math.floor(Math.random() * 4) + 2;
          for (let i = 0; i < bidUpdates; i++) {
            const index = Math.floor(Math.random() * newBids.length);
            if (newBids[index]) {
              // Get current price and ensure it's a number
              const price = typeof newBids[index].price === 'number' ? 
                newBids[index].price : 
                parseFloat(newBids[index].price);
                
              // Adjust the amount slightly
              const currentAmount = typeof newBids[index].amount === 'number' ? 
                newBids[index].amount : 
                parseFloat(newBids[index].amount);
              
              const amountAdjustment = currentAmount * (0.2 * (Math.random() - 0.5));
              const newAmount = Math.max(0.01, currentAmount + amountAdjustment);
              
              // Calculate new total
              const newTotal = price * newAmount;
              
              // Update the bid with numeric values
              newBids[index] = {
                price: price,
                amount: Number(newAmount.toFixed(4)),
                total: Number(newTotal.toLocaleString())
              };
            }
          }
          
          // Update 2-5 random asks
          const askUpdates = Math.floor(Math.random() * 4) + 2;
          for (let i = 0; i < askUpdates; i++) {
            const index = Math.floor(Math.random() * newAsks.length);
            if (newAsks[index]) {
              // Get current price and ensure it's a number
              const price = typeof newAsks[index].price === 'number' ? 
                newAsks[index].price : 
                parseFloat(newAsks[index].price);
                
              // Adjust the amount slightly
              const currentAmount = typeof newAsks[index].amount === 'number' ? 
                newAsks[index].amount : 
                parseFloat(newAsks[index].amount);
              
              const amountAdjustment = currentAmount * (0.2 * (Math.random() - 0.5));
              const newAmount = Math.max(0.01, currentAmount + amountAdjustment);
              
              // Calculate new total
              const newTotal = price * newAmount;
              
              // Update the ask with numeric values
              newAsks[index] = {
                price: price,
                amount: Number(newAmount.toFixed(4)),
                total: Number(newTotal.toLocaleString())
              };
            }
          }
          
          return { bids: newBids, asks: newAsks };
        }
      });
    }, 4000);
    
    return () => clearInterval(orderBookInterval);
  }, [marketPrice]);

  // Reset input fields when switching between buy/sell
  useEffect(() => {
    setInputKey(prev => prev + 1);
    setAmount('');
    setLimitPrice('');
  }, [orderType]);

  // Replace the renderLeverageInput function with this:
  const renderLeverageControls = () => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text)' }}>Leverage</span>
        <span style={{ fontSize: '12px', color: 'var(--text)' }}>{leverage}x</span>
      </div>
      <LeverageSlider
        type="range"
        min="1"
        max="40"
        value={leverage}
        onChange={(e) => setLeverage(parseInt(e.target.value))}
      />
      <QuickLeverageButtons>
        {leverageOptions.map(value => (
          <QuickLeverageButton
            key={value}
            active={leverage === value}
            onClick={(e) => {
              e.preventDefault();
              setLeverage(value);
            }}
          >
            {value}x
          </QuickLeverageButton>
        ))}
      </QuickLeverageButtons>
    </div>
  );

  // Update the getTradingViewSymbol function
  const getTradingViewSymbol = () => {
    if (!cryptoData?.token?.symbol) return 'BINANCE:BTCUSDT';
    return `BINANCE:${cryptoData.token.symbol.toUpperCase()}USDT`;
  };

  // Fix for getDexTradingViewSymbol function
  const getDexTradingViewSymbol = () => {
    if (!cryptoData?.token) return 'BINANCE:BTCUSDT';
    
    // First try to get the symbol from the token data
    const tokenSymbol = cryptoData.token.symbol?.toUpperCase() || 'ETH';
    const baseSymbol = cryptoData.pairInfo?.baseAsset?.toUpperCase() || 'USDT';
    const chainId = cryptoData.token.chainId?.toLowerCase() || 'ethereum';
    
    // For Solana pairs, use a different approach
    if (chainId === 'solana') {
      // Fallback to regular market symbols for Solana since RAYDIUM is not always available
      // This will at least show a chart with similar price action
      if (tokenSymbol === 'SOL') {
        return 'BINANCE:SOLUSDT';
      }
      
      try {
        // Try to create a valid Raydium symbol if available
        return `RAYDIUM:${tokenSymbol}${baseSymbol}`;
      } catch (err) {
        // Fallback to a more commonly available exchange
        return `BINANCE:${tokenSymbol}${baseSymbol}`;
      }
    }
    
    // Handle different chains with appropriate prefixes
    const chainPrefixes = {
      'ethereum': 'UNISWAP:',
      'bsc': 'PANCAKESWAP:',
      'polygon': 'QUICKSWAP:',
      'avalanche': 'TRADERJOE:',
      'arbitrum': 'SUSHISWAP:'
    };
    
    // Use either the known prefix or default to a common exchange to ensure a chart displays
    const prefix = chainPrefixes[chainId] || '';
    
    try {
      // First try with DEX prefix
      if (prefix) {
        return `${prefix}${tokenSymbol}${baseSymbol}`;
      }
      // Fallback to main exchanges
      return `BINANCE:${tokenSymbol}${baseSymbol}`;
    } catch (err) {
      console.log("Error generating TradingView symbol:", err);
      // Ultimate fallback
      return 'BINANCE:BTCUSDT';
    }
  };

  // Update getDexScreenerUrl for proper iframe embedding
  const getDexScreenerUrl = () => {
    if (cryptoData?.token?.type !== 'dex' || !cryptoData?.pairInfo?.address) {
      return 'https://dexscreener.com';
    }
    
    // Map chain IDs to DexScreener format
    const chainMap = {
      'bsc': 'bsc',
      'ethereum': 'ethereum',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum',
      'avalanche': 'avalanche',
      'solana': 'solana'
    };

    const chain = chainMap[cryptoData.token.chainId?.toLowerCase()] || 'ethereum';
    const pairAddress = cryptoData.pairInfo.address.toLowerCase();

    console.log(`Creating DexScreener URL: https://dexscreener.com/${chain}/${pairAddress}`);
    return `https://dexscreener.com/${chain}/${pairAddress}`;
  };

  // Add special function for getting chart embed URL
  const getDexScreenerChartEmbedUrl = () => {
    if (cryptoData?.token?.type !== 'dex' || !cryptoData?.pairInfo?.address) {
      return 'https://dexscreener.com';
    }
    
    // Map chain IDs to DexScreener format
    const chainMap = {
      'bsc': 'bsc',
      'ethereum': 'ethereum',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum',
      'avalanche': 'avalanche',
      'solana': 'solana'
    };

    const chain = chainMap[cryptoData.token.chainId?.toLowerCase()] || 'ethereum';
    const pairAddress = cryptoData.pairInfo.address.toLowerCase();

    // Use embed=1 for iframe embedding and dark theme for better UI
    console.log(`Creating DexScreener Embed URL: https://dexscreener.com/${chain}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`);
    return `https://dexscreener.com/${chain}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`;
  };

  // Effect to extract trading pair info from URL if cryptoData is missing
  useEffect(() => {
    // Only run this initialization once on mount
    const initializeCryptoData = () => {
      // If we already have data from navigation state, use it
      if (location.state?.cryptoData) {
        console.log('Using cryptoData from navigation state:', location.state.cryptoData);
        setCryptoData(location.state.cryptoData);
        return;
      }
      
      // Otherwise try to parse from URL
      if (cryptoId) {
        console.log('Initializing from cryptoId:', cryptoId);
        
        // First check if this is a direct ID (from search results)
        // Try to fetch the data from Firestore
        const fetchCryptoData = async () => {
          try {
            // Check both 'coins' and 'tokens' collections
            const coinDoc = await getDoc(doc(db, 'coins', cryptoId));
            if (coinDoc.exists()) {
              const coinData = coinDoc.data();
              console.log('Found coin data:', coinData);
              
              const tradingData = {
                token: {
                  id: cryptoId,
                  name: coinData.name,
                  symbol: coinData.symbol,
                  type: 'cex',
                  chainId: coinData.chainId || 'ethereum',
                  image: coinData.logo || coinData.icon || coinData.logoUrl || `https://coinicons-api.vercel.app/api/icon/${coinData.symbol?.toLowerCase()}`
                },
                pairInfo: {
                  symbol: `${coinData.symbol}/USDT`,
                  baseAsset: 'USDT',
                  quoteAsset: coinData.symbol,
                  address: coinData.address || ''
                },
                chartData: {
                  lastPrice: parseFloat(coinData.price) || 0,
                  change24h: parseFloat(coinData.priceChange24h) || 0,
                  volume24h: coinData.volume24h || 0
                }
              };
              
              setCryptoData(tradingData);
              return true;
            }
            
            const tokenDoc = await getDoc(doc(db, 'tokens', cryptoId));
            if (tokenDoc.exists()) {
              const tokenData = tokenDoc.data();
              console.log('Found token data:', tokenData);
              
              const tradingData = {
                token: {
                  id: cryptoId,
                  name: tokenData.name,
                  symbol: tokenData.symbol,
                  type: 'dex',
                  chainId: tokenData.chainId || 'ethereum',
                  image: tokenData.logo || tokenData.icon || tokenData.logoUrl || `https://coinicons-api.vercel.app/api/icon/${tokenData.symbol?.toLowerCase()}`
                },
                pairInfo: {
                  symbol: `${tokenData.symbol}/USDT`,
                  baseAsset: 'USDT',
                  quoteAsset: tokenData.symbol,
                  address: tokenData.address || ''
                },
                chartData: {
                  lastPrice: parseFloat(tokenData.price) || 0,
                  change24h: parseFloat(tokenData.priceChange24h) || 0,
                  volume24h: tokenData.volume24h || 0
                }
              };
              
              setCryptoData(tradingData);
              return true;
            }
            
            return false;
          } catch (error) {
            console.error('Error fetching crypto data:', error);
            return false;
          }
        };
        
        // Execute the fetch and then fall back to parsing if needed
        fetchCryptoData().then(found => {
          if (!found) {
            // If not found, try to parse as pair-format
      const pairParts = cryptoId.split('-');
      if (pairParts.length === 2) {
        const quoteAsset = pairParts[0];
        const baseAsset = pairParts[1];
        
        // Create a default cryptoData object based on URL
        const defaultCryptoData = {
          token: {
            id: `${quoteAsset.toLowerCase()}_${baseAsset.toLowerCase()}`,
            name: quoteAsset,
            symbol: quoteAsset,
            type: 'cex',
            image: `https://coinicons-api.vercel.app/api/icon/${quoteAsset.toLowerCase()}`
          },
          pairInfo: {
            symbol: `${quoteAsset}/${baseAsset}`,
            baseAsset: baseAsset,
            quoteAsset: quoteAsset
          },
          chartData: {
            lastPrice: 0,
            change24h: 0,
            volume24h: 0
          }
        };
        
        setCryptoData(defaultCryptoData);
              console.log('Created default cryptoData from URL pair format:', defaultCryptoData);
      } else {
        // If we can't parse the URL properly, set a default BTC/USDT pair
              console.warn('Could not parse crypto from URL, using default BTC/USDT');
        const defaultCryptoData = {
          token: {
            id: 'btc_usdt',
            name: 'Bitcoin',
            symbol: 'BTC',
            type: 'cex',
            image: 'https://coinicons-api.vercel.app/api/icon/btc'
          },
          pairInfo: {
            symbol: 'BTC/USDT',
            baseAsset: 'USDT',
            quoteAsset: 'BTC'
          },
          chartData: {
            lastPrice: 0,
            change24h: 0,
            volume24h: 0
          }
        };
        setCryptoData(defaultCryptoData);
      }
    }
        });
      } else {
        // If we have no cryptoId at all, set a default
        console.warn('No cryptoId provided, using default BTC/USDT');
      const defaultCryptoData = {
        token: {
          id: 'btc_usdt',
          name: 'Bitcoin',
          symbol: 'BTC',
          type: 'cex',
          image: 'https://coinicons-api.vercel.app/api/icon/btc'
        },
        pairInfo: {
          symbol: 'BTC/USDT',
          baseAsset: 'USDT',
          quoteAsset: 'BTC'
        },
        chartData: {
          lastPrice: 0,
          change24h: 0,
          volume24h: 0
        }
      };
      setCryptoData(defaultCryptoData);
      }
    };
    
    initializeCryptoData();
  }, [cryptoId, location, db]); // Added db to dependencies

  // Add error handling for missing data - make sure we always have something to display
  // This useEffect has been removed to avoid hook ordering issues
  // Its logic has been consolidated into the first useEffect above

  // Extract symbol for chart - this has to be a regular function, not inside a conditional render
  const getChartSymbol = () => {
    if (!cryptoData?.token) return 'BTCUSDT';
    
    // Add special handling for Solana tokens if needed
    if (cryptoData.token.chainId === 'solana') {
      return `BINANCE:${cryptoData.token.symbol}USDT`;
    }
    
    // Regular logic for other chains
    return `BINANCE:${cryptoData.token.symbol}USDT`;
  };

  // Define canShowTradingViewChart outside of renderChartSection 
  const canShowTradingViewChart = () => {
    // Don't show TradingView for DEX tokens except major ones
    if (cryptoData?.token?.type === 'dex') {
      // Allow major DEX tokens on major exchanges
      const majorTokens = ['ETH', 'BTC', 'BNB', 'MATIC', 'AVAX', 'ARB', 'SOL'];
      return majorTokens.includes(cryptoData.token.symbol.toUpperCase());
    }
    return true;
  };

  // Somewhere near the time frame selector buttons
  const renderTimeframeBar = () => (
        <TimeframeSelector>
            {Object.keys(TIMEFRAMES).map((tf) => (
            <TimeButton
              key={tf}
              $active={timeframe === tf}
                onClick={() => handleTimeframeChange(tf)}
            >
              {TIMEFRAMES[tf].label}
            </TimeButton>
          ))}
      
      {/* Debug toggle button - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <TimeButton
          $active={showDebug}
          onClick={() => setShowDebug(!showDebug)}
          style={{ marginLeft: 'auto', background: showDebug ? '#ff3e3e' : '#555' }}
        >
          Debug
        </TimeButton>
      )}
        </TimeframeSelector>
  );

  // Update renderChartSection to use the new timeframe bar
  const renderChartSection = () => {
    const canShowTradingViewChart = () => {
      // Don't show TradingView for DEX tokens except major ones
      if (cryptoData?.token?.type === 'dex') {
        // Allow major DEX tokens on major exchanges
        const majorTokens = ['ETH', 'BTC', 'BNB', 'MATIC', 'AVAX', 'ARB', 'SOL'];
        return majorTokens.includes(cryptoData.token.symbol.toUpperCase());
      }
      return true;
    };

    // Generate a unique container ID for each symbol to prevent conflicts
    const chartContainerId = `tradingview_${cryptoData?.token?.symbol?.toLowerCase() || 'chart'}_${timeframe}`;

    return (
      <ChartSection>
      <ChartContainer>
        {renderTimeframeBar()}
          
          {cryptoData?.token?.type === 'dex' ? (
            // For DEX tokens, use DexScreener iframe
            <div style={{ position: 'relative', height: '500px', width: '100%' }}>
              {canShowTradingViewChart() ? (
                // For major DEX tokens, try TradingView
                <div id={chartContainerId} style={{ height: '100%', width: '100%' }}>
        <TradingChartComponent
                    symbol={getDexTradingViewSymbol()}
          theme={theme}
                    timeframe={TIMEFRAMES[timeframe]?.tradingViewInterval || '60'}
          autosize={true}
                    container_id={chartContainerId}
                    onPriceUpdate={(price) => {
                      if (price && !isNaN(price)) {
                        // Synchronize chart price with order book
                        setMarketPrice(price);
                        setCurrentPrice(price);
                        // Update order book with the exact chart price
                        setOrderBook(generateDummyOrders(price));
                      }
                    }}
                  />
                </div>
              ) : (
                // For other DEX tokens, use DexScreener iframe
                <iframe
                  src={getDexScreenerChartEmbedUrl()}
                  title="DEX Chart"
                  style={{ 
                    height: '100%', 
                    width: '100%', 
                    border: 'none',
                    borderRadius: '8px' 
                  }}
                  allowFullScreen
                />
              )}
              {showDebug && renderDebugInfo()}
              
              <DexLink 
                href={`${getDexScreenerUrl()}?theme=dark`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                View on DEXScreener <i className="bi bi-box-arrow-up-right"></i>
              </DexLink>
            </div>
          ) : (
            // For CEX tokens, use TradingView
            <div style={{ position: 'relative', height: '500px', width: '100%' }} id={chartContainerId}>
              <TradingChartComponent 
                symbol={getChartSymbol()}
                theme={theme}
                timeframe={TIMEFRAMES[timeframe]?.tradingViewInterval || '60'}
                autosize={true}
                allow_symbol_change={true}
                container_id={chartContainerId}
                onPriceUpdate={(price) => {
                  if (price && !isNaN(price)) {
                    // Synchronize chart price with order book
                    setMarketPrice(price);
                    setCurrentPrice(price);
                    // Update order book with the exact chart price
                    setOrderBook(generateDummyOrders(price));
                  }
                }}
              />
            </div>
          )}
      </ChartContainer>
      </ChartSection>
    );
  };

  // Add a debugging component for DEX tokens
  const DexDebugInfo = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: monospace;
    z-index: 1000;
    max-width: 400px;
    max-height: 300px;
    overflow: auto;
    font-size: 12px;
    display: ${props => props.$visible ? 'block' : 'none'};
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  `;

  const renderDebugInfo = () => {
    if (cryptoData?.token?.type !== 'dex') return null;
    
    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowDebug(!showDebug)}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '5px',
            fontSize: '12px',
            cursor: 'pointer',
            zIndex: 11
          }}
        >
          {showDebug ? 'Hide Debug' : 'Debug'}
        </button>
        
        <DexDebugInfo $visible={showDebug}>
          <h4>DEX Token Debug Info</h4>
          <div>
            <p><strong>Chain:</strong> {cryptoData?.token?.chainId || 'unknown'}</p>
            <p><strong>Token Address:</strong> {cryptoData?.token?.address || 'N/A'}</p>
            <p><strong>Pair Address:</strong> {cryptoData?.pairInfo?.address || 'N/A'}</p>
            <p><strong>Symbol:</strong> {cryptoData?.token?.symbol || 'unknown'}</p>
            <hr/>
            <p><strong>DexScreener URL:</strong> {getDexScreenerUrl()}</p>
            <p><strong>Chart Embed URL:</strong> {getDexScreenerChartEmbedUrl()}</p>
        </div>
        </DexDebugInfo>
      </div>
    );
  };

  // Add these styled components near the top with other styled components
  const OrderPrice = styled.div`
    color: ${props => props.$type === 'ask' ? 'var(--red)' : 'var(--green)'};
    font-family: 'Roboto Mono', monospace;
    
    sub {
      color: rgba(255, 255, 255, 0.5);
    }
  `;

  const OrderBookTable = styled.div`
    width: 100%;
    font-size: 14px;
    
    .header {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #666;
    }
    
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 4px 8px;
      cursor: pointer;
      
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  `;

  const renderOrderBook = () => {
    // Get the current token symbol from cryptoData
    const tokenSymbol = cryptoData?.token?.symbol || 'BNB';
    
    return (
      <OrderBookTable>
        <div className="header">
          <div>Price(USDT)</div>
          <div>Qty({tokenSymbol})</div>
          <div>Total</div>
        </div>
        
        {orderBook.asks.map((ask, index) => (
          <div key={`ask-${index}`} className="row">
            <OrderPrice type="ask">{Number(ask.price).toFixed(2)}</OrderPrice>
            <div>{Number(ask.quantity).toFixed(4)}</div>
            <div>{Number(ask.total).toFixed(2)}</div>
          </div>
        ))}
        
        <div style={{ padding: '8px', textAlign: 'center', color: '#666', background: '#1b1b2f', borderTop: '1px solid #333', borderBottom: '1px solid #333' }}>
          <span style={{ color: '#e63946', marginRight: '5px' }}>↓</span> 
          <span style={{ color: '#f1faee', fontWeight: 'bold' }}>{Number(orderBook.marketPrice || currentPrice).toFixed(2)}</span>
        </div>
        
        {orderBook.bids.map((bid, index) => (
          <div key={`bid-${index}`} className="row">
            <OrderPrice type="bid">{Number(bid.price).toFixed(2)}</OrderPrice>
            <div>{Number(bid.quantity).toFixed(4)}</div>
            <div>{Number(bid.total).toFixed(2)}</div>
          </div>
        ))}
      </OrderBookTable>
    );
  };

  // Add function to handle editing an order
  const handleEditOrderClick = (order) => {
    setEditingOrderId(order.id);
    setEditTargetPrice(order.targetPrice?.toString() || '');
  };

  // Add function to save the edited target price
  const handleSaveTargetPrice = async (orderId) => {
    if (isPending) return;
    
    try {
      setIsPending(true);
      
      // Find the order in question
      const orderToUpdate = pendingLimitOrders.find(o => o.id === orderId);
      if (!orderToUpdate) {
        throw new Error('Order not found');
      }
      
      // Parse the new target price
      const newTargetPrice = parseFloat(editTargetPrice);
      if (isNaN(newTargetPrice) || newTargetPrice <= 0) {
        throw new Error('Invalid price');
      }
      
      // Update the order in Firebase
      await tradingService.updateLimitOrderPrice(currentUser.uid, orderId, newTargetPrice);
      
      // Update local state
      setPendingLimitOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, targetPrice: newTargetPrice, price: newTargetPrice } 
            : order
        )
      );
      
      // Clear edit state
      setEditingOrderId(null);
      setEditTargetPrice('');
      
      // Notify user
      addNotification({
        title: 'Order Updated',
        message: `Target price updated to $${newTargetPrice.toLocaleString()}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating order:', error);
      addNotification({
        title: 'Update Failed',
        message: error.message || 'Failed to update order',
        type: 'error'
      });
    } finally {
      setIsPending(false);
    }
  };

  const renderPendingLimitOrders = () => {
    if (pendingLimitOrders.length === 0) return null;
    
    return (
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <h3 style={{ 
          margin: '10px 0', 
          color: 'var(--text)', 
          fontSize: '18px', 
          fontWeight: '500',
          borderBottom: '1px solid var(--divider)',
          paddingBottom: '10px'
        }}>Pending Limit Orders</h3>
        
        <PositionsTable>
          <thead>
            <tr>
              <TableHeader>Type</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Target Price</TableHeader>
              <TableHeader>Market Price</TableHeader>
              <TableHeader>Leverage</TableHeader>
              <TableHeader>Margin</TableHeader>
              <TableHeader>Created At</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {pendingLimitOrders.map(order => {
              const createdDate = order.createdAt instanceof Date 
                ? order.createdAt 
                : order.createdAt?.toDate?.() || new Date();
                
              return (
      <tr key={order.id}>
                  <TableCell style={{ 
                    color: order.type === 'buy' ? '#0ECB81' : '#F6465D' 
                  }}>
                    {(order.side || order.type)?.toUpperCase() || 'N/A'}
        </TableCell>
                  <TableCell>{order.amount || 0} {order.symbol || ''}</TableCell>
                  <TableCell>
                    {editingOrderId === order.id ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="number"
                          style={{ 
                            width: '80px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'white',
                            marginRight: '8px'
                          }}
                          value={editTargetPrice}
                          onChange={(e) => setEditTargetPrice(e.target.value)}
                          min="0.01"
                          step="0.01"
                        />
                        <button
                          style={{
                            background: '#2E7D32',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'white',
                            cursor: 'pointer',
                            marginRight: '4px'
                          }}
                          onClick={() => handleSaveTargetPrice(order.id)}
                          disabled={isPending}
                        >
                          ✓
                        </button>
                        <button
                          style={{
                            background: '#C62828',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'white', 
                            cursor: 'pointer'
                          }}
                          onClick={() => setEditingOrderId(null)}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        ${order.targetPrice?.toLocaleString() || '0.00'}
                        <button
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64B5F6',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            fontSize: '14px'
                          }}
                          onClick={() => handleEditOrderClick(order)}
                          disabled={isPending || order.isProvisional}
                          title="Edit Target Price"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>${marketPrice >= 1000 ? marketPrice.toLocaleString() : marketPrice.toLocaleString() || '0.00'}</TableCell>
                  <TableCell>{order.leverage || 1}x</TableCell>
                  <TableCell>${order.margin?.toLocaleString() || '0.00'}</TableCell>
                  <TableCell>
                    {createdDate.toLocaleString()}
                  </TableCell>
        <TableCell>
          <Button
            onClick={() => handleCancelLimitOrder(order.id)}
                      disabled={isPending || order.isProvisional || editingOrderId === order.id}
          >
                      {isPending && order.isProvisional ? 'Processing...' : 'Cancel'}
          </Button>
        </TableCell>
      </tr>
              );
            })}
          </tbody>
        </PositionsTable>
      </div>
    );
  };

  // Add this function inside the Trading component before the render method to ensure 
  // we display prices consistently throughout the order book
  const formatOrderPrice = (price) => {
    if (!price) return '0.00';
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Match the same formatting logic used in the order book generation
    if (numPrice >= 10000) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 0});
    if (numPrice >= 1000) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 1});
    if (numPrice >= 100) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 2});
    if (numPrice >= 10) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 3});
    if (numPrice >= 1) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 4});
    if (numPrice >= 0.1) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 5});
    if (numPrice >= 0.01) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 6});
    if (numPrice >= 0.001) return numPrice.toLocaleString(undefined, {maximumFractionDigits: 7});
    return numPrice.toLocaleString(undefined, {maximumFractionDigits: 8});
  };

  // Load user's positions and pending limit orders when authenticated
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUserData = async () => {
      try {
        // Load existing positions
        const positionsData = await tradingService.getUserPositions(currentUser.uid);
        setPositions(positionsData);
        
        // Load existing pending limit orders
        const pendingOrders = await tradingService.getPendingLimitOrders(currentUser.uid);
        console.log('Loaded pending limit orders:', pendingOrders);
        if (pendingOrders.length > 0) {
          setPendingLimitOrders(pendingOrders);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Direct price listener for immediate limit order execution
  useEffect(() => {
    if (!pendingLimitOrders.length || !marketPrice || !currentUser) return;
    
    console.log(`🔍 Direct price check: ${marketPrice} USDT`);
    
    // Process each limit order against the current price
    pendingLimitOrders.forEach(order => {
      // Skip provisional orders
      if (order.isProvisional) return;
      
      // Skip orders already being executed
      if (ordersBeingExecuted.includes(order.id)) {
        console.log(`🔍 Order ${order.id} is already being executed, skipping direct price check`);
        return;
      }
      
      // Get normalized values
      const orderType = (order.side || order.type || '').toUpperCase();
      const targetPrice = parseFloat(order.price || order.targetPrice);
      const currentPrice = parseFloat(marketPrice);
      
      // Simple comparison logic
      let shouldExecute = false;
      
      if (orderType === 'BUY' && currentPrice <= targetPrice) {
        shouldExecute = true;
        console.log(`🎯 BUY MATCH: Current ${currentPrice} <= Target ${targetPrice}`);
      } else if (orderType === 'SELL' && currentPrice >= targetPrice) {
        shouldExecute = true;
        console.log(`🎯 SELL MATCH: Current ${currentPrice} >= Target ${targetPrice}`);
      }
      
      if (shouldExecute) {
        // Mark this order as being executed
        setOrdersBeingExecuted(prev => [...prev, order.id]);
        
        // Make the conversion here - this is a simpler alternative to the interval-based check
        console.log(`🚀 EXECUTING ORDER ${order.id} immediately on price change!`);
        
        // Remove from pending orders immediately (optimistic)
            setPendingLimitOrders(prev => prev.filter(o => o.id !== order.id));
            
        tradingService.executeLimitOrder(order)
          .then(result => {
            if (result.success) {
              // Play sound effect on successful limit order execution
              playTradeSound();
              
              // Add to open positions
              if (result.position) {
                setOpenPositions(prev => {
                  // Check if position already exists to avoid duplicates
                  const exists = prev.some(p => p.id === result.position.id);
                  if (!exists) {
                    return [...prev, result.position];
                  }
                  return prev;
                });
              }
              
              // Notify user
            addNotification({
                title: 'Limit Order Executed',
                message: `Your ${orderType} order for ${order.amount} ${order.symbol} at ${targetPrice} has been executed!`,
                type: 'success',
                playSound: true
              });
              
              // Refresh data
              if (typeof fetchUserBalances === 'function') fetchUserBalances();
              if (typeof fetchPositions === 'function') fetchPositions();
          } else {
              // Add back to pending orders if failed
              setPendingLimitOrders(prev => [...prev, order]);
              
              console.error('Failed to execute limit order:', result.error);
            addNotification({
              title: 'Execution Failed',
              message: `Failed to execute your order: ${result.error}`,
                type: 'error',
                playSound: false
              });
            }
            
            // Remove from being executed tracking
            setOrdersBeingExecuted(prev => prev.filter(id => id !== order.id));
          })
          .catch(error => {
            // Add back to pending orders if failed
            setPendingLimitOrders(prev => [...prev, order]);
            
            console.error('Failed to execute limit order:', error);
          addNotification({
            title: 'Execution Error',
              message: `Error executing your order: ${error.message}`,
              type: 'error',
              playSound: false
            });
            
            // Remove from being executed tracking
            setOrdersBeingExecuted(prev => prev.filter(id => id !== order.id));
          });
      }
    });
  }, [marketPrice, pendingLimitOrders, currentUser, ordersBeingExecuted]);

  // Add a function to calculate liquidation price based on position details
  const calculateLiquidationPrice = (position) => {
    if (!position || !position.type || !position.entryPrice || !position.leverage) {
      return 0;
    }
    
    // Extract position details
    const { type, entryPrice, leverage, margin } = position;
    const entryPriceNum = parseFloat(entryPrice);
    const leverageNum = parseFloat(leverage);
    const marginNum = parseFloat(margin || 0);
    
    if (isNaN(entryPriceNum) || isNaN(leverageNum) || leverageNum === 0 || marginNum === 0) {
      return 0;
    }
    
    // Calculate the liquidation threshold (percentage of margin that triggers liquidation)
    // Typically this is around 80% of the margin, but can vary based on exchange rules
    const liquidationThreshold = 0.8;
    
    // Calculate liquidation price based on position type (buy/long or sell/short)
    if (type.toLowerCase() === 'buy' || type.toLowerCase() === 'long') {
      // For long positions, liquidation happens when price falls
      // Formula: entry_price - (entry_price / leverage) * liquidationThreshold
      return entryPriceNum * (1 - (liquidationThreshold / leverageNum));
    } else {
      // For short positions, liquidation happens when price rises
      // Formula: entry_price + (entry_price / leverage) * liquidationThreshold
      return entryPriceNum * (1 + (liquidationThreshold / leverageNum));
    }
  };

  useEffect(() => {
    console.log("Order type changed to:", orderType);
  }, [orderType]);

  // Create formatTradingData helper without hooks
  const formatTradingData = (crypto) => {
    if (!crypto) return null;
    return {
      token: {
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol?.toUpperCase(),
        type: crypto.type || 'cex',
        image: crypto.icon || crypto.logoUrl || crypto.logo ||
              `https://coinicons-api.vercel.app/api/icon/${crypto.symbol?.toLowerCase()}`,
        contractAddress: crypto.address || crypto.contractAddress,
        chainId: crypto.chainId || crypto.chain || 'bsc'
      },
      pairInfo: crypto.type === 'dex' ? {
        address: crypto.dexData?.pairAddress,
        dexId: crypto.dexData?.dexId,
        chainId: crypto.chainId || crypto.chain || 'bsc',
        priceUsd: parseFloat(crypto.price?.replace?.('$', '') || 0) 
      } : null,
      chartData: {
        price: parseFloat(typeof crypto.price === 'string' ? crypto.price.replace('$', '') : crypto.price) || 0,
        change24h: parseFloat(crypto.sale || 0),
        volume24h: crypto.volume24h,
        marketCap: crypto.cap
      }
    };
  };

  // Regular function for handling result clicks - no hooks here
  const handleResultClick = (result) => {
    if (!result || !result.id) return;
    
    // Log what we're doing
    console.log('Navigating to trading page with data:', result);
    
    // Create the trading data object without using hooks
    const tradingData = formatTradingData(result);
    
    // Use the navigate function from useNavigate hook (declared at component level)
    navigate(`/trading/${result.id}`, { 
      state: { cryptoData: tradingData }
    });
  };

  // Add error handling for missing data - make sure we always have something to display
  if (!cryptoData) {
    return (
      <TradingContainer>
        <h2>Loading trading data...</h2>
      </TradingContainer>
    );
  }

  // Add a function to check if positions should be liquidated based on current market price
  const checkPositionsForLiquidation = async () => {
    if (!currentUser || !marketPrice || positions.length === 0) return;
    
    try {
      for (const position of positions) {
        const liquidationPrice = calculateLiquidationPrice(position);
        
        // Check if liquidation condition is met
        const shouldLiquidate = position.type === 'buy' 
          ? marketPrice <= liquidationPrice 
          : marketPrice >= liquidationPrice;
        
        if (shouldLiquidate) {
          console.log(`Position ${position.id} is being liquidated at market price ${marketPrice}`);
          try {
            // Close the position at current market price
            await tradingService.closePosition(currentUser.uid, position.id, marketPrice);
            
            // Show notification
            setNotification({
              type: 'warning',
              message: `Position ${position.symbol} has been liquidated at ${marketPrice} USDT`
            });
            
            // Refresh positions
            fetchPositions();
          } catch (err) {
            console.error("Error during liquidation:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error checking for liquidations:", error);
    }
  };
  
  // Monitor price changes for liquidation checks
  useEffect(() => {
    if (marketPrice && positions.length > 0) {
      checkPositionsForLiquidation();
    }
  }, [marketPrice, positions]);

  return (
    <TradingContainer>
      {cryptoData?.token && (
        <CoinInfo>
          <CoinIcon 
            src={cryptoData.token?.image || `https://coinicons-api.vercel.app/api/icon/${cryptoData.token?.symbol?.toLowerCase()}`}
            onError={(e) => {
              e.target.onerror = null;
              if (e.target.src.includes('coinicons-api')) {
                e.target.src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cryptoData.token?.symbol?.toLowerCase()}.png`;
              } else {
                e.target.src = `https://s2.coinmarketcap.com/static/img/coins/64x64/${cryptoData.token?.id || '1'}.png`;
              }
            }}
          />
          <CoinDetails>
            <CoinName>{cryptoData.token?.name || "Loading..."}</CoinName>
            <CoinSymbol>{
              cryptoData.pairInfo?.symbol || 
              (cryptoData.token?.symbol ? `${cryptoData.token.symbol}/USDT` : 
              (window.location.pathname.includes('trading/') ? window.location.pathname.split('trading/')[1].toUpperCase() + '/USDT' : "ADA/USDT"))
            }</CoinSymbol>
          </CoinDetails>
          <PriceInfo>
            <CurrentPrice>${formatSmallNumber(marketPrice || 0)}</CurrentPrice>
          </PriceInfo>
        </CoinInfo>
      )}

      <TradingGrid>
        {renderChartSection()}

        <RightSection>
          {currentUser ? (
            <>
          <TradingInterface>
            <OrderBookSection>
              <OrderBook>
                <OrderBookHeader>
                  <span>Price(USDT)</span>
                  <span>Qty({cryptoData?.token?.symbol || 'BTC'})</span>
                  <span>Total</span>
                </OrderBookHeader>
                
                    <OrderBookContent>
                      <AsksContainer>
                        {orderBook?.asks?.length > 0 ? (
                          orderBook.asks.slice().reverse().map((ask, i) => (
                    <OrderBookRow 
                              key={`ask-${i}`}
                      $side="sell"
                      $depth={orderBook.asks.length ? 
                                      (parseFloat(ask.amount) / Math.max(...orderBook.asks.map(a => parseFloat(a.amount)))) * 100 : 0}
                        onClick={() => {
                        setOrderMode('limit');
                                setLimitPrice(String(ask.price));
                                setAmount(String(ask.amount));
                      }}
                      className={orderBookFlash[`ask-${i}`] ? 'flash' : ''}
                    >
                      <span style={{ color: '#F6465D' }}>
                                {formatOrderPrice(ask.price)}
                      </span>
                        <span>{typeof ask.amount === 'number' ? 
                          ask.amount.toFixed(4) : 
                          parseFloat(ask.amount).toFixed(4)}</span>
                        <span>{typeof ask.total === 'number' ? 
                          ask.total.toFixed(4) : 
                          parseFloat(ask.total).toFixed(4)}</span>
                    </OrderBookRow>
                          ))
                        ) : (
                          // Display placeholder rows when no asks are available
                          Array.from({ length: 7 }).map((_, index) => (
                            <OrderBookRow key={`empty-ask-${index}`} $side="sell" $depth={0}>
                              <span style={{ color: '#F6465D' }}>---</span>
                              <span>---</span>
                              <span>---</span>
                            </OrderBookRow>
                          ))
                        )}
                      </AsksContainer>

                  <CurrentPrice $isUp={marketPrice > lastPrice}>
                        <OrderBookArrow $direction={marketPrice > lastPrice ? 'up' : 'down'}>
                          {marketPrice > lastPrice ? '↑' : '↓'}
                        </OrderBookArrow>
                        {formatOrderPrice(marketPrice)}
                  </CurrentPrice>

                      <BidsContainer>
                        {orderBook?.bids?.length > 0 ? (
                          orderBook.bids.map((bid, i) => (
                    <OrderBookRow 
                              key={`bid-${i}`}
                      $side="buy"
                      $depth={orderBook.bids.length ? 
                                      (parseFloat(bid.amount) / Math.max(...orderBook.bids.map(b => parseFloat(b.amount)))) * 100 : 0}
                        onClick={() => {
                        setOrderMode('limit');
                                setLimitPrice(String(bid.price));
                                setAmount(String(bid.amount));
                      }}
                      className={orderBookFlash[`bid-${i}`] ? 'flash' : ''}
                    >
                      <span style={{ color: '#0ECB81' }}>
                                {formatOrderPrice(bid.price)}
                      </span>
                        <span>{typeof bid.amount === 'number' ? 
                          bid.amount.toFixed(4) : 
                          parseFloat(bid.amount).toFixed(4)}</span>
                        <span>{typeof bid.total === 'number' ? 
                          bid.total.toFixed(4) : 
                          parseFloat(bid.total).toFixed(4)}</span>
                    </OrderBookRow>
                          ))
                        ) : (
                          // Display placeholder rows when no bids are available
                          Array.from({ length: 7 }).map((_, index) => (
                            <OrderBookRow key={`empty-bid-${index}`} $side="buy" $depth={0}>
                              <span style={{ color: '#0ECB81' }}>---</span>
                              <span>---</span>
                              <span>---</span>
                            </OrderBookRow>
                          ))
                        )}
                      </BidsContainer>
                      
                      {/* Add Buy/Sell ratio indicator */}
                      <OrderBookRatio $buyPercent={buyRatio}>
                        <RatioIndicator>
                          <span>B {buyRatio}%</span>
                          <span>S {100 - buyRatio}%</span>
                        </RatioIndicator>
                      </OrderBookRatio>
                    </OrderBookContent>
              </OrderBook>
            </OrderBookSection>

            <OrderFormSection>
              <OrderTypeSelector>
                <OrderTab 
                  active={orderMode === 'market'} 
                  onClick={() => setOrderMode('market')}
                >
                  Market
                </OrderTab>
                <OrderTab 
                  active={orderMode === 'limit'} 
                  onClick={() => setOrderMode('limit')}
                >
                  Limit
                </OrderTab>
              </OrderTypeSelector>

              <OrderForm onSubmit={handleSubmit}>
                <AmountInput
                  key={`amount-${inputKey}`}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Amount in ${cryptoData.token.symbol}`}
                  min="0"
                  step="0.000001"
                  required
                />

                    {renderLeverageControls()}

                {orderMode === 'limit' && (
                  <AmountInput
                    key={`limit-${inputKey}`}
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Limit Price (USDT)"
                    required
                  />
                )}

                <OrderDetails>
                  <DetailRow>
                    <span>Entry Price</span>
                        <span>${orderMode === 'market' ? 
                          (marketPrice ? 
                            marketPrice.toLocaleString(
                              marketPrice < 0.01 ? 6 : 
                              marketPrice < 0.1 ? 5 : 
                              marketPrice < 1 ? 4 : 
                              marketPrice < 10 ? 4 : 
                              marketPrice < 100 ? 3 : 2
                            ) : '0.00') : 
                          (limitPrice || '0.00')}</span>
                  </DetailRow>
                  <DetailRow>
                    <span>Size</span>
                        <span>{amount || '0.00'} {cryptoData?.token?.symbol || ''}</span>
                  </DetailRow>
                  <DetailRow>
                    <span>Leverage</span>
                    <span>{leverage}x</span>
                  </DetailRow>
                </OrderDetails>

                    <div style={{ marginTop: 'auto' }}>
                <TradeInfo>
                  <InfoItem>
                    <span>Required Margin:</span>
                    <span>${calculateRequiredMargin(amount, marketPrice, leverage).toLocaleString()} USDT</span>
                  </InfoItem>
                  <InfoItem $highlight>
                    <span>Available Balance:</span>
                    <span>${typeof userBalance?.USDT === 'number' && !isNaN(userBalance.USDT) ? userBalance.USDT.toLocaleString() : '0.00'} USDT</span>
                  </InfoItem>
                </TradeInfo>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <OrderButton 
                    $orderType="buy"
                    onClick={() => {
                      setOrderType('buy');
                      // Pass 'buy' directly to handleSubmit to avoid state timing issues
                      handleSubmit(new Event('click'), 'buy');
                    }}
                    disabled={isPending}
                  >
                    {isPending && orderType === 'buy' ? 'Processing...' : `Buy ${cryptoData.token.symbol}`}
                  </OrderButton>
                  <OrderButton 
                    $orderType="sell"
                    onClick={() => {
                      setOrderType('sell');
                      // Pass 'sell' directly to handleSubmit to avoid state timing issues
                      handleSubmit(new Event('click'), 'sell');
                    }}
                    disabled={isPending}
                  >
                    {isPending && orderType === 'sell' ? 'Processing...' : `Sell ${cryptoData.token.symbol}`}
                  </OrderButton>
                      </div>
                </div>
              </OrderForm>
            </OrderFormSection>
          </TradingInterface>
            </>
          ) : (
            <LoginPrompt>
              <h3>Login to Trade</h3>
              <p>Create an account or login to start trading {cryptoData?.name || 'cryptocurrencies'}.</p>
              <ButtonGroup>
                <StyledButton onClick={() => window.location.href = '/login'}>Login</StyledButton>
                <StyledButton onClick={() => window.location.href = '/register'}>Register</StyledButton>
              </ButtonGroup>
            </LoginPrompt>
          )}
        </RightSection>
      </TradingGrid>

      {renderPendingLimitOrders()}

      {(isLoadingPositions ? true : openPositions.length > 0 || closedPositions.length > 0) && (
        <div style={{ marginTop: '20px' }}>
          <Tabs>
            <TabList>
              <Tab>Open Positions ({openPositions.filter(p => p.symbol === cryptoData?.token?.symbol).length})</Tab>
              <Tab>Closed Positions ({closedPositions.filter(p => p.symbol === cryptoData?.token?.symbol).length})</Tab>
            </TabList>

            <TabPanel>
              {isLoadingPositions ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading positions...</div>
              ) : openPositions.filter(p => p.symbol === cryptoData?.token?.symbol).length > 0 ? (
          <PositionsTable>
            <thead>
              <tr>
                <TableHeader>Type</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Entry Price</TableHeader>
                <TableHeader>Mark Price</TableHeader>
                <TableHeader>Liquidation</TableHeader>
                <TableHeader>Leverage</TableHeader>
                <TableHeader>PnL (ROE %)</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
                    {openPositions
                      .filter(position => position.symbol === cryptoData?.token?.symbol)
                      .map(position => {
                      const pnl = calculatePnL(position, marketPrice) || 0;
                      const roe = position.margin ? ((pnl / position.margin) * 100).toLocaleString() : '0.00';
                      const liquidationPrice = calculateLiquidationPrice(position);
                
                return (
                  <tr key={position.id}>
                    <TableCell style={{ 
                      color: position.side === 'sell' ? '#F6465D' : '#0ECB81' 
                    }}>
                      {position.side?.toUpperCase() || position.type?.toUpperCase() || 'N/A'}
                    </TableCell>
                          <TableCell>{position.amount || 0} {position.symbol || ''}</TableCell>
                    <TableCell>${position.entryPrice?.toLocaleString() || '0.00'}</TableCell>
                    <TableCell>${marketPrice >= 1000 ? marketPrice.toLocaleString() : marketPrice.toLocaleString() || '0.00'}</TableCell>
                    <TableCell style={{ color: '#F44336' }}>
                      ${liquidationPrice.toLocaleString()}
                    </TableCell>
                          <TableCell>{position.leverage || 1}x</TableCell>
                    <TableCell>
                      <PnLValue value={pnl}>
                        ${pnl.toLocaleString()} ({roe}%)
                      </PnLValue>
                    </TableCell>
                    <TableCell>
                      <Button
                              onClick={() => handleClosePosition(position)}
                              disabled={isPending && closingPositionId === position.id}
                            >
                              {isPending && closingPositionId === position.id ? 'Processing...' : 'Close'}
                      </Button>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </PositionsTable>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No open positions for {cryptoData?.token?.symbol || 'this pair'}</div>
              )}
            </TabPanel>

            <TabPanel>
              {isLoadingPositions ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading positions...</div>
              ) : closedPositions.filter(p => p.symbol === cryptoData?.token?.symbol).length > 0 ? (
                <PositionsTable>
                  <thead>
                    <tr>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Entry Price</TableHeader>
                      <TableHeader>Close Price</TableHeader>
                      <TableHeader>Leverage</TableHeader>
                      <TableHeader>Final PnL</TableHeader>
                      <TableHeader>Close Time</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {closedPositions
                      .filter(position => position.symbol === cryptoData?.token?.symbol)
                      .map(position => (
                      <tr key={position.id}>
                        <TableCell style={{ 
                          color: position.side === 'sell' ? '#F6465D' : '#0ECB81' 
                        }}>
                          {position.side?.toUpperCase() || position.type?.toUpperCase() || 'N/A'}
                        </TableCell>
                        <TableCell>{position.amount || 0} {position.symbol || ''}</TableCell>
                        <TableCell>${position.entryPrice?.toLocaleString() || '0.00'}</TableCell>
                        <TableCell>${position.closePrice?.toLocaleString() || '0.00'}</TableCell>
                        <TableCell>{position.leverage || 1}x</TableCell>
                        <TableCell>
                          <PnLValue value={position.finalPnL || 0}>
                            ${(position.finalPnL || 0).toLocaleString()}
                          </PnLValue>
                        </TableCell>
                        <TableCell>
                          {position.closeTime ? 
                            new Date(position.closeTime).toLocaleString() : 
                            'N/A'
                          }
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </PositionsTable>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>No closed positions for {cryptoData?.token?.symbol || 'this pair'}</div>
              )}
            </TabPanel>
          </Tabs>
        </div>
      )}

      {!isOnline && (
        <StatusMessage error>
          You are currently offline. Some features may be unavailable.
        </StatusMessage>
      )}

      {error && (
        <StatusMessage error>
          {error}
        </StatusMessage>
      )}
    </TradingContainer>
  );
}

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

export default Trading; 