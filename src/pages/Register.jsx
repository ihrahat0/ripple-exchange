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
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PageTitle from '../components/pagetitle';
import OtpVerification from '../components/OtpVerification';
import {Link} from 'react-router-dom';
import { DEFAULT_COINS } from '../utils/constants';

Register.propTypes = {
    
};

function Register(props) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('South Korea (+82)');
    const [countryCode, setCountryCode] = useState('+1');
    const [error, setError] = useState('');
    const [uidCode, setUidCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtpVerification, setShowOtpVerification] = useState(false);
    const [tempUserData, setTempUserData] = useState(null);
    const [verificationId, setVerificationId] = useState('');

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const storeUserData = async (user, userData) => {
        try {
            // Initialize balances for all supported coins
            const initialBalances = {};
            Object.keys(DEFAULT_COINS).forEach(coin => {
                initialBalances[coin] = DEFAULT_COINS[coin].initialBalance;
            });

            // Create a user document in Firestore with initialized balances
            const userDocData = {
                email: userData.email,
                displayName: userData.nickname || userData.displayName,
                phoneNumber: userData.phone || '',
                country: userData.country || '',
                uidCode: userData.uidCode || '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isEmailVerified: user.emailVerified,
                authProvider: userData.authProvider || 'email',
                role: 'user',
                balances: initialBalances
            };

            // Set the user document with merge option to prevent overwriting existing data
            await setDoc(doc(db, 'users', user.uid), userDocData, { merge: true });

            return userDocData;
        } catch (error) {
            console.error('Error storing user data:', error);
            throw error;
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

            // Generate OTP
            const otp = generateOTP();
            console.log('Generated OTP:', otp); // In production, send this via email

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

            // Configure email verification
            const actionCodeSettings = {
                url: `${window.location.origin}/user-profile`,
                handleCodeInApp: true
            };

            // Send verification email
            await sendEmailVerification(user, actionCodeSettings);
            
            // Store email for later
            localStorage.setItem('emailForSignIn', email);

            // Show OTP verification screen
            setShowOtpVerification(true);

            // Show success message to check email
            alert(`Account created successfully! We've sent you:
1. A verification link to your email
2. A 6-digit OTP code (${otp})

You can verify your account using either method:
- Click the verification link in your email
- Enter the 6-digit OTP code on this page`);

        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async (otpInput) => {
        if (!tempUserData) {
            setError('Registration data not found');
            return;
        }

        try {
            setLoading(true);
            setError('');

            if (otpInput === tempUserData.otp) {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error('No user found. Please try again.');
                }

                // Update any additional user data here if needed
                await updateProfile(user, {
                    displayName: tempUserData.nickname
                });

                alert('Account verified successfully! You can now log in.');
                navigate('/login');
            } else {
                setError('Invalid OTP. Please try again or use the verification link sent to your email.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = () => {
        if (tempUserData) {
            const newOtp = generateOTP();
            console.log('New OTP:', newOtp); // In production, send this via email
            setTempUserData({ ...tempUserData, otp: newOtp });
        }
    };

    const handleGoogleSignup = async () => {
        try {
            setLoading(true);
            setError('');
            
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Prepare user data for Google sign-up
            const userData = {
                email: user.email,
                displayName: user.displayName,
                nickname: user.displayName,
                phone: user.phoneNumber || '',
                country: country,
                uidCode: '',
                authProvider: 'google'
            };

            // Store user data and wait for completion
            await storeUserData(user, userData);

            // Navigate only after successful data storage
            navigate('/user-profile');
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
                                    email={email}
                                    onVerify={handleOtpVerify}
                                    onResendOtp={handleResendOtp}
                                />
                            ) : (
                                <Tabs>
                                    <TabList>
                                        <Tab><h6 className="fs-16">Email</h6></Tab>
                                        <Tab><h6 className="fs-16">Mobile</h6></Tab>
                                    </TabList>

                                    <TabPanel>
                                        <div className="content-inner">
                                            <form onSubmit={handleEmailSignup}>
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

                                                <button 
                                                    type="submit" 
                                                    className="btn-action" 
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Processing...' : 'Register'}
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

export default Register;