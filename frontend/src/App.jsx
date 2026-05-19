// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { IncidentsPage } from "./pages/IncidentsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/incidents" replace />} />
          <Route path="/incidents" element={<IncidentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;