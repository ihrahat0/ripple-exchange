/**
 * Utility functions for formatting values
 */

/**
 * Format a currency value with the appropriate symbol and decimal places
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (e.g., 'USDT', 'BTC')
 * @param {number} decimals - Number of decimal places to show
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USDT', decimals = 2) => {
  if (amount === undefined || amount === null) return '-';
  
  let formattedAmount;
  let symbol = '';
  
  // Handle different currencies
  switch (currency) {
    case 'USDT':
    case 'USD':
      symbol = '$';
      formattedAmount = amount.toFixed(decimals);
      break;
    case 'BTC':
      symbol = '₿';
      formattedAmount = amount.toFixed(8);
      break;
    case 'ETH':
      symbol = 'Ξ';
      formattedAmount = amount.toFixed(6);
      break;
    default:
      formattedAmount = amount.toFixed(decimals);
  }
  
  // Format large numbers with commas
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${symbol}${parts.join('.')}`;
};

/**
 * Format a number with specified decimals and optionally add thousand separators
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @param {boolean} addSeparator - Whether to add thousand separators
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value, decimals = 2, addSeparator = true) => {
  if (value === undefined || value === null) return '-';
  
  const formattedValue = parseFloat(value).toFixed(decimals);
  
  if (!addSeparator) return formattedValue;
  
  const parts = formattedValue.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return parts.join('.');
};

/**
 * Format a percentage value
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === undefined || value === null) return '-';
  
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format a date or timestamp
 * @param {Date|number|string} date - Date object, timestamp, or ISO date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'object' ? date : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
};

/**
 * Format a relative time (e.g., "5 minutes ago")
 * @param {Date|number|string} date - Date object, timestamp, or ISO date string
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'object' ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateObj, { hour: undefined, minute: undefined });
};