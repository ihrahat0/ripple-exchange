import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/header/Header';
import Footer from './components/footer';
import '../src/assets/font/font-awesome.css'
import routes from './pages';
import Page404 from './pages/404';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import Trading from './pages/Trading';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Airdrop from './pages/Airdrop';
import { auth } from './firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import AOS from 'aos';
import AdminPanel from './pages/admin/AdminPanel';
import PrivateRoute from './components/PrivateRoute';

// Create a separate component for email link handling
function EmailLinkHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }

            signInWithEmailLink(auth, email, window.location.href)
                .then((result) => {
                    window.localStorage.removeItem('emailForSignIn');
                    navigate('/user-profile');
                })
                .catch((error) => {
                    console.error('Error completing email link sign-in', error);
                    navigate('/login');
                });
        }
    }, [navigate]);

    return null;
}

function App() {
    useEffect(() => {
        // Initialize AOS
        AOS.init({
            duration: 2000
        });

        // Set dark mode
        document.body.classList.add('is_dark');
        
        // Store dark mode preference
        localStorage.setItem("theme", "is_dark");
    }, []);

    return (
        <AuthProvider>
            <div className="App is_dark">
                <Header />
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home-v1" element={routes.find(r => r.path === '/home-v1')?.component} />
                    
                    {/* Protected routes */}
                    <Route path="/user-profile" element={
                        <PrivateRoute>
                            <UserProfile />
                        </PrivateRoute>
                    } />
                    <Route path="/trading/:cryptoId" element={
                        <PrivateRoute>
                            <Trading />
                        </PrivateRoute>
                    } />
                    <Route path="/deposit" element={
                        <PrivateRoute>
                            <Deposit />
                        </PrivateRoute>
                    } />
                    <Route path="/withdraw" element={
                        <PrivateRoute>
                            <Withdraw />
                        </PrivateRoute>
                    } />
                    <Route path="/airdrop" element={
                        <PrivateRoute>
                            <Airdrop />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/*" element={
                        <PrivateRoute>
                            <AdminPanel />
                        </PrivateRoute>
                    } />

                    {/* Dynamic routes from pages/index.js */}
                    {routes.map((route, index) => (
                        <Route 
                            key={index}
                            path={route.path}
                            element={route.component}
                        />
                    ))}

                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/home-v1" replace />} />
                    
                    {/* 404 catch-all route */}
                    <Route path="*" element={<Page404 />} />
                </Routes>
                <EmailLinkHandler />
                <Footer />
            </div>
        </AuthProvider>
    );
}

export default App;
