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
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3), 0 0 20px rgba(247, 147, 26, 0.1);
  }
  50% {
    box-shadow: 0 0 20px rgba(247, 147, 26, 0.5), 0 0 40px rgba(247, 147, 26, 0.2);
  }
  100% {
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3), 0 0 20px rgba(247, 147, 26, 0.1);
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
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.3);
  }
  50% {
    text-shadow: 0 0 10px rgba(247, 147, 26, 0.6);
  }
  100% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.3);
  }
`;

const borderGlow = keyframes`
  0% {
    border-color: rgba(247, 147, 26, 0.5);
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3), inset 0 0 5px rgba(247, 147, 26, 0.1);
  }
  50% {
    border-color: rgba(247, 147, 26, 0.8);
    box-shadow: 0 0 20px rgba(247, 147, 26, 0.5), inset 0 0 10px rgba(247, 147, 26, 0.2);
  }
  100% {
    border-color: rgba(247, 147, 26, 0.5);
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3), inset 0 0 5px rgba(247, 147, 26, 0.1);
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

// Add these keyframes animations
const shine = keyframes`
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

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
`;

// Styled components for the new design
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    padding: 0 15px;
  }
  
  @media (max-width: 480px) {
    padding: 0 10px;
  }
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
  
  @media (max-width: 992px) {
    width: 250px;
    height: 250px;
  }
  
  @media (max-width: 480px) {
    width: 200px;
    height: 200px;
  }
`;

const CoinIcon = styled.img`
  position: absolute;
  width: ${props => props.$size || '60px'};
  height: ${props => props.$size || '60px'};
  top: ${props => props.$top || '0'};
  left: ${props => props.$left || '0'};
  animation: ${float} ${props => props.$duration || '6s'} ease-in-out infinite;
  animation-delay: ${props => props.$delay || '0s'};
  filter: drop-shadow(0 0 10px rgba(247, 147, 26, 0.3));
  
  @media (max-width: 992px) {
    width: ${props => props.$mobileSize || props.$size || '50px'};
    height: ${props => props.$mobileSize || props.$size || '50px'};
  }
  
  @media (max-width: 480px) {
    width: ${props => props.$smallMobileSize || props.$mobileSize || props.$size || '40px'};
    height: ${props => props.$smallMobileSize || props.$mobileSize || props.$size || '40px'};
  }
`;

const HeroTitle = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(to right, #F7931A, #FFDB60);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textGlow} 3s infinite ease-in-out;
  
  @media (max-width: 992px) {
    font-size: 40px;
  }
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
  
  @media (max-width: 480px) {
    font-size: 28px;
    margin-bottom: 15px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 25px;
  }
  
  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 20px;
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
  gap: 10px;
  margin-bottom: 20px;
  max-width: 500px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
  }
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 14px 20px;
  border-radius: 8px;
  border: 1px solid rgba(247, 147, 26, 0.3);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: rgba(247, 147, 26, 0.6);
    box-shadow: 0 0 15px rgba(247, 147, 26, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 12px 16px;
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(90deg, #F7931A, #FFDB60);
  color: #000;
  font-weight: 600;
  padding: 14px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(247, 147, 26, 0.4);
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 12px 20px;
    width: 100%;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #F7931A;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid rgba(247, 147, 26, 0.4);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(247, 147, 26, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(247, 147, 26, 0.2);
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 16px;
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
    padding: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 15px;
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

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 60px 0;
  text-align: center;
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const StatItem = styled.div`
  padding: 20px;
`;

const StatValue = styled.div`
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
  
  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const MobileAppSection = styled.section`
  padding: 80px 0;
  position: relative;
  background: linear-gradient(180deg, rgba(19, 19, 27, 0.7) 0%, rgba(33, 33, 41, 0.7) 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(247, 147, 26, 0.1);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(247, 147, 26, 0.5), transparent);
    z-index: 1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 20%, rgba(247, 147, 26, 0.2) 0%, transparent 40%),
      radial-gradient(circle at 70% 80%, rgba(255, 219, 96, 0.15) 0%, transparent 40%);
    background-size: 200% 200%;
    z-index: -1;
    pointer-events: none;
  }
`;

