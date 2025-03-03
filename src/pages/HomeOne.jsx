import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import CryptoPrices from '../components/CryptoPrices';

// Import images needed for the design
import btcIcon from '../assets/images/coin/btc.png';
import ethIcon from '../assets/images/coin/eth.png';
import bnbIcon from '../assets/images/coin/bnb.png';
import tetIcon from '../assets/images/coin/tet.png';
import solIcon from '../assets/images/coin/sol.png';
import qrCode from '../assets/images/layout/qr-code.png';

// Define keyframe animations
const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(247, 147, 26, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(247, 147, 26, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(247, 147, 26, 0.5);
  }
`;

const gradientFlow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const textGlow = keyframes`
  0% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.5);
  }
  50% {
    text-shadow: 0 0 20px rgba(247, 147, 26, 0.8), 0 0 30px rgba(247, 147, 26, 0.4);
  }
  100% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.5);
  }
`;

const borderGlow = keyframes`
  0% {
    border-color: rgba(247, 147, 26, 0.5);
  }
  50% {
    border-color: rgba(247, 147, 26, 1);
  }
  100% {
    border-color: rgba(247, 147, 26, 0.5);
  }
`;

// Add marquee animation keyframe
const marquee = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

// Add background glow animation
const backgroundGlow = keyframes`
  0% {
    opacity: 0.3;
    background-position: 0% 50%;
  }
  50% {
    opacity: 0.6;
    background-position: 100% 50%;
  }
  100% {
    opacity: 0.3;
    background-position: 0% 50%;
  }
`;

// Add glowing orb effect
const pulseGlow = keyframes`
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
`;

// Add grid glow effect
const gridGlow = keyframes`
  0% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.2;
  }
`;

// Styled components for the new design
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroSection = styled.section`
  padding: 80px 0;
  background: linear-gradient(180deg, #0B0B0F 0%, #121218 100%);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 60px 0;
  }
  
  @media (max-width: 480px) {
    padding: 40px 0;
  }
`;

const HeroContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 992px) {
    flex-direction: column;
    text-align: center;
  }
`;

const HeroContent = styled.div`
  max-width: 600px;
  
  @media (max-width: 992px) {
    max-width: 100%;
    margin-bottom: 40px;
  }
`;

const HeroLeft = styled.div`
  max-width: 600px;
`;

const HeroRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const FloatingCoins = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  
  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
    100% {
      transform: translateY(0px);
    }
  }
`;

const CoinIcon = styled.img`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
`;

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #F7931A, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 30px;
  color: rgba(255, 255, 255, 0.8);
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const HeroImage = styled.div`
  max-width: 500px;
  
  img {
    width: 100%;
    height: auto;
  }
  
  @media (max-width: 992px) {
    max-width: 400px;
  }
  
  @media (max-width: 480px) {
    max-width: 300px;
  }
`;

const SignupBox = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px;
  position: relative;
  overflow: hidden;
  animation: ${glow} 4s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 10px;
    background: linear-gradient(45deg, #F7931A, #FF9E2A, #F7931A);
    background-size: 400% 400%;
    z-index: -1;
    animation: ${gradientFlow} 15s ease infinite;
  }
`;

const StyledInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  padding: 12px 15px;
  color: #fff;
  width: 100%;
  margin-right: 15px;
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
  }
`;

const PrimaryButton = styled(Button)`
  background: var(--primary);
  color: white;
  border: none;
  
  &:hover {
    background: var(--primary-dark);
    box-shadow: 0 0 15px rgba(247, 147, 26, 0.5);
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  
  &:hover {
    background: rgba(247, 147, 26, 0.1);
  }
`;

const CryptoImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
  position: absolute;
  z-index: 1;
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
`;

const MarketSection = styled.div`
  margin: 60px 0;
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 40px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 30px;
  }
  
  @media (max-width: 480px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
`;

const SectionText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-bottom: 20px;
  text-align: ${props => props.$center ? 'center' : 'left'};
`;

const ViewMoreLink = styled(Link)`
  color: #F7931A;
  font-weight: 500;
  text-decoration: none;
  display: flex;
  align-items: center;
  float: right;
  margin-top: -60px;
  
  &:hover {
    text-decoration: underline;
  }
  
  &::after {
    content: '→';
    margin-left: 5px;
  }
`;

const GettingStartedSection = styled.div`
  background: #0A0A0A;
  border-radius: 16px;
  padding: 60px 0;
  margin: 60px 0;
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-top: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 40px auto 0;
  }
