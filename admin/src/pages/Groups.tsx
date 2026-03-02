import { useState, useEffect } from 'react';
import { Truck, Users, MapPin, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function Groups() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/group_batches');
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    useEffect(() => {
        fetchGroups();
        const interval = setInterval(fetchGroups, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleConfirm = async (id: string) => {
        try {
            await fetch(`/api/group_batches/${id}/confirm`, { method: 'POST' });
            fetchGroups();
        } catch (error) {
            console.error('Failed to confirm group:', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Group Batches</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and optimize pooled delivery routes.</p>
                </div>
                <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-xl hover:bg-gray-800 transition-all flex items-center">
                    <Truck size={18} className="mr-2" />
                    Create Manual Batch
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    [1, 2].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />)
                ) : groups.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 font-medium">
                        No active group batches found.
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start space-x-4">
                                    <div className={`p-4 rounded-2xl ${group.status === 'READY_TO_DISPATCH' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        <Truck size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">BATCH ID</span>
                                            <span className="text-sm font-bold text-blue-600">#{group.id.slice(-6)}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-xl font-extrabold text-gray-900">
                                            <span>{group.cityFrom || 'VARIOUS'}</span>
                                            <ArrowRight size={20} className="text-gray-300" />
                                            <span>{group.cityTo || 'VARIOUS'}</span>
                                        </div>
                                        <div className="flex items-center mt-3 space-x-4 text-sm font-medium text-gray-500">
                                            <span className="flex items-center"><Users size={16} className="mr-1" /> {group.packages?.length || 0} Packages</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 max-w-xs px-6">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-400 tracking-tighter uppercase">CAPACITY FREIGHT</span>
                                        <span className="text-blue-600">85%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: '85%' }} />
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2 min-w-[160px]">
                                    {group.status === 'FORMING' ? (
                                        <button
                                            onClick={() => handleConfirm(group.id)}
                                            className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center"
                                        >
                                            <CheckCircle size={14} className="mr-2" /> Confirm Batch
                                        </button>
                                    ) : (
                                        <div className="text-center py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                            🚚 {group.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
