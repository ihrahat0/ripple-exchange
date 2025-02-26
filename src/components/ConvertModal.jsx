import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { DEFAULT_COINS } from '../utils/constants';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1A1A2C;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  color: #fff;
`;

const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 24px;
  color: #fff;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #B4B4C6;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  background: #2A2A3C;
  border: 1px solid #3F3F5C;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  margin-bottom: 12px;
  
  &:focus {
    outline: none;
    border-color: #4A6BF3;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background: #2A2A3C;
  border: 1px solid #3F3F5C;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4A6BF3;
  }
`;

const ConversionInfo = styled.div`
  background: #2A2A3C;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  
  &.primary {
    background: #4A6BF3;
    color: #fff;
  }
  
  &.secondary {
    background: #2A2A3C;
    color: #fff;
  }
`;

const ErrorMessage = styled.div`
  color: #FF4D4D;
  font-size: 14px;
  margin-top: 8px;
`;

function ConvertModal({ isOpen, onClose, balances, tokenPrices, onConvert }) {
  const [fromCoin, setFromCoin] = useState('');
  const [toCoin, setToCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [conversionRate, setConversionRate] = useState(null);
  const [estimatedAmount, setEstimatedAmount] = useState(null);

  const sortedCoins = useMemo(() => {
    return Object.entries(DEFAULT_COINS)
      .map(([symbol, coin]) => {
        const balance = balances[symbol] || 0;
        const price = tokenPrices[symbol] || 0;
        const usdValue = balance * price;
        
        return {
          symbol,
          ...coin,
          balance,
          usdValue: symbol === 'USDT' ? balance : usdValue // USDT is pegged to USD
        };
      })
      .sort((a, b) => {
        // If both have zero balance, sort alphabetically
        if (a.balance === 0 && b.balance === 0) {
          return a.symbol.localeCompare(b.symbol);
        }
        // Sort by USD value first
        if (a.usdValue !== b.usdValue) {
          return b.usdValue - a.usdValue;
        }
        // If USD values are equal, sort by balance
        return b.balance - a.balance;
      });
  }, [balances, tokenPrices]);

  useEffect(() => {
    if (fromCoin && toCoin && tokenPrices && amount) {
      const fromPrice = tokenPrices[fromCoin];
      const toPrice = tokenPrices[toCoin];
      if (fromPrice && toPrice) {
        const rate = fromPrice / toPrice;
        setConversionRate(rate);
        setEstimatedAmount(parseFloat(amount) * rate);
      }
    } else {
      setConversionRate(null);
      setEstimatedAmount(null);
    }
  }, [fromCoin, toCoin, amount, tokenPrices]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!fromCoin || !toCoin || !amount) {
      setError('Please fill in all fields');
      return;
    }

    const fromBalance = balances[fromCoin] || 0;
    if (parseFloat(amount) > fromBalance) {
      setError('Insufficient balance');
      return;
    }

    onConvert({
      fromCoin,
      toCoin,
      fromAmount: parseFloat(amount),
      toAmount: estimatedAmount
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>Convert Cryptocurrency</Title>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>From</Label>
            <Select 
              value={fromCoin} 
              onChange={e => setFromCoin(e.target.value)}
            >
              <option value="">Select coin</option>
              {sortedCoins.map(coin => (
                <option key={coin.symbol} value={coin.symbol}>
                  {coin.name} ({coin.symbol}) - {coin.balance.toFixed(8)}
                </option>
              ))}
            </Select>
            {fromCoin && (
              <div style={{ fontSize: '12px', color: '#B4B4C6' }}>
                Available: {balances[fromCoin] || 0} {fromCoin} (${((balances[fromCoin] || 0) * (tokenPrices[fromCoin] || 0)).toFixed(2)})
              </div>
            )}
          </InputGroup>

          <InputGroup>
            <Label>To</Label>
            <Select 
              value={toCoin} 
              onChange={e => setToCoin(e.target.value)}
            >
              <option value="">Select coin</option>
              {sortedCoins
                .filter(coin => coin.symbol !== fromCoin)
                .map(coin => (
                  <option key={coin.symbol} value={coin.symbol}>
                    {coin.name} ({coin.symbol}) - {coin.balance.toFixed(8)}
                  </option>
                ))}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="any"
            />
          </InputGroup>

          {fromCoin && toCoin && amount && conversionRate && (
            <ConversionInfo>
              <div>Rate: 1 {fromCoin} = {conversionRate?.toFixed(8) || '0.00000000'} {toCoin}</div>
              <div>You will receive: {estimatedAmount?.toFixed(8) || '0.00000000'} {toCoin}</div>
            </ConversionInfo>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <Button type="button" className="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="primary">
              Convert
            </Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

ConvertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  balances: PropTypes.object.isRequired,
  tokenPrices: PropTypes.object.isRequired,
  onConvert: PropTypes.func.isRequired
};

export default ConvertModal; 