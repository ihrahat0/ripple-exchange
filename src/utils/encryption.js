import CryptoJS from 'crypto-js';

// This key should be stored in environment variables
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secure-key-here';

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}; 