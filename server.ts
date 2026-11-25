import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, getTodayDateString, buildScheduleRows } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

function formatLoanRow(row: any, today: string) {
  const schedules = db
    .prepare(
      `SELECT id, loan_id as loanId, installment_num as num, due_date as date,
              expected_principal as principal, expected_interest as interest,
              expected_total as total, remaining_principal as remaining,
              status, paid_at as paidAt
       FROM loan_schedules
       WHERE loan_id = ?
       ORDER BY installment_num ASC`
    )
    .all(row.id);

  return {
    id: row.id,
    loanCode: row.loan_code,
    customerId: row.customer_id,
    customerName: row.customer_name,
    phone: row.phone,
    occupation: row.occupation,
    principal: row.principal,
    method: row.method,
    durationDays: row.duration_days,
    interestRatePercent: row.interest_rate_percent || 0,
    profitAmount: row.profit_amount,
    totalAmount: row.total_amount,
    dailyRepayment: row.daily_repayment,
    startDate: row.start_date,
    dueDateNext: row.due_date_next,
    dueAmountToday: row.due_amount_today,
    paidDays: row.paid_days,
    totalPaid: row.total_paid,
    status: row.status,
    paidToday: row.paid_today_date === today,
    schedules,
  };
}

function getAllFormattedLoans(today: string) {
  const rows = db
    .prepare(
      `SELECT l.*, c.name as customer_name, c.phone, c.occupation
       FROM loans l
       JOIN customers c ON l.customer_id = c.id
       ORDER BY l.id DESC`
    )
    .all();

  return rows.map((row) => formatLoanRow(row, today));
}

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/bootstrap', (_req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    const customers = db
      .prepare('SELECT id, code, name, gender, phone, occupation, created_at as createdAt FROM customers ORDER BY id ASC')
      .all();
    const loans = getAllFormattedLoans(today);
    const expenses = db
      .prepare('SELECT id, date, description, amount, created_at as createdAt FROM expenses ORDER BY date DESC, id DESC')
      .all();

    res.json({ customers, loans, expenses, today });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Failed to load application data' });
  }
});

