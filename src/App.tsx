import { lazy, Suspense } from 'react';
import { Center, Loader } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SubcityPolesMapPage = lazy(() => import('./pages/SubcityPolesMapPage'));
const PolesListPage = lazy(() => import('./pages/PolesListPage'));
const PoleDetailPage = lazy(() => import('./pages/PoleDetailPage'));
const CreatePolePage = lazy(() => import('./pages/CreatePolePage'));
const UpdatePolePage = lazy(() => import('./pages/UpdatePolePage'));
const CreatePoleReplacementPage = lazy(() => import('./pages/CreatePoleReplacementPage'));
const PoleReplacementsListPage = lazy(() => import('./pages/PoleReplacementsListPage'));
const ParksListPage = lazy(() => import('./pages/ParksListPage'));
const ParkDetailPage = lazy(() => import('./pages/ParkDetailPage'));
const CreateParkPage = lazy(() => import('./pages/CreateParkPage'));
const UpdateParkPage = lazy(() => import('./pages/UpdateParkPage'));
const IssuesListPage = lazy(() => import('./pages/IssuesListPage'));
const ParkIssuesListPage = lazy(() => import('./pages/ParkIssuesListPage'));
const ParkingLotsListPage = lazy(() => import('./pages/ParkingLotsListPage'));
const ParkingLotDetailPage = lazy(() => import('./pages/ParkingLotDetailPage'));
const CreateParkingLotPage = lazy(() => import('./pages/CreateParkingLotPage'));
const UpdateParkingLotPage = lazy(() => import('./pages/UpdateParkingLotPage'));
const ParkingLotIssuesListPage = lazy(() => import('./pages/ParkingLotIssuesListPage'));
const MuseumsListPage = lazy(() => import('./pages/MuseumsListPage'));
const MuseumDetailPage = lazy(() => import('./pages/MuseumDetailPage'));
const CreateMuseumPage = lazy(() => import('./pages/CreateMuseumPage'));
const UpdateMuseumPage = lazy(() => import('./pages/UpdateMuseumPage'));
const MuseumIssuesListPage = lazy(() => import('./pages/MuseumIssuesListPage'));
const PublicToiletsListPage = lazy(() => import('./pages/PublicToiletsListPage'));
const PublicToiletDetailPage = lazy(() => import('./pages/PublicToiletDetailPage'));
const CreatePublicToiletPage = lazy(() => import('./pages/CreatePublicToiletPage'));
const UpdatePublicToiletPage = lazy(() => import('./pages/UpdatePublicToiletPage'));
const PublicToiletIssuesListPage = lazy(() => import('./pages/PublicToiletIssuesListPage'));
const FootballFieldsListPage = lazy(() => import('./pages/FootballFieldsListPage'));
const FootballFieldDetailPage = lazy(() => import('./pages/FootballFieldDetailPage'));
const CreateFootballFieldPage = lazy(() => import('./pages/CreateFootballFieldPage'));
const UpdateFootballFieldPage = lazy(() => import('./pages/UpdateFootballFieldPage'));
const FootballFieldIssuesListPage = lazy(() => import('./pages/FootballFieldIssuesListPage'));
const RiverSideProjectsListPage = lazy(() => import('./pages/RiverSideProjectsListPage'));
const RiverSideProjectDetailPage = lazy(() => import('./pages/RiverSideProjectDetailPage'));
const CreateRiverSideProjectPage = lazy(() => import('./pages/CreateRiverSideProjectPage'));
const UpdateRiverSideProjectPage = lazy(() => import('./pages/UpdateRiverSideProjectPage'));
const RiverSideProjectIssuesListPage = lazy(() => import('./pages/RiverSideProjectIssuesListPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const MaintenanceDetailPage = lazy(() => import('./pages/MaintenanceDetailPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const InventoryListPage = lazy(() => import('./pages/InventoryListPage'));
const InventoryDetailPage = lazy(() => import('./pages/InventoryDetailPage'));
const CreateInventoryItemPage = lazy(() => import('./pages/CreateInventoryItemPage'));
const UpdateInventoryItemPage = lazy(() => import('./pages/UpdateInventoryItemPage'));
const MaterialRequestsPage = lazy(() => import('./pages/MaterialRequestsPage'));
const MaterialRequestDetailPage = lazy(() => import('./pages/MaterialRequestDetailPage'));
const PurchaseRequestsPage = lazy(() => import('./pages/PurchaseRequestsPage'));
const CategoryListPage = lazy(() => import('./pages/CategoryListPage'));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage'));
const CreateCategoryPage = lazy(() => import('./pages/CreateCategoryPage'));
const UpdateCategoryPage = lazy(() => import('./pages/UpdateCategoryPage'));
const AccidentsListPage = lazy(() => import('./pages/AccidentsListPage'));
const AccidentDetailPage = lazy(() => import('./pages/AccidentDetailPage'));
const AccidentReportsPage = lazy(() => import('./pages/AccidentReportsPage'));
const DamagedComponentsPage = lazy(() => import('./pages/DamagedComponentsPage'));
const CreateAccidentPage = lazy(() => import('./pages/CreateAccidentPage'));
const ComponentsListPage = lazy(() => import('./pages/ComponentsListPage'));
const ComponentDetailPage = lazy(() => import('./pages/ComponentDetailPage'));
const CreateComponentPage = lazy(() => import('./pages/CreateComponentPage'));
const UpdateComponentPage = lazy(() => import('./pages/UpdateComponentPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ReportAccidentPage = lazy(() => import('./pages/ReportAccidentPage'));

function RouteLoadingFallback() {
  return (
    <Center style={{ minHeight: '50vh' }}>
      <Loader size="lg" />
    </Center>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/report-accident" element={<ReportAccidentPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/poles-map" element={<SubcityPolesMapPage />} />
            <Route path="/poles" element={<PolesListPage />} />
            <Route path="/poles/new" element={<CreatePolePage />} />
            <Route path="/replacements" element={<PoleReplacementsListPage />} />
            <Route path="/replacements/new" element={<CreatePoleReplacementPage />} />
            <Route path="/components" element={<ComponentsListPage />} />
            <Route path="/components/new" element={<CreateComponentPage />} />
            <Route path="/components/:id" element={<ComponentDetailPage />} />
            <Route path="/components/:id/edit" element={<UpdateComponentPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
