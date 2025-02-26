import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg2);
  border-radius: 8px;
  color: var(--text);
  padding: 20px;
`;

const Title = styled.h3`
  margin-bottom: 10px;
  color: var(--text);
`;

const Subtitle = styled.p`
  margin-bottom: 20px;
  color: var(--text-secondary);
  text-align: center;
`;

const Button = styled.a`
  background: var(--primary);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 10px;
  
  &:hover {
    opacity: 0.9;
  }
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  width: 80%;
  max-width: 500px;
`;

const FallbackChart = ({ pairName, dexScreenerUrl }) => {
  return (
    <Container>
      <Title>Chart Data Unavailable</Title>
      <Subtitle>
        Live chart data for {pairName} is not available in TradingView.
        <br />
        You can view this pair on DEXScreener for more details.
      </Subtitle>
      
      <InfoBox>
        <p style={{ marginBottom: '10px' }}>
          <strong>Why am I seeing this?</strong>
        </p>
        <ul style={{ marginLeft: '20px', marginBottom: '10px', fontSize: '14px' }}>
          <li>Some DEX tokens are too new or have low liquidity</li>
          <li>The token may not be indexed by TradingView</li>
          <li>The pair contract may be using a non-standard format</li>
        </ul>
        <p style={{ fontSize: '14px' }}>
          DEXScreener provides real-time data for most tokens, including those not 
          available on traditional charting platforms.
        </p>
      </InfoBox>
      
      <Button 
        href={dexScreenerUrl} 
        target="_blank"
        rel="noopener noreferrer"
      >
        View on DEXScreener
      </Button>
    </Container>
  );
};

export default FallbackChart; 