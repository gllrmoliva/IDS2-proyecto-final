// App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { IncidentsPage } from "./pages/IncidentsPage";
import { ReportIncidentPage } from "./pages/ReportIncidentPage";
import { CasesPage } from "./pages/CasesPage";
import { CreateCasePage } from "./pages/CreateCasePage";
import LoginPage from "./pages/LoginPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { CreateHitoPage } from "./pages/CreateHitoPage"; 
import { StudentsPage } from "./pages/StudentsPage";
import { StudentProfilePage } from "./pages/StudentProfilePage";

// Auth Guard Component
const ProtectedRoute = () => {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    // Si no se encuentra token en localStorage, redirigir a login
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} /> 
        
        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          {/* Main Layout Wrapper */}
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/incidents" replace />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/report" element={<ReportIncidentPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/new"            element={<CreateCasePage />} />
            <Route path="/cases/:id"              element={<CaseDetailPage />} />
            <Route path="/cases/:id/nuevo-hito"   element={<CreateHitoPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
