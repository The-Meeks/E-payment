import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Smartphone, Shield, BarChart3, Users, Clock, CheckCircle2, 
  ArrowRight, Phone, Mail, MapPin, MessageSquare, ChevronDown, HelpCircle, AlertCircle
} from 'lucide-react';
import { FAQ } from '../types';

export default function Landing() {
  const { navigateTo, user } = useApp();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  
  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    // Load published FAQs from backend
    fetch('/api/admin/faqs')
      .then(res => res.json())
      .then(data => {
        if (data.faqs) {
          setFaqs(data.faqs.filter((f: any) => f.isPublished));
        }
      })
      .catch(err => console.error('Failed to load FAQs for landing page', err));
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1200);
  };

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" id="payhub-landing">
      {/* -------------------- HEADER / NAV -------------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('/')} id="nav-brand">
            <div className="bg-green-600 text-white p-2 rounded-lg font-bold flex items-center justify-center">
              <span className="text-xl">PH</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">PayHub</span>
              <span className="text-xs block text-green-600 font-mono font-medium tracking-wide">KENYA GATEWAY</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#why-choose" className="hover:text-green-600 transition-colors">Why PayHub</a>
            <a href="#faq" className="hover:text-green-600 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-green-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => navigateTo(user.role === 'admin' ? '/admin' : '/dashboard')}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                id="btn-goto-dashboard"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigateTo('/login')} 
                  className="text-slate-600 hover:text-green-600 text-sm font-semibold px-4 py-2 transition-colors"
                  id="btn-login-nav"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigateTo('/register')} 
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shadow-sm shadow-green-100"
                  id="btn-register-nav"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-b from-white via-white to-slate-50 overflow-hidden" id="hero">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Direct Settlement Payment Gateway
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Collect payments in Kenya directly into <span className="text-green-600">your own accounts</span>.
            </h1>
            
            <p className="text-lg text-slate-600 max-w-xl">
              PayHub enables businesses to accept M-Pesa STK Push and Airtel Money transactions instantly. Zero customer accounts needed. Funds flow straight to your Till, PayBill, or Airtel Merchant Shortcode.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => navigateTo('/register')} 
                className="bg-green-600 hover:bg-green-700 text-white text-base font-bold px-8 py-4 rounded-xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 group"
                id="btn-hero-cta"
              >
                Register Your Business
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigateTo('/login')} 
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-base font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Merchant Portal
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-100">
              <div>
                <span className="block text-3xl font-extrabold text-slate-900">100%</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Direct Settlement</span>
              </div>
              <div>
                <span className="block text-3xl font-extrabold text-slate-900">0%</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Holding Period</span>
              </div>
              <div>
                <span className="block text-3xl font-extrabold text-slate-900">&lt; 3 Min</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Merchant Setup</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center">
            {/* Visual Phone mock / payment simulation illustration */}
            <div className="relative w-72 sm:w-80 bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-800">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl flex items-center justify-center">
                <span className="h-1.5 w-12 bg-slate-700 rounded-full"></span>
              </div>

              <div className="bg-white rounded-[2rem] p-5 h-[480px] flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 pt-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-400">ABC Electronics</span>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">✔ Verified</span>
                  </div>

                  <div className="space-y-1 text-center py-2 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 block font-medium">Paying Total</span>
                    <span className="text-2xl font-black text-slate-800">KES 3,500</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Wallet</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border-2 border-green-600 rounded-xl p-2 flex flex-col items-center gap-1 bg-green-50/50 cursor-pointer">
                        <span className="text-[10px] font-bold text-green-700 font-mono">M-PESA</span>
                      </div>
                      <div className="border border-slate-200 rounded-xl p-2 flex flex-col items-center gap-1 opacity-60 cursor-not-allowed">
                        <span className="text-[10px] font-bold text-red-600 font-mono">AIRTEL</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">M-Pesa Phone Number</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly 
                        value="0712 345 678" 
                        className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-green-600 text-white rounded-xl p-3 text-center text-xs font-bold shadow-md cursor-pointer">
                    Pay KES 3,500 Now
                  </div>
                  <div className="text-[9px] text-center text-slate-400 font-medium">
                    ⚡ Payments are processed securely without PIN inputs on this page.
                  </div>
                </div>
              </div>
            </div>
            {/* Ambient glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300 rounded-full blur-[80px] opacity-25 -z-10"></div>
          </div>
        </div>
      </section>

      {/* -------------------- FEATURES SECTION -------------------- */}
      <section className="py-20 bg-white px-6 border-y border-slate-100" id="features">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider">Features Suite</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Powerful payment infrastructure built for Kenyan commerce
            </h3>
            <p className="text-slate-600">
              Stop relying on third-party settlement delays. Connect your business wallets directly and manage everything in one gorgeous, integrated dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-6">
            <div className="bg-slate-50 hover:bg-slate-100/70 p-8 rounded-2xl border border-slate-100 transition-all space-y-4">
              <div className="bg-green-100 text-green-700 w-12 h-12 rounded-xl flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">M-Pesa STK Push</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trigger high-speed M-Pesa STK prompts natively onto your customers\' handsets. They simply type their PIN to authorize. Supports PayBills & Till Numbers.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/70 p-8 rounded-2xl border border-slate-100 transition-all space-y-4">
              <div className="bg-red-100 text-red-700 w-12 h-12 rounded-xl flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Airtel Money Push</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Accept Airtel Money instantly using simulated sandbox integrations designed to mimic live telecom push interfaces perfectly for high success rates.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/70 p-8 rounded-2xl border border-slate-100 transition-all space-y-4">
              <div className="bg-green-100 text-green-700 w-12 h-12 rounded-xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Direct Settlement Model</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                We never store, touch, or hold your money. Funds flow directly into your company wallets in real-time, eliminating settlement cycles completely.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/70 p-8 rounded-2xl border border-slate-100 transition-all space-y-4">
              <div className="bg-green-100 text-green-700 w-12 h-12 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Real-Time Analytics</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Monitor your daily revenue, transactions, payment status distributions, and export custom financial CSV reports instantly.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/70 p-8 rounded-2xl border border-slate-100 transition-all space-y-4">
              <div className="bg-green-100 text-green-700 w-12 h-12 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Multi-Role Staff Teams</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Invite Cashiers, Accountants, and Managers. Protect permissions dynamically and secure your administrative control panels.
              </p>
            </div>

            <div className="bg-slate-50 hover:bg-slate-100/70 p-8 rounded-2xl border border-slate-100 transition-all space-y-4">
              <div className="bg-green-100 text-green-700 w-12 h-12 rounded-xl flex items-center justify-center">
                <Clock size={24} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Custom Payment Pages</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Get a custom page link (e.g. <span className="font-mono text-xs">/pay/YOURCODE</span>) with your brand logo, description, and custom colors to share on WhatsApp or invoice sheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- WHY CHOOSE US SECTION -------------------- */}
      <section className="py-20 bg-slate-50 px-6" id="why-choose">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-sm font-bold text-green-600 uppercase tracking-wider block">Unparalleled Performance</span>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              A modern gateway that gets out of your way
            </h3>
            <p className="text-slate-600 leading-relaxed">
              PayHub acts exclusively as the secure technological bridge. By configuring your own credentials, you remain the sole custodian of your funds. It is SaaS at its absolute best—safe, lightning fast, and highly developer friendly.
            </p>

            <ul className="space-y-3.5 pt-2">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={18} />
                <div>
                  <span className="font-bold text-slate-800 block">No holding periods</span>
                  <p className="text-sm text-slate-500">Every single Shilling lands on your Till instantly.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={18} />
                <div>
                  <span className="font-bold text-slate-800 block">Maximum Security</span>
                  <p className="text-sm text-slate-500">We never store your customer PINs or intermediate credentials.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={18} />
                <div>
                  <span className="font-bold text-slate-800 block">Seamless Mobile checkout</span>
                  <p className="text-sm text-slate-500">Fully optimized for smartphones, WhatsApp shares, and web sheets.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl space-y-6">
            <h4 className="text-xl font-black text-slate-900">What Merchants Say</h4>
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4 space-y-2">
                <p className="italic text-slate-600 text-sm">
                  "Switching to PayHub\'s Direct Settlement model saved our electronics store over 3% in middleman commissions. Now customer money is in our M-Pesa till immediately upon checkout."
                </p>
                <span className="block text-xs font-bold text-slate-900">— Nelly M., Owner of ABC Electronics</span>
              </div>
              <div className="border-l-4 border-green-500 pl-4 space-y-2">
                <p className="italic text-slate-600 text-sm">
                  "Our staff can monitor incoming cash flows instantly without giving everyone access to our Safaricom account. The team role permission system is beautiful."
                </p>
                <span className="block text-xs font-bold text-slate-900">— Brian O., Director of XYZ Fashion House</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FAQ SECTION -------------------- */}
      <section className="py-20 bg-white px-6 border-t border-slate-100" id="faq">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider">FAQ Center</h2>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Got Questions? We Have Answers</h3>
            <p className="text-slate-500 max-w-xl mx-auto">
              Learn how our multi-tenant SaaS model settles payments instantly into your local accounts.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.length > 0 ? (
              faqs.map((f) => (
                <div key={f.id} className="border border-slate-150 rounded-xl overflow-hidden transition-all bg-slate-50">
                  <button 
                    onClick={() => toggleFaq(f.id)}
                    className="w-full text-left p-5 font-bold text-slate-900 flex justify-between items-center hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={18} className="text-green-600" />
                      {f.question}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`text-slate-400 transition-transform duration-200 ${openFaq === f.id ? 'rotate-180 text-green-600' : ''}`} 
                    />
                  </button>
                  {openFaq === f.id && (
                    <div className="p-5 pt-0 text-sm text-slate-600 border-t border-slate-200/50 bg-white leading-relaxed">
                      {f.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400">
                <AlertCircle className="mx-auto text-slate-300 mb-2" />
                No published FAQs available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* -------------------- CONTACT SECTION -------------------- */}
      <section className="py-20 bg-slate-50 px-6 border-t border-slate-100" id="contact">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5 space-y-6">
            <span className="text-sm font-bold text-green-600 uppercase tracking-wider block">Get in Touch</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">We\'re here to help your business scale</h3>
            <p className="text-slate-600">
              Have questions about Daraja sandbox, Airtel merchant integration, or custom corporate deployment? Reach out to our specialized support teams in Nairobi.
            </p>

            <div className="space-y-4 font-medium text-slate-700 pt-2">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-600" />
                <span>+254 700 000 000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-green-600" />
                <span>support@payhub.co.ke</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-green-600" />
                <span>Junction Plaza, 3rd Floor, Nairobi, Kenya</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
            {contactSuccess ? (
              <div className="text-center py-12 space-y-4" id="contact-success-state">
                <div className="bg-green-100 text-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
                <h4 className="text-2xl font-black text-slate-900">Message Received!</h4>
                <p className="text-slate-600 max-w-md mx-auto">
                  Thank you for contacting PayHub Kenya. Our technical support specialist will get back to your business within the next 2 hours.
                </p>
                <button 
                  onClick={() => setContactSuccess(false)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4" id="contact-form">
                <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={20} className="text-green-600" />
                  Submit Inquiry
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Nelly Mutua" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Business Email</label>
                    <input 
                      type="email" 
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. nelly@abcelectronics.co.ke" 
                      className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">How can we assist you?</label>
                  <textarea 
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your inquiry or payment integration request..." 
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white outline-none focus:border-green-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={contactLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md w-full flex items-center justify-center gap-2"
                >
                  {contactLoading ? 'Submitting Inquiry...' : 'Submit Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 text-white p-1.5 rounded-md font-bold text-sm">PH</div>
              <span className="text-lg font-bold text-white tracking-tight">PayHub Kenya</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              A premium Software-as-a-Service multi-tenant payment gateway. Enabling Kenyan merchants to capture direct settlement STK Push transactions instantly.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platform</h5>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><a href="#features" className="hover:text-green-500 transition-colors">Features Suite</a></li>
              <li><a href="#why-choose" className="hover:text-green-500 transition-colors">Testimonials</a></li>
              <li><span className="opacity-50">Pricing (Coming Soon)</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal</h5>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><span className="hover:text-green-500 cursor-pointer transition-colors">Terms of Service</span></li>
              <li><span className="hover:text-green-500 cursor-pointer transition-colors">Privacy Policy</span></li>
              <li><span className="hover:text-green-500 cursor-pointer transition-colors">Daraja Sandbox terms</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Info</h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              Junction Plaza, Shop 3, Nairobi<br />
              Email: support@payhub.co.ke<br />
              Phone: +254 700 000 000
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col md:row-span-1 md:flex-row justify-between items-center gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} PayHub Kenya. All rights reserved.</span>
          <span className="text-slate-600 text-[10px] uppercase font-mono">
            🛡️ Secure sandbox architecture. Never stores PINs.
          </span>
        </div>
      </footer>
    </div>
  );
}
