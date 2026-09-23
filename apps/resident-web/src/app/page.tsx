'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  HeartPulse,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  Car,
  Users,
  QrCode,
  Calendar,
  PhoneCall,
  Bell,
  Utensils,
  CreditCard,
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Star,
  Check,
  Send,
  HelpCircle,
  Building,
  UserCheck,
  Layers,
  FileText,
  Activity,
  ArrowRight,
  LogOut,
  Plus,
  RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';

const API_BASE = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

export default function ResidentApp() {
  // Navigation Tabs: 'HOME' | 'PASSES' | 'COMPLAINTS' | 'MENU' | 'PROFILE'
  const [activeTab, setActiveTab] = useState<'HOME' | 'PASSES' | 'COMPLAINTS' | 'MENU' | 'PROFILE'>('HOME');

  // Modals
  const [showSosModal, setShowSosModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<{ title: string; qrValue: string; subtitle: string } | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  // Multi-Tenant Resident User Interface
  interface ResidentUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    room: string;
    block: string;
    avatar: string;
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    token: string;
  }

  const [user, setUser] = useState<ResidentUser | null>(null);
  const [colleges, setColleges] = useState<any[]>([]);
  const [authTab, setAuthTab] = useState<'LOGIN' | 'ENROLL'>('LOGIN');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Enroll form
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentRoom, setStudentRoom] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [course, setCourse] = useState('B.Tech Undergraduate');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // App Data
  const [complaints, setComplaints] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [menuData, setMenuData] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [isEatingToday, setIsEatingToday] = useState(true);
  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [sosAudioPlaying, setSosAudioPlaying] = useState(false);

  // Form states
  const [selectedComplaintCategory, setSelectedComplaintCategory] = useState('WATER');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [isAnonymousComplaint, setIsAnonymousComplaint] = useState(false);

  const [passType, setPassType] = useState('GATE_PASS');
  const [passReason, setPassReason] = useState('Market visit & grocery');
  const [passDestination, setPassDestination] = useState('Sector 18 Market');
  const [passHours, setPassHours] = useState('2');

  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorPurpose, setVisitorPurpose] = useState('');

  const [vehicleType, setVehicleType] = useState('TWO_WHEELER');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  const [ratingVal, setRatingVal] = useState(5);
  const [ratingText, setRatingText] = useState('');
  const [suggestionText, setSuggestionText] = useState('');

  // 1. Initial Login & Multi-Tenant Enrollment Check
  useEffect(() => {
    async function init() {
      // 1. Fetch live registered colleges
      try {
        const colRes = await fetch(`${API_BASE}/auth/colleges`);
        if (colRes.ok) {
          const cols = await colRes.json();
          setColleges(cols);
          if (cols.length > 0) {
            setSelectedCollegeId(cols[0].id);
            if (cols[0].blocks && cols[0].blocks.length > 0) {
              setSelectedBlock(cols[0].blocks[0]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch colleges:', e);
      }

      // 2. Check localStorage for active student session
      try {
        const savedUserStr = localStorage.getItem('shms_resident_user');
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.token) {
            setUser(parsed);
            fetchData(parsed.token, parsed.id);
          }
        }
      } catch (e) {
        console.error('Resident session restore error:', e);
      }
    }
    init();

    // 2. Setup Socket.io for real-time siren, pass & complaint updates
    const socket = io(SOCKET_URL);
    socket.on('emergency:triggered', (data) => {
      console.log('Real-time SOS Siren received:', data);
    });
    socket.on('pass:update', () => {
      if (user?.token && user?.id) fetchData(user.token, user.id);
    });
    socket.on('complaint:update', () => {
      if (user?.token && user?.id) fetchData(user.token, user.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function fetchData(token: string, residentId: string) {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [cmpRes, passRes, notRes, menuRes, billRes, visRes, vehRes, pollRes] = await Promise.all([
        fetch(`${API_BASE}/complaints?residentId=${residentId}`, { headers }),
        fetch(`${API_BASE}/passes?residentId=${residentId}`, { headers }),
        fetch(`${API_BASE}/notices`),
        fetch(`${API_BASE}/menu`),
        fetch(`${API_BASE}/billing?residentId=${residentId}`, { headers }),
        fetch(`${API_BASE}/visitors?residentId=${residentId}`, { headers }),
        fetch(`${API_BASE}/vehicles?residentId=${residentId}`, { headers }),
        fetch(`${API_BASE}/notices/polls`, { headers })
      ]);

      if (cmpRes.ok) setComplaints(await cmpRes.json());
      if (passRes.ok) setPasses(await passRes.json());
      if (notRes.ok) setNotices(await notRes.json());
      if (menuRes.ok) setMenuData(await menuRes.json());
      if (billRes.ok) setBills(await billRes.json());
      if (visRes.ok) setVisitors(await visRes.json());
      if (vehRes.ok) setVehicles(await vehRes.json());
      if (pollRes.ok) setPolls(await pollRes.json());
    } catch (err) {
      console.error('Fetch data error:', err);
    }
  }

  // Student Login Handler
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
      const residentObj: ResidentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '+91 99000 00000',
        room: data.user.residentProfile?.roomNumber || '101',
        block: data.user.residentProfile?.blockName || 'Block A',
        avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
        tenantId: data.user.tenantId,
        tenantName: data.user.tenantName || 'Campus Residence',
        tenantCode: data.user.tenantCode || 'CAMPUS',
        token: data.token
      };
      setUser(residentObj);
      localStorage.setItem('shms_resident_user', JSON.stringify(residentObj));
      fetchData(data.token, data.user.id);
    } catch (err) {
      setLoginError('Server connection error');
    } finally {
      setLoginLoading(false);
    }
  }

  // Student Enrollment Handler
  async function handleEnrollStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName || !studentEmail || !selectedCollegeId) {
      setEnrollError('College selection, Student Name, and Email are required');
      return;
    }
    setEnrollLoading(true);
    setEnrollError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeId: selectedCollegeId,
          name: studentName,
          email: studentEmail,
          password: studentPassword || 'student123',
          phone: studentPhone || '+91 99000 00000',
          studentId: studentRoll || `STU-${Date.now().toString().slice(-4)}`,
          roomNumber: studentRoom || '101',
          blockName: selectedBlock || 'Block A',
          course: course || 'B.Tech',
          parentName: parentName || 'Parent / Guardian',
          parentPhone: parentPhone || '+91 98000 11111'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrollError(data.error || 'Enrollment failed');
        setEnrollLoading(false);
        return;
      }
      const residentObj: ResidentUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || '+91 99000 00000',
        room: data.user.residentProfile?.roomNumber || '101',
        block: data.user.residentProfile?.blockName || 'Block A',
        avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
        tenantId: data.user.tenantId,
        tenantName: data.user.tenantName || 'Campus Residence',
        tenantCode: data.user.tenantCode || 'CAMPUS',
        token: data.token
      };
      setUser(residentObj);
      localStorage.setItem('shms_resident_user', JSON.stringify(residentObj));
      fetchData(data.token, data.user.id);
    } catch (err) {
      setEnrollError('Failed to connect to enrollment server');
    } finally {
      setEnrollLoading(false);
    }
  }

  // Logout / Switch Account Handler
  function handleLogout() {
    localStorage.removeItem('shms_resident_user');
    setUser(null);
    setComplaints([]);
    setPasses([]);
    setBills([]);
    setVisitors([]);
    setVehicles([]);
  }

  // SOS Trigger Action
  async function triggerEmergency(type: string) {
    if (!user.token) return;
    try {
      setSosStatus('SENDING');
      const res = await fetch(`${API_BASE}/emergency/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          emergencyType: type,
          locationDetails: `Room ${user.room}, ${user.block}`,
          gpsCoords: '28.4744° N, 77.5040° E'
        })
      });
      if (res.ok) {
        setSosStatus('SENT');
        setSosAudioPlaying(true);
        setTimeout(() => {
          setShowSosModal(false);
          setSosStatus(null);
        }, 3000);
      }
    } catch (err) {
      setSosStatus('ERROR');
    }
  }

  // 2-Click Complaint Submission
  async function submitComplaint() {
    if (!user.token) return;
    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          category: selectedComplaintCategory,
          title: complaintTitle || `${selectedComplaintCategory} Service Request`,
          description: complaintDesc || 'Immediate assistance required.',
          priority: 'HIGH',
          isAnonymous: isAnonymousComplaint
        })
      });
      if (res.ok) {
        setShowComplaintModal(false);
        setComplaintTitle('');
        setComplaintDesc('');
        fetchData(user.token, user.id);
        setActiveTab('COMPLAINTS');
      }
    } catch (err) {
      console.error('Submit complaint error:', err);
    }
  }

  // Request Pass
  async function submitPassRequest() {
    if (!user.token) return;
    try {
      const now = new Date();
      const till = new Date(now.getTime() + Number(passHours) * 60 * 60 * 1000);

      const res = await fetch(`${API_BASE}/passes/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          passType,
          reason: passReason,
          destination: passDestination,
          validFrom: now.toISOString(),
          validTill: till.toISOString()
        })
      });
      if (res.ok) {
        setShowPassModal(false);
        fetchData(user.token, user.id);
        setActiveTab('PASSES');
      }
    } catch (err) {
      console.error('Request pass error:', err);
    }
  }

  // Pre-approve Visitor
  async function submitVisitor() {
    if (!user.token || !visitorName) return;
    try {
      const res = await fetch(`${API_BASE}/visitors/pre-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          visitorName,
          visitorPhone,
          purpose: visitorPurpose || 'Personal Visit'
        })
      });
      if (res.ok) {
        setShowVisitorModal(false);
        setVisitorName('');
        setVisitorPhone('');
        fetchData(user.token, user.id);
      }
    } catch (err) {
      console.error('Visitor error:', err);
    }
  }

  // Register Vehicle
  async function submitVehicle() {
    if (!user.token || !licensePlate) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          vehicleType,
          licensePlate,
          model: vehicleModel || 'Standard Two-Wheeler'
        })
      });
      if (res.ok) {
        setShowVehicleModal(false);
        setLicensePlate('');
        fetchData(user.token, user.id);
      }
    } catch (err) {
      console.error('Vehicle error:', err);
    }
  }

  // Rate Complaint
  async function submitRating() {
    if (!showRatingModal || !user.token) return;
    try {
      await fetch(`${API_BASE}/complaints/${showRatingModal}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rating: ratingVal,
          ratingComment: ratingText
        })
      });
      setShowRatingModal(null);
      fetchData(user.token, user.id);
    } catch (err) {
      console.error('Rating error:', err);
    }
  }

  // Poll Vote
  async function votePoll(pollId: string, optionId: string) {
    if (!user.token) return;
    try {
      const res = await fetch(`${API_BASE}/notices/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ optionId })
      });
      if (res.ok) {
        fetchData(user.token, user.id);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  }

  // Meal Attendance Toggle
  async function toggleEatingToday() {
    const newState = !isEatingToday;
    setIsEatingToday(newState);
    if (user.token) {
      await fetch(`${API_BASE}/menu/eating-today`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ mealType: 'DINNER', isEating: newState })
      });
    }
  }

  // Pay Dues
  async function payBill(billId: string, dueAmount: number) {
    if (!user.token) return;
    try {
      const res = await fetch(`${API_BASE}/billing/${billId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount: dueAmount, method: 'UPI' })
      });
      if (res.ok) {
        alert('Payment Received! Receipt generated and digital payment recorded.');
        fetchData(user.token, user.id);
      }
    } catch (err) {
      console.error('Pay bill error:', err);
    }
  }

  // Active Pass
  const activePass = passes.find((p) => p.status === 'APPROVED' || p.status === 'ACTIVE');

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);
  const availableBlocks = selectedCollege?.blocks || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/25">
              SH
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white">SmartHostel Resident</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  Student Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Digital Passes • Grievances • Mess • 24/7 SOS</p>
            </div>
          </div>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 flex items-center space-x-1.5 transition"
          >
            <span>Campus Admin</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          </a>
        </header>

        {/* Portal Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-xl w-full z-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open for All Hostels & Colleges • Instant Digital Access</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                Resident Student Portal
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto">
                Sign in with your student credentials or join your campus hostel to access instant turnstile passes, meal updates, and rapid grievance redressal.
              </p>
            </div>

            {/* Auth Box */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl">
              {/* Tab Switcher */}
              <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthTab('LOGIN'); setLoginError(''); setEnrollError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
                    authTab === 'LOGIN'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Student Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('ENROLL'); setLoginError(''); setEnrollError(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
                    authTab === 'ENROLL'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Join Your College Hostel</span>
                </button>
              </div>

              {/* TAB 1: LOGIN */}
              {authTab === 'LOGIN' && (
                <div className="space-y-5">
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
                        setLoginError('Please enter your email');
                        return;
                      }
                      handleLogin(loginEmail);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Registered Student Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul.sharma@campus.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer"
                    >
                      {loginLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Enter Resident App</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* 1-Click Demo Resident Logins */}
                  <div className="pt-5 border-t border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                      Quick 1-Click Demo Residents
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleLogin('rahul.sharma@campus.edu')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition cursor-pointer"
                      >
                        <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Room A-204
                        </span>
                        <p className="text-xs font-bold text-white mt-1">Rahul Sharma</p>
                        <p className="text-[10px] text-slate-400 truncate">Apex Institute</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLogin('priya.patel@campus.edu')}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition cursor-pointer"
                      >
                        <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                          Room G-102
                        </span>
                        <p className="text-xs font-bold text-white mt-1">Priya Patel</p>
                        <p className="text-[10px] text-slate-400 truncate">Apex Institute</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ENROLL */}
              {authTab === 'ENROLL' && (
                <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
                  {enrollError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{enrollError}</span>
                    </div>
                  )}

                  {/* College Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Select Your College / University *
                    </label>
                    <select
                      value={selectedCollegeId}
                      onChange={(e) => {
                        const cId = e.target.value;
                        setSelectedCollegeId(cId);
                        const chosen = colleges.find((c) => c.id === cId);
                        if (chosen && chosen.blocks && chosen.blocks.length > 0) {
                          setSelectedBlock(chosen.blocks[0]);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - {c.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Gupta"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Student ID / Roll No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2026-CS-042"
                        value={studentRoll}
                        onChange={(e) => setStudentRoll(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Hostel Block
                      </label>
                      {availableBlocks.length > 0 ? (
                        <select
                          value={selectedBlock}
                          onChange={(e) => setSelectedBlock(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          {availableBlocks.map((b: string) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. Block A"
                          value={selectedBlock}
                          onChange={(e) => setSelectedBlock(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Room Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 204 or B-102"
                        value={studentRoom}
                        onChange={(e) => setStudentRoom(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Student Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. student@college.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Student Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+91 99000 00000"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Parent Emergency Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98000 11111"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={enrollLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {enrollLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Complete Enrollment & Enter Hostel</span>
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
    <div className="flex-1 flex flex-col min-h-screen relative pb-16">
      {/* 1. Header / Profile Bar */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-4 pt-6 pb-6 rounded-b-3xl shadow-lg relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-white/80 object-cover shadow-md"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-bold text-lg leading-tight">{user.name}</h1>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Verified
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center space-x-1 mt-0.5">
                <Building className="w-3.5 h-3.5 inline mr-1 text-blue-200" />
                <span className="font-semibold">{user.tenantName}</span>
                <span>•</span>
                <span>Room {user.room}</span>
                <span>•</span>
                <span>{user.block}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out / Switch Student"
              className="w-9 h-9 bg-white/10 hover:bg-red-500/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrolling Urgent Notice Ticker */}
        {notices.length > 0 && (
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center space-x-2 text-xs border border-white/15 overflow-hidden">
            <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 tracking-wider">
              NOTICE
            </span>
            <div className="truncate text-blue-50 font-medium">
              {notices[0]?.title}
            </div>
          </div>
        )}
      </header>

      {/* 2. Active Status Banners */}
      <div className="px-4 -mt-3 space-y-2 z-10">
        {activePass && (
          <div
            onClick={() =>
              setShowQrModal({
                title: `${activePass.passType.replace('_', ' ')} QR Pass`,
                qrValue: activePass.qrCodeToken,
                subtitle: `Valid till ${new Date(activePass.validTill).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Show at gate turnstile`
              })
            }
            className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:bg-emerald-700 transition"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-wide uppercase text-emerald-100">
                  {activePass.status === 'ACTIVE' ? 'Currently Out on Pass' : 'Gate Pass Approved'}
                </div>
                <div className="text-sm font-bold">
                  Tap to scan QR at Turnstile Gate
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-200" />
          </div>
        )}

        {bills.some((b) => b.dueAmount > 0) && (
          <div className="bg-amber-500/10 border border-amber-400/40 text-amber-900 p-2.5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                Dues Pending: ₹{bills.find((b) => b.dueAmount > 0)?.dueAmount.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('PROFILE')}
              className="bg-amber-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
            >
              Pay Now
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Dynamic Content Body */}
      <main className="flex-1 px-4 pt-4 pb-12 overflow-y-auto">
        {activeTab === 'HOME' && (
          <div className="space-y-5">
            {/* Quick Action Tile Grid (The Centerpiece) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Quick Actions</h2>
                <span className="text-[11px] text-blue-600 font-semibold">2-3 Taps Only</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {/* Complaint */}
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-1.5 shadow-inner">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Complaint</span>
                </button>

                {/* Gate Pass */}
                <button
                  onClick={() => {
                    setPassType('GATE_PASS');
                    setShowPassModal(true);
                  }}
                  className="bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-1.5 shadow-inner">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Gate Pass</span>
                </button>

                {/* Leave */}
                <button
                  onClick={() => {
                    setPassType('LEAVE');
                    setShowPassModal(true);
                  }}
                  className="bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-1.5 shadow-inner">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Leave</span>
                </button>

                {/* Visitor */}
                <button
                  onClick={() => setShowVisitorModal(true)}
                  className="bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-1.5 shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Visitor</span>
                </button>

                {/* Vehicle */}
                <button
                  onClick={() => setShowVehicleModal(true)}
                  className="bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-1.5 shadow-inner">
                    <Car className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Vehicle</span>
                </button>

                {/* Directory */}
                <button
                  onClick={() => setShowDirectoryModal(true)}
                  className="bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 hover:border-sky-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 mb-1.5 shadow-inner">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Contacts</span>
                </button>

                {/* Mess Menu */}
                <button
                  onClick={() => setActiveTab('MENU')}
                  className="bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-1.5 shadow-inner">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Mess Menu</span>
                </button>

                {/* Community & Polls */}
                <button
                  onClick={() => setShowCommunityModal(true)}
                  className="bg-slate-50 hover:bg-rose-50/70 border border-slate-200/80 hover:border-rose-300 rounded-2xl p-2.5 flex flex-col items-center text-center transition active:scale-95 shadow-sm"
                >
                  <div className="w-11 h-11 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-1.5 shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">Polls / Box</span>
                </button>
              </div>
            </div>

            {/* Today's Mess Menu Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 border border-orange-200 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-orange-500 text-white rounded-xl">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Today&apos;s Mess Menu
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {menuData?.today?.day || 'Monday'} Special
                    </p>
                  </div>
                </div>

                {/* Eating today toggle */}
                <button
                  onClick={toggleEatingToday}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition flex items-center space-x-1 ${
                    isEatingToday
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <Check className="w-3 h-3 inline" />
                  <span>{isEatingToday ? 'Eating Tonight' : 'Skipping'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2.5 rounded-2xl border border-orange-100 shadow-sm">
                  <span className="text-[10px] font-bold text-orange-600 block">LUNCH</span>
                  <p className="text-slate-700 font-medium line-clamp-2 mt-0.5">
                    {menuData?.today?.meals?.LUNCH || 'Dal Makhani, Rice, Roti, Salad'}
                  </p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-2xl border border-orange-100 shadow-sm">
                  <span className="text-[10px] font-bold text-orange-600 block">DINNER</span>
                  <p className="text-slate-700 font-medium line-clamp-2 mt-0.5">
                    {menuData?.today?.meals?.DINNER || 'Paneer Butter Masala, Naan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Complaints Snippet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">Active Complaints</h3>
                <button
                  onClick={() => setActiveTab('COMPLAINTS')}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  View All ({complaints.length})
                </button>
              </div>
              {complaints.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                  🎉 No open complaints — enjoy your day!
                </div>
              ) : (
                <div className="space-y-2">
                  {complaints.slice(0, 2).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (c.status === 'RESOLVED' && !c.rating) {
                          setShowRatingModal(c.id);
                        } else {
                          setActiveTab('COMPLAINTS');
                        }
                      }}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {c.category[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                            {c.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Ticket {c.ticketNumber} • SLA: {c.slaHours}h
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Campus Community Poll */}
            {polls.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Campus Poll</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-2.5">
                  {polls[0].question}
                </h4>
                <div className="space-y-1.5">
                  {polls[0].options?.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => votePoll(polls[0].id, opt.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between border transition ${
                        polls[0].userVotedOptionId === opt.id
                          ? 'bg-purple-100 border-purple-400 font-bold text-purple-900'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.text}</span>
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">
                        {opt.votes} votes ({opt.percentage}%)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Passes & Leave Screen */}
        {activeTab === 'PASSES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Passes & Leaves</h2>
              <button
                onClick={() => setShowPassModal(true)}
                className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow hover:bg-blue-700 transition"
              >
                + New Request
              </button>
            </div>

            {passes.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No pass requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passes.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {p.passType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {p.destination}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'APPROVED' || p.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{p.reason}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      <span>
                        Valid till:{' '}
                        {new Date(p.validTill).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {(p.status === 'APPROVED' || p.status === 'ACTIVE') && (
                        <button
                          onClick={() =>
                            setShowQrModal({
                              title: `${p.passType.replace('_', ' ')} QR`,
                              qrValue: p.qrCodeToken,
                              subtitle: `Scan at Turnstile Gate • Pass #${p.passNumber}`
                            })
                          }
                          className="text-blue-600 font-bold flex items-center space-x-1 hover:underline"
                        >
                          <QrCode className="w-3.5 h-3.5 inline" />
                          <span>Show QR</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Complaints Screen */}
        {activeTab === 'COMPLAINTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Complaints & Grievances</h2>
              <button
                onClick={() => setShowComplaintModal(true)}
                className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow hover:bg-blue-700 transition"
              >
                + Raise 2-Click
              </button>
            </div>

            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {c.category}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {c.ticketNumber}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>
                  </div>

                  {/* Animated 4-step progress stepper */}
                  <div className="border-t border-slate-100 pt-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                      <span className="text-blue-600">RAISED</span>
                      <span className={c.status !== 'RAISED' ? 'text-blue-600' : ''}>ACKNOWLEDGED</span>
                      <span className={c.status === 'IN_PROGRESS' || c.status === 'RESOLVED' ? 'text-blue-600' : ''}>IN PROGRESS</span>
                      <span className={c.status === 'RESOLVED' ? 'text-emerald-600' : ''}>RESOLVED</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          c.status === 'RESOLVED'
                            ? 'w-full bg-emerald-500'
                            : c.status === 'IN_PROGRESS'
                            ? 'w-3/4 bg-amber-500'
                            : c.status === 'ACKNOWLEDGED'
                            ? 'w-1/2 bg-blue-500'
                            : 'w-1/4 bg-blue-400'
                        }`}
                      />
                    </div>
                  </div>

                  {c.status === 'RESOLVED' && (
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-emerald-900 block text-[11px]">
                          Resolved in SLA time!
                        </span>
                        {c.rating ? (
                          <div className="flex items-center space-x-1 text-amber-500 text-xs mt-0.5">
                            {'★'.repeat(c.rating)}
                            <span className="text-slate-600 text-[10px] ml-1">
                              &ldquo;{c.ratingComment || 'Satisfied'}&rdquo;
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No rating submitted</span>
                        )}
                      </div>
                      {!c.rating && (
                        <button
                          onClick={() => setShowRatingModal(c.id)}
                          className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg hover:bg-emerald-700"
                        >
                          Rate (1-5★)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Mess Menu Screen */}
        {activeTab === 'MENU' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Weekly Mess Schedule</h2>
              <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg">
                FSSAI Certified
              </span>
            </div>

            {menuData?.schedule && (
              <div className="space-y-3">
                {Object.entries(menuData.schedule).map(([day, meals]: any) => (
                  <div key={day} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-bold text-slate-900">{day}</span>
                      {menuData?.today?.day === day && (
                        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">BREAKFAST</span>
                        <p className="text-slate-700">{meals.BREAKFAST}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">LUNCH</span>
                        <p className="text-slate-700">{meals.LUNCH}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">SNACKS</span>
                        <p className="text-slate-700">{meals.SNACKS}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">DINNER</span>
                        <p className="text-slate-700">{meals.DINNER}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Profile & Billing Screen */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Profile & Dues</h2>

            {/* Connected Institution & Sign Out */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Connected Campus Institution</span>
                  <p className="text-sm font-bold text-slate-800">{user.tenantName}</p>
                  <p className="text-xs text-blue-600 font-mono">College Code: {user.tenantCode}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* KYC Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">KYC & Hostel Verification</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  100% Digitized
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">Student Name</span>
                  <span className="font-semibold text-slate-800">{user.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Student Email</span>
                  <span className="font-semibold text-slate-800">{user.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Hostel Block</span>
                  <span className="font-semibold text-slate-800">{user.block}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Hostel Room</span>
                  <span className="font-semibold text-slate-800">{user.room}</span>
                </div>
              </div>
            </div>

            {/* Fee Dues & Receipts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Fee Invoices & Payments</h3>
              {bills.map((b) => (
                <div key={b.id} className="border border-slate-100 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{b.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Total: ₹{b.totalAmount.toLocaleString()}</span>
                    <span>Paid: ₹{b.paidAmount.toLocaleString()}</span>
                    <span className="font-bold text-red-600">
                      Due: ₹{b.dueAmount.toLocaleString()}
                    </span>
                  </div>
                  {b.dueAmount > 0 && (
                    <button
                      onClick={() => payBill(b.id, b.dueAmount)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg transition text-xs shadow-sm"
                    >
                      Pay Due ₹{b.dueAmount.toLocaleString()} via UPI
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Registered Vehicles */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Registered Vehicles</h3>
                <button
                  onClick={() => setShowVehicleModal(true)}
                  className="text-xs text-blue-600 font-bold"
                >
                  + Add
                </button>
              </div>
              {vehicles.length === 0 ? (
                <p className="text-xs text-slate-400">No vehicle registered</p>
              ) : (
                vehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() =>
                      setShowQrModal({
                        title: 'Vehicle Digital Parking Sticker',
                        qrValue: v.digitalPassQr,
                        subtitle: `${v.licensePlate} • ${v.parkingSlot}`
                      })
                    }
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{v.licensePlate}</span>
                      <span className="text-[10px] text-slate-500 block">{v.parkingSlot}</span>
                    </div>
                    <QrCode className="w-4 h-4 text-slate-600" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* 8. Persistent Floating SOS Button (Pulse Animation) */}
      <button
        onClick={() => setShowSosModal(true)}
        className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-sm px-5 py-3.5 rounded-full shadow-2xl flex items-center space-x-2 animate-sos-pulse border-2 border-white cursor-pointer active:scale-95 transition"
      >
        <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
        <span className="tracking-wider">SOS EMERGENCY</span>
      </button>

      {/* 9. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2.5 z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center text-xs transition ${
            activeTab === 'HOME' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('PASSES')}
          className={`flex flex-col items-center text-xs transition ${
            activeTab === 'PASSES' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Passes</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`flex flex-col items-center text-xs transition ${
            activeTab === 'COMPLAINTS' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Complaints</span>
        </button>

        <button
          onClick={() => setActiveTab('MENU')}
          className={`flex flex-col items-center text-xs transition ${
            activeTab === 'MENU' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center text-xs transition ${
            activeTab === 'PROFILE' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>

      {/* MODAL: Emergency SOS */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-red-600 font-black text-sm tracking-wide">
                <AlertTriangle className="w-5 h-5" />
                <span>CONFIRM EMERGENCY ALARM</span>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tapping an emergency category broadcasts an instant siren alarm with your room location (
              <strong>{user.room}</strong>) to Admin, Warden & Campus Security!
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => triggerEmergency('MEDICAL')}
                className="bg-red-50 hover:bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl flex flex-col items-center text-center transition active:scale-95 shadow-sm"
              >
                <HeartPulse className="w-7 h-7 text-red-600 mb-1" />
                <span className="text-xs font-black">Medical</span>
                <span className="text-[9px] text-red-500">Ambulance & Doctor</span>
              </button>

              <button
                onClick={() => triggerEmergency('FIRE')}
                className="bg-amber-50 hover:bg-amber-100 border-2 border-amber-500 text-amber-800 p-3 rounded-2xl flex flex-col items-center text-center transition active:scale-95 shadow-sm"
              >
                <Flame className="w-7 h-7 text-amber-600 mb-1" />
                <span className="text-xs font-black">Fire</span>
                <span className="text-[9px] text-amber-600">Evacuation Alarm</span>
              </button>

              <button
                onClick={() => triggerEmergency('SECURITY_THREAT')}
                className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-500 text-purple-800 p-3 rounded-2xl flex flex-col items-center text-center transition active:scale-95 shadow-sm"
              >
                <ShieldAlert className="w-7 h-7 text-purple-600 mb-1" />
                <span className="text-xs font-black">Security Threat</span>
                <span className="text-[9px] text-purple-600">Immediate Guard Dispatch</span>
              </button>

              <button
                onClick={() => triggerEmergency('OTHER')}
                className="bg-slate-50 hover:bg-slate-100 border-2 border-slate-400 text-slate-800 p-3 rounded-2xl flex flex-col items-center text-center transition active:scale-95 shadow-sm"
              >
                <AlertTriangle className="w-7 h-7 text-slate-700 mb-1" />
                <span className="text-xs font-black">Other Crisis</span>
                <span className="text-[9px] text-slate-500">Urgent Assistance</span>
              </button>
            </div>

            {sosStatus === 'SENT' && (
              <div className="bg-emerald-600 text-white p-3 rounded-xl text-center text-xs font-bold animate-pulse">
                🚨 SIREN SENT! Warden & Security Desk Alerted. Stay calm, help is arriving!
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: 2-Click Complaint Raise */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">2-Click Complaint Raise</h3>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Category Select */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                Step 1: Select Category
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: 'WATER', icon: Droplets, color: 'text-blue-500' },
                  { key: 'ELECTRICITY', icon: Zap, color: 'text-amber-500' },
                  { key: 'WIFI', icon: Wifi, color: 'text-sky-500' },
                  { key: 'HOUSEKEEPING', icon: Sparkles, color: 'text-emerald-500' },
                  { key: 'SECURITY', icon: ShieldAlert, color: 'text-red-500' }
                ].map((c) => {
                  const Icon = c.icon;
                  const isSel = selectedComplaintCategory === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setSelectedComplaintCategory(c.key)}
                      className={`p-2 rounded-xl border flex flex-col items-center transition ${
                        isSel
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-0.5 ${isSel ? 'text-white' : c.color}`} />
                      <span className="text-[9px] font-bold tracking-tight">
                        {c.key === 'HOUSEKEEPING' ? 'Clean' : c.key}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Title & Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">
                Step 2: Detail or 1-Tap Preset
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'No water in tap',
                  'Low geyser pressure',
                  'Fan / AC not working',
                  'Wi-Fi router down',
                  'Room cleaning needed'
                ].map((txt) => (
                  <button
                    key={txt}
                    onClick={() => {
                      setComplaintTitle(txt);
                      setComplaintDesc(txt);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200 transition font-medium"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Title (or type custom issue)"
                value={complaintTitle}
                onChange={(e) => setComplaintTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-blue-600 bg-slate-50"
              />

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="anon"
                  checked={isAnonymousComplaint}
                  onChange={(e) => setIsAnonymousComplaint(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="anon" className="text-[11px] text-slate-600">
                  Submit anonymously (for roommate / harassment issues)
                </label>
              </div>
            </div>

            <button
              onClick={submitComplaint}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-2xl transition text-xs shadow-md"
            >
              Submit Complaint (Auto-routes to Department)
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Gate Pass / Leave Request */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3.5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                Apply for {passType === 'GATE_PASS' ? 'Gate Pass' : 'Leave'}
              </h3>
              <button
                onClick={() => setShowPassModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50">
              <button
                onClick={() => setPassType('GATE_PASS')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  passType === 'GATE_PASS' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
                }`}
              >
                Gate Pass (Today)
              </button>
              <button
                onClick={() => setPassType('LEAVE')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  passType === 'LEAVE' ? 'bg-white shadow text-purple-600' : 'text-slate-500'
                }`}
              >
                Leave (Multi-day)
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Destination</label>
                <input
                  type="text"
                  value={passDestination}
                  onChange={(e) => setPassDestination(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="e.g. Sector 18 Market or Hometown"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Reason</label>
                <input
                  type="text"
                  value={passReason}
                  onChange={(e) => setPassReason(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="e.g. Buying project stationery"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                  Duration (Hours / Days)
                </label>
                <select
                  value={passHours}
                  onChange={(e) => setPassHours(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="2">2 Hours (Auto-Approval eligible)</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours (Full Day)</option>
                  <option value="48">2 Days (Warden Approval)</option>
                  <option value="96">4 Days (Leave to Hometown)</option>
                </select>
              </div>
            </div>

            <button
              onClick={submitPassRequest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-2xl transition text-xs shadow-md"
            >
              Generate Pass & QR Code
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Visitor Pre-Approval */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3.5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">Pre-Approve Visitor</h3>
              <button
                onClick={() => setShowVisitorModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Visitor Name</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="e.g. Ramesh Sharma"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Purpose</label>
                <input
                  type="text"
                  value={visitorPurpose}
                  onChange={(e) => setVisitorPurpose(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="e.g. Family visit / Dropping books"
                />
              </div>
            </div>

            <button
              onClick={submitVisitor}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-2xl transition text-xs shadow-md"
            >
              Generate Visitor Pass OTP / QR
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Vehicle Registration */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3.5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">Register Campus Vehicle</h3>
              <button
                onClick={() => setShowVehicleModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="TWO_WHEELER">Two-Wheeler (Motorbike / Scooter)</option>
                  <option value="BICYCLE">Bicycle</option>
                  <option value="FOUR_WHEELER">Car (Requires special parking pass)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">License Plate Number</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="e.g. DL-3S-AB-1234"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Model / Make</label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                  placeholder="e.g. Honda Activa 6G"
                />
              </div>
            </div>

            <button
              onClick={submitVehicle}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-2xl transition text-xs shadow-md"
            >
              Issue Digital Parking Sticker & QR
            </button>
          </div>
        </div>
      )}

      {/* MODAL: QR Code Display (Dynamic Turnstile Pass) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-800">{showQrModal.title}</h3>

            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
              <QRCodeSVG value={showQrModal.qrValue} size={180} />
            </div>

            <div className="text-xs text-slate-600">
              <p className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 py-1 px-2 rounded-lg inline-block">
                {showQrModal.qrValue}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{showQrModal.subtitle}</p>
            </div>

            <button
              onClick={() => setShowQrModal(null)}
              className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Complaint Feedback Rating */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 text-center space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-800">Rate Service Quality</h3>
            <p className="text-xs text-slate-500">Your rating feeds NAAC audit analytics</p>

            <div className="flex justify-center space-x-2 text-2xl text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingVal(star)}
                  className={`transition ${star <= ratingVal ? 'scale-110' : 'opacity-40'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Optional comment (e.g. Fixed quickly!)"
              value={ratingText}
              onChange={(e) => setRatingText(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50"
            />

            <button
              onClick={submitRating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Emergency Directory Contacts */}
      {showDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">Campus & Emergency Contacts</h3>
              <button
                onClick={() => setShowDirectoryModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {[
                { role: 'Hostel Warden (Boys)', name: 'Dr. R.K. Sharma', phone: '+91 98111 00002' },
                { role: 'Hostel Warden (Girls)', name: 'Prof. Sunita Rao', phone: '+91 98111 00003' },
                { role: 'Gate 1 Security Post', name: 'Officer Rajesh Kumar', phone: '+91 98111 00004' },
                { role: 'Campus Ambulance & Clinic', name: 'Dr. Alok Verma', phone: '+91 98765 43213' },
                { role: 'Head Electrician', name: 'Suresh Kumar', phone: '+91 98111 00006' },
                { role: 'Senior Plumber', name: 'Mahendra Singh', phone: '+91 98111 00007' }
              ].map((c) => (
                <div key={c.role} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{c.role}</span>
                    <span className="text-[10px] text-slate-500">{c.name} • {c.phone}</span>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Community Polls & Suggestion Box */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">Community Suggestion Box</h3>
              <button
                onClick={() => setShowCommunityModal(false)}
                className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Submit ideas directly to the Hostel Director & Warden. You can submit anonymously.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Can we extend library hours till 2 AM during mid-term exam week?"
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />

            <button
              onClick={async () => {
                if (!suggestionText) return;
                await fetch(`${API_BASE}/compliance/suggestions`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: 'Resident Campus Suggestion',
                    content: suggestionText,
                    isAnonymous: true
                  })
                });
                alert('Suggestion forwarded to Hostel Director & Chief Warden!');
                setSuggestionText('');
                setShowCommunityModal(false);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs shadow-md"
            >
              Submit to Director
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
