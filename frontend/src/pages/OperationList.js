import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { operationsAPI } from '../services/api';
import { format, addDays } from 'date-fns';

const OperationList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'today');

  useEffect(() => {
    loadOperations();
  }, [filter]);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      const date = filter === 'today' 
        ? format(today, 'yyyy-MM-dd') 
        : format(tomorrow, 'yyyy-MM-dd');
      
      const response = await operationsAPI.getOperations(date);
      setOperations(response.data || []);
    } catch (error) {
      console.error('Error loading operations:', error);
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchParams({ filter: newFilter });
  };

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
    <div className="space-y-6" data-testid="operation-list-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
        <p className="text-gray-600 mt-2">Manage and track all operations</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-2 inline-flex space-x-2" data-testid="operation-filter">
        <button
          onClick={() => handleFilterChange('today')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            filter === 'today'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="filter-today"
        >
          Today
        </button>
        <button
          onClick={() => handleFilterChange('tomorrow')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            filter === 'tomorrow'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="filter-tomorrow"
        >
          Tomorrow
        </button>
      </div>

      {/* Operations List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center" data-testid="loading-state">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading operations...</p>
        </div>
      ) : operations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center" data-testid="empty-state">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No operations found</h3>
          <p className="text-gray-600">There are no operations scheduled for {filter}.</p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="operations-grid">
          {operations.map((operation) => (
            <Link
              key={operation.id}
              to={`/operations/${operation.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-blue-300"
              data-testid={`operation-card-${operation.code}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-mono font-semibold text-gray-500">
                      {operation.code}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(operation.status)}`}>
                      {operation.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {operation.tour_name}
                  </h3>
                  
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
                      <span className="text-sm">
                        {operation.checked_in_count} / {operation.total_pax} checked in
                      </span>
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
