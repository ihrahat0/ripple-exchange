import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const OtpContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background: #13131D;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h3`
  color: #fff;
  margin-bottom: 1rem;
  font-size: 24px;
`;

const Subtitle = styled.p`
  color: #7A7A7A;
  margin-bottom: 2rem;
  font-size: 16px;
`;

const OtpInputContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

const OtpInput = styled.input`
  width: 50px;
  height: 50px;
  text-align: center;
  font-size: 24px;
  border: 2px solid #5142FC;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  outline: none;

  &:focus {
    border-color: #8A7FFF;
    box-shadow: 0 0 0 2px rgba(81, 66, 252, 0.2);
  }
`;

const VerifyButton = styled.button`
  background: linear-gradient(135deg, #4A6BF3, #2a3c82);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(74, 107, 243, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(74, 107, 243, 0.4);
  }

  &:disabled {
    background: rgba(74, 107, 243, 0.3);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: #4A6BF3;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;

  &:hover {
    color: #8A7FFF;
  }
`;

const ErrorMessage = styled.p`
  color: #F6465D;
  margin-bottom: 1rem;
  font-size: 14px;
  background: rgba(246, 70, 93, 0.1);
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #F6465D;
`;

const SuccessMessage = styled.p`
  color: #0ECB81;
  margin-bottom: 1rem;
  font-size: 14px;
  background: rgba(14, 203, 129, 0.1);
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #0ECB81;
`;

const EmailHighlight = styled.div`
  background: rgba(74, 107, 243, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  color: #4A6BF3;
  font-size: 18px;
  font-weight: 500;
`;

function OtpVerification({ email, onVerify, onResendOtp, error, success }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Process the success message - in development, allow displaying the code
  const displaySuccess = success || '';

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;
    
    const otpArray = pastedData.split('').slice(0, 6);
    const newOtp = [...otp];
    
    otpArray.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
        if (inputRefs.current[index]) {
          inputRefs.current[index].value = digit;
        }
      }
    });
    
    setOtp(newOtp);
    
    // Focus on the next empty input or the last input
    const focusIndex = Math.min(otpArray.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setLocalError('Please enter all 6 digits');
      return;
    }
    setLocalError('');
    onVerify(otpValue);
  };

  return (
    <OtpContainer>
      <Title>Verify your email</Title>
      <Subtitle>
        We've sent a verification code to:
      </Subtitle>
      
      <EmailHighlight>
        {email}
      </EmailHighlight>
      
      {(error || localError) && <ErrorMessage>{error || localError}</ErrorMessage>}
      {displaySuccess && <SuccessMessage>{displaySuccess}</SuccessMessage>}
      
      <OtpInputContainer onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <OtpInput
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e.target, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            autoComplete="off"
          />
        ))}
      </OtpInputContainer>
      
      <VerifyButton 
        onClick={handleVerify}
        disabled={otp.some(digit => !digit)}
      >
        Verify Account
      </VerifyButton>
      
      <ResendLink onClick={onResendOtp}>
        Didn't receive code? Send again
      </ResendLink>
    </OtpContainer>
  );
}

OtpVerification.propTypes = {
  email: PropTypes.string.isRequired,
  onVerify: PropTypes.func.isRequired,
  onResendOtp: PropTypes.func.isRequired,
  error: PropTypes.string,
  success: PropTypes.string
};

export default OtpVerification; 