export type LoanMethod = 'DAILY' | 'MONTHLY';
export type LoanStatus = 'ACTIVE' | 'COMPLETED';

export interface Customer {
  id: number;
  code: string;
  name: string;
  gender: string;
  phone: string;
  occupation: string;
  createdAt?: string;
}

export interface LoanScheduleItem {
  id?: number;
  loanId?: number;
  num: number;
  date: string;
  principal: number;
  interest: number;
  total: number;
  remaining: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string | null;
}

export interface Loan {
  id: number;
  loanCode: string;
  customerId: number;
  customerName: string;
  phone: string;
  occupation: string;
  principal: number;
  method: LoanMethod;
  durationDays: number;
  interestRatePercent: number;
  profitAmount: number;
  totalAmount: number;
  dailyRepayment: number;
  startDate: string;
  dueDateNext: string;
  dueAmountToday: number;
  paidDays: number;
  totalPaid: number;
  status: LoanStatus;
  paidToday: boolean;
  schedules?: LoanScheduleItem[];
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
  createdAt?: string;
}

export interface BootstrapPayload {
  customers: Customer[];
  loans: Loan[];
  expenses: Expense[];
  today: string;
}
