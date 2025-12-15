import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PolesListPage from './pages/PolesListPage';
import PoleDetailPage from './pages/PoleDetailPage';
import CreatePolePage from './pages/CreatePolePage';
import UpdatePolePage from './pages/UpdatePolePage';
import IssuesListPage from './pages/IssuesListPage';
import MaintenancePage from './pages/MaintenancePage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="poles" element={<PolesListPage />} />
          <Route path="poles/new" element={<CreatePolePage />} />
                <Route path="poles/:code" element={<PoleDetailPage />} />
                <Route path="poles/:code/edit" element={<UpdatePolePage />} />
          <Route path="issues" element={<IssuesListPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


