import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import OperationList from "@/pages/OperationList";
import OperationDetail from "@/pages/OperationDetail";
import Login from "@/pages/Login"; // Yeni Login sayfası
import { initSocket } from "@/services/socket";

// Basit rota koruması (Token kontrolü)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    // WebSocket bağlantısını sadece token varsa veya genel bağlantı olarak başlat
    // Not: Gerçek uygulamada socket auth handshake'i de yapılabilir
    initSocket();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Login Rotası - Layout dışında tutuyoruz ki tam ekran olsun */}
          <Route path="/login" element={<Login />} />

          {/* Korumalı Rotalar */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/operations" element={
            <ProtectedRoute>
              <Layout>
                <OperationList />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/operations/:id" element={
            <ProtectedRoute>
              <Layout>
                <OperationDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/customers" element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Customers Page - Coming Soon</h2></div>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Vehicles Page - Coming Soon</h2></div>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;