import React, { useEffect, useState } from 'react';
import { Moon, Sun, LogOut, Copy, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import * as api from '../../services/api';
import type { UserProfile } from '../../types';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const [notifications, setNotifications] = useState({
    emailSms: true,
    lowStock: true,
    orderUpdates: false,
    reports: true,
    loginAlerts: true,
    doNotDisturb: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    activityLog: true,
  });

  const [dndTime, setDndTime] = useState({ from: '22:00', to: '07:00' });

  useEffect(() => {
    const fetchUserData = async () => {
      const stored = api.getUser();
      if (stored) {
        setUser(stored);
        setProfileData({
          firstName: stored.first_name || '',
          lastName: stored.last_name || '',
          phone: stored.phone || '',
          email: stored.email || '',
        });
      }

      try {
        const response = await api.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          setProfileData({
            firstName: response.user.first_name || '',
            lastName: response.user.last_name || '',
            phone: response.user.phone || '',
            email: response.user.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const token = api.getToken();

    if (!token) {
      alert('You must be logged in to save settings');
      setLoading(false);
      return;
    }

    const payload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phone,
      settings: {
        notifications: {
          ...notifications,
          dndTime,
        },
        security,
      },
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const teamMembers = [
    { name: 'Sarah Johnson', role: 'Store Manager', access: 'Full Access' },
    { name: 'Mike Chen', role: 'Inventory Analyst', access: 'View Only' },
    { name: 'Emily Davis', role: 'Staff', access: 'View Only' },
  ];

  return (
    <div className="cb-page">
      {/* Page Header */}
      <div className="cb-page-header">
        <div>
          <h1 className="cb-h1">Settings</h1>
          <p className="cb-subtitle mt-3">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="cb-card p-6 space-y-2 sticky top-6">
            <nav className="flex flex-col gap-1">
              <a href="#profile" className="cb-navlink px-4 py-2 rounded-lg hover:bg-muted transition-colors">Profile</a>
              <a href="#security" className="cb-navlink px-4 py-2 rounded-lg hover:bg-muted transition-colors">Security</a>
              <a href="#notifications" className="cb-navlink px-4 py-2 rounded-lg hover:bg-muted transition-colors">Notifications</a>
              <a href="#theme" className="cb-navlink px-4 py-2 rounded-lg hover:bg-muted transition-colors">Appearance</a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section id="profile" className="cb-card p-8">
            <div className="mb-6">
              <h2 className="cb-h2">Profile Information</h2>
              <p className="cb-body text-sm mt-2">Update your personal information</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="cb-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="cb-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="cb-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="cb-input opacity-50"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button className="cb-btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="cb-btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section id="security" className="cb-card p-8">
            <div className="mb-6">
              <h2 className="cb-h2">Security</h2>
              <p className="cb-body text-sm mt-2">Manage your account security settings</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                  <p className="cb-body text-sm mt-1">Add an extra layer of security</p>
                </div>
                <button className="cb-btn-secondary">Enable</button>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground">Password</p>
                  <p className="cb-body text-sm mt-1">Last changed 30 days ago</p>
                </div>
                <button className="cb-btn-secondary">Change</button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Login Alerts</p>
                  <p className="cb-body text-sm mt-1">Get notified of unusual login attempts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.loginAlerts}
                    onChange={(e) => setSecurity({ ...security, loginAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section id="notifications" className="cb-card p-8">
            <div className="mb-6">
              <h2 className="cb-h2">Notifications</h2>
              <p className="cb-body text-sm mt-2">Choose how you receive notifications</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'emailSms', label: 'Email & SMS', desc: 'Receive notifications via email and SMS' },
                { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Get notified when inventory is low' },
                { key: 'reports', label: 'Weekly Reports', desc: 'Receive weekly summary reports' },
                { key: 'loginAlerts', label: 'Login Alerts', desc: 'Notify on new/unfamiliar logins' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="cb-body text-sm mt-1">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications] as boolean}
                      onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Appearance Section */}
          <section id="theme" className="cb-card p-8">
            <div className="mb-6">
              <h2 className="cb-h2">Appearance</h2>
              <p className="cb-body text-sm mt-2">Customize how the app looks and feels</p>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  {theme === 'dark' ? (
                    <Moon className="w-6 h-6 text-primary" />
                  ) : (
                    <Sun className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground capitalize">Dark Mode</p>
                  <p className="cb-body text-sm mt-1">Currently {theme === 'dark' ? 'enabled' : 'disabled'}</p>
                </div>
              </div>
              <button onClick={toggleTheme} className="cb-btn-primary">
                {theme === 'dark' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </section>

          {/* Session Info */}
          <section className="cb-card p-8">
            <div className="mb-6">
              <h2 className="cb-h2">Session Information</h2>
              <p className="cb-body text-sm mt-2">Current session details</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Session ID</p>
                  <p className="font-mono text-xs mt-1 break-all">{api.getToken()?.slice(0, 20)}...</p>
                </div>
                <button
                  onClick={() => copyToClipboard(api.getToken() || '')}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Active</p>
                  <p className="text-foreground mt-1">Just now</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
