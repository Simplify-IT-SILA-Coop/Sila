import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    Package,
    Truck,
    Clock,
    CheckCircle2
} from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
                {trend && (
                    <p className={`text-xs mt-2 font-medium flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp size={12} className="mr-1" />
                        {trend > 0 ? '+' : ''}{trend}% from last month
                    </p>
                )}
            </div>
            <div className={`${color} p-3 rounded-xl`}>
                <Icon className="text-white" size={24} />
            </div>
        </div>
    </div>
);

const RecentActivity = ({ logs }: { logs: any[] }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Clock size={20} className="mr-2 text-green-600" />
            System Logs & Audit
        </h3>
        <div className="space-y-4">
            {logs.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className="flex items-center space-x-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="bg-green-50 p-2 rounded-full">
                            <CheckCircle2 size={16} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-900 font-medium">{log.action}</p>
                            <p className="text-xs text-gray-400 font-medium">
                                {new Date(log.timestamp).toLocaleTimeString()} • {log.performedBy}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        console.log('Dashboard component mounted');
        const fetchData = async () => {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/audit_logs')
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    if (Array.isArray(logsData)) {
                        setLogs(logsData);
                    } else {
                        console.warn('Audit logs is not an array:', logsData);
                        setLogs([]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000); // Polling for "real-time"
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {!stats && !logs ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading dashboard...</div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Total Revenue"
                            value={`${stats?.revenue || 0} MAD`}
                            icon={TrendingUp}
                            color="bg-emerald-500"
                        />
                        <StatCard
                            label="Active Groups"
                            value={stats?.activeGroups || 0}
                            icon={Truck}
                            color="bg-green-500"
                        />
                        <StatCard
                            label="Pending Packages"
                            value={stats?.pendingPackages || 0}
                            icon={Package}
                            color="bg-amber-500"
                        />
                        <StatCard
                            label="KYC Verified"
                            value={`${Math.round(stats?.kycVerifiedPercent || 0)}%`}
                            icon={Users}
                            color="bg-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Delivery Volume Trends</h3>
                            <div className="h-64 flex items-end justify-between space-x-2">
                                {(stats?.volumeTrends || [45, 60, 40, 75, 55, 90, 80, 70, 85, 95, 100, 110]).map((h: number, i: number) => (
                                    <div key={i} className="flex-1 bg-green-100 rounded-t-lg transition-all hover:bg-green-500 group relative" style={{ height: `${h}%` }}>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {stats?.rawVolume ? stats.rawVolume[i] : Math.round(h * 11.2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium px-2">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                            </div>
                        </div>
                        <RecentActivity logs={logs} />
                    </div>
                </>
            )}
        </div>
    );
}
