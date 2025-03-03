import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Sale01 from '../components/sale/Sale01';
import { auth, db, googleProvider } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    sendEmailVerification,
    updateProfile,
    sendSignInLinkToEmail 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PageTitle from '../components/pagetitle';
import OtpVerification from '../components/OtpVerification';
import {Link} from 'react-router-dom';
import { DEFAULT_COINS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { generateUserWallet } from '../services/walletService';
import { referralService } from '../services/referralService';
import styled from 'styled-components';
import VerificationScreen from '../components/VerificationScreen';

Register.propTypes = {
    
};

function Register(props) {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('South Korea (+82)');
    const [countryCode, setCountryCode] = useState('+1');
    const [error, setError] = useState('');
    const [uidCode, setUidCode] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [tempUserData, setTempUserData] = useState(null);
    const [verificationId, setVerificationId] = useState('');
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [walletInfo, setWalletInfo] = useState(null);
    const [mnemonic, setMnemonic] = useState('');
    const [showMnemonicModal, setShowMnemonicModal] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [sentVerificationCode, setSentVerificationCode] = useState('');
    const [success, setSuccess] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);

    // Check for referral code in URL params when component mounts
    React.useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const refCode = queryParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            console.log('Referral code found in URL:', refCode);
        }
    }, [location]);

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const storeUserData = async (user, userData) => {
        try {
            // Initialize balances with all default coins
            const initialBalances = {};
            
            // Use DEFAULT_COINS to populate all coin balances
            Object.keys(DEFAULT_COINS).forEach(coin => {
                initialBalances[coin] = DEFAULT_COINS[coin].initialBalance || 0;
            });
            
            // Create user document with balances and bonus included
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                createdAt: serverTimestamp(),
                role: 'user',
                // Include balances directly in the user document
                balances: initialBalances,
                // Add a bonus that can only be used for liquidation protection
                bonusAccount: {
                    amount: 100, // $100 bonus for liquidation protection
                    currency: 'USDT',
                    isActive: true,
                    canWithdraw: false,
                    canTrade: false,
                    purpose: 'liquidation_protection',
                    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                    description: 'Welcome bonus - protects your deposits from liquidation'
                },
                ...userData
            });

            // Generate wallet for the user
            const walletData = await generateUserWallet(user.uid);

            // If a referral code was provided, process the referral
            if (referralCode) {
                await referralService.registerReferral(referralCode, user.uid);
            }
            
            return walletData;
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Generate OTP
            const otp = generateOTP();
            
            // Import email service dynamically
            const { generateVerificationCode, sendRegistrationVerificationEmail } = await import('../utils/emailService');
            
            // Send the verification code via email with registration template
            const emailResult = await sendRegistrationVerificationEmail(email, otp);
            
            // Store the OTP temporarily for verification
            setSentVerificationCode(otp);
            
            // Set success message
            if (emailResult.message && emailResult.message.includes('unavailable')) {
                // Never display verification code, even in development mode
                setSuccess('Account created! Please check your email for verification code.');
            } else {
                setSuccess('Account created! Please enter the verification code sent to your email.');
            }
            
            // Store additional user data and generate wallet
            const walletData = await storeUserData(user, {
                displayName: nickname || email.split('@')[0],
                emailVerified: false,
                otp: otp // Store OTP in user data
            });

            // Show mnemonic to user if available
            if (walletData?.mnemonic) {
                setMnemonic(walletData.mnemonic);
                setShowMnemonicModal(true);
            }

            // Prepare user data for temp storage
            const userData = {
                email,
                nickname: nickname || email.split('@')[0],
                otp
            };
            setTempUserData(userData);
            
            // Show OTP verification screen
            setShowOtpVerification(true);
            setRegisteredEmail(email);
            
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.message || 'Failed to create an account');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmMnemonic = () => {
        setShowMnemonic(false);
        setShowMnemonicModal(false);
        
        // Continue to the verification screen or user profile
        if (showOtpVerification) {
            // If we're already showing OTP verification, stay there
            return;
        } else if (auth.currentUser?.emailVerified || isGoogleUser) {
            // Google users or already verified emails can go straight to profile
            navigate('/user-profile');
        } else {
            // Show OTP verification for email users
            setShowOtpVerification(true);
        }
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        try {
            setLoading(true);
            setError('');

            // First create the user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update the user's profile
            await updateProfile(user, {
                displayName: nickname
            });

            // Import email service dynamically
            const { generateVerificationCode, sendRegistrationVerificationEmail } = await import('../utils/emailService');
            
            // Generate a 6-digit code
            const otp = generateVerificationCode();
            setSentVerificationCode(otp);
            
            // Send the registration verification code via email
            await sendRegistrationVerificationEmail(email, otp);

            // Prepare user data
            const userData = {
                email,
                nickname,
                phone: `${countryCode}${phone}`,
                country,
                uidCode,
                otp,
                authProvider: 'email'
            };

            // Store user data in Firestore and wait for it to complete
            await storeUserData(user, userData);
            
            // Store temp data for verification
            setTempUserData(userData);

            // Show OTP verification screen
            setShowOtpVerification(true);
            setRegisteredEmail(email);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async (otpInput) => {
        if (!sentVerificationCode && !tempUserData?.otp) {
            setError('Verification code not found. Please request a new code.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Check against stored code (either from tempUserData or sentVerificationCode)
            const correctOtp = tempUserData?.otp || sentVerificationCode;
            
            if (otpInput === correctOtp) {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error('No user found. Please try again.');
                }

                // Update user profile if needed
                if (tempUserData?.nickname && tempUserData.nickname !== user.displayName) {
                    await updateProfile(user, {
                        displayName: tempUserData.nickname
                    });
                }

                // Update Firebase auth emailVerified flag
                // Note: In production, you can't directly update this flag, 
                // but for this specific app we're tracking it in Firestore as well
                
                // Update user document to mark as verified
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    emailVerified: true
                });

                setSuccess('Account verified successfully! You can now log in.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError('Invalid verification code. Please try again.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (!registeredEmail && !tempUserData?.email) {
                setError('Email not found');
                return;
            }
            
            // Use email from either registeredEmail or tempUserData
            const emailToUse = registeredEmail || tempUserData?.email;
            
            // Import email service dynamically
            const { generateVerificationCode, sendRegistrationVerificationEmail } = await import('../utils/emailService');
            
            // Generate a new 6-digit code
            const newOtp = generateVerificationCode();
            setSentVerificationCode(newOtp);
            
            // Update temp user data
            if (tempUserData) {
                setTempUserData({ ...tempUserData, otp: newOtp });
            }
            
            // Send the registration verification code via email
            const emailResult = await sendRegistrationVerificationEmail(emailToUse, newOtp);
            
            // Handle response - never display the code
            if (emailResult.message && emailResult.message.includes('unavailable')) {
                // Never display verification code, even in development mode
                setSuccess('New verification code sent to your email.');
            } else {
                setSuccess('New verification code sent to your email.');
            }
            
            // Keep success message visible longer for testing
            setTimeout(() => setSuccess(''), 30000);
            
        } catch (error) {
            console.error('Error sending verification code:', error);
            setError('Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setLoading(true);
            setError('');
            
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // For Google sign-ups, we skip OTP verification since Google already verifies emails
            // Prepare user data for Google sign-up
            const userData = {
                email: user.email,
                displayName: user.displayName,
                nickname: user.displayName,
                phone: user.phoneNumber || '',
                country: country,
                uidCode: '',
                authProvider: 'google',
                emailVerified: true // Mark as verified since Google verifies emails
            };

            // Store user data and wait for completion
            await storeUserData(user, userData);

            // Set success message
            setSuccess('Google sign-up successful! Redirecting to your profile...');
            
            // Navigate after a short delay
            setTimeout(() => {
                navigate('/user-profile');
            }, 1500);

            setIsGoogleUser(true);
        } catch (err) {
            console.error('Google signup error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneSignup = async (e) => {
        e.preventDefault();
        setError('Phone authentication requires additional Firebase setup.');
    };

    if (showMnemonic && walletInfo) {
        return (
            <Container>
                <Card>
                    <Title>🔐 Save Your Recovery Phrase</Title>
                    <Description>
                        This is your wallet's recovery phrase. Write it down and store it in a safe place.
                        You will need this to recover your wallet if you lose access.
                    </Description>
                    
                    <MnemonicBox>
                        {walletInfo.mnemonic}
                    </MnemonicBox>
                    
                    <WarningText>
                        ⚠️ Never share this phrase with anyone! We will never ask for it.
                    </WarningText>
                    
                    <Button onClick={handleConfirmMnemonic}>
                        I've Saved My Recovery Phrase
                    </Button>
                </Card>
            </Container>
        );
    }

    // Show verification screen if registration is complete
    if (showVerification) {
        return <VerificationScreen email={registeredEmail} />;
    }

    return (
        <div>
            <PageTitle heading='Register' title='Register' />
            <section className="register">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="block-text center">
                                <h3 className="heading">Register To Ripple Exchange</h3>
                                <p className="desc fs-20">
                                    Register in advance and enjoy the event benefits
                                </p>
                            </div>
                        </div>
                        <div className="col-md-12">
                            {showOtpVerification ? (
                                <OtpVerification
                                    email={registeredEmail || email}
                                    onVerify={handleOtpVerify}
                                    onResendOtp={handleResendOtp}
                                    error={error}
                                    success={success}
                                />
                            ) : (
                                <Tabs>
                                    <TabList>
                                        <Tab><h6 className="fs-16">Email</h6></Tab>
                                        <Tab><h6 className="fs-16">Mobile</h6></Tab>
                                    </TabList>

                                    <TabPanel>
                                        <div className="content-inner">
                                            {error && <div className="alert alert-danger">{error}</div>}
                                            {success && <div className="alert alert-success">{success}</div>}
                                            
                                            <form onSubmit={handleSubmit}>
                                                <div className="form-group">
                                                    <label htmlFor="exampleInputEmail1">Email/ID</label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        id="exampleInputEmail1"
                                                        placeholder="Please fill in the email form."
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Password <span>(8 or more characters, including numbers and special characters)</span></label>
                                                    <input
                                                        type="password"
                                                        className="form-control mb-10"
                                                        placeholder="Please enter a password."
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                    />
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        placeholder="Please re-enter your password."
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>NickName <span className="fs-14">(Excluding special characters)</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter Nickname"
                                                        value={nickname}
                                                        onChange={(e) => setNickname(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Country </label>
                                                    <select 
                                                        className="form-control"
                                                        value={country}
                                                        onChange={(e) => setCountry(e.target.value)}
                                                    >
                                                        <option>South Korea (+82)</option>
                                                        <option>Vietnamese (+84)</option>
                                                        <option>United States (+1)</option>
                                                        <option>Belgium (+32)</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Phone <span className="fs-14">(Enter numbers only)</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="ex) 01012345678 (without '-')"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Referral Code <span className="fs-14">(Optional)</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter referral code if you have one"
                                                        value={referralCode}
                                                        onChange={(e) => setReferralCode(e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>UID Code </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Please enter your invitation code."
                                                        value={uidCode}
                                                        onChange={(e) => setUidCode(e.target.value)}
                                                    />
                                                </div>

                                                <button 
                                                    type="submit" 
                                                    className="btn-action" 
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Creating Account...' : 'Create Account'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={handleGoogleSignup} 
                                                    className="btn-action"
                                                    style={{marginTop: '10px'}}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Processing...' : 'Sign up with Google'}
                                                </button>
                                                <div className="bottom">
                                                    <p>Already have an account?</p>
                                                    <Link to="/login">Login</Link>
                                                </div>
                                            </form>
                                        </div>
                                    </TabPanel>

                                    <TabPanel>
                                        <div className="content-inner">
                                            <form onSubmit={handlePhoneSignup}>
                                                <div className="form-group">
                                                    <label htmlFor="exampleInputEmail1">Mobile Phone</label>
                                                    <div>
                                                        <select
                                                            className="form-control"
                                                            value={countryCode}
                                                            onChange={(e) => setCountryCode(e.target.value)}
                                                        >
                                                            <option>+1</option>
                                                            <option>+84</option>
                                                            <option>+82</option>
                                                            <option>+32</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Your Phone number"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Password <span>(8 or more characters, including numbers and special characters)</span></label>
                                                    <input
                                                        type="password"
                                                        className="form-control mb-10"
                                                        placeholder="Please enter a password."
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        placeholder="Please re-enter your password."
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>NickName <span className="fs-14">(Excluding special characters)</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter Nickname"
                                                        value={nickname}
                                                        onChange={(e) => setNickname(e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Country </label>
                                                    <select 
                                                        className="form-control"
                                                        value={country}
                                                        onChange={(e) => setCountry(e.target.value)}
                                                    >
                                                        <option>South Korea (+82)</option>
                                                        <option>Vietnamese (+84)</option>
                                                        <option>United States (+1)</option>
                                                        <option>Belgium (+32)</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label>Referral Code <span className="fs-14">(Optional)</span></label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Enter referral code if you have one"
                                                        value={referralCode}
                                                        onChange={(e) => setReferralCode(e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>UID Code </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Please enter your invitation code."
                                                        value={uidCode}
                                                        onChange={(e) => setUidCode(e.target.value)}
                                                    />
                                                </div>

                                                {error && <div className="alert alert-danger">{error}</div>}

                                                <button type="submit" className="btn-action">
                                                    Pre-Registration
                                                </button>
                                                <div className="bottom">
                                                    <p>Already have an account?</p>
                                                    <Link to="/login">Login</Link>
                                                </div>
                                            </form>
                                        </div>
                                    </TabPanel>
                                </Tabs> 
                            )}
                        </div>
                    </div>
                </div>
            </section>
            <Sale01 />
        </div>
    );
}

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f0f0f0;
`;

const Card = styled.div`
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
`;

const Title = styled.h2`
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
`;

const Description = styled.p`
    font-size: 16px;
    margin-bottom: 20px;
`;

const MnemonicBox = styled.div`
    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    font-family: 'Roboto Mono', monospace;
    color: #00ff9d;
    font-size: 16px;
    word-spacing: 8px;
    line-height: 1.6;
    text-align: center;
`;

const WarningText = styled.p`
    color: #ffc107;
    text-align: center;
    margin: 20px 0;
    font-size: 14px;
`;

const Button = styled.button`
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    width: 100%;
    margin-top: 20px;

    &:hover {
        background-color: #0056b3;
    }
`;

const ErrorAlert = styled.div`
    background-color: #ffcccc;
    border: 1px solid #ff0000;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label`
    font-weight: 600;
    margin-bottom: 5px;
`;

const Input = styled.input`
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
`;

export default Register;