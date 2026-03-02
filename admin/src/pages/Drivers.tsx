import { useState, useEffect } from 'react';
import { Search, Filter, Phone, Calendar, Truck, UserPlus, X, Edit2, Trash2, Check, AlertTriangle } from 'lucide-react';

export default function     Drivers() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDriver, setNewDriver] = useState({ fullName: '', phone: '', vehicleInfo: '' });

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState<any>(null);

    const [submitting, setSubmitting] = useState(false);

    const fetchDrivers = async () => {
        try {
            const res = await fetch('/api/drivers');
            const data = await res.json();
            setDrivers(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    useEffect(() => {
        fetchDrivers();
        const interval = setInterval(fetchDrivers, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleAddDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDriver),
            });
            if (res.ok) {
                setNewDriver({ fullName: '', phone: '', vehicleInfo: '' });
                setShowAddModal(false);
                fetchDrivers();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to add driver');
            }
        } catch (error) {
            alert('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDriver) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/drivers/${editingDriver.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: editingDriver.fullName,
                    phone: editingDriver.phone,
                    vehicleInfo: editingDriver.vehicleInfo,
                    isActive: editingDriver.isActive
                }),
            });
            if (res.ok) {
                setShowEditModal(false);
                fetchDrivers();
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to update driver');
            }
        } catch (error) {
            alert('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDriver = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchDrivers();
            } else {
                alert('Failed to delete driver');
            }
        } catch (error) {
            alert('Network error');
        }
    };

    const filteredDrivers = drivers.filter(d =>
        d.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        d.phone.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Driver Management</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                    <UserPlus size={18} className="mr-2" />
                    Add Driver
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by name or phone..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse bg-white" />)
                    ) : filteredDrivers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No drivers found.</div>
                    ) : (
                        filteredDrivers.map((driver) => (
                            <div key={driver.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{driver.fullName}</h3>
                                        <div className="flex items-center space-x-3 text-xs text-gray-400 mt-0.5">
                                            <span className="flex items-center"><Phone size={12} className="mr-1" /> {driver.phone}</span>
                                            <span className="flex items-center font-medium text-blue-500/80">{driver.vehicleInfo}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-gray-400 font-medium flex items-center justify-end"><Calendar size={12} className="mr-1" /> Registered {new Date(driver.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-tight uppercase ${driver.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {driver.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingDriver(driver); setShowEditModal(true); }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDriver(driver.id, driver.fullName)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Driver Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Add New Driver</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddDriver} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={newDriver.fullName}
                                    onChange={e => setNewDriver({ ...newDriver, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Driver's Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                                <input
                                    required
                                    type="text"
                                    value={newDriver.phone}
                                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="06XXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle Info</label>
                                <input
                                    required
                                    type="text"
                                    value={newDriver.vehicleInfo}
                                    onChange={e => setNewDriver({ ...newDriver, vehicleInfo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Renault Master (1234-A-1)"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Create Driver Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Driver Modal */}
            {showEditModal && editingDriver && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Edit Driver Profile</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateDriver} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={editingDriver.fullName}
                                    onChange={e => setEditingDriver({ ...editingDriver, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                                <input
                                    required
                                    type="text"
                                    value={editingDriver.phone}
                                    onChange={e => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle Info</label>
                                <input
                                    required
                                    type="text"
                                    value={editingDriver.vehicleInfo}
                                    onChange={e => setEditingDriver({ ...editingDriver, vehicleInfo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingDriver.isActive}
                                    onChange={e => setEditingDriver({ ...editingDriver, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Account Active</label>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Update Driver Info'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
