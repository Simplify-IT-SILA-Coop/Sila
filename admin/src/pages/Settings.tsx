import { useState } from 'react';
import { Settings as SettingsIcon, DollarSign, Percent, Scale, Globe, Save, RefreshCcw } from 'lucide-react';

const ConfigField = ({ label, icon: Icon, value, suffix, description }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-gray-50/50 group">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors`}>
                <Icon size={20} />
            </div>
            <input
                type="text"
                defaultValue={value}
                className="w-24 text-right font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none transition-all px-1"
            />
            <span className="text-gray-400 text-sm font-bold ml-1">{suffix}</span>
        </div>
        <h4 className="font-bold text-gray-900 text-sm">{label}</h4>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{description}</p>
    </div>
);

export default function Settings() {
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Configuration</h1>
                        <p className="text-sm text-gray-500">Global parameters for pricing and AI behavior.</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <RefreshCcw size={18} className="mr-2 animate-spin" />
                    ) : (
                        <Save size={18} className="mr-2" />
                    )}
                    {saving ? 'Applying Changes...' : 'Save Global Parameters'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ConfigField
                    label="Base Flat Rate"
                    icon={DollarSign}
                    value="45.00"
                    suffix="MAD"
                    description="Minimum fee applied to any booking regardless of distance or weight."
                />
                <ConfigField
                    label="Weight Surcharge"
                    icon={Scale}
                    value="12.50"
                    suffix="MAD/kg"
                    description="Additional cost per kg above the first 5kg tier."
                />
                <ConfigField
                    label="Group Discount"
                    icon={Percent}
                    value="25"
                    suffix="%"
                    description="Percentage savings applied when a package is pooled in a Group Batch."
                />
                <ConfigField
                    label="Inter-City Scale"
                    icon={Globe}
                    value="0.85"
                    suffix="Multiplier"
                    description="Global distance multiplier applied to Haversine route calculation."
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-4 tracking-tight">AI & Model Governance</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-2xl">
                    We use OpenRouter's Free Models Router to ensure 0-cost operations.
                    Modify the fallback models if latency exceeds Moroccan carrier averages (typically 400ms).
                </p>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm font-bold text-gray-700">Meta Llama 3.1 (Free)</span>
                        </div>
                        <span className="text-xs font-medium text-gray-400 italic">Primary extraction model</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-sm font-bold text-gray-700">Mistral 7B (Free)</span>
                        </div>
                        <span className="text-xs font-medium text-gray-400 italic">Fallback parser</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
