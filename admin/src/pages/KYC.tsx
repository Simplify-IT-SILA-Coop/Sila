import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';

export default function KYC() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKYCUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            // Filter for users who have submitted ID but aren't verified yet or just show all for list
            setUsers(Array.isArray(data) ? data.filter((u: any) => u.govIdHash) : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching KYC users:', error);
        }
    };

    useEffect(() => {
        fetchKYCUsers();
        const interval = setInterval(fetchKYCUsers, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async (id: string, isVerified: boolean) => {
        try {
            await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVerified }) // Assuming we have this field or similar
            });
            fetchKYCUsers();
        } catch (error) {
            console.error('Failed to update user kyc:', error);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start space-x-4 shadow-sm">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 text-lg tracking-tight">KYC Compliance Policy</h4>
                    <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                        Per Moroccan fintech regulations, we only store **non-reversible hashes** of government IDs.
                        Admins are tasked with manually verifying the data presented by the user matches the cryptographically signed proof.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    [1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)
                ) : users.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 font-medium">
                        No KYC requests pending verification.
                    </div>
                ) : users.map((user) => (
                    <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden font-bold text-blue-600">
                                {user.fullName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{user.fullName}</h3>
                                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                                    <span className="font-medium">{user.phone}</span>
                                    <span>•</span>
                                    <span className="font-mono text-[10px] bg-gray-50 px-1 rounded border border-gray-100 group-hover:bg-white">{user.govIdHash.slice(0, 16)}...</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all border border-gray-100">
                                <FileText size={20} />
                            </button>

                            <button
                                onClick={() => handleVerify(user.id, true)}
                                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                            >
                                <CheckCircle size={16} className="mr-2" /> Approve
                            </button>
                            <button
                                onClick={() => handleVerify(user.id, false)}
                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all border border-red-100"
                            >
                                <XCircle size={20} />
                            </button>

                            <button className="p-2.5 text-gray-400 hover:text-gray-900 transition-all">
                                <ExternalLink size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
