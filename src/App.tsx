import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Receipt,
} from 'lucide-react';
import { Customer, Expense, Loan, LoanMethod } from './types/index.ts';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';

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
  'ផ្សេងៗ',
];

const DAILY_PROFIT_TIERS = [
  { label: '២០,០០០ ៛', value: 20000 },
  { label: '២៥,០០០ ៛', value: 25000 },
  { label: '៣០,០០០ ៛', value: 30000 },
  { label: '៣៥,០០០ ៛', value: 35000 },
  { label: '៤០,០០០ ៛', value: 40000 },
  { label: '៥០,០០០ ៛', value: 50000 },
];

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

function toKhmerDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)]);
}

function formatKhmerHeaderDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
  const day = parts[2].padStart(2, '0');
  return `ថ្ងៃទី ${toKhmerDigits(day)} ${KHMER_MONTHS[monthIdx]} ${toKhmerDigits(year)}`;
}

function getLocalTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeNextDueDate(startDate: string, method: LoanMethod): string {
  const baseDate = new Date(`${startDate}T00:00:00`);
  if (isNaN(baseDate.getTime())) return startDate;
  if (method === 'DAILY') {
    baseDate.setDate(baseDate.getDate() + 1);
  } else {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }
  return baseDate.toISOString().split('T')[0];
}

