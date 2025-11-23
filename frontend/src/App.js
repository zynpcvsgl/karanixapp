import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import OperationList from "@/pages/OperationList";
import OperationDetail from "@/pages/OperationDetail";
import Customers from "@/pages/Customers"; // Eklendi
import Vehicles from "@/pages/Vehicles";   // Eklendi
import Login from "@/pages/Login";
import { initSocket } from "@/services/socket";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    initSocket();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

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
          
          {/* GÜNCELLENEN KISIMLAR */}
          <Route path="/customers" element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/vehicles" element={
            <ProtectedRoute>
              <Layout>
                <Vehicles />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;