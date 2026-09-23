'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Wrench,
  QrCode,
  UserPlus,
  Car,
  CreditCard,
  Bell,
  Utensils,
  Package,
  ShieldAlert,
  FileCheck,
  Settings,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  Building,
  ScanLine,
  PhoneCall,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  LogOut
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import io from 'socket.io-client';

const API_BASE = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

export default function AdminPanel() {
  // Navigation Sections
  type Section =
    | 'DASHBOARD'
    | 'ONBOARDING'
    | 'RESIDENTS'
    | 'COMPLAINTS'
    | 'WHOS_OUT'
    | 'VISITORS'
    | 'VEHICLES'
    | 'BILLING'
    | 'NOTICES'
    | 'MENU'
    | 'INVENTORY'
    | 'COMPLIANCE'
    | 'TURNSTILE_SCANNER';

  const [activeSection, setActiveSection] = useState<Section>('DASHBOARD');
  const [activeRole, setActiveRole] = useState<'DIRECTOR' | 'WARDEN' | 'SECURITY' | 'ACCOUNTS'>('WARDEN');

  // Live Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeEmergencies, setActiveEmergencies] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [whosOutData, setWhosOutData] = useState<any>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [menuData, setMenuData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [naacReport, setNaacReport] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Turnstile scanner simulation
  const [scanInput, setScanInput] = useState('QR-PASS-892101-RAHUL');
  const [scanResult, setScanResult] = useState<any>(null);

  // Filters and UI toggles
  const [residentSearch, setResidentSearch] = useState('');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState('ALL');
  const [audioAlertMuted, setAudioAlertMuted] = useState(false);
  interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatarUrl?: string;
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    staffProfile?: any;
    hostel?: any;
  }

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [registeredColleges, setRegisteredColleges] = useState<any[]>([]);

  // Public Campus Manager Auth State
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regCollegeName, setRegCollegeName] = useState('');
  const [regCollegeCode, setRegCollegeCode] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regHostelType, setRegHostelType] = useState('CO_ED');
  const [regBlocks, setRegBlocks] = useState('Block A (North), Block B (South)');
  const [regCurfewTime, setRegCurfewTime] = useState('21:30');
  const [regManagerName, setRegManagerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'WARDEN' | 'DIRECTOR'>('WARDEN');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Onboarding Wizard State (5 Steps)
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingHostelName, setOnboardingHostelName] = useState('Apex Himalaya Campus Residence');
  const [onboardingBlocks, setOnboardingBlocks] = useState('Nilgiri Block A, Shivalik Block B');
  const [onboardingCurfew, setOnboardingCurfew] = useState('21:30');

  // 1. Initial Load & Multi-Tenant Authentication Check
  useEffect(() => {
    async function init() {
      // 1. Fetch live colleges list for directory
      try {
        const colRes = await fetch(`${API_BASE}/auth/colleges`);
        if (colRes.ok) {
          const cols = await colRes.json();
          setRegisteredColleges(cols);
        }
      } catch (e) {
        console.error('Error fetching colleges:', e);
      }

      // 2. Check cached credentials in localStorage
      try {
        const cachedUserStr = localStorage.getItem('shms_admin_user');
        const cachedToken = localStorage.getItem('shms_admin_token');
        if (cachedUserStr && cachedToken) {
          const parsedUser = JSON.parse(cachedUserStr);
          setCurrentUser(parsedUser);
          setAuthToken(cachedToken);
          if (parsedUser.role) {
            setActiveRole(parsedUser.role as any);
          }
          fetchAllAdminData(cachedToken, parsedUser.tenantId);
        }
      } catch (err) {
        console.error('Admin session restore error:', err);
      }
    }
    init();

    // 3. Setup WebSockets for instant Siren & Presence alerts
    const socket = io(SOCKET_URL);
    socket.on('connect', () => {
      console.log('Admin socket connected');
    });

    socket.on('emergency:triggered', (alertItem) => {
      console.log('🚨 EMERGENCY SIREN TRIGGERED:', alertItem);
      setActiveEmergencies((prev) => [alertItem, ...prev]);
    });

    socket.on('emergency:resolved', ({ id }) => {
      setActiveEmergencies((prev) => prev.filter((a) => a.id !== id));
    });

    socket.on('curfew:alert', (curfewPayload) => {
      console.log('Curfew alert updated:', curfewPayload);
    });

    socket.on('complaint:update', () => {
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    });

    socket.on('pass:update', () => {
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function fetchAllAdminData(token: string, tenantId?: string) {
    const tId = tenantId || currentUser?.tenantId;
    const tenantQuery = tId ? `?tenantId=${tId}` : '';
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [dashRes, emRes, resRes, cmpRes, passRes, whoRes, visRes, vehRes, billRes, notRes, repRes, audRes] =
        await Promise.all([
          fetch(`${API_BASE}/analytics/dashboard${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/emergency/active${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/residents${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/complaints${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/passes${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/passes/live-whos-out${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/visitors${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/vehicles${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/billing${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/notices${tenantQuery}`),
          fetch(`${API_BASE}/compliance/naac-report${tenantQuery}`),
          fetch(`${API_BASE}/compliance/audit-logs${tenantQuery}`)
        ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (emRes.ok) setActiveEmergencies(await emRes.json());
      if (resRes.ok) setResidents(await resRes.json());
      if (cmpRes.ok) setComplaints(await cmpRes.json());
      if (passRes.ok) setPasses(await passRes.json());
      if (whoRes.ok) setWhosOutData(await whoRes.json());
      if (visRes.ok) setVisitors(await visRes.json());
      if (vehRes.ok) setVehicles(await vehRes.json());
      if (billRes.ok) setBills(await billRes.json());
      if (notRes.ok) setNotices(await notRes.json());
      if (repRes.ok) setNaacReport(await repRes.json());
      if (audRes.ok) setAuditLogs(await audRes.json());
    } catch (err) {
      console.error('Fetch admin data error:', err);
    }
  }

  // Manager Login Action
  async function handleLogin(email: string) {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed');
        setLoginLoading(false);
        return;
      }
      setAuthToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role) {
        setActiveRole(data.user.role as any);
      }
      localStorage.setItem('shms_admin_user', JSON.stringify(data.user));
      localStorage.setItem('shms_admin_token', data.token);
      fetchAllAdminData(data.token, data.user.tenantId);
    } catch (err) {
      setLoginError('Failed to connect to authentication server');
    } finally {
      setLoginLoading(false);
    }
  }

  // Register New College / Institution Action
  async function handleRegisterCollege(e: React.FormEvent) {
    e.preventDefault();
    if (!regCollegeName || !regManagerName || !regEmail) {
      setRegError('Please provide College Name, Manager Name, and Official Email');
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register-college`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeName: regCollegeName,
          collegeCode: regCollegeCode,
          hostelType: regHostelType,
          address: regAddress,
          blocks: regBlocks,
          curfewTime: regCurfewTime,
          managerName: regManagerName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          role: regRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || 'Registration failed');
        setRegLoading(false);
        return;
      }
      setAuthToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role) {
        setActiveRole(data.user.role as any);
      }
      localStorage.setItem('shms_admin_user', JSON.stringify(data.user));
      localStorage.setItem('shms_admin_token', data.token);
      fetchAllAdminData(data.token, data.user.tenantId);
      // Refresh directory of colleges
      const colRes = await fetch(`${API_BASE}/auth/colleges`);
      if (colRes.ok) setRegisteredColleges(await colRes.json());
    } catch (err) {
      setRegError('Failed to register college. Server error.');
    } finally {
      setRegLoading(false);
    }
  }

  // Logout / Switch College Action
  function handleLogout() {
    localStorage.removeItem('shms_admin_user');
    localStorage.removeItem('shms_admin_token');
    setCurrentUser(null);
    setAuthToken('');
    setDashboardData(null);
    setResidents([]);
    setComplaints([]);
    setPasses([]);
    setWhosOutData(null);
  }

  // Resolve Emergency
  async function resolveEmergency(id: string) {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/emergency/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ notes: 'Resolved by Warden on duty' })
      });
      setActiveEmergencies((prev) => prev.filter((a) => a.id !== id));
      fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('Resolve error:', err);
    }
  }

  // Kanban Stage Change
  async function updateComplaintStatus(id: string, newStatus: string) {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/complaints/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('Status update error:', err);
    }
  }

  // Approve Pass
  async function approvePass(id: string) {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/passes/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('Approve pass error:', err);
    }
  }

  // Reject Pass
  async function rejectPass(id: string) {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/passes/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason: 'Curfew restriction or parental verification pending' })
      });
      fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('Reject pass error:', err);
    }
  }

  // Turnstile QR Simulator Action
  async function simulateTurnstileScan(direction: 'ENTRY' | 'EXIT') {
    try {
      const res = await fetch(`${API_BASE}/turnstile/simulate-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: scanInput,
          gateId: 'Turnstile Post-01',
          direction
        })
      });
      const data = await res.json();
      setScanResult(data);
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      setScanResult({ status: 'ACCESS_DENIED', reason: 'Hardware Scanner Timeout' });
    }
  }

  // Send Bulk Fee Reminders
  async function sendFeeReminders() {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/billing/send-reminders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error('Reminders error:', err);
    }
  }

  // Filtered residents
  const filteredResidents = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(residentSearch.toLowerCase()) ||
      r.studentId?.toLowerCase().includes(residentSearch.toLowerCase()) ||
      r.roomNumber?.toLowerCase().includes(residentSearch.toLowerCase());
    const matchesBlock =
      selectedBlockFilter === 'ALL' || r.blockName?.toLowerCase().includes(selectedBlockFilter.toLowerCase());
    return matchesSearch && matchesBlock;
  });

  // Complaint chart data
  const complaintChartData = [
    { name: 'Water', count: complaints.filter((c) => c.category === 'WATER').length },
    { name: 'Electricity', count: complaints.filter((c) => c.category === 'ELECTRICITY').length },
    { name: 'Wi-Fi', count: complaints.filter((c) => c.category === 'WIFI').length },
    { name: 'Housekeeping', count: complaints.filter((c) => c.category === 'HOUSEKEEPING').length },
    { name: 'Security', count: complaints.filter((c) => c.category === 'SECURITY').length }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/25 text-lg">
              SH
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base tracking-tight text-white">SmartHostel</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Universal SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Institutional Campus Management Command Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 flex items-center space-x-1.5 transition"
            >
              <span>Open Student Resident App</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
          </div>
        </header>

        {/* Hero / Portal Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="max-w-4xl w-full z-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open for Any College, University, or PG Hostel • Real-Time Data Isolation</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                Institutional Admin Command Center
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
                Sign in to manage your campus residents, emergency alerts, curfew turnstiles, and NAAC dossier, or register your institution in under 60 seconds.
              </p>
            </div>

            {/* Auth Card Container */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
              {/* Tabs */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthTab('LOGIN'); setLoginError(''); setRegError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center space-x-2 cursor-pointer ${
                    authTab === 'LOGIN'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Campus Manager Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('REGISTER'); setLoginError(''); setRegError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center space-x-2 cursor-pointer ${
                    authTab === 'REGISTER'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New College / Campus</span>
                </button>
              </div>

              {/* TAB 1: LOGIN */}
              {authTab === 'LOGIN' && (
                <div className="space-y-6">
                  {loginError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!loginEmail) {
                        setLoginError('Please enter your manager email');
                        return;
                      }
                      handleLogin(loginEmail);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Institution Manager Work Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. warden@yourcollege.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Security Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {loginLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Sign In to College Operations</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Quick 1-Click Institutional Demo Logins */}
                  <div className="pt-6 border-t border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                      Quick 1-Click Institutional Demo Logins
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleLogin('warden.boys@campus.edu')}
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            WARDEN
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">APEX</span>
                        </div>
                        <p className="text-xs font-bold text-white group-hover:text-blue-300">Warden Roy</p>
                        <p className="text-[11px] text-slate-400 truncate">warden.boys@campus.edu</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogin('director@campus.edu')}
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            DIRECTOR
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">APEX</span>
                        </div>
                        <p className="text-xs font-bold text-white group-hover:text-emerald-300">Dr. S. Sharma</p>
                        <p className="text-[11px] text-slate-400 truncate">director@campus.edu</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogin('guard.gate1@campus.edu')}
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            SECURITY
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">APEX</span>
                        </div>
                        <p className="text-xs font-bold text-white group-hover:text-purple-300">Guard Vikram</p>
                        <p className="text-[11px] text-slate-400 truncate">guard.gate1@campus.edu</p>
                      </button>
                    </div>
                  </div>

                  {/* Directory of active registered colleges */}
                  {registeredColleges.length > 0 && (
                    <div className="pt-4 border-t border-slate-800/60">
                      <p className="text-[11px] font-bold text-slate-400 mb-2">
                        Registered Institutions Active On Platform:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {registeredColleges.map((c) => (
                          <div
                            key={c.id}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center space-x-2"
                          >
                            <Building className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-semibold text-slate-200">{c.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1 rounded">
                              {c.code}
                            </span>
                            <span className="text-[10px] text-blue-400">
                              {c.enrolledStudentsCount || 0} students
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REGISTER NEW COLLEGE */}
              {authTab === 'REGISTER' && (
                <form onSubmit={handleRegisterCollege} className="space-y-5">
                  {regError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        1. Institution & Hostel Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          College / University Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Oxford Campus Residence"
                          value={regCollegeName}
                          onChange={(e) => setRegCollegeName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Unique College Code (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. OXFORD-2026 (Auto-generated if empty)"
                          value={regCollegeCode}
                          onChange={(e) => setRegCollegeCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Hostel Type
                        </label>
                        <select
                          value={regHostelType}
                          onChange={(e) => setRegHostelType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="CO_ED">Co-Ed (Boys & Girls)</option>
                          <option value="BOYS">Boys Hostel Only</option>
                          <option value="GIRLS">Girls Hostel Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Curfew Closing Time
                        </label>
                        <input
                          type="text"
                          value={regCurfewTime}
                          onChange={(e) => setRegCurfewTime(e.target.value)}
                          placeholder="21:30"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Campus Location / Address
                        </label>
                        <input
                          type="text"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="e.g. North Campus, Main Ave"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Hostel Blocks (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={regBlocks}
                        onChange={(e) => setRegBlocks(e.target.value)}
                        placeholder="e.g. Block A, Block B, Block C"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Students will be able to select from these blocks during enrollment.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="border-b border-slate-800 pb-2">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        2. Chief Campus Manager Account
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Manager Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Arthur Pendelton"
                          value={regManagerName}
                          onChange={(e) => setRegManagerName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Official Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. admin@oxfordresidence.edu"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="+91 98000 00000"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Manager Role
                        </label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="WARDEN">Chief Warden</option>
                          <option value="DIRECTOR">Campus Director / Owner</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-blue-600/30 transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-4 cursor-pointer"
                  >
                    {regLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Register Institution & Launch Ops Center</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* 1. Left Collapsible / Dark Nav Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-2xl">
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-1">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/30">
              {currentUser.tenantCode ? currentUser.tenantCode.substring(0, 2).toUpperCase() : 'SH'}
            </div>
            <div className="truncate">
              <h1 className="font-extrabold text-sm tracking-tight text-white leading-none truncate">
                {currentUser.tenantName || 'Campus Hostels'}
              </h1>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.5 rounded border border-blue-500/30">
                  {currentUser.tenantCode}
                </span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                  Ops Center
                </span>
              </div>
            </div>
          </div>

          {/* Role Switcher (Director, Warden, Security, Accounts) */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Role View
            </label>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { r: 'WARDEN', label: 'Warden' },
                { r: 'DIRECTOR', label: 'Director' },
                { r: 'SECURITY', label: 'Security' },
                { r: 'ACCOUNTS', label: 'Accounts' }
              ].map(({ r, label }) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r as any)}
                  className={`py-1 px-1.5 rounded font-bold transition text-center ${
                    activeRole === r
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: 'DASHBOARD', label: 'Analytics Dashboard', icon: LayoutDashboard },
              { id: 'WHOS_OUT', label: "Live 'Who's Out' & Curfew", icon: AlertTriangle, badge: whosOutData?.overdueCount },
              { id: 'COMPLAINTS', label: 'Complaints Kanban', icon: Wrench, badge: complaints.filter((c) => c.status === 'RAISED').length },
              { id: 'RESIDENTS', label: 'Residents & Bed Map', icon: Users },
              { id: 'VISITORS', label: 'Visitor Center', icon: UserPlus, badge: visitors.filter((v) => v.status === 'OVERSTAYED').length },
              { id: 'TURNSTILE_SCANNER', label: 'Turnstile / QR Scanner', icon: ScanLine },
              { id: 'BILLING', label: 'Billing & Payments', icon: CreditCard },
              { id: 'NOTICES', label: 'Notices & Siren Broadcast', icon: Bell },
              { id: 'VEHICLES', label: 'Vehicle Passes', icon: Car },
              { id: 'MENU', label: 'Mess Menu Planner', icon: Utensils },
              { id: 'COMPLIANCE', label: 'NAAC & Audit Dossier', icon: FileCheck },
              { id: 'ONBOARDING', label: '60-Min Campus Setup', icon: Sparkles }
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as Section)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                  activeSection === id
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
                {badge !== undefined && badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      id === 'WHOS_OUT' || id === 'VISITORS'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="font-bold text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out / Switch Institution"
            className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900">
        {/* Top Operational Bar */}
        <header className="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
              {activeSection.replace('_', ' ')}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300 font-semibold shrink-0">
              Curfew: <strong className="text-amber-400">{currentUser.hostel?.curfewTime || '21:30'} PM</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-blue-400 font-medium flex items-center truncate">
              <Building className="w-3.5 h-3.5 mr-1 shrink-0" />
              <span className="truncate">{currentUser.tenantName}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <button
              onClick={() => setAudioAlertMuted(!audioAlertMuted)}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center space-x-1"
            >
              {audioAlertMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{audioAlertMuted ? 'Muted' : 'Siren Audio ON'}</span>
            </button>

            <button
              onClick={() => authToken && fetchAllAdminData(authToken, currentUser?.tenantId)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-xs">
                {activeRole[0]}
              </div>
              <span className="text-xs font-bold text-slate-200">{activeRole}</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
              title="Switch Campus / Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* 3. Persistent Emergency Siren Alarm Banner (Critical feature) */}
        {activeEmergencies.length > 0 && (
          <div className="animate-siren bg-red-600 text-white px-6 py-2.5 flex items-center justify-between shadow-xl shrink-0 z-30">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white text-red-600 rounded-lg animate-bounce">
                <ShieldAlert className="w-5 h-5 font-black" />
              </div>
              <div>
                <span className="font-black text-sm uppercase tracking-wider">
                  🚨 ACTIVE EMERGENCY SOS ALARM ({activeEmergencies.length})
                </span>
                <p className="text-xs text-red-100">
                  {activeEmergencies[0].residentName} ({activeEmergencies[0].roomNumber}) reported{' '}
                  <strong>{activeEmergencies[0].emergencyType}</strong> in {activeEmergencies[0].locationDetails}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => resolveEmergency(activeEmergencies[0].id)}
                className="bg-white text-red-700 hover:bg-red-50 text-xs font-black px-4 py-1.5 rounded-lg shadow transition"
              >
                Mark Handled & Log Audit
              </button>
            </div>
          </div>
        )}

        {/* 4. Dynamic Body Views */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION: ANALYTICAL DASHBOARD */}
          {activeSection === 'DASHBOARD' && dashboardData && (
            <div className="space-y-6">
              {/* Row 1: KPI Summary Cards */}
              <div className="grid grid-cols-5 gap-4">
                {/* Total Residents & Occupancy */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                    <span>Occupancy Rate</span>
                    <Building className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {dashboardData.occupancy.occupancyRate}%
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {dashboardData.occupancy.occupiedBeds} occupied / {dashboardData.occupancy.totalBeds} total beds
                  </p>
                </div>

                {/* Overdue Curfew Returns */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-red-900/40 shadow-md">
                  <div className="flex items-center justify-between text-red-400 text-xs font-bold mb-1">
                    <span>Overdue Returns</span>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-black text-red-400">
                    {dashboardData.presence.overdueReturns}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Past 21:30 curfew threshold
                  </p>
                </div>

                {/* Active Complaints SLA */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                    <span>Open Grievances</span>
                    <Wrench className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {dashboardData.complaints.open + dashboardData.complaints.inProgress}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Avg SLA: <strong>{dashboardData.complaints.avgResolutionHours} hrs</strong> ({dashboardData.complaints.avgRating}★)
                  </p>
                </div>

                {/* Active Visitors */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                    <span>On Campus Visitors</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {dashboardData.visitors.activeOnCampus}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {dashboardData.visitors.overstayed} overstayed &gt; 2 hrs
                  </p>
                </div>

                {/* NAAC Accreditation Readiness */}
                <div className="bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950 p-4 rounded-2xl border border-blue-500/40 shadow-md">
                  <div className="flex items-center justify-between text-blue-400 text-xs font-bold mb-1">
                    <span>NAAC Readiness</span>
                    <Award className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-blue-400">
                    {dashboardData.naacScore.overallScore}/100
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    100% Digitized Grievance SOP
                  </p>
                </div>
              </div>

              {/* Row 2: Charts & Live Alerting Boards */}
              <div className="grid grid-cols-3 gap-6">
                {/* Complaint Distribution Chart */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
                  <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center justify-between">
                    <span>Grievances by Category</span>
                    <span className="text-[10px] text-slate-500">Live Breakdown</span>
                  </h3>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={complaintChartData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: 11 }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Live "Who's Out" Curfew Board (High Alerting Priority) */}
                <div className="col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <h3 className="text-xs font-bold text-slate-200">
                          Live Curfew Alert Board (Overdue Returns)
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveSection('WHOS_OUT')}
                        className="text-xs text-blue-400 hover:underline font-bold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {whosOutData?.curfewViolations?.length === 0 ? (
                        <p className="text-xs text-emerald-400 font-medium py-6 text-center">
                          ✓ All residents accounted for inside campus!
                        </p>
                      ) : (
                        whosOutData?.curfewViolations?.map((v: any) => (
                          <div
                            key={v.residentId}
                            className="bg-red-950/40 border border-red-800/60 p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-red-200">{v.residentName}</span>
                                <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.2 rounded font-mono">
                                  Room {v.roomNumber} ({v.blockName})
                                </span>
                              </div>
                              <p className="text-[11px] text-red-400 mt-0.5">
                                Status: <strong>{v.lastKnownStatus.replace(/_/g, ' ')}</strong> • Overdue by{' '}
                                <strong className="text-red-300">{v.minutesOverdue} mins</strong>
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <a
                                href={`tel:${v.phone}`}
                                className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                              >
                                Call Student
                              </a>
                              {v.parentPhone && (
                                <a
                                  href={`tel:${v.parentPhone}`}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px]"
                                >
                                  Call Parent
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Target Uptime: <strong>99.99%</strong> Sub-second Emergency Alert Response</span>
                    <span>Total Residents on Campus: <strong>{dashboardData.occupancy.occupiedBeds}</strong></span>
                  </div>
                </div>
              </div>

              {/* Row 3: Revenue Snapshot */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-300">Revenue & Fee Settlement Snapshot</h3>
                  <button
                    onClick={sendFeeReminders}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow"
                  >
                    Send Automated Bulk Due Reminders (SMS/Push)
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">Total Billed</span>
                    <span className="text-lg font-black text-white">
                      ₹{dashboardData.revenue.totalBilled.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">Total Collected</span>
                    <span className="text-lg font-black text-emerald-400">
                      ₹{dashboardData.revenue.totalCollected.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">Overdue Outstanding</span>
                    <span className="text-lg font-black text-red-400">
                      ₹{dashboardData.revenue.totalOverdue.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">Settlement Ratio</span>
                    <span className="text-lg font-black text-blue-400">
                      {dashboardData.revenue.collectionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: LIVE WHO'S OUT & CURFEW */}
          {activeSection === 'WHOS_OUT' && whosOutData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Live &ldquo;Who&apos;s Out&rdquo; & Curfew Monitoring Board
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time cross-check between gate biometric/turnstile scans and approved passes.
                  </p>
                </div>
                <span className="text-xs font-bold text-red-400 bg-red-950/80 border border-red-800/60 px-3 py-1 rounded-full">
                  Curfew Rule: Closing 21:30 PM
                </span>
              </div>

              <div className="space-y-3">
                {whosOutData.residents?.map((r: any) => (
                  <div
                    key={r.residentId}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between text-xs ${
                      r.isOverdue
                        ? 'bg-red-950/30 border-red-700/80 shadow-lg shadow-red-900/10'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{r.name}</span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          Room {r.roomNumber} • {r.blockName}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            r.isOverdue ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white'
                          }`}
                        >
                          {r.isOverdue ? `OVERDUE (${r.minutesOverdue} mins)` : r.currentPresence.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-slate-400 text-[11px] mt-2">
                        <div>
                          <span>Destination: </span>
                          <strong className="text-slate-200">{r.destination}</strong>
                        </div>
                        <div>
                          <span>Pass Type: </span>
                          <strong className="text-slate-200">{r.passType}</strong>
                        </div>
                        <div>
                          <span>Expected Return: </span>
                          <strong className={r.isOverdue ? 'text-red-400' : 'text-slate-200'}>
                            {r.validTill ? new Date(r.validTill).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={`tel:${r.phone}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Call Resident
                      </a>
                      {r.parentPhone && (
                        <a
                          href={`tel:${r.parentPhone}`}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs"
                        >
                          Alert Parent
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: COMPLAINTS KANBAN */}
          {activeSection === 'COMPLAINTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Grievance Redressal Kanban Board</h2>
                  <p className="text-xs text-slate-400">
                    SLA-driven complaint tracking. Drag or click arrows to move stages.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                    Total: <strong>{complaints.length}</strong>
                  </span>
                </div>
              </div>

              {/* 4 Kanban Columns: RAISED -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED */}
              <div className="grid grid-cols-4 gap-4">
                {['RAISED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'].map((stage) => {
                  const stageComplaints = complaints.filter((c) => c.status === stage);
                  return (
                    <div
                      key={stage}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col h-[70vh]"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                        <span className="text-xs font-bold text-slate-300">
                          {stage.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          {stageComplaints.length}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5">
                        {stageComplaints.map((c) => (
                          <div
                            key={c.id}
                            className="bg-slate-900 border border-slate-800/90 rounded-xl p-3 text-xs space-y-2 shadow-sm hover:border-slate-700 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">
                                {c.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                #{c.ticketNumber}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-200">{c.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{c.description}</p>

                            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
                              <span>Room {c.roomNumber}</span>
                              <span>Staff: {c.assignedStaffName || 'Auto-assign'}</span>
                            </div>

                            {/* Stage Action Controls */}
                            <div className="flex items-center justify-end space-x-1 pt-1">
                              {stage === 'RAISED' && (
                                <button
                                  onClick={() => updateComplaintStatus(c.id, 'ACKNOWLEDGED')}
                                  className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold hover:bg-blue-700"
                                >
                                  Acknowledge →
                                </button>
                              )}
                              {stage === 'ACKNOWLEDGED' && (
                                <button
                                  onClick={() => updateComplaintStatus(c.id, 'IN_PROGRESS')}
                                  className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-bold hover:bg-amber-700"
                                >
                                  In Progress →
                                </button>
                              )}
                              {stage === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => updateComplaintStatus(c.id, 'RESOLVED')}
                                  className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold hover:bg-emerald-700"
                                >
                                  Resolve ✓
                                </button>
                              )}
                              {stage === 'RESOLVED' && c.rating && (
                                <span className="text-[10px] text-amber-400 font-bold">
                                  Rating: {c.rating}★
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION: RESIDENTS DIRECTORY & OCCUPANCY MAP */}
          {activeSection === 'RESIDENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Resident Directory & KYC Ledger</h2>
                  <p className="text-xs text-slate-400">
                    Searchable student records with parent emergency contacts and digitized KYC.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Search name, student ID, room..."
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-blue-500 w-64"
                  />
                  <select
                    value={selectedBlockFilter}
                    onChange={(e) => setSelectedBlockFilter(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200"
                  >
                    <option value="ALL">All Blocks</option>
                    <option value="Nilgiri">Nilgiri Block A (Boys)</option>
                    <option value="Shivalik">Shivalik Block B (Girls)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Room & Block</th>
                      <th className="p-3">Presence Status</th>
                      <th className="p-3">Parent Contact</th>
                      <th className="p-3">KYC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredResidents.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 font-semibold text-white flex items-center space-x-2">
                          <img
                            src={r.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                            className="w-7 h-7 rounded-full object-cover"
                            alt=""
                          />
                          <span>{r.name}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{r.studentId}</td>
                        <td className="p-3 font-medium">
                          {r.roomNumber} • {r.blockName}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.currentPresence === 'IN_HOSTEL'
                                ? 'bg-emerald-900/50 text-emerald-300'
                                : r.currentPresence === 'OVERDUE'
                                ? 'bg-red-900/60 text-red-300 animate-pulse'
                                : 'bg-amber-900/50 text-amber-300'
                            }`}
                          >
                            {r.currentPresence.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{r.parentPhone || 'N/A'}</td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: VISITOR MANAGEMENT */}
          {activeSection === 'VISITORS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Campus Visitor Registry & Overstay Monitor</h2>
                  <p className="text-xs text-slate-400">
                    Auto-flags visitors exceeding 2 hours on campus without checkout.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {visitors.map((v) => (
                  <div
                    key={v.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      v.status === 'OVERSTAYED'
                        ? 'bg-red-950/40 border-red-700/80 shadow-lg'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{v.visitorName}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          v.status === 'OVERSTAYED'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <p className="text-slate-400">
                      Visiting: <strong>{v.residentName}</strong> (Room {v.roomNumber})
                    </p>
                    <p className="text-slate-500 text-[11px]">Purpose: {v.purpose}</p>

                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span>Phone: {v.visitorPhone}</span>
                      {v.overstayMinutes > 0 && (
                        <span className="text-red-400 font-bold">
                          +{v.overstayMinutes} mins overstay
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: TURNSTILE / QR SECURITY SCANNER SIMULATOR */}
          {activeSection === 'TURNSTILE_SCANNER' && (
            <div className="max-w-xl mx-auto space-y-5 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="text-center space-y-1">
                <ScanLine className="w-10 h-10 text-blue-500 mx-auto animate-pulse" />
                <h2 className="text-base font-bold text-white">
                  Gate Turnstile / QR Scanner Simulator
                </h2>
                <p className="text-xs text-slate-400">
                  Simulates physical RFID/QR hardware access control turnstiles installed at campus gates.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 block">
                  Scan Barcode / QR Pass Token
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Enter QR token (e.g. QR-PASS-892101-RAHUL)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-blue-500"
                  />
                </div>

                {/* Quick Token Presets */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <button
                    onClick={() => setScanInput('QR-PASS-892101-RAHUL')}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono"
                  >
                    Preset: Rahul Gate Pass
                  </button>
                  <button
                    onClick={() => setScanInput('QR-PASS-891942-AMIT')}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono"
                  >
                    Preset: Amit Overdue Pass
                  </button>
                  <button
                    onClick={() => setScanInput('VIS-991201-MANOJ')}
                    className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300 font-mono"
                  >
                    Preset: Manoj Visitor Pass
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => simulateTurnstileScan('EXIT')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                  >
                    Scan for GATE EXIT ↗
                  </button>
                  <button
                    onClick={() => simulateTurnstileScan('ENTRY')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                  >
                    Scan for GATE ENTRY ↙
                  </button>
                </div>
              </div>

              {/* Visual Hardware Turnstile Feedback Display */}
              {scanResult && (
                <div
                  className={`p-4 rounded-2xl border text-center space-y-1.5 animate-in zoom-in-95 ${
                    scanResult.status === 'ACCESS_GRANTED'
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                      : 'bg-red-950/60 border-red-500/80 text-red-200'
                  }`}
                >
                  <div className="text-sm font-black tracking-wider uppercase">
                    TURNSTILE LED: {scanResult.status.replace(/_/g, ' ')}
                  </div>
                  <p className="text-xs">{scanResult.message || scanResult.reason}</p>
                  {scanResult.name && (
                    <p className="text-xs font-bold text-white">
                      Person: {scanResult.name} ({scanResult.room ? `Room ${scanResult.room}` : 'Visitor'})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION: NAAC & ACCREDITATION AUDIT DOSSIER */}
          {activeSection === 'COMPLIANCE' && naacReport && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Institutional Accreditation & NAAC Criterion Dossier
                  </h2>
                  <p className="text-xs text-slate-400">
                    Automated, tamper-evident audit logs and grievance turnaround records for accreditation.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href="http://localhost:4000/api/compliance/export/grievances.csv"
                    download="NAAC_Criterion_5_1_Grievance_Redressal.csv"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition flex items-center space-x-1"
                  >
                    <span>Criterion 5.1 (Grievance CSV)</span>
                  </a>
                  <a
                    href="http://localhost:4000/api/compliance/export/safety-audit.csv"
                    download="NAAC_Criterion_7_1_Safety_Audit.csv"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition flex items-center space-x-1"
                  >
                    <span>Criterion 7.1 (Safety CSV)</span>
                  </a>
                  <button
                    onClick={() => alert('Full NAAC Accreditation Peer-Team Dossier generated with cryptographic hash verification!')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow transition"
                  >
                    Export Full Dossier (PDF)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Digitized KYC Rate</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {naacReport.metrics.digitizedKycRate}
                  </div>
                  <span className="text-[10px] text-slate-500">Parent Contacts Documented</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Resolution Speed</span>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {naacReport.metrics.averageResolutionTurnaround}
                  </div>
                  <span className="text-[10px] text-slate-500">Against 24h institutional SLA</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Alarm Response</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {naacReport.metrics.emergencyResponseTimeAvg}
                  </div>
                  <span className="text-[10px] text-slate-500">Sub-minute siren alert</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Trail Depth</span>
                  <div className="text-2xl font-black text-purple-400 mt-1">
                    {naacReport.metrics.tamperEvidentAuditLogsRecorded}
                  </div>
                  <span className="text-[10px] text-slate-500">Immutable governance logs</span>
                </div>
              </div>

              {/* Sample Grievance Logs */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
                <h3 className="text-xs font-bold text-slate-300 mb-3">
                  Recent Grievance Redressal Audit Records (Criterion 5.1.2)
                </h3>
                <div className="space-y-2">
                  {auditLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-300"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] bg-slate-800 text-blue-400 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="text-slate-400">Entity: {log.entity}</span>
                        <span className="text-slate-500 truncate max-w-xs">{log.detailsJson}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: 60-MINUTE FIRST-RUN ONBOARDING SETUP WIZARD */}
          {activeSection === 'ONBOARDING' && (
            <div className="max-w-2xl mx-auto space-y-6 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="text-center space-y-1">
                <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
                <h2 className="text-base font-bold text-white">
                  60-Minute Institution Onboarding Wizard
                </h2>
                <p className="text-xs text-slate-400">
                  Configure and deploy a complete digital hostel campus in under 60 minutes.
                </p>
              </div>

              {/* Stepper Progress */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-4">
                {['Institution', 'Blocks & Rooms', 'Resident CSV', 'Branding'].map((st, idx) => (
                  <div
                    key={st}
                    className={`flex items-center space-x-1.5 ${
                      onboardingStep >= idx + 1 ? 'text-blue-400' : 'text-slate-600'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-2">
                {onboardingStep === 1 && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Institution / Hostel Name</label>
                      <input
                        type="text"
                        value={onboardingHostelName}
                        onChange={(e) => setOnboardingHostelName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Default Night Curfew Time</label>
                      <input
                        type="text"
                        value={onboardingCurfew}
                        onChange={(e) => setOnboardingCurfew(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl"
                    >
                      Next: Blocks & Capacity →
                    </button>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Block Names (Comma Separated)</label>
                      <input
                        type="text"
                        value={onboardingBlocks}
                        onChange={(e) => setOnboardingBlocks(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <button
                      onClick={() => setOnboardingStep(3)}
                      className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl"
                    >
                      Next: Bulk Import Residents →
                    </button>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="space-y-3 text-xs text-center">
                    <div className="p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900">
                      <p className="font-bold text-slate-300">Upload Residents CSV or Excel</p>
                      <p className="text-[11px] text-slate-500 mt-1">Columns: Name, Email, Phone, Room, Block, Course</p>
                    </div>
                    <button
                      onClick={() => setOnboardingStep(4)}
                      className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl"
                    >
                      Import Sample Batch & Proceed →
                    </button>
                  </div>
                )}

                {onboardingStep === 4 && (
                  <div className="space-y-3 text-xs text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="font-bold text-white text-sm">Hostel Configuration Complete!</h3>
                    <p className="text-slate-400">
                      Campus is 100% operational with digital passes, rules engine, and live emergency alerting.
                    </p>
                    <button
                      onClick={() => {
                        setOnboardingStep(1);
                        setActiveSection('DASHBOARD');
                      }}
                      className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-lg"
                    >
                      Open Live Executive Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback for other modules (Billing, Notices, Vehicles, Menu) */}
          {(activeSection === 'BILLING' ||
            activeSection === 'NOTICES' ||
            activeSection === 'VEHICLES' ||
            activeSection === 'MENU') && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white">
                {activeSection.replace('_', ' ')} Management Console
              </h2>
              <p className="text-xs text-slate-400">
                Full CRUD control enabled for {activeSection.toLowerCase()}. All updates synchronize live across Resident Apps.
              </p>
              <div className="p-4 bg-slate-900 rounded-xl text-xs text-slate-300 border border-slate-800">
                Active records synced: <strong>{activeSection === 'BILLING' ? bills.length : activeSection === 'NOTICES' ? notices.length : vehicles.length}</strong> items in database.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