const MobileAppTitle = styled.h2`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: left;
  background: linear-gradient(to right, #F7931A, #FFDB60);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textGlow} 3s infinite ease-in-out, ${shine} 6s linear infinite;
  background-size: 200% auto;
  
  @media (max-width: 768px) {
    font-size: 28px;
    text-align: center;
  }
  
  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const AppContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const AppLeft = styled.div`
  text-align: left;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const AppRight = styled.div`
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(circle at center, rgba(247, 147, 26, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(15px);
    animation: ${pulseGlow} 4s infinite ease-in-out;
  }
  
  .device-text {
    margin-top: 15px;
    color: #F7931A;
    font-weight: 500;
    text-shadow: 0 0 10px rgba(247, 147, 26, 0.4);
  }
`;

const AppDescription = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: left;
  max-width: 500px;
  
  @media (max-width: 768px) {
    text-align: center;
    margin: 0 auto 20px;
    font-size: 16px;
  }
`;

const AppButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 30px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
`;

const AppButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 30, 45, 0.7);
  border: 1px solid rgba(247, 147, 26, 0.3);
  border-radius: 12px;
  padding: 15px 25px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(247, 147, 26, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: skewX(-25deg);
    transition: all 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(247, 147, 26, 0.2);
    border-color: rgba(247, 147, 26, 0.5);
    
    &::before {
      left: 100%;
    }
  }
`;

const AppIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
  filter: drop-shadow(0 0 5px rgba(247, 147, 26, 0.5));
  animation: ${float} 3s ease-in-out infinite;
`;

const AppTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  
  .app-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .app-store {
    font-weight: 600;
    color: #F7931A;
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.3);
  }
`;

const DeviceImage = styled.div`
  width: 180px;
  height: 180px;
  margin: 0 auto;
  position: relative;
  
  &::before {
    content: '📱';
    font-size: 120px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 0 20px rgba(247, 147, 26, 0.5));
    animation: ${float} 4s ease-in-out infinite;
  }
`;

const FAQSection = styled.div`
  margin: 80px 0;
  padding: 40px 0;
  position: relative;
  border-radius: 20px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(247, 147, 26, 0.15) 0%, transparent 50%);
    z-index: -1;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 70% 80%, rgba(247, 147, 26, 0.1) 0%, transparent 50%);
    z-index: -1;
    pointer-events: none;
  }
`;

const FAQContainer = styled.div`
  backdrop-filter: blur(10px);
  background: linear-gradient(180deg, rgba(19, 19, 27, 0.7) 0%, rgba(33, 33, 41, 0.7) 100%);
  border-radius: 16px;
  overflow: hidden;
  padding: 20px;
  border: 1px solid rgba(247, 147, 26, 0.1);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(247, 147, 26, 0.5), transparent);
    z-index: 1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 10% 20%, rgba(247, 147, 26, 0.2) 0%, transparent 30%),
      radial-gradient(circle at 80% 60%, rgba(247, 147, 26, 0.15) 0%, transparent 30%);
    background-size: 200% 200%;
    z-index: -1;
    pointer-events: none;
  }
