import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 20px;
  text-align: center;
  background: var(--bg1);
`;

const Title = styled.h1`
  font-size: 120px;
  color: var(--primary);
  margin: 0;
  line-height: 1;
`;

const Subtitle = styled.h2`
  font-size: 32px;
  color: var(--text);
  margin: 20px 0;
`;

const Description = styled.p`
  font-size: 18px;
  color: var(--onsurface);
  margin-bottom: 30px;
  max-width: 600px;
`;

const BackButton = styled.button`
  padding: 12px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

function Page404() {
  const navigate = useNavigate();

  return (
    <NotFoundContainer>
      <Title>404</Title>
      <Subtitle>Page Not Found</Subtitle>
      <Description>
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </Description>
      <BackButton onClick={() => navigate('/')}>
        Back to Home
      </BackButton>
    </NotFoundContainer>
  );
}

export default Page404;