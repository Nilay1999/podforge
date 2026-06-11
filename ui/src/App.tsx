import { Routes, Route, Navigate } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/common/AppLayout";
import { ConfigMapsPage } from "./pages/ConfigMapsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { EventsPage } from "./pages/EventsPage";
import { LoginPage } from "./pages/LoginPage";
import { NamespacesPage } from "./pages/NamespacesPage";
import { PodsPage } from "./pages/PodsPage";
import { SecretsPage } from "./pages/SecretsPage";
import { ServicesPage } from "./pages/ServicesPage";

function ProtectedRoutes() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="/pods" element={<PodsPage />} />
        <Route path="/configmaps" element={<ConfigMapsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/secrets" element={<SecretsPage />} />
        <Route path="/namespaces" element={<NamespacesPage />} />
        <Route path="/events" element={<EventsPage />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default App;
