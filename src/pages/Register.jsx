import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Sale01 from '../components/sale/Sale01';
import { auth, db, googleProvider } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    sendEmailVerification,
    updateProfile,
    sendSignInLinkToEmail,
    signOut
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
import axios from 'axios';

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
    const [verificationSent, setVerificationSent] = useState(false);

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
            
            // Setup the user document data
            const userDocData = {
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
            };

            // Try to create user document with error handling for permission issues
            try {
                // Create user document with balances and bonus included
                await setDoc(doc(db, 'users', user.uid), userDocData);
                console.log("User document created successfully");
            } catch (docError) {
                console.error("Error creating user document:", docError);
                // If we get a permission error, try again with a simpler document
                if (docError.code === 'permission-denied') {
                    console.log("Permission denied, trying minimal user document");
                    // Try with minimal data
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        createdAt: serverTimestamp(),
                        emailVerified: userData.emailVerified || false
                    });
                } else {
                    throw docError; // Re-throw other errors
                }
            }

            // Try to generate a wallet with error handling for permission issues
            let walletData = null;
            try {
                // Generate wallet for the user
                walletData = await generateUserWallet(user.uid);
                console.log("Wallet generated successfully");
            } catch (walletError) {
                console.error("Error generating wallet:", walletError);
                // Continue without a wallet - we'll try to fix this later
            }

            // Try to process referral if provided
            if (referralCode) {
                try {
                    await referralService.registerReferral(referralCode, user.uid);
                    console.log("Referral processed successfully");
                } catch (referralError) {
                    console.error("Error processing referral:", referralError);
                    // Continue without processing referral - not critical
                }
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
            
            // Don't log the OTP but set in state
            setSentVerificationCode(otp);
            
            // Send the registration verification code via email
            console.log('Sending verification email...');
            let emailSent = false;

            try {
                const emailResult = await sendRegistrationVerificationEmail(email, otp);
                
                if (emailResult.success) {
                    console.log('Verification email sent successfully');
                    emailSent = true;
                } else {
                    console.error('Email service reported an error:', emailResult.error);
                    // Continue with registration even if email fails
                }
            } catch (emailError) {
                console.error('Error during email sending:', emailError);
                // Continue with registration even if email fails
            }
            
            // Store additional user data and generate wallet
            const walletData = await storeUserData(user, {
                displayName: nickname || email.split('@')[0],
                emailVerified: false,
                otp: otp, // Store OTP in user data
                emailSent // Track if email was sent successfully
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
                otp,
                emailSent // Track if email was sent successfully
            };
            setTempUserData(userData);
            
            // Show OTP verification screen
            setShowOtpVerification(true);
            setRegisteredEmail(email);
            
            // Inform the user about the email status after successful registration
            if (!emailSent) {
                setError('Registration successful but verification email could not be sent. Please request a new code if needed.');
            }
            
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
            console.log('Sending verification email...');
            let emailSent = false;

            try {
                const emailResult = await sendRegistrationVerificationEmail(email, otp);
                
                if (emailResult.success) {
                    console.log('Verification email sent successfully');
                    emailSent = true;
                } else {
                    console.error('Email service reported an error:', emailResult.error);
                    // Continue with registration even if email fails
                }
            } catch (emailError) {
                console.error('Error during email sending:', emailError);
                // Continue with registration even if email fails
            }

            // Prepare user data
            const userData = {
                email,
                nickname,
                phone: `${countryCode}${phone}`,
                country,
                uidCode,
                otp, // Store OTP in user data for verification
                authProvider: 'email',
                emailSent // Track if email was sent successfully
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
                
                // Sign out the user after verification to ensure they have to log in properly
                await signOut(auth);
                
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
            
            // Check if we have the email
            if (!registeredEmail && !tempUserData?.email) {
                setError('No email found for resending verification code');
                return;
            }
            
            const email = registeredEmail || tempUserData.email;
            
            // Import services dynamically
            const { generateVerificationCode, sendRegistrationVerificationEmail } = await import('../utils/emailService');
            
            // Generate a new code
            const newOtp = generateVerificationCode();
            setSentVerificationCode(newOtp);
            
            // Only update Firestore if we have a user (otherwise we'll catch in OTP verification)
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, { otp: newOtp });
            }
            
            // Send verification email
            await sendRegistrationVerificationEmail(email, newOtp);
            
            setSuccess('New verification code sent. Please check your email.');
        } catch (err) {
            console.error('Error resending OTP:', err);
            setError(err.message);
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

    const handleSendVerificationCode = async () => {
        try {
            const response = await axios.post('/api/send-verification-code', { email });
            if (response.data.success) {
                // Just show a message to check email
                setVerificationSent(true);
                // Code will be entered by user from their email
            }
        } catch (error) {
            // ...
        }
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
                                                        <option value="Afghanistan">Afghanistan</option>
                <option value="Åland Islands">Åland Islands</option>
                <option value="Albania">Albania</option>
                <option value="Algeria">Algeria</option>
                <option value="American Samoa">American Samoa</option>
                <option value="Andorra">Andorra</option>
                <option value="Angola">Angola</option>
                <option value="Anguilla">Anguilla</option>
                <option value="Antarctica">Antarctica</option>
                <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                <option value="Argentina">Argentina</option>
                <option value="Armenia">Armenia</option>
                <option value="Aruba">Aruba</option>
                <option value="Australia">Australia</option>
                <option value="Austria">Austria</option>
                <option value="Azerbaijan">Azerbaijan</option>
                <option value="Bahamas">Bahamas</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="Barbados">Barbados</option>
                <option value="Belarus">Belarus</option>
                <option value="Belgium">Belgium</option>
                <option value="Belize">Belize</option>
                <option value="Benin">Benin</option>
                <option value="Bermuda">Bermuda</option>
                <option value="Bhutan">Bhutan</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                <option value="Botswana">Botswana</option>
                <option value="Bouvet Island">Bouvet Island</option>
                <option value="Brazil">Brazil</option>
                <option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
                <option value="Brunei Darussalam">Brunei Darussalam</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Burundi">Burundi</option>
                <option value="Cambodia">Cambodia</option>
                <option value="Cameroon">Cameroon</option>
                <option value="Canada">Canada</option>
                <option value="Cape Verde">Cape Verde</option>
                <option value="Cayman Islands">Cayman Islands</option>
                <option value="Central African Republic">Central African Republic</option>
                <option value="Chad">Chad</option>
                <option value="Chile">Chile</option>
                <option value="China">China</option>
                <option value="Christmas Island">Christmas Island</option>
                <option value="Cocos (Keeling) Islands">Cocos (Keeling) Islands</option>
                <option value="Colombia">Colombia</option>
                <option value="Comoros">Comoros</option>
                <option value="Congo">Congo</option>
                <option value="Congo, The Democratic Republic of The">Congo, The Democratic Republic of The</option>
                <option value="Cook Islands">Cook Islands</option>
                <option value="Costa Rica">Costa Rica</option>
                <option value="Cote D'ivoire">Cote D'ivoire</option>
                <option value="Croatia">Croatia</option>
                <option value="Cuba">Cuba</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Denmark">Denmark</option>
                <option value="Djibouti">Djibouti</option>
                <option value="Dominica">Dominica</option>
                <option value="Dominican Republic">Dominican Republic</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Egypt">Egypt</option>
                <option value="El Salvador">El Salvador</option>
                <option value="Equatorial Guinea">Equatorial Guinea</option>
                <option value="Eritrea">Eritrea</option>
                <option value="Estonia">Estonia</option>
                <option value="Ethiopia">Ethiopia</option>
                <option value="Falkland Islands (Malvinas)">Falkland Islands (Malvinas)</option>
                <option value="Faroe Islands">Faroe Islands</option>
                <option value="Fiji">Fiji</option>
                <option value="Finland">Finland</option>
                <option value="France">France</option>
                <option value="French Guiana">French Guiana</option>
                <option value="French Polynesia">French Polynesia</option>
                <option value="French Southern Territories">French Southern Territories</option>
                <option value="Gabon">Gabon</option>
                <option value="Gambia">Gambia</option>
                <option value="Georgia">Georgia</option>
                <option value="Germany">Germany</option>
                <option value="Ghana">Ghana</option>
                <option value="Gibraltar">Gibraltar</option>
                <option value="Greece">Greece</option>
                <option value="Greenland">Greenland</option>
                <option value="Grenada">Grenada</option>
                <option value="Guadeloupe">Guadeloupe</option>
                <option value="Guam">Guam</option>
                <option value="Guatemala">Guatemala</option>
                <option value="Guernsey">Guernsey</option>
                <option value="Guinea">Guinea</option>
                <option value="Guinea-bissau">Guinea-bissau</option>
                <option value="Guyana">Guyana</option>
                <option value="Haiti">Haiti</option>
                <option value="Heard Island and Mcdonald Islands">Heard Island and Mcdonald Islands</option>
                <option value="Holy See (Vatican City State)">Holy See (Vatican City State)</option>
                <option value="Honduras">Honduras</option>
                <option value="Hong Kong">Hong Kong</option>
                <option value="Hungary">Hungary</option>
                <option value="Iceland">Iceland</option>
                <option value="India">India</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Iran, Islamic Republic of">Iran, Islamic Republic of</option>
                <option value="Iraq">Iraq</option>
                <option value="Ireland">Ireland</option>
                <option value="Isle of Man">Isle of Man</option>
                <option value="Italy">Italy</option>
                <option value="Jamaica">Jamaica</option>
                <option value="Japan">Japan</option>
                <option value="Jersey">Jersey</option>
                <option value="Jordan">Jordan</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Kenya">Kenya</option>
                <option value="Kiribati">Kiribati</option>
                <option value="Korea, Democratic People's Republic of">Korea, Democratic People's Republic of</option>
                <option value="Korea, Republic of">Korea, Republic of</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Kyrgyzstan">Kyrgyzstan</option>
                <option value="Lao People's Democratic Republic">Lao People's Democratic Republic</option>
                <option value="Latvia">Latvia</option>
                <option value="Lebanon">Lebanon</option>
                <option value="Lesotho">Lesotho</option>
                <option value="Liberia">Liberia</option>
                <option value="Libyan Arab Jamahiriya">Libyan Arab Jamahiriya</option>
                <option value="Liechtenstein">Liechtenstein</option>
                <option value="Lithuania">Lithuania</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Macao">Macao</option>
                <option value="Macedonia, The Former Yugoslav Republic of">Macedonia, The Former Yugoslav Republic of</option>
                <option value="Madagascar">Madagascar</option>
                <option value="Malawi">Malawi</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Maldives">Maldives</option>
                <option value="Mali">Mali</option>
                <option value="Malta">Malta</option>
                <option value="Marshall Islands">Marshall Islands</option>
                <option value="Martinique">Martinique</option>
                <option value="Mauritania">Mauritania</option>
                <option value="Mauritius">Mauritius</option>
                <option value="Mayotte">Mayotte</option>
                <option value="Mexico">Mexico</option>
                <option value="Micronesia, Federated States of">Micronesia, Federated States of</option>
                <option value="Moldova, Republic of">Moldova, Republic of</option>
                <option value="Monaco">Monaco</option>
                <option value="Mongolia">Mongolia</option>
                <option value="Montenegro">Montenegro</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Morocco">Morocco</option>
                <option value="Mozambique">Mozambique</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Namibia">Namibia</option>
                <option value="Nauru">Nauru</option>
                <option value="Nepal">Nepal</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Netherlands Antilles">Netherlands Antilles</option>
                <option value="New Caledonia">New Caledonia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Nicaragua">Nicaragua</option>
                <option value="Niger">Niger</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Niue">Niue</option>
                <option value="Norfolk Island">Norfolk Island</option>
                <option value="Northern Mariana Islands">Northern Mariana Islands</option>
                <option value="Norway">Norway</option>
                <option value="Oman">Oman</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Palau">Palau</option>
                <option value="Palestinian Territory, Occupied">Palestinian Territory, Occupied</option>
                <option value="Panama">Panama</option>
                <option value="Papua New Guinea">Papua New Guinea</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Peru">Peru</option>
                <option value="Philippines">Philippines</option>
                <option value="Pitcairn">Pitcairn</option>
                <option value="Poland">Poland</option>
                <option value="Portugal">Portugal</option>
                <option value="Puerto Rico">Puerto Rico</option>
                <option value="Qatar">Qatar</option>
                <option value="Reunion">Reunion</option>
                <option value="Romania">Romania</option>
                <option value="Russian Federation">Russian Federation</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Saint Helena">Saint Helena</option>
                <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                <option value="Saint Lucia">Saint Lucia</option>
                <option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
                <option value="Saint Vincent and The Grenadines">Saint Vincent and The Grenadines</option>
                <option value="Samoa">Samoa</option>
                <option value="San Marino">San Marino</option>
                <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Senegal">Senegal</option>
                <option value="Serbia">Serbia</option>
                <option value="Seychelles">Seychelles</option>
                <option value="Sierra Leone">Sierra Leone</option>
                <option value="Singapore">Singapore</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Slovenia">Slovenia</option>
                <option value="Solomon Islands">Solomon Islands</option>
                <option value="Somalia">Somalia</option>
                <option value="South Africa">South Africa</option>
                <option value="South Georgia and The South Sandwich Islands">South Georgia and The South Sandwich Islands</option>
                <option value="Spain">Spain</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="Sudan">Sudan</option>
                <option value="Suriname">Suriname</option>
                <option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
                <option value="Swaziland">Swaziland</option>
                <option value="Sweden">Sweden</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Syrian Arab Republic">Syrian Arab Republic</option>
                <option value="Taiwan">Taiwan</option>
                <option value="Tajikistan">Tajikistan</option>
                <option value="Tanzania, United Republic of">Tanzania, United Republic of</option>
                <option value="Thailand">Thailand</option>
                <option value="Timor-leste">Timor-leste</option>
                <option value="Togo">Togo</option>
                <option value="Tokelau">Tokelau</option>
                <option value="Tonga">Tonga</option>
                <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Turkey">Turkey</option>
                <option value="Turkmenistan">Turkmenistan</option>
                <option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
                <option value="Tuvalu">Tuvalu</option>
                <option value="Uganda">Uganda</option>
                <option value="Ukraine">Ukraine</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Uzbekistan">Uzbekistan</option>
                <option value="Vanuatu">Vanuatu</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Viet Nam">Viet Nam</option>
                <option value="Virgin Islands, British">Virgin Islands, British</option>
                <option value="Virgin Islands, U.S.">Virgin Islands, U.S.</option>
                <option value="Wallis and Futuna">Wallis and Futuna</option>
                <option value="Western Sahara">Western Sahara</option>
                <option value="Yemen">Yemen</option>
                <option value="Zambia">Zambia</option>
                <option value="Zimbabwe">Zimbabwe</option>
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