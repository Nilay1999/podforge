import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/common/AppLayout";
import { ConfigMapsPage } from "./pages/ConfigMapsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { PodsPage } from "./pages/PodsPage";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="/pods" element={<PodsPage />} />
        <Route path="/configmaps" element={<ConfigMapsPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
