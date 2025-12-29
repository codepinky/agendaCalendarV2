import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/shared/ToastContainer/ToastContainer';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import DashboardLayout from './components/layout/DashboardLayout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import SlotsPage from './pages/Dashboard/Slots/SlotsPage';
import OpenSlotPage from './pages/Dashboard/OpenSlot/OpenSlotPage';
import BookingsPage from './pages/Dashboard/Bookings/BookingsPage';
import BookingsTodayPage from './pages/Dashboard/BookingsToday/BookingsTodayPage';
import CustomizationPage from './pages/Dashboard/Customization/CustomizationPage';
import PublicLinkPage from './pages/Dashboard/PublicLink/PublicLinkPage';
import GoogleCalendarPage from './pages/Dashboard/GoogleCalendar/GoogleCalendarPage';
import SettingsPage from './pages/Dashboard/Settings/SettingsPage';
import PublicSchedule from './pages/PublicSchedule/PublicSchedule';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="horarios" element={<SlotsPage />} />
              <Route path="horarios/abrir" element={<OpenSlotPage />} />
              <Route path="agendamentos" element={<BookingsPage />} />
              <Route path="agendamentos/hoje" element={<BookingsTodayPage />} />
              <Route path="link-publico" element={<PublicLinkPage />} />
              <Route path="personalizacao" element={<CustomizationPage />} />
              <Route path="google-calendar" element={<GoogleCalendarPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
            </Route>
            <Route path="/schedule/:publicLink" element={<PublicSchedule />} />
          </Routes>
        </Router>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
