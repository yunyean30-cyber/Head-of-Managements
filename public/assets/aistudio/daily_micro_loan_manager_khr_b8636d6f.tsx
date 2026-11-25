import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Send, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Plus, 
  Phone, 
  FileText, 
  TrendingUp, 
  Printer, 
  X, 
  ChevronRight, 
  CheckCircle2,
  BarChart3,
  Trash2,
  Receipt
} from 'lucide-react';

const OCCUPATION_OPTIONS = [
  'លក់ត្រី',
  'លក់បន្លែ',
  'លក់កាហ្វេ',
  'លក់សាច់ជ្រូក',
  'លក់សាច់គោ',
  'លក់ប្រហិត',
  'លក់ចេកចៀន',
  'លក់បាយ',
  'លក់ចាប់ហួយ',
  'ជាងជួសជុល',
  'បុគ្គលិកក្រុមហ៊ុន',
  'ផ្សេងៗ'
];

const DAILY_PROFIT_TIERS = [
  { label: '២០,០០០ ៛', value: 20000 },
  { label: '២៥,០០០ ៛', value: 25000 },
  { label: '៣០,០០០ ៛', value: 30000 },
  { label: '៣៥,០០០ ៛', value: 35000 },
  { label: '៤០,០០០ ៛', value: 40000 },
  { label: '៥០,០០០ ៛', value: 50000 }
];

