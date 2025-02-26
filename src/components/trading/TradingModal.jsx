import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

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
  background: #1E1E2D;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #7A7A7A;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
    color: #fff;
  }
`;

const Title = styled.h3`
  color: #fff;
  font-size: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoinIcon = styled.img`
  width: 32px;
  height: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #7A7A7A;
  font-size: 14px;
`;

const Input = styled.input`
  background: #2A2A3C;
  border: 1px solid #3F3F4C;
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 16px;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #4A6BF3;
  }
`;

const Select = styled.select`
  background: #2A2A3C;
  border: 1px solid #3F3F4C;
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 16px;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #4A6BF3;
  }
`;

const PriceInfo = styled.div`
  background: #2A2A3C;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PriceLabel = styled.span`
  color: #7A7A7A;
`;

const PriceValue = styled.span`
  color: #fff;
  font-weight: 500;
`;

const Button = styled.button`
  background: #4A6BF3;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: #3D5AD8;
  }
  
  &:disabled {
    background: #2A2A3C;
    cursor: not-allowed;
  }
`;

function TradingModal({ coin, onClose }) {
  const [type, setType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Here you would typically send the trade to your backend
      console.log('Executing trade:', {
        coin: coin.id,
        type,
        amount,
        price: coin.price
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`${type.toUpperCase()} order placed successfully!`);
      onClose();
    } catch (error) {
      console.error('Trade error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const total = amount ? (parseFloat(amount) * coin.price).toFixed(2) : '0.00';

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>
          <CoinIcon src={coin.image} alt={coin.name} />
          Trade {coin.name}
        </Title>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Type</Label>
            <Select 
              value={type} 
              onChange={e => setType(e.target.value)}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </Select>
          </InputGroup>
          
          <InputGroup>
            <Label>Amount ({coin.symbol})</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Enter amount in ${coin.symbol}`}
              required
            />
          </InputGroup>
          
          <PriceInfo>
            <PriceRow>
              <PriceLabel>Price</PriceLabel>
              <PriceValue>${coin.price.toLocaleString()}</PriceValue>
            </PriceRow>
            <PriceRow>
              <PriceLabel>Total</PriceLabel>
              <PriceValue>${total}</PriceValue>
            </PriceRow>
          </PriceInfo>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Processing...' : `${type === 'buy' ? 'Buy' : 'Sell'} ${coin.symbol}`}
          </Button>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}

TradingModal.propTypes = {
  coin: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default TradingModal; 