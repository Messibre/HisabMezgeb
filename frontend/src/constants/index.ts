export const ROUTES = {
  // TODO: Home moves to '/home' in the landing page task (installed PWA start_url is '/home', while '/' will be public landing page)
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ENTRIES: '/entries',
  DEBTS: '/debts',
  DEBT_CUSTOMER_DETAIL: '/debts/:customerId',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

// Helper for building a real debt-customer-detail link (ROUTES.DEBT_CUSTOMER_DETAIL
// is the route *pattern* react-router needs; this fills in a real id).
export const buildDebtCustomerDetailPath = (customerId: string) =>
  `/debts/${customerId}`;

export const QUERY_KEYS = {
  SETTINGS: 'settings',
  INCOME: 'income',
  EXPENSE_CATEGORIES: 'expenseCategories',
  EXPENSES: 'expenses',
  FUNDING: 'funding',
  FUNDING_OUTSTANDING: 'fundingOutstanding',
  DEBT_CUSTOMERS: 'debtCustomers',
  DEBT_CUSTOMER_DETAIL: 'debtCustomerDetail',
  REPORT_SUMMARY: 'reportSummary',
  REPORT_DEBTS_PERIOD: 'reportDebtsPeriod',
  REPORT_EXPENSE_BREAKDOWN: 'reportExpenseBreakdown',
} as const;
