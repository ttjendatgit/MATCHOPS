export interface TransactionSummary {
  totalAmount: number;
  thisMonthAmount: number;
  totalCount: number;
  successCount: number;
}

export interface TransactionItem {
  id: string;
  type: "BOOKING" | "MEMBERSHIP" | "COACH_SESSION";
  amount: number;
  method: string;
  status: string;
  transactionCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
  description: string;
  referenceId?: string | null;
  venueName?: string | null;
  courtName?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
}

export interface TransactionHistoryResponse {
  items: TransactionItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  summary: TransactionSummary;
}

export interface TransactionHistoryQuery {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  status?: string;
}
