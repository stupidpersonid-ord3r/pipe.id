import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import AllTrades from "../pages/TradeJournal/AllTrades";
import AddTrade from "../pages/TradeJournal/AddTrade";
import TradeDetail from "../pages/TradeJournal/TradeDetail";
import Analytics from "../pages/Analytics";
import Charts from "../pages/Charts";
import Accounts from "../pages/Accounts";
import SettingsLayout from "../pages/Settings/SettingsLayout";
import SettingsHome from "../pages/Settings/SettingsHome";
import SettingsProfile from "../pages/Settings/Profile";
import SettingsAppearance from "../pages/Settings/Appearance";
import SettingsSecurity from "../pages/Settings/Security";
import SettingsData from "../pages/Settings/Data";

function AppRoutes() {
  return (
    <Routes>
      {/* =====================================================
          AUTH
      ====================================================== */}

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      {/* =====================================================
          PROTECTED APP
      ====================================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />

          <Route path="/trades" element={<AllTrades />} />
          <Route path="/trades/new" element={<AddTrade />} />
          <Route path="/trades/:id" element={<TradeDetail />} />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsHome />} />
            <Route path="profile" element={<SettingsProfile />} />
            <Route path="appearance" element={<SettingsAppearance />} />
            <Route path="security" element={<SettingsSecurity />} />
            <Route path="data" element={<SettingsData />} />
          </Route>
        </Route>
      </Route>

      {/* =====================================================
          DEFAULT ROUTES
      ====================================================== */}

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;
