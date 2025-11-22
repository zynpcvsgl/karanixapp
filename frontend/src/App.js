import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import OperationList from "@/pages/OperationList";
import OperationDetail from "@/pages/OperationDetail";
import { initSocket } from "@/services/socket";

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    initSocket();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/operations" element={<OperationList />} />
            <Route path="/operations/:id" element={<OperationDetail />} />
            <Route path="/customers" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Customers Page - Coming Soon</h2></div>} />
            <Route path="/vehicles" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900">Vehicles Page - Coming Soon</h2></div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
