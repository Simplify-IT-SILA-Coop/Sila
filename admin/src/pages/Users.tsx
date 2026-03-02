import { useState, useEffect } from 'react';
import { Search, Filter, Mail, Phone, Calendar, UserPlus } from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        user.phone.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                    <UserPlus size={18} className="mr-2" />
                    Add User
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
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No users found.</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {user.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{user.fullName}</h3>
                                        <div className="flex items-center space-x-3 text-xs text-gray-400 mt-0.5">
                                            <span className="flex items-center"><Phone size={12} className="mr-1" /> {user.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-12">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-gray-400 font-medium flex items-center justify-end"><Calendar size={12} className="mr-1" /> Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs font-bold text-gray-900 mt-0.5">{user._count?.packages || 0} Orders</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-tight uppercase ${user.govIdHash ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {user.govIdHash ? 'KYC VERIFIED' : 'PENDING KYC'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
