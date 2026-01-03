import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (email, password) => {
    const users = {
      'admin@gmail.com': { role: 'admin', password: 'admin1234' },
      'customer@gmail.com': { role: 'customer', password: 'customer1234' }
    };

    const userData = users[email];
    if (userData && userData.password === password) {
      const user = { email, role: userData.role };
      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, role: userData.role };
    }
    return { success: false };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Router Component
const Router = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return React.Children.map(children, child =>
    React.cloneElement(child, { currentPath, navigate })
  );
};

const Route = ({ path, component: Component, currentPath, navigate }) => {
  return currentPath === path ? <Component navigate={navigate} /> : null;
};

const ProtectedRoute = ({ path, component: Component, currentPath, navigate, allowedRole }) => {
  const { user } = useAuth();

  if (currentPath !== path) return null;

  if (!user) {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  if (allowedRole && user.role !== allowedRole) {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  return <Component navigate={navigate} />;
};

// Login Page
const LoginPage = ({ navigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = login(email, password);
    
    if (result.success) {
      if (result.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customers/dashboard');
      }
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-800">Restaurant Manager</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition font-medium"
          >
            Sign In
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium text-gray-700 mb-2">Test Credentials:</p>
          <p className="text-gray-600">Admin: admin@gmail.com / admin1234</p>
          <p className="text-gray-600">Customer: customer@gmail.com / customer1234</p>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ navigate }) => {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    type: 'Rajasthani',
    parkingLot: 'true',
    image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
  });
  const [editingId, setEditingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterParking, setFilterParking] = useState('');
  const searchInputRef = useRef(null);

  const restaurantTypes = ['Rajasthani', 'Gujarati', 'Mughlai', 'Jain', 'Thai', 'North Indian', 'South Indian'];

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadRestaurants = () => {
    const data = localStorage.getItem('evalData');
    if (data) {
      setRestaurants(JSON.parse(data));
    }
  };

  const saveRestaurants = (data) => {
    localStorage.setItem('evalData', JSON.stringify(data));
    setRestaurants(data);
  };

  const handleSubmit = () => {
    if (!formData.restaurantName.trim()) {
      alert('Restaurant name is required');
      return;
    }

    if (editingId) {
      const updated = restaurants.map(r =>
        r.restaurantID === editingId
          ? { ...formData, restaurantID: editingId, parkingLot: formData.parkingLot === 'true' }
          : r
      );
      saveRestaurants(updated);
      setShowSuccess('Restaurant updated successfully!');
      setEditingId(null);
    } else {
      const newId = restaurants.length > 0 ? Math.max(...restaurants.map(r => r.restaurantID)) + 1 : 1;
      const newRestaurant = {
        restaurantID: newId,
        ...formData,
        parkingLot: formData.parkingLot === 'true'
      };
      saveRestaurants([...restaurants, newRestaurant]);
      setShowSuccess('Restaurant added successfully!');
    }

    setFormData({
      restaurantName: '',
      address: '',
      type: 'Rajasthani',
      parkingLot: 'true',
      image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
    });

    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEdit = (restaurant) => {
    setFormData({
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      type: restaurant.type,
      parkingLot: restaurant.parkingLot.toString(),
      image: restaurant.image
    });
    setEditingId(restaurant.restaurantID);
  };

  const handleDelete = (id) => {
    setShowConfirm(id);
  };

  const confirmDelete = () => {
    const updated = restaurants.filter(r => r.restaurantID !== showConfirm);
    saveRestaurants(updated);
    setShowSuccess('Restaurant deleted successfully!');
    setShowConfirm(null);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesParking = !filterParking || r.parkingLot.toString() === filterParking;
    return matchesSearch && matchesType && matchesParking;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {restaurantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Lot</label>
            <select
              value={formData.parkingLot}
              onChange={(e) => setFormData({ ...formData, parkingLot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition font-medium"
          >
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  restaurantName: '',
                  address: '',
                  type: 'Rajasthani',
                  parkingLot: 'true',
                  image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
                });
              }}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition font-medium"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurants</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {showSuccess}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {restaurantTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterParking}
                  onChange={(e) => setFilterParking(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Parking</option>
                  <option value="true">With Parking</option>
                  <option value="false">No Parking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.restaurantID} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={restaurant.image}
                  alt={restaurant.restaurantName}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.address}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {restaurant.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      restaurant.parkingLot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {restaurant.parkingLot ? '🅿️ Parking' : 'No Parking'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.restaurantID)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this restaurant?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ navigate }) => {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    type: 'Rajasthani',
    parkingLot: 'true',
    image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
  });
  const [editingId, setEditingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterParking, setFilterParking] = useState('');
  const searchInputRef = useRef(null);

  const restaurantTypes = ['Rajasthani', 'Gujarati', 'Mughlai', 'Jain', 'Thai', 'North Indian', 'South Indian'];

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadRestaurants = () => {
    const data = localStorage.getItem('evalData');
    if (data) {
      setRestaurants(JSON.parse(data));
    }
  };

  const saveRestaurants = (data) => {
    localStorage.setItem('evalData', JSON.stringify(data));
    setRestaurants(data);
  };

  const handleSubmit = () => {
    if (!formData.restaurantName.trim()) {
      alert('Restaurant name is required');
      return;
    }

    if (editingId) {
      const updated = restaurants.map(r =>
        r.restaurantID === editingId
          ? { ...formData, restaurantID: editingId, parkingLot: formData.parkingLot === 'true' }
          : r
      );
      saveRestaurants(updated);
      setShowSuccess('Restaurant updated successfully!');
      setEditingId(null);
    } else {
      const newId = restaurants.length > 0 ? Math.max(...restaurants.map(r => r.restaurantID)) + 1 : 1;
      const newRestaurant = {
        restaurantID: newId,
        ...formData,
        parkingLot: formData.parkingLot === 'true'
      };
      saveRestaurants([...restaurants, newRestaurant]);
      setShowSuccess('Restaurant added successfully!');
    }

    setFormData({
      restaurantName: '',
      address: '',
      type: 'Rajasthani',
      parkingLot: 'true',
      image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
    });

    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEdit = (restaurant) => {
    setFormData({
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      type: restaurant.type,
      parkingLot: restaurant.parkingLot.toString(),
      image: restaurant.image
    });
    setEditingId(restaurant.restaurantID);
  };

  const handleDelete = (id) => {
    setShowConfirm(id);
  };

  const confirmDelete = () => {
    const updated = restaurants.filter(r => r.restaurantID !== showConfirm);
    saveRestaurants(updated);
    setShowSuccess('Restaurant deleted successfully!');
    setShowConfirm(null);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesParking = !filterParking || r.parkingLot.toString() === filterParking;
    return matchesSearch && matchesType && matchesParking;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {restaurantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Lot</label>
            <select
              value={formData.parkingLot}
              onChange={(e) => setFormData({ ...formData, parkingLot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition font-medium"
          >
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  restaurantName: '',
                  address: '',
                  type: 'Rajasthani',
                  parkingLot: 'true',
                  image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
                });
              }}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition font-medium"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurants</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {showSuccess}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {restaurantTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterParking}
                  onChange={(e) => setFilterParking(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Parking</option>
                  <option value="true">With Parking</option>
                  <option value="false">No Parking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.restaurantID} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={restaurant.image}
                  alt={restaurant.restaurantName}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.address}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {restaurant.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      restaurant.parkingLot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {restaurant.parkingLot ? '🅿️ Parking' : 'No Parking'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.restaurantID)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this restaurant?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ navigate }) => {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    type: 'Rajasthani',
    parkingLot: 'true',
    image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
  });
  const [editingId, setEditingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterParking, setFilterParking] = useState('');
  const searchInputRef = useRef(null);

  const restaurantTypes = ['Rajasthani', 'Gujarati', 'Mughlai', 'Jain', 'Thai', 'North Indian', 'South Indian'];

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadRestaurants = () => {
    const data = localStorage.getItem('evalData');
    if (data) {
      setRestaurants(JSON.parse(data));
    }
  };

  const saveRestaurants = (data) => {
    localStorage.setItem('evalData', JSON.stringify(data));
    setRestaurants(data);
  };

  const handleSubmit = () => {
    if (!formData.restaurantName.trim()) {
      alert('Restaurant name is required');
      return;
    }

    if (editingId) {
      const updated = restaurants.map(r =>
        r.restaurantID === editingId
          ? { ...formData, restaurantID: editingId, parkingLot: formData.parkingLot === 'true' }
          : r
      );
      saveRestaurants(updated);
      setShowSuccess('Restaurant updated successfully!');
      setEditingId(null);
    } else {
      const newId = restaurants.length > 0 ? Math.max(...restaurants.map(r => r.restaurantID)) + 1 : 1;
      const newRestaurant = {
        restaurantID: newId,
        ...formData,
        parkingLot: formData.parkingLot === 'true'
      };
      saveRestaurants([...restaurants, newRestaurant]);
      setShowSuccess('Restaurant added successfully!');
    }

    setFormData({
      restaurantName: '',
      address: '',
      type: 'Rajasthani',
      parkingLot: 'true',
      image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
    });

    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEdit = (restaurant) => {
    setFormData({
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      type: restaurant.type,
      parkingLot: restaurant.parkingLot.toString(),
      image: restaurant.image
    });
    setEditingId(restaurant.restaurantID);
  };

  const handleDelete = (id) => {
    setShowConfirm(id);
  };

  const confirmDelete = () => {
    const updated = restaurants.filter(r => r.restaurantID !== showConfirm);
    saveRestaurants(updated);
    setShowSuccess('Restaurant deleted successfully!');
    setShowConfirm(null);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesParking = !filterParking || r.parkingLot.toString() === filterParking;
    return matchesSearch && matchesType && matchesParking;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {restaurantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Lot</label>
            <select
              value={formData.parkingLot}
              onChange={(e) => setFormData({ ...formData, parkingLot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition font-medium"
          >
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  restaurantName: '',
                  address: '',
                  type: 'Rajasthani',
                  parkingLot: 'true',
                  image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
                });
              }}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition font-medium"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurants</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {showSuccess}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {restaurantTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterParking}
                  onChange={(e) => setFilterParking(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Parking</option>
                  <option value="true">With Parking</option>
                  <option value="false">No Parking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.restaurantID} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={restaurant.image}
                  alt={restaurant.restaurantName}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.address}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {restaurant.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      restaurant.parkingLot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {restaurant.parkingLot ? '🅿️ Parking' : 'No Parking'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.restaurantID)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this restaurant?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ navigate }) => {
  const { logout } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    type: 'Rajasthani',
    parkingLot: 'true',
    image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
  });
  const [editingId, setEditingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterParking, setFilterParking] = useState('');
  const searchInputRef = useRef(null);

  const restaurantTypes = ['Rajasthani', 'Gujarati', 'Mughlai', 'Jain', 'Thai', 'North Indian', 'South Indian'];

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadRestaurants = () => {
    const data = localStorage.getItem('evalData');
    if (data) {
      setRestaurants(JSON.parse(data));
    }
  };

  const saveRestaurants = (data) => {
    localStorage.setItem('evalData', JSON.stringify(data));
    setRestaurants(data);
  };

  const handleSubmit = () => {
    if (!formData.restaurantName.trim()) {
      alert('Restaurant name is required');
      return;
    }

    if (editingId) {
      const updated = restaurants.map(r =>
        r.restaurantID === editingId
          ? { ...formData, restaurantID: editingId, parkingLot: formData.parkingLot === 'true' }
          : r
      );
      saveRestaurants(updated);
      setShowSuccess('Restaurant updated successfully!');
      setEditingId(null);
    } else {
      const newId = restaurants.length > 0 ? Math.max(...restaurants.map(r => r.restaurantID)) + 1 : 1;
      const newRestaurant = {
        restaurantID: newId,
        ...formData,
        parkingLot: formData.parkingLot === 'true'
      };
      saveRestaurants([...restaurants, newRestaurant]);
      setShowSuccess('Restaurant added successfully!');
    }

    setFormData({
      restaurantName: '',
      address: '',
      type: 'Rajasthani',
      parkingLot: 'true',
      image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
    });
    const handleEdit = (restaurant) => {
    setFormData({
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      type: restaurant.type,
      parkingLot: restaurant.parkingLot.toString(),
      image: restaurant.image
    });
    setEditingId(restaurant.restaurantID);
  };

  const handleDelete = (id) => {
    setShowConfirm(id);
  };

  const confirmDelete = () => {
    const updated = restaurants.filter(r => r.restaurantID !== showConfirm);
    saveRestaurants(updated);
    setShowSuccess('Restaurant deleted successfully!');
    setShowConfirm(null);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesParking = !filterParking || r.parkingLot.toString() === filterParking;
    return matchesSearch && matchesType && matchesParking;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {restaurantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Lot</label>
            <select
              value={formData.parkingLot}
              onChange={(e) => setFormData({ ...formData, parkingLot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition font-medium"
          >
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  restaurantName: '',
                  address: '',
                  type: 'Rajasthani',
                  parkingLot: 'true',
                  image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
                });
              }}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition font-medium"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurants</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {showSuccess}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {restaurantTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterParking}
                  onChange={(e) => setFilterParking(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Parking</option>
                  <option value="true">With Parking</option>
                  <option value="false">No Parking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.restaurantID} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={restaurant.image}
                  alt={restaurant.restaurantName}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.address}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {restaurant.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      restaurant.parkingLot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {restaurant.parkingLot ? '🅿️ Parking' : 'No Parking'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.restaurantID)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this restaurant?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
    onst handleEdit = (restaurant) => {
    setFormData({
      restaurantName: restaurant.restaurantName,
      address: restaurant.address,
      type: restaurant.type,
      parkingLot: restaurant.parkingLot.toString(),
      image: restaurant.image
    });
    setEditingId(restaurant.restaurantID);
  };

  const handleDelete = (id) => {
    setShowConfirm(id);
  };

  const confirmDelete = () => {
    const updated = restaurants.filter(r => r.restaurantID !== showConfirm);
    saveRestaurants(updated);
    setShowSuccess('Restaurant deleted successfully!');
    setShowConfirm(null);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || r.type === filterType;
    const matchesParking = !filterParking || r.parkingLot.toString() === filterParking;
    return matchesSearch && matchesType && matchesParking;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {restaurantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parking Lot</label>
            <select
              value={formData.parkingLot}
              onChange={(e) => setFormData({ ...formData, parkingLot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition font-medium"
          >
            {editingId ? 'Update Restaurant' : 'Add Restaurant'}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  restaurantName: '',
                  address: '',
                  type: 'Rajasthani',
                  parkingLot: 'true',
                  image: 'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/7524df6e-46fa-4506-8766-eca8da47c2f1/2izhqnTaNLdenHYF.jpeg'
                });
              }}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition font-medium"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurants</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {showSuccess}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name or address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {restaurantTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterParking}
                  onChange={(e) => setFilterParking(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Parking</option>
                  <option value="true">With Parking</option>
                  <option value="false">No Parking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.restaurantID} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <img
                  src={restaurant.image}
                  alt={restaurant.restaurantName}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.restaurantName}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.address}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      {restaurant.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      restaurant.parkingLot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {restaurant.parkingLot ? '🅿️ Parking' : 'No Parking'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.restaurantID)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants found</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this restaurant?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};          </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
  

