import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Trading from './components/Trading';
import Deposit from './pages/Deposit';
import Market from './pages/Market';
import Header from './components/header/Header';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-wrapper">
          <Header />
          <Routes>
            <Route 
              path="/trading/:id" 
              element={
                <PrivateRoute>
                  <Trading />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/deposit" 
              element={
                <PrivateRoute>
                  <Deposit />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/market" 
              element={
                <PrivateRoute>
                  <Market />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Market />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 