/**
 * Format a blockchain address to be more readable
 * @param {string} address - The blockchain address to format
 * @param {number} startChars - Number of characters to show at the start
 * @param {number} endChars - Number of characters to show at the end
 * @returns {string} The formatted address
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  
  // Convert non-string addresses to string to prevent errors
  const addressStr = String(address);
  
  if (addressStr.length <= startChars + endChars) return addressStr;
  
  return `${addressStr.substring(0, startChars)}...${addressStr.substring(addressStr.length - endChars)}`;
}; 