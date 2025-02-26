import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.com';

// Function to fetch data from Binance through a proxy
export const fetchBinanceData = async (symbol) => {
  try {
    // Replace with your backend proxy endpoint
    // If you don't have a backend, you can use a service like cors-anywhere temporarily
    const response = await axios.get(`${BASE_URL}/api/proxy/binance/ticker?symbol=${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    // Return default data structure to avoid breaking the UI
    return {
      symbol: symbol,
      lastPrice: '0.00',
      priceChangePercent: '0.00',
      volume: '0',
      high: '0',
      low: '0'
    };
  }
};

// Function for DEXScreener API
export const fetchDexScreenerData = async (chainId, pairAddress) => {
  try {
    // Use the proper endpoint or a proxy if needed
    const response = await axios.get(`${BASE_URL}/api/proxy/dexscreener/pair/${chainId}/${pairAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching DEXScreener data:', error);
    // Return default data
    return {
      pair: {
        priceUsd: '0.00',
        volume24h: '0',
        priceChange24h: '0'
      }
    };
  }
}; 