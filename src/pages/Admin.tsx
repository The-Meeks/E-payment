import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, Users, FileText, Settings, HelpCircle, 
  Search, Check, Ban, AlertTriangle, ShieldCheck, Mail, Phone, 
  Plus, Edit, Trash2, Globe, Send, RefreshCw, LogOut
} from 'lucide-react';
import { FAQ, SupportTicket, TicketMessage, ActivityLog, SystemSettings } from '../types';

export default function Admin() {
  const { user, logout, fetchWithAuth, showToast, adminTab, setAdminTab } = useApp();

  // Stats / Metrics State
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Merchants Management State
  const [merchantsList, setMerchantsList] = useState<any[]>([]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('all');

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Transactions State
  const [txsList, setTxsList] = useState<any[]>([]);
  const [txSearch, setTxSearch] = useState('');

  // Tickets State
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // FAQ State
  const [faqsList, setFaqsList] = useState<FAQ[]>([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqPublished, setFaqPublished] = useState(true);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // System Settings State
  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Audit Logs
  const [logsList, setLogsList] = useState<ActivityLog[]>([]);

  const loadAdminData = async () => {
    setLoadingStats(true);
    try {
      const statsData = await fetchWithAuth('/api/admin/dashboard');
      setMetrics(statsData.metrics);
      setSysSettings(statsData.systemSettings);
      
      // Prefill settings form
      if (statsData.systemSettings) {
        setPlatformName(statsData.systemSettings.platformName);
        setSupportEmail(statsData.systemSettings.supportEmail);
        setSupportPhone(statsData.systemSettings.supportPhone);
        setMaintenanceMode(statsData.systemSettings.maintenanceMode);
      }

      const merchData = await fetchWithAuth('/api/admin/merchants');
      setMerchantsList(merchData.merchants);

      const uData = await fetchWithAuth('/api/admin/users');
      setUsersList(uData.users);

      const txsData = await fetchWithAuth('/api/transactions');
      setTxsList(txsData.transactions);

      const tktData = await fetchWithAuth('/api/support');
      setTicketsList(tktData.tickets);

      const faqData = await fetchWithAuth('/api/admin/faqs');
      setFaqsList(faqData.faqs);

      const logsData = await fetchWithAuth('/api/admin/logs');
      setLogsList(logsData.logs);
    } catch (err) {
      console.error('Failed to load administrative analytics', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user, adminTab]);

  // Merchant status approval action
  const handleMerchantStatus = async (merchantId: string, status: 'approved' | 'rejected' | 'suspended') => {
    try {
      await fetchWithAuth(`/api/admin/merchant/${merchantId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      showToast(`Merchant registration set to ${status.toUpperCase()}!`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Operation failed.', 'error');
    }
  };

  // User Account suspend action
  const handleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetchWithAuth(`/api/admin/user/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      showToast(`User status updated to ${nextStatus.toUpperCase()}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to modify account state.', 'error');
    }
  };

  // FAQ CRUD handlers
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;

    try {
      if (editingFaqId) {
        await fetchWithAuth(`/api/admin/faqs/${editingFaqId}`, {
          method: 'PUT',
          body: JSON.stringify({ question: faqQuestion, answer: faqAnswer, isPublished: faqPublished })
        });
        showToast('FAQ updated successfully', 'success');
      } else {
        await fetchWithAuth('/api/admin/faqs', {
          method: 'POST',
          body: JSON.stringify({ question: faqQuestion, answer: faqAnswer, isPublished: faqPublished })
        });
        showToast('New FAQ created successfully', 'success');
      }
      
      setFaqQuestion('');
      setFaqAnswer('');
      setFaqPublished(true);
      setEditingFaqId(null);
      
      // Reload FAQs
      const faqData = await fetchWithAuth('/api/admin/faqs');
      setFaqsList(faqData.faqs);
    } catch (err: any) {
      showToast(err.message || 'Failed to save FAQ.', 'error');
    }
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaqId(faq.id);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqPublished(faq.isPublished);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ permanently?')) return;
    try {
      await fetchWithAuth(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      showToast('FAQ removed permanently', 'info');
      
      // Reload FAQs
      const faqData = await fetchWithAuth('/api/admin/faqs');
      setFaqsList(faqData.faqs);
    } catch (err: any) {
      showToast(err.message || 'FAQ deletion failed.', 'error');
    }
  };

  // Ticket Reply Form handler
  const handleTicketMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;

    try {
      await fetchWithAuth(`/api/support/${activeTicket.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });
      setNewMessage('');
      
      // Reload messages
      const msgData = await fetchWithAuth(`/api/support/${activeTicket.id}`);
      setTicketMessages(msgData.messages);
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch message.', 'error');
    }
  };

  const handleOpenTicket = async (tkt: SupportTicket) => {
    setActiveTicket(tkt);
    try {
      const msgData = await fetchWithAuth(`/api/support/${tkt.id}`);
      setTicketMessages(msgData.messages);
    } catch (err) {
      console.error(err);
    }
  };

  // Platform settings submit handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          platformName,
          supportEmail,
          supportPhone,
          maintenanceMode
        })
      });
      showToast('Platform configurations updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Simple check for Administrator roles
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans p-6">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center text-white space-y-4 max-w-sm w-full">
          <ShieldCheck className="text-red-500 mx-auto" size={48} />
          <h3 className="text-xl font-bold">Unauthorised Access</h3>
          <p className="text-xs text-slate-400">
            This module is strictly locked. Only authorized administrative personnel can access PayHub Core configurations.
          </p>
          <button onClick={logout} className="bg-red-600 hover:bg-red-700 font-bold text-xs p-3 rounded-xl w-full">
            Return to Login Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800" id="admin-dashboard">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between fixed h-full z-40" id="admin-sidebar">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg font-black text-sm">PH</div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block leading-tight">PayHub Admin</span>
              <span className="text-[9px] font-mono text-blue-400 font-bold uppercase block tracking-wider">ROOT ACCESS</span>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-sm font-semibold">
            <button 
              onClick={() => setAdminTab('dashboard')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
            >
              <BarChart3 size={18} />
              Platform Overview
            </button>
            <button 
              onClick={() => setAdminTab('merchants')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'merchants' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
              id="admin-merchants-tab"
            >
              <Globe size={18} />
              Merchants Approve
            </button>
            <button 
              onClick={() => setAdminTab('users')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'users' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
            >
              <Users size={18} />
              User Control Accounts
            </button>
            <button 
              onClick={() => setAdminTab('transactions')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'transactions' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
            >
              <FileText size={18} />
              Platform Ledger
            </button>
            <button 
              onClick={() => setAdminTab('tickets')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'tickets' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
            >
              <HelpCircle size={18} />
              Support HelpDesk
            </button>
            <button 
              onClick={() => setAdminTab('faqs')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'faqs' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
            >
              <HelpCircle size={18} />
              Faqs Editor
            </button>
            <button 
              onClick={() => setAdminTab('settings')}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${adminTab === 'settings' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-850 hover:text-white'}`}
            >
              <Settings size={18} />
              Platform Settings
            </button>
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center uppercase">
              AD
            </div>
            <div className="overflow-hidden">
              <span className="block font-bold text-sm text-white truncate">{user?.firstName} {user?.lastName}</span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wide">SYSTEM ADMIN</span>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full bg-slate-850 hover:bg-slate-800 text-red-400 hover:text-red-300 text-xs font-bold p-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-base font-black text-slate-850 uppercase">ROOT CONTROLLER</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-blue-50 text-blue-800 font-bold text-[10px] uppercase border border-blue-200 px-2.5 py-1 rounded-full">
              SECURE ROOT NODE
            </span>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-6 flex-1 space-y-6">
          {loadingStats ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2 text-slate-400">
                <RefreshCw className="animate-spin text-blue-600 mx-auto" size={32} />
                <p className="text-xs font-semibold">Updating platforms indices...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW METRICS */}
              {adminTab === 'dashboard' && metrics && (
                <div className="space-y-6" id="admin-view-dashboard">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Total Volume</span>
                      <span className="text-2xl font-black text-slate-950">KES {metrics.totalVolume.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Platform Merchants</span>
                      <span className="text-2xl font-black text-slate-950">{metrics.merchantsCount} registered</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Approvals Needed</span>
                      <span className="text-2xl font-black text-amber-600 animate-pulse">{metrics.pendingApprovals} pending</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Open support tickets</span>
                      <span className="text-2xl font-black text-red-600">{metrics.openTickets} tickets</span>
                    </div>
                  </div>

                  {/* Operational breakdowns */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Activity Logs Audit trail */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-150 bg-slate-50">
                        <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide">Platform Audit Trails</h3>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {logsList.map(log => (
                          <div key={log.id} className="p-4 text-xs font-semibold">
                            <div className="flex justify-between text-slate-900 mb-1">
                              <span>{log.action}</span>
                              <span className="text-slate-400 text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-500 font-normal leading-relaxed">{log.details}</p>
                            <span className="text-[9px] text-slate-400 font-mono">User: {log.userEmail}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending review list shortcut */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-150 bg-slate-50">
                        <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide">Pending Compliance approvals</h3>
                      </div>
                      <div className="divide-y divide-slate-100 font-semibold text-xs">
                        {merchantsList.filter(m => m.status === 'submitted').map(m => (
                          <div key={m.id} className="p-4 flex justify-between items-center">
                            <div>
                              <span className="block font-bold text-slate-900">{m.businessName}</span>
                              <span className="block text-[10px] text-slate-400">Owner: {m.ownerEmail}</span>
                            </div>
                            <button 
                              onClick={() => setAdminTab('merchants')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px]"
                            >
                              Review Settings
                            </button>
                          </div>
                        ))}
                        {merchantsList.filter(m => m.status === 'submitted').length === 0 && (
                          <div className="p-8 text-center text-slate-400">
                            ✓ All merchant registration profiles have been resolved and approved!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MERCHANTS APPROVAL */}
              {adminTab === 'merchants' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="admin-view-merchants">
                  <div className="p-5 border-b border-slate-150 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Merchants Management</h3>
                      <p className="text-xs text-slate-400 font-medium">Verify direct settlement credentials and approve tenants</p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={merchantSearch}
                        onChange={(e) => setMerchantSearch(e.target.value)}
                        placeholder="Search business name..." 
                        className="text-xs border border-slate-200 rounded-lg pl-9 p-2.5 bg-slate-50 outline-none w-64 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase font-black border-b border-slate-200">
                          <th className="p-4">Business Name</th>
                          <th className="p-4">Owner Email</th>
                          <th className="p-4">Short Code</th>
                          <th className="p-4">Total Revenue</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {merchantsList
                          .filter(m => m.businessName.toLowerCase().includes(merchantSearch.toLowerCase()))
                          .map(m => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="p-4">
                                <span className="font-bold text-slate-900 block">{m.businessName}</span>
                                <span className="text-[10px] text-slate-400 block uppercase font-mono">{m.id}</span>
                              </td>
                              <td className="p-4">{m.ownerEmail}</td>
                              <td className="p-4 font-mono uppercase font-black">{m.merchantCode}</td>
                              <td className="p-4">KES {m.revenue.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  m.status === 'submitted' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  {m.status === 'submitted' && (
                                    <>
                                      <button 
                                        onClick={() => handleMerchantStatus(m.id, 'approved')}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded"
                                        title="Approve Merchant"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button 
                                        onClick={() => handleMerchantStatus(m.id, 'rejected')}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold p-1.5 rounded"
                                        title="Reject Application"
                                      >
                                        <Ban size={14} />
                                      </button>
                                    </>
                                  )}
                                  {m.status === 'approved' && (
                                    <button 
                                      onClick={() => handleMerchantStatus(m.id, 'suspended')}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold p-1.5 rounded flex items-center gap-1 text-[10px]"
                                    >
                                      <AlertTriangle size={12} />
                                      Suspend
                                    </button>
                                  )}
                                  {m.status === 'suspended' && (
                                    <button 
                                      onClick={() => handleMerchantStatus(m.id, 'approved')}
                                      className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded flex items-center gap-1 text-[10px]"
                                    >
                                      <Check size={12} />
                                      Activate
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: USER CONTROL ACCOUNTS */}
              {adminTab === 'users' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="admin-view-users">
                  <div className="p-5 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-base font-black text-slate-900">User Control Center</h3>
                    <input 
                      type="text" 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..." 
                      className="text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none w-64 focus:bg-white"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase font-black border-b border-slate-200">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Affiliated Merchant Space</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {usersList
                          .filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase()))
                          .map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-4">{u.firstName} {u.lastName}</td>
                              <td className="p-4 font-mono">{u.email}</td>
                              <td className="p-4 capitalize">{u.role}</td>
                              <td className="p-4">{u.businessName}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {u.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {u.role !== 'admin' && (
                                  <button 
                                    onClick={() => handleUserStatus(u.id, u.status)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                                      u.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                                  >
                                    {u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: SUPPORT HELPDESK CHAT */}
              {adminTab === 'tickets' && (
                <div className="grid lg:grid-cols-12 gap-6" id="admin-view-support">
                  {/* Left list */}
                  <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[500px] flex flex-col">
                    <div className="p-4 border-b border-slate-150 bg-slate-50">
                      <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide">Support Tickets Feed</h3>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                      {ticketsList.map(tkt => (
                        <div 
                          key={tkt.id}
                          onClick={() => handleOpenTicket(tkt)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${activeTicket?.id === tkt.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-bold text-slate-900 truncate max-w-[150px]">{tkt.businessName}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                              tkt.status === 'open' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-150 text-slate-600'
                            }`}>{tkt.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal truncate">{tkt.subject}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block">Priority: {tkt.priority.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Chat messages */}
                  <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between h-[500px]">
                    {activeTicket ? (
                      <>
                        <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-black text-slate-950 truncate max-w-[400px]">{activeTicket.subject}</h4>
                            <span className="text-[10px] font-mono text-slate-400 block uppercase">Opened by {activeTicket.businessName}</span>
                          </div>
                        </div>

                        {/* Messages logs */}
                        <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-4">
                          {ticketMessages.map(msg => {
                            const isAdmin = msg.senderRole === 'admin';
                            return (
                              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                                  isAdmin 
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                                    : 'bg-white text-slate-800 border border-slate-150 rounded-tl-none'
                                }`}>
                                  <span className={`block font-bold text-[9px] mb-1 ${isAdmin ? 'text-blue-200' : 'text-green-700'}`}>
                                    {msg.senderName} ({msg.senderRole.toUpperCase()})
                                  </span>
                                  {msg.message}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Send reply */}
                        <form onSubmit={handleTicketMessageSubmit} className="p-4 border-t border-slate-150 bg-white flex gap-2" id="admin-reply-form">
                          <input 
                            type="text" 
                            required
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type admin response comment..." 
                            className="flex-1 text-xs border border-slate-200 p-2.5 rounded-lg outline-none focus:border-blue-500"
                          />
                          <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg shrink-0 outline-none"
                          >
                            <Send size={16} />
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 space-y-1">
                        <AlertTriangle size={32} className="text-slate-300" />
                        <h4 className="font-bold text-sm text-slate-800">Support Terminal</h4>
                        <p className="text-xs text-center max-w-sm">
                          Select an open support ticket from the list to reply and offer guidance to registered Kenyan merchant gateways.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: FAQS CONFIG EDITOR */}
              {adminTab === 'faqs' && (
                <div className="grid lg:grid-cols-12 gap-6" id="admin-view-faqs">
                  {/* Create FAQ form */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 h-fit">
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">
                      {editingFaqId ? 'Update FAQ' : 'Publish New FAQ'}
                    </h3>
                    <form onSubmit={handleSaveFaq} className="space-y-4" id="admin-faq-form">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Question Topic</label>
                        <input 
                          type="text" 
                          required
                          value={faqQuestion}
                          onChange={(e) => setFaqQuestion(e.target.value)}
                          placeholder="e.g. How does direct settlement work?" 
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Answer Description</label>
                        <textarea 
                          required
                          rows={4}
                          value={faqAnswer}
                          onChange={(e) => setFaqAnswer(e.target.value)}
                          placeholder="Write a clear professional response description..." 
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none resize-none"
                        ></textarea>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="publishCheck"
                          checked={faqPublished}
                          onChange={(e) => setFaqPublished(e.target.checked)}
                          className="w-4 h-4 border border-slate-200"
                        />
                        <label htmlFor="publishCheck" className="text-xs font-bold text-slate-600">Publish Immediately to Landing Page</label>
                      </div>

                      <div className="flex gap-2">
                        {editingFaqId && (
                          <button 
                            type="button" 
                            onClick={() => { setEditingFaqId(null); setFaqQuestion(''); setFaqAnswer(''); }}
                            className="bg-slate-100 text-slate-700 font-bold text-xs p-3 rounded-lg flex-1"
                          >
                            Cancel Edit
                          </button>
                        )}
                        <button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-3 rounded-lg flex-1"
                        >
                          {editingFaqId ? 'Update FAQ' : 'Create FAQ'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* FAQ list */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-150 bg-slate-50">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Published FAQs Index</h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto font-semibold">
                      {faqsList.map(faq => (
                        <div key={faq.id} className="p-4 flex justify-between items-start text-xs">
                          <div className="space-y-1 max-w-[400px]">
                            <span className="font-bold text-slate-900 block">{faq.question}</span>
                            <p className="text-slate-500 font-normal leading-relaxed">{faq.answer}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${faq.isPublished ? 'bg-green-150 text-green-800' : 'bg-slate-100 text-slate-400'}`}>
                              {faq.isPublished ? 'Published' : 'Hidden'}
                            </span>
                          </div>

                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleEditFaq(faq)}
                              className="p-1 text-slate-400 hover:text-blue-600 border border-slate-100 rounded bg-slate-50"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="p-1 text-slate-400 hover:text-red-600 border border-slate-100 rounded bg-slate-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {adminTab === 'settings' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-xl" id="admin-view-settings">
                  <div className="p-5 border-b border-slate-150 bg-slate-50">
                    <h3 className="text-base font-black text-slate-900">System Platform Configurations</h3>
                    <p className="text-xs text-slate-400 font-medium">Control global toggles, support contact details and flags</p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="p-6 space-y-4" id="admin-settings-form">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Platform Name</label>
                      <input 
                        type="text" 
                        required
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">System Support Email</label>
                      <input 
                        type="email" 
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">System Support Phone Number</label>
                      <input 
                        type="text" 
                        required
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="maintenanceCheck"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="w-4 h-4 border border-slate-200 shrink-0"
                      />
                      <div>
                        <label htmlFor="maintenanceCheck" className="text-xs font-bold text-red-900 block">Enable Global Maintenance Mode</label>
                        <span className="text-[10px] text-red-600 block leading-tight">If enabled, standard payment checkout and landing pages will be restricted by service screens.</span>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={savingSettings}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md"
                    >
                      {savingSettings ? 'Saving...' : 'Save Global Settings'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
