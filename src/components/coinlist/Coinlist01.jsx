import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import styled, { keyframes } from 'styled-components';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import 'react-tabs/style/react-tabs.css';

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

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const PageTitle = styled.h1`
  color: #fff;
  font-size: 36px;
  margin-bottom: 12px;
  font-weight: 600;
  
  &:hover {
    animation: ${textGlow} 3s ease-in-out infinite;
  }
`;

const PageDescription = styled.p`
  color: var(--onsurface);
  font-size: 16px;
  margin-bottom: 30px;
`;

const StyledTabs = styled(Tabs)`
  margin-top: 30px;
`;

const StyledTabList = styled(TabList)`
  display: flex;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
  margin-bottom: 20px;
  list-style-type: none;
  padding-left: 0;
`;

const StyledTab = styled(Tab)`
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  color: var(--onsurface);
  border: none;
  font-weight: 500;
  transition: all 0.3s;
  
  &.react-tabs__tab--selected {
    background: var(--primary);
    color: white;
    animation: ${glowPulse} 3s ease-in-out infinite;
  }
  
  &:hover:not(.react-tabs__tab--selected) {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 20px 12px 45px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #1A1A27;
  color: white;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--onsurface);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 20px;
`;

const TableHead = styled.thead`
  background: #1A1A27;
  th {
    text-align: left;
    padding: 15px 20px;
    color: var(--onsurface);
    font-weight: 500;
    font-size: 14px;
    border-bottom: 1px solid var(--line);
    
    &:first-child {
      border-top-left-radius: 10px;
    }
    
    &:last-child {
      border-top-right-radius: 10px;
      text-align: right;
    }
  }
`;

const TableBody = styled.tbody`
  tr {
    transition: all 0.3s;
    
    &:hover {
      background: rgba(247, 147, 26, 0.05);
      box-shadow: inset 0 0 10px rgba(247, 147, 26, 0.1);
    }
    
    td {
      padding: 15px 20px;
      border-bottom: 1px solid var(--line);
      
      &:last-child {
        text-align: right;
      }
    }
  }
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoinIcon = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: all 0.3s;
  
  tr:hover & {
    animation: ${glowPulse} 2s ease-in-out infinite;
  }
`;

const CoinName = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.span`
  color: white;
  font-weight: 500;
`;

const Symbol = styled.span`
  color: var(--onsurface);
  font-size: 12px;
`;

const PairSymbol = styled.span`
  color: var(--primary);
  font-weight: 500;
  
  tr:hover & {
    animation: ${textGlow} 2s ease-in-out infinite;
  }
`;

const PriceChange = styled.span`
  color: ${props => props.$isPositive ? '#0ECB81' : '#FF4D4D'};
  font-weight: 500;
`;

const Volume = styled.span`
  color: var(--onsurface);
`;

const TradeButton = styled.button`
  background: rgba(247, 147, 26, 0.1);
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    background: var(--primary);
    color: white;
    animation: ${glowPulse} 1.5s ease-in-out infinite;
  }
`;

