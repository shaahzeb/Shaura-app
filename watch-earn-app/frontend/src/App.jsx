import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AmbientCoinBackground from "./components/AmbientCoinBackground";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import WatchAds from "./pages/WatchAds";
import Games from "./pages/Games";
import Offers from "./pages/Offers";
import Wallet from "./pages/Wallet";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <AmbientCoinBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch-ads"
              element={
                <ProtectedRoute>
                  <WatchAds />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <Games />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers"
              element={
                <ProtectedRoute>
                  <Offers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
      <Analytics />
    </AuthProvider>
  );
}
