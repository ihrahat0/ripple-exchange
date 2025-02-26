import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Trading from './components/Trading';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Other routes */}
          <Route 
            path="/trading/:id" 
            element={
              <PrivateRoute>
                <Trading />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 