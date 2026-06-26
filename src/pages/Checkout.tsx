import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Smartphone, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, Download, Printer } from 'lucide-react';
import { TransactionStatus, PaymentMethod } from '../types';

export default function Checkout() {
  const { currentPath, navigateTo } = useApp();
  
  // Extract merchant code from path: /pay/CODE
  const pathParts = currentPath.split('/');
  const merchantCode = pathParts[2] || '';

  const [merchantInfo, setMerchantInfo] = useState<any | null>(null);
  const [profileInfo, setProfileInfo] = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(true);

  // Form States
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  
  // Checkout Process States
  const [initiating, setInitiating] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TransactionStatus | 'idle'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const countdownIntervalRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  // Parse URL search params for optional preset amounts and references
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetAmount = params.get('amount');
    const presetRef = params.get('ref') || params.get('reference');
    if (presetAmount) setAmount(presetAmount);
    if (presetRef) setReference(presetRef);
  }, [currentPath]);

  // Fetch Merchant Details on mount
  useEffect(() => {
    if (!merchantCode) {
      setFetchError('Missing merchant gateway code.');
      setLoadingMerchant(false);
      return;
    }

    setLoadingMerchant(true);
    setFetchError(null);

    fetch(`/api/public/pay/${merchantCode}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load merchant gateway details.');
        }
        setMerchantInfo(data.merchant);
        setProfileInfo(data.profile);
      })
      .catch((err: any) => {
        setFetchError(err.message || 'Error reaching payment gateway.');
      })
      .finally(() => {
        setLoadingMerchant(false);
      });
  }, [merchantCode]);

  // Countdown timer effect during wait
  useEffect(() => {
    if (txStatus === 'processing' && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setTxStatus('expired');
            setStatusMessage('Request timed out. Please try initiating again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [txStatus]);

  // Status Polling Effect
  useEffect(() => {
    if (checkoutRequestId && txStatus === 'processing') {
      pollIntervalRef.current = setInterval(() => {
        fetch(`/api/public/pay/status/${checkoutRequestId}`)
          .then(res => res.json())
          .then(data => {
            if (data.status && data.status !== 'processing') {
              setTxStatus(data.status);
              clearInterval(pollIntervalRef.current);
              
              if (data.status === 'successful') {
                setReceiptData(data);
                setStatusMessage('Payment received and settled successfully!');
              } else if (data.status === 'cancelled') {
                setStatusMessage(data.responseDescription || 'Payment request cancelled by user.');
              } else {
                setStatusMessage(data.responseDescription || 'Mobile money payment failed.');
              }
            }
          })
          .catch(err => console.error('Error polling transaction status', err));
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [checkoutRequestId, txStatus]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !amount) {
      alert('Please fill in your phone number and payment amount.');
      return;
    }

    setInitiating(true);
    setFetchError(null);

    try {
      const res = await fetch(`/api/public/pay/${merchantCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, paymentMethod, reference })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment initiation failed.');
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setTxStatus('processing');
      setStatusMessage(data.customerMessage);
      setCountdown(120); // Reset countdown to 2 minutes
    } catch (err: any) {
      setFetchError(err.message || 'An error occurred during payment initiation.');
    } finally {
      setInitiating(false);
    }
  };

  const resetForm = () => {
    setTxStatus('idle');
    setCheckoutRequestId(null);
    setReceiptData(null);
    setCountdown(120);
    setPhone('');
    setAmount('');
    setReference('');
  };

  const triggerPrint = () => {
    window.print();
  };

  if (loadingMerchant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <RefreshCw className="animate-spin text-green-600 mx-auto" size={40} />
          <p className="text-sm font-bold text-slate-500">Retrieving PayHub Secured Gateway...</p>
        </div>
      </div>
    );
  }

  if (fetchError && txStatus === 'idle') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans px-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="bg-red-100 text-red-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">!</div>
          <h3 className="text-xl font-black text-slate-900">Gateway Error</h3>
          <p className="text-sm text-slate-600">{fetchError}</p>
          <button 
            onClick={() => navigateTo('/')}
            className="bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg inline-flex items-center gap-1.5"
          >
            <ChevronLeft size={16} />
            Back to PayHub Kenya
          </button>
        </div>
      </div>
    );
  }

  // Dynamic Theme Styling
  const themeHex = profileInfo?.themeColor || '#16A34A';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-12 px-6 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Merchant Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl" id="checkout-container">
          
          {/* Header Banner */}
          <div className="p-6 border-b border-slate-150 flex items-center justify-between" style={{ borderTop: `5px solid ${themeHex}` }}>
            <div className="flex items-center gap-3">
              {profileInfo?.logoUrl ? (
                <img 
                  src={profileInfo.logoUrl} 
                  alt={profileInfo.businessName} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg border border-slate-200">
                  {profileInfo?.businessName ? profileInfo.businessName.substring(0, 2).toUpperCase() : 'ME'}
                </div>
              )}
              <div>
                <h2 className="text-base font-black text-slate-900">{profileInfo?.businessName || 'Merchant Gateway'}</h2>
                <div className="flex items-center gap-1 text-[11px] text-green-700 font-bold">
                  <span>✔ Verified Merchant</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-wider">Powered By</span>
              <span className="text-xs font-black text-green-600">PayHub</span>
            </div>
          </div>

          {/* Checkout UI Switchboard */}
          <div className="p-6">
            
            {/* IDLE STATE: Form Inputs */}
            {txStatus === 'idle' && (
              <form onSubmit={handlePay} className="space-y-4" id="checkout-form">
                
                {profileInfo?.description && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl leading-relaxed">
                    {profileInfo.description}
                  </p>
                )}

                {/* Amount Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Amount (KES)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500" 
                    className="w-full text-base font-bold border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                  />
                </div>

                {/* Select payment method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Wallet Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none ${
                        paymentMethod === 'mpesa' 
                          ? 'border-green-600 bg-green-50/40 text-green-700 font-bold' 
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <Smartphone size={18} />
                      <span className="text-xs font-mono">M-PESA PUSH</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('airtel')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none ${
                        paymentMethod === 'airtel' 
                          ? 'border-red-600 bg-red-50/40 text-red-700 font-bold' 
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <Smartphone size={18} />
                      <span className="text-xs font-mono">AIRTEL PUSH</span>
                    </button>
                  </div>
                </div>

                {/* Phone number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {paymentMethod === 'mpesa' ? 'M-Pesa Number' : 'Airtel Money Number'}
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 2547..." 
                    className="w-full text-sm font-semibold border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                  />
                </div>

                {/* Reference Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Payment Reference <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. Invoice #1024 or Table 4" 
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none focus:bg-white focus:border-green-500 transition-all"
                  />
                </div>

                {fetchError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{fetchError}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={initiating}
                  className="w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeHex }}
                >
                  {initiating ? 'Triggering API...' : `Pay KES ${parseFloat(amount || '0').toLocaleString()} Now`}
                </button>
              </form>
            )}

            {/* WAITING STATE: STK Push sent, counting down */}
            {txStatus === 'processing' && (
              <div className="text-center py-6 space-y-6" id="waiting-state">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-slate-700">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900">Push Request Dispatched!</h3>
                  <p className="text-xs text-slate-500 px-4 leading-relaxed">
                    An STK prompt has been pushed to <span className="font-bold text-slate-700">{phone}</span>. Please enter your mobile money PIN on your handset to authorize.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 max-w-sm mx-auto flex items-center gap-3 border border-slate-150">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                  <p className="text-left leading-normal font-medium">
                    Waiting for network callback confirmation. Do not close or reload this window.
                  </p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE: printable receipt */}
            {txStatus === 'successful' && receiptData && (
              <div className="space-y-6 text-center py-4" id="receipt-view">
                <div className="bg-green-100 text-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Payment Successful</h3>
                  <p className="text-xs text-slate-400">Directly settled to {profileInfo?.businessName}</p>
                </div>

                {/* Receipt Grid */}
                <div className="bg-slate-50 rounded-xl p-5 text-xs text-left font-semibold text-slate-600 border border-slate-150 space-y-3">
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Receipt Ref:</span>
                    <span className="text-slate-900 uppercase font-mono">{receiptData.receiptNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Paid Amount:</span>
                    <span className="text-slate-900 font-bold">KES {receiptData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Customer Phone:</span>
                    <span className="text-slate-900">{receiptData.customerPhone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Payment Wallet:</span>
                    <span className="text-slate-900 uppercase">{paymentMethod} Push</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Settled At:</span>
                    <span className="text-slate-900">{new Date(receiptData.completedAt).toLocaleString()}</span>
                  </div>
                </div>

                {profileInfo?.receiptFooter && (
                  <p className="text-[10px] text-slate-400 italic px-6 text-center leading-normal">
                    "{profileInfo.receiptFooter}"
                  </p>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={triggerPrint}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer size={14} />
                    Print Receipt
                  </button>
                  <button 
                    onClick={resetForm}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-3 rounded-xl transition-colors"
                  >
                    Pay Another
                  </button>
                </div>
              </div>
            )}

            {/* FAILURE STATE */}
            {['failed', 'cancelled', 'expired'].includes(txStatus) && (
              <div className="text-center py-6 space-y-5" id="failure-state">
                <div className="bg-red-100 text-red-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✕</div>
                
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900">Payment Failed</h3>
                  <p className="text-xs text-slate-500 px-6 leading-relaxed">
                    {statusMessage || 'The transaction request was declined by the mobile operator.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={resetForm}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors"
                  >
                    Try Payment Again
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Secure notice info bar */}
          <div className="bg-slate-50 p-4 border-t border-slate-150 text-[10px] text-slate-400 font-medium flex items-start gap-2.5">
            <Shield size={16} className="text-green-600 shrink-0 mt-0.5" />
            <p className="leading-normal">
              <strong className="text-slate-600">Security Notice:</strong> Never enter your M-Pesa or Airtel Money PIN on this website. Your PIN will only be entered on your physical handset after receiving the operator prompt.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-medium pt-8">
        <span>Powered by PayHub Direct Gateway Settlements &bull; Nairobi, Kenya</span>
      </div>
    </div>
  );
}
