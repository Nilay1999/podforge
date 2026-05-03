import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/common/AppLayout";
import { ConfigMapsPage } from "./pages/ConfigMapsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { NamespacesPage } from "./pages/NamespacesPage";
import { PodsPage } from "./pages/PodsPage";
import { SecretsPage } from "./pages/SecretsPage";
import { ServicesPage } from "./pages/ServicesPage";

function App() {
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
      </Routes>
    </AppLayout>
  );
}

export default App;
