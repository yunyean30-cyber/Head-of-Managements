import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'khr_micro_loan.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildScheduleRows(params: {
  principal: number;
  method: 'DAILY' | 'MONTHLY';
  durationUnits: number;
  profitAmount: number;
  interestRatePercent?: number;
  startDate: string;
  firstDueDate?: string;
}) {
  const { principal, method, durationUnits, profitAmount, startDate, firstDueDate } = params;
  const rows: Array<{
    num: number;
    date: string;
    principal: number;
    interest: number;
    total: number;
    remaining: number;
  }> = [];

  const n = Math.max(1, durationUnits);
  const baseStart = new Date(`${startDate}T00:00:00`);
  const baseFirst = firstDueDate ? new Date(`${firstDueDate}T00:00:00`) : null;
  const useCustomFirst = baseFirst !== null && !isNaN(baseFirst.getTime());

  if (method === 'DAILY') {
    const total = principal + profitAmount;
    const dailyTotal = Math.round(total / n);
    const dailyPrincipal = Math.round(principal / n);
    const dailyProfit = Math.round(profitAmount / n);

    let remPrincipal = principal;
    for (let i = 1; i <= n; i++) {
      const curDate = new Date(useCustomFirst ? baseFirst! : baseStart);
      curDate.setDate(curDate.getDate() + (useCustomFirst ? i - 1 : i));
      const thisPrincipal = i === n ? remPrincipal : dailyPrincipal;
      remPrincipal -= thisPrincipal;

      rows.push({
        num: i,
        date: !isNaN(curDate.getTime()) ? curDate.toISOString().split('T')[0] : startDate,
        principal: thisPrincipal,
        interest: dailyProfit,
        total: i === n ? thisPrincipal + dailyProfit : dailyTotal,
        remaining: Math.max(0, remPrincipal),
      });
    }
  } else {
    const monthlyPrincipal = Math.round(principal / n);
    const monthlyInterest = Math.round(profitAmount / n);

    let remPrincipal = principal;
    for (let i = 1; i <= n; i++) {
      const curDate = new Date(useCustomFirst ? baseFirst! : baseStart);
      curDate.setMonth(curDate.getMonth() + (useCustomFirst ? i - 1 : i));
      const thisPrincipal = i === n ? remPrincipal : monthlyPrincipal;
      remPrincipal -= thisPrincipal;

      rows.push({
        num: i,
        date: !isNaN(curDate.getTime()) ? curDate.toISOString().split('T')[0] : startDate,
        principal: thisPrincipal,
        interest: monthlyInterest,
        total: thisPrincipal + monthlyInterest,
        remaining: Math.max(0, remPrincipal),
      });
    }
  }

  return rows;
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('ស្រី', 'ប្រុស', 'Female', 'Male')),
      phone TEXT NOT NULL,
      occupation TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_code TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      principal REAL NOT NULL,
      method TEXT NOT NULL CHECK (method IN ('DAILY', 'MONTHLY')),
      duration_days INTEGER NOT NULL CHECK (duration_days > 0),
      interest_rate_percent REAL DEFAULT 0,
      profit_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      daily_repayment REAL NOT NULL,
      start_date TEXT NOT NULL,
      due_date_next TEXT NOT NULL,
      due_amount_today REAL NOT NULL,
      paid_days INTEGER NOT NULL DEFAULT 0,
      total_paid REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED')),
      paid_today_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS loan_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      installment_num INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      expected_principal REAL NOT NULL,
      expected_interest REAL NOT NULL,
      expected_total REAL NOT NULL,
      remaining_principal REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
      paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      payment_date TEXT NOT NULL,
      paid_amount REAL NOT NULL,
      principal_portion REAL NOT NULL,
      interest_portion REAL NOT NULL,
      is_payoff INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_schedules_loan ON loan_schedules(loan_id);
    CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  `);

  const count = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }).count;
  if (count === 0) {
    seedInitialData();
  }
}

export function seedInitialData() {
  const today = getTodayDateString();
  const shiftDate = (daysOffset: number) => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const ym = today.slice(0, 7).replace('-', '');

  const seedCustomers = [
    { code: 'CUST-001', name: 'សុខ ចាន់ណា', gender: 'ស្រី', phone: '012 345 678', occupation: 'លក់ត្រី' },
    { code: 'CUST-002', name: 'កែវ សីហា', gender: 'ប្រុស', phone: '098 765 432', occupation: 'លក់កាហ្វេ' },
    { code: 'CUST-003', name: 'ម៉ៅ សុភ័ក្រ', gender: 'ស្រី', phone: '088 123 999', occupation: 'លក់បន្លែ' },
    { code: 'CUST-004', name: 'ជា វិសាល', gender: 'ប្រុស', phone: '077 555 888', occupation: 'លក់សាច់ជ្រូក' },
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (code, name, gender, phone, occupation)
    VALUES (?, ?, ?, ?, ?)
  `);

  const custIds: number[] = [];
  for (const c of seedCustomers) {
    const res = insertCustomer.run(c.code, c.name, c.gender, c.phone, c.occupation);
    custIds.push(Number(res.lastInsertRowid));
  }

  const seedLoans = [
    {
      loanCode: `LN-${ym}-001`,
      customerId: custIds[0],
      principal: 600000,
      method: 'DAILY' as const,
      durationDays: 22,
      profitAmount: 40000,
      totalAmount: 640000,
      dailyRepayment: Math.round(640000 / 22),
      startDate: shiftDate(-5),
      dueDateNext: today,
      dueAmountToday: Math.round(640000 / 22),
      paidDays: 5,
      totalPaid: Math.round(640000 / 22) * 5,
      status: 'ACTIVE' as const,
      paidTodayDate: null,
    },
    {
      loanCode: `LN-${ym}-002`,
      customerId: custIds[1],
      principal: 400000,
      method: 'DAILY' as const,
      durationDays: 21,
      profitAmount: 30000,
      totalAmount: 430000,
      dailyRepayment: Math.round(430000 / 21),
      startDate: shiftDate(-12),
      dueDateNext: today,
      dueAmountToday: Math.round(430000 / 21),
      paidDays: 12,
      totalPaid: Math.round(430000 / 21) * 12,
      status: 'ACTIVE' as const,
      paidTodayDate: today,
    },
    {
      loanCode: `LN-${ym}-003`,
      customerId: custIds[2],
      principal: 800000,
      method: 'DAILY' as const,
      durationDays: 22,
      profitAmount: 50000,
      totalAmount: 850000,
      dailyRepayment: Math.round(850000 / 22),
      startDate: shiftDate(-16),
      dueDateNext: today,
      dueAmountToday: Math.round(850000 / 22),
      paidDays: 16,
      totalPaid: Math.round(850000 / 22) * 16,
      status: 'ACTIVE' as const,
      paidTodayDate: null,
    },
  ];

  const insertLoan = db.prepare(`
    INSERT INTO loans (
      loan_code, customer_id, principal, method, duration_days,
      interest_rate_percent, profit_amount, total_amount, daily_repayment,
      start_date, due_date_next, due_amount_today, paid_days, total_paid,
      status, paid_today_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSchedule = db.prepare(`
    INSERT INTO loan_schedules (
      loan_id, installment_num, due_date, expected_principal,
      expected_interest, expected_total, remaining_principal, status, paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const l of seedLoans) {
    const res = insertLoan.run(
      l.loanCode,
      l.customerId,
      l.principal,
      l.method,
      l.durationDays,
      0,
      l.profitAmount,
      l.totalAmount,
      l.dailyRepayment,
      l.startDate,
      l.dueDateNext,
      l.dueAmountToday,
      l.paidDays,
      l.totalPaid,
      l.status,
      l.paidTodayDate
    );
    const loanId = Number(res.lastInsertRowid);

    const scheduleRows = buildScheduleRows({
      principal: l.principal,
      method: l.method,
      durationUnits: l.durationDays,
      profitAmount: l.profitAmount,
      startDate: l.startDate,
    });

    for (const row of scheduleRows) {
      const isPaid = row.num <= l.paidDays;
      insertSchedule.run(
        loanId,
        row.num,
        row.date,
        row.principal,
        row.interest,
        row.total,
        row.remaining,
        isPaid ? 'PAID' : 'PENDING',
        isPaid ? `${row.date} 09:00:00` : null
      );
    }
  }

  const insertExpense = db.prepare(`
    INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)
  `);
  insertExpense.run(shiftDate(-5), 'ចំណាយថ្លៃសាំងម៉ូតូដើរប្រមូលប្រាក់', 15000);
  insertExpense.run(shiftDate(-3), 'ទិញសៀវភៅកត់ត្រា និងប៊ិច', 8000);
}
