import api from './client';

export type PaymentProvider = 'MERCADO_PAGO' | 'ABACATEPAY';
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REFUNDED';
export type OnlinePaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'OTHER';

export interface PaymentConnectionItem {
  provider: PaymentProvider;
  status: ConnectionStatus;
  accountName: string | null;
  accountEmail: string | null;
  providerAccountId: string | null;
  connectedAt: string;
  lastValidatedAt: string | null;
  hasCredentials: boolean;
  maskedKey: string | null;
}

export interface PaymentTransactionItem {
  id: string;
  tenantId: string;
  provider: PaymentProvider;
  amount: number;
  amountCents: number;
  currency: string;
  paymentMethod: OnlinePaymentMethod;
  status: TransactionStatus;
  paymentUrl: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  externalReference: string | null;
  paidAt: string | null;
  createdAt: string;
  client?: { id: string; name: string; phone: string | null } | null;
  appointment?: { id: string; startAt: string } | null;
  order?: { id: string; number: number } | null;
}

export interface TransactionsResponse {
  items: PaymentTransactionItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  totalApprovedCents: number;
  totalApproved: number;
}

export interface PaymentSettingsPayload {
  onlinePaymentEnabled?: boolean;
  defaultOnlineProvider?: string;
  requirePrepayment?: boolean;
  allowCounterPayment?: boolean;
}

export const paymentsApi = {
  // Conexões
  getConnections: () => api.get<PaymentConnectionItem[]>('/payments/connections').then((r) => r.data),

  getMercadoPagoAuthUrl: (redirectUri: string) =>
    api
      .get<{ url: string; state: string }>('/payments/oauth/mercadopago/connect', { params: { redirectUri } })
      .then((r) => r.data),

  handleMercadoPagoCallback: (code: string, state: string, redirectUri: string) =>
    api
      .post<{ success: boolean; accountName: string; providerAccountId: string; tenantSlug: string }>(
        '/payments/oauth/mercadopago/callback',
        { code, state, redirectUri },
      )
      .then((r) => r.data),

  connectAbacatePay: (apiKey: string) =>
    api
      .post<{ success: boolean; storeName?: string; maskedKey: string }>('/payments/abacatepay/connect', { apiKey })
      .then((r) => r.data),

  disconnect: (provider: PaymentProvider) =>
    api.delete<{ ok: boolean }>(`/payments/connections/${provider}`).then((r) => r.data),

  updateSettings: (payload: PaymentSettingsPayload) =>
    api.patch('/payments/settings', payload).then((r) => r.data),

  // Transações
  listTransactions: (params?: { from?: string; to?: string; status?: TransactionStatus; provider?: PaymentProvider; page?: number; limit?: number }) =>
    api.get<TransactionsResponse>('/payments/transactions', { params }).then((r) => r.data),

  getTransaction: (id: string) =>
    api.get<PaymentTransactionItem>(`/payments/transactions/${id}`).then((r) => r.data),
};