export default function App() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState('dueToday'); // 'dueToday' | 'missed' | 'allLoans'
  
  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(null); // Selected Loan for Schedule View
  const [showPaymentModal, setShowPaymentModal] = useState(null); // Selected Loan for Payment Recording
  const [paymentInputAmount, setPaymentInputAmount] = useState(''); // Actual payment amount entered by user
  const [showPnLModal, setShowPnLModal] = useState(false); // Profit & Loss Modal
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // State: Customers
  const [customers, setCustomers] = useState([
    { id: 1, code: 'CUST-001', name: 'សុខ ចាន់ណា', gender: 'ស្រី', phone: '012 345 678', occupation: 'លក់ត្រី' },
    { id: 2, code: 'CUST-002', name: 'កែវ សីហា', gender: 'ប្រុស', phone: '098 765 432', occupation: 'លក់កាហ្វេ' },
    { id: 3, code: 'CUST-003', name: 'ម៉ៅ សុភ័ក្រ', gender: 'ស្រី', phone: '088 123 999', occupation: 'លក់បន្លែ' },
    { id: 4, code: 'CUST-004', name: 'ជា វិសាល', gender: 'ប្រុស', phone: '077 555 888', occupation: 'លក់សាច់ជ្រូក' }
  ]);

  // Form State: New Customer
  const [newCust, setNewCust] = useState({
    name: '',
    gender: 'ស្រី',
    phone: '',
    occupation: 'លក់ត្រី'
  });

  // State: Loans
  const [loans, setLoans] = useState([
    {
      id: 1,
      loanCode: 'LN-202611-001',
      customerId: 1,
      customerName: 'សុខ ចាន់ណា',
      phone: '012 345 678',
      occupation: 'លក់ត្រី',
      principal: 600000,
      method: 'DAILY',
      durationDays: 22,
      profitAmount: 40000,
      totalAmount: 640000,
      dailyRepayment: Math.round(640000 / 22),
      startDate: '2026-11-01',
      dueDateNext: '2026-11-06',
      dueAmountToday: 29091,
      paidDays: 5,
      totalPaid: 145455,
      status: 'ACTIVE',
      paidToday: false
    },
    {
      id: 2,
      loanCode: 'LN-202611-002',
      customerId: 2,
      customerName: 'កែវ សីហា',
      phone: '098 765 432',
      occupation: 'លក់កាហ្វេ',
      principal: 400000,
      method: 'DAILY',
      durationDays: 21,
      profitAmount: 30000,
      totalAmount: 430000,
      dailyRepayment: Math.round(430000 / 21),
      startDate: '2026-10-25',
      dueDateNext: '2026-11-06',
      dueAmountToday: 20476,
      paidDays: 12,
      totalPaid: 245712,
      status: 'ACTIVE',
      paidToday: true
    },
    {
      id: 3,
      loanCode: 'LN-202611-003',
      customerId: 3,
      customerName: 'ម៉ៅ សុភ័ក្រ',
      phone: '088 123 999',
      occupation: 'លក់បន្លែ',
      principal: 800000,
      method: 'DAILY',
      durationDays: 22,
      profitAmount: 50000,
      totalAmount: 850000,
      dailyRepayment: Math.round(850000 / 22),
      startDate: '2026-10-20',
      dueDateNext: '2026-11-06',
      dueAmountToday: 38636,
      paidDays: 16,
      totalPaid: 618176,
      status: 'ACTIVE',
      paidToday: false
    }
  ]);

  // State: Expenses for Profit & Loss
  const [expenses, setExpenses] = useState([
    { id: 1, date: '2026-11-01', description: 'ចំណាយថ្លៃសាំងម៉ូតូដើរប្រមូលប្រាក់', amount: 15000 },
    { id: 2, date: '2026-11-03', description: 'ទិញសៀវភៅកត់ត្រា និងប៊ិច', amount: 8000 }
  ]);

  const [newExpense, setNewExpense] = useState({
    date: '2026-11-06',
    description: '',
    amount: ''
  });

  // Form State: Disbursement
  const [disburseForm, setDisburseForm] = useState({
    customerId: '',
    principal: 500000,
    method: 'DAILY',
    durationDays: 22,
    profitAmount: 30000,
    startDate: '2026-11-06',
    firstDueDate: '2026-11-07',
    months: 3,
    interestRatePercent: 3.5
  });

  // Helper: Format Currency in KHR
  const formatKHR = (amount) => {
    return new Intl.NumberFormat('km-KH').format(Math.round(amount || 0)) + ' ៛';
  };

  // Auto-update firstDueDate when startDate or method changes
  const handleStartDateChange = (newStartDate) => {
    const baseDate = new Date(newStartDate);
    if (!isNaN(baseDate.getTime())) {
      if (disburseForm.method === 'DAILY') {
        baseDate.setDate(baseDate.getDate() + 1);
      } else {
        baseDate.setMonth(baseDate.getMonth() + 1);
      }
      setDisburseForm({
        ...disburseForm,
        startDate: newStartDate,
        firstDueDate: baseDate.toISOString().split('T')[0]
      });
    } else {
      setDisburseForm({ ...disburseForm, startDate: newStartDate });
    }
  };

  // Preview schedule calculation for Disbursement Modal
  const previewSchedule = useMemo(() => {
    const list = [];
    const p = parseFloat(disburseForm.principal) || 0;
    
    if (disburseForm.method === 'DAILY') {
      const n = parseInt(disburseForm.durationDays, 10) || 22;
      const profit = parseFloat(disburseForm.profitAmount) || 0;
      const total = p + profit;
      const dailyTotal = Math.round(total / n);
      const dailyPrincipal = Math.round(p / n);
      const dailyProfit = Math.round(profit / n);

      let remPrincipal = p;
      const start = new Date(disburseForm.startDate || '2026-11-06');

      for (let i = 1; i <= n; i++) {
        const curDate = new Date(start);
        curDate.setDate(curDate.getDate() + i);
        const thisPrincipal = (i === n) ? remPrincipal : dailyPrincipal;
        remPrincipal -= thisPrincipal;

        list.push({
          num: i,
          date: !isNaN(curDate.getTime()) ? curDate.toISOString().split('T')[0] : '',
          principal: thisPrincipal,
          interest: dailyProfit,
          total: (i === n) ? (thisPrincipal + dailyProfit) : dailyTotal,
          remaining: Math.max(0, remPrincipal)
        });
      }
    } else {
      const m = parseInt(disburseForm.months, 10) || 3;
      const rate = parseFloat(disburseForm.interestRatePercent) || 0;
      const monthlyPrincipal = Math.round(p / m);
      const monthlyInterest = Math.round(p * (rate / 100));

      let remPrincipal = p;
      const start = new Date(disburseForm.startDate || '2026-11-06');

      for (let i = 1; i <= m; i++) {
        const curDate = new Date(start);
        curDate.setMonth(curDate.getMonth() + i);
        const thisPrincipal = (i === m) ? remPrincipal : monthlyPrincipal;
        remPrincipal -= thisPrincipal;

        list.push({
          num: i,
          date: !isNaN(curDate.getTime()) ? curDate.toISOString().split('T')[0] : '',
          principal: thisPrincipal,
          interest: monthlyInterest,
          total: thisPrincipal + monthlyInterest,
          remaining: Math.max(0, remPrincipal)
        });
      }
    }
    return list;
  }, [disburseForm]);

  // Handle Add Customer
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;
    const newId = customers.length + 1;
    const code = `CUST-${String(newId).padStart(3, '0')}`;
    const added = { id: newId, code, ...newCust };
    setCustomers([...customers, added]);
    setNewCust({ name: '', gender: 'ស្រី', phone: '', occupation: 'លក់ត្រី' });
    setShowNewCustomerForm(false);
    triggerToast(`បានចុះឈ្មោះអតិថិជន ${added.name} ជោគជ័យ!`);
  };

  // Handle Disburse Loan
  const handleConfirmDisbursement = (e) => {
    e.preventDefault();
    if (!disburseForm.customerId) {
      triggerToast('សូមជ្រើសរើសអតិថិជនជាមុន!');
      return;
    }
    const cust = customers.find(c => c.id === parseInt(disburseForm.customerId, 10));
    if (!cust) return;

    const p = parseFloat(disburseForm.principal) || 0;
    const durationUnits = disburseForm.method === 'DAILY'
      ? parseInt(disburseForm.durationDays, 10)
      : parseInt(disburseForm.months, 10);
    const profit = disburseForm.method === 'DAILY' 
      ? parseFloat(disburseForm.profitAmount) 
      : Math.round(p * (parseFloat(disburseForm.interestRatePercent) / 100) * parseInt(disburseForm.months, 10));
    const total = p + profit;
    const installmentRepay = Math.round(total / durationUnits);

    const newLoan = {
      id: Date.now(),
      loanCode: `LN-202611-${String(loans.length + 1).padStart(3, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      phone: cust.phone,
      occupation: cust.occupation,
      principal: p,
      method: disburseForm.method,
      durationDays: durationUnits,
      profitAmount: profit,
      totalAmount: total,
      dailyRepayment: installmentRepay,
      startDate: disburseForm.startDate,
      dueDateNext: disburseForm.firstDueDate,
      dueAmountToday: installmentRepay,
      paidDays: 0,
      totalPaid: 0,
      status: 'ACTIVE',
      paidToday: false
    };

    setLoans([newLoan, ...loans]);
    setShowDisburseModal(false);
    setShowScheduleModal(newLoan);
    triggerToast(`បានទម្លាក់កម្ចីជូន ${cust.name} ជោគជ័យ!`);
  };

  // Open Payment Modal with default today's due amount
  const openPaymentModal = (loan) => {
    const remainingBalance = Math.max(0, loan.totalAmount - loan.totalPaid);
    const defaultAmt = Math.min(loan.dueAmountToday, remainingBalance);
    setShowPaymentModal(loan);
    setPaymentInputAmount(String(defaultAmt));
  };

  // Record payment action (supports daily payment, extra advance payment, and full early payoff)
  const handleRecordPayment = (loanId, customAmount) => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast('សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    let isFullPayoff = false;

    setLoans(loans.map(l => {
      if (l.id === loanId) {
        const remainingBalance = Math.max(0, l.totalAmount - l.totalPaid);
        const appliedAmount = Math.min(amount, remainingBalance);
        const newTotalPaid = l.totalPaid + appliedAmount;
        const newRemaining = Math.max(0, l.totalAmount - newTotalPaid);

        const calculatedDays = Math.min(
          l.durationDays,
          Math.max(l.paidDays + 1, Math.round(newTotalPaid / l.dailyRepayment))
        );

        const completed = newRemaining <= 0;
        if (completed) {
          isFullPayoff = true;
        }

        return {
          ...l,
          paidToday: true,
          paidDays: completed ? l.durationDays : calculatedDays,
          totalPaid: newTotalPaid,
          dueAmountToday: completed ? 0 : Math.min(l.dailyRepayment, newRemaining),
          status: completed ? 'COMPLETED' : 'ACTIVE'
        };
      }
      return l;
    }));

    setShowPaymentModal(null);
    setPaymentInputAmount('');
    if (isFullPayoff) {
      triggerToast('អតិថិជនបានបង់ផ្តាច់កម្ចីមុនកាលកំណត់រួចរាល់!');
    } else {
      triggerToast(`បានកត់ត្រាការទទួលប្រាក់ ${formatKHR(amount)} ជោគជ័យ!`);
    }
  };

  // Add Expense handler
  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    if (!newExpense.date || !newExpense.description.trim() || isNaN(amt) || amt <= 0) {
      triggerToast('សូមបំពេញព័ត៌មានចំណាយឱ្យបានត្រឹមត្រូវ!');
      return;
    }
    const createdExpense = {
      id: Date.now(),
      date: newExpense.date,
      description: newExpense.description.trim(),
      amount: amt
    };
    setExpenses([createdExpense, ...expenses]);
    setNewExpense({ ...newExpense, description: '', amount: '' });
    triggerToast('បានកត់ត្រាចំណាយថ្មីជោគជ័យ!');
  };

  // Delete Expense handler
  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(item => item.id !== id));
    triggerToast('បានលុបទិន្នន័យចំណាយរួចរាល់!');
  };

  // Metrics
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.totalAmount - l.totalPaid), 0);
  const totalDisbursedMonth = loans.reduce((sum, l) => sum + l.principal, 0);
  const collectedInterest = loans.reduce((sum, l) => {
    const profitRatio = l.profitAmount / l.totalAmount;
    return sum + (l.totalPaid * profitRatio);
  }, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfitLoss = collectedInterest - totalExpenses;

  const dueTodayLoans = activeLoans;
  const missedLoans = activeLoans.filter(l => !l.paidToday);

  return (
    <div
      style={{ fontFamily: "'Khmer OS Content', 'Content', sans-serif" }}
      className="min-h-screen bg-slate-900 text-slate-100 pb-20 antialiased khmer-content-root"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Content:wght@400;700&display=swap');

        .khmer-content-root,
        .khmer-content-root *,
        .khmer-content-root *::before,
        .khmer-content-root *::after,
        .khmer-content-root input,
        .khmer-content-root select,
        .khmer-content-root textarea,
        .khmer-content-root button,
        .khmer-content-root table,
        .khmer-content-root th,
        .khmer-content-root td,
        .khmer-content-root span,
        .khmer-content-root p,
        .khmer-content-root h1,
        .khmer-content-root h2,
        .khmer-content-root h3,
        .khmer-content-root h4,
        .khmer-content-root a,
        .khmer-content-root label {
          font-family: 'Khmer OS Content', 'Content', sans-serif !important;
        }

        @media print {
          body, body * {
            font-family: 'Khmer OS Content', 'Content', sans-serif !important;
          }
        }
      `}</style>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-xs border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-lg text-slate-950 shadow-md">
              ៛
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">គ្រប់គ្រងកម្ចីខ្នាតតូច</h1>
              <p className="text-[11px] text-emerald-400 font-medium">Daily Micro-Loan Manager KHR</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
              ថ្ងៃទី ០៦ វិច្ឆិកា ២០២៦
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* KPI Dashboard Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">អតិថិជនសកម្ម</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{activeLoans.length} នាក់</div>
            <div className="text-[11px] text-slate-400 mt-1">
              កំពុងជំពាក់: <span className="text-emerald-400 font-semibold">{formatKHR(totalOutstanding)}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">ទម្លាក់កម្ចីខែនេះ</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-bold text-teal-400">{loans.length} កម្ចី</div>
            <div className="text-[11px] text-slate-400 mt-1">
              សរុប: <span className="text-slate-200 font-semibold">{formatKHR(totalDisbursedMonth)}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">ចំណេញប្រមូលបាន</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400">{formatKHR(collectedInterest)}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              សុទ្ធ: <span className={netProfitLoss >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{formatKHR(netProfitLoss)}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">ត្រូវប្រមូលថ្ងៃនេះ</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-sky-400">
              {formatKHR(dueTodayLoans.reduce((sum, l) => sum + l.dueAmountToday, 0))}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ប្រមូលបាន: <span className="text-emerald-400 font-semibold">{dueTodayLoans.filter(l => l.paidToday).length}/{dueTodayLoans.length} នាក់</span>
            </div>
          </div>
        </section>

        {/* Action Buttons: Customer, Disbursement & Profit & Loss */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Customer Action Card */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center justify-between p-3.5 bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/30 text-white rounded-2xl shadow-sm hover:border-indigo-400 transition active:scale-[0.99] text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-200">Customer (អតិថិជន)</h3>
                <p className="text-[11px] text-slate-400">មើលបញ្ជី & ចុះឈ្មោះថ្មី (+)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
          </button>

          {/* 2. Disbursement Action Card */}
          <button
            onClick={() => {
              if (customers.length > 0 && !disburseForm.customerId) {
                setDisburseForm(prev => ({ ...prev, customerId: customers[0].id }));
              }
              setShowDisburseModal(true);
            }}
            className="flex items-center justify-between p-3.5 bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 text-white rounded-2xl shadow-sm hover:border-emerald-400 transition active:scale-[0.99] text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-200">Disbursement (ទម្លាក់កម្ចី)</h3>
                <p className="text-[11px] text-slate-400">ទម្លាក់កម្ចី & តារាងសង</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
          </button>

          {/* 3. Profit & Loss Action Card */}
          <button
            onClick={() => setShowPnLModal(true)}
            className="flex items-center justify-between p-3.5 bg-gradient-to-br from-amber-950/70 to-slate-900 border border-amber-500/30 text-white rounded-2xl shadow-sm hover:border-amber-400 transition active:scale-[0.99] text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-200">Profit & Loss</h3>
                <p className="text-[11px] text-slate-400">ចំណូលការប្រាក់ & ចំណាយ</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
          </button>
        </section>

        {/* Section Tabs: Due Today vs Missed */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-800 p-1.5 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('dueToday')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'dueToday'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ត្រូវបង់សងថ្ងៃនេះ ({dueTodayLoans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('missed')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'missed'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>មិនទាន់បង់ថ្ងៃនេះ ({missedLoans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('allLoans')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'allLoans'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>កម្ចីទាំងអស់ ({loans.length})</span>
            </button>
          </div>

          {/* List Display */}
          <div className="divide-y divide-slate-800/60 p-2">
            {(activeTab === 'dueToday' ? dueTodayLoans : activeTab === 'missed' ? missedLoans : loans).length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-200">គ្មានបញ្ជីត្រូវបង្ហាញទេ</p>
                <p className="text-xs text-slate-500">អតិថិជនទាំងអស់បានទូទាត់គ្រប់ចំនួនហើយ!</p>
              </div>
            ) : (
              (activeTab === 'dueToday' ? dueTodayLoans : activeTab === 'missed' ? missedLoans : loans).map((loan) => (
                <div key={loan.id} className="p-3 hover:bg-slate-900/60 rounded-xl transition flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{loan.customerName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {loan.occupation}
                      </span>
                      {loan.status === 'COMPLETED' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>បង់ផ្តាច់រួច</span>
                        </span>
                      ) : loan.paidToday ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>បានបង់</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>រង់ចាំ</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span className="text-emerald-400">{loan.loanCode}</span>
                      <span>•</span>
                      <span>
                        វដ្ត: {loan.paidDays}/{loan.durationDays} {loan.method === 'DAILY' ? 'ថ្ងៃ' : 'ខែ'}
                      </span>
                      <span>•</span>
                      <a href={`tel:${loan.phone}`} className="text-slate-300 hover:text-white flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{loan.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <div className="font-bold text-sm text-emerald-400">
                        {loan.status === 'COMPLETED' ? '០ ៛' : formatKHR(loan.dueAmountToday)}
                      </div>
                      <button
                        onClick={() => setShowScheduleModal(loan)}
                        className="text-[11px] text-sky-400 hover:underline font-medium"
                      >
                        មើលតារាងសង
                      </button>
                    </div>

                    {loan.status !== 'COMPLETED' && !loan.paidToday ? (
                      <button
                        onClick={() => openPaymentModal(loan)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
                      >
                        កត់ត្រាបង់
                      </button>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* MODAL 1: CUSTOMER LIST & REGISTRATION */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-base">គ្រប់គ្រងអតិថិជន (Customers)</h2>
              </div>
              <button 
                onClick={() => { setShowCustomerModal(false); setShowNewCustomerForm(false); }}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {!showNewCustomerForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">អតិថិជនសរុប {customers.length} នាក់</span>
                    <button
                      onClick={() => setShowNewCustomerForm(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>បង្កើតអតិថិជនថ្មី (+)</span>
                    </button>
                  </div>

                  {/* Customer list */}
                  <div className="space-y-2">
                    {customers.map((c) => (
                      <div key={c.id} className="p-3 border border-slate-800 rounded-xl bg-slate-950 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100 text-sm">{c.name}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">{c.gender}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">{c.occupation}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span className="text-slate-500">{c.code}</span>
                            <span>•</span>
                            <span>{c.phone}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setDisburseForm(prev => ({ ...prev, customerId: c.id }));
                            setShowCustomerModal(false);
                            setShowDisburseModal(true);
                          }}
                          className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 font-bold rounded-lg text-slate-300"
                        >
                          ទម្លាក់កម្ចី
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Registration Form */
                <form onSubmit={handleCreateCustomer} className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="font-bold text-sm text-slate-100">ចុះឈ្មោះអតិថិជនថ្មី (+)</h3>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerForm(false)}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      ត្រឡប់ក្រោយ
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">ឈ្មោះអ្នកខ្ចី (Full Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. សុខ ចាន់ណា"
                      value={newCust.name}
                      onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">ភេទ *</label>
                      <select
                        value={newCust.gender}
                        onChange={(e) => setNewCust({ ...newCust, gender: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white"
                      >
                        <option value="ស្រី">ស្រី</option>
                        <option value="ប្រុស">ប្រុស</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">លេខទូរស័ព្ទ *</label>
                      <input
                        type="text"
                        required
                        placeholder="012 xxx xxx"
                        value={newCust.phone}
                        onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">មុខរបរ (Drop List) *</label>
                    <select
                      value={newCust.occupation}
                      onChange={(e) => setNewCust({ ...newCust, occupation: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none text-white"
                    >
                      {OCCUPATION_OPTIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerForm(false)}
                      className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                    >
                      បោះបង់
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 shadow-sm"
                    >
                      រក្សាទុកអតិថិជន
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISBURSEMENT & SCHEDULE GENERATOR */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">ទម្លាក់កម្ចី & បង្កើតតារាងសងប្រាក់</h2>
              </div>
              <button 
                onClick={() => setShowDisburseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleConfirmDisbursement} className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ជ្រើសរើសអតិថិជន (Drop List) *</label>
                <select
                  value={disburseForm.customerId}
                  onChange={(e) => setDisburseForm({ ...disburseForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-white font-medium"
                  required
                >
                  <option value="">-- សូមជ្រើសរើសអតិថិជន --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.occupation}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Principal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ចំនួនកម្ចីស្នើសុំ (ប្រាក់ដើមជា KHR) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    value={disburseForm.principal}
                    onChange={(e) => setDisburseForm({ ...disburseForm, principal: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 text-base font-bold bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-emerald-400"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">៛ KHR</span>
                </div>
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto">
                  {[200000, 400000, 600000, 800000, 1000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDisburseForm({ ...disburseForm, principal: amt })}
                      className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium whitespace-nowrap border border-slate-700"
                    >
                      {formatKHR(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repayment Method Switch: Daily vs Monthly */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">វិធីសាស្ត្របង់សង *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisburseForm({ ...disburseForm, method: 'DAILY' })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition ${
                      disburseForm.method === 'DAILY'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>បង់ជាថ្ងៃ (២១ ឬ ២២ ថ្ងៃ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisburseForm({ ...disburseForm, method: 'MONTHLY' })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition ${
                      disburseForm.method === 'MONTHLY'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>បង់ជាខែ (Flat Rate)</span>
                  </button>
                </div>
              </div>

              {/* Daily Mode Configuration */}
              {disburseForm.method === 'DAILY' ? (
                <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">រយៈពេល (Drop List) *</label>
                      <select
                        value={disburseForm.durationDays}
                        onChange={(e) => setDisburseForm({ ...disburseForm, durationDays: parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-900 border border-slate-700 rounded-xl text-white"
                      >
                        <option value={21}>២១ ថ្ងៃ</option>
                        <option value={22}>២២ ថ្ងៃ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">លទ្ធភាពចំណេញ (Drop List) *</label>
                      <select
                        value={disburseForm.profitAmount}
                        onChange={(e) => setDisburseForm({ ...disburseForm, profitAmount: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-900 border border-slate-700 rounded-xl text-amber-400"
                      >
                        {DAILY_PROFIT_TIERS.map((tier) => (
                          <option key={tier.value} value={tier.value}>{tier.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">ថ្ងៃខែឆ្នាំខ្ចី</label>
                      <input
                        type="date"
                        value={disburseForm.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">ថ្ងៃចាប់ផ្តើមសង (បន្ទាប់ពីខ្ចី ១ ថ្ងៃ)</label>
                      <input
                        type="date"
                        value={disburseForm.firstDueDate}
                        onChange={(e) => setDisburseForm({ ...disburseForm, firstDueDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">សរុបដើម + ចំណេញ:</span>
                      <span className="font-bold ml-1 text-slate-100">
                        {formatKHR(parseFloat(disburseForm.principal || 0) + parseFloat(disburseForm.profitAmount || 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ត្រូវសងប្រចាំថ្ងៃ:</span>
                      <span className="font-bold text-emerald-400 ml-1">
                        {formatKHR(Math.round((parseFloat(disburseForm.principal || 0) + parseFloat(disburseForm.profitAmount || 0)) / disburseForm.durationDays))} /ថ្ងៃ
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Monthly Mode Configuration */
                <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">ចំនួនខែត្រូវសង (ខែ) *</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={disburseForm.months}
                        onChange={(e) => setDisburseForm({ ...disburseForm, months: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">ការប្រាក់ប្រចាំខែ (% Flat) *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={disburseForm.interestRatePercent}
                        onChange={(e) => setDisburseForm({ ...disburseForm, interestRatePercent: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-900 border border-slate-700 rounded-xl text-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">ថ្ងៃខ្ចីប្រាក់</label>
                      <input
                        type="date"
                        value={disburseForm.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">ថ្ងៃសងលើកទី១ (+១ ខែ)</label>
                      <input
                        type="date"
                        value={disburseForm.firstDueDate}
                        onChange={(e) => setDisburseForm({ ...disburseForm, firstDueDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs flex justify-between">
                    <div>
                      <span className="text-slate-400">ដើម/ខែ:</span>
                      <span className="font-bold ml-1 text-slate-100">
                        {formatKHR(disburseForm.principal / disburseForm.months)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ការប្រាក់/ខែ:</span>
                      <span className="font-bold text-amber-400 ml-1">
                        {formatKHR(disburseForm.principal * (disburseForm.interestRatePercent / 100))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MANDATORY LIVE REPAYMENT SCHEDULE PREVIEW */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>តារាងកាលវិភាគសងប្រាក់លម្អិត (Schedule Preview)</span>
                  </h4>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                    សរុប {previewSchedule.length} ដំណាក់កាល
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-2 font-semibold">លើក</th>
                        <th className="p-2 font-semibold">កាលបរិច្ឆេទ</th>
                        <th className="p-2 font-semibold">ប្រាក់ដើម</th>
                        <th className="p-2 font-semibold">ចំណេញ/ការប្រាក់</th>
                        <th className="p-2 font-semibold">ត្រូវសង</th>
                        <th className="p-2 font-semibold">សមតុល្យនៅសល់</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {previewSchedule.map((row) => (
                        <tr key={row.num} className="hover:bg-slate-800/40">
                          <td className="p-2 font-medium text-slate-300">{row.num}</td>
                          <td className="p-2 text-slate-400">{row.date}</td>
                          <td className="p-2 text-slate-200">{formatKHR(row.principal)}</td>
                          <td className="p-2 text-emerald-400">+{formatKHR(row.interest)}</td>
                          <td className="p-2 font-bold text-white">{formatKHR(row.total)}</td>
                          <td className="p-2 text-slate-500">{formatKHR(row.remaining)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black hover:bg-emerald-400 shadow-sm flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>បញ្ជាក់ការទម្លាក់កម្ចី</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW OFFICIAL REPAYMENT SCHEDULE */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <div>
                <h3 className="font-bold text-sm">កាលវិភាគសងប្រាក់ផ្លូវការ</h3>
                <p className="text-xs text-slate-400">
                  {showScheduleModal.customerName} ({showScheduleModal.loanCode})
                </p>
              </div>
              <button 
                onClick={() => setShowScheduleModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Loan Overview Banner */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">ប្រាក់ដើមសរុប</span>
                  <span className="font-bold text-slate-200">{formatKHR(showScheduleModal.principal)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ប្រាក់ចំណេញ/ការប្រាក់</span>
                  <span className="font-bold text-emerald-400">+{formatKHR(showScheduleModal.profitAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ត្រូវសងក្នុងមួយថ្ងៃ</span>
                  <span className="font-bold text-sky-400">{formatKHR(showScheduleModal.dailyRepayment)}</span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 font-semibold">លើក</th>
                      <th className="p-2.5 font-semibold">កាលបរិច្ឆេទ</th>
                      <th className="p-2.5 font-semibold">ត្រូវសង</th>
                      <th className="p-2.5 font-semibold">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {Array.from({ length: showScheduleModal.durationDays }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const isPaid = dayNum <= showScheduleModal.paidDays;
                      return (
                        <tr key={dayNum} className={isPaid ? 'bg-emerald-500/10' : ''}>
                          <td className="p-2.5 font-bold text-slate-300">{dayNum}</td>
                          <td className="p-2.5 text-slate-400">
                            ថ្ងៃទី {dayNum} (បន្ទាប់ពីបញ្ចេញ)
                          </td>
                          <td className="p-2.5 font-bold text-emerald-400">
                            {formatKHR(showScheduleModal.dailyRepayment)}
                          </td>
                          <td className="p-2.5">
                            {isPaid ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                បង់រួច
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                រង់ចាំ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Print Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>បោះពុម្ពកាលវិភាគ (Print Schedule)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD PAYMENT */}
      {showPaymentModal && (() => {
        const remainingBalance = Math.max(0, showPaymentModal.totalAmount - showPaymentModal.totalPaid);
        const enteredNum = parseFloat(paymentInputAmount) || 0;
        const isPayoff = enteredNum >= remainingBalance && remainingBalance > 0;
        const afterBalance = Math.max(0, remainingBalance - enteredNum);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-slate-100">កត់ត្រាការទទួលប្រាក់សង</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(null);
                    setPaymentInputAmount('');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">អតិថិជន:</span>
                  <span className="font-bold text-slate-100">{showPaymentModal.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">មុខរបរ:</span>
                  <span className="text-emerald-400">{showPaymentModal.occupation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ទឹកប្រាក់ត្រូវបង់ថ្ងៃនេះ:</span>
                  <span className="font-semibold text-slate-200">{formatKHR(showPaymentModal.dueAmountToday)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">សមតុល្យជំពាក់សរុបនៅសល់:</span>
                  <span className="font-bold text-amber-400">{formatKHR(remainingBalance)}</span>
                </div>
              </div>

              {/* Editable Payment Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    ចំនួនទឹកប្រាក់ទទួលបានជាក់ស្តែង (៛)
                  </label>
                  {isPayoff && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      បង់ផ្តាច់មុនកាលកំណត់
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={paymentInputAmount}
                    onChange={(e) => setPaymentInputAmount(e.target.value)}
                    placeholder="បញ្ចូលទឹកប្រាក់..."
                    className="w-full pl-3 pr-12 py-2.5 text-base font-bold bg-slate-950 border border-emerald-500/50 rounded-xl focus:border-emerald-400 focus:outline-none text-emerald-400"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">៛ KHR</span>
                </div>

                {/* Quick Fill Buttons: Daily Due vs Full Early Payoff */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPaymentInputAmount(String(Math.min(showPaymentModal.dueAmountToday, remainingBalance)))}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition"
                  >
                    បង់ថ្ងៃនេះ ({formatKHR(Math.min(showPaymentModal.dueAmountToday, remainingBalance))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentInputAmount(String(remainingBalance))}
                    className="py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 transition"
                  >
                    បង់ផ្តាច់ ({formatKHR(remainingBalance)})
                  </button>
                </div>

                {/* Remaining Balance Preview after this payment */}
                <div className="flex justify-between items-center text-[11px] px-1 pt-1 text-slate-400">
                  <span>សមតុល្យនៅសល់បន្ទាប់ពីបង់:</span>
                  <span className={afterBalance === 0 ? 'text-emerald-400 font-bold' : 'text-slate-200 font-semibold'}>
                    {afterBalance === 0 ? '០ ៛ (បញ្ចប់កម្ចី)' : formatKHR(afterBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleRecordPayment(showPaymentModal.id, paymentInputAmount)}
                  disabled={enteredNum <= 0}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-xl shadow transition"
                >
                  {isPayoff
                    ? `បញ្ជាក់ការបង់ផ្តាច់ (${formatKHR(Math.min(enteredNum, remainingBalance))})`
                    : `បញ្ជាក់ការទទួលប្រាក់ (${formatKHR(enteredNum)})`}
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(null);
                    setPaymentInputAmount('');
                  }}
                  className="w-full py-2 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-700"
                >
                  បោះបង់
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 5: PROFIT & LOSS (ចំណេញ និង ខាត) */}
      {showPnLModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base">របាយការណ៍ចំណេញ និង ខាត (Profit & Loss)</h2>
              </div>
              <button
                onClick={() => setShowPnLModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* P&L Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
                  <span className="text-[11px] text-slate-400 block">ចំណូលពីការប្រាក់សរុប</span>
                  <span className="font-bold text-base text-emerald-400 mt-0.5 block">
                    +{formatKHR(collectedInterest)}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-rose-500/30">
                  <span className="text-[11px] text-slate-400 block">ចំណាយប្រតិបត្តិការសរុប</span>
                  <span className="font-bold text-base text-rose-400 mt-0.5 block">
                    -{formatKHR(totalExpenses)}
                  </span>
                </div>

                <div className={`p-3 bg-slate-950 rounded-xl border ${netProfitLoss >= 0 ? 'border-emerald-400/50' : 'border-rose-500/50'}`}>
                  <span className="text-[11px] text-slate-400 block">
                    {netProfitLoss >= 0 ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'ខាតសុទ្ធ (Net Loss)'}
                  </span>
                  <span className={`font-black text-base mt-0.5 block ${netProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netProfitLoss >= 0 ? `+${formatKHR(netProfitLoss)}` : formatKHR(netProfitLoss)}
                  </span>
                </div>
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>បញ្ចូលការចំណាយថ្មី (Add Expense)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">ថ្ងៃខែឆ្នាំចំណាយ *</label>
                    <input
                      type="date"
                      required
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">ចំនួនទឹកប្រាក់ចំណាយ (៛) *</label>
                    <input
                      type="number"
                      step="100"
                      required
                      placeholder="ឧ. 15000"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-900 border border-slate-700 rounded-xl text-rose-400 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">បរិយាយប្រភេទចំណាយ *</label>
                    <input
                      type="text"
                      required
                      placeholder="វាយបញ្ចូលប្រភេទចំណាយ..."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-sm flex items-center space-x-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>រក្សាទុកការចំណាយ</span>
                  </button>
                </div>
              </form>

              {/* Expense History List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-200">ប្រវត្តិចំណាយដែលបានកត់ត្រា ({expenses.length})</h4>
                  <span className="text-[11px] text-rose-400 font-semibold">សរុប: {formatKHR(totalExpenses)}</span>
                </div>

                {expenses.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    មិនទាន់មានទិន្នន័យចំណាយនៅឡើយទេ
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5 font-semibold">ថ្ងៃខែឆ្នាំ</th>
                          <th className="p-2.5 font-semibold">បរិយាយប្រភេទចំណាយ</th>
                          <th className="p-2.5 font-semibold text-right">ទឹកប្រាក់ (៛)</th>
                          <th className="p-2.5 font-semibold text-center w-12">លុប</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 text-slate-400 whitespace-nowrap">{exp.date}</td>
                            <td className="p-2.5 text-slate-200">{exp.description}</td>
                            <td className="p-2.5 font-bold text-rose-400 text-right whitespace-nowrap">
                              -{formatKHR(exp.amount)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition"
                                title="លុបចំណាយ"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}