`;

const StepCard = styled.div`
  background: #13131D;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  @media (max-width: 768px) {
    margin-top: ${props => props.$firstStep ? '20px' : '0'};
  }
`;

const StepNumber = styled.div`
  background: #F7931A;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin: 0 auto 20px;
`;

const StepIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: #1E1E2D;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F7931A;
  font-size: 30px;
`;

const StepTitle = styled.h3`
  color: #fff;
  font-size: 20px;
  margin-bottom: 15px;
`;

const StepDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 20px;
`;

const ProductsSection = styled.div`
  margin: 60px 0;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 40px;
`;

const ProductCard = styled.div`
  background: #13131D;
  border-radius: 12px;
  padding: 30px;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    animation: ${glow} 2s ease-in-out infinite;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #F7931A, #FF9E2A, #F7931A);
    background-size: 200% 200%;
    opacity: 0;
    transition: opacity 0.3s;
    animation: ${gradientFlow} 3s ease infinite;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const ProductIcon = styled.img`
  width: 60px;
  height: 60px;
  margin-bottom: 20px;
`;

const ProductTitle = styled.h3`
  color: #fff;
  font-size: 18px;
  margin-bottom: 15px;
`;

const ProductDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 20px;
`;

const DetailsLink = styled(Link)`
  color: #F7931A;
  font-weight: 500;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  &:hover {
    text-decoration: underline;
  }
  
  &::after {
    content: '→';
    margin-left: 5px;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 60px 0;
  text-align: center;
`;

const StatItem = styled.div`
  padding: 20px;
`;

const StatValue = styled.div`
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const MobileAppSection = styled.div`
  background: #13131D;
  border-radius: 16px;
  padding: 60px 0;
  margin: 60px 0;
  text-align: center;
`;

const AppContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
`;

const AppLeft = styled.div`
  text-align: left;
`;

const AppRight = styled.div`
  text-align: center;
`;

const AppButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 30px;
`;

const AppButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1E1E2D;
  border-radius: 8px;
  padding: 12px 20px;
  color: #fff;
  text-decoration: none;
  
  &:hover {
    background: #2A2A3C;
  }
`;

const AppIcon = styled.div`
  margin-right: 10px;
  font-size: 24px;
`;

const QRCode = styled.img`
  width: 120px;
  height: 120px;
  margin-bottom: 15px;
`;

const FAQSection = styled.div`
  margin: 60px 0;
`;

const FAQItem = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
`;

const FAQQuestion = styled.div`
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  padding: 20px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &::after {
    content: ${props => props.$isOpen ? '"-"' : '"+"'};
    font-size: 22px;
    color: #F7931A;
  }
`;

const FAQAnswer = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  padding: 0 0 20px;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const CTASection = styled.section`
  padding: 80px 0;
  background: linear-gradient(135deg, #0B0B0F 0%, #1A1A25 100%);
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 60px 0;
  }
  
  @media (max-width: 480px) {
    padding: 40px 0;
  }
`;

const CTAContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const CTATitle = styled.h2`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
  
  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

// Add marquee/ticker component
const MarqueeBanner = styled.div`
  background-color: rgba(247, 147, 26, 0.1);
  padding: 12px 0;
  overflow: hidden;
  position: relative;
  width: 100%;
  margin-top: 40px;
  border-top: 1px solid rgba(247, 147, 26, 0.2);
  border-bottom: 1px solid rgba(247, 147, 26, 0.2);
`;

const MarqueeContent = styled.div`
  display: flex;
  animation: ${marquee} 40s linear infinite;
  white-space: nowrap;
`;

const MarqueeItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 80px;
  font-size: 14px;
  font-weight: 500;
`;

const MarqueeIcon = styled.span`
  background-color: ${props => props.color || '#F7931A'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 12px;
  font-weight: bold;
`;

const MarqueeText = styled.span`
  color: #fff;
`;

// Add glowing orb effect
const GlowingOrb = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(247, 147, 26, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
  top: -150px;
  right: -150px;
  z-index: 0;
  filter: blur(40px);
  animation: ${pulseGlow} 15s ease-in-out infinite;
`;

const GlowingOrb2 = styled.div`
  position: absolute;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(247, 147, 26, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
  bottom: -100px;
  right: 30%;
  z-index: 0;
  filter: blur(50px);
  animation: ${pulseGlow} 12s ease-in-out infinite;
  animation-delay: 2s;
`;

// Additional glowing element at the bottom
const GlowingBottom = styled.div`
  position: absolute;
  bottom: -50px;
  left: 0;
  right: 0;
  height: 120px;
  background: radial-gradient(ellipse at center, rgba(247, 147, 26, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(30px);
  z-index: 0;
  animation: ${pulseGlow} 10s ease-in-out infinite;
  animation-delay: 1s;
`;

function HomeOne() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(0);
  
  const faqItems = [
    {
      question: "Is identity verification required?",
      answer: "Yes, identity verification is required to comply with KYC/AML regulations. This helps us maintain a secure trading environment and prevents fraud."
    },
    {
      question: "How can I enhance the security of my account?",
      answer: "You can enhance your account security by enabling two-factor authentication, using a strong password, and regularly monitoring your account activity."
    },
    {
      question: "How can I make a deposit?",
      answer: "You can deposit funds using various methods including bank transfers, credit/debit cards, and cryptocurrency transfers. Navigate to the Wallet section and select 'Deposit' to get started."
    },
    {
      question: "What are the trading fees on Ripple?",
      answer: "Our trading fees are competitive and vary based on your trading volume. Maker fees start at 0.1% and taker fees at 0.2%. Higher trading volumes unlock reduced fees."
    }
  ];
  
  const handleSignUp = (e) => {
    e.preventDefault();
    navigate('/register', { state: { email } });
  };
  
  const handleSignUpForRewards = () => {
    navigate('/register');
  };
  
    return (
        <div className='home-1'>
      <HeroSection>
        <GlowingOrb />
        <GlowingOrb2 />
        <GlowingBottom />
        <Container>
          <HeroContainer>
            <HeroLeft>
              <HeroTitle>
                Welcome to the World's <br />
                Best Crypto Trading Exchange
              </HeroTitle>
              <HeroSubtitle>
                Buy, trade, and hold hundreds of cryptocurrencies on Ripple Exchange, with industry-leading security and best trading experience.
              </HeroSubtitle>
              
              <SignupBox>
                <StyledInput 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <PrimaryButton onClick={handleSignUp}>Sign Up Now</PrimaryButton>
              </SignupBox>
              
              <SecondaryButton $secondary onClick={handleSignUpForRewards}>Sign Up for Rewards →</SecondaryButton>
            </HeroLeft>
            
            <HeroRight>
              <FloatingCoins>
                <CoinIcon src={btcIcon} alt="Bitcoin" style={{ left: '10%', top: '20%', animation: 'float 6s ease-in-out infinite' }} />
                <CoinIcon src={ethIcon} alt="Ethereum" style={{ right: '15%', top: '30%', animation: 'float 8s ease-in-out infinite' }} />
                <CoinIcon src={tetIcon} alt="Tether" style={{ left: '20%', bottom: '25%', animation: 'float 7s ease-in-out infinite' }} />
                <CoinIcon src={bnbIcon} alt="Binance Coin" style={{ right: '25%', bottom: '15%', animation: 'float 9s ease-in-out infinite' }} />
              </FloatingCoins>
            </HeroRight>
          </HeroContainer>
          
          {/* Add Marquee Banner */}
          <MarqueeBanner>
            <MarqueeContent>
              {/* Duplicate items to ensure continuous scrolling */}
              {[...Array(2)].map((_, index) => (
                <React.Fragment key={index}>
                  <MarqueeItem>
                    <MarqueeIcon color="#F7931A">RACE</MarqueeIcon>
                    <MarqueeText>Race for Your Share of a 100,000 USDC Prize Pool!</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="#FF4949">ALERT</MarqueeIcon>
                    <MarqueeText>Security Alert: Beware of WhatsApp Phishing Groups</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="#3772FF">NEWS</MarqueeIcon>
                    <MarqueeText>Ripple Exchange to Support Cosmos (ATOM) Staking</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="#0ECB81">NEW</MarqueeIcon>
                    <MarqueeText>Introducing Zero-Fee Trading for BTC and ETH Pairs</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="#F7931A">BONUS</MarqueeIcon>
                    <MarqueeText>Get $10 USDT When You Complete KYC and Make Your First Deposit</MarqueeText>
                  </MarqueeItem>
                </React.Fragment>
              ))}
            </MarqueeContent>
          </MarqueeBanner>
          
          <CryptoImage src={btcIcon} style={{ top: '20%', right: '25%', width: '40px', height: '40px', animationDelay: '0.2s' }} />
          <CryptoImage src={ethIcon} style={{ top: '60%', right: '30%', width: '30px', height: '30px', animationDelay: '0.5s' }} />
          <CryptoImage src={bnbIcon} style={{ top: '40%', right: '15%', width: '35px', height: '35px', animationDelay: '0.8s' }} />
        </Container>
      </HeroSection>

      <Container>
                <CryptoPrices />
        
        <MarketSection>
          <SectionTitle>Catch Your Next Trading Opportunity</SectionTitle>
          <ViewMoreLink to="/markets">See More</ViewMoreLink>
          {/* Market data is already handled by CryptoPrices component */}
        </MarketSection>
        
        <GettingStartedSection>
          <Container>
            <SectionTitle $center>Get Started in 30 Seconds!</SectionTitle>
            <SectionText $center>Begin your cryptocurrency journey with these simple steps</SectionText>
            
            <StepsContainer>
              <StepCard $firstStep={true}>
                <StepNumber>1</StepNumber>
                <StepIcon>📝</StepIcon>
                <StepTitle>Create Account</StepTitle>
                <StepDescription>
                  Register for an account with your email and set a secure password to begin your crypto journey.
                </StepDescription>
                <Button>Sign Up Now</Button>
              </StepCard>
              
              <StepCard>
                <StepNumber>2</StepNumber>
                <StepIcon>💰</StepIcon>
                <StepTitle>Make Deposit</StepTitle>
                <StepDescription>
                  Fund your account with USD or directly deposit cryptocurrency to start trading.
                </StepDescription>
                <Button>Deposit Now</Button>
              </StepCard>
              
              <StepCard>
                <StepNumber>3</StepNumber>
                <StepIcon>📈</StepIcon>
                <StepTitle>Start Trading</StepTitle>
                <StepDescription>
                  Buy, sell, and trade cryptocurrency with ease on our secure and intuitive platform.
                </StepDescription>
                <Button>Start Now</Button>
              </StepCard>
            </StepsContainer>
          </Container>
        </GettingStartedSection>
        
        <ProductsSection>
          <SectionTitle>Discover More Products</SectionTitle>
          
          <ProductsGrid>
            <ProductCard>
              <ProductIcon src={tetIcon} />
              <ProductTitle>Ripple Card</ProductTitle>
              <ProductDescription>
                Spend USD & crypto with cashback and exclusive perks through our global card.
              </ProductDescription>
              <DetailsLink to="/card">Details</DetailsLink>
            </ProductCard>
            
            <ProductCard>
              <ProductIcon src={btcIcon} />
              <ProductTitle>Ripple Earn</ProductTitle>
              <ProductDescription>
                Grow and maximize your assets with flexible staking and yield offerings.
              </ProductDescription>
              <DetailsLink to="/earn">Details</DetailsLink>
            </ProductCard>
            
            <ProductCard>
              <ProductIcon src={ethIcon} />
              <ProductTitle>Copy Trading</ProductTitle>
              <ProductDescription>
                Automatically replicate the strategies of expert traders on our platform.
              </ProductDescription>
              <DetailsLink to="/copy-trading">Details</DetailsLink>
            </ProductCard>
            
            <ProductCard>
              <ProductIcon src={bnbIcon} />
              <ProductTitle>Trading Bot</ProductTitle>
              <ProductDescription>
                Automate your trading with custom strategies and smart algorithms.
              </ProductDescription>
              <DetailsLink to="/bot">Details</DetailsLink>
            </ProductCard>
          </ProductsGrid>
        </ProductsSection>
        
        <StatsSection>
          <StatItem>
            <StatValue>0</StatValue>
            <StatLabel>24h Trading Volume (USD)</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue>0</StatValue>
            <StatLabel>Cryptocurrencies Listed</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue>0</StatValue>
            <StatLabel>Registered Users</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue>0</StatValue>
            <StatLabel>Supported Countries</StatLabel>
          </StatItem>
        </StatsSection>
        
        <MobileAppSection>
          <AppContainer>
            <AppLeft>
              <SectionTitle>Trade Anytime, Anywhere.</SectionTitle>
              <SectionText>
                Our intuitive mobile app keeps you connected to the cryptocurrency market
                wherever you are, day or night.
              </SectionText>
              
              <AppButtons>
                <AppButton href="#" target="_blank">
                  <AppIcon>🍎</AppIcon>
                  <div>
                    <div style={{ fontSize: '12px' }}>Download on the</div>
                    <div style={{ fontWeight: '600' }}>App Store</div>
                  </div>
                </AppButton>
                
                <AppButton href="#" target="_blank">
                  <AppIcon>🤖</AppIcon>
                  <div>
                    <div style={{ fontSize: '12px' }}>Get it on</div>
                    <div style={{ fontWeight: '600' }}>Google Play</div>
                  </div>
                </AppButton>
              </AppButtons>
            </AppLeft>
            
            <AppRight>
              <QRCode src={qrCode} alt="QR Code" />
              <div style={{ color: '#fff', fontSize: '14px' }}>
                Scan & Download
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '5px' }}>
                iOS & Android
              </div>
            </AppRight>
          </AppContainer>
        </MobileAppSection>
        
        <FAQSection>
          <SectionTitle>FAQs</SectionTitle>
          
          {faqItems.map((item, index) => (
            <FAQItem key={index}>
              <FAQQuestion 
                $isOpen={openFAQ === index + 1}
                onClick={() => setOpenFAQ(openFAQ === index + 1 ? 0 : index + 1)}
              >
                {item.question}
              </FAQQuestion>
              <FAQAnswer $isOpen={openFAQ === index + 1}>
                {item.answer}
              </FAQAnswer>
            </FAQItem>
          ))}
        </FAQSection>
        
        <CTASection>
          <CTAContainer>
            <CTATitle>Embark on Your Crypto Journey Today!</CTATitle>
            <CTAButtons>
              <PrimaryButton onClick={() => navigate('/register')}>Sign Up Now</PrimaryButton>
            </CTAButtons>
          </CTAContainer>
        </CTASection>
      </Container>
        </div>
    );
}

export default HomeOne;