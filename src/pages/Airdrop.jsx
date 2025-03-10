import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import ripplexLogo from '../assets/images/logo/logo.png'; // Make sure this path is correct

// Animations
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 167, 38, 0.6); }
  50% { box-shadow: 0 0 20px rgba(255, 167, 38, 0.9); }
  100% { box-shadow: 0 0 5px rgba(255, 167, 38, 0.6); }
`;

const slideInAnimation = keyframes`
  from { transform: translateX(50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const fadeInAnimation = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-30px); }
  60% { transform: translateY(-15px); }
`;

const confettiAnimation = keyframes`
  0% { transform: translateY(0) rotate(0); opacity: 1; }
  100% { transform: translateY(1000px) rotate(720deg); opacity: 0; }
`;

// Styled Components
const AirdropContainer = styled.div`
  min-height: 80vh;
  padding: 4rem 2rem;
  background-color: #0f1012;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  color: white;
  position: relative;
  overflow: hidden;
`;

const AirdropHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  max-width: 800px;
`;

const AirdropTitle = styled.h1`
  font-size: 3rem;
  background: linear-gradient(90deg, #FF9100, #FFC400);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  font-weight: 700;
`;

const AirdropSubtitle = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  opacity: 0.8;
  margin-bottom: 2rem;
`;

const TokenImage = styled.img`
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  display: block;
  animation: ${floatAnimation} 6s ease-in-out infinite;
`;

const ClaimButton = styled.button`
  background: linear-gradient(90deg, #FF9100, #FFC400);
  color: #000;
  font-weight: bold;
  font-size: 1.2rem;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  animation: ${pulseAnimation} 2s infinite;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 167, 38, 0.8);
  }
  
  &:disabled {
    background: #555;
    cursor: not-allowed;
    animation: none;
  }
`;

const TaskCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  margin: 1rem 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  animation: ${slideInAnimation} 0.5s ease-out forwards;
  opacity: 0;
  animation-delay: ${props => props.delay || '0s'};
  animation-fill-mode: forwards;
`;

const TaskTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  
  i {
    margin-right: 10px;
    color: #FFA726;
  }
`;

const TaskInput = styled.input`
  width: 100%;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  margin-top: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #FFA726;
    box-shadow: 0 0 0 2px rgba(255, 167, 38, 0.3);
  }
`;

const TaskButton = styled.button`
  background: linear-gradient(90deg, #FF9100, #FFC400);
  color: #000;
  font-weight: bold;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    margin-right: 8px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 167, 38, 0.4);
  }
`;

const SocialButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.twitter ? '#1DA1F2' : '#0088cc'};
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: bold;
  text-decoration: none;
  margin: 0.5rem 1rem 0.5rem 0;
  transition: all 0.3s ease;
  
  i {
    margin-right: 8px;
    font-size: 1.2rem;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin: 2rem 0;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    height: 100%;
    width: ${props => props.progress || '0%'};
    background: linear-gradient(90deg, #FF9100, #FFC400);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
`;

const Confetti = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: ${props => props.color};
  top: -10px;
  left: ${props => props.left};
  opacity: 0;
  animation: ${confettiAnimation} ${props => props.duration} linear forwards;
  animation-delay: ${props => props.delay};
`;

const CongratsContainer = styled.div`
  text-align: center;
  animation: ${fadeInAnimation} 1s ease-out;
  max-width: 600px;
