import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Login from '../pages/Login';

const OtpContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background: #13131D;
  border-radius: 12px;
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
  gap: 1rem;
  margin-bottom: 2rem;
`;

const OtpInput = styled.input`
  width: 50px;
  height: 50px;
  text-align: center;
  font-size: 24px;
  border: 2px solid #5142FC;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  outline: none;

  &:focus {
    border-color: #8A7FFF;
    box-shadow: 0 0 0 2px rgba(81, 66, 252, 0.2);
  }
`;

const VerifyButton = styled.button`
  background: #5142FC;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-bottom: 1rem;

  &:hover {
    background: #4535E3;
  }

  &:disabled {
    background: #2A2A2A;
    cursor: not-allowed;
  }
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: #5142FC;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #4535E3;
  }
`;

const ErrorMessage = styled.p`
  color: #FF4A4A;
  margin-bottom: 1rem;
  font-size: 14px;
`;

function OtpVerification({ email, onVerify, onResendOtp }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

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

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setError('');
    onVerify(otpValue);
  };

  return (
    <OtpContainer>
      <Title>Verify your email</Title>
      <Subtitle>
        We've sent a verification code to {email}
      </Subtitle>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {/* <OtpInputContainer>
        {otp.map((digit, index) => (
          <OtpInput
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e.target, index)}
            onKeyDown={e => handleKeyDown(e, index)}
          />
        ))}
      </OtpInputContainer>
      <VerifyButton 
        onClick={handleVerify}
        disabled={otp.some(digit => !digit)}
      >
        Verify
      </VerifyButton> */}
      <VerifyButton  onClick={Login}>
        Log In
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
  onResendOtp: PropTypes.func.isRequired
};

export default OtpVerification; 