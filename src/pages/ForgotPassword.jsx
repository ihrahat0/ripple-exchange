import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import styled from 'styled-components';
import PageTitle from '../components/pagetitle';

const Container = styled.div`
  max-width: 500px;
  margin: 50px auto;
  padding: 30px;
  background: var(--bg1);
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--text);
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    color: var(--text);
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 12px 15px;
    background: var(--bg2);
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--text);
    font-size: 16px;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
`;

const Button = styled.button`
  padding: 14px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: var(--primary-dark);
  }
  
  &:disabled {
    background: var(--line);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #F6465D;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(246, 70, 93, 0.1);
  border-radius: 5px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  color: #0ECB81;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(14, 203, 129, 0.1);
  border-radius: 5px;
  font-size: 14px;
`;

const BottomLinks = styled.div`
  margin-top: 20px;
  text-align: center;
  
  a {
    color: var(--primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      // Generate a verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Import email service dynamically
      const { sendPasswordResetEmail } = await import('../utils/emailService');
      
      // Send the reset email
      const emailResult = await sendPasswordResetEmail(email, code);
      
      if (emailResult.success) {
        setMessage('Password reset instructions have been sent to your email');
      } else {
        throw new Error(emailResult.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Failed to reset password: ' + err.message);
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <PageTitle title="Forgot Password" />
      <Container>
        <Title>Reset Your Password</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {message && <SuccessMessage>{message}</SuccessMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Reset Password'}
          </Button>
        </Form>
        
        <BottomLinks>
          <p>
            Remember your password? <Link to="/login">Log In</Link>
          </p>
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </BottomLinks>
      </Container>
    </>
  );
}

export default ForgotPassword; 