import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Users,
    Settings,
    ShieldCheck,
    Truck,
    Menu,
    X
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
    <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active
            ? 'bg-green-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </Link>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    React.useEffect(() => {
        console.log('Layout component mounted');
    }, []);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Packages', href: '/packages', icon: Package },
        { name: 'Groups', href: '/groups', icon: Truck },
        { name: 'Drivers', href: '/drivers', icon: Truck },
        { name: 'KYC Review', href: '/kyc', icon: ShieldCheck },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } bg-gray-900 transition-all duration-300 ease-in-out fixed inset-y-0 z-50 flex flex-col`}
            >
                <div className="p-6 flex items-center justify-between">
                    <div className={`flex items-center space-x-3 overflow-hidden ${!isSidebarOpen && 'hidden'}`}>
                        <img 
                            src="/sila-logo.png" 
                            alt="Sila Logo" 
                            className="w-10 h-10 object-contain"
                        />
                        <span className="text-xl font-bold text-white truncate">Sila</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navigation.map((item) => (
                        <SidebarItem
                            key={item.name}
                            to={item.href}
                            icon={item.icon}
                            label={isSidebarOpen ? item.name : ''}
                            active={location.pathname === item.href}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center space-x-3 text-gray-400 px-2 py-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                            AD
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Admin User</span>
                                <span className="text-xs">Principal Architect</span>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between sticky top-0 z-40">
                    <h2 className="text-lg font-semibold text-gray-800 capitalize">
                        {location.pathname === '/' ? 'Overview' : location.pathname.substring(1)}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-500 hover:text-green-600 transition-colors">
                            <Settings size={20} />
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <span className="text-sm text-gray-600 font-medium">System Status: <span className="text-green-500 font-bold">Live</span></span>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
