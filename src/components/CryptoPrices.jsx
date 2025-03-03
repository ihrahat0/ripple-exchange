import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Filler,
  Legend,
  TimeScale
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import 'chartjs-adapter-date-fns';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import axios from 'axios';
import chart1 from '../assets/images/charts/1.png';
import chart2 from '../assets/images/charts/1.png';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Filler,
  Legend,
  TimeScale
);

// Define keyframe animations
const glow = keyframes`
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

const pulseGlow = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const Container = styled.div`
  padding: 20px 0;
  background: transparent;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  margin: 0;
  animation: ${textGlow} 3s ease-in-out infinite;
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
`;

const Tab = styled.button`
  background: ${props => props.$active ? '#F7931A' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$active ? '#fff' : '#7A7A7A'};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
  
  ${props => props.$active && css`
    animation: ${glow} 3s ease-in-out infinite;
  `}

  &:hover {
    background: ${props => props.$active ? '#F7931A' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.$active ? '#fff' : '#fff'};
  }
`;

const SeeAllButton = styled.button`
  background: transparent;
  color: #4A6BF3;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
  font-weight: 500;

  &:hover {
    background: rgba(74, 107, 243, 0.1);
    animation: ${textGlow} 1.5s ease-in-out infinite;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #1E1E2D;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  
  &:hover {
    animation: ${glow} 3s ease-in-out infinite;
  }
`;

const Th = styled.th`
  color: #7A7A7A;
  font-weight: 500;
  text-align: left;
  padding: 16px;
  font-size: 14px;
  background: #1A1A27;
`;

const Td = styled.td`
  color: #fff;
  padding: 16px;
  font-size: 14px;
  border-top: 1px solid #2A2A3C;
  vertical-align: middle;
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoinIcon = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: contain;
  transition: all 0.3s;
  
  tr:hover & {
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }
`;

const StarButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.$active ? '#F7931A' : '#7A7A7A'};
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  margin-right: 8px;
  transition: all 0.3s;
  
  &:hover {
    color: #F7931A;
    animation: ${pulseGlow} 1.5s ease-in-out infinite;
  }
`;

const ChangeText = styled.span`
  color: ${props => props.$isPositive ? '#0ECB81' : '#F6465D'};
  font-weight: 500;
`;

const ChartContainer = styled.div`
  width: 120px;
  height: 40px;
  margin: 0 auto;
  background: ${props => props.$isPositive ? 'rgba(14, 203, 129, 0.05)' : 'rgba(246, 70, 93, 0.05)'};
  border-radius: 4px;
  padding: 4px;
  position: relative;
`;

const TradeButton = styled.button`
  background: rgba(247, 147, 26, 0.1);
  color: #F7931A;
  border: 1px solid #F7931A;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    background: #F7931A;
    color: #fff;
    animation: ${glow} 1.5s ease-in-out infinite;
  }
`;

const MiniChart = styled.div`
  width: 160px;
  height: 60px;
  margin: 0 auto;
`;

function CryptoPrices() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState(new Set());
  const [historicalData, setHistoricalData] = useState({});

  const categories = ['All', 'Popular', 'Recently added', 'Trending', 'Memes'];

  const formatSmallNumber = (num) => {
    if (typeof num === 'string') {
      num = parseFloat(num);
    }
    
    if (isNaN(num) || num === 0) return '0.00';
    
    // For numbers smaller than 0.0001
    if (num < 0.0001) {
      const str = num.toFixed(8);
      let leadingZeros = 0;
      let significantPart = '';
      
      // Count leading zeros after decimal
      for (let i = 2; i < str.length; i++) {
        if (str[i] === '0') {
          leadingZeros++;
        } else {
          significantPart = str.substring(i);
          break;
        }
      }
      
      return `0${leadingZeros > 0 ? `<sub>${leadingZeros}</sub>` : ''}${significantPart}`;
    }
    
    // For numbers between 0.0001 and 0.01
    if (num < 0.01) {
      return num.toFixed(6);
    }
    
    // For numbers between 0.01 and 1
    if (num < 1) {
      return num.toFixed(4);
    }
    
    // For numbers greater than 1
    return num.toFixed(2);
  };

  // Fetch historical data for a token
  const fetchHistoricalData = async (symbol, type, address, chainId) => {
    try {
      if (!symbol) {
        console.warn('Symbol is missing in fetchHistoricalData');
        return null;
      }

      if (type === 'dex' && address) {
        console.log(`Fetching historical data for DEX token ${symbol} on chain ${chainId || 'bsc'} with address ${address}`);
        // For DEX tokens, use DexScreener API
        const response = await axios.get(
          `https://api.dexscreener.com/latest/dex/pairs/${chainId || 'bsc'}/${address}`
        );
        
        // Check if we have valid pair data
        if (response.data?.pairs && response.data.pairs.length > 0) {
          const pair = response.data.pairs[0];
          console.log(`Got historical data for ${symbol} from DexScreener:`, pair);
          
          // DexScreener doesn't provide historical candle data through API
          // We'll create a simple dataset based on current price and 24h change
          
          if (pair.priceUsd && pair.priceChange) {
            const currentPrice = parseFloat(pair.priceUsd);
            const priceChange24h = parseFloat(pair.priceChange.h24 || 0);
            
            // Calculate yesterday's price based on 24h change
            const yesterdayPrice = currentPrice / (1 + priceChange24h / 100);
            
            // Generate simple dataset with just two points - yesterday and today
            const now = Math.floor(Date.now() / 1000);
            const yesterday = now - 24 * 60 * 60;
            
            return {
              timestamps: [yesterday, now],
              prices: [yesterdayPrice, currentPrice],
              priceChange24h
            };
          }
        } else {
          console.warn(`No pair data found for ${symbol}`);
        }
        
        // Fallback if no data
        return { 
          timestamps: [], 
          prices: [],
          priceChange24h: 0
        };
      } else if (type === 'cex' || !type) {
        // For CEX tokens, use Binance API
        console.log(`Fetching historical data for CEX token ${symbol} from Binance`);
        try {
          const response = await axios.get(
            `https://api.binance.com/api/v3/klines`,
            {
              params: {
                symbol: `${symbol}USDT`,
                interval: '1h',
                limit: 168 // 7 days * 24 hours
              }
            }
          );
          console.log(`Got historical data for ${symbol} from Binance`, response.data.length, 'candles');
          return response.data.map(candle => ({
            time: candle[0],
            close: parseFloat(candle[4])
          }));
        } catch (error) {
          console.error(`Error fetching Binance data for ${symbol}:`, error);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Try to fetch from both 'tokens' and 'coins' collections
    const fetchFromBothCollections = async () => {
      console.log("Fetching from both tokens and coins collections");
      setLoading(true);
      
      try {
        // First check the tokens collection
        const tokensSnapshot = await getDocs(collection(db, 'tokens'));
        const tokensData = tokensSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Found ${tokensData.length} tokens in 'tokens' collection:`, tokensData);
        
        // Then check the coins collection
        const coinsSnapshot = await getDocs(collection(db, 'coins'));
        const coinsData = coinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Found ${coinsData.length} tokens in 'coins' collection:`, coinsData);
        
        // Combine the data, with coins taking precedence in case of duplicates
        const combinedData = [...tokensData];
        coinsData.forEach(coin => {
          const existingIndex = combinedData.findIndex(item => 
            item.symbol === coin.symbol || item.id === coin.id
          );
          
          if (existingIndex >= 0) {
            // Replace the existing item
            combinedData[existingIndex] = coin;
          } else {
            // Add as new item
            combinedData.push(coin);
          }
        });
        
        console.log(`Combined data has ${combinedData.length} tokens:`, combinedData);
        
        if (combinedData.length > 0) {
          const updatedPrices = await processTokensData(combinedData);
          setPrices(updatedPrices.filter(Boolean));
        } else {
          console.warn("No tokens found in either collection");
        }
      } catch (error) {
        console.error("Error fetching from collections:", error);
        setError("Failed to load token data: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFromBothCollections();
  }, []);

  // Extracted processing logic to a separate function for reuse
  const processTokensData = async (tokensData) => {
    return Promise.all(
      tokensData.map(async (token) => {
        try {
          let priceData;
          let historicalPrices;

          console.log(`Processing token: ${token.symbol}`, token);
          
          // Normalize token data to handle different field names
          const normalizedToken = {
            ...token,
            address: token.address || token.contractAddress,
            chainId: token.chainId || token.chain || 'bsc',
            icon: token.icon || token.logoUrl || token.logo // Add fallback to logoUrl field from admin panel
          };

          if (normalizedToken.type === 'dex' && normalizedToken.address) {
            console.log(`Fetching DEX data for ${normalizedToken.symbol} with address ${normalizedToken.address}`);
            // Fetch DEX data
            const response = await axios.get(
              `https://api.dexscreener.com/latest/dex/tokens/${normalizedToken.address}`
            );
            console.log(`DexScreener response for ${normalizedToken.symbol}:`, response.data);
            
            const pairs = response.data.pairs;
            if (pairs && pairs.length > 0) {
              const sortedPairs = pairs.sort((a, b) => 
                parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0)
              );
              
              const mainPair = sortedPairs[0];
              priceData = {
                ...normalizedToken,
                price: `$${parseFloat(mainPair.priceUsd).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}`,
                sale: `${parseFloat(mainPair.priceChange.h24).toFixed(2)}%`,
                volume24h: mainPair.volume.h24,
                cap: `$${(parseFloat(mainPair.fdv || 0) / 1e6).toFixed(2)}M`,
                class: parseFloat(mainPair.priceChange.h24) >= 0 ? 'up' : 'down',
                dexData: {
                  pairAddress: mainPair.pairAddress,
                  dexId: mainPair.dexId,
                  baseToken: mainPair.baseToken,
                  chainId: mainPair.chainId,
                  liquidity: mainPair.liquidity.usd
                }
              };
            } else {
              console.warn(`No pairs found for DEX token ${normalizedToken.symbol}`);
            }
          } else {
            // For CEX tokens
            try {
              console.log(`Fetching CEX data for ${normalizedToken.symbol}`);
              const response = await axios.get(
                `https://api.binance.com/api/v3/ticker/24hr?symbol=${normalizedToken.symbol}USDT`
              );
              console.log(`Binance response for ${normalizedToken.symbol}:`, response.data);
              
              priceData = {
                ...normalizedToken,
                price: `$${parseFloat(response.data.lastPrice).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                })}`,
                sale: `${parseFloat(response.data.priceChangePercent).toFixed(2)}%`,
                volume24h: response.data.volume,
                cap: 'N/A', // Market cap not available from Binance API
                class: parseFloat(response.data.priceChangePercent) >= 0 ? 'up' : 'down'
              };
            } catch (error) {
              console.error(`Error fetching CEX data for ${normalizedToken.symbol}:`, error);
              return null;
            }
          }

          // Fetch historical data
          historicalPrices = await fetchHistoricalData(
            normalizedToken.symbol,
            normalizedToken.type,
            normalizedToken.address,
            normalizedToken.chainId
          );

          if (historicalPrices) {
            setHistoricalData(prev => ({
              ...prev,
              [normalizedToken.id]: historicalPrices
            }));
          }

          console.log(`Final processed data for ${normalizedToken.symbol}:`, priceData);
          return priceData;
        } catch (error) {
          console.error(`Error fetching data for ${token.symbol}:`, error);
          return null;
        }
      })
    );
  };

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const renderMiniChart = (coinId, isPositive) => {
    const data = historicalData[coinId];
    if (!data) return null;

    let chartData;
    if (Array.isArray(data)) {
      // Format for CEX data
      chartData = {
        labels: data.map((_, index) => index),
        datasets: [{
          data: data.map(candle => candle.close),
          borderColor: isPositive ? '#0ECB81' : '#F6465D',
          borderWidth: 1.5,
          fill: true,
          backgroundColor: isPositive ? 
            'rgba(14, 203, 129, 0.1)' : 
            'rgba(246, 70, 93, 0.1)',
          tension: 0.4,
          pointRadius: 0
        }]
      };
    } else {
      // Format for DEX data
      const prices = Object.values(data || {}).map(candle => candle.close);
      chartData = {
        labels: Array.from({ length: prices.length }, (_, i) => i),
        datasets: [{
          data: prices,
          borderColor: isPositive ? '#0ECB81' : '#F6465D',
          borderWidth: 1.5,
          fill: true,
          backgroundColor: isPositive ? 
            'rgba(14, 203, 129, 0.1)' : 
            'rgba(246, 70, 93, 0.1)',
          tension: 0.4,
          pointRadius: 0
        }]
      };
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        line: {
          tension: 0.4
        }
      }
    };

    return (
      <MiniChart>
        <Line data={chartData} options={options} />
      </MiniChart>
    );
  };

  const handleTrade = (crypto) => {
    const cleanSymbol = crypto.symbol?.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Normalize data structure to handle both 'tokens' and 'coins' format
    const tradingData = {
      token: {
        id: crypto.id,
        name: crypto.name,
        symbol: cleanSymbol,
        type: crypto.type || 'cex',
        contractAddress: crypto.address || crypto.contractAddress, // Support both field names
        chainId: crypto.chainId || crypto.chain || 'bsc' // Support both field names
      },
      pairInfo: crypto.type === 'dex' ? {
        address: crypto.dexData?.pairAddress,
        dexId: crypto.dexData?.dexId,
        chainId: crypto.chainId || crypto.chain || 'bsc',
        priceUsd: parseFloat(crypto.price?.replace('$', '')) || 0
      } : null,
      chartData: {
        lastPrice: parseFloat(crypto.price?.replace('$', '')) || 0,
        change24h: parseFloat(crypto.sale) || 0,
        volume24h: crypto.volume24h,
        marketCap: crypto.cap
      }
    };

    console.log('Trading data:', tradingData); // For debugging

    navigate(`/trading/${crypto.id}`, { 
      state: { cryptoData: tradingData } 
    });
  };

  if (loading) {
    return (
      <Container>
        <Title>Loading market data...</Title>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Error loading market data: {error}</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Market Update</Title>
        <SeeAllButton>See All Coins</SeeAllButton>
      </Header>

      <CategoryTabs>
        {categories.map(category => (
          <Tab
            key={category}
            $active={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Tab>
        ))}
      </CategoryTabs>

      <Table>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Name</Th>
            <Th>Last Price</Th>
            <Th>24h %</Th>
            <Th>Market Cap</Th>
            <Th>Last 7 Days</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {prices.map((crypto, index) => crypto && (
            <tr key={crypto.id}>
              <Td>
                <StarButton
                  $active={favorites.has(crypto.id)}
                  onClick={() => toggleFavorite(crypto.id)}
                >
                  ★
                </StarButton>
                {index + 1}
              </Td>
              <Td>
                <CoinInfo>
                  <CoinIcon src={crypto.icon} alt={crypto.name} />
                  <div>
                    <div style={{ fontWeight: '500' }}>{crypto.name}</div>
                    <div style={{ color: '#7A7A7A', fontSize: '14px', marginTop: '4px' }}>
                      {crypto.symbol}
                    </div>
                  </div>
                </CoinInfo>
              </Td>
              <Td dangerouslySetInnerHTML={{ __html: formatSmallNumber(parseFloat(crypto.price.replace('$', ''))) }} />
              <Td>
                <ChangeText $isPositive={crypto.class === 'up'}>
                  {crypto.sale}
                </ChangeText>
              </Td>
              <Td>
                {crypto.cap}
              </Td>
              <Td>
                {renderMiniChart(crypto.id, crypto.class === 'up')}
              </Td>
              <Td>
                <TradeButton onClick={() => handleTrade(crypto)}>
                  Trade
                </TradeButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default CryptoPrices; 