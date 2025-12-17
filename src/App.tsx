import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PolesListPage from './pages/PolesListPage';
import PoleDetailPage from './pages/PoleDetailPage';
import CreatePolePage from './pages/CreatePolePage';
import UpdatePolePage from './pages/UpdatePolePage';
import ParksListPage from './pages/ParksListPage';
import ParkDetailPage from './pages/ParkDetailPage';
import CreateParkPage from './pages/CreateParkPage';
import UpdateParkPage from './pages/UpdateParkPage';
import IssuesListPage from './pages/IssuesListPage';
import ParkIssuesListPage from './pages/ParkIssuesListPage';
import MaintenancePage from './pages/MaintenancePage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/poles" element={<PolesListPage />} />
          <Route path="/poles/new" element={<CreatePolePage />} />
          <Route path="/poles/:code" element={<PoleDetailPage />} />
          <Route path="/poles/:code/edit" element={<UpdatePolePage />} />
          <Route path="/parks" element={<ParksListPage />} />
          <Route path="/parks/new" element={<CreateParkPage />} />
          <Route path="/parks/:code" element={<ParkDetailPage />} />
          <Route path="/parks/:code/edit" element={<UpdateParkPage />} />
          <Route path="/issues" element={<IssuesListPage />} />
          <Route path="/park-issues" element={<ParkIssuesListPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


