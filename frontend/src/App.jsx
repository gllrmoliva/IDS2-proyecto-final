// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { IncidentsPage } from "./pages/IncidentsPage";
import { ReportIncidentPage } from "./pages/ReportIncidentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/incidents" replace />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/report" element={<ReportIncidentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;