import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PublicSchedule from './pages/PublicSchedule/PublicSchedule';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/schedule/:publicLink" element={<PublicSchedule />} />
      </Routes>
    </Router>
  );
}

export default App;
