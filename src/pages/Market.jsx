import React from 'react';
import styled from 'styled-components';
import CryptoPrices from '../components/CryptoPrices';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(0, 40, 20, 0.8), rgba(0, 20, 40, 0.8));
  padding: 20px;
`;

const MarketCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border-radius: 16px;
  width: 100%;
  overflow: hidden;
  position: relative;
  margin-top: 60px;
  padding: 20px;
`;

const Market = () => {
  return (
    <Container>
      <MarketCard>
        <CryptoPrices />
      </MarketCard>
    </Container>
  );
};

export default Market;