`;

const CongratsTitle = styled.h2`
  font-size: 3.5rem;
  background: linear-gradient(90deg, #FFC107, #FF9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  animation: ${bounceAnimation} 1.5s;
`;

const TokenGlow = styled.div`
  width: 150px;
  height: 150px;
  margin: 2rem auto;
  background: url(${ripplexLogo}) no-repeat center/contain;
  animation: ${glowAnimation} 3s infinite, ${floatAnimation} 6s ease-in-out infinite;
  border-radius: 50%;
`;

const CongratsText = styled.p`
  font-size: 1.4rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const AirdropCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Airdrop = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [hasFollowed, setHasFollowed] = useState({
    twitter: false,
    telegram: false
  });
  const confettiColorsRef = useRef([
    '#FFC107', '#FF9800', '#FFEB3B', '#CDDC39', '#4CAF50', '#00BCD4', '#2196F3', '#3F51B5', '#9C27B0'
  ]);
  const [confetties, setConfetties] = useState([]);

  useEffect(() => {
    // Check if user has already completed the airdrop
    const checkAirdropStatus = async () => {
      if (!currentUser) return;
      
      try {
        const airdropRef = doc(db, 'airdrops', currentUser.uid);
        const airdropSnap = await getDoc(airdropRef);
        
        if (airdropSnap.exists()) {
          const airdropData = airdropSnap.data();
          
          if (airdropData.completed) {
            setIsCompleted(true);
          } else {
            // Resume from the saved state
            setCurrentStep(airdropData.step || 0);
            setTwitterUsername(airdropData.twitter || '');
            setTelegramUsername(airdropData.telegram || '');
            setHasFollowed({
              twitter: airdropData.hasFollowedTwitter || false,
              telegram: airdropData.hasFollowedTelegram || false
            });
            
            if (airdropData.started) {
              setHasStarted(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking airdrop status:', error);
      }
    };
    
    checkAirdropStatus();
  }, [currentUser]);

  const handleStartAirdrop = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setHasStarted(true);
    
    try {
      // Create or update airdrop document
      const airdropRef = doc(db, 'airdrops', currentUser.uid);
      await setDoc(airdropRef, {
        userId: currentUser.uid,
        email: currentUser.email,
        started: true,
        step: 0,
        startedAt: serverTimestamp(),
        completed: false
      }, { merge: true });
    } catch (error) {
      console.error('Error starting airdrop:', error);
      toast.error('Failed to start airdrop. Please try again.');
    }
  };

  const handleTwitterFollow = async () => {
    setHasFollowed(prev => ({ ...prev, twitter: true }));
    
    try {
      const airdropRef = doc(db, 'airdrops', currentUser.uid);
      await updateDoc(airdropRef, {
        hasFollowedTwitter: true
      });
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleTelegramFollow = async () => {
    setHasFollowed(prev => ({ ...prev, telegram: true }));
    
    try {
      const airdropRef = doc(db, 'airdrops', currentUser.uid);
      await updateDoc(airdropRef, {
        hasFollowedTelegram: true
      });
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleTwitterSubmit = async (e) => {
    e.preventDefault();
    if (!twitterUsername.trim()) {
      toast.error('Please enter your Twitter username');
      return;
    }
    
    setCurrentStep(1);
    
    try {
      const airdropRef = doc(db, 'airdrops', currentUser.uid);
      await updateDoc(airdropRef, {
        twitter: twitterUsername,
        step: 1,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving Twitter username:', error);
      toast.error('Failed to save your Twitter username');
    }
  };

  const handleTelegramSubmit = async (e) => {
    e.preventDefault();
    if (!telegramUsername.trim()) {
      toast.error('Please enter your Telegram username');
      return;
    }
    
    setLoading(true);
    
    try {
      // Update airdrop document
      const airdropRef = doc(db, 'airdrops', currentUser.uid);
      await updateDoc(airdropRef, {
        telegram: telegramUsername,
        step: 2,
        completed: true,
        completedAt: serverTimestamp()
      });
      
      // Add Ripplex token to user's balance
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const balances = userData.balances || {};
        
        // Add 100 Ripplex tokens to the user's balance
        await updateDoc(userRef, {
          'balances.RIPPLEX': (balances.RIPPLEX || 0) + 100
        });
        
        // Generate confetti elements
        generateConfetti();
        
        setIsCompleted(true);
        setCurrentStep(2);
      } else {
        throw new Error('User document not found');
      }
    } catch (error) {
      console.error('Error completing airdrop:', error);
      toast.error('Failed to complete airdrop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateConfetti = () => {
    const tempConfetti = [];
    const colors = confettiColorsRef.current;
    
    // Create 100 confetti elements
    for (let i = 0; i < 100; i++) {
      const left = `${Math.random() * 100}%`;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = `${Math.random() * 5 + 2}s`;
      const delay = `${Math.random() * 2}s`;
      
      tempConfetti.push({ left, color, duration, delay });
    }
    
    setConfetties(tempConfetti);
  };

  const renderConfetti = () => {
    return confetties.map((conf, index) => (
      <Confetti
        key={index}
        left={conf.left}
        color={conf.color}
        duration={conf.duration}
        delay={conf.delay}
      />
    ));
  };

  const renderTaskCard = () => {
    if (currentStep === 0) {
      return (
        <TaskCard delay="0.2s">
          <TaskTitle>
            <i className="fab fa-twitter"></i>
            Follow us on Twitter
          </TaskTitle>
          <p>Follow our official Twitter account to stay updated on the latest Ripplex news and updates.</p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <SocialButton 
              href="https://twitter.com/RippleExchange" 
              target="_blank" 
              rel="noopener noreferrer"
              twitter
              onClick={handleTwitterFollow}
            >
              <i className="fab fa-twitter"></i>
              Follow @RippleExchange
            </SocialButton>
            
            {hasFollowed.twitter && (
              <form onSubmit={handleTwitterSubmit} style={{ marginTop: '1.5rem' }}>
                <label htmlFor="twitter-username">Enter your Twitter username</label>
                <TaskInput
                  id="twitter-username"
                  type="text"
                  placeholder="@YourTwitterHandle"
                  value={twitterUsername}
                  onChange={e => setTwitterUsername(e.target.value)}
                  required
                />
                <TaskButton type="submit">
                  <i className="fas fa-arrow-right"></i>
                  Continue
                </TaskButton>
              </form>
            )}
          </div>
        </TaskCard>
      );
    } else if (currentStep === 1) {
      return (
        <TaskCard delay="0.3s">
          <TaskTitle>
            <i className="fab fa-telegram-plane"></i>
            Join our Telegram Group
          </TaskTitle>
          <p>Join our vibrant community on Telegram to chat with other users and get instant support.</p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <SocialButton 
              href="https://t.me/RippleExchangeOfficial" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleTelegramFollow}
            >
              <i className="fab fa-telegram-plane"></i>
              Join Telegram Group
            </SocialButton>
            
            {hasFollowed.telegram && (
              <form onSubmit={handleTelegramSubmit} style={{ marginTop: '1.5rem' }}>
                <label htmlFor="telegram-username">Enter your Telegram username</label>
                <TaskInput
                  id="telegram-username"
                  type="text"
                  placeholder="@YourTelegramHandle"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  required
                />
                <TaskButton type="submit" disabled={loading}>
                  {loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-check"></i>
                  )}
                  {loading ? 'Processing...' : 'Claim Airdrop'}
                </TaskButton>
              </form>
            )}
          </div>
        </TaskCard>
      );
    }
    
    return null;
  };

  const renderProgressBar = () => {
    let progress = '0%';
    
    if (currentStep === 0 && hasFollowed.twitter) {
      progress = '25%';
    } else if (currentStep === 1 && !hasFollowed.telegram) {
      progress = '50%';
    } else if (currentStep === 1 && hasFollowed.telegram) {
      progress = '75%';
    } else if (currentStep === 2) {
      progress = '100%';
    }
    
    return <ProgressBar progress={progress} />;
  };

  const renderCongratulations = () => {
    return (
      <CongratsContainer>
        {renderConfetti()}
        <CongratsTitle>Congratulations! 🎉</CongratsTitle>
        <TokenGlow />
        <CongratsText>
          You've successfully claimed 100 Ripplex tokens worth $100! The tokens have been added to your wallet.
        </CongratsText>
        <ClaimButton onClick={() => navigate('/user-profile')}>
          Go to My Wallet
        </ClaimButton>
      </CongratsContainer>
    );
  };

  return (
    <AirdropContainer>
      {!isCompleted ? (
        <>
          <AirdropHeader>
            <TokenImage src={ripplexLogo} alt="Ripplex Token" />
            <AirdropTitle>Ripplex Social Airdrop</AirdropTitle>
            <AirdropSubtitle>
              Follow our social media channels and earn 100 Ripplex tokens worth $100! Complete simple tasks to claim your reward.
            </AirdropSubtitle>
            
            {!hasStarted ? (
              <ClaimButton onClick={handleStartAirdrop}>
                Claim 100 Ripplex
              </ClaimButton>
            ) : (
              renderProgressBar()
            )}
          </AirdropHeader>
          
          {hasStarted && renderTaskCard()}
        </>
      ) : (
        renderCongratulations()
      )}
    </AirdropContainer>
  );
};

export default Airdrop; 