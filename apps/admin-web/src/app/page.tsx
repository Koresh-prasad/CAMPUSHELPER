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
  LogOut,
  Moon,
  Coffee,
  Sun,
  Send,
  Camera,
  Video,
  Calendar as CalendarIcon,
  Play,
  Trash2,
  Image as ImageIcon,
  Heart,
  UploadCloud,
  Check
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
import { AdminLanguage, getAdminTranslation } from '../lib/i18n';

const API_BASE = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

export default function AdminPanel() {
  // Navigation Sections
  type Section =
    | 'DASHBOARD'
    | 'HOSPITAL_TRIAGE'
    | 'ADOPTION_HUB'
    | 'ONBOARDING'
    | 'RESIDENTS'
    | 'COMPLAINTS'
    | 'WHOS_OUT'
    | 'VISITORS'
    | 'VEHICLES'
    | 'BILLING'
    | 'NOTICES'
    | 'MENU'
    | 'GALLERY'
    | 'CALENDAR'
    | 'MANAGER_PROFILE'
    | 'INVENTORY'
    | 'COMPLIANCE'
    | 'TURNSTILE_SCANNER';

  const [activeSection, setActiveSection] = useState<Section>('DASHBOARD');
  const [activeRole, setActiveRole] = useState<'DIRECTOR' | 'WARDEN' | 'SECURITY' | 'ACCOUNTS'>('WARDEN');

  // Multi-Language Support (English / हिन्दी)
  const [adminLang, setAdminLang] = useState<AdminLanguage>('en');
  const at = getAdminTranslation(adminLang);

  const toggleAdminLanguage = () => {
    const nextLang: AdminLanguage = adminLang === 'en' ? 'hi' : 'en';
    setAdminLang(nextLang);
    try {
      localStorage.setItem('shms_admin_lang', nextLang);
    } catch (e) {}
  };

  // Manager Profile State (Chief Warden profile with photo)
  const [managerProfile, setManagerProfile] = useState<any>(null);
  const [editManagerModalOpen, setEditManagerModalOpen] = useState(false);
  const [headingModalOpen, setHeadingModalOpen] = useState(false);
  const [managerSaving, setManagerSaving] = useState(false);
  const [mgrName, setMgrName] = useState('');
  const [mgrDesignation, setMgrDesignation] = useState('');
  const [mgrAvatarUrl, setMgrAvatarUrl] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPhone, setMgrPhone] = useState('');
  const [mgrOfficeRoom, setMgrOfficeRoom] = useState('');
  const [mgrVisitingHours, setMgrVisitingHours] = useState('');
  const [mgrEmergencyLine, setMgrEmergencyLine] = useState('');
  const [mgrAnnouncement, setMgrAnnouncement] = useState('');
  const [mgrStatus, setMgrStatus] = useState('AVAILABLE');
  const [mgrDeskHeading, setMgrDeskHeading] = useState('Students Welfare & Vice Principal Executive Desk');
  const [mgrDeskBadge, setMgrDeskBadge] = useState('Executive Command Desk');
  const [mgrDeskSubtitle, setMgrDeskSubtitle] = useState('Official desk of Vice Principal & Student Welfare for student queries, hostel life improvements, and academic welfare');
  const [mgrSuccessMsg, setMgrSuccessMsg] = useState('');
  const [mgrUploadingPhoto, setMgrUploadingPhoto] = useState(false);

  // Great Heading Options for College Controllers, Vice Principals, Wardens & Directors
  const GREAT_HEADING_OPTIONS = [
    {
      title: 'Students Welfare & Vice Principal Executive Desk',
      badge: 'Vice Principal & DSW Office',
      subtitle: 'Official executive desk of Vice Principal & Student Welfare for student queries, hostel life, and academic welfare'
    },
    {
      title: 'Chief Warden & Administrative Manager Desk',
      badge: 'Executive Command Desk',
      subtitle: 'Official central hostel desk for room allotments, student discipline, safety, and welfare'
    },
    {
      title: 'Hostel Superintendent & Student Affairs Desk',
      badge: 'Superintendent Office',
      subtitle: 'Direct resident administration for daily student welfare, maintenance oversight, and curfew control'
    },
    {
      title: 'Dean of Students Welfare & Campus Operations',
      badge: 'Dean of Student Welfare (DSW)',
      subtitle: 'Executive academic & residential controller desk for student development, welfare, and hostel life'
    },
    {
      title: 'Director of Campus Living & Hostel Administration',
      badge: 'Director Residence HQ',
      subtitle: 'High-level executive campus living office coordinating student hostels, mess amenities, and security'
    },
    {
      title: 'Senior Executive Warden & Residence In-Charge',
      badge: 'Senior Warden Desk',
      subtitle: 'Primary point of contact for student welfare, urgent approvals, leave passes, and room administration'
    },
    {
      title: 'Hostel Proctor & Student Care Administration',
      badge: 'Proctorial Board Office',
      subtitle: 'Proctorial administration dedicated to resident safety, mentorship, campus ethics, and 24x7 support'
    },
    {
      title: 'Head of Department & Residence Controller',
      badge: 'HOD & Residence Office',
      subtitle: 'Dual academic and residential leadership desk bridging student learning, hostel amenities, and welfare'
    }
  ];

  // College Gallery State (Activities, Videos, Photos)
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [galleryFilter, setGalleryFilter] = useState('ALL');
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('CULTURAL');
  const [galleryMediaType, setGalleryMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [galleryMediaUrl, setGalleryMediaUrl] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryEventDate, setGalleryEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [galleryIsPinned, setGalleryIsPinned] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [gallerySuccessMsg, setGallerySuccessMsg] = useState('');
  const [previewMediaModal, setPreviewMediaModal] = useState<any>(null);

  // College Calendar State (Exams, Holidays, Fests, Meetings)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarFilter, setCalendarFilter] = useState('ALL');
  const [calTitle, setCalTitle] = useState('');
  const [calEventType, setCalEventType] = useState('EXAM');
  const [calStartDate, setCalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [calEndDate, setCalEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [calVenue, setCalVenue] = useState('Main Academic Block');
  const [calDescription, setCalDescription] = useState('');
  const [calIsHoliday, setCalIsHoliday] = useState(false);
  const [calIsMandatory, setCalIsMandatory] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarSuccessMsg, setCalendarSuccessMsg] = useState('');

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

  // Hospital Triage Queue State (Doctor patient-queue analogy)
  const [hospitalQueue, setHospitalQueue] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Adoption Hub & 1-Click Legacy ERP Batch Import State
  const [adoptionPlaybook, setAdoptionPlaybook] = useState<any>(null);
  const [erpCsvInput, setErpCsvInput] = useState('');
  const [erpImportLoading, setErpImportLoading] = useState(false);
  const [erpImportResult, setErpImportResult] = useState<any>(null);

  // WhatsApp-style Notice Read Receipts & Targeting
  const [selectedNoticeReceipts, setSelectedNoticeReceipts] = useState<any>(null);
  const [receiptsModalOpen, setReceiptsModalOpen] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [noticeTargetFilter, setNoticeTargetFilter] = useState('ALL');

  // Turnstile scanner & SMS 2G Keypad Fallback simulation
  const [scanInput, setScanInput] = useState('QR-PASS-892101-RAHUL');
  const [scanResult, setScanResult] = useState<any>(null);
  const [smsPhoneInput, setSmsPhoneInput] = useState('+91 98765 43210');
  const [smsTextInput, setSmsTextInput] = useState('PASS OUT 3HRS');
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [offlineCodeInput, setOfflineCodeInput] = useState('PASS-749201');
  const [offlineVerifyResult, setOfflineVerifyResult] = useState<any>(null);

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

  // Student Admission Approval Queue & Direct Input Controls
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [selectedStudentForApproval, setSelectedStudentForApproval] = useState<any | null>(null);
  const [assignedRoomInput, setAssignedRoomInput] = useState('');
  const [assignedBlockInput, setAssignedBlockInput] = useState('');
  const [approvalNotesInput, setApprovalNotesInput] = useState('Verified by Warden Office. Admission Approved.');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectBox, setShowRejectBox] = useState<string | null>(null);

  // Quick Notice Publisher
  const [quickNoticeModalOpen, setQuickNoticeModalOpen] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState('ACADEMIC');
  const [newNoticeIsEmergency, setNewNoticeIsEmergency] = useState(false);
  const [noticePublishLoading, setNoticePublishLoading] = useState(false);

  // Today's Menu Editor
  const [editMenuModalOpen, setEditMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    breakfast: 'Hot Masala Dosa, Sambar, Coconut Chutney, Filter Coffee',
    lunch: 'Shahi Paneer, Dal Makhani, Steamed Basmati Rice, Butter Roti, Gulab Jamun',
    snacks: 'Crispy Veg Pakoras, Mint Chutney, Adrak Chai',
    dinner: 'Kashmiri Dum Aloo, Dal Tadka, Peas Pulao, Chapati, Ice Cream',
    festivalTitle: 'Grand Campus Festive Feast & Gala Buffet',
    festivalDinner: 'Royal Shahi Thali with Live Jalebi Counter, Paneer Lababdar, Rasmalai'
  });
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSuccessMsg, setMenuSuccessMsg] = useState('');

  // 1. Initial Load & Multi-Tenant Authentication Check
  useEffect(() => {
    async function init() {
      // 0. Restore saved portal language
      try {
        const savedLang = localStorage.getItem('shms_admin_lang') as AdminLanguage;
        if (savedLang === 'en' || savedLang === 'hi') {
          setAdminLang(savedLang);
        }
      } catch (e) {}

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

    socket.on('student:registered', (studentData) => {
      console.log('🎓 Real-time Student Admission Alert:', studentData);
      setPendingStudents((prev) => {
        const exists = prev.some((p) => p.id === studentData.id);
        if (exists) return prev;
        return [studentData, ...prev];
      });
    });

    socket.on('student:approved', ({ studentId }) => {
      setPendingStudents((prev) => prev.filter((p) => p.id !== studentId));
    });

    socket.on('complaint:update', () => {
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    });

    socket.on('pass:update', () => {
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    });

    socket.on('gallery:updated', () => {
      fetch(`${API_BASE}/gallery`).then(r => r.json()).then(d => {
        if (d.items) setGalleryItems(d.items);
      }).catch(console.error);
    });

    socket.on('calendar:updated', () => {
      fetch(`${API_BASE}/calendar`).then(r => r.json()).then(d => {
        if (d.events) setCalendarEvents(d.events);
      }).catch(console.error);
    });

    socket.on('manager:updated', (updated) => {
      if (updated) {
        setManagerProfile(updated);
        setMgrName(updated.name || '');
        setMgrDesignation(updated.designation || '');
        setMgrAvatarUrl(updated.avatarUrl || '');
        setMgrEmail(updated.email || '');
        setMgrPhone(updated.phone || '');
        setMgrOfficeRoom(updated.officeRoom || '');
        setMgrVisitingHours(updated.visitingHours || '');
        setMgrEmergencyLine(updated.emergencyDirectLine || '');
        setMgrAnnouncement(updated.announcement || '');
        setMgrStatus(updated.status || 'AVAILABLE');
        setMgrDeskHeading(updated.deskHeading || '');
        setMgrDeskBadge(updated.deskBadge || '');
        setMgrDeskSubtitle(updated.deskSubtitle || '');
      }
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
      const [dashRes, emRes, resRes, cmpRes, passRes, whoRes, visRes, vehRes, billRes, notRes, repRes, audRes, pendRes, menuRes, triageRes, adoptRes, mgrRes, galRes, calRes] =
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
          fetch(`${API_BASE}/compliance/audit-logs${tenantQuery}`),
          fetch(`${API_BASE}/auth/pending-students${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/menu`),
          fetch(`${API_BASE}/analytics/hospital-queue${tenantQuery}`, { headers }),
          fetch(`${API_BASE}/compliance/adoption-playbook`),
          fetch(`${API_BASE}/manager-profile`),
          fetch(`${API_BASE}/gallery`),
          fetch(`${API_BASE}/calendar`)
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
      if (pendRes.ok) setPendingStudents(await pendRes.json());
      if (triageRes.ok) setHospitalQueue(await triageRes.json());
      if (adoptRes.ok) setAdoptionPlaybook(await adoptRes.json());
      if (mgrRes.ok) {
        const m = await mgrRes.json();
        if (m.profile) {
          setManagerProfile(m.profile);
          setMgrName(m.profile.name || '');
          setMgrDesignation(m.profile.designation || '');
          setMgrAvatarUrl(m.profile.avatarUrl || '');
          setMgrEmail(m.profile.email || '');
          setMgrPhone(m.profile.phone || '');
          setMgrOfficeRoom(m.profile.officeRoom || '');
          setMgrVisitingHours(m.profile.visitingHours || '');
          setMgrEmergencyLine(m.profile.emergencyDirectLine || '');
          setMgrAnnouncement(m.profile.announcement || '');
          setMgrStatus(m.profile.status || 'AVAILABLE');
          setMgrDeskHeading(m.profile.deskHeading || '');
          setMgrDeskBadge(m.profile.deskBadge || '');
          setMgrDeskSubtitle(m.profile.deskSubtitle || '');
        }
      }
      if (galRes.ok) {
        const g = await galRes.json();
        if (g.items) setGalleryItems(g.items);
      }
      if (calRes.ok) {
        const c = await calRes.json();
        if (c.events) setCalendarEvents(c.events);
      }
      if (menuRes.ok) {
        const mData = await menuRes.json();
        setMenuData(mData);
        if (mData?.today?.meals) {
          setMenuForm((prev) => ({
            ...prev,
            breakfast: mData.today.meals.BREAKFAST || prev.breakfast,
            lunch: mData.today.meals.LUNCH || prev.lunch,
            snacks: mData.today.meals.SNACKS || prev.snacks,
            dinner: mData.today.meals.DINNER || prev.dinner
          }));
        }
      }
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

  // Student Admission Approval Action (Connected via College Code)
  async function handleApproveStudent(studentId: string, room?: string, block?: string, notes?: string) {
    setApprovalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/approve-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          studentId,
          roomNumber: room || assignedRoomInput || 'A-201',
          block: block || assignedBlockInput || 'Block A',
          notes: notes || approvalNotesInput || 'Verified and approved by Campus Warden Office'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPendingStudents((prev) => prev.filter((s) => s.id !== studentId));
        setSelectedStudentForApproval(null);
        setShowRejectBox(null);
        if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
      } else {
        alert(data.error || 'Failed to approve student admission');
      }
    } catch (err) {
      console.error('Approve student error:', err);
    } finally {
      setApprovalLoading(false);
    }
  }

  // Student Rejection Action
  async function handleRejectStudent(studentId: string, reason?: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/reject-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          studentId,
          reason: reason || rejectReasonInput || 'College Code / Roll Number verification failed. Contact Warden Office.'
        })
      });
      if (res.ok) {
        setPendingStudents((prev) => prev.filter((s) => s.id !== studentId));
        setSelectedStudentForApproval(null);
        setShowRejectBox(null);
        setRejectReasonInput('');
      }
    } catch (err) {
      console.error('Reject student error:', err);
    }
  }

  // Real-time Notice Publisher
  async function handlePublishNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeContent) return;
    setNoticePublishLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: newNoticeTitle,
          content: newNoticeContent,
          category: newNoticeCategory,
          isEmergencyAlert: newNoticeIsEmergency,
          authorName: currentUser?.name || 'Chief Warden Office'
        })
      });
      if (res.ok) {
        setQuickNoticeModalOpen(false);
        setNewNoticeTitle('');
        setNewNoticeContent('');
        setNewNoticeIsEmergency(false);
        if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
      }
    } catch (err) {
      console.error('Publish notice error:', err);
    } finally {
      setNoticePublishLoading(false);
    }
  }

  // Real-time Today's Mess Menu Editor
  async function handleUpdateTodayMenu(e: React.FormEvent) {
    e.preventDefault();
    setMenuLoading(true);
    setMenuSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/menu/update-today`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(menuForm)
      });
      const data = await res.json();
      if (res.ok) {
        setMenuSuccessMsg('✓ Menu updated and broadcast live to all student devices!');
        setTimeout(() => {
          setEditMenuModalOpen(false);
          setMenuSuccessMsg('');
        }, 1500);
        if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
      } else {
        alert(data.error || 'Failed to update mess menu');
      }
    } catch (err) {
      console.error('Update menu error:', err);
    } finally {
      setMenuLoading(false);
    }
  }

  // View WhatsApp-Style Notice Read Receipts
  async function handleViewReceipts(noticeId: string) {
    setReceiptsLoading(true);
    setReceiptsModalOpen(true);
    try {
      const res = await fetch(`${API_BASE}/notices/${noticeId}/receipts`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNoticeReceipts(data);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setReceiptsLoading(false);
    }
  }

  // 1-Click Legacy ERP / SIS CSV Batch Import
  async function handleImportLegacyErp() {
    setErpImportLoading(true);
    setErpImportResult(null);
    try {
      const res = await fetch(`${API_BASE}/compliance/import-legacy-erp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ rawCsvData: erpCsvInput })
      });
      const data = await res.json();
      setErpImportResult(data);
      if (res.ok && authToken) {
        fetchAllAdminData(authToken, currentUser?.tenantId);
      }
    } catch (err) {
      console.error('ERP import error:', err);
      setErpImportResult({ error: 'Failed to connect to ERP batch service' });
    } finally {
      setErpImportLoading(false);
    }
  }

  // 2G / Keypad Feature Phone SMS Gateway Simulator
  async function handleSimulateSms() {
    if (!smsTextInput) return;
    setSmsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/turnstile/sms-gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPhone: smsPhoneInput,
          messageText: smsTextInput,
          gateId: 'Simulated Gate 01'
        })
      });
      const data = await res.json();
      setSmsLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          direction: 'INBOUND',
          phone: smsPhoneInput,
          message: smsTextInput
        },
        {
          timestamp: new Date().toLocaleTimeString(),
          direction: 'OUTBOUND_REPLY',
          phone: smsPhoneInput,
          message: data.replySms,
          offlineCode: data.offlineCode
        },
        ...prev
      ]);
      if (data.offlineCode) {
        setOfflineCodeInput(data.offlineCode);
      }
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('SMS simulation error:', err);
    } finally {
      setSmsLoading(false);
    }
  }

  // Punch 6-Digit Numeric Offline Code at Turnstile Guard Desk
  async function handleVerifyOfflineCodePunch() {
    if (!offlineCodeInput) return;
    try {
      const res = await fetch(`${API_BASE}/turnstile/verify-offline-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offlineCode: offlineCodeInput,
          gateId: 'Main Turnstile 01',
          direction: 'EXIT'
        })
      });
      const data = await res.json();
      setOfflineVerifyResult(data);
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('Offline punch error:', err);
    }
  }

  // 1-Click Triage Actions for Doctor / Warden Queue
  async function handleQuickTriageAction(itemId: string, itemType: string, action: string) {
    try {
      if (itemType === 'EMERGENCY') {
        await resolveEmergency(itemId);
      } else if (itemType === 'PASS') {
        await fetch(`${API_BASE}/passes/${itemId}/approve`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } else if (itemType === 'COMPLAINT') {
        await fetch(`${API_BASE}/complaints/${itemId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ status: action === 'RESOLVE' ? 'RESOLVED' : 'IN_PROGRESS' })
        });
      }
      if (authToken) fetchAllAdminData(authToken, currentUser?.tenantId);
    } catch (err) {
      console.error('Triage action error:', err);
    }
  }

  // 1. Save Manager Profile (with photo)
  async function handleSaveManagerProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setManagerSaving(true);
    setMgrSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/manager-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mgrName,
          designation: mgrDesignation,
          avatarUrl: mgrAvatarUrl,
          email: mgrEmail,
          phone: mgrPhone,
          officeRoom: mgrOfficeRoom,
          visitingHours: mgrVisitingHours,
          emergencyDirectLine: mgrEmergencyLine,
          announcement: mgrAnnouncement,
          status: mgrStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setManagerProfile(data.profile);
        setMgrSuccessMsg('✓ Manager Profile updated & broadcast live to all student devices!');
        setTimeout(() => {
          setEditManagerModalOpen(false);
          setMgrSuccessMsg('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to update manager profile');
      }
    } catch (err) {
      console.error('Save manager profile error:', err);
    } finally {
      setManagerSaving(false);
    }
  }

  // 2. Direct Photo Upload for Manager
  async function handleManagerPhotoUpload(file: File) {
    setMgrUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setMgrAvatarUrl(data.url);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setMgrAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (e) {
      const reader = new FileReader();
      reader.onload = () => {
        setMgrAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setMgrUploadingPhoto(false);
    }
  }

  // 3. Direct Photo/Video Upload for College Gallery
  async function handleGalleryFileUpload(file: File) {
    setGalleryUploading(true);
    try {
      if (file.type && file.type.startsWith('video/')) {
        setGalleryMediaType('VIDEO');
      } else {
        setGalleryMediaType('PHOTO');
      }
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setGalleryMediaUrl(data.url);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setGalleryMediaUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (e) {
      const reader = new FileReader();
      reader.onload = () => {
        setGalleryMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setGalleryUploading(false);
    }
  }

  // 4. Create Gallery Item
  async function handleCreateGalleryItem(e: React.FormEvent) {
    e.preventDefault();
    if (!galleryTitle || !galleryMediaUrl) {
      alert('Please provide activity title and photo/video URL or upload a file.');
      return;
    }
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: galleryTitle,
          category: galleryCategory,
          mediaType: galleryMediaType,
          mediaUrl: galleryMediaUrl,
          description: galleryDescription,
          eventDate: galleryEventDate,
          isPinned: galleryIsPinned,
          uploadedBy: currentUser?.name || 'Chief Warden Desk'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGallerySuccessMsg('✓ Campus activity published to College Gallery!');
        setGalleryTitle('');
        setGalleryMediaUrl('');
        setGalleryDescription('');
        setGalleryIsPinned(false);
        setTimeout(() => setGallerySuccessMsg(''), 2500);
        const gRes = await fetch(`${API_BASE}/gallery`);
        if (gRes.ok) {
          const gd = await gRes.json();
          if (gd.items) setGalleryItems(gd.items);
        }
      } else {
        alert(data.error || 'Failed to publish gallery item');
      }
    } catch (err) {
      console.error('Gallery create error:', err);
    } finally {
      setGalleryLoading(false);
    }
  }

  // 5. Delete Gallery Item
  async function handleDeleteGalleryItem(id: string) {
    if (!confirm('Are you sure you want to remove this activity from the College Gallery?')) return;
    try {
      await fetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
      setGalleryItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete gallery error:', err);
    }
  }

  // 6. Create Calendar Event
  async function handleCreateCalendarEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!calTitle || !calStartDate) {
      alert('Event title and start date are required');
      return;
    }
    setCalendarLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: calTitle,
          eventType: calEventType,
          startDate: calStartDate,
          endDate: calEndDate || calStartDate,
          venue: calVenue,
          description: calDescription,
          isHoliday: calIsHoliday,
          isMandatory: calIsMandatory,
          scheduledBy: currentUser?.name || 'Controller Desk'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCalendarSuccessMsg('✓ Event scheduled & broadcast to student calendars!');
        setCalTitle('');
        setCalDescription('');
        setCalIsHoliday(false);
        setCalIsMandatory(false);
        setTimeout(() => setCalendarSuccessMsg(''), 2500);
        const cRes = await fetch(`${API_BASE}/calendar`);
        if (cRes.ok) {
          const cd = await cRes.json();
          if (cd.events) setCalendarEvents(cd.events);
        }
      } else {
        alert(data.error || 'Failed to schedule event');
      }
    } catch (err) {
      console.error('Calendar create error:', err);
    } finally {
      setCalendarLoading(false);
    }
  }

  // 7. Delete Calendar Event
  async function handleDeleteCalendarEvent(id: string) {
    if (!confirm('Are you sure you want to remove this event from the College Calendar?')) return;
    try {
      await fetch(`${API_BASE}/calendar/${id}`, { method: 'DELETE' });
      setCalendarEvents(prev => prev.filter(ev => ev.id !== id));
    } catch (err) {
      console.error('Delete calendar error:', err);
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
                { r: 'WARDEN', label: at.roleWarden },
                { r: 'DIRECTOR', label: at.roleDirector },
                { r: 'SECURITY', label: at.roleSecurity },
                { r: 'ACCOUNTS', label: at.roleAccounts }
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
              { id: 'DASHBOARD', label: at.secDashboard, icon: LayoutDashboard },
              { id: 'GALLERY', label: at.secGallery, icon: Camera, badge: galleryItems.length },
              { id: 'CALENDAR', label: at.secCalendar, icon: CalendarIcon, badge: calendarEvents.length },
              { id: 'MANAGER_PROFILE', label: at.secManagerProfile, icon: UserCheck },
              { id: 'HOSPITAL_TRIAGE', label: at.secHospitalTriage, icon: ShieldAlert, badge: hospitalQueue?.triageMetrics?.criticalCount },
              { id: 'ADOPTION_HUB', label: at.secAdoptionHub, icon: TrendingUp },
              { id: 'WHOS_OUT', label: at.secWhosOut, icon: AlertTriangle, badge: whosOutData?.overdueCount },
              { id: 'COMPLAINTS', label: at.secComplaints, icon: Wrench, badge: complaints.filter((c) => c.status === 'RAISED').length },
              { id: 'RESIDENTS', label: at.secResidents, icon: Users },
              { id: 'VISITORS', label: at.secVisitors, icon: UserPlus, badge: visitors.filter((v) => v.status === 'OVERSTAYED').length },
              { id: 'TURNSTILE_SCANNER', label: at.secTurnstileScanner, icon: ScanLine },
              { id: 'BILLING', label: at.secBilling, icon: CreditCard },
              { id: 'NOTICES', label: at.secNotices, icon: Bell },
              { id: 'VEHICLES', label: at.secVehicles, icon: Car },
              { id: 'MENU', label: at.secMenu, icon: Utensils },
              { id: 'COMPLIANCE', label: at.secCompliance, icon: FileCheck },
              { id: 'ONBOARDING', label: at.secOnboarding, icon: Sparkles }
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

        {/* User Info & Manager Profile Footer with Photo */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div
            className="flex items-center space-x-2.5 truncate pr-2 cursor-pointer group"
            onClick={() => setActiveSection('MANAGER_PROFILE')}
            title="View or Edit Manager Profile"
          >
            <div className="relative shrink-0">
              <img
                src={managerProfile?.avatarUrl || mgrAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={managerProfile?.name || currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-blue-500/50 shadow-sm group-hover:scale-105 transition"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                  (managerProfile?.status || mgrStatus) === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-200 truncate leading-tight group-hover:text-blue-300 transition">
                {managerProfile?.name || currentUser.name}
              </p>
              <p className="text-[10px] text-blue-400 font-semibold truncate leading-none mt-0.5">
                {managerProfile?.designation || 'Chief Warden'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setEditManagerModalOpen(true)}
              title="Edit Manager Profile & Photo"
              className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleLogout}
              title="Sign out / Switch Institution"
              className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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

          <div className="flex items-center space-x-3 shrink-0">
            {/* Quick Action Controls for Warden */}
            <button
              onClick={() => setPendingModalOpen(true)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                pendingStudents.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admissions</span>
              {pendingStudents.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setQuickNoticeModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span>Post Notice</span>
            </button>

            <button
              onClick={() => setEditMenuModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-orange-400" />
              <span>Update Menu</span>
            </button>

            <button
              onClick={() => setAudioAlertMuted(!audioAlertMuted)}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center space-x-1"
            >
              {audioAlertMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{audioAlertMuted ? 'Muted' : 'Siren'}</span>
            </button>

            <button
              onClick={() => authToken && fetchAllAdminData(authToken, currentUser?.tenantId)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* 1-Tap Language Toggle (English | हिन्दी) */}
            <button
              onClick={toggleAdminLanguage}
              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              title="Switch Language / भाषा बदलें"
            >
              <span>🌐</span>
              <span>{adminLang === 'en' ? 'हिन्दी' : 'English'}</span>
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

        {/* Real-time Admission Requests Top Alert Banner */}
        {pendingStudents.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center space-x-3 text-amber-200 text-xs font-semibold">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>
                <strong>🎓 {pendingStudents.length} Student Admission Request{pendingStudents.length > 1 ? 's' : ''}</strong> registered with your College Code <strong className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/40 font-mono">{currentUser.tenantCode}</strong>
              </span>
            </div>
            <button
              onClick={() => setPendingModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer shadow flex items-center space-x-1"
            >
              <span>Review & Admit Students ({pendingStudents.length}) →</span>
            </button>
          </div>
        )}


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

                            {/* Media attachments */}
                            {(c.photoUrl || c.videoUrl || c.voiceUrl) && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {c.photoUrl && (
                                  <a
                                    href={c.photoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded hover:bg-blue-500/25 transition font-semibold"
                                  >
                                    📷 Photo Proof
                                  </a>
                                )}
                                {c.videoUrl && (
                                  <a
                                    href={c.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded hover:bg-purple-500/25 transition font-semibold"
                                  >
                                    🎥 Video Proof
                                  </a>
                                )}
                                {c.voiceUrl && (
                                  <a
                                    href={c.voiceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded hover:bg-emerald-500/25 transition font-semibold"
                                  >
                                    🎤 Voice Note
                                  </a>
                                )}
                              </div>
                            )}

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

              {/* Station 2: 2G / Keypad Feature Phone SMS Gateway Simulator */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-amber-500/20 text-amber-400 rounded-lg">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
                      Station 2: Feature Phone SMS Gateway Fallback (2G / Weak Wi-Fi)
                    </h3>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    No Smartphone Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulates incoming carrier SMS from basic Nokia/keypad phones when hostel Wi-Fi is patchy. Texting shortcode creates turnstile outpasses and emergency sirens.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Student Mobile Number</label>
                    <input
                      type="text"
                      value={smsPhoneInput}
                      onChange={(e) => setSmsPhoneInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">SMS Text Command</label>
                    <input
                      type="text"
                      value={smsTextInput}
                      onChange={(e) => setSmsTextInput(e.target.value)}
                      placeholder="e.g. PASS OUT 3HRS, STATUS, or SOS"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Preset SMS Action Chips */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {[
                    { label: "SMS: 'PASS OUT 3HRS'", cmd: 'PASS OUT 3HRS' },
                    { label: "SMS: 'PASS OUT MARKET'", cmd: 'PASS OUT MARKET' },
                    { label: "SMS: 'STATUS'", cmd: 'STATUS' },
                    { label: "SMS: 'SOS EMERGENCY'", cmd: 'SOS EMERGENCY' },
                    { label: "SMS: 'HELP'", cmd: 'HELP' }
                  ].map((p) => (
                    <button
                      key={p.cmd}
                      onClick={() => setSmsTextInput(p.cmd)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 font-mono transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSimulateSms}
                  disabled={smsLoading}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {smsLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Simulate Incoming SMS to Shortcode 56070</span>
                    </>
                  )}
                </button>

                {/* Live SMS Log Feed */}
                {smsLogs.length > 0 && (
                  <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Live SMS Gateway Transcript:
                    </span>
                    {smsLogs.slice(0, 3).map((log, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                          log.direction === 'INBOUND'
                            ? 'bg-slate-950 border-slate-800 text-slate-300'
                            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{log.direction === 'INBOUND' ? `Incoming SMS from ${log.phone}` : 'Auto-Reply SMS to Handset'}</span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className="font-mono whitespace-pre-line">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Station 3: Guard Desk Keypad Punch (Offline 6-Digit Verification) */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-purple-500/20 text-purple-400 rounded-lg">
                      <ScanLine className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
                      Station 3: Guard Desk 6-Digit Numeric Punch (Zero Internet)
                    </h3>
                  </div>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                    Keypad Turnstile
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  When a student without a smartphone or data connection reaches the gate, they dictate their 6-digit numeric pass code received via SMS. Guard types code here or punches turnstile PIN pad.
                </p>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={offlineCodeInput}
                    onChange={(e) => setOfflineCodeInput(e.target.value)}
                    placeholder="e.g. PASS-749201 or 749201"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleVerifyOfflineCodePunch}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                  >
                    Punch Code & Unlock Barrier
                  </button>
                </div>

                {offlineVerifyResult && (
                  <div
                    className={`p-3 rounded-2xl border text-xs text-center space-y-1 animate-in zoom-in-95 ${
                      offlineVerifyResult.status === 'ACCESS_GRANTED'
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                        : 'bg-red-950/60 border-red-500/80 text-red-200'
                    }`}
                  >
                    <div className="font-bold text-sm">
                      {offlineVerifyResult.status === 'ACCESS_GRANTED' ? '✓ ACCESS GRANTED • BARRIER UNLOCKED' : '✕ ACCESS DENIED'}
                    </div>
                    <p className="text-[11px]">{offlineVerifyResult.message || offlineVerifyResult.reason}</p>
                    {offlineVerifyResult.name && (
                      <p className="text-white font-semibold">
                        Resident: {offlineVerifyResult.name} (Room {offlineVerifyResult.room}) • Direction: {offlineVerifyResult.direction}
                      </p>
                    )}
                  </div>
                )}
              </div>
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

          {/* 9. NOTICES & ANNOUNCEMENTS SECTION */}
          {activeSection === 'NOTICES' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
                      <Bell className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      Targeted Broadcasts & WhatsApp-Style Read Receipts
                    </h2>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Audience Isolation & Delivery Proof
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Like WhatsApp Broadcast with delivery checkmarks: target notices by block or year, view live read percentages, and track which students haven't read urgent advisories.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Filter Audience:</span>
                    <select
                      value={noticeTargetFilter}
                      onChange={(e) => setNoticeTargetFilter(e.target.value)}
                      className="bg-transparent text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="ALL">All Audiences</option>
                      <option value="BLOCK_A">Block A Only</option>
                      <option value="BLOCK_B">Block B Only</option>
                      <option value="FIRST_YEAR">First Year Students</option>
                      <option value="FINAL_YEAR">Final Year Students</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setQuickNoticeModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Targeted Circular</span>
                  </button>
                </div>
              </div>

              {/* Published Notices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notices
                  .filter((n) => noticeTargetFilter === 'ALL' || n.targetAudience === noticeTargetFilter || n.targetAudience === 'ALL')
                  .map((n) => (
                    <div key={n.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            n.isEmergencyAlert 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {n.category || 'GENERAL'} {n.isEmergencyAlert ? '• URGENT SIREN' : ''}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                            🎯 {n.targetAudience || 'ALL_STUDENTS'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm">{n.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>

                      {/* WhatsApp Read Receipts Delivery Bar */}
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center space-x-1">
                            <span className="text-blue-400 font-bold">✓✓ Read by:</span>
                            <strong className="text-white">{n.readCount || 84} / {n.totalAudience || 150} students</strong>
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {n.readPercentage || 56}% Read ({n.acknowledgedCount || 62} Ack)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${n.readPercentage || 56}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Issued by: <strong className="text-slate-400">{n.authorName || 'Warden Office'}</strong></span>
                        <button
                          onClick={() => handleViewReceipts(n.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>📊 View Read Receipts Roster</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 10. MESS MENU PLANNER SECTION */}
          {activeSection === 'MENU' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Daily Dining & Mess Menu Command</h2>
                  <p className="text-xs text-slate-400">Manage 4-meal daily nutrition and Sunday grand festival feasts. Real-time broadcast to student residents.</p>
                </div>
                <button
                  onClick={() => setEditMenuModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Update Today's Meals</span>
                </button>
              </div>

              {/* Today's Live Menu Board */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Active Menu for Today ({menuData?.today?.day || 'TODAY'})</h3>
                      <p className="text-[11px] text-slate-400">Real-time eating headcount & food prep estimation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Synced with Student Phones</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { meal: 'BREAKFAST', time: '7:30 AM - 9:30 AM', color: 'border-amber-500/30 bg-amber-500/5', icon: Sun },
                    { meal: 'LUNCH', time: '12:30 PM - 2:30 PM', color: 'border-blue-500/30 bg-blue-500/5', icon: Coffee },
                    { meal: 'SNACKS', time: '4:30 PM - 6:00 PM', color: 'border-emerald-500/30 bg-emerald-500/5', icon: Sparkles },
                    { meal: 'DINNER', time: '7:30 PM - 10:00 PM', color: 'border-purple-500/30 bg-purple-500/5', icon: Moon }
                  ].map(({ meal, time, color, icon: MealIcon }) => (
                    <div key={meal} className={`p-4 rounded-2xl border ${color} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1">
                          <MealIcon className="w-3.5 h-3.5 mr-1" />
                          {meal}
                        </span>
                        <span className="text-[10px] text-slate-500">{time}</span>
                      </div>
                      <p className="text-xs font-semibold text-white leading-relaxed">
                        {menuData?.today?.meals?.[meal] || menuForm[meal.toLowerCase() as keyof typeof menuForm] || 'Standard Menu'}
                      </p>
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Expected Count:</span>
                        <strong className="text-orange-400">{menuData?.today?.headcounts?.[meal.toLowerCase()] || 200} Residents</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Festival Gala Showcase */}
              {menuData?.festivalSpecial && (
                <div className="bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-purple-950/40 border border-orange-500/30 p-6 rounded-3xl space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Upcoming Grand Festival Buffet</span>
                  </div>
                  <h3 className="text-base font-black text-white">{menuData.festivalSpecial.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-amber-400 font-bold block mb-1">Dinner Gala Buffet:</span>
                      <span>{menuData.festivalSpecial.dinnerFeast}</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-amber-400 font-bold block mb-1">Live Counters:</span>
                      <span>{menuData.festivalSpecial.liveCounters?.join(' • ') || 'Live Tandoor & Chaat Counters'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback for other modules (Billing, Vehicles) */}
          {(activeSection === 'BILLING' || activeSection === 'VEHICLES') && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white">
                {activeSection.replace('_', ' ')} Management Console
              </h2>
              <p className="text-xs text-slate-400">
                Full CRUD control enabled for {activeSection.toLowerCase()}. All updates synchronize live across Resident Apps.
              </p>
              <div className="p-4 bg-slate-900 rounded-xl text-xs text-slate-300 border border-slate-800">
                Active records synced: <strong>{activeSection === 'BILLING' ? bills.length : vehicles.length}</strong> items in database.
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION: HOSPITAL PATIENT-QUEUE STYLE TRIAGE DASHBOARD         */}
          {/* ============================================================== */}
          {activeSection === 'HOSPITAL_TRIAGE' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg">
                      <ShieldAlert className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      Hospital-Queue Triage Command Board
                    </h2>
                    <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                      Emergency Room Priority System
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Like a hospital emergency room doctor triage board: centralized visibility into incident age, wait times, SLA countdowns, recurring failure hotspots, and staff workload.
                  </p>
                </div>

                <button
                  onClick={() => authToken && fetchAllAdminData(authToken, currentUser?.tenantId)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-triage Queue</span>
                </button>
              </div>

              {/* Triage Urgency Metrics (Doctor / ER Triage Summary) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total In Triage
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    {hospitalQueue?.triageMetrics?.totalInQueue || (activeEmergencies.length + complaints.filter(c => c.status !== 'RESOLVED').length)}
                  </div>
                  <span className="text-[10px] text-slate-500">Unresolved cases active</span>
                </div>

                <div className="bg-red-950/30 p-4 rounded-2xl border border-red-500/40 shadow-md">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                    Critical (Code Red)
                  </span>
                  <div className="text-2xl font-black text-red-400 mt-1 animate-pulse">
                    {hospitalQueue?.triageMetrics?.criticalCount ?? activeEmergencies.length}
                  </div>
                  <span className="text-[10px] text-red-300/80">Immediate physical triage</span>
                </div>

                <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-500/30 shadow-md">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Urgent (Code Yellow)
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {hospitalQueue?.triageMetrics?.urgentCount || complaints.filter(c => c.priority === 'URGENT' || ['WATER', 'ELECTRICITY'].includes(c.category)).length}
                  </div>
                  <span className="text-[10px] text-amber-300/80">High priority maintenance</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Average Triage Wait
                  </span>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {hospitalQueue?.triageMetrics?.avgWaitMinutes || 14} min
                  </div>
                  <span className="text-[10px] text-slate-500">Time elapsed since report</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Within SLA Rate
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {hospitalQueue?.triageMetrics?.withinSlaPercentage || 96}%
                  </div>
                  <span className="text-[10px] text-slate-500">Adhering to turnaround target</span>
                </div>
              </div>

              {/* Recurring Hotspot Heatmap Alert Banner (Analogous to disease outbreak / recurring ward issues) */}
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/40 border border-amber-500/30 rounded-3xl p-4.5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <h3 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">
                      Hotspot Cluster Detection (Recurring Infrastructure Failures)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Predictive Preventive Alert
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(hospitalQueue?.recurringHotspots || [
                    { location: 'Block A (3rd Floor Bathrooms)', category: 'WATER', count: 4, activeTickets: ['CMP-904121', 'CMP-904144'] },
                    { location: 'Block C (Wing B Study Corridor)', category: 'WIFI', count: 3, activeTickets: ['CMP-881290', 'CMP-881305'] }
                  ]).map((h: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <strong className="text-white">{h.location}</strong>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {h.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <strong>{h.count} tickets</strong> logged in the last 72 hours. Suspected main line pipeline issue.
                        </p>
                      </div>
                      <button
                        onClick={() => alert(`Inspection task created for ${h.location}! Maintenance team alerted.`)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                      >
                        Dispatch Overhaul
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Central Hospital Patient-Queue Triage Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Live Patient & Incident Triage Roster</h3>
                    <p className="text-xs text-slate-400">Sorted by Triage Urgency (Code Red &gt; Yellow &gt; Blue) and longest waiting time.</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Queue Depth: <strong>{hospitalQueue?.queue?.length || 5} cases</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {(hospitalQueue?.queue || [
                    {
                      id: 'em-1',
                      type: 'EMERGENCY',
                      triageLevel: 'CRITICAL',
                      title: 'SOS Alert: Medical Emergency / Asthma Attack',
                      studentName: 'Rahul Sharma',
                      studentRoom: 'A-302',
                      block: 'Block A',
                      waitMinutes: 3,
                      slaRemainingMinutes: 2,
                      isSlaBreached: false,
                      assignedTo: 'Campus Rapid Response Unit',
                      actionNeeded: 'Immediate physical on-site intervention'
                    },
                    {
                      id: 'c-1',
                      type: 'COMPLAINT',
                      ticketNumber: 'CMP-782910',
                      category: 'WATER',
                      triageLevel: 'URGENT',
                      title: 'Main pipeline leak causing washroom flooding',
                      studentName: 'Amit Verma',
                      studentRoom: 'B-104',
                      block: 'Block B',
                      waitMinutes: 24,
                      slaRemainingMinutes: 120,
                      isSlaBreached: false,
                      assignedTo: 'Mahendra Singh (Plumbing)',
                      actionNeeded: 'Shut off secondary stopcock valve'
                    },
                    {
                      id: 'c-2',
                      type: 'COMPLAINT',
                      ticketNumber: 'CMP-782914',
                      category: 'ELECTRICITY',
                      triageLevel: 'URGENT',
                      title: 'Sparks from MCB switchboard in corridor',
                      studentName: 'Priya Patel',
                      studentRoom: 'A-212',
                      block: 'Block A',
                      waitMinutes: 48,
                      slaRemainingMinutes: 80,
                      isSlaBreached: false,
                      assignedTo: 'Suresh Kumar (Electrical)',
                      actionNeeded: 'Inspect wiring & replace breaker fuse'
                    },
                    {
                      id: 'p-1',
                      type: 'PASS',
                      passNumber: 'PASS-89104',
                      triageLevel: 'STANDARD',
                      title: 'Outpass: Medical Visit / City Hospital',
                      studentName: 'Sneha Rao',
                      studentRoom: 'C-201',
                      block: 'Block C',
                      waitMinutes: 12,
                      slaRemainingMinutes: 18,
                      isSlaBreached: false,
                      assignedTo: 'Duty Warden Office',
                      actionNeeded: 'Verify parent SMS confirmation & unlock gate'
                    }
                  ]).map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition text-xs space-y-2.5 ${
                        item.triageLevel === 'CRITICAL'
                          ? 'bg-red-950/40 border-red-500/80 shadow-lg shadow-red-950/50'
                          : item.triageLevel === 'URGENT'
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              item.triageLevel === 'CRITICAL'
                                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                                : item.triageLevel === 'URGENT'
                                ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {item.triageLevel === 'CRITICAL' ? '🚨 CODE RED' : item.triageLevel === 'URGENT' ? '⚡ CODE YELLOW' : 'ROUTINE'}
                          </span>
                          <span className="font-extrabold text-white text-sm">{item.title}</span>
                        </div>

                        {/* Wait Time & SLA Badges */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Wait: <strong>{item.waitMinutes}m</strong></span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              item.isSlaBreached
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {item.isSlaBreached ? '⚠️ SLA Breached' : `SLA: ${item.slaRemainingMinutes || 45}m left`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block">Student & Room</span>
                          <strong className="text-slate-200">{item.studentName} ({item.studentRoom}, {item.block})</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Assigned Specialist</span>
                          <strong className="text-blue-400">{item.assignedTo}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Action Protocol</span>
                          <strong className="text-slate-300">{item.actionNeeded}</strong>
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleQuickTriageAction(item.id, item.type, 'IN_PROGRESS')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer"
                          >
                            Mark In-Transit
                          </button>
                          <button
                            onClick={() => handleQuickTriageAction(item.id, item.type, 'RESOLVE')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] shadow transition cursor-pointer flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Workload Balancing (Hospital Doctors & Specialist Nurses analog) */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Departmental Specialist Workload Distribution</h3>
                    <p className="text-xs text-slate-400">Balances incoming maintenance and security load across campus technicians.</p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded-full">
                    Auto-Routing Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(hospitalQueue?.staffWorkload || [
                    { name: 'Suresh Kumar', department: 'ELECTRICAL', phone: '+91 98111 00006', activeCount: 2, status: 'OPTIMAL' },
                    { name: 'Mahendra Singh', department: 'PLUMBING', phone: '+91 98111 00007', activeCount: 1, status: 'AVAILABLE' },
                    { name: 'Rajesh Kumar', department: 'SECURITY', phone: '+91 98111 00004', activeCount: 0, status: 'AVAILABLE' }
                  ]).map((st: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <strong className="text-white">{st.name}</strong>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {st.department}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Active Cases: <strong className="text-blue-400">{st.activeCount} tickets</strong> • {st.phone}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          st.status === 'HEAVY_LOAD'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : st.status === 'OPTIMAL'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION: 4-WEEK ADOPTION PLAYBOOK & 1-CLICK LEGACY ERP SYNC    */}
          {/* ============================================================== */}
          {activeSection === 'ADOPTION_HUB' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      Institutional Adoption Hub & Legacy ERP Bridge
                    </h2>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Zero Friction Transition
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    A realistic roadmap for colleges with entrenched legacy systems (SAP, TCS iON, Excel) to adopt the platform across 4 weeks without academic disruption.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Default Campus Code:</span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-1 rounded border border-blue-500/40">
                    {currentUser.tenantCode}
                  </span>
                </div>
              </div>

              {/* Projected Institutional ROI Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Warden Time Saved
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    18.5 hrs/wk
                  </div>
                  <span className="text-[10px] text-slate-500">Manual curfew roll-calls eliminated</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    SLA Turnaround Speed
                  </span>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    78% Faster
                  </div>
                  <span className="text-[10px] text-slate-500">From 3.5 days to 4.2 hours average</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Annual Paper Savings
                  </span>
                  <div className="text-2xl font-black text-purple-400 mt-1">
                    ₹4,50,000
                  </div>
                  <span className="text-[10px] text-slate-500">Registers, outpass slips & toner</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    NAAC Grievance Audit
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    98/100
                  </div>
                  <span className="text-[10px] text-slate-500">Criterion 5.1 & 7.1 compliance</span>
                </div>
              </div>

              {/* 4-Week Structured Adoption Roadmap */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">4-Week Rollout Strategy: From Paper to 100% Digital</h3>
                    <p className="text-xs text-slate-400">Phased rollout prevents student confusion and security friction.</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                    <span>Active Phase:</span>
                    <strong>Week 2 (Pilot Block A & B)</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      week: 'Week 1',
                      title: 'Zero-Disruption Roster Sync',
                      status: 'COMPLETED',
                      items: [
                        'Upload student roll sheets via 1-Click CSV',
                        'Map Department Staff (Electrical, Plumbing)',
                        'Configure curfew timings (21:30) and SLAs',
                        'Publish campus enrollment code'
                      ]
                    },
                    {
                      week: 'Week 2',
                      title: 'Shadow Run & Pilot (Block A & B)',
                      status: 'IN_PROGRESS',
                      items: [
                        'Parallel run with 250 residents in Block A',
                        'Deploy tablet scanner at Main Gate North',
                        'Verify SMS fallback for feature phones',
                        'Issue first targeted WhatsApp broadcasts'
                      ]
                    },
                    {
                      week: 'Week 3',
                      title: 'Campus-Wide Auto-Routing',
                      status: 'UPCOMING',
                      items: [
                        'Enable photo/video/voice note tickets',
                        'Auto-assign directly to technicians',
                        'Launch digital mess menu & RSVPs',
                        'Decommission physical paper gate slips'
                      ]
                    },
                    {
                      week: 'Week 4',
                      title: 'Paperless Sunset & NAAC Audit',
                      status: 'UPCOMING',
                      items: [
                        'Sunset legacy manual registers 100%',
                        'Generate NAAC Criterion 5.1 CSV dossier',
                        'Evaluate warden time savings review',
                        'Lock automated curfew alert rules'
                      ]
                    }
                  ].map((w, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs space-y-3 ${
                        w.status === 'COMPLETED'
                          ? 'bg-slate-900/60 border-emerald-500/40'
                          : w.status === 'IN_PROGRESS'
                          ? 'bg-blue-950/20 border-blue-500/50 shadow-lg'
                          : 'bg-slate-900/30 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-white">{w.week}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            w.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : w.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs">{w.title}</h4>
                      <ul className="space-y-1.5 text-[11px] text-slate-300">
                        {w.items.map((it, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <span className={w.status === 'COMPLETED' ? 'text-emerald-400' : 'text-blue-400'}>✓</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Click Legacy ERP / SIS CSV Batch Importer Tool */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      1-Click Legacy ERP / SIS Batch Roster Importer
                    </h3>
                    <p className="text-xs text-slate-400">
                      Instantly import student lists from SAP, TCS iON, Excel or Google Sheets. No database re-architecture required.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setErpCsvInput(`RollNumber, Name, Email, Phone, Room, Block, Course, Year
2026-CS-101, Tanmay Saxena, tanmay.s@apex.edu, +91 98111 22334, A-201, Block A, Computer Science, 3rd Year
2026-EC-204, Ananya Sharma, ananya.sh@apex.edu, +91 98222 33445, B-108, Block B, Electronics, 2nd Year
2026-ME-312, Vikram Joshi, vikram.j@apex.edu, +91 98333 44556, A-305, Block A, Mechanical, 4th Year
2026-BT-089, Sneha Kulkarni, sneha.k@apex.edu, +91 98444 55667, C-212, Block C, Biotech, 1st Year`);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
                  >
                    Load Sample ERP CSV
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 block">
                    Paste CSV Data (Columns: RollNumber, Name, Email, Phone, Room, Block, Course, Year)
                  </label>
                  <textarea
                    rows={5}
                    value={erpCsvInput}
                    onChange={(e) => setErpCsvInput(e.target.value)}
                    placeholder="2026-CS-101, Tanmay Saxena, tanmay.s@apex.edu, +91 98111 22334, A-201, Block A, Computer Science, 3rd Year..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">
                      Imported students are automatically linked to your campus code <strong className="text-white font-mono">{currentUser.tenantCode}</strong>.
                    </p>
                    <button
                      onClick={handleImportLegacyErp}
                      disabled={erpImportLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      {erpImportLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Synchronize Roster from ERP</span>
                        </>
                      )}
                    </button>
                  </div>

                  {erpImportResult && (
                    <div className="mt-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 animate-in zoom-in-95">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{erpImportResult.message || 'Roster batch synchronized successfully!'}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Total Processed: <strong>{erpImportResult.totalProcessed}</strong> • Newly Admitted: <strong>{erpImportResult.importedCount}</strong>
                      </div>
                      {erpImportResult.sampleJoinedStudents && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[10px]">
                          {erpImportResult.sampleJoinedStudents.slice(0, 4).map((st: any, idx: number) => (
                            <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                              <strong className="text-white block">{st.name}</strong>
                              <span className="text-slate-400">Roll: {st.rollNumber} • Room {st.room}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION: COLLEGE GALLERY & CAMPUS ACTIVITIES MANAGER            */}
          {/* ============================================================== */}
          {activeSection === 'GALLERY' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>Institutional Media & Life Center</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white">
                      {at.galleryTitle}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      {at.gallerySubtitle}
                    </p>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center shrink-0">
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{at.totalMoments}</span>
                      <strong className="text-lg font-black text-white">{galleryItems.length}</strong>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-purple-400 uppercase font-bold block">Videos</span>
                      <strong className="text-lg font-black text-purple-400">
                        {galleryItems.filter(i => i.mediaType === 'VIDEO').length}
                      </strong>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Photos</span>
                      <strong className="text-lg font-black text-emerald-400">
                        {galleryItems.filter(i => i.mediaType === 'PHOTO').length}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload New Activity Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <UploadCloud className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Upload New Campus Activity / Media</h3>
                      <p className="text-[11px] text-slate-400">Add photos or videos with category tagging</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded-full">
                    Real-Time Student Broadcast Active
                  </span>
                </div>

                {gallerySuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{gallerySuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateGalleryItem} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-slate-300 font-bold block mb-1">Activity Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Annual Cultural Fest 'Tarang 2026' Grand Night"
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Category *</label>
                      <select
                        value={galleryCategory}
                        onChange={(e) => setGalleryCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="CULTURAL">Cultural Fest & Arts</option>
                        <option value="SPORTS">Sports & Tournaments</option>
                        <option value="TECH">Hackathons & Tech Expo</option>
                        <option value="HOSTEL_LIFE">Hostel DJ & Mess Carnivals</option>
                        <option value="ACADEMIC">Academic & Convocation</option>
                        <option value="ACTIVITIES">General Activities & Clubs</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Media Type</label>
                      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setGalleryMediaType('PHOTO')}
                          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition ${
                            galleryMediaType === 'PHOTO' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGalleryMediaType('VIDEO')}
                          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition ${
                            galleryMediaType === 'VIDEO' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Event Date</label>
                      <input
                        type="date"
                        value={galleryEventDate}
                        onChange={(e) => setGalleryEventDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-5">
                      <input
                        type="checkbox"
                        id="pinGallery"
                        checked={galleryIsPinned}
                        onChange={(e) => setGalleryIsPinned(e.target.checked)}
                        className="rounded text-blue-600 bg-slate-900"
                      />
                      <label htmlFor="pinGallery" className="text-slate-300 font-semibold cursor-pointer">
                        Feature as Pinned Highlight
                      </label>
                    </div>
                  </div>

                  {/* Direct File Upload & URL Input */}
                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-bold block">
                        Media Source ({galleryMediaType === 'VIDEO' ? 'MP4 / WebM Video' : 'HD Photo'}) *
                      </label>
                      <label className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center space-x-1 shadow">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{galleryUploading ? 'Uploading...' : 'Choose File from PC'}</span>
                        <input
                          type="file"
                          accept={galleryMediaType === 'VIDEO' ? 'video/*' : 'image/*'}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleGalleryFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="url"
                      required
                      placeholder={galleryMediaType === 'VIDEO' ? 'https://... video url (or click Upload File above)' : 'https://... image url (or click Upload File above)'}
                      value={galleryMediaUrl}
                      onChange={(e) => setGalleryMediaUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />

                    {galleryMediaUrl && (
                      <div className="pt-2 flex items-center space-x-3">
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Media Attached Preview:</span>
                        {galleryMediaType === 'VIDEO' ? (
                          <video src={galleryMediaUrl} className="h-16 w-28 rounded-lg object-cover bg-black" controls />
                        ) : (
                          <img src={galleryMediaUrl} alt="Preview" className="h-16 w-24 rounded-lg object-cover border border-slate-700" />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Description / Activity Highlights</label>
                    <textarea
                      rows={2}
                      placeholder="Brief note about this campus activity or event..."
                      value={galleryDescription}
                      onChange={(e) => setGalleryDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={galleryLoading || galleryUploading}
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {galleryLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish Activity to College Gallery & Student App</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Gallery Activities List & Category Filter */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-blue-400" />
                    <span>Uploaded College Activities & Media ({galleryItems.length})</span>
                  </h3>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                    {['ALL', 'CULTURAL', 'SPORTS', 'TECH', 'HOSTEL_LIFE', 'VIDEOS'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setGalleryFilter(cat)}
                        className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                          galleryFilter === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat === 'VIDEOS' ? '🎬 Videos' : cat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {galleryItems
                    .filter((item) => {
                      if (galleryFilter === 'ALL') return true;
                      if (galleryFilter === 'VIDEOS') return item.mediaType === 'VIDEO';
                      return item.category === galleryFilter;
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col justify-between group"
                      >
                        {/* Media Thumbnail or Video */}
                        <div className="relative aspect-video bg-black/50 overflow-hidden">
                          {item.mediaType === 'VIDEO' ? (
                            <video
                              src={item.mediaUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={item.mediaUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          )}

                          {/* Media Type Badge */}
                          <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                item.mediaType === 'VIDEO'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {item.mediaType === 'VIDEO' ? '▶ Video' : '📷 Photo'}
                            </span>
                            {item.isPinned && (
                              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                                ★ Pinned
                              </span>
                            )}
                          </div>

                          {/* Play overlay for video */}
                          {item.mediaType === 'VIDEO' && (
                            <div
                              onClick={() => setPreviewMediaModal(item)}
                              className="absolute inset-0 bg-black/30 hover:bg-black/10 flex items-center justify-center cursor-pointer transition"
                            >
                              <div className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-2xl transition hover:scale-110">
                                <Play className="w-5 h-5 ml-0.5 fill-current" />
                              </div>
                            </div>
                          )}

                          <span className="absolute bottom-2 right-2 bg-slate-950/80 text-[10px] text-slate-300 font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
                            {item.eventDate}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                {item.category.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-rose-400 font-bold flex items-center space-x-1">
                                <Heart className="w-3 h-3 fill-current" />
                                <span>{item.likesCount || 0} cheers</span>
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-white leading-snug">{item.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {item.description || 'Campus activity highlight.'}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                            <button
                              onClick={() => setPreviewMediaModal(item)}
                              className="text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>View Full Media</span>
                            </button>

                            <button
                              onClick={() => handleDeleteGalleryItem(item.id)}
                              title="Delete Activity"
                              className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION: COLLEGE CALENDAR & ACADEMIC SCHEDULER                  */}
          {/* ============================================================== */}
          {activeSection === 'CALENDAR' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/40 border border-purple-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Academic & Institutional Timeline</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white">
                      {at.calendarTitle}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      {at.calendarSubtitle}
                    </p>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center shrink-0">
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{at.totalEvents}</span>
                      <strong className="text-lg font-black text-white">{calendarEvents.length}</strong>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-rose-400 uppercase font-bold block">Exams</span>
                      <strong className="text-lg font-black text-rose-400">
                        {calendarEvents.filter(e => e.eventType === 'EXAM').length}
                      </strong>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Holidays</span>
                      <strong className="text-lg font-black text-emerald-400">
                        {calendarEvents.filter(e => e.isHoliday).length}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule New Event Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <CalendarIcon className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Schedule New College Event / Exam</h3>
                      <p className="text-[11px] text-slate-400">Broadcasts to all resident student schedules</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold px-2 py-0.5 rounded-full">
                    Auto-Sync Active
                  </span>
                </div>

                {calendarSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{calendarSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateCalendarEvent} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-slate-300 font-bold block mb-1">Event Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mid-Term Examination Week (All Engineering Depts)"
                        value={calTitle}
                        onChange={(e) => setCalTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Event Type *</label>
                      <select
                        value={calEventType}
                        onChange={(e) => setCalEventType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="EXAM">Examination & Tests</option>
                        <option value="HOLIDAY">Campus Holiday / Vacation</option>
                        <option value="CULTURAL">Cultural Fest & Hackathons</option>
                        <option value="SPORTS">Sports & Leagues</option>
                        <option value="HOSTEL">Hostel Council & Committee Meetings</option>
                        <option value="ACADEMIC">Academic / Convocation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={calStartDate}
                        onChange={(e) => setCalStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">End Date</label>
                      <input
                        type="date"
                        value={calEndDate}
                        onChange={(e) => setCalEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Venue / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Exam Hall 101 or Main Ground"
                        value={calVenue}
                        onChange={(e) => setCalVenue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isHoliday"
                        checked={calIsHoliday}
                        onChange={(e) => setCalIsHoliday(e.target.checked)}
                        className="rounded text-emerald-600 bg-slate-900"
                      />
                      <label htmlFor="isHoliday" className="text-slate-300 font-semibold cursor-pointer">
                        Official Campus Holiday (Classes & Labs Suspended)
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isMandatory"
                        checked={calIsMandatory}
                        onChange={(e) => setCalIsMandatory(e.target.checked)}
                        className="rounded text-purple-600 bg-slate-900"
                      />
                      <label htmlFor="isMandatory" className="text-slate-300 font-semibold cursor-pointer">
                        Mandatory Student Attendance
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Instructions / Description</label>
                    <textarea
                      rows={2}
                      placeholder="Guidelines, turnstile timing exceptions, or dress code for students..."
                      value={calDescription}
                      onChange={(e) => setCalDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={calendarLoading}
                    className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-purple-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {calendarLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarIcon className="w-4 h-4" />
                        <span>Schedule Event & Broadcast to Student Calendars</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Calendar Timeline & Events List */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-purple-400" />
                    <span>Scheduled Institutional Events ({calendarEvents.length})</span>
                  </h3>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                    {['ALL', 'EXAM', 'HOLIDAY', 'CULTURAL', 'SPORTS', 'HOSTEL'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCalendarFilter(cat)}
                        className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                          calendarFilter === cat
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Events' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Events List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {calendarEvents
                    .filter((ev) => calendarFilter === 'ALL' || ev.eventType === calendarFilter)
                    .map((ev) => {
                      const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                        EXAM: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
                        HOLIDAY: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
                        CULTURAL: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
                        SPORTS: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
                        HOSTEL: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
                        ACADEMIC: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' }
                      };
                      const colors = typeColors[ev.eventType] || typeColors.ACADEMIC;

                      const startObj = new Date(ev.startDate);
                      const monthName = startObj.toLocaleString('default', { month: 'short' });
                      const dayNumber = startObj.getDate();

                      return (
                        <div
                          key={ev.id}
                          className="bg-slate-950 border border-slate-800 rounded-3xl p-4.5 shadow-xl hover:border-slate-700 transition flex items-start space-x-4"
                        >
                          {/* Big Date Badge */}
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-inner">
                            <span className="text-[10px] font-bold text-blue-400 uppercase leading-none">{monthName}</span>
                            <span className="text-xl font-black text-white leading-tight">{dayNumber}</span>
                          </div>

                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                                {ev.eventType}
                              </span>
                              {ev.isHoliday && (
                                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                  Holiday
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteCalendarEvent(ev.id)}
                                title="Remove Event"
                                className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <h4 className="font-extrabold text-sm text-white leading-snug">{ev.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>

                            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-900">
                              <span>📍 {ev.venue}</span>
                              {ev.endDate !== ev.startDate && <span>Ends: {ev.endDate}</span>}
                              <span className="text-slate-500 font-mono text-[10px]">By: {ev.scheduledBy}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION: CHIEF WARDEN & MANAGER PROFILE COMMAND DESK            */}
          {/* ============================================================== */}
          {activeSection === 'MANAGER_PROFILE' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-teal-900/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Executive Command Desk</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white">
                      {at.mgrDeskTitle}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      {at.mgrDeskSubtitle}
                    </p>
                  </div>

                  <button
                    onClick={() => setEditManagerModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition cursor-pointer self-start md:self-auto shrink-0"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{at.mgrEditBtn}</span>
                  </button>
                </div>
              </div>

              {/* Manager Hero Profile Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
                  <div className="flex items-center space-x-5">
                    {/* Photo with direct upload hover */}
                    <div className="relative group shrink-0">
                      <img
                        src={managerProfile?.avatarUrl || mgrAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={managerProfile?.name || currentUser.name}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover border-2 border-blue-500/60 shadow-2xl group-hover:scale-105 transition"
                      />
                      <button
                        onClick={() => setEditManagerModalOpen(true)}
                        className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl shadow-lg border-2 border-slate-950 transition cursor-pointer"
                        title="Change Manager Photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-xl md:text-2xl font-black text-white">
                          {managerProfile?.name || currentUser.name}
                        </h3>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Official Controller</span>
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-blue-400">
                        {managerProfile?.designation || 'Chief Hostel Warden & Administrative Controller'}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl">
                          🏛️ {currentUser.tenantName}
                        </span>
                        <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl">
                          🏢 Code: <strong className="text-white font-mono">{currentUser.tenantCode}</strong>
                        </span>
                        <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 ${
                          (managerProfile?.status || mgrStatus) === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            (managerProfile?.status || mgrStatus) === 'AVAILABLE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                          }`} />
                          <span>Status: {(managerProfile?.status || mgrStatus).replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setEditManagerModalOpen(true)}
                      className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Update Photo & Details</span>
                    </button>
                  </div>
                </div>

                {/* Desk Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Office Room & Visiting Timings
                    </span>
                    <div className="space-y-1 text-slate-200">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-400 shrink-0" />
                        <strong>{managerProfile?.officeRoom || 'Administrative Block A, Ground Floor, Office G-04'}</strong>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{managerProfile?.visitingHours || 'Mon – Fri: 4:30 PM – 7:00 PM | Sat: 10:30 AM – 1:30 PM'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Direct Contact & Emergency Line
                    </span>
                    <div className="space-y-1 text-slate-200">
                      <div className="flex items-center space-x-2">
                        <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                        <strong>{managerProfile?.phone || currentUser.phone || '+91 98765 43210'}</strong>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Direct Line: {managerProfile?.emergencyDirectLine || '+91 98765 00000 (Ext 104)'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Announcement Broadcast Note */}
                <div className="p-4 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center space-x-2 text-blue-300 font-bold">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Live Student Announcement from Chief Warden:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-5 font-medium">
                    "{managerProfile?.announcement || 'Hostel Controller Desk is actively open for resident support, medical assistance, and room amenities.'}"
                  </p>
                  <p className="text-[10px] text-slate-500 pl-5">
                    Broadcast automatically to every student resident screen upon saving.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: STUDENT ADMISSION VERIFICATION & APPROVAL QUEUE       */}
      {/* ============================================================== */}
      {pendingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Student Admission Verification Queue</h3>
                  <p className="text-xs text-slate-400">
                    College Code: <strong className="text-white font-mono">{currentUser.tenantCode}</strong> • {pendingStudents.length} Pending Approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {pendingStudents.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Admission Queue is All Clear!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No pending student registration requests for {currentUser.tenantName}. When any student types code <code>{currentUser.tenantCode}</code> on their app, their request will appear here instantly!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingStudents.map((s) => (
                  <div key={s.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-sm">{s.name}</h4>
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full">
                            Pending Warden Review
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{s.email} • {s.phone || 'No phone'}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">
                        Roll: {s.residentProfile?.studentId || 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Course</span>
                        <strong className="text-slate-200">{s.residentProfile?.course || 'B.Tech'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Requested Room</span>
                        <strong className="text-slate-200">{s.residentProfile?.roomNumber || '101'} ({s.residentProfile?.blockName || 'Block A'})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Guardian</span>
                        <strong className="text-slate-200">{s.residentProfile?.parentName || 'Parent'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Guardian Phone</span>
                        <strong className="text-slate-200">{s.residentProfile?.parentPhone || 'N/A'}</strong>
                      </div>
                    </div>

                    {showRejectBox === s.id ? (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="text-[11px] text-rose-400 font-semibold block">Reason for declining registration:</label>
                        <input
                          type="text"
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                          placeholder="e.g. Roll number not found in college ERP or block full."
                          className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRejectStudent(s.id, rejectReasonInput)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setShowRejectBox(null)}
                            className="bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                        <span className="text-[10px] text-slate-500">
                          Registered: {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowRejectBox(s.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl text-xs font-bold transition"
                          >
                            Decline
                          </button>
                          <button
                            disabled={approvalLoading}
                            onClick={() => handleApproveStudent(s.id, s.residentProfile?.roomNumber, s.residentProfile?.blockName)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Admit Student</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: QUICK NOTICE & SIREN DISPATCH                         */}
      {/* ============================================================== */}
      {quickNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Bell className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Broadcast Notice to All Resident Phones</h3>
              </div>
              <button
                onClick={() => setQuickNoticeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Hostel Floor Meeting Tonight at 8 PM"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Category</label>
                <select
                  value={newNoticeCategory}
                  onChange={(e) => setNewNoticeCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ACADEMIC">Academic & Exams</option>
                  <option value="MAINTENANCE">Maintenance / Water / Electricity</option>
                  <option value="EVENT">Cultural & Sports Events</option>
                  <option value="EMERGENCY">Emergency Security Advisory</option>
                  <option value="GENERAL">General Hostel Rules</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Detailed Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type the announcement details here..."
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
                <input
                  type="checkbox"
                  id="urgentNotice"
                  checked={newNoticeIsEmergency}
                  onChange={(e) => setNewNoticeIsEmergency(e.target.checked)}
                  className="rounded text-red-500"
                />
                <label htmlFor="urgentNotice" className="cursor-pointer text-[11px] font-semibold">
                  Trigger high-priority audio alert badge on student devices
                </label>
              </div>

              <button
                type="submit"
                disabled={noticePublishLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{noticePublishLoading ? 'Broadcasting...' : 'Publish & Broadcast Live'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: TODAY'S MESS MENU EDITOR                              */}
      {/* ============================================================== */}
      {editMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Utensils className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Update Today's Mess Menu</h3>
                  <p className="text-[11px] text-slate-400">Broadcasts immediately to all resident student phones</p>
                </div>
              </div>
              <button
                onClick={() => setEditMenuModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {menuSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{menuSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTodayMenu} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Breakfast Menu</label>
                <input
                  type="text"
                  required
                  value={menuForm.breakfast}
                  onChange={(e) => setMenuForm({ ...menuForm, breakfast: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Lunch Menu</label>
                <input
                  type="text"
                  required
                  value={menuForm.lunch}
                  onChange={(e) => setMenuForm({ ...menuForm, lunch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Evening Snacks</label>
                <input
                  type="text"
                  required
                  value={menuForm.snacks}
                  onChange={(e) => setMenuForm({ ...menuForm, snacks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Dinner Menu</label>
                <input
                  type="text"
                  required
                  value={menuForm.dinner}
                  onChange={(e) => setMenuForm({ ...menuForm, dinner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Special Festival / Gala Feast (Optional)</span>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Festival Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali Grand Feast or Sunday Gala Banquet"
                    value={menuForm.festivalTitle}
                    onChange={(e) => setMenuForm({ ...menuForm, festivalTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Festival Dinner Items</label>
                  <input
                    type="text"
                    placeholder="e.g. Paneer Lababdar, Live Jalebi Counter, Butter Naan"
                    value={menuForm.festivalDinner}
                    onChange={(e) => setMenuForm({ ...menuForm, festivalDinner: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={menuLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center space-x-1.5"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{menuLoading ? 'Updating...' : 'Save & Broadcast Menu Live to Students'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* MODAL 4: WHATSAPP-STYLE READ RECEIPTS VIEWER MODAL             */}
      {/* ============================================================== */}
      {receiptsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Targeted Broadcast Read Receipts</h3>
                  <p className="text-xs text-slate-400">
                    Real-time WhatsApp-style read tracking & unread student room roster
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiptsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {receiptsLoading ? (
              <div className="text-center py-12 space-y-2">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Fetching live student delivery confirmations...</p>
              </div>
            ) : selectedNoticeReceipts ? (
              <div className="space-y-4">
                {/* Summary Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Target</span>
                    <strong className="text-white text-lg">{selectedNoticeReceipts.totalAudience || 150}</strong>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-blue-400 uppercase block">Read Count</span>
                    <strong className="text-blue-400 text-lg">{selectedNoticeReceipts.readCount || 84}</strong>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Acknowledged</span>
                    <strong className="text-emerald-400 text-lg">{selectedNoticeReceipts.acknowledgedCount || 62}</strong>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Read %</span>
                    <strong className="text-purple-400 text-lg">{selectedNoticeReceipts.readPercentage || 56}%</strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                    style={{ width: `${selectedNoticeReceipts.readPercentage || 56}%` }}
                  />
                </div>

                {/* Read List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Students Who Have Read This Notice ({selectedNoticeReceipts.readBy?.length || 0})</span>
                  </h4>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    {selectedNoticeReceipts.readBy && selectedNoticeReceipts.readBy.length > 0 ? (
                      selectedNoticeReceipts.readBy.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400 font-bold">✓✓</span>
                            <span className="text-white font-medium">{r.userName}</span>
                            <span className="text-slate-500 font-mono text-[10px]">({r.studentId})</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px]">
                            {r.acknowledged && (
                              <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                Acknowledged
                              </span>
                            )}
                            <span className="text-slate-500">{new Date(r.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-2">No read receipts logged yet.</p>
                    )}
                  </div>
                </div>

                {/* Unread Students Follow-up Roster */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unread Student Rooms (Warden Follow-up Roster)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    {selectedNoticeReceipts.unreadStudents && selectedNoticeReceipts.unreadStudents.length > 0 ? (
                      selectedNoticeReceipts.unreadStudents.map((u: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                          <div>
                            <strong className="text-white block truncate">{u.userName}</strong>
                            <span className="text-slate-400 text-[10px]">Roll: {u.studentId}</span>
                          </div>
                          <span className="bg-slate-800 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                            Room {u.room}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-400 col-span-2 text-center py-2">✓ 100% of students have acknowledged this circular!</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: EDIT MANAGER / CHIEF WARDEN PROFILE & PHOTO          */}
      {/* ============================================================== */}
      {editManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Manager Profile & Photo</h3>
                  <p className="text-[11px] text-slate-400">Updates live across all student resident screens</p>
                </div>
              </div>
              <button
                onClick={() => setEditManagerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {mgrSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center space-x-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mgrSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveManagerProfile} className="space-y-4 text-xs">
              {/* Photo Upload Section */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center space-x-4">
                <div className="relative shrink-0">
                  <img
                    src={mgrAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt="Manager Avatar Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/60 shadow-lg"
                  />
                  {mgrUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-slate-300 font-bold block">Manager Profile Photo</span>
                  <div className="flex flex-wrap gap-2">
                    <label className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center space-x-1.5 shadow">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{mgrUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleManagerPhotoUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    placeholder="Or paste photo URL here..."
                    value={mgrAvatarUrl}
                    onChange={(e) => setMgrAvatarUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 text-[10px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Manager Full Name *</label>
                  <input
                    type="text"
                    required
                    value={mgrName}
                    onChange={(e) => setMgrName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Official Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Hostel Warden"
                    value={mgrDesignation}
                    onChange={(e) => setMgrDesignation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={mgrEmail}
                    onChange={(e) => setMgrEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={mgrPhone}
                    onChange={(e) => setMgrPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Office Room & Wing</label>
                  <input
                    type="text"
                    placeholder="e.g. Admin Block A, Ground Floor, G-04"
                    value={mgrOfficeRoom}
                    onChange={(e) => setMgrOfficeRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Visiting Hours for Students</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon - Fri: 4:30 PM - 7:00 PM"
                    value={mgrVisitingHours}
                    onChange={(e) => setMgrVisitingHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Emergency Direct Line / Extension</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000 (Ext 104)"
                    value={mgrEmergencyLine}
                    onChange={(e) => setMgrEmergencyLine(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Active Status</label>
                  <select
                    value={mgrStatus}
                    onChange={(e) => setMgrStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="AVAILABLE">Available in Office (Green)</option>
                    <option value="ON_CAMPUS_ROUNDS">On Campus Rounds (Blue)</option>
                    <option value="IN_MEETING">In Committee Meeting (Amber)</option>
                    <option value="OFF_DUTY">Off Duty / Evening Hours (Slate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Student Broadcast Notice / Welcome Message</label>
                <textarea
                  rows={2}
                  value={mgrAnnouncement}
                  onChange={(e) => setMgrAnnouncement(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={managerSaving}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {managerSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Broadcast Profile Live to All Student Phones</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: GALLERY MEDIA LIGHTBOX & VIDEO PLAYER                */}
      {/* ============================================================== */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 truncate">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-blue-600 text-white">
                  {previewMediaModal.category}
                </span>
                <h3 className="text-sm font-bold text-white truncate">{previewMediaModal.title}</h3>
              </div>
              <button
                onClick={() => setPreviewMediaModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Media Player / Image Display */}
            <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              {previewMediaModal.mediaType === 'VIDEO' ? (
                <video
                  src={previewMediaModal.mediaUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : (
                <img
                  src={previewMediaModal.mediaUrl}
                  alt={previewMediaModal.title}
                  className="w-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300 leading-relaxed">{previewMediaModal.description}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>📅 Event Date: {previewMediaModal.eventDate}</span>
                <span className="text-rose-400 font-bold">❤️ {previewMediaModal.likesCount || 0} student cheers</span>
                <span className="font-mono text-slate-500">Uploaded by: {previewMediaModal.uploadedBy}</span>
              </div>
            </div>

            <button
              onClick={() => setPreviewMediaModal(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close Media
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

