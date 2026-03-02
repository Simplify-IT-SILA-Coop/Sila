import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

export default function Packages() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchPackages = async () => {
        try {
            const res = await fetch('/api/packages');
            const data = await res.json();
            setPackages(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching packages:', error);
        }
    };

    useEffect(() => {
        fetchPackages();
        const interval = setInterval(fetchPackages, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredPackages = packages.filter(pkg =>
        (pkg.user?.fullName?.toLowerCase() || '').includes(filter.toLowerCase()) ||
        pkg.cityFrom.toLowerCase().includes(filter.toLowerCase()) ||
        pkg.cityTo.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Active Packages</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all incoming and in-transit delivery requests.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer or city..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64 text-sm"
                        />
                    </div>
                    <button className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm text-gray-400 hover:text-gray-900 transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Route</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Weight</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16 bg-white"></td></tr>)
                        ) : filteredPackages.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No packages found.</td></tr>
                        ) : filteredPackages.map((pkg) => (
                            <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {pkg.user?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{pkg.user?.fullName || 'Unknown User'}</p>
                                            <p className="text-xs text-gray-400">{pkg.user?.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                                        <span>{pkg.cityFrom}</span>
                                        <span className="text-gray-300">→</span>
                                        <span>{pkg.cityTo}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-gray-900">{pkg.weightKg} kg</span>
                                    {pkg.fragile && <span className="ml-2 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold">Fragile</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase ${pkg.isGrouped ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {pkg.isGrouped ? 'GROUPED' : 'PENDING'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-gray-900">{pkg.bookings?.[0]?.estimatedCost || 0} MAD</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-gray-400 hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
