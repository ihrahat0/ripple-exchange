import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 20px;
`;

const Card = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  color: #fff;
  font-size: 24px;
  margin-bottom: 20px;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 30px;
`;

const EmailHighlight = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  color: #00ff9d;
  font-size: 18px;
`;

const Button = styled.button`
  background: ${props => props.$primary ? '#00ff9d' : 'transparent'};
  color: ${props => props.$primary ? '#000' : '#00ff9d'};
  border: ${props => props.$primary ? 'none' : '1px solid #00ff9d'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin: 10px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 157, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const VerificationScreen = ({ email }) => {
  const [resendDisabled, setResendDisabled] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  const handleResendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setResendDisabled(true);
        setCountdown(60);
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
    }
  };

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  return (
    <Container>
      <Card>
        <Title>📧 Verify Your Email</Title>
        <Description>
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </Description>
        
        <EmailHighlight>
          {email}
        </EmailHighlight>
        
        <Description>
          Didn't receive the email? Check your spam folder or click below to resend.
        </Description>

        <Button 
          onClick={handleResendVerification} 
          disabled={resendDisabled}
        >
          {resendDisabled 
            ? `Resend available in ${countdown}s` 
            : 'Resend Verification Email'}
        </Button>

        <Button $primary as={Link} to="/login">
          Go to Login
        </Button>
      </Card>
    </Container>
  );
};

export default VerificationScreen; 