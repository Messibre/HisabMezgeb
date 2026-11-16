export interface Account {
  id: string;
  phoneNumber: string;
  shopName: string | null;
}

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface RegisterPayload {
  phoneNumber: string;
  password: string;
  shopName?: string;
}

export interface Settings {
  language: 'en' | 'am' | 'ti';
  notificationsEnabled: boolean;
}

export interface UpdateSettingsPayload {
  language?: 'en' | 'am' | 'ti';
  notificationsEnabled?: boolean;
}

export interface IncomeEntry {
  id: string;
  date: string;
  amount: number;
  note: string | null;
}

export interface CreateIncomePayload {
  date: string;
  amount: number;
  note?: string;
}

export interface UpdateIncomePayload {
  amount?: number;
  note?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  group: 'business' | 'personal';
  isActive: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  group: 'business' | 'personal';
}

export interface UpdateCategoryPayload {
  name?: string;
  isActive?: boolean;
}

export interface ExpenseWithCategory {
  id: string;
  date: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  note: string | null;
}

export interface CreateExpensePayload {
  date: string;
  categoryId: string;
  amount: number;
  note?: string;
}

export interface UpdateExpensePayload {
  amount?: number;
  note?: string;
}

export interface FundingEntry {
  id: string;
  date: string;
  type: 'salary_injection' | 'borrowed_in' | 'borrowed_repaid';
  amount: number;
  note: string | null;
}

export interface CreateFundingPayload {
  date: string;
  type: FundingEntry['type'];
  amount: number;
  note?: string;
}

export interface UpdateFundingPayload {
  amount?: number;
  note?: string;
}

export interface DebtCustomer {
  id: string;
  name: string;
  note: string | null;
  balance: number;
}

export interface CreateCustomerPayload {
  name: string;
  note?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  note?: string;
}

export interface DebtHistoryItem {
  id: string;
  kind: 'borrow' | 'payment';
  date: string;
  amount: number;
  itemsDescription: string | null;
}

export interface DebtCustomerDetail extends DebtCustomer {
  history: DebtHistoryItem[];
}

export interface BorrowRecord {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  itemsDescription: string;
  note: string | null;
}

export interface CreateBorrowPayload {
  date: string;
  amount: number;
  itemsDescription: string;
  note?: string;
}

export interface UpdateBorrowPayload {
  amount?: number;
  itemsDescription?: string;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  note: string | null;
}

export interface CreatePaymentPayload {
  date: string;
  amount: number;
  note?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  note?: string;
}

export interface PaymentResult {
  payment: PaymentRecord;
  newBalance: number;
}

export interface ReportSummary {
  totalIncome: number;
  totalBusinessExpenses: number;
  totalPersonalDraws: number;
  totalFundingIn: number;
  totalFundingOut: number;
  totalOwedByCustomers: number;
}

export interface DebtPeriodReport {
  totalNewlyBorrowed: number;
  totalRepaidInPeriod: number;
}

export interface ExpenseBreakdownItem {
  categoryId: string;
  categoryName: string;
  group: 'business' | 'personal';
  total: number;
}

export interface ExportReportParams {
  from: string;
  to: string;
}
