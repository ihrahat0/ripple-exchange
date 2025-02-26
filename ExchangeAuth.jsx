import React, { useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";

const ExchangeAuth = () => {
  // State for toggling between login and signup
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP-related state for signup
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");

  // Handler for Google sign in
  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      console.log("Google SignIn successful:", res.user);
      // Continue with your exchange logic (e.g. redirect the user)
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // Handler for email login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email login successful:", res.user);
      // Continue with your exchange logic (e.g. redirect the user)
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // Handler for email signup with OTP verification
  const handleSignup = async (e) => {
    e.preventDefault();

    // If OTP hasn't been sent, generate and simulate sending it
    if (!otpSent) {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP (simulate sending via email):", generated);
      // In production, send this OTP to user's email via your backend
      setGeneratedOtp(generated);
      setOtpSent(true);
      alert("OTP sent to your email address (check the console for the OTP in this demo).");
    } else {
      // If OTP has been sent, verify it
      if (otp === generatedOtp) {
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          console.log("Signup successful:", res.user);
          // Optionally, send verification email or update profile here
        } catch (err) {
          console.error(err);
          setError(err.message);
        }
      } else {
        setError("Invalid OTP. Please try again.");
      }
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      {/* Toggle between Login and Signup */}
      <div>
        <button onClick={() => { setIsLogin(true); setError(""); setOtpSent(false); }}>Login</button>
        <button onClick={() => { setIsLogin(false); setError(""); setOtpSent(false); }}>Signup</button>
      </div>

      {/* Google Sign In Option */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={handleGoogleSignIn}>Continue with Google</button>
      </div>

      {/* Email Form */}
      <div style={{ marginTop: "20px" }}>
        {isLogin ? (
          // Login form
          <form onSubmit={handleLogin}>
            <div>
              <label>Email: </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">Login</button>
          </form>
        ) : (
          // Signup form with OTP verification
          <form onSubmit={handleSignup}>
            <div>
              <label>Email: </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password: </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {otpSent && (
              <div>
                <label>Enter OTP: </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit">
              {!otpSent ? "Send OTP" : "Signup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ExchangeAuth; 