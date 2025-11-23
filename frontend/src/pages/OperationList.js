import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Users, Clock, ChevronRight, Plus, Filter } from 'lucide-react';
import { operationsAPI, vehiclesAPI } from '../services/api';
import { format, addDays, isValid, parseISO } from 'date-fns'; // isValid eklendi

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Varsayılan tarih formatı
const DATE_FORMAT = 'yyyy-MM-dd';

const OperationList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [operations, setOperations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // URL'den tarihi al, yoksa bugünü kullan
  const urlDate = searchParams.get('date');
  const initialDate = urlDate && isValid(parseISO(urlDate)) 
    ? urlDate 
    : format(new Date(), DATE_FORMAT);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  // Modal state'leri
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOp, setNewOp] = useState({
    tour_name: '',
    date: format(new Date(), DATE_FORMAT),
    start_time: '09:00',
    total_pax: 15,
    vehicle_id: ''
  });

  // Tarih değiştiğinde veya sayfa yüklendiğinde
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // URL'i güncelle
        setSearchParams({ date: selectedDate });

        // Operasyonları ve Araçları paralel çek
        const [opsResponse, vehiclesResponse] = await Promise.all([
          operationsAPI.getOperations(selectedDate),
          vehiclesAPI.getVehicles()
        ]);

        setOperations(opsResponse.data || []);
        setVehicles(vehiclesResponse.data || []);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        setOperations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, setSearchParams]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await operationsAPI.createOperation(newOp);
      setIsDialogOpen(false);
      
      // Eğer oluşturulan operasyonun tarihi, şu an görüntülenen tarih ile aynıysa listeyi yenile
      if (newOp.date === selectedDate) {
        const response = await operationsAPI.getOperations(selectedDate);
        setOperations(response.data || []);
      } else {
        // Değilse o tarihe git
        setSelectedDate(newOp.date);
      }

      // Formu sıfırla
      setNewOp({
        tour_name: '',
        date: format(new Date(), DATE_FORMAT),
        start_time: '09:00',
        total_pax: 15,
        vehicle_id: ''
      });
      
      alert('Operasyon başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Operasyon oluşturma hatası:', error);
      alert('Operasyon oluşturulamadı.');
    }
  };

  // Kısayol butonları için
  const setQuickDate = (type) => {
    const today = new Date();
    let targetDate = '';
    
    if (type === 'today') {
      targetDate = format(today, DATE_FORMAT);
    } else if (type === 'tomorrow') {
      targetDate = format(addDays(today, 1), DATE_FORMAT);
    }
    
    setSelectedDate(targetDate);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    const statuses = { 'active': 'AKTİF', 'planned': 'PLANLANDI', 'completed': 'TAMAMLANDI', 'cancelled': 'İPTAL' };
    return statuses[status] || status.toUpperCase();
  };

  return (
    <div className="space-y-6" data-testid="operation-list-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operasyonlar</h1>
          <p className="text-gray-600 mt-2">Tüm operasyonları yönetin ve takip edin</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Operasyon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Operasyon Planla</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tour_name">Tur Adı</Label>
                <Input 
                  id="tour_name" 
                  value={newOp.tour_name}
                  onChange={(e) => setNewOp({...newOp, tour_name: e.target.value})}
                  placeholder="Örn: Boğaz Turu"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Tarih</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newOp.date}
                    onChange={(e) => setNewOp({...newOp, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start_time">Saat</Label>
                  <Input 
                    id="start_time" 
                    type="time"
                    value={newOp.start_time}
                    onChange={(e) => setNewOp({...newOp, start_time: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_pax">Tahmini Yolcu Sayısı</Label>
                <Input 
                  id="total_pax" 
                  type="number"
                  min="1"
                  value={newOp.total_pax}
                  onChange={(e) => setNewOp({...newOp, total_pax: e.target.value})}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle">Atanacak Araç</Label>
                <select
                  id="vehicle"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newOp.vehicle_id}
                  onChange={(e) => setNewOp({...newOp, vehicle_id: e.target.value})}
                >
                  <option value="">Araç Seçiniz (Opsiyonel)</option>
                  {vehicles.map((v) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.plate_number} - {v.model} ({v.capacity} Pax)
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 text-white">Oluştur</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GELİŞMİŞ FİLTRELEME ALANI */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4" data-testid="operation-filter">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Tarih Filtresi:</span>
        </div>
        
        {/* Kısayol Butonları */}
        <div className="flex space-x-2">
          <button
            onClick={() => setQuickDate('today')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              selectedDate === format(new Date(), DATE_FORMAT)
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bugün
          </button>
          <button
            onClick={() => setQuickDate('tomorrow')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              selectedDate === format(addDays(new Date(), 1), DATE_FORMAT)
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yarın
          </button>
        </div>

        {/* Manuel Tarih Seçici */}
        <div className="flex-1 max-w-xs">
          <Input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      {/* Operasyon Listesi */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Operasyonlar yükleniyor...</p>
        </div>
      ) : operations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Operasyon bulunamadı</h3>
          <p className="text-gray-600">
            {selectedDate} tarihinde planlanmış operasyon yok.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {operations.map((operation) => (
            <Link
              key={operation.id}
              to={`/operations/${operation.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-mono font-semibold text-gray-500">{operation.code}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(operation.status)}`}>
                      {getStatusText(operation.status)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{operation.tour_name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">{operation.date}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">{operation.start_time}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">{operation.checked_in_count} / {operation.total_pax} Check-in</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${operation.total_pax > 0 ? (operation.checked_in_count / operation.total_pax) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperationList;