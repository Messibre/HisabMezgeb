export type SupportedLang = 'en' | 'am' | 'ti';
export type ExportFormat = 'pdf' | 'docx' | 'csv';

export interface DocTableColumn {
  header: string;
  align?: 'left' | 'right' | 'center';
  widthRatio?: number;
}

export interface DocTableRow {
  cells: string[];
  isBold?: boolean;
}

export interface DocTable {
  title?: string;
  columns: DocTableColumn[];
  rows: DocTableRow[];
}

export interface DocKeyValue {
  label: string;
  value: string;
  isBold?: boolean;
  indent?: boolean;
}

export interface DocSection {
  title: string;
  items?: DocKeyValue[];
  table?: DocTable;
  note?: string;
}

export interface DocumentModel {
  docType: 'report' | 'statement';
  title: string;
  shopName: string | null;
  entityName?: string;
  periodText?: string;
  generatedDateText: string;
  currentBalanceText?: string;
  sections: DocSection[];
  notes?: string[];
  closingLine?: string;
  lang: SupportedLang;
  format: ExportFormat;
}

export const I18N_STRINGS: Record<
  SupportedLang,
  {
    reportTitle: string;
    statementTitle: string;
    period: (from: string, to: string) => string;
    generatedOn: (date: string) => string;
    shopNameLabel: string;
    customerLabel: string;
    currentBalance: (amount: string) => string;
    totalIncome: string;
    businessExpenses: string;
    personalDraws: string;
    fundingIn: string;
    fundingOut: string;
    totalOwedToday: string;
    totalOwedNote: string;
    incomeNote: string;
    wordFontNote: string;
    category: string;
    group: string;
    amount: string;
    expensesByCategory: string;
    noExpenses: string;
    debtsSummary: string;
    newlyBorrowed: string;
    repaid: string;
    date: string;
    typeOrDescription: string;
    borrowed: string;
    paid: string;
    runningBalance: string;
    borrowKind: string;
    paymentKind: string;
    closingLineZero: string;
    closingLinePositive: string;
    financialSummary: string;
  }
> = {
  en: {
    reportTitle: 'Financial Report',
    statementTitle: 'Customer Statement',
    period: (from, to) => `Period: ${from} to ${to}`,
    generatedOn: (date) => `Generated: ${date}`,
    shopNameLabel: 'Shop',
    customerLabel: 'Customer',
    currentBalance: (amt) => `Current Balance: ${amt}`,
    totalIncome: 'Total Income',
    businessExpenses: 'Business Expenses',
    personalDraws: 'Personal / Family Draws',
    fundingIn: 'Funding In',
    fundingOut: 'Funding Out',
    totalOwedToday: 'Total Owed by Customers (Today)',
    totalOwedNote: 'Total owed reflects all customer debts today (not limited to the period).',
    incomeNote: 'Income includes cash from customer payments.',
    wordFontNote:
      'Note: Ethiopic script (Amharic/Tigrigna) requires a Ge\'ez font (e.g. Noto Sans Ethiopic or Nyala) installed on your computer to display properly in Word.',
    category: 'Category',
    group: 'Group',
    amount: 'Amount',
    expensesByCategory: 'Expense Breakdown by Category',
    noExpenses: 'No expenses recorded in this period.',
    debtsSummary: 'Debt Activity (This Period)',
    newlyBorrowed: 'Newly Borrowed in Period',
    repaid: 'Repaid in Period',
    date: 'Date',
    typeOrDescription: 'Description',
    borrowed: 'Borrowed',
    paid: 'Paid',
    runningBalance: 'Balance',
    borrowKind: 'Borrow',
    paymentKind: 'Payment',
    closingLineZero: 'Account is fully settled. Balance: ETB 0.00. Thank you!',
    closingLinePositive: 'Please contact us to settle the remaining balance. Thank you for your business.',
    financialSummary: 'Summary of Finances',
  },
  am: {
    reportTitle: 'የፋይናንስ ሪፖርት',
    statementTitle: 'የደንበኛ ሂሳብ መግለጫ',
    period: (from, to) => `ጊዜ፡ ከ ${from} እስከ ${to}`,
    generatedOn: (date) => `የተዘጋጀበት ቀን፡ ${date}`,
    shopNameLabel: 'የሱቅ ስም',
    customerLabel: 'ደንበኛ',
    currentBalance: (amt) => `ወቅታዊ ቀሪ ዕዳ፡ ${amt}`,
    totalIncome: 'ጠቅላላ ገቢ',
    businessExpenses: 'የሱቅ ወጪዎች',
    personalDraws: 'የግል/የቤተሰብ ወጪዎች',
    fundingIn: 'የገባ ተጨማሪ ገንዘብ',
    fundingOut: 'የተመለሰ ተጨማሪ ገንዘብ',
    totalOwedToday: 'በደንበኞች የተያዘ ጠቅላላ ዕዳ (ዛሬ)',
    totalOwedNote: 'የደንበኞች ዕዳ የዛሬውን አጠቃላይ ቀሪ ዕዳ ያሳያል (በጊዜው ያልተገደበ)።',
    incomeNote: 'ጠቅላላ ገቢ ከደንበኞች ዕዳ ክፍያ የተሰበሰበውን ጥሬ ገንዘብ ያካትታል።',
    wordFontNote:
      'ማስታወሻ፡ በWord ውስጥ የግዕዝ ፊደላት በትክክል እንዲታዩ በኮምፒውተርዎ ላይ የግዕዝ ፎንት (ለምሳሌ Noto Sans Ethiopic ወይም Nyala) መጫን አለበት።',
    category: 'የወጪ ዓይነት',
    group: 'ምድብ',
    amount: 'መጠን',
    expensesByCategory: 'የወጪ ዝርዝር በየዓይነቱ',
    noExpenses: 'በዚህ ጊዜ ውስጥ የተመዘገበ ወጪ የለም።',
    debtsSummary: 'የዕዳ እንቅስቃሴ (በዚህ ጊዜ)',
    newlyBorrowed: 'በጊዜው አዲስ የተበደረ',
    repaid: 'በጊዜው የተመለሰ',
    date: 'ቀን',
    typeOrDescription: 'ዝርዝር / ዓይነት',
    borrowed: 'የተበደረ',
    paid: 'የተከፈለ',
    runningBalance: 'ቀሪ ዕዳ',
    borrowKind: 'ብድር',
    paymentKind: 'ክፍያ',
    closingLineZero: 'ሂሳብዎ ሙሉ በሙሉ ተጠናቋል። ቀሪ ዕዳ፡ ETB 0.00። እናመሰግናለን!',
    closingLinePositive: 'እባክዎ ቀሪ ዕዳዎን ያጠናቁ። ከእኛ ጋር ስለሰሩ እናመሰግናለን።',
    financialSummary: 'የፋይናንስ ማጠቃለያ',
  },
  ti: {
    reportTitle: 'ናይ ፋይናንስ ጸብጻብ',
    statementTitle: 'ናይ ዓሚል ሒሳብ መግለጺ',
    period: (from, to) => `እዋን፡ ካብ ${from} ክሳብ ${to}`,
    generatedOn: (date) => `ዝተዳለወሉ ዕለት፡ ${date}`,
    shopNameLabel: 'ስም ድኳን',
    customerLabel: 'ዓሚል',
    currentBalance: (amt) => `ናይ ሕጂ ዕዳ፡ ${amt}`,
    totalIncome: 'ጠቕላላ ኣታዊ',
    businessExpenses: 'ወጻኢታት ድኳን',
    personalDraws: 'ናይ ውልቂ/ስድራ ወጻኢታት',
    fundingIn: 'ዝኣተወ ወፍሪ',
    fundingOut: 'ዝተመልሰ ወፍሪ',
    totalOwedToday: 'ብዓማዊል ዘሎ ጠቕላላ ዕዳ (ሎሚ)',
    totalOwedNote: 'ናይ ዓማዊል ዕዳ ናይ ሎሚ ጠቕላላ ዘይተኸፍለ ዕዳ የርኢ (በቲ እዋን ዘይተወሰነ)።',
    incomeNote: 'ጠቕላላ ኣታዊ ካብ ክፍሊት ዕዳ ዓማዊል ዝተረኽበ ጥረ ገንዘብ የጠቓልል።',
    wordFontNote:
      'መዘክር፡ ኣብ Word ፊደላት ግዕዝ ብትኽክል ንኽርኣዩ ኣብ ኮምፒተርኩም ናይ ግዕዝ ፎንት (ንኣብነት Noto Sans Ethiopic ወይ Nyala) ክህሉ ኣለዎ።',
    category: 'ዓይነት ወጻኢ',
    group: 'ምድብ',
    amount: 'መጠን',
    expensesByCategory: 'ዝርዝር ወጻኢታት ብመደብ',
    noExpenses: 'ኣብዚ እዋን ዝተመዝገበ ወጻኢ የለን።',
    debtsSummary: 'ምንቅስቓስ ዕዳ (ኣብዚ እዋን)',
    newlyBorrowed: 'ኣብዚ እዋን ሓድሽ ዝተለቅሐ',
    repaid: 'ኣብዚ እዋን ዝተኸፍለ',
    date: 'ዕለት',
    typeOrDescription: 'መግለጺ / ዓይነት',
    borrowed: 'ዝተለቅሐ',
    paid: 'ዝተኸፍለ',
    runningBalance: 'ቀሪ ዕዳ',
    borrowKind: 'ልቓሕ',
    paymentKind: 'ክፍሊት',
    closingLineZero: 'ሒሳብኩም ምሉእ ብምሉእ ተኸፊሉ። ቀሪ ዕዳ፡ ETB 0.00። ነመስግን!',
    closingLinePositive: 'በጃኹም ዝተረፈ ዕዳኹም ኣጻፍፉ። ምሳና ስለ ዝሰራሕኩም ነመስግን።',
    financialSummary: 'ሓፈሻዊ ትሕዝቶ ፋይናንስ',
  },
};

/**
 * Format money consistently: 2 decimal places with thousands separator.
 * Floating point rounding errors are avoided by exact rounding to cents.
 */
export function formatMoney(amount: number, _lang: SupportedLang = 'en'): string {
  const rounded = Math.round(amount * 100) / 100;
  const parts = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `ETB ${parts}`;
}

/**
 * Format date in Gregorian YYYY-MM-DD format.
 */
export function formatDateGregorian(date: Date, _lang: SupportedLang = 'en'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
