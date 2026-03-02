import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Groups from './pages/Groups';
import KYC from './pages/KYC';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Settings from './pages/Settings';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/kyc" element={<KYC />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
