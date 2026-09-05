import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileCheck2,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/overview', icon: <LayoutDashboard size={18} /> },
    { label: 'New Inspection', path: '/inspection/new', icon: <PlusCircle size={18} /> },
    { label: 'History', path: '/history', icon: <History size={18} /> },
    { label: 'Inspection Rules', path: '/rules', icon: <FileCheck2 size={18} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row text-[#212529]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-[#E9ECEF] min-h-screen fixed left-0 top-0 bottom-0 z-30">
        <div className="p-6 border-b border-[#E9ECEF] flex items-center gap-2">
          <ShieldAlert className="text-[#1971C2]" size={24} />
          <div>
            <h1 className="font-semibold text-lg text-[#212529] leading-tight">PackCheck</h1>
            <p className="text-xs text-[#868E96]">Legal Metrology Inspector</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E7F0F9] text-[#1971C2]'
                    : 'text-[#495057] hover:bg-[#F1F3F5] hover:text-[#212529]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E9ECEF]">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-[#212529] truncate">
              {profile?.full_name || user?.email || 'Inspector'}
            </p>
            <p className="text-xs text-[#868E96] truncate">
              {profile?.organization || 'Legal Metrology Dept'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#C92A2A] hover:bg-[#FFF5F5] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden bg-white border-b border-[#E9ECEF] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-[#1971C2]" size={20} />
          <span className="font-semibold text-base text-[#212529]">PackCheck</span>
        </div>
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          aria-label="Toggle Navigation Menu"
          className="p-2 text-[#495057] hover:bg-[#F1F3F5] rounded-lg"
        >
          {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-50 flex">
          <div className="w-64 bg-white min-h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E9ECEF]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-[#1971C2]" size={20} />
                  <span className="font-semibold text-base">PackCheck</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close Navigation"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-[#E7F0F9] text-[#1971C2]'
                          : 'text-[#495057] hover:bg-[#F1F3F5]'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="pt-4 border-t border-[#E9ECEF]">
              <p className="text-sm font-medium">{profile?.full_name || 'Inspector'}</p>
              <button
                onClick={handleSignOut}
                className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-[#C92A2A] bg-[#FFF5F5] rounded-lg"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-60 p-4 lg:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