`;

const FAQHeader = styled.h2`
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 30px;
  background: linear-gradient(to right, #F7931A, #FFDB60);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textGlow} 3s infinite ease-in-out, ${shine} 6s linear infinite;
  background-size: 200% auto;
`;

const FAQItem = styled.div`
  margin: 0;
  padding: 5px 20px;
  border-radius: 15px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  background: ${props => props.$isOpen ? 'rgba(247, 147, 26, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$isOpen ? 'rgba(247, 147, 26, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  
  &:hover {
    border-color: rgba(247, 147, 26, 0.3);
    background: rgba(247, 147, 26, 0.05);
    box-shadow: ${props => props.$isOpen ? '0 0 20px rgba(247, 147, 26, 0.3)' : '0 0 15px rgba(247, 147, 26, 0.15)'};
  }
  
  ${props => props.$isOpen && css`
    animation: ${borderGlow} 3s infinite ease-in-out;
  `}
`;

const FAQQuestion = styled.div`
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  padding: 20px 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  
  ${props => props.$isOpen && css`
    background: linear-gradient(to right, #F7931A, #FFDB60);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  `}
  
  &:hover {
    color: #F7931A;
    text-shadow: 0 0 10px rgba(247, 147, 26, 0.6);
  }
  
  &::after {
    content: ${props => props.$isOpen ? '"-"' : '"+"'};
    font-size: 22px;
    color: #F7931A;
    text-shadow: 0 0 10px rgba(247, 147, 26, 0.4);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    transition: all 0.3s ease;
    
    ${props => props.$isOpen && css`
      background: linear-gradient(to right, #F7931A, #FFDB60);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: ${float} 2s infinite ease-in-out;
    `}
  }
`;

const FAQAnswer = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.6;
  padding: ${props => props.$isOpen ? '0 0 20px' : '0'};
  max-height: ${props => props.$isOpen ? '1000px' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  overflow: hidden;
  transition: all 0.5s ease;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 100%, rgba(247, 147, 26, 0.1) 0%, transparent 70%);
    z-index: -1;
    pointer-events: none;
    opacity: ${props => props.$isOpen ? '1' : '0'};
    transition: opacity 0.5s ease;
  }
  
  p {
    margin-bottom: 10px;
  }
  
  a {
    color: #F7931A;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-shadow: 0 0 8px rgba(247, 147, 26, 0.6);
    }
  }
`;

const CTASection = styled.section`
  padding: 80px 0;
  background: linear-gradient(180deg, rgba(19, 19, 27, 0.7) 0%, rgba(33, 33, 41, 0.7) 100%);
  text-align: center;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  margin: 80px 0;
  border: 1px solid rgba(247, 147, 26, 0.1);
  
  @media (max-width: 768px) {
    padding: 60px 0;
    margin: 60px 0;
  }
  
  @media (max-width: 480px) {
    padding: 40px 0;
    margin: 40px 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(247, 147, 26, 0.5), transparent);
    z-index: 1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 10% 20%, rgba(247, 147, 26, 0.2) 0%, transparent 30%),
      radial-gradient(circle at 80% 60%, rgba(247, 147, 26, 0.15) 0%, transparent 30%);
    background-size: 200% 200%;
    z-index: -1;
    pointer-events: none;
  }
`;

const CTAContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const CTATitle = styled.h2`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(to right, #F7931A, #FFDB60);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 30px;
  }
  
  @media (max-width: 480px) {
    font-size: 24px;
    margin-bottom: 15px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

const CTAPrimaryButton = styled.button`
  background: linear-gradient(90deg, #F7931A, #FFDB60);
  color: #13131D;
  border: none;
  border-radius: 30px;
  padding: 15px 35px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(247, 147, 26, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: all 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(247, 147, 26, 0.5);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-2px);
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
  width: 300px;
  height: 300px;
  border-radius: 50%;
  top: 10%;
  left: 5%;
  background: radial-gradient(circle, rgba(247, 147, 26, 0.3) 0%, rgba(247, 147, 26, 0.1) 30%, transparent 70%);
  filter: blur(40px);
  opacity: 0.6;
  z-index: 0;
  animation: ${pulseGlow} 8s infinite ease-in-out;
  
  @media (max-width: 768px) {
    width: 200px;
    height: 200px;
    top: 5%;
    left: -10%;
  }
  
  @media (max-width: 480px) {
    width: 150px;
    height: 150px;
  }
`;

const GlowingOrb2 = styled.div`
  position: absolute;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  top: 20%;
  right: 10%;
  background: radial-gradient(circle, rgba(247, 147, 26, 0.2) 0%, rgba(247, 147, 26, 0.05) 30%, transparent 70%);
  filter: blur(30px);
  opacity: 0.5;
  z-index: 0;
  animation: ${pulseGlow} 10s infinite ease-in-out reverse;
  
  @media (max-width: 768px) {
    width: 180px;
    height: 180px;
    right: -5%;
  }
  
  @media (max-width: 480px) {
    width: 120px;
    height: 120px;
  }
`;

const GlowingBottom = styled.div`
  position: absolute;
  width: 100%;
  height: 200px;
  bottom: 0;
  left: 0;
  right: 0;
  background: radial-gradient(ellipse at center, rgba(247, 147, 26, 0.2) 0%, transparent 70%);
  filter: blur(40px);
  opacity: 0.3;
  z-index: 0;
  
  @media (max-width: 768px) {
    height: 120px;
  }
  
  @media (max-width: 480px) {
    height: 80px;
  }
`;

// Add the Button styled component definition
const Button = styled.button`
  background: linear-gradient(90deg, #F7931A, #FFDB60);
  color: #000;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(247, 147, 26, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 13px;
  }
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
            
            {/* Add Marquee Banner */}
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
                    <MarqueeIcon color="green">Fast</MarqueeIcon>
                    <MarqueeText>Longs & Shorts on 1 click</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="green">One Solution</MarqueeIcon>
                    <MarqueeText>One platform One solution on 1 Click</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="green">No Fees</MarqueeIcon>
                    <MarqueeText>NO Fee NO interest on Perpetuals</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="green">Get updated</MarqueeIcon>
                    <MarqueeText>Get updated with the latest pairs and memes</MarqueeText>
                  </MarqueeItem>
                  <MarqueeItem>
                    <MarqueeIcon color="green">40x Leverage</MarqueeIcon>
                    <MarqueeText>Upto 40x Leverage on Perpetuals</MarqueeText>
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
                <Button onClick={() => navigate('/register')}>Sign Up Now</Button>
              </StepCard>
              
              <StepCard>
                <StepNumber>2</StepNumber>
                <StepIcon>💰</StepIcon>
                <StepTitle>Make Deposit</StepTitle>
                <StepDescription>
                  Fund your account with USD or directly deposit cryptocurrency to start trading.
                </StepDescription>
                <Button onClick={() => navigate('/deposit')}>Deposit Now</Button>
              </StepCard>
              
              <StepCard>
                <StepNumber>3</StepNumber>
                <StepIcon>📈</StepIcon>
                <StepTitle>Start Trading</StepTitle>
                <StepDescription>
                  Buy, sell, and trade cryptocurrency with ease on our secure and intuitive platform.
                </StepDescription>
                <Button onClick={() => navigate('/trading')}>Start Now</Button>
              </StepCard>
            </StepsContainer>
          </Container>
        </GettingStartedSection>
        
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
              <MobileAppTitle>Trade Anytime, Anywhere.</MobileAppTitle>
              <AppDescription>
                Our intuitive mobile app keeps you connected to the cryptocurrency market
                wherever you are, day or night.
              </AppDescription>
              
              <AppButtons>
                <AppButton href="#" target="_blank">
                  <AppIcon>🍎</AppIcon>
                  <AppTextContainer>
                    <span className="app-label">Coming Soon on</span>
                    <span className="app-store">App Store</span>
                  </AppTextContainer>
                </AppButton>
                
                <AppButton href="#" target="_blank">
                  <AppIcon>🤖</AppIcon>
                  <AppTextContainer>
                    <span className="app-label">Coming Soon on</span>
                    <span className="app-store">Google Play</span>
                  </AppTextContainer>
                </AppButton>
              </AppButtons>
            </AppLeft>
            
            <AppRight>
              <DeviceImage />
              <div className="device-text">iOS & Android</div>
            </AppRight>
          </AppContainer>
        </MobileAppSection>
        
        <FAQSection>
          <FAQHeader>Frequently Asked Questions</FAQHeader>
          <FAQContainer>
            {faqItems.map((item, index) => (
              <FAQItem key={index} $isOpen={openFAQ === index + 1}>
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
          </FAQContainer>
        </FAQSection>
        
        <CTASection>
          <CTAContainer>
            <CTATitle>Embark on Your Crypto Journey Today!</CTATitle>
            <CTAButtons>
              <CTAPrimaryButton onClick={() => navigate('/register')}>Sign Up Now</CTAPrimaryButton>
            </CTAButtons>
          </CTAContainer>
        </CTASection>
      </Container>
        </div>
    );
}

export default HomeOne;