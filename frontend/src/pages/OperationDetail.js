import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Clock, Calendar, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { operationsAPI, passengersAPI } from '../services/api';
import { getSocket, joinOperationRoom } from '../services/socket';
import GoogleMapComponent from '../components/GoogleMapComponent';

const OperationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [operation, setOperation] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [vehiclePosition, setVehiclePosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);

  useEffect(() => {
    loadOperationDetail();
    
    // Setup WebSocket
    const socket = getSocket();
    joinOperationRoom(id);
    
    // Listen for vehicle position updates
    socket.on('vehicle_position', (data) => {
      if (data.operation_id === id) {
        console.log('🚍 Vehicle position updated:', data);
        setVehiclePosition({
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          speed: data.speed
        });
      }
    });
    
    // Listen for passenger check-in events
    socket.on('pax_checked_in', (data) => {
      if (data.operation_id === id) {
        console.log('✅ Passenger checked in:', data);
        // Reload operation to get updated count
        loadOperationDetail();
      }
    });
    
    // Listen for alerts
    socket.on('check_in_alert', (data) => {
      if (data.operation_id === id) {
        console.warn('🚨 Check-in alert:', data);
        // Show alert notification (you can implement toast here)
        alert(data.message);
      }
    });
    
    return () => {
      socket.off('vehicle_position');
      socket.off('pax_checked_in');
      socket.off('check_in_alert');
    };
  }, [id]);

  const loadOperationDetail = async () => {
    setLoading(true);
    try {
      const response = await operationsAPI.getOperationDetail(id);
      const data = response.data;
      
      setOperation(data);
      setPassengers(data.passengers || []);
      setVehicle(data.vehicle);
      
      // Set initial vehicle position
      if (data.vehicle && data.vehicle.last_ping) {
        setVehiclePosition({
          lat: data.vehicle.last_ping.lat,
          lng: data.vehicle.last_ping.lng,
          heading: data.vehicle.last_ping.heading || 0,
          speed: data.vehicle.last_ping.speed || 0
        });
      }
    } catch (error) {
      console.error('Error loading operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (paxId) => {
    setCheckingIn(paxId);
    try {
      await passengersAPI.checkin(paxId, {
        method: 'manual',
        gps: vehiclePosition || { lat: 0, lng: 0 }
      });
      // The WebSocket event will trigger a reload
    } catch (error) {
      console.error('Error checking in passenger:', error);
      alert('Failed to check in passenger');
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Operation not found</h2>
        <button
          onClick={() => navigate('/operations')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Operations
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" data-testid="operation-detail-page">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/operations')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-sm font-mono font-semibold text-gray-500">
              {operation.code}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(operation.status)}`}>
              {operation.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{operation.tour_name}</h1>
        </div>
      </div>

      {/* Operation Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center text-gray-600 mb-2">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Date</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{operation.date}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center text-gray-600 mb-2">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Start Time</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{operation.start_time}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center text-gray-600 mb-2">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Passengers</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {operation.checked_in_count} / {operation.total_pax}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Vehicle</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {vehicle ? vehicle.plate_number : 'N/A'}
          </p>
        </div>
      </div>

      {/* Map and Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Live Tracking</h2>
          </div>
          <div className="h-[600px]" data-testid="operation-map">
            <GoogleMapComponent
              passengers={passengers}
              vehiclePosition={vehiclePosition}
              operationRoute={operation.route}
            />
          </div>
        </div>

        {/* Passenger Manifest */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Passenger Manifest</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '600px' }} data-testid="passenger-manifest">
            {passengers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No passengers</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {passengers.map((pax) => (
                  <div key={pax.pax_id} className="p-4 hover:bg-gray-50 transition-colors" data-testid={`passenger-${pax.seat_no}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">{pax.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {pax.seat_no}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{pax.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {pax.pickup_point.address}
                        </p>
                      </div>
                      {pax.status === 'checked_in' ? (
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" data-testid={`checked-in-${pax.seat_no}`} />
                      ) : (
                        <button
                          onClick={() => handleCheckin(pax.pax_id)}
                          disabled={checkingIn === pax.pax_id}
                          className="flex-shrink-0 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid={`checkin-button-${pax.seat_no}`}
                        >
                          {checkingIn === pax.pax_id ? 'Checking...' : 'Check-in'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {pax.status === 'checked_in' ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Checked In
                        </span>
                      ) : pax.status === 'no_show' ? (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                          No Show
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationDetail;