export default function App() {
  const initialToday = getLocalTodayISO();

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'dueToday' | 'missed' | 'allLoans'>('dueToday');

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState<Loan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Loan | null>(null);
  const [paymentInputAmount, setPaymentInputAmount] = useState('');
  const [showPnLModal, setShowPnLModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loading / Submitting states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayDate, setTodayDate] = useState(initialToday);

  // Core SQLite-backed State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Form State: New Customer
  const [newCust, setNewCust] = useState({
    name: '',
    gender: 'ស្រី',
    phone: '',
    occupation: 'លក់ត្រី',
  });

  // Form State: New Expense
  const [newExpense, setNewExpense] = useState({
    date: initialToday,
    description: '',
    amount: '',
  });

  // Form State: Disbursement
  const [disburseForm, setDisburseForm] = useState<{
    customerId: string;
    principal: string | number;
    method: LoanMethod;
    durationDays: number;
    profitAmount: number;
    startDate: string;
    firstDueDate: string;
    months: string | number;
    interestRatePercent: string | number;
  }>({
    customerId: '',
    principal: 500000,
    method: 'DAILY',
    durationDays: 22,
    profitAmount: 30000,
    startDate: initialToday,
    firstDueDate: computeNextDueDate(initialToday, 'DAILY'),
    months: 3,
    interestRatePercent: 3.5,
  });

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Load persisted data from SQLite backend
  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();
      setCustomers(data.customers || []);
      setLoans(data.loans || []);
      setExpenses(data.expenses || []);
      if (data.today) {
        setTodayDate(data.today);
        setNewExpense((prev) => ({ ...prev, date: prev.date || data.today }));
        setDisburseForm((prev) => ({
          ...prev,
          startDate: data.today,
          firstDueDate: computeNextDueDate(data.today, prev.method),
        }));
      }
    } catch (err) {
      console.error('Error loading SQLite data:', err);
      triggerToast('មិនអាចទាញទិន្នន័យពីមូលដ្ឋានទិន្នន័យបានទេ!');
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper: Format Currency in KHR
  const formatKHR = (amount: number | string | undefined | null) => {
    return new Intl.NumberFormat('km-KH').format(Math.round(Number(amount) || 0)) + ' ៛';
  };

  // Auto-update firstDueDate when startDate or method changes
  const handleStartDateChange = (newStartDate: string) => {
    setDisburseForm((prev) => ({
      ...prev,
      startDate: newStartDate,
      firstDueDate: computeNextDueDate(newStartDate, prev.method),
    }));
  };

  const handleMethodChange = (method: LoanMethod) => {
    setDisburseForm((prev) => ({
      ...prev,
      method,
      firstDueDate: computeNextDueDate(prev.startDate, method),
    }));
  };

  // Preview schedule calculation for Disbursement Modal
  const previewSchedule = useMemo(() => {
    const list: Array<{
      num: number;
      date: string;
      principal: number;
      interest: number;
      total: number;
      remaining: number;
    }> = [];
    const p = parseFloat(String(disburseForm.principal)) || 0;
    const baseFirst = new Date(`${disburseForm.firstDueDate || disburseForm.startDate || todayDate}T00:00:00`);

    if (disburseForm.method === 'DAILY') {
      const n = parseInt(String(disburseForm.durationDays), 10) || 22;
      const profit = parseFloat(String(disburseForm.profitAmount)) || 0;
      const total = p + profit;
      const dailyTotal = Math.round(total / n);
      const dailyPrincipal = Math.round(p / n);
      const dailyProfit = Math.round(profit / n);

      let remPrincipal = p;

      for (let i = 1; i <= n; i++) {
        const curDate = new Date(baseFirst);
        curDate.setDate(curDate.getDate() + (i - 1));
        const thisPrincipal = i === n ? remPrincipal : dailyPrincipal;
        remPrincipal -= thisPrincipal;

        list.push({
          num: i,
          date: !isNaN(curDate.getTime()) ? curDate.toISOString().split('T')[0] : '',
          principal: thisPrincipal,
          interest: dailyProfit,
          total: i === n ? thisPrincipal + dailyProfit : dailyTotal,
          remaining: Math.max(0, remPrincipal),
        });
      }
    } else {
      const m = Math.max(1, parseInt(String(disburseForm.months), 10) || 3);
      const rate = parseFloat(String(disburseForm.interestRatePercent)) || 0;
      const monthlyPrincipal = Math.round(p / m);
      const monthlyInterest = Math.round(p * (rate / 100));

      let remPrincipal = p;

      for (let i = 1; i <= m; i++) {
        const curDate = new Date(baseFirst);
        curDate.setMonth(curDate.getMonth() + (i - 1));
        const thisPrincipal = i === m ? remPrincipal : monthlyPrincipal;
        remPrincipal -= thisPrincipal;

        list.push({
          num: i,
          date: !isNaN(curDate.getTime()) ? curDate.toISOString().split('T')[0] : '',
          principal: thisPrincipal,
          interest: monthlyInterest,
          total: thisPrincipal + monthlyInterest,
          remaining: Math.max(0, remPrincipal),
        });
      }
    }
    return list;
  }, [disburseForm, todayDate]);

  // Handle Add Customer -> Persist to SQLite
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.phone.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCust),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');

      setCustomers((prev) => [...prev, data]);
      setNewCust({ name: '', gender: 'ស្រី', phone: '', occupation: 'លក់ត្រី' });
      setShowNewCustomerForm(false);
      triggerToast(`បានចុះឈ្មោះអតិថិជន ${data.name} ជោគជ័យ!`);
    } catch (err: any) {
      triggerToast(err.message || 'មិនអាចរក្សាទុកអតិថិជនបានទេ!');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Disburse Loan -> Persist to SQLite
  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseForm.customerId) {
      triggerToast('សូមជ្រើសរើសអតិថិជនជាមុន!');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: parseInt(String(disburseForm.customerId), 10),
          principal: parseFloat(String(disburseForm.principal)) || 0,
          method: disburseForm.method,
          durationDays: disburseForm.durationDays,
          profitAmount: disburseForm.profitAmount,
          startDate: disburseForm.startDate,
          firstDueDate: disburseForm.firstDueDate,
          months: parseInt(String(disburseForm.months), 10) || 3,
          interestRatePercent: parseFloat(String(disburseForm.interestRatePercent)) || 0,
        }),
      });
      const createdLoan: Loan & { error?: string } = await res.json();
      if (!res.ok) throw new Error(createdLoan.error || 'Failed to disburse loan');

      setLoans((prev) => [createdLoan, ...prev]);
      setShowDisburseModal(false);
      setShowScheduleModal(createdLoan);
      triggerToast(`បានទម្លាក់កម្ចីជូន ${createdLoan.customerName} ជោគជ័យ!`);
    } catch (err: any) {
      triggerToast(err.message || 'មិនអាចទម្លាក់កម្ចីបានទេ!');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Payment Modal with default today's due amount
  const openPaymentModal = (loan: Loan) => {
    const remainingBalance = Math.max(0, loan.totalAmount - loan.totalPaid);
    const defaultAmt = Math.min(loan.dueAmountToday, remainingBalance);
    setShowPaymentModal(loan);
    setPaymentInputAmount(String(defaultAmt));
  };

  // Record payment action -> Persist to SQLite
  const handleRecordPayment = async (loanId: number, customAmount: string) => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast('សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setLoans((prev) => prev.map((l) => (l.id === loanId ? data.loan : l)));
      setShowPaymentModal(null);
      setPaymentInputAmount('');

      if (data.isFullPayoff) {
        triggerToast('អតិថិជនបានបង់ផ្តាច់កម្ចីមុនកាលកំណត់រួចរាល់!');
      } else {
        triggerToast(`បានកត់ត្រាការទទួលប្រាក់ ${formatKHR(data.appliedAmount)} ជោគជ័យ!`);
      }
    } catch (err: any) {
      triggerToast(err.message || 'មិនអាចកត់ត្រាការទទួលប្រាក់បានទេ!');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Expense handler -> Persist to SQLite
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    if (!newExpense.date || !newExpense.description.trim() || isNaN(amt) || amt <= 0) {
      triggerToast('សូមបំពេញព័ត៌មានចំណាយឱ្យបានត្រឹមត្រូវ!');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newExpense.date,
          description: newExpense.description.trim(),
          amount: amt,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Failed to add expense');

      setExpenses((prev) => [created, ...prev]);
      setNewExpense((prev) => ({ ...prev, description: '', amount: '' }));
      triggerToast('បានកត់ត្រាចំណាយថ្មីជោគជ័យ!');
    } catch (err: any) {
      triggerToast(err.message || 'មិនអាចកត់ត្រាចំណាយបានទេ!');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense handler -> Persist to SQLite
  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      triggerToast('បានលុបទិន្នន័យចំណាយរួចរាល់!');
    } catch {
      triggerToast('មិនអាចលុបទិន្នន័យចំណាយបានទេ!');
    }
  };

  // Metrics
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + Math.max(0, l.totalAmount - l.totalPaid), 0);
  const totalDisbursedMonth = loans.reduce((sum, l) => sum + l.principal, 0);
  const collectedInterest = loans.reduce((sum, l) => {
    const profitRatio = l.totalAmount > 0 ? l.profitAmount / l.totalAmount : 0;
    return sum + l.totalPaid * profitRatio;
  }, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfitLoss = collectedInterest - totalExpenses;

  const dueTodayLoans = activeLoans;
  const missedLoans = activeLoans.filter((l) => !l.paidToday);
  const displayedLoans =
    activeTab === 'dueToday' ? dueTodayLoans : activeTab === 'missed' ? missedLoans : loans;

  const safeMonths = Math.max(1, parseInt(String(disburseForm.months), 10) || 1);
  const safePrincipal = parseFloat(String(disburseForm.principal)) || 0;
  const safeRate = parseFloat(String(disburseForm.interestRatePercent)) || 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 antialiased khmer-content-root">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-xs border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-lg text-slate-950 shadow-md shrink-0">
              ៛
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">គ្រប់គ្រងកម្ចីខ្នាតតូច</h1>
              <p className="text-[11px] text-emerald-400 font-medium">Daily Micro-Loan Manager KHR</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PWAInstallButton lang="km" />
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 whitespace-nowrap">
              {formatKhmerHeaderDate(todayDate)}
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
              សុទ្ធ:{' '}
              <span className={netProfitLoss >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {formatKHR(netProfitLoss)}
              </span>
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
              ប្រមូលបាន:{' '}
              <span className="text-emerald-400 font-semibold">
                {dueTodayLoans.filter((l) => l.paidToday).length}/{dueTodayLoans.length} នាក់
              </span>
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
                setDisburseForm((prev) => ({ ...prev, customerId: String(customers[0].id) }));
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

        {/* Section Tabs: Due Today vs Missed vs All Loans */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-800 p-1.5 bg-slate-900/50 gap-1">
            <button
              onClick={() => setActiveTab('dueToday')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'dueToday'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
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
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>កម្ចីទាំងអស់ ({loans.length})</span>
            </button>
          </div>

          {/* List Display */}
          <div className="divide-y divide-slate-800/60 p-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                កំពុងផ្ទុកទិន្នន័យ...
              </div>
            ) : displayedLoans.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-200">គ្មានបញ្ជីត្រូវបង្ហាញទេ</p>
                <p className="text-xs text-slate-500">អតិថិជនទាំងអស់បានទូទាត់គ្រប់ចំនួនហើយ!</p>
              </div>
            ) : (
              displayedLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-3 hover:bg-slate-900/60 rounded-xl transition flex items-center justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
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

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                      <span className="text-emerald-400">{loan.loanCode}</span>
                      <span>•</span>
                      <span>
                        វដ្ត: {loan.paidDays}/{loan.durationDays} {loan.method === 'DAILY' ? 'ថ្ងៃ' : 'ខែ'}
                      </span>
                      <span>•</span>
                      <a
                        href={`tel:${loan.phone.replace(/\s+/g, '')}`}
                        className="text-slate-300 hover:text-white flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{loan.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="text-right flex items-center space-x-2 shrink-0">
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
                onClick={() => {
                  setShowCustomerModal(false);
                  setShowNewCustomerForm(false);
                }}
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
                      <div
                        key={c.id}
                        className="p-3 border border-slate-800 rounded-xl bg-slate-950 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-100 text-sm">{c.name}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">
                              {c.gender}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
                              {c.occupation}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span className="text-slate-500">{c.code}</span>
                            <span>•</span>
                            <span>{c.phone}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setDisburseForm((prev) => ({ ...prev, customerId: String(c.id) }));
                            setShowCustomerModal(false);
                            setShowDisburseModal(true);
                          }}
                          className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 font-bold rounded-lg text-slate-300 shrink-0"
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
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
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
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 shadow-sm"
                    >
                      {submitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកអតិថិជន'}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ចំនួនកម្ចីស្នើសុំ (ប្រាក់ដើមជា KHR) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    value={disburseForm.principal}
                    onChange={(e) => setDisburseForm({ ...disburseForm, principal: e.target.value })}
                    className="w-full pl-3 pr-14 py-2 text-base font-bold bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-emerald-400"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">៛ KHR</span>
                </div>
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1">
                  {[200000, 400000, 600000, 800000, 1000000].map((amt) => (
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
                    onClick={() => handleMethodChange('DAILY')}
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
                    onClick={() => handleMethodChange('MONTHLY')}
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
                        onChange={(e) =>
                          setDisburseForm({ ...disburseForm, durationDays: parseInt(e.target.value, 10) })
                        }
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
                        onChange={(e) =>
                          setDisburseForm({ ...disburseForm, profitAmount: parseFloat(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs font-bold bg-slate-900 border border-slate-700 rounded-xl text-amber-400"
                      >
                        {DAILY_PROFIT_TIERS.map((tier) => (
                          <option key={tier.value} value={tier.value}>
                            {tier.label}
                          </option>
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
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        ថ្ងៃចាប់ផ្តើមសង (បន្ទាប់ពីខ្ចី ១ ថ្ងៃ)
                      </label>
                      <input
                        type="date"
                        value={disburseForm.firstDueDate}
                        onChange={(e) => setDisburseForm({ ...disburseForm, firstDueDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                      />
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">សរុបដើម + ចំណេញ:</span>
                      <span className="font-bold ml-1 text-slate-100">
                        {formatKHR(safePrincipal + disburseForm.profitAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ត្រូវសងប្រចាំថ្ងៃ:</span>
                      <span className="font-bold text-emerald-400 ml-1">
                        {formatKHR(Math.round((safePrincipal + disburseForm.profitAmount) / disburseForm.durationDays))}{' '}
                        /ថ្ងៃ
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
                      <span className="font-bold ml-1 text-slate-100">{formatKHR(safePrincipal / safeMonths)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">ការប្រាក់/ខែ:</span>
                      <span className="font-bold text-amber-400 ml-1">
                        {formatKHR(safePrincipal * (safeRate / 100))}
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
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black hover:bg-emerald-400 disabled:opacity-50 shadow-sm flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{submitting ? 'កំពុងបញ្ចេញកម្ចី...' : 'បញ្ជាក់ការទម្លាក់កម្ចី'}</span>
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
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white no-print">
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

            <div id="schedule-print-area" className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="hidden print:block text-center pb-2 border-b border-slate-300">
                <h2 className="font-bold text-base">កាលវិភាគសងប្រាក់ផ្លូវការ</h2>
                <p className="text-xs">
                  អតិថិជន: {showScheduleModal.customerName} • {showScheduleModal.loanCode} • {showScheduleModal.phone}
                </p>
              </div>

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
                  <span className="text-slate-500 block text-[10px]">
                    {showScheduleModal.method === 'DAILY' ? 'ត្រូវសងក្នុងមួយថ្ងៃ' : 'ត្រូវសងក្នុងមួយខែ'}
                  </span>
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
                      <th className="p-2.5 font-semibold">សមតុល្យដើម</th>
                      <th className="p-2.5 font-semibold">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(showScheduleModal.schedules && showScheduleModal.schedules.length > 0
                      ? showScheduleModal.schedules
                      : Array.from({ length: showScheduleModal.durationDays }).map((_, idx) => ({
                          num: idx + 1,
                          date: `${showScheduleModal.method === 'DAILY' ? 'ថ្ងៃទី' : 'ខែទី'} ${idx + 1}`,
                          total: showScheduleModal.dailyRepayment,
                          remaining: Math.max(
                            0,
                            showScheduleModal.principal -
                              Math.round((showScheduleModal.principal / showScheduleModal.durationDays) * (idx + 1))
                          ),
                          status: idx + 1 <= showScheduleModal.paidDays ? 'PAID' : 'PENDING',
                        }))
                    ).map((item) => {
                      const isPaid = item.status === 'PAID' || item.num <= showScheduleModal.paidDays;
                      return (
                        <tr key={item.num} className={isPaid ? 'bg-emerald-500/10' : ''}>
                          <td className="p-2.5 font-bold text-slate-300">{item.num}</td>
                          <td className="p-2.5 text-slate-400">{item.date}</td>
                          <td className="p-2.5 font-bold text-emerald-400">{formatKHR(item.total)}</td>
                          <td className="p-2.5 text-slate-400">{formatKHR(item.remaining)}</td>
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
              <div className="flex justify-end pt-2 no-print">
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
      {showPaymentModal &&
        (() => {
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
                    <label className="text-xs font-semibold text-slate-300">ចំនួនទឹកប្រាក់ទទួលបានជាក់ស្តែង (៛)</label>
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
                      className="w-full pl-3 pr-14 py-2.5 text-base font-bold bg-slate-950 border border-emerald-500/50 rounded-xl focus:border-emerald-400 focus:outline-none text-emerald-400"
                    />
                    <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">៛ KHR</span>
                  </div>

                  {/* Quick Fill Buttons: Daily Due vs Full Early Payoff */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentInputAmount(String(Math.min(showPaymentModal.dueAmountToday, remainingBalance)))
                      }
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
                    disabled={enteredNum <= 0 || submitting}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-xl shadow transition"
                  >
                    {submitting
                      ? 'កំពុងកត់ត្រា...'
                      : isPayoff
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
                  <span className="font-bold text-base text-rose-400 mt-0.5 block">-{formatKHR(totalExpenses)}</span>
                </div>

                <div
                  className={`p-3 bg-slate-950 rounded-xl border ${
                    netProfitLoss >= 0 ? 'border-emerald-400/50' : 'border-rose-500/50'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 block">
                    {netProfitLoss >= 0 ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'ខាតសុទ្ធ (Net Loss)'}
                  </span>
                  <span
                    className={`font-black text-base mt-0.5 block ${
                      netProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {netProfitLoss >= 0 ? `+${formatKHR(netProfitLoss)}` : formatKHR(netProfitLoss)}
                  </span>
                </div>
              </div>

              {/* Add Expense Form */}
              <form
                onSubmit={handleAddExpense}
                className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3"
              >
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
                    disabled={submitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl shadow-sm flex items-center space-x-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{submitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការចំណាយ'}</span>
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

      <OfflineIndicator lang="km" />
    </div>
  );
}
