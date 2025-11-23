import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import { operationsAPI, vehiclesAPI } from '../services/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeOperations: 0,
    totalPax: 0,
    activeVehicles: 0,
    checkInRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Bugünün tarihini al
      const today = format(new Date(), 'yyyy-MM-dd');

      // Paralel olarak operasyonları ve araçları çek
      const [opsResponse, vehiclesResponse] = await Promise.all([
        operationsAPI.getOperations(today),
        vehiclesAPI.getVehicles()
      ]);

      const operations = opsResponse.data || [];
      const vehicles = vehiclesResponse.data || [];

      // İstatistikleri hesapla
      const activeOps = operations.filter(op => op.status === 'active').length;
      
      // Toplam yolcu ve check-in sayısı (Bugünkü operasyonlardan)
      const totalPax = operations.reduce((sum, op) => sum + (op.total_pax || 0), 0);
      const totalCheckedIn = operations.reduce((sum, op) => sum + (op.checked_in_count || 0), 0);
      
      // Check-in oranı
      const rate = totalPax > 0 ? Math.round((totalCheckedIn / totalPax) * 100) : 0;

      // Aktif araçlar (status: 'in_service')
      const activeVehiclesCount = vehicles.filter(v => v.status === 'in_service').length;

      setStats({
        activeOperations: activeOps,
        totalPax: totalPax, // veya totalCheckedIn gösterilebilir
        activeVehicles: activeVehiclesCount,
        checkInRate: rate
      });

    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kontrol Paneli</h1>
        <p className="text-gray-600 mt-2">Gerçek zamanlı operasyon takibi ve izleme</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Operasyonlar</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '-' : stats.activeOperations}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Yolcu (Bugün)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '-' : stats.totalPax}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hizmetteki Araçlar</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '-' : stats.activeVehicles}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Check-in Oranı</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '-' : `%${stats.checkInRate}`}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/operations?filter=today"
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            data-testid="view-today-operations"
          >
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Bugünkü Operasyonlar</h3>
              <p className="text-sm text-gray-600">Bugünün tüm operasyonlarını gör</p>
            </div>
          </Link>

          <Link
            to="/operations?filter=tomorrow"
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            data-testid="view-tomorrow-operations"
          >
            <Calendar className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Yarınki Operasyonlar</h3>
              <p className="text-sm text-gray-600">Planlanan operasyonları incele</p>
            </div>
          </Link>

          <Link
            to="/operations"
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            data-testid="view-all-operations"
          >
            <MapPin className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Canlı Takip</h3>
              <p className="text-sm text-gray-600">Araçları haritada izle</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;