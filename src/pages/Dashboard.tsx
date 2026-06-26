import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, Users, Settings, HelpCircle, 
  Plus, Search, Download, Clipboard, Share2, ArrowUpRight, 
  Bell, LogOut, CheckCircle, Smartphone, AlertCircle, 
  Send, UserCheck, ShieldAlert, FileText, ChevronRight, Menu, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { Transaction, TeamMember, SupportTicket, TicketMessage, ActivityLog } from '../types';

export default function Dashboard() {
  const { 
    user, logout, fetchWithAuth, profile, merchantCode, 
    merchantStatus, showToast, refreshMe, activeTab, setActiveTab, navigateTo
  } = useApp();

  // Onboarding / Profile Form States
  const [bizName, setBizName] = useState(profile?.businessName || '');
  const [bizCat, setBizCat] = useState(profile?.businessCategory || 'Retail');
  const [bizType, setBizType] = useState(profile?.businessType || 'Sole Proprietor');
  const [bizDesc, setBizDesc] = useState(profile?.description || '');
  const [county, setCounty] = useState(profile?.county || 'Nairobi');
  const [city, setCity] = useState(profile?.city || 'Nairobi');
  const [address, setAddress] = useState(profile?.physicalAddress || '');
  const [bizEmail, setBizEmail] = useState(profile?.businessEmail || '');
  const [bizPhone, setBizPhone] = useState(profile?.businessPhone || '');
  const [bizLogo, setBizLogo] = useState(profile?.logoUrl || '');
  
  // Credentials
  const [shortcode, setShortcode] = useState(profile?.mpesaShortcode || '174379');
  const [mpesaType, setMpesaType] = useState(profile?.mpesaType || 'till');
  const [consKey, setConsKey] = useState(profile?.mpesaConsumerKey || '');
  const [consSec, setConsSec] = useState(profile?.mpesaConsumerSecret || '');
  const [passkey, setPasskey] = useState(profile?.mpesaPasskey || '');
  const [airtelId, setAirtelId] = useState(profile?.airtelMerchantId || '');
  const [airtelClientId, setAirtelClientId] = useState(profile?.airtelClientId || '');
  const [airtelSecret, setAirtelSecret] = useState(profile?.airtelClientSecret || '');
  
  // Customization & branding
  const [themeColor, setThemeColor] = useState(profile?.themeColor || '#16A34A');
  const [receiptFooter, setReceiptFooter] = useState(profile?.receiptFooter || '');

  // Loading and action controls
  const [submitting, setSubmitting] = useState(false);
  const [dashData, setDashData] = useState<any | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);

  // Transactions list tab states
  const [allTxs, setAllTxs] = useState<Transaction[]>([]);
  const [txSearch, setTxSearch] = useState('');
  const [txFilterMethod, setTxFilterMethod] = useState('all');
  const [txFilterStatus, setTxFilterStatus] = useState('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Team tab states
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirst, setInviteFirst] = useState('');
  const [inviteLast, setInviteLast] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'cashier' | 'accountant' | 'viewer'>('cashier');
  const [inviting, setInviting] = useState(false);

  // Support tab states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Audit Logs
  const [logsList, setLogsList] = useState<ActivityLog[]>([]);

  // Mobile navigation
  const [mobileMenu, setMobileMenu] = useState(false);

  // Synchronize form states when profile finishes loading
  useEffect(() => {
    if (profile) {
      setBizName(profile.businessName || '');
      setBizCat(profile.businessCategory || 'Retail');
      setBizType(profile.businessType || 'Sole Proprietor');
      setBizDesc(profile.description || '');
      setCounty(profile.county || 'Nairobi');
      setCity(profile.city || 'Nairobi');
      setAddress(profile.physicalAddress || '');
      setBizEmail(profile.businessEmail || '');
      setBizPhone(profile.businessPhone || '');
      setBizLogo(profile.logoUrl || '');
      setShortcode(profile.mpesaShortcode || '174379');
      setMpesaType(profile.mpesaType || 'till');
      setConsKey(profile.mpesaConsumerKey || '');
      setConsSec(profile.mpesaConsumerSecret || '');
      setPasskey(profile.mpesaPasskey || '');
      setAirtelId(profile.airtelMerchantId || '');
      setAirtelClientId(profile.airtelClientId || '');
      setAirtelSecret(profile.airtelClientSecret || '');
      setThemeColor(profile.themeColor || '#16A34A');
      setReceiptFooter(profile.receiptFooter || '');
    }
  }, [profile]);

  // Load Dashboard Data (Only for Approved merchants)
  const loadDashboardData = async () => {
    if (merchantStatus !== 'approved') {
      setLoadingDash(false);
      return;
    }
    setLoadingDash(true);
    try {
      const data = await fetchWithAuth('/api/merchant/dashboard');
      setDashData(data);
      
      const txData = await fetchWithAuth('/api/transactions');
      setAllTxs(txData.transactions);

      const teamData = await fetchWithAuth('/api/merchant/team');
      setTeamList(teamData.team);

      const logsData = await fetchWithAuth('/api/merchant/logs');
      setLogsList(logsData.logs);

      const ticketData = await fetchWithAuth('/api/support');
      setTickets(ticketData.tickets);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoadingDash(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [merchantStatus, activeTab]);

  const handleOnboardingSubmit = async (e: React.FormEvent, submitForReview = false) => {
    e.preventDefault();
    if (!bizName || !bizPhone || !bizEmail) {
      showToast('Business name, contact email, and phone are mandatory.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await fetchWithAuth('/api/merchant/profile', {
        method: 'PUT',
        body: JSON.stringify({
          businessName: bizName,
          businessCategory: bizCat,
          businessType: bizType,
          description: bizDesc,
          county,
          city,
          physicalAddress: address,
          businessEmail: bizEmail,
          businessPhone: bizPhone,
          logoUrl: bizLogo || null,
          mpesaShortcode: shortcode,
          mpesaType,
          mpesaConsumerKey: consKey,
          mpesaConsumerSecret: consSec,
          mpesaPasskey: passkey,
          airtelMerchantId: airtelId,
          airtelClientId: airtelClientId,
          airtelClientSecret: airtelSecret,
          themeColor,
          receiptFooter,
          submitForReview
        })
      });

      showToast(submitForReview ? 'Profile submitted for approval!' : 'Configuration updated successfully!', 'success');
      await refreshMe();
    } catch (err: any) {
      showToast(err.message || 'Failed to save configuration.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Team Invite Form handler
  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteFirst || !inviteLast) return;

    setInviting(true);
    try {
      await fetchWithAuth('/api/merchant/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirst,
          lastName: inviteLast,
          role: inviteRole,
          password: 'Password123!' // default sandbox password
        })
      });
      showToast(`Invited ${inviteFirst} ${inviteLast} as a ${inviteRole}`, 'success');
      setInviteEmail('');
      setInviteFirst('');
      setInviteLast('');
      
      // Reload team list
      const teamData = await fetchWithAuth('/api/merchant/team');
      setTeamList(teamData.team);
    } catch (err: any) {
      showToast(err.message || 'Invitation failed.', 'error');
    } finally {
      setInviting(false);
    }
  };

  // Support tickets replies handler
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;

    setSendingMessage(true);
    try {
      const data = await fetchWithAuth(`/api/support/${activeTicket.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });
      setNewMessage('');
      
      // Reload messages
      const msgData = await fetchWithAuth(`/api/support/${activeTicket.id}`);
      setTicketMessages(msgData.messages);

      // Simulate admin automatic response in 4 seconds for immediate testing!
      simulateAdminReply(activeTicket.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to send comment.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Simulate an Admin replying on the ticket thread
  const simulateAdminReply = (ticketId: string) => {
    setTimeout(async () => {
      // Reload messages to check if user has active view on it
      try {
        const msgData = await fetchWithAuth(`/api/support/${ticketId}`);
        // Only append if the message list doesn't already have a very recent admin reply
        const lastMsg = msgData.messages[msgData.messages.length - 1];
        if (lastMsg.senderRole === 'admin') return;

        await fetch(`/api/support/${ticketId}/message`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer usr_admin` // Trigger via Admin Account
          },
          body: JSON.stringify({ 
            message: "Thanks Nelly, our technical gateways team is investigating this sandbox timeout on M-Pesa's side. Please verify that your Consumer Key corresponds to standard Daraja sandbox keys. We have reset your connection parameters so you can test again." 
          })
        });

        // If the user still has this ticket open, reload messages live!
        if (activeTicket && activeTicket.id === ticketId) {
          const updatedMsgData = await fetchWithAuth(`/api/support/${ticketId}`);
          setTicketMessages(updatedMsgData.messages);
        }
      } catch (e) {
        console.error(e);
      }
    }, 4500);
  };

  // Create new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketDesc) return;

    setCreatingTicket(true);
    try {
      await fetchWithAuth('/api/support', {
        method: 'POST',
        body: JSON.stringify({
          subject: newTicketSubject,
          description: newTicketDesc,
          priority: newTicketPriority
        })
      });
      showToast('Support ticket opened successfully!', 'success');
      setNewTicketSubject('');
      setNewTicketDesc('');
      
      // Reload tickets
      const ticketData = await fetchWithAuth('/api/support');
      setTickets(ticketData.tickets);
    } catch (err: any) {
      showToast(err.message || 'Failed to create ticket.', 'error');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleViewTicket = async (tkt: SupportTicket) => {
    setActiveTicket(tkt);
    try {
      const msgData = await fetchWithAuth(`/api/support/${tkt.id}`);
      setTicketMessages(msgData.messages);
    } catch (err) {
      console.error(err);
    }
  };

  // Clipboard copy checkout link
  const copyCheckoutLink = () => {
    const link = `${window.location.origin}/pay/${merchantCode}`;
    navigator.clipboard.writeText(link)
      .then(() => showToast('Customer payment URL copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy. URL: ' + link, 'info'));
  };

  // CSV Export for Transactions
  const exportTxsCSV = () => {
    if (allTxs.length === 0) return;
    
    const headers = ['Transaction ID', 'Customer Phone', 'Reference', 'Payment Method', 'Amount (KES)', 'Status', 'M-Pesa Receipt', 'Settlement Time'];
    const rows = allTxs.map(tx => [
      tx.id,
      tx.customerPhone,
      tx.customerReference,
      tx.paymentMethod.toUpperCase(),
      tx.amount,
      tx.status.toUpperCase(),
      tx.receiptNumber || 'N/A',
      tx.completedAt ? new Date(tx.completedAt).toLocaleString() : 'Pending'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payhub_transactions_${merchantCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions history exported to CSV!', 'success');
  };

  // ---------------------------------------------------------------------------
  // RENDER DRAFT / SUBMITTED ONBOARDING
  // ---------------------------------------------------------------------------
  if (['draft', 'submitted', 'under_review', 'rejected'].includes(merchantStatus || '')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Top Header */}
        <header className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 text-white p-2 rounded-lg font-black">PH</div>
            <span className="text-xl font-bold tracking-tight">PayHub Onboarding</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>{user?.email}</span>
            <button onClick={logout} className="text-red-400 hover:text-red-300 flex items-center gap-1">
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Status Banner */}
        <div className="max-w-4xl mx-auto w-full px-6 py-8 flex-1 space-y-8">
          
          {merchantStatus === 'submitted' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
              <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={24} />
              <div className="space-y-1">
                <h4 className="text-base font-black text-blue-900">Application Submitted Under Compliance Review</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Our Nairobi compliance teams are checking your merchant shortcode configuration. Approvals are typically completed within 2 hours. In the meantime, you can customize your theme colors and test Sandbox checkout parameters!
                </p>
                <div className="pt-3 flex gap-3 text-xs">
                  <button onClick={copyCheckoutLink} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow">
                    <Clipboard size={14} />
                    Copy Payment Page Link
                  </button>
                  <a href={`/pay/${merchantCode}`} target="_blank" className="bg-slate-950 text-white font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1">
                    Open Payment Sandbox
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {merchantStatus === 'draft' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={24} />
              <div className="space-y-1">
                <h4 className="text-base font-black text-amber-900">Step 2: Connect Your Direct Settlement Credentials</h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  To initiate M-Pesa STK push and Airtel Money triggers, provide your Safaricom Daraja Sandbox or corporate credential hashes below. Direct Settlements settlement go straight to your shortcode immediately.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-150 bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">PayHub SaaS Gateway Multi-Tenant Registration</h3>
            </div>

            <form onSubmit={(e) => handleOnboardingSubmit(e, true)} className="p-6 space-y-6" id="onboarding-form">
              {/* Business profile info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-2">
                  <FileText size={16} />
                  Business Information
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Business Public Name</label>
                    <input 
                      type="text" 
                      required
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder="e.g. ABC Electronics Ltd" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Public Category</label>
                    <select 
                      value={bizCat}
                      onChange={(e) => setBizCat(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    >
                      <option value="Electronics & IT">Electronics & IT</option>
                      <option value="Clothing & Fashion">Clothing & Fashion</option>
                      <option value="Retail & Supermarket">Retail & Supermarket</option>
                      <option value="Education & Schools">Education & Schools</option>
                      <option value="SaaS & Digital Products">SaaS & Digital Products</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Public Description (Shown on Checkout Screen)</label>
                  <textarea 
                    rows={3}
                    value={bizDesc}
                    onChange={(e) => setBizDesc(e.target.value)}
                    placeholder="Provide a small helper description for your customers..." 
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all resize-none"
                  ></textarea>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">County</label>
                    <input 
                      type="text" 
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">City/Town</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Physical Address</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Junction Plaza Floor 3" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Billing Email</label>
                    <input 
                      type="email" 
                      required
                      value={bizEmail}
                      onChange={(e) => setBizEmail(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Support Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* M-PESA Configuration */}
              <div className="space-y-4 pt-4 border-t border-slate-150">
                <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide pb-1.5 flex items-center gap-2">
                  <Smartphone size={16} />
                  Safaricom M-Pesa Daraja Credentials
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mpesa Shortcode</label>
                    <input 
                      type="text" 
                      value={shortcode}
                      onChange={(e) => setShortcode(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Shortcode Type</label>
                    <select 
                      value={mpesaType}
                      onChange={(e) => setMpesaType(e.target.value as any)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    >
                      <option value="till">BuyGoods Till Number</option>
                      <option value="paybill">PayBill online shortcode</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Daraja Passkey</label>
                    <input 
                      type="password" 
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      placeholder="bfb279f9aa9bdbcf..." 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consumer Key</label>
                    <input 
                      type="text" 
                      value={consKey}
                      onChange={(e) => setConsKey(e.target.value)}
                      placeholder="Daraja App Consumer Key" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consumer Secret</label>
                    <input 
                      type="password" 
                      value={consSec}
                      onChange={(e) => setConsSec(e.target.value)}
                      placeholder="Daraja App Consumer Secret" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* AIRTEL MONEY CONFIG */}
              <div className="space-y-4 pt-4 border-t border-slate-150">
                <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide pb-1.5 flex items-center gap-2">
                  <Smartphone size={16} />
                  Airtel Money Credentials
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Airtel Merchant ID</label>
                    <input 
                      type="text" 
                      value={airtelId}
                      onChange={(e) => setAirtelId(e.target.value)}
                      placeholder="Airtel wallet merchant code" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Airtel Client ID</label>
                    <input 
                      type="text" 
                      value={airtelClientId}
                      onChange={(e) => setAirtelClientId(e.target.value)}
                      placeholder="API Client credential ID" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Airtel Client Secret</label>
                    <input 
                      type="password" 
                      value={airtelSecret}
                      onChange={(e) => setAirtelSecret(e.target.value)}
                      placeholder="API client secret token" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-150">
                <button 
                  type="button" 
                  disabled={submitting}
                  onClick={(e) => handleOnboardingSubmit(e, false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-3.5 rounded-xl transition-all outline-none"
                >
                  Save Draft
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold p-3.5 rounded-xl transition-all outline-none shadow-md"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Credentials for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800" id="merchant-dashboard">
      
      {/* LEFT SIDEBAR (Sleek Slate-900 Sidebar) */}
      <aside className={`w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col justify-between fixed h-full z-40 transition-transform md:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full md:block'}`} id="dashboard-sidebar">
        <div>
          {/* Logo / Brand */}
          <div className="p-6 flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo('/')}>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">PayHub</span>
          </div>

          {/* Navigation Links with Sleek styling */}
          <nav className="flex-1 px-4 space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setMobileMenu(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart3 size={18} className={activeTab === 'dashboard' ? 'text-green-500' : 'text-slate-400'} />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => { setActiveTab('transactions'); setMobileMenu(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              id="sidebar-transactions-tab"
            >
              <FileText size={18} className={activeTab === 'transactions' ? 'text-green-500' : 'text-slate-400'} />
              <span>Transactions</span>
            </button>
            <button 
              onClick={() => { setActiveTab('analytics'); setMobileMenu(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart3 size={18} className={activeTab === 'analytics' ? 'text-green-500' : 'text-slate-400'} />
              <span>Analytics</span>
            </button>
            <button 
              onClick={() => { setActiveTab('team'); setMobileMenu(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'team' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={18} className={activeTab === 'team' ? 'text-green-500' : 'text-slate-400'} />
              <span>Team</span>
            </button>
            <button 
              onClick={() => { setActiveTab('support'); setMobileMenu(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'support' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <HelpCircle size={18} className={activeTab === 'support' ? 'text-green-500' : 'text-slate-400'} />
              <span>Support</span>
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setMobileMenu(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings size={18} className={activeTab === 'settings' ? 'text-green-500' : 'text-slate-400'} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* User profile section at the bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-xl mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
              {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{profile?.businessName || 'Mama Safi Electrics'}</p>
              <p className="text-[10px] text-slate-500 truncate">Verified Merchant</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-slate-600 focus:outline-none">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">Merchant Overview</h1>
              <p className="text-xs text-slate-500">Real-time insights for {profile?.businessName || 'your business'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Actions Checkout Shortcut */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={copyCheckoutLink} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Clipboard size={14} />
                Copy Pay Link
              </button>
              <a 
                href={`/pay/${merchantCode}`} 
                target="_blank" 
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
              >
                + New Payment Link
                <ArrowUpRight size={14} />
              </a>
            </div>

            <span className="h-6 w-px bg-slate-200 hidden sm:block"></span>

            <div className="bg-green-50 text-green-800 font-bold text-[10px] uppercase border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live Gateway
            </div>
          </div>
        </header>

        {/* CONTENT SWITCHER */}
        <main className="p-8 flex-1 space-y-6">
          {loadingDash ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2 text-slate-400">
                <RefreshCw className="animate-spin text-green-600 mx-auto" size={32} />
                <p className="text-xs font-semibold">Updating dashboard components...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && dashData && (
                <div className="space-y-6 animate-fadeIn" id="view-dashboard">
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Revenue Today</p>
                      <p className="text-2xl font-bold text-slate-900">KES {dashData.metrics.revenueToday.toLocaleString()}</p>
                      <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold uppercase">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                        Direct Settled
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Volume</p>
                      <p className="text-2xl font-bold text-slate-900">KES {dashData.metrics.revenueThisMonth.toLocaleString()}</p>
                      <div className="mt-2 flex items-center text-[10px] text-slate-400 font-medium uppercase">This Month</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Success Rate</p>
                      <p className="text-2xl font-bold text-slate-900">98.2%</p>
                      <div className="mt-2 flex items-center text-[10px] text-green-600 font-bold uppercase">High Performance</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-slate-900">{dashData.metrics.totalTransactions}</p>
                      <div className="mt-2 flex items-center text-[10px] text-slate-400 font-medium uppercase">Cumulative</div>
                    </div>
                  </div>

                  {/* Operational indicators */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Total Count</span>
                      <span className="text-base font-bold text-slate-900">{dashData.metrics.totalTransactions}</span>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-green-600 block uppercase tracking-wider">Successful</span>
                      <span className="text-base font-bold text-green-700">{dashData.metrics.successfulCount}</span>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-amber-500 block uppercase tracking-wider">Processing</span>
                      <span className="text-base font-bold text-amber-700">{dashData.metrics.pendingCount}</span>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Failed / Cancelled</span>
                      <span className="text-base font-bold text-slate-700">{dashData.metrics.failedCount}</span>
                    </div>
                  </div>

                  {/* Main Body Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chart & List Area (col-span-2) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Revenue trends chart */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-slate-900">Revenue Trends</h3>
                          <span className="text-xs text-slate-400 font-medium">Last 15 settled transactions (KES)</span>
                        </div>
                        <div className="h-64 pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={allTxs.filter(t => t.status === 'successful').reverse().slice(0, 15).map(tx => ({
                                date: new Date(tx.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
                                amount: tx.amount
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                              <YAxis tick={{fontSize: 10, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }} />
                              <Line type="monotone" dataKey="amount" stroke="#16A34A" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#FFF'}} activeDot={{r: 6}} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Recent Transactions Table */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
                          <button 
                            onClick={() => setActiveTab('transactions')}
                            className="text-[10px] text-green-600 font-bold uppercase tracking-widest hover:underline"
                          >
                            View All
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-[10px] text-slate-400 uppercase tracking-wider">
                              <tr>
                                <th className="pb-2 font-medium">Reference</th>
                                <th className="pb-2 font-medium">Customer</th>
                                <th className="pb-2 font-medium">Amount</th>
                                <th className="pb-2 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs text-slate-700">
                              {dashData.recentTransactions.slice(0, 5).map((tx: Transaction) => (
                                <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer">
                                  <td className="py-3 font-mono text-slate-900">{tx.customerReference || `TRX-${tx.id.substring(0,6).toUpperCase()}`}</td>
                                  <td className="py-3 font-medium text-slate-600">{tx.customerPhone}</td>
                                  <td className="py-3 font-medium text-slate-900">KES {tx.amount.toLocaleString()}</td>
                                  <td className={`py-3 font-bold ${tx.status === 'successful' ? 'text-green-600' : tx.status === 'processing' ? 'text-amber-500' : 'text-slate-500'}`}>
                                    {tx.status.toUpperCase()}
                                  </td>
                                </tr>
                              ))}
                              {dashData.recentTransactions.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-6 text-center text-slate-400">No transactions recorded yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                    {/* Quick View Side (col-span-1) */}
                    <div className="flex flex-col space-y-6">
                      
                      {/* Live Checkout Link Preview */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Live Checkout Link</h3>
                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold">Public Payment URL</p>
                          <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-600 truncate mr-2 font-mono">
                              payhub.co/pay/{merchantCode}
                            </span>
                            <button onClick={copyCheckoutLink} className="text-slate-400 hover:text-slate-600" title="Copy URL">
                              <Clipboard size={14} />
                            </button>
                          </div>
                          
                          {/* Mini interactive preview template */}
                          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white">
                                {profile?.businessName ? profile.businessName.substring(0, 2).toUpperCase() : 'PH'}
                              </div>
                              <div className="h-3 w-20 bg-slate-200 rounded"></div>
                            </div>
                            <div className="h-8 w-full bg-slate-50 border border-slate-200 rounded mb-2"></div>
                            <div className="h-10 w-full bg-green-600 rounded flex items-center justify-center">
                              <span className="text-[10px] text-white font-bold">PAY NOW</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <button 
                            onClick={copyCheckoutLink} 
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center border border-slate-200 transition-colors"
                          >
                            <Share2 size={14} className="mr-2 text-slate-400" />
                            Share Link
                          </button>
                          <a 
                            href={`/pay/${merchantCode}`} 
                            target="_blank" 
                            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center border border-slate-200 transition-colors text-center inline-block"
                          >
                            Open Checkout
                          </a>
                        </div>
                      </div>

                      {/* Direct Settlement notice badge */}
                      <div className="bg-slate-900 p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center space-x-2 text-green-500 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-[10px] font-bold uppercase tracking-wider">Direct Settlement Active</p>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Funds go directly to your configured M-Pesa Shortcode <span className="text-white font-mono font-medium">{profile?.mpesaShortcode || '174379'}</span>. PayHub does not hold your cash.
                        </p>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: TRANSACTIONS LIST */}
              {activeTab === 'transactions' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="view-transactions">
                  {/* Filter header */}
                  <div className="p-5 border-b border-slate-150 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Settlements Ledger</h3>
                      <p className="text-xs text-slate-400 font-medium">Verify STK Push results and export spreadsheets</p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button 
                        onClick={exportTxsCSV}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow"
                      >
                        <Download size={14} />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Filters search bar */}
                  <div className="p-4 border-b border-slate-150 grid md:grid-cols-4 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={txSearch}
                        onChange={(e) => setTxSearch(e.target.value)}
                        placeholder="Search phone or ref..." 
                        className="w-full text-xs border border-slate-200 rounded-lg pl-9 p-2.5 bg-slate-50 outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <select 
                        value={txFilterMethod} 
                        onChange={(e) => setTxFilterMethod(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:bg-white"
                      >
                        <option value="all">All Wallets</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="airtel">Airtel Money</option>
                      </select>
                    </div>

                    <div>
                      <select 
                        value={txFilterStatus} 
                        onChange={(e) => setTxFilterStatus(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:bg-white"
                      >
                        <option value="all">All Statuses</option>
                        <option value="successful">Successful</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>

                  {/* Table list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase font-black border-b border-slate-200">
                          <th className="p-4">Transaction ID</th>
                          <th className="p-4">Customer Phone</th>
                          <th className="p-4">Reference</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Receipt Ref</th>
                          <th className="p-4 text-right">Initiated At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {allTxs
                          .filter(tx => {
                            const matchSearch = tx.customerPhone.includes(txSearch) || tx.customerReference.toLowerCase().includes(txSearch.toLowerCase()) || tx.id.includes(txSearch);
                            const matchMethod = txFilterMethod === 'all' || tx.paymentMethod === txFilterMethod;
                            const matchStatus = txFilterStatus === 'all' || tx.status === txFilterStatus;
                            return matchSearch && matchMethod && matchStatus;
                          })
                          .map((tx) => (
                            <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-slate-50 cursor-pointer">
                              <td className="p-4 font-mono text-slate-400">{tx.id}</td>
                              <td className="p-4 font-mono">{tx.customerPhone}</td>
                              <td className="p-4">{tx.customerReference}</td>
                              <td className="p-4 uppercase">{tx.paymentMethod}</td>
                              <td className="p-4 font-bold text-slate-900">KES {tx.amount.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.status === 'successful' ? 'bg-green-100 text-green-800' :
                                  tx.status === 'processing' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="p-4 font-mono">{tx.receiptNumber || '—'}</td>
                              <td className="p-4 text-right text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ANALYTICS DETAIL */}
              {activeTab === 'analytics' && (
                <div className="space-y-6" id="view-analytics">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-slate-950 uppercase tracking-wide">Historical Activity charts</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={allTxs.map(tx => ({ name: tx.id.substring(3, 8), amount: tx.amount }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 10}} />
                          <YAxis tick={{fontSize: 10}} />
                          <Tooltip />
                          <Bar dataKey="amount" fill="#16A34A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TEAM MANAGEMENT */}
              {activeTab === 'team' && (
                <div className="grid lg:grid-cols-12 gap-6" id="view-team">
                  {/* Current staff list */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-8">
                    <div className="p-5 border-b border-slate-150 bg-slate-50">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Business Staff Members</h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {teamList.map((stf) => (
                        <div key={stf.id} className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                              {stf.firstName.charAt(0)}{stf.lastName.charAt(0)}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-950 text-sm">{stf.firstName} {stf.lastName}</span>
                              <span className="block text-xs text-slate-400 leading-normal">{stf.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full capitalize text-[10px]">
                              {stf.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              stf.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700'
                            }`}>
                              {stf.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invite form */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-4 h-fit space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <UserCheck size={18} className="text-green-600" />
                      Add Team Member
                    </h3>
                    
                    <form onSubmit={handleInviteStaff} className="space-y-4" id="invite-form">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                          <input 
                            type="text" 
                            required
                            value={inviteFirst}
                            onChange={(e) => setInviteFirst(e.target.value)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                          <input 
                            type="text" 
                            required
                            value={inviteLast}
                            onChange={(e) => setInviteLast(e.target.value)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Email</label>
                        <input 
                          type="email" 
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="cashier@yourbusiness.co.ke" 
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Role</label>
                        <select 
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none"
                        >
                          <option value="manager">Manager (Can edit settings)</option>
                          <option value="cashier">Cashier (Can monitor payments)</option>
                          <option value="accountant">Accountant (Viewer only)</option>
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        disabled={inviting}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md"
                      >
                        {inviting ? 'Inviting...' : 'Add Team Member'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: SUPPORT TICKETS & INTERACTIVE CHAT */}
              {activeTab === 'support' && (
                <div className="grid lg:grid-cols-12 gap-6" id="view-support">
                  {/* Left panel: tickets list or create form */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Create New Ticket */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">Raise Compliance or Support Ticket</h3>
                      <form onSubmit={handleCreateTicket} className="space-y-4" id="support-ticket-form">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inquiry Subject</label>
                          <input 
                            type="text" 
                            required
                            value={newTicketSubject}
                            onChange={(e) => setNewTicketSubject(e.target.value)}
                            placeholder="e.g. Airtel money API key issue" 
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none focus:border-green-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority Level</label>
                          <select 
                            value={newTicketPriority}
                            onChange={(e) => setNewTicketPriority(e.target.value as any)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none"
                          >
                            <option value="low">Low (General Inquiry)</option>
                            <option value="medium">Medium (Technical Setup)</option>
                            <option value="high">High (Production Blocked)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detailed Description</label>
                          <textarea 
                            required
                            rows={3}
                            value={newTicketDesc}
                            onChange={(e) => setNewTicketDesc(e.target.value)}
                            placeholder="Describe your issue or sandbox failures..." 
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none focus:border-green-500 resize-none"
                          ></textarea>
                        </div>

                        <button 
                          type="submit" 
                          disabled={creatingTicket}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md"
                        >
                          {creatingTicket ? 'Submitting...' : 'Open Help Desk Ticket'}
                        </button>
                      </form>
                    </div>

                    {/* Support history */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-150 bg-slate-50">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Support Tickets History</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {tickets.map(tkt => (
                          <div 
                            key={tkt.id} 
                            onClick={() => handleViewTicket(tkt)}
                            className={`p-4 cursor-pointer text-xs font-semibold hover:bg-slate-50 transition-colors ${activeTicket?.id === tkt.id ? 'bg-green-50/40 border-l-4 border-green-600' : ''}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900 truncate max-w-[180px]">{tkt.subject}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                tkt.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>{tkt.status}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Priority: {tkt.priority.toUpperCase()}</span>
                              <span>{new Date(tkt.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Chat messages */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between h-[520px]">
                    {activeTicket ? (
                      <>
                        {/* Chat head */}
                        <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-black text-slate-950 truncate max-w-[300px]">{activeTicket.subject}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{activeTicket.id} &bull; Priority: {activeTicket.priority}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            activeTicket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>{activeTicket.status}</span>
                        </div>

                        {/* Message container */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                          {ticketMessages.map(msg => {
                            const isAdmin = msg.senderRole === 'admin';
                            return (
                              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                                <div className={`max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                                  isAdmin 
                                    ? 'bg-white text-slate-800 rounded-tl-none border border-slate-150' 
                                    : 'bg-green-600 text-white rounded-tr-none shadow-sm shadow-green-100'
                                }`}>
                                  <span className={`block font-bold text-[9px] mb-1 ${isAdmin ? 'text-blue-600' : 'text-green-200'}`}>
                                    {msg.senderName} ({msg.senderRole.toUpperCase()})
                                  </span>
                                  {msg.message}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Send message form */}
                        <form onSubmit={handleSendReply} className="p-4 border-t border-slate-150 bg-white flex gap-2" id="chat-input-form">
                          <input 
                            type="text" 
                            required
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your comment or reply..." 
                            className="flex-1 text-xs border border-slate-200 p-2.5 rounded-lg outline-none focus:border-green-500"
                          />
                          <button 
                            type="submit" 
                            disabled={sendingMessage}
                            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg shrink-0 outline-none"
                          >
                            <Send size={16} />
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 space-y-2">
                        <AlertCircle size={32} className="text-slate-300" />
                        <h4 className="font-bold text-sm text-slate-800">No Support Ticket Selected</h4>
                        <p className="text-xs text-center max-w-sm">
                          Select an open inquiry ticket from the list or raise a new technical support issue to chat live with our support team.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="view-settings">
                  <div className="p-5 border-b border-slate-150 bg-slate-50">
                    <h3 className="text-base font-black text-slate-900">Payment Credential Settings</h3>
                    <p className="text-xs text-slate-400 font-medium">Configure M-Pesa till and Airtel money hashes</p>
                  </div>

                  <form onSubmit={(e) => handleOnboardingSubmit(e, false)} className="p-6 space-y-6" id="settings-form">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">M-Pesa Shortcode</label>
                        <input 
                          type="text" 
                          value={shortcode}
                          onChange={(e) => setShortcode(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">M-Pesa Type</label>
                        <select 
                          value={mpesaType}
                          onChange={(e) => setMpesaType(e.target.value as any)}
                          className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none"
                        >
                          <option value="till">BuyGoods Till</option>
                          <option value="paybill">PayBill online</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consumer Key</label>
                        <input 
                          type="text" 
                          value={consKey}
                          onChange={(e) => setConsKey(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consumer Secret</label>
                        <input 
                          type="password" 
                          value={consSec}
                          onChange={(e) => setConsSec(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Airtel Merchant ID</label>
                        <input 
                          type="text" 
                          value={airtelId}
                          onChange={(e) => setAirtelId(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg p-3 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Branding Primary Color</label>
                        <input 
                          type="color" 
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-20 h-10 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md"
                    >
                      {submitting ? 'Saving...' : 'Update Settings'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>

        {/* Dynamic transaction slide-over drawer details */}
        {selectedTx && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" id="tx-details-drawer">
            <div className="w-full max-w-md bg-white h-full p-6 space-y-6 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-150 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase">Settlement Details</h3>
                    <span className="text-[10px] font-mono text-slate-400">{selectedTx.id}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedTx(null)} 
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-xs font-semibold text-slate-600 space-y-3">
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Paid Amount:</span>
                    <span className="text-slate-900 font-black text-sm">KES {selectedTx.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Customer Phone:</span>
                    <span className="text-slate-900 font-mono">{selectedTx.customerPhone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Payment Wallet:</span>
                    <span className="text-slate-900 uppercase font-bold">{selectedTx.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Reference:</span>
                    <span className="text-slate-900">{selectedTx.customerReference}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Operator Receipt Ref:</span>
                    <span className="text-slate-900 font-mono text-green-700">{selectedTx.receiptNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed At:</span>
                    <span className="text-slate-900">{selectedTx.completedAt ? new Date(selectedTx.completedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTx(null)} 
                className="w-full bg-slate-900 text-white font-bold p-3 rounded-xl text-xs"
              >
                Close Settlement Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
