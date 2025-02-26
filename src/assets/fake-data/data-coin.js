import { useState, useEffect } from 'react';

// Import coin icons (keep as fallback)
import btcIcon from '../images/coin/btc.png';
import ethIcon from '../images/coin/eth.png';
import bnbIcon from '../images/coin/bnb.png';
import usdtIcon from '../images/coin/tet.png';
import solIcon from '../images/coin/sol.png';
import adaIcon from '../images/coin/ada.png';
import avaxIcon from '../images/coin/avax.png';

import chart1 from '../images/icon/chart-up.png';
import chart2 from '../images/icon/chart-down.png';

// Update TOKENS structure
export const TOKENS = {
    'bitcoin': { 
        name: 'Bitcoin',
        symbol: 'WBTC',  // Using Wrapped Bitcoin
        // WBTC/USDT pair on Uniswap V2
        pairAddress: '0x9db18186b5197326257b0ea0b8be1f22c044a8e3',
        chainId: 'ethereum',
        image: btcIcon,
        tradingId: 'bitcoin'
    },
    'ethereum': {
        name: 'Ethereum',
        symbol: 'WETH',  // Using Wrapped Ethereum
        // WETH/USDT pair on Uniswap V2
        pairAddress: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
        chainId: 'ethereum',
        image: ethIcon,
        tradingId: 'ethereum'
    },
    'binancecoin': {
        name: 'BNB',
        symbol: 'BNB',
        // WBNB/BUSD pair on PancakeSwap
        pairAddress: '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16',
        chainId: 'bsc',
        image: bnbIcon,
        tradingId: 'binancecoin'
    },
    'tether': {
        name: 'Tether',
        symbol: 'USDT',
        // USDT/WETH pair on Uniswap V2
        pairAddress: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
        chainId: 'ethereum',
        image: usdtIcon,
        tradingId: 'tether'
    }
};

const iconMap = {
    'bitcoin': btcIcon,
    'ethereum': ethIcon,
    'binancecoin': bnbIcon,
    'tether': usdtIcon,
    'solana': solIcon,
    'cardano': adaIcon,
    'avalanche-2': avaxIcon,
};

export const useRealTimeData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const promises = Object.values(TOKENS).map(token => 
                fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.pairAddress}`)
                .then(res => res.json())
            );

            const responses = await Promise.all(promises);
            
            const formattedData = responses.map((response, index) => {
                const token = Object.values(TOKENS)[index];
                if (!response || !response.pairs || !response.pairs.length) {
                    console.error(`No pair data for ${token.name} in useRealTimeData`);
                    return null;
                }
                const pair = response.pairs[0];

                return {
                    id: index + 1,
                    icon: pair.baseToken.logoURI || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${token.chainId}/assets/${token.pairAddress}/logo.png`,
                    name: token.name,
                    uint: token.symbol,
                    price: `$${parseFloat(pair.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    sale: `${parseFloat(pair.priceChange.h24) >= 0 ? '+' : ''}${parseFloat(pair.priceChange.h24).toFixed(2)}%`,
                    cap: `$${(parseFloat(pair.fdv) / 1e9).toFixed(2)}B`,
                    class: parseFloat(pair.priceChange.h24) >= 0 ? 'up' : 'down',
                    address: token.pairAddress,
                    chainId: token.chainId,
                    chart: parseFloat(pair.priceChange.h24) >= 0 ? chart1 : chart2
                };
            });

            const validData = formattedData.filter(item => item !== null);
            setData(validData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Fetch chart data for a specific token
    const fetchChartData = async (pairAddress, chainId) => {
        try {
            const response = await fetch(
                `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}/chart?from=${Date.now() - 7 * 24 * 60 * 60 * 1000}&to=${Date.now()}`
            );
            const data = await response.json();
            return data;
        } catch (err) {
            console.error('Error fetching chart data:', err);
            return null;
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Update every 15 seconds
        return () => clearInterval(interval);
    }, []);

    return { 
        data, 
        loading, 
        error,
        fetchChartData // Export this function to be used by other components
    };
};

export default useRealTimeData;