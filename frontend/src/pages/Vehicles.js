import React, { useState, useEffect } from 'react';
import { Car, Plus, Navigation, MapPin } from 'lucide-react';
import { vehiclesAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate_number: '',
    model: '',
    capacity: ''
  });

  useEffect(() => {
    loadVehicles();

    // Socket dinlemesi - Araç hareket edince listeyi güncelle
    const socket = getSocket();
    socket.on('vehicle_position', (data) => {
      setVehicles(prev => prev.map(v => {
        if (v.vehicle_id === data.vehicle_id) {
          return {
            ...v,
            last_ping: {
              ...v.last_ping,
              lat: data.lat,
              lng: data.lng,
              speed: data.speed,
              timestamp: data.timestamp
            }
          };
        }
        return v;
      }));
    });

    return () => {
      socket.off('vehicle_position');
    };
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehiclesAPI.getVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await vehiclesAPI.createVehicle({
        ...newVehicle,
        capacity: parseInt(newVehicle.capacity),
        status: 'available'
      });
      setIsDialogOpen(false);
      setNewVehicle({ plate_number: '', model: '', capacity: '' });
      loadVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Araç oluşturulamadı');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'in_service': 'bg-green-100 text-green-800 hover:bg-green-100',
      'available': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'maintenance': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      'offline': 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    };
    return (
      <Badge className={styles[status] || styles['offline']} variant="outline">
        {status.toUpperCase().replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Araç Filosu</h1>
          <p className="text-gray-600 mt-2">Araç durumu ve konum takibi</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Araç
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Araç Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Plaka</Label>
                <Input 
                  id="plate" 
                  value={newVehicle.plate_number}
                  onChange={(e) => setNewVehicle({...newVehicle, plate_number: e.target.value})}
                  placeholder="34 ABC 123"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input 
                  id="model" 
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                  placeholder="Mercedes Sprinter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasite</Label>
                <Input 
                  id="capacity" 
                  type="number"
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plaka / Model</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Konum Bilgisi</TableHead>
                <TableHead>Kapasite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Henüz araç eklenmemiş.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.vehicle_id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 rounded mr-3">
                          <Car className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{vehicle.plate_number}</div>
                          <div className="text-sm text-gray-500">{vehicle.model}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(vehicle.status)}
                    </TableCell>
                    <TableCell>
                      {vehicle.last_ping?.lat ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-blue-600">
                            <Navigation className="h-3 w-3 mr-1" />
                            {vehicle.last_ping.speed} km/h
                          </div>
                          <div className="flex items-center text-gray-500 text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {vehicle.last_ping.lat.toFixed(4)}, {vehicle.last_ping.lng.toFixed(4)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sinyal Yok</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{vehicle.capacity} Pax</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Vehicles;