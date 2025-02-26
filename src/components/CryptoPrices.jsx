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
import { collection, onSnapshot, query } from 'firebase/firestore';
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

  // Fetch historical data for a token
  const fetchHistoricalData = async (symbol, type, contractAddress, chainId) => {
    try {
      if (type === 'dex' && contractAddress) {
        // For DEX tokens, use DexScreener API
        const response = await axios.get(
          `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${contractAddress}`
        );
        
        // Check if we have valid pair data
        if (response.data?.pairs && response.data.pairs.length > 0) {
          const pair = response.data.pairs[0];
          
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
        }
        
        // Fallback if no data
        return { 
          timestamps: [], 
          prices: [],
          priceChange24h: 0
        };
      } else {
        // For CEX tokens, use Binance API
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
        return response.data.map(candle => ({
          time: candle[0],
          close: parseFloat(candle[4])
        }));
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'coins')), async (snapshot) => {
      try {
        const coinsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const updatedPrices = await Promise.all(
          coinsData.map(async (coin) => {
            try {
              let priceData;
              let historicalPrices;

              if (coin.type === 'dex' && coin.contractAddress) {
                // Fetch DEX data
                const response = await axios.get(
                  `https://api.dexscreener.com/latest/dex/tokens/${coin.contractAddress}`
                );
                
                const pairs = response.data.pairs;
                if (pairs && pairs.length > 0) {
                  const sortedPairs = pairs.sort((a, b) => 
                    parseFloat(b.liquidity?.usd || 0) - parseFloat(a.liquidity?.usd || 0)
                  );
                  
                  const mainPair = sortedPairs[0];
                  priceData = {
                    ...coin,
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
                }
              } else {
                // For CEX tokens
                try {
                  const response = await axios.get(
                    `https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.symbol}USDT`
                  );
                  
                  priceData = {
                    ...coin,
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
                  console.error(`Error fetching CEX data for ${coin.symbol}:`, error);
                  return null;
                }
              }

              // Fetch historical data
              historicalPrices = await fetchHistoricalData(
                coin.symbol,
                coin.type,
                coin.contractAddress,
                coin.chainId
              );

              if (historicalPrices) {
                setHistoricalData(prev => ({
                  ...prev,
                  [coin.id]: historicalPrices
                }));
              }

              return priceData;
            } catch (error) {
              console.error(`Error fetching data for ${coin.symbol}:`, error);
              return null;
            }
          })
        );

        setPrices(updatedPrices.filter(Boolean));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching prices:', error);
        setError(error.message);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
    
    const tradingData = {
      token: {
        id: crypto.id,
        name: crypto.name,
        symbol: cleanSymbol,
        type: crypto.type || 'cex',
        contractAddress: crypto.contractAddress,
        chainId: crypto.chain || 'bsc'
      },
      pairInfo: crypto.type === 'dex' ? {
        address: crypto.dexData?.pairAddress,
        dexId: crypto.dexData?.dexId,
        chainId: crypto.chain || 'bsc',
        priceUsd: parseFloat(crypto.price) || 0
      } : null,
      chartData: {
        lastPrice: parseFloat(crypto.price) || 0,
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
              <Td>
                {crypto.price}
              </Td>
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