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
import CreatePoleReplacementPage from './pages/CreatePoleReplacementPage';
import PoleReplacementsListPage from './pages/PoleReplacementsListPage';
import ParksListPage from './pages/ParksListPage';
import ParkDetailPage from './pages/ParkDetailPage';
import CreateParkPage from './pages/CreateParkPage';
import UpdateParkPage from './pages/UpdateParkPage';
import IssuesListPage from './pages/IssuesListPage';
import ParkIssuesListPage from './pages/ParkIssuesListPage';
import ParkingLotsListPage from './pages/ParkingLotsListPage';
import ParkingLotDetailPage from './pages/ParkingLotDetailPage';
import CreateParkingLotPage from './pages/CreateParkingLotPage';
import UpdateParkingLotPage from './pages/UpdateParkingLotPage';
import ParkingLotIssuesListPage from './pages/ParkingLotIssuesListPage';
import MuseumsListPage from './pages/MuseumsListPage';
import MuseumDetailPage from './pages/MuseumDetailPage';
import CreateMuseumPage from './pages/CreateMuseumPage';
import UpdateMuseumPage from './pages/UpdateMuseumPage';
import MuseumIssuesListPage from './pages/MuseumIssuesListPage';
import PublicToiletsListPage from './pages/PublicToiletsListPage';
import PublicToiletDetailPage from './pages/PublicToiletDetailPage';
import CreatePublicToiletPage from './pages/CreatePublicToiletPage';
import UpdatePublicToiletPage from './pages/UpdatePublicToiletPage';
import PublicToiletIssuesListPage from './pages/PublicToiletIssuesListPage';
import FootballFieldsListPage from './pages/FootballFieldsListPage';
import FootballFieldDetailPage from './pages/FootballFieldDetailPage';
import CreateFootballFieldPage from './pages/CreateFootballFieldPage';
import UpdateFootballFieldPage from './pages/UpdateFootballFieldPage';
import FootballFieldIssuesListPage from './pages/FootballFieldIssuesListPage';
import RiverSideProjectsListPage from './pages/RiverSideProjectsListPage';
import RiverSideProjectDetailPage from './pages/RiverSideProjectDetailPage';
import CreateRiverSideProjectPage from './pages/CreateRiverSideProjectPage';
import UpdateRiverSideProjectPage from './pages/UpdateRiverSideProjectPage';
import RiverSideProjectIssuesListPage from './pages/RiverSideProjectIssuesListPage';
import MaintenancePage from './pages/MaintenancePage';
import MaintenanceDetailPage from './pages/MaintenanceDetailPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import InventoryListPage from './pages/InventoryListPage';
import InventoryDetailPage from './pages/InventoryDetailPage';
import CreateInventoryItemPage from './pages/CreateInventoryItemPage';
import UpdateInventoryItemPage from './pages/UpdateInventoryItemPage';
import MaterialRequestsPage from './pages/MaterialRequestsPage';
import MaterialRequestDetailPage from './pages/MaterialRequestDetailPage';
import PurchaseRequestsPage from './pages/PurchaseRequestsPage';
import CategoryListPage from './pages/CategoryListPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import CreateCategoryPage from './pages/CreateCategoryPage';
import UpdateCategoryPage from './pages/UpdateCategoryPage';
import AccidentsListPage from './pages/AccidentsListPage';
import AccidentDetailPage from './pages/AccidentDetailPage';
import AccidentReportsPage from './pages/AccidentReportsPage';
import DamagedComponentsPage from './pages/DamagedComponentsPage';
import CreateAccidentPage from './pages/CreateAccidentPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';

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
          <Route path="/replacements" element={<PoleReplacementsListPage />} />
          <Route path="/replacements/new" element={<CreatePoleReplacementPage />} />
          <Route path="/poles/:code" element={<PoleDetailPage />} />
          <Route path="/poles/:code/edit" element={<UpdatePolePage />} />
          <Route path="/parks" element={<ParksListPage />} />
          <Route path="/parks/new" element={<CreateParkPage />} />
          <Route path="/parks/:code" element={<ParkDetailPage />} />
          <Route path="/parks/:code/edit" element={<UpdateParkPage />} />
          <Route path="/issues" element={<IssuesListPage />} />
          <Route path="/park-issues" element={<ParkIssuesListPage />} />
          <Route path="/parking-lots" element={<ParkingLotsListPage />} />
          <Route path="/parking-lots/new" element={<CreateParkingLotPage />} />
          <Route path="/parking-lots/:code" element={<ParkingLotDetailPage />} />
          <Route path="/parking-lots/:code/edit" element={<UpdateParkingLotPage />} />
          <Route path="/parking-lot-issues" element={<ParkingLotIssuesListPage />} />
          <Route path="/museums" element={<MuseumsListPage />} />
          <Route path="/museums/new" element={<CreateMuseumPage />} />
          <Route path="/museums/:code" element={<MuseumDetailPage />} />
          <Route path="/museums/:code/edit" element={<UpdateMuseumPage />} />
          <Route path="/museum-issues" element={<MuseumIssuesListPage />} />
          <Route path="/public-toilets" element={<PublicToiletsListPage />} />
          <Route path="/public-toilets/new" element={<CreatePublicToiletPage />} />
          <Route path="/public-toilets/:code" element={<PublicToiletDetailPage />} />
          <Route path="/public-toilets/:code/edit" element={<UpdatePublicToiletPage />} />
          <Route path="/toilet-issues" element={<PublicToiletIssuesListPage />} />
          <Route path="/football-fields" element={<FootballFieldsListPage />} />
          <Route path="/football-fields/new" element={<CreateFootballFieldPage />} />
          <Route path="/football-fields/:code" element={<FootballFieldDetailPage />} />
          <Route path="/football-fields/:code/edit" element={<UpdateFootballFieldPage />} />
          <Route path="/football-field-issues" element={<FootballFieldIssuesListPage />} />
          <Route path="/river-side-projects" element={<RiverSideProjectsListPage />} />
          <Route path="/river-side-projects/new" element={<CreateRiverSideProjectPage />} />
          <Route path="/river-side-projects/:code" element={<RiverSideProjectDetailPage />} />
          <Route path="/river-side-projects/:code/edit" element={<UpdateRiverSideProjectPage />} />
          <Route path="/river-issues" element={<RiverSideProjectIssuesListPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/inventory" element={<InventoryListPage />} />
          <Route path="/inventory/new" element={<CreateInventoryItemPage />} />
          <Route path="/inventory/:code" element={<InventoryDetailPage />} />
          <Route path="/inventory/:code/edit" element={<UpdateInventoryItemPage />} />
          <Route path="/material-requests" element={<MaterialRequestsPage />} />
          <Route path="/material-requests/:id" element={<MaterialRequestDetailPage />} />
          <Route path="/purchase-requests" element={<PurchaseRequestsPage />} />
          <Route path="/categories" element={<CategoryListPage />} />
          <Route path="/categories/new" element={<CreateCategoryPage />} />
          <Route path="/categories/:id" element={<CategoryDetailPage />} />
          <Route path="/categories/:id/edit" element={<UpdateCategoryPage />} />
          <Route path="/accidents" element={<AccidentsListPage />} />
          <Route path="/accidents/create" element={<CreateAccidentPage />} />
          <Route path="/accidents/:id" element={<AccidentDetailPage />} />
          <Route path="/accident-reports" element={<AccidentReportsPage />} />
          <Route path="/damaged-components" element={<DamagedComponentsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


