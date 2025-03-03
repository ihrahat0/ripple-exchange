import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Sale01 from '../components/sale/Sale01';
import { auth, googleProvider, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PageTitle from '../components/pagetitle';
import { useAuth } from '../contexts/AuthContext';
import {Link} from 'react-router-dom';
import img from '../assets/images/icon/qrcode.png'

Login.propTypes = {
    
};

function Login(props) {
    const navigate = useNavigate();
    const { checkEmailVerificationStatus } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [error, setError] = useState('');
    const [verificationPrompt, setVerificationPrompt] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setVerificationPrompt(false);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if email is verified in Firestore
            const isVerified = await checkEmailVerificationStatus(user);
            
            if (!isVerified) {
                // Email is not verified - show message but don't redirect
                setVerificationPrompt(true);
                setError('Please verify your email before logging in.');
                setLoading(false);
                // Sign the user out to prevent access without verification
                await auth.signOut();
                return;
            }
            
            console.log('Logged in user:', user);
            navigate('/user-profile');
        } catch (err) {
            setError(err.message);
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLogin = async (e) => {
        e.preventDefault();
        // For this demo, we'll just show an error since phone auth requires additional setup
        setError('Phone authentication requires additional Firebase setup.');
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            const result = await signInWithPopup(auth, googleProvider);
            
            // Google accounts are considered pre-verified
            console.log('Google login successful:', result.user);
            navigate('/user-profile');
        } catch (err) {
            setError(err.message);
            console.error('Google login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = () => {
        // Redirect to a page where they can request a new verification code
        navigate('/register', { state: { email, showVerification: true } });
    };

    return (
        <div>
             <PageTitle heading='Login' title='Login' />

            <section className="register login">
            <div className="container">
                <div className="row">
                <div className="col-md-12">
                    <div className="block-text center">
                    <h3 className="heading">Login To Ripple Exchange</h3>
                    <p className="desc fs-20">
                        Welcome back! Log In now to start trading
                    </p>
                    <div className="lock">
                        <div className="icon">
                        <svg
                            width="16"
                            height="20"
                            viewBox="0 0 16 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                            d="M8.00004 11.7578C7.67672 11.7578 7.41406 12.0205 7.41406 12.3438C7.41406 12.6671 7.67672 12.9298 8.00004 12.9298C8.32336 12.9298 8.58602 12.6671 8.58602 12.3438C8.58602 12.0205 8.32336 11.7578 8.00004 11.7578Z"
                            fill="white"
                            />
                            <path
                            d="M11.5162 8.24219H4.2187C2.10011 8.24219 0.382568 9.95965 0.382568 12.0783C0.382568 15.6973 2.78413 19.0605 6.32241 19.8205C11.2508 20.8791 15.618 17.0922 15.618 12.344C15.618 10.0787 13.7816 8.24219 11.5162 8.24219ZM8.58628 13.9941V17.071C8.58628 17.3949 8.32417 17.657 8.0003 17.657C7.6764 17.657 7.41433 17.3949 7.41433 17.071V13.9941C6.73374 13.7514 6.24237 13.107 6.24237 12.3441C6.24237 11.3747 7.03093 10.5861 8.0003 10.5861C8.96968 10.5861 9.75823 11.3747 9.75823 12.3441C9.75823 13.107 9.26686 13.7513 8.58628 13.9941Z"
                            fill="white"
                            />
                            <path
                            d="M8.00039 0C5.08223 0 2.72656 2.35562 2.72656 5.27383V7.3234C3.20102 7.17391 3.69582 7.07086 4.21898 7.07086H5.07051V5.27383C5.07051 3.65652 6.38309 2.34395 8.00039 2.34395C9.6177 2.34395 10.9303 3.65652 10.9303 5.27383V7.07082H11.5163C12.1356 7.07082 12.7216 7.19777 13.2742 7.3948V5.27383C13.2742 2.35844 10.9128 0 8.00039 0Z"
                            fill="white"
                            />
                        </svg>
                        </div>
                        <p><span>https://</span>accounts.Ripple Exchange.com/login</p>
                    </div>
                    </div>
                </div>
                <div className="col-md-12">
                <Tabs>
                    <TabList>
                        <Tab><h6 className="fs-16">Email</h6></Tab>
                        <Tab><h6 className="fs-16">Mobile</h6></Tab>
                    </TabList>

                    <TabPanel>
                        <div className="content-inner">
                            <form onSubmit={handleEmailLogin}>
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
                                <div className="form-group s1">
                                <label>Password </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Please enter a password."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                </div>

                                <div className="form-group form-check">
                                <div>
                                    <input type="checkbox" className="form-check-input" />
                                    <label className="form-check-label">Remember Me</label>
                                </div>
                                <p>Forgot Password?</p>
                                </div>

                                {error && <div className="alert alert-danger">{error}</div>}
                                
                                {verificationPrompt && (
                                    <div className="alert alert-warning">
                                        Your email is not verified. 
                                        <button 
                                            onClick={handleVerification}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#0066cc',
                                                textDecoration: 'underline',
                                                padding: '0 5px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Click here to verify
                                        </button>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn-action" 
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleGoogleLogin} 
                                    className="btn-action"
                                    disabled={loading}
                                    style={{
                                        marginTop: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <img 
                                        src="https://www.google.com/favicon.ico" 
                                        alt="Google" 
                                        style={{width: '20px', height: '20px'}}
                                    />
                                    {loading ? 'Processing...' : 'Continue with Google'}
                                </button>
                                <div className="bottom">
                                <p>Not a member?</p>
                                <Link to="/register">Register</Link>
                                </div>
                            </form>
                        </div>
                    </TabPanel>

                    <TabPanel>
                        <div className="content-inner">
                            <form onSubmit={handlePhoneLogin}>
                                <div className="form-group">
                                <label htmlFor="exampleInputEmail1">Mobile Phone</label>
                                <div>
                                    <select
                                    className="form-control"
                                    id="exampleFormControlSelect1"
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
                                <div className="form-group s1">
                                <label>Password </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Please enter a password."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                </div>

                                <div className="form-group form-check">
                                <div>
                                    <input type="checkbox" className="form-check-input" />
                                    <label className="form-check-label">Remember Me</label>
                                </div>
                                <p>Forgot Password?</p>
                                </div>

                                {error && <div className="alert alert-danger">{error}</div>}

                                <button type="submit" className="btn-action">Login</button>
                                <div className="bottom">
                                <p>Not a member?</p>
                                <Link to="/register">Register</Link>
                                </div>
                            </form>
                        </div>
                    </TabPanel>
                </Tabs> 

                    {/* <div className="qr-code center">
                    <img src={img} alt="" />
                    <h6 className="fs-20">Login with QR code</h6>
                    <p className="fs-14">
                        Scan this code with the <span>Ripple Exchange mobile app</span> <br />
                        to log in instantly.
                    </p>
                    </div> */}
                </div>
                </div>
            </div>
            </section>

            <Sale01 />
        </div>
    );
}

export default Login;