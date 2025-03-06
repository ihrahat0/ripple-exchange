import React from 'react';
import styled from 'styled-components';
import CryptoPrices from '../components/CryptoPrices';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #0B0B0F 0%, #121218 100%);
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