// Customers
app.get('/api/customers', (_req: Request, res: Response) => {
  try {
    const customers = db
      .prepare('SELECT id, code, name, gender, phone, occupation, created_at as createdAt FROM customers ORDER BY id ASC')
      .all();
    res.json(customers);
  } catch (error: any) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

app.post('/api/customers', (req: Request, res: Response) => {
  try {
    const name = String(req.body.name || '').trim();
    const gender = String(req.body.gender || 'ស្រី').trim();
    const phone = String(req.body.phone || '').trim();
    const occupation = String(req.body.occupation || 'ផ្សេងៗ').trim();

    if (!name || !phone) {
      return res.status(400).json({ error: 'សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទអតិថិជន!' });
    }

    const allowedGenders = ['ស្រី', 'ប្រុស', 'Female', 'Male'];
    const safeGender = allowedGenders.includes(gender) ? gender : 'ស្រី';

    const lastRow = db.prepare('SELECT COALESCE(MAX(id), 0) as maxId FROM customers').get() as { maxId: number };
    const code = `CUST-${String(lastRow.maxId + 1).padStart(3, '0')}`;

    const result = db
      .prepare('INSERT INTO customers (code, name, gender, phone, occupation) VALUES (?, ?, ?, ?, ?)')
      .run(code, name, safeGender, phone, occupation);

    const created = db
      .prepare('SELECT id, code, name, gender, phone, occupation, created_at as createdAt FROM customers WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Loans
app.get('/api/loans', (_req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    res.json(getAllFormattedLoans(today));
  } catch (error: any) {
    console.error('Fetch loans error:', error);
    res.status(500).json({ error: 'Failed to load loans' });
  }
});

app.post('/api/loans', (req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    const customerId = Number(req.body.customerId);
    const principal = Number(req.body.principal);
    const method = req.body.method === 'MONTHLY' ? 'MONTHLY' : 'DAILY';
    const startDate = String(req.body.startDate || today).trim();
    const firstDueDate = String(req.body.firstDueDate || startDate).trim();

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'សូមជ្រើសរើសអតិថិជនជាមុន!' });
    }
    if (!Number.isFinite(principal) || principal <= 0) {
      return res.status(400).json({ error: 'សូមបញ្ចូលចំនួនប្រាក់ដើមឱ្យបានត្រឹមត្រូវ!' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
    if (!customer) {
      return res.status(404).json({ error: 'រកមិនឃើញអតិថិជននេះទេ!' });
    }

    const durationUnits =
      method === 'DAILY'
        ? Math.max(1, parseInt(String(req.body.durationDays || 22), 10))
        : Math.max(1, parseInt(String(req.body.months || 3), 10));

    const interestRatePercent = method === 'MONTHLY' ? Math.max(0, Number(req.body.interestRatePercent) || 0) : 0;

    const profitAmount =
      method === 'DAILY'
        ? Math.max(0, Number(req.body.profitAmount) || 0)
        : Math.round(principal * (interestRatePercent / 100) * durationUnits);

    const totalAmount = principal + profitAmount;
    const installmentRepayment = Math.round(totalAmount / durationUnits);

    const scheduleRows = buildScheduleRows({
      principal,
      method,
      durationUnits,
      profitAmount,
      interestRatePercent,
      startDate,
      firstDueDate,
    });

    const ym = startDate.slice(0, 7).replace('-', '') || today.slice(0, 7).replace('-', '');
    const countRow = db.prepare('SELECT COALESCE(MAX(id), 0) as maxId FROM loans').get() as { maxId: number };
    const loanCode = `LN-${ym}-${String(countRow.maxId + 1).padStart(3, '0')}`;

    const createTx = db.transaction(() => {
      const loanRes = db
        .prepare(
          `INSERT INTO loans (
            loan_code, customer_id, principal, method, duration_days,
            interest_rate_percent, profit_amount, total_amount, daily_repayment,
            start_date, due_date_next, due_amount_today, paid_days, total_paid,
            status, paid_today_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'ACTIVE', NULL)`
        )
        .run(
          loanCode,
          customerId,
          principal,
          method,
          durationUnits,
          interestRatePercent,
          profitAmount,
          totalAmount,
          installmentRepayment,
          startDate,
          firstDueDate,
          installmentRepayment
        );

      const loanId = Number(loanRes.lastInsertRowid);

      const insertSchedule = db.prepare(
        `INSERT INTO loan_schedules (
          loan_id, installment_num, due_date, expected_principal,
          expected_interest, expected_total, remaining_principal, status, paid_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL)`
      );

      for (const row of scheduleRows) {
        insertSchedule.run(
          loanId,
          row.num,
          row.date,
          row.principal,
          row.interest,
          row.total,
          row.remaining
        );
      }

      return loanId;
    });

    const loanId = createTx();
    const row = db
      .prepare(
        `SELECT l.*, c.name as customer_name, c.phone, c.occupation
         FROM loans l
         JOIN customers c ON l.customer_id = c.id
         WHERE l.id = ?`
      )
      .get(loanId);

    res.status(201).json(formatLoanRow(row, today));
  } catch (error: any) {
    console.error('Disburse loan error:', error);
    res.status(500).json({ error: 'Failed to disburse loan' });
  }
});

// Record Payment (Daily / Partial / Advance / Full Early Payoff)
app.post('/api/loans/:id/payments', (req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    const loanId = Number(req.params.id);
    const amount = Number(req.body.amount);

    if (!Number.isInteger(loanId) || loanId <= 0) {
      return res.status(400).json({ error: 'Invalid loan ID' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!' });
    }

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId) as any;
    if (!loan) {
      return res.status(404).json({ error: 'រកមិនឃើញកម្ចីនេះទេ!' });
    }
    if (loan.status === 'COMPLETED') {
      return res.status(400).json({ error: 'កម្ចីនេះត្រូវបានបង់ផ្តាច់រួចហើយ!' });
    }

    const remainingBalance = Math.max(0, loan.total_amount - loan.total_paid);
    const appliedAmount = Math.min(amount, remainingBalance);
    const newTotalPaid = loan.total_paid + appliedAmount;
    const newRemaining = Math.max(0, loan.total_amount - newTotalPaid);

    const calculatedDays = Math.min(
      loan.duration_days,
      Math.max(loan.paid_days + 1, Math.round(newTotalPaid / Math.max(1, loan.daily_repayment)))
    );

    const completed = newRemaining <= 0;
    const nextPaidDays = completed ? loan.duration_days : calculatedDays;
    const nextDueAmount = completed ? 0 : Math.min(loan.daily_repayment, newRemaining);
    const nextStatus = completed ? 'COMPLETED' : 'ACTIVE';

    const profitRatio = loan.total_amount > 0 ? loan.profit_amount / loan.total_amount : 0;
    const interestPortion = Math.round(appliedAmount * profitRatio);
    const principalPortion = Math.max(0, appliedAmount - interestPortion);

    const payTx = db.transaction(() => {
      db.prepare(
        `UPDATE loans
         SET paid_days = ?,
             total_paid = ?,
             due_amount_today = ?,
             status = ?,
             paid_today_date = ?
         WHERE id = ?`
      ).run(nextPaidDays, newTotalPaid, nextDueAmount, nextStatus, today, loanId);

      db.prepare(
        `UPDATE loan_schedules
         SET status = 'PAID',
             paid_at = COALESCE(paid_at, datetime('now', 'localtime'))
         WHERE loan_id = ? AND installment_num <= ?`
      ).run(loanId, nextPaidDays);

      db.prepare(
        `INSERT INTO repayments (loan_id, payment_date, paid_amount, principal_portion, interest_portion, is_payoff)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(loanId, today, appliedAmount, principalPortion, interestPortion, completed ? 1 : 0);
    });

    payTx();

    const updatedRow = db
      .prepare(
        `SELECT l.*, c.name as customer_name, c.phone, c.occupation
         FROM loans l
         JOIN customers c ON l.customer_id = c.id
         WHERE l.id = ?`
      )
      .get(loanId);

    res.json({
      loan: formatLoanRow(updatedRow, today),
      appliedAmount,
      isFullPayoff: completed,
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Expenses (Profit & Loss)
app.get('/api/expenses', (_req: Request, res: Response) => {
  try {
    const expenses = db
      .prepare('SELECT id, date, description, amount, created_at as createdAt FROM expenses ORDER BY date DESC, id DESC')
      .all();
    res.json(expenses);
  } catch (error: any) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

app.post('/api/expenses', (req: Request, res: Response) => {
  try {
    const date = String(req.body.date || getTodayDateString()).trim();
    const description = String(req.body.description || '').trim();
    const amount = Number(req.body.amount);

    if (!date || !description || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'សូមបំពេញព័ត៌មានចំណាយឱ្យបានត្រឹមត្រូវ!' });
    }

    const resInsert = db
      .prepare('INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)')
      .run(date, description, amount);

    const created = db
      .prepare('SELECT id, date, description, amount, created_at as createdAt FROM expenses WHERE id = ?')
      .get(resInsert.lastInsertRowid);

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// ==========================================
// VITE DEV SERVER / STATIC PRODUCTION SERVING
// ==========================================

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
