import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card } from '../components/ui/Primitives';
import { LogOut, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { profile, user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [organization, setOrganization] = useState(profile?.organization || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    await updateProfile(fullName, organization);
    setSaving(false);
    setSaveSuccess(true);

    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Settings</h1>
        <p className="text-sm text-[#495057]">
          Manage inspector profile information and application account preferences.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#EBFBEE] border border-[#B2F2BB] text-[#2B8A3E] rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          Profile preferences saved successfully.
        </div>
      )}

      {/* Inspector Profile Form */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#212529]">Profile Details</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2.5 text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">
              Email Address (Read-only)
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg px-3 py-2.5 text-sm text-[#868E96] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">
              Organization / Department
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Department of Legal Metrology"
              className="w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2.5 text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
            />
          </div>

          <Button type="submit" disabled={saving} icon={<Save size={16} />}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </Card>

      {/* Account Section */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#212529]">Account</h2>
        <p className="text-xs text-[#868E96]">
          Sign out of your active Legal Metrology inspection session on this browser.
        </p>
        <Button variant="destructive" onClick={handleSignOut} icon={<LogOut size={16} />}>
          Sign Out
        </Button>
      </Card>
    </div>
  );
};
