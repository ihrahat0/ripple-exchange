import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';
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

const TradingContainer = styled.div`
  padding: 20px;
  background: var(--bg1);
  min-height: calc(100vh - 100px);
  margin-top: 10px;
`;

const TradingGrid = styled.div`
  display: grid;
  grid-template-columns: auto 600px;
  gap: 1px;
  margin-top: 20px;
  background: var(--bg);
`;

const ChartSection = styled.div`
  background: var(--bg);
  border-right: 1px solid var(--line);
  height: 500px;
`;

const RightSection = styled.div`
  width: 600px;
  background: var(--bg);
  display: grid;
  grid-template-rows: auto;
  height: 500px;
`;

const TradingInterface = styled.div`
  display: grid;
  grid-template-columns: 300px 300px;
  border-left: 1px solid var(--line);
`;

const OrderBookSection = styled.div`
  height: 500px;
  border-right: 1px solid var(--line);
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

const OrderFormSection = styled.div`
  padding: 12px;
  height: 500px;
  display: flex;
  flex-direction: column;
`;

const ChartCard = styled.div`
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
`;

const OrderCard = styled.div`
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const CoinIcon = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: contain;
  background: ${props => props.$theme === 'dark' ? '#2A2A3C' : '#fff'};
  padding: 2px;
`;

const CoinName = styled.h2`
  color: #fff;
  margin: 0;
  font-size: 24px;
`;

const CoinSymbol = styled.span`
  color: #7A7A7A;
  font-size: 16px;
`;

const PriceInfo = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const Price = styled.div`
  color: #fff;
  font-size: 24px;
  font-weight: 500;
`;

const Change = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.$isPositive ? 'rgba(14, 203, 129, 0.2)' : 'rgba(246, 70, 93, 0.2)'};
  color: ${props => props.$isPositive ? '#0ECB81' : '#F6465D'};
  margin-left: 8px;
`;

const OrderForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
`;

const TabGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Remove browser default styling */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type=number] {
    -moz-appearance: textfield;
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
  '1M': { label: '1M', tradingViewInterval: '1', binanceInterval: '1m', dexInterval: '1' },
  '5M': { label: '5M', tradingViewInterval: '5', binanceInterval: '5m', dexInterval: '5' },
  '15M': { label: '15M', tradingViewInterval: '15', binanceInterval: '15m', dexInterval: '15' },
  '1H': { label: '1H', tradingViewInterval: '60', binanceInterval: '1h', dexInterval: '60' },
  '4H': { label: '4H', tradingViewInterval: '240', binanceInterval: '4h', dexInterval: '240' },
  '1D': { label: '1D', tradingViewInterval: 'D', binanceInterval: '1d', dexInterval: '1440' },
  '1W': { label: '1W', tradingViewInterval: 'W', binanceInterval: '1w', dexInterval: '10080' }
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
  font-size: 14px;
  padding: 4px 0;
  margin: 3px 0;
  position: relative;
  color: ${props => props.$isUp ? '#0ECB81' : '#F6465D'};
  background: ${props => props.$isUp ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)'};
  
  /* Make the price more visible */
  text-shadow: 0 0 5px ${props => props.$isUp ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)'};
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${props => props.$isUp ? 'linear-gradient(to right, rgba(14, 203, 129, 0), rgba(14, 203, 129, 0.1), rgba(14, 203, 129, 0))' : 
                                         'linear-gradient(to right, rgba(246, 70, 93, 0), rgba(246, 70, 93, 0.1), rgba(246, 70, 93, 0))'};
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
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

const COINGECKO_IDS = {
    'bitcoin': { id: 'bitcoin', symbol: 'BTC', wsSymbol: 'btcusdt' },
    'ethereum': { id: 'ethereum', symbol: 'ETH', wsSymbol: 'ethusdt' },
    'tether': { id: 'tether', symbol: 'USDT', wsSymbol: 'usdtusdt' },
    'binancecoin': { id: 'binancecoin', symbol: 'BNB', wsSymbol: 'bnbusdt' },
    'ripple': { id: 'ripple', symbol: 'XRP', wsSymbol: 'xrpusdt' },
    'solana': { id: 'solana', symbol: 'SOL', wsSymbol: 'solusdt' },
    'cardano': { id: 'cardano', symbol: 'ADA', wsSymbol: 'adausdt' },
    'dogecoin': { id: 'dogecoin', symbol: 'DOGE', wsSymbol: 'dogeusdt' },
    'polkadot': { id: 'polkadot', symbol: 'DOT', wsSymbol: 'dotusdt' },
    'polygon': { id: 'matic-network', symbol: 'MATIC', wsSymbol: 'maticusdt' },
    'avalanche-2': { id: 'avalanche-2', symbol: 'AVAX', wsSymbol: 'avaxusdt' },
    'chainlink': { id: 'chainlink', symbol: 'LINK', wsSymbol: 'linkusdt' },
    'uniswap': { id: 'uniswap', symbol: 'UNI', wsSymbol: 'uniusdt' },
    'litecoin': { id: 'litecoin', symbol: 'LTC', wsSymbol: 'ltcusdt' },
    'bitcoin-cash': { id: 'bitcoin-cash', symbol: 'BCH', wsSymbol: 'bchusdt' },
    'stellar': { id: 'stellar', symbol: 'XLM', wsSymbol: 'xlmusdt' },
    'monero': { id: 'monero', symbol: 'XMR', wsSymbol: 'xmrusdt' },
    'cosmos': { id: 'cosmos', symbol: 'ATOM', wsSymbol: 'atomusdt' },
    'algorand': { id: 'algorand', symbol: 'ALGO', wsSymbol: 'algousdt' },
    'vechain': { id: 'vechain', symbol: 'VET', wsSymbol: 'vetusdt' },
    'serum': { id: 'serum', symbol: 'SRM', wsSymbol: 'srmusdt' },
    'raydium': { id: 'raydium', symbol: 'RAY', wsSymbol: 'rayusdt' },
    'mango-markets': { id: 'mango-markets', symbol: 'MNGO', wsSymbol: 'mngousdt' }
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
      return Number((margin * (percentageChange / 100) * leverage).toFixed(2));
    } else {
      const priceDiff = entryPrice - currentMarketPrice;
      const percentageChange = (priceDiff / entryPrice) * 100;
      return Number((margin * (percentageChange / 100) * leverage).toFixed(2));
    }
  } catch (error) {
    console.error('Error calculating PnL:', error);
    return 0;
  }
};

// Enhance the function for generating more realistic order book data
const generateMockOrderBookData = (currentPrice, depthCount = 15) => {
  if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
    console.warn('Invalid current price for order book generation:', currentPrice);
    currentPrice = 0.04; // Fallback price if invalid
  }
  
  // Function to get appropriate step size based on price
  const getStepSize = (price) => {
    if (price < 0.0001) return 0.00000001;
    if (price < 0.001) return 0.0000001;
    if (price < 0.01) return 0.000001;
    if (price < 0.1) return 0.00001;
    if (price < 1) return 0.0001;
    if (price < 10) return 0.001;
    if (price < 100) return 0.01;
    if (price < 1000) return 0.1;
    if (price < 10000) return 1; // For coins like ETH (~$2500), use $1 step
    if (price < 50000) return 2; // For higher value coins like BTC, use $2 step
    return 5; // For extremely high-value assets
  };
  
  // Get the step size for this price range
  const stepSize = getStepSize(currentPrice);
  const spreadFactor = 0.002; // Fixed 0.2% spread instead of random
  
  // Generate ask prices (sell orders) above current price
  const asks = [];
  let askPrice = currentPrice * (1 + spreadFactor);
  
  // Create a realistic volume distribution - more volume near the current price
  for (let i = 0; i < depthCount; i++) {
    // Round price to appropriate number of decimals
    askPrice = Math.round(askPrice / stepSize) * stepSize;
    
    // Volume decreases as we get further from current price (with reduced randomness)
    const volumeBase = 10 / (i + 1);
    const amount = parseFloat((volumeBase * (0.95 + Math.random() * 0.1)).toFixed(4));
    
    // Total value of this order
    const total = parseFloat((askPrice * amount).toFixed(4));
    
    asks.push({
      price: askPrice,
      amount: amount,
      total: total
    });
    
    // Use consistent price increments based on step size
    const priceIncrement = currentPrice > 1000 ? stepSize : stepSize * 1.5;
    askPrice += priceIncrement;
  }

  // Generate bid prices (buy orders) below current price
  const bids = [];
  let bidPrice = currentPrice * (1 - spreadFactor);
  
  for (let i = 0; i < depthCount; i++) {
    // Round price to appropriate number of decimals
    bidPrice = Math.round(bidPrice / stepSize) * stepSize;
    
    // Volume decreases as we get further from current price (with reduced randomness)
    const volumeBase = 10 / (i + 1);
    const amount = parseFloat((volumeBase * (0.95 + Math.random() * 0.1)).toFixed(4));
    
    // Total value of this order
    const total = parseFloat((bidPrice * amount).toFixed(4));
    
      bids.push({
      price: bidPrice,
      amount: amount,
      total: total
    });
    
    // Use consistent price decrements based on step size
    const priceDecrement = currentPrice > 1000 ? stepSize : stepSize * 1.5;
    bidPrice -= priceDecrement;
  }
  
  return { asks, bids };
};

const formatSmallNumber = (num) => {
  // Convert string to number if needed
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number) || number === null) return '0.00';
  
  // For very small numbers (less than 0.0001)
  if (number < 0.0001 && number > 0) {
    return number.toFixed(8).replace(/\.?0+$/, '');
  }
  
  // For small numbers (0.0001 to 0.001)
  if (number < 0.001) {
    return number.toFixed(7).replace(/\.?0+$/, '');
  }
  
  // For numbers between 0.001 and 0.01
  if (number < 0.01) {
    return number.toFixed(6).replace(/\.?0+$/, '');
  }
  
  // For numbers between 0.01 and 1
  if (number < 1) {
    return number.toFixed(4).replace(/\.?0+$/, '');
  }
  
  // For numbers greater than 1
  return number.toFixed(2).replace(/\.?0+$/, '');
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

/**
 * Creates order book data based on market price
 * @param {number} marketPrice - Current market price
 * @param {string} symbol - Token symbol
 * @param {number} buyRatio - Ratio of buy orders vs sell orders
 * @returns {Object} - Order book data with asks and bids
 */
const createOrderBookData = (marketPrice, symbol, buyRatio = 0.5) => {
  if (!marketPrice || isNaN(marketPrice)) {
    console.warn('Invalid market price for order book:', marketPrice);
    return { asks: [], bids: [] };
  }

  // Ensure buyRatio is between 0.3 and 0.7
  const normalizedBuyRatio = Math.min(Math.max(buyRatio / 100, 0.3), 0.7);
  
  // Generate mock data based on current price
  const orderBookData = generateMockOrderBookData(marketPrice, 15);
  
  // Adjust volume based on buy/sell ratio
  orderBookData.asks.forEach(ask => {
    ask.amount = parseFloat((ask.amount * (2 - normalizedBuyRatio * 1.5)).toFixed(4));
    ask.total = parseFloat((ask.price * ask.amount).toFixed(4));
  });
  
  orderBookData.bids.forEach(bid => {
    bid.amount = parseFloat((bid.amount * (normalizedBuyRatio * 1.5)).toFixed(4));
    bid.total = parseFloat((bid.price * bid.amount).toFixed(4));
  });
  
  return orderBookData;
};

function Trading() {
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

  // Refs for cleanup
  const ws = useRef(null);
  const priceUpdateInterval = useRef(null);
  const orderUpdateInterval = useRef(null);
  const unsubscribeOrders = useRef(null);
  const unsubscribePositions = useRef(null);

  // Synchronized order book update effect - moved to ensure it's called in the correct order
  useEffect(() => {
    let orderBookUpdateInterval = null;
    
    // Only set up the interval if we have valid data
    if (cryptoData && marketPrice) {
      console.log('Setting up synchronized order book updates with market price:', marketPrice);
      
      // Generate initial order book based on market price
      const initialOrderBook = createOrderBookData(marketPrice, cryptoData.token?.symbol || 'BTC', buyRatio);
      setOrderBook(initialOrderBook);
      
      // Set up interval for updating the order book
      orderBookUpdateInterval = setInterval(() => {
        setOrderBook(prevOrderBook => {
          // Use the current market price for accurate order book data
          const newOrderBook = createOrderBookData(marketPrice, cryptoData.token?.symbol || 'BTC', buyRatio);
          
          // Calculate which rows have changed significantly to highlight them
          const flashStates = {};
          
          // Compare asks to previous asks and highlight significant changes
          if (prevOrderBook?.asks?.length) {
            newOrderBook.asks.forEach((ask, i) => {
              if (i < prevOrderBook.asks.length) {
                const prevAsk = prevOrderBook.asks[i];
                // If price or amount changed by more than 0.5%
                const priceChanged = Math.abs(ask.price - prevAsk.price) / prevAsk.price > 0.005;
                const amountChanged = Math.abs(ask.amount - prevAsk.amount) / prevAsk.amount > 0.05;
                
                if (priceChanged || amountChanged) {
                  flashStates[`ask-${i}`] = true;
                }
              }
            });
          }
          
          // Compare bids to previous bids and highlight significant changes
          if (prevOrderBook?.bids?.length) {
            newOrderBook.bids.forEach((bid, i) => {
              if (i < prevOrderBook.bids.length) {
                const prevBid = prevOrderBook.bids[i];
                // If price or amount changed by more than 0.5%
                const priceChanged = Math.abs(bid.price - prevBid.price) / prevBid.price > 0.005;
                const amountChanged = Math.abs(bid.amount - prevBid.amount) / prevBid.amount > 0.05;
                
                if (priceChanged || amountChanged) {
                  flashStates[`bid-${i}`] = true;
                }
              }
            });
          }
          
          // Set flash states and clear them after animation
          if (Object.keys(flashStates).length > 0) {
            setOrderBookFlash(flashStates);
            setTimeout(() => setOrderBookFlash({}), 800);
          }
          
          return newOrderBook;
        });
      }, 3500); // Update less frequently (every 3.5 seconds) for more stable display
    }
    
    // Cleanup function
    return () => {
      if (orderBookUpdateInterval) {
        clearInterval(orderBookUpdateInterval);
      }
    };
  }, [cryptoData, marketPrice, buyRatio]);

  // Function to fetch positions for the current user
  const fetchPositions = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingPositions(true);
      
      // Get open positions
      const openPositionsQuery = query(
        collection(db, 'positions'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'OPEN')
      );
      
      const openPositionsSnapshot = await getDocs(openPositionsQuery);
      const openPositionsData = openPositionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get closed positions
      const closedPositionsQuery = query(
        collection(db, 'positions'),
        where('userId', '==', currentUser.uid),
        where('status', '==', 'CLOSED')
      );
      
      const closedPositionsSnapshot = await getDocs(closedPositionsQuery);
      const closedPositionsData = closedPositionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update the state
      setOpenPositions(openPositionsData);
      setClosedPositions(closedPositionsData);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [currentUser]);

  // Function to fetch pending limit orders for the current symbol
  const fetchPendingLimitOrders = useCallback(async () => {
    if (!currentUser || !cryptoData?.token?.symbol) return;
    
    try {
      const limitOrders = await tradingService.getLimitOrders(currentUser.uid, cryptoData?.token?.symbol);
      setPendingLimitOrders(limitOrders);
    } catch (error) {
      console.error('Error fetching limit orders:', error);
    }
  }, [currentUser, cryptoData?.token?.symbol]);

  // Effect to fetch positions on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      fetchPositions();
    }
  }, [currentUser, fetchPositions]);

  // Replace with a properly structured useEffect that doesn't have an early return
  useEffect(() => {
    let intervalId = null;
    
    // Only set up the limit order checking if we have the required data
    if (currentUser && cryptoData?.token?.symbol && marketPrice) {
      const executeLimitOrder = async (order) => {
        try {
          // Execute the limit order
          await tradingService.executeLimitOrder(
          currentUser.uid,
            order.id,
          cryptoData.token.symbol,
          marketPrice
        );
        
          // Refresh positions and limit orders
          fetchPositions();
          fetchPendingLimitOrders();
          
          console.log(`Limit order ${order.id} executed`);
        } catch (error) {
          console.error('Error executing limit order:', error);
        }
      };
      
      const checkLimitOrders = async () => {
        try {
          // Only check for limit order execution if there's a significant price change
          const pendingOrders = [...pendingLimitOrders];
          
          for (const order of pendingOrders) {
            // Check if the order should be executed
            if (order.type === 'buy' && marketPrice <= order.targetPrice) {
              // Execute buy limit order
              await executeLimitOrder(order);
            } else if (order.type === 'sell' && marketPrice >= order.targetPrice) {
              // Execute sell limit order
              await executeLimitOrder(order);
            }
        }
      } catch (error) {
        console.error('Error checking limit orders:', error);
      }
    };
    
      // Check limit orders when price changes
    checkLimitOrders();
      
      // Set up interval to periodically check limit orders
      intervalId = setInterval(checkLimitOrders, 10000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentUser, cryptoData?.token?.symbol, marketPrice, pendingLimitOrders, fetchPositions, fetchPendingLimitOrders]);

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
    } catch (error) {
      console.error('Error updating price:', error);
    }
  }, [currentPrice]);

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
        // CEX WebSocket connection
        const symbol = cryptoData?.token?.symbol?.toLowerCase() || 'btcusdt';
        console.log('Setting up initial WebSocket for symbol:', symbol);
        
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.p) {
              const newPrice = parseFloat(data.p);
              if (!isNaN(newPrice) && newPrice > 0) {
                console.log(`Received initial price update for ${symbol}:`, newPrice);
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
      }
    };

    updatePrice();

    // Set up interval for DEX price updates
    let interval;
    if (cryptoData.token?.type === 'dex') {
      interval = setInterval(updatePrice, 10000); // Update every 10 seconds
    }

    return () => {
      if (ws) {
        console.log('Closing initial WebSocket connection');
        ws.close();
      }
      if (interval) {
        clearInterval(interval);
      }
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
    if (cryptoData?.token?.id) {
      fetchPriceData();
    }
  }, [cryptoData?.token?.id, fetchPriceData]);


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
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPending) return;

    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

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
      type: orderType,
      amount: tradeAmount,
      leverage: parseInt(leverage),
      entryPrice: currentMarketPrice,
      margin: requiredMargin,
      orderMode: orderMode
    };

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
        }
      } else if (orderMode === 'limit') {
        // For limit orders, create a provisional pending order for UI feedback
        const provisionalId = `temp-${Date.now()}`;
        const now = new Date();
        const provisionalOrder = {
          id: provisionalId,
          userId: currentUser.uid,
          symbol: tradeData.symbol,
          type: tradeData.type,
          amount: tradeData.amount,
          leverage: tradeData.leverage,
          targetPrice: tradeData.entryPrice,
          margin: tradeData.margin,
          status: 'PENDING',
          createdAt: now,
          lastUpdated: now,
          isProvisional: true // Flag to identify optimistic updates
        };
        
        // Optimistically add to pending limit orders
        setPendingLimitOrders(prev => [provisionalOrder, ...prev]);
        
        const result = await tradingService.openPosition(currentUser.uid, tradeData);
        
        if (!result.success) {
          // Remove provisional order on error
          setPendingLimitOrders(prev => 
            prev.filter(order => !order.isProvisional)
          );
          throw new Error(result.error || 'Failed to create limit order');
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
      }
      
      // The position will be updated via the Firestore listener
      console.log(`Successfully closed position. PnL: $${result.pnl.toFixed(2)}, Return Amount: $${result.returnAmount.toFixed(2)}`);
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
    
    fetchPriceData();
    const interval = setInterval(fetchPriceData, 10000);
    
    return () => clearInterval(interval);
  }, [cryptoData?.token, fetchPriceData]);

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
                total: Number(newTotal.toFixed(2))
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
                total: Number(newTotal.toFixed(2))
              };
            }
          }
          
          return { bids: newBids, asks: newAsks };
        }
      });
    }, 4000);
    
    return () => clearInterval(orderBookInterval);
  }, [marketPrice]);

  // Generate dummy orders for the order book
  const generateDummyOrders = (currentPrice) => {
    try {
      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
        console.warn('Invalid price for generating orders:', currentPrice);
        currentPrice = 86470;
      }

      const isBtcStyle = currentPrice > 10000;
      const numOrders = 10;
      const bidSpread = 0.01;
      const askSpread = 0.01;
      
    const bids = [];
      let runningTotal = 0;
      
      for (let i = 1; i <= numOrders; i++) {
        const bidPrice = isBtcStyle
          ? currentPrice - (i * 0.5)
          : Number((currentPrice * (1 - (bidSpread * i / numOrders))).toFixed(2));
        
        const size = isBtcStyle
          ? (Math.random() * 3 + 0.001).toFixed(3)
          : (Math.random() * 4.5 + 0.5).toFixed(4);
        
        runningTotal += parseFloat(size);

      bids.push({
        price: bidPrice,
          amount: size,
          total: runningTotal.toFixed(3)
        });
      }
      
      const asks = [];
      runningTotal = 0;
      
      for (let i = 1; i <= numOrders; i++) {
        const askPrice = isBtcStyle
          ? currentPrice + (i * 0.5)
          : Number((currentPrice * (1 + (askSpread * i / numOrders))).toFixed(2));
        
        const size = isBtcStyle
          ? (Math.random() * 3 + 0.001).toFixed(3)
          : (Math.random() * 4.5 + 0.5).toFixed(4);
        
        runningTotal += parseFloat(size);
        
        asks.push({
          price: askPrice,
          amount: size,
          total: runningTotal.toFixed(3)
        });
      }
      
      bids.sort((a, b) => b.price - a.price);
      asks.sort((a, b) => a.price - b.price);
      
      return { bids, asks };
      } catch (error) {
      console.error('Error generating dummy orders:', error);
      return { bids: [], asks: [] };
    }
  };

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
    if (!cryptoData && cryptoId) {
      // Try to parse the trading pair from the URL
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
            type: 'cex'
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
        console.log('Created default cryptoData from URL:', defaultCryptoData);
      } else {
        // If we can't parse the URL properly, set a default BTC/USDT pair
        console.warn('Could not parse trading pair from URL, using default BTC/USDT');
        const defaultCryptoData = {
          token: {
            id: 'btc_usdt',
            name: 'Bitcoin',
            symbol: 'BTC',
            type: 'cex'
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
  }, [cryptoData, cryptoId]);

  // Add error handling for missing data - make sure we always have something to display
  useEffect(() => {
    if (!cryptoData && !cryptoId) {
      // If we have no data and no URL parameter, set a default
      const defaultCryptoData = {
        token: {
          id: 'btc_usdt',
          name: 'Bitcoin',
          symbol: 'BTC',
          type: 'cex'
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
      console.log('No crypto data or ID, using default BTC/USDT');
    }
  }, [cryptoData, cryptoId]);

  // Add error handling for missing data
  if (!cryptoData) {
      return (
      <TradingContainer>
        <h2>Loading trading data...</h2>
      </TradingContainer>
    );
  }

  // Extract symbol for chart
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
    return (
      <OrderBookTable>
        <div className="header">
          <div>Price</div>
          <div>Quantity</div>
          <div>Total</div>
        </div>
        
        {orderBook.asks.map((ask, index) => (
          <div key={`ask-${index}`} className="row">
            <OrderPrice type="ask" dangerouslySetInnerHTML={{ __html: formatSmallNumber(ask.price) }} />
            <div>{formatSmallNumber(ask.quantity)}</div>
            <div>{formatSmallNumber(ask.total)}</div>
          </div>
        ))}
        
        <div style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
          Current Price: <span dangerouslySetInnerHTML={{ __html: formatSmallNumber(currentPrice) }} />
        </div>
        
        {orderBook.bids.map((bid, index) => (
          <div key={`bid-${index}`} className="row">
            <OrderPrice type="bid" dangerouslySetInnerHTML={{ __html: formatSmallNumber(bid.price) }} />
            <div>{formatSmallNumber(bid.quantity)}</div>
            <div>{formatSmallNumber(bid.total)}</div>
          </div>
        ))}
      </OrderBookTable>
    );
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
                    {order.type?.toUpperCase() || 'N/A'}
        </TableCell>
                  <TableCell>{order.amount || 0} {order.symbol || ''}</TableCell>
                  <TableCell>${order.targetPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>${marketPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{order.leverage || 1}x</TableCell>
                  <TableCell>${order.margin?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {createdDate.toLocaleString()}
                  </TableCell>
        <TableCell>
          <Button
            onClick={() => handleCancelLimitOrder(order.id)}
                      disabled={isPending || order.isProvisional}
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
    if (!price) return '0.00000';
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    
    // For small numbers, use more decimal places
    if (numPrice < 0.0001) {
      return numPrice.toFixed(8);
    } else if (numPrice < 0.001) {
      return numPrice.toFixed(7);
    } else if (numPrice < 0.01) {
      return numPrice.toFixed(6);
    } else if (numPrice < 0.1) {
      return numPrice.toFixed(5);
    } else if (numPrice < 1) {
      return numPrice.toFixed(4);
    } else if (numPrice < 10) {
      return numPrice.toFixed(3);
    } else if (numPrice < 100) {
      return numPrice.toFixed(2);
    } else if (numPrice < 1000) {
      return numPrice.toFixed(2);
    }
    
    // For large numbers, use fewer decimal places
    return numPrice.toFixed(2);
  };

  return (
    <TradingContainer>
      {cryptoData?.token && (
        <CoinInfo>
          <CoinIcon src={cryptoData.token?.image || btcIcon} theme={theme} alt={cryptoData.token?.name || 'Crypto'} />
          <div>
            <CoinName>
              {cryptoData.token?.name || cryptoId?.split('-')[0] || 'Cryptocurrency'} 
              <CoinSymbol>/{cryptoData.token?.quoteToken || 'USDT'}</CoinSymbol>
            </CoinName>
            <PriceInfo>
              <Price>${marketPrice ? marketPrice.toFixed(2) : '0.00'}</Price>
              {cryptoData.chartData?.change24h !== undefined && (
                <Change $isPositive={cryptoData.chartData.change24h >= 0}>
                  {cryptoData.chartData.change24h >= 0 ? '+' : ''}{cryptoData.chartData.change24h}%
                </Change>
              )}
            </PriceInfo>
          </div>
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
                        {/* Remove random flag */}
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
                            marketPrice.toFixed(
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
                    <span>${calculateRequiredMargin(amount, marketPrice, leverage).toFixed(2)} USDT</span>
                  </InfoItem>
                  <InfoItem $highlight>
                    <span>Available Balance:</span>
                    <span>${typeof userBalance?.USDT === 'number' && !isNaN(userBalance.USDT) ? userBalance.USDT.toFixed(2) : '0.00'} USDT</span>
                  </InfoItem>
                </TradeInfo>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <OrderButton 
                    $orderType="buy"
                    onClick={() => {
                      setOrderType('buy');
                      handleSubmit(new Event('click'));
                    }}
                    disabled={isPending}
                  >
                    {isPending && orderType === 'buy' ? 'Processing...' : `Buy ${cryptoData.token.symbol}`}
                  </OrderButton>
                  <OrderButton 
                    $orderType="sell"
                    onClick={() => {
                      setOrderType('sell');
                      handleSubmit(new Event('click'));
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
                      const roe = position.margin ? ((pnl / position.margin) * 100).toFixed(2) : '0.00';
                
                return (
                  <tr key={position.id}>
                    <TableCell style={{ 
                      color: position.type === 'buy' ? '#0ECB81' : '#F6465D' 
                    }}>
                            {position.type?.toUpperCase() || 'N/A'}
                    </TableCell>
                          <TableCell>{position.amount || 0} {position.symbol || ''}</TableCell>
                          <TableCell>${position.entryPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>${marketPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{position.leverage || 1}x</TableCell>
                    <TableCell>
                      <PnLValue value={pnl}>
                              ${pnl.toFixed(2)} ({roe}%)
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
                        <TableCell>{position.type?.toUpperCase() || 'N/A'}</TableCell>
                        <TableCell>{position.amount || 0} {position.symbol || ''}</TableCell>
                        <TableCell>${position.entryPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>${position.closePrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{position.leverage || 1}x</TableCell>
                        <TableCell>
                          <PnLValue value={position.finalPnL || 0}>
                            ${(position.finalPnL || 0).toFixed(2)}
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