function Coinlist01() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coins, setCoins] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    // Fetch coins data from Firestore
    useEffect(() => {
        const coinsRef = collection(db, 'coins');
        const q = query(coinsRef);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            try {
                const coinsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCoins(coinsData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching coins:', err);
                setError('Failed to load market data');
                setLoading(false);
            }
        }, (err) => {
            console.error('Snapshot error:', err);
            setError('Failed to connect to the market data service');
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const handleTrade = (coin) => {
        navigate(`/trading/${coin.id}`);
    };

    const filteredCoins = coins.filter(coin => {
        if (!searchTerm) return true;
        
        const term = searchTerm.toLowerCase();
        return (
            coin.name.toLowerCase().includes(term) || 
            coin.symbol.toLowerCase().includes(term) ||
            `${coin.symbol.toLowerCase()}/usdt`.includes(term)
        );
    });

    // Categorize coins
    const allCoins = filteredCoins;
    const gainers = filteredCoins.filter(coin => parseFloat(coin.priceChange) > 0)
        .sort((a, b) => parseFloat(b.priceChange) - parseFloat(a.priceChange));
    const losers = filteredCoins.filter(coin => parseFloat(coin.priceChange) < 0)
        .sort((a, b) => parseFloat(a.priceChange) - parseFloat(b.priceChange));
    const volume = filteredCoins.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));

    if (loading) {
        return (
            <Container>
                <PageTitle>Market</PageTitle>
                <PageDescription>Loading market data...</PageDescription>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <PageTitle>Market</PageTitle>
                <PageDescription>Error: {error}</PageDescription>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>Cryptocurrency Market</PageTitle>
            <PageDescription>View all cryptocurrencies ranked by market cap, price, and trading volume</PageDescription>
            
            <SearchContainer>
                <SearchIcon>🔍</SearchIcon>
                <SearchInput 
                    placeholder="Search coins by name, symbol or pair (e.g. BTC/USDT)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </SearchContainer>
            
            <StyledTabs selectedIndex={activeTab} onSelect={index => setActiveTab(index)}>
                <StyledTabList>
                    <StyledTab>All Coins</StyledTab>
                    <StyledTab>Top Gainers</StyledTab>
                    <StyledTab>Top Losers</StyledTab>
                    <StyledTab>Highest Volume</StyledTab>
                </StyledTabList>
                
                <TabPanel>
                    <Table>
                        <TableHead>
                            <tr>
                                <th>Name</th>
                                <th>Pair</th>
                                <th>Price</th>
                                <th>24h %</th>
                                <th>24h Volume</th>
                                <th>Market Cap</th>
                                <th>Action</th>
                            </tr>
                        </TableHead>
                        <TableBody>
                            {allCoins.map(coin => (
                                <tr key={coin.id}>
                                    <td>
                                        <CoinInfo>
                                            <CoinIcon src={coin.icon} alt={coin.name} />
                                            <CoinName>
                                                <Name>{coin.name}</Name>
                                                <Symbol>{coin.symbol}</Symbol>
                                            </CoinName>
                                        </CoinInfo>
                                    </td>
                                    <td>
                                        <PairSymbol>{coin.symbol}/USDT</PairSymbol>
                                    </td>
                                    <td>${parseFloat(coin.price).toLocaleString()}</td>
                                    <td>
                                        <PriceChange $isPositive={parseFloat(coin.priceChange) >= 0}>
                                            {parseFloat(coin.priceChange) > 0 ? '+' : ''}{parseFloat(coin.priceChange).toFixed(2)}%
                                        </PriceChange>
                                    </td>
                                    <td>
                                        <Volume>${parseFloat(coin.volume).toLocaleString()}</Volume>
                                    </td>
                                    <td>${parseFloat(coin.marketCap).toLocaleString()}</td>
                                    <td>
                                        <TradeButton onClick={() => handleTrade(coin)}>
                                            Trade
                                        </TradeButton>
                                    </td>
                                </tr>
                            ))}
                        </TableBody>
                    </Table>
                </TabPanel>
                
                <TabPanel>
                    <Table>
                        <TableHead>
                            <tr>
                                <th>Name</th>
                                <th>Pair</th>
                                <th>Price</th>
                                <th>24h %</th>
                                <th>24h Volume</th>
                                <th>Market Cap</th>
                                <th>Action</th>
                            </tr>
                        </TableHead>
                        <TableBody>
                            {gainers.map(coin => (
                                <tr key={coin.id}>
                                    <td>
                                        <CoinInfo>
                                            <CoinIcon src={coin.icon} alt={coin.name} />
                                            <CoinName>
                                                <Name>{coin.name}</Name>
                                                <Symbol>{coin.symbol}</Symbol>
                                            </CoinName>
                                        </CoinInfo>
                                    </td>
                                    <td>
                                        <PairSymbol>{coin.symbol}/USDT</PairSymbol>
                                    </td>
                                    <td>${parseFloat(coin.price).toLocaleString()}</td>
                                    <td>
                                        <PriceChange $isPositive={true}>
                                            +{parseFloat(coin.priceChange).toFixed(2)}%
                                        </PriceChange>
                                    </td>
                                    <td>
                                        <Volume>${parseFloat(coin.volume).toLocaleString()}</Volume>
                                    </td>
                                    <td>${parseFloat(coin.marketCap).toLocaleString()}</td>
                                    <td>
                                        <TradeButton onClick={() => handleTrade(coin)}>
                                            Trade
                                        </TradeButton>
                                    </td>
                                </tr>
                            ))}
                        </TableBody>
                    </Table>
                </TabPanel>
                
                <TabPanel>
                    <Table>
                        <TableHead>
                            <tr>
                                <th>Name</th>
                                <th>Pair</th>
                                <th>Price</th>
                                <th>24h %</th>
                                <th>24h Volume</th>
                                <th>Market Cap</th>
                                <th>Action</th>
                            </tr>
                        </TableHead>
                        <TableBody>
                            {losers.map(coin => (
                                <tr key={coin.id}>
                                    <td>
                                        <CoinInfo>
                                            <CoinIcon src={coin.icon} alt={coin.name} />
                                            <CoinName>
                                                <Name>{coin.name}</Name>
                                                <Symbol>{coin.symbol}</Symbol>
                                            </CoinName>
                                        </CoinInfo>
                                    </td>
                                    <td>
                                        <PairSymbol>{coin.symbol}/USDT</PairSymbol>
                                    </td>
                                    <td>${parseFloat(coin.price).toLocaleString()}</td>
                                    <td>
                                        <PriceChange $isPositive={false}>
                                            {parseFloat(coin.priceChange).toFixed(2)}%
                                        </PriceChange>
                                    </td>
                                    <td>
                                        <Volume>${parseFloat(coin.volume).toLocaleString()}</Volume>
                                    </td>
                                    <td>${parseFloat(coin.marketCap).toLocaleString()}</td>
                                    <td>
                                        <TradeButton onClick={() => handleTrade(coin)}>
                                            Trade
                                        </TradeButton>
                                    </td>
                                </tr>
                            ))}
                        </TableBody>
                    </Table>
                </TabPanel>
                
                <TabPanel>
                    <Table>
                        <TableHead>
                            <tr>
                                <th>Name</th>
                                <th>Pair</th>
                                <th>Price</th>
                                <th>24h %</th>
                                <th>24h Volume</th>
                                <th>Market Cap</th>
                                <th>Action</th>
                            </tr>
                        </TableHead>
                        <TableBody>
                            {volume.map(coin => (
                                <tr key={coin.id}>
                                    <td>
                                        <CoinInfo>
                                            <CoinIcon src={coin.icon} alt={coin.name} />
                                            <CoinName>
                                                <Name>{coin.name}</Name>
                                                <Symbol>{coin.symbol}</Symbol>
                                            </CoinName>
                                        </CoinInfo>
                                    </td>
                                    <td>
                                        <PairSymbol>{coin.symbol}/USDT</PairSymbol>
                                    </td>
                                    <td>${parseFloat(coin.price).toLocaleString()}</td>
                                    <td>
                                        <PriceChange $isPositive={parseFloat(coin.priceChange) >= 0}>
                                            {parseFloat(coin.priceChange) > 0 ? '+' : ''}{parseFloat(coin.priceChange).toFixed(2)}%
                                        </PriceChange>
                                    </td>
                                    <td>
                                        <Volume>${parseFloat(coin.volume).toLocaleString()}</Volume>
                                    </td>
                                    <td>${parseFloat(coin.marketCap).toLocaleString()}</td>
                                    <td>
                                        <TradeButton onClick={() => handleTrade(coin)}>
                                            Trade
                                        </TradeButton>
                                    </td>
                                </tr>
                            ))}
                        </TableBody>
                    </Table>
                </TabPanel>
            </StyledTabs>
        </Container>
    );
}

export default Coinlist01;