// PharmaLink Enterprise API Client
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // If accessing via IP (like 192.168.x.x) or localhost, dynamically point to that host on port 8000
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8000/api/v1`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();

export interface StoredUser {
  id?: number;
  user_id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "DISTRIBUTOR" | "CUSTOMER";
  kyc_status?: string | null;
  avatar?: string | null;
  phone?: string | null;
  company_name?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: "ADMIN" | "DISTRIBUTOR" | "CUSTOMER";
  user_id: number;
  full_name: string;
  email: string;
  kyc_status?: string | null;
  avatar?: string | null;
  phone?: string | null;
  company_name?: string | null;
}

export interface ProductItem {
  price: number | null | undefined;
  id: number;
  sku: string;
  name: string;
  subtitle?: string | null;
  composition: string;
  pack_size: string;
  description?: string | null;
  category_name?: string | null;
  mrp: number;
  display_price: number;
  role_price_label: string;
  discount_percentage: number;
  distributor_price?: number | null;
  customer_price?: number | null;
  bulk_price?: number | null;
  bulk_moq?: number | null;
  stock: number;
  in_stock: boolean;
  batch_no?: string | null;
  expiry_date?: string | null;
  image?: string | null;
  status: string;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface OrderCreatePayload {
  items: OrderItemPayload[];
  customer_name: string;
  customer_phone?: string;
  gstin?: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  payment_method?: string;
}

export interface OrderItemData {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  batch_no?: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface OrderData {
  id: number;
  order_code: string;
  user_id: number;
  role: string;
  customer_name: string;
  customer_phone?: string | null;
  gstin?: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_charge: number;
  total_amount: number;
  order_status: "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
  payment_status: "Pending" | "Paid" | "Failed" | "COD" | "Refunded";
  payment_method: string;
  refund_status?: string | null;
  refund_id?: string | null;
  razorpay_payment_id?: string | null;
  invoice_number?: string | null;
  tracking_number?: string | null;
  admin_notes?: string | null;
  created_at: string;
  items: OrderItemData[];
}

export interface DashboardSummary {
  total_sales_today: number;
  total_sales_all_time: number;
  pending_credit_today?: number;
  pending_credit_total?: number;
  total_orders?: number;
  orders_today: number;
  orders_pending: number;
  orders_delivered: number;
  total_customers: number;
  total_distributors: number;
  pending_kyc_count: number;
  total_products: number;
  low_stock_count: number;
}

export interface KYCOut {
  id: number;
  distributor_id: number;
  company_name?: string | null;
  distributor_name?: string | null;
  gst_number: string;
  drug_license_no: string;
  pan_number?: string | null;
  document_file_url?: string | null;
  verification_status: "PENDING" | "APPROVED" | "REJECTED";
  admin_remarks?: string | null;
  credit_limit?: number | null;
  submitted_at: string;
}

// Token Storage Helpers
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pharmalink_token");
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("pharmalink_token", token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pharmalink_token");
    localStorage.removeItem("pharmalink_user");
  }
};

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("pharmalink_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: StoredUser): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("pharmalink_user", JSON.stringify(user));
  }
};

// Generic Fetch Wrapper with Auth Headers
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // fallback to status text
    }

    if (res.status === 401 && !endpoint.includes("/auth/login")) {
      removeAuthToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pharmalink_user_updated"));
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?reason=session_expired";
        }
      }
    }

    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

// API Service Modules
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    // Store user info from login response first
    setStoredUser({
      user_id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      kyc_status: data.kyc_status,
      avatar: data.avatar ?? null,
      phone: data.phone ?? null,
      company_name: data.company_name ?? null,
    });
    // Fetch full profile (includes avatar saved in DB, phone, company_name) and update stored user
    try {
      const me = await apiFetch<any>("/auth/me");
      setStoredUser({
        user_id: data.user_id,
        email: data.email,
        full_name: me.full_name || data.full_name,
        role: data.role,
        kyc_status: me.distributor_profile?.kyc_status ?? data.kyc_status,
        avatar: me.avatar ?? data.avatar ?? null,
        phone: me.phone ?? data.phone ?? null,
        company_name: me.distributor_profile?.company_name ?? data.company_name ?? null,
      });
    } catch {
      // If /auth/me fails, keep basic data
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pharmalink_user_updated"));
    }
    return data;
  },

  registerCustomer: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>("/auth/register-customer", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAuthToken(data.access_token);
    setStoredUser({
      user_id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      kyc_status: null,
      avatar: data.avatar ?? null,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pharmalink_user_updated"));
    }
    return data;
  },

  registerDistributor: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    company_name: string;
    distributor_name: string;
    gstin: string;
    drug_license_no: string;
    pan_number?: string;
    document_file_url?: string;
    business_address: string;
    city: string;
    state: string;
    pincode: string;
  }): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>("/auth/register-distributor", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAuthToken(data.access_token);
    setStoredUser({
      user_id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      kyc_status: "PENDING",
      avatar: data.avatar ?? null,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pharmalink_user_updated"));
    }
    return data;
  },

  getMe: async () => {
    return apiFetch<any>("/auth/me");
  },

  updateProfile: async (payload: {
    full_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    avatar?: string;
  }) => {
    const data = await apiFetch<any>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    // Update local storage stored user
    const current = getStoredUser();
    if (current) {
      if (data.email || payload.email) current.email = data.email || payload.email || current.email;
      if (data.full_name || payload.full_name) current.full_name = data.full_name || payload.full_name || current.full_name;
      if (data.phone || payload.phone) current.phone = data.phone || payload.phone || current.phone;
      if (data.avatar !== undefined || payload.avatar !== undefined) current.avatar = data.avatar ?? payload.avatar ?? current.avatar;
      if (data.distributor_profile?.company_name || payload.company_name) {
        current.company_name = data.distributor_profile?.company_name || payload.company_name || current.company_name;
      }
      setStoredUser(current);
      // Trigger storage event so header & dashboard update reactively
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pharmalink_user_updated"));
      }
    }
    return data;
  },

  changePassword: async (current_password: string, new_password: string): Promise<{ status: string; message: string }> => {
    return apiFetch<{ status: string; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    });
  },

  logout: () => {
    removeAuthToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pharmalink_user_updated"));
    }
  },

  getStoredUser: (): StoredUser | null => {
    return getStoredUser();
  },

  setStoredUser: (user: StoredUser): void => {
    setStoredUser(user);
  },

  getToken: (): string | null => {
    return getAuthToken();
  },
};

export const productsAPI = {
  list: async (categorySlug?: string, search?: string, includeDisabled: boolean = false): Promise<ProductItem[]> => {
    const params = new URLSearchParams();
    if (categorySlug && categorySlug !== "All") params.append("category_slug", categorySlug);
    if (search) params.append("search", search);
    if (includeDisabled) params.append("include_disabled", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<ProductItem[]>(`/products${query}`);
  },

  get: async (productId: number): Promise<ProductItem> => {
    return apiFetch<ProductItem>(`/products/${productId}`);
  },

  create: async (payload: {
    sku: string;
    name: string;
    subtitle?: string;
    composition: string;
    pack_size: string;
    description?: string;
    category_id?: number;
    mrp: number;
    customer_price: number;
    distributor_price: number;
    bulk_price: number;
    bulk_moq: number;
    stock: number;
    low_stock_threshold?: number;
    batch_no?: string;
    expiry_date?: string;
    image?: string;
    status?: string;
  }): Promise<ProductItem> => {
    return apiFetch<ProductItem>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update: async (productId: number, payload: Partial<ProductItem>): Promise<ProductItem> => {
    return apiFetch<ProductItem>(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  delete: async (productId: number, hardDelete: boolean = false): Promise<any> => {
    return apiFetch<any>(`/products/${productId}?hard_delete=${hardDelete}`, {
      method: "DELETE",
    });
  },

  adjustStock: async (productId: number, adjustment: number, reason: string): Promise<ProductItem> => {
    return apiFetch<ProductItem>(`/products/${productId}/adjust-stock`, {
      method: "POST",
      body: JSON.stringify({ adjustment, reason }),
    });
  },
};

export const pricingAPI = {
  update: async (
    productId: number,
    payload: {
      mrp?: number;
      customer_price?: number;
      distributor_price?: number;
      bulk_price?: number;
      bulk_moq?: number;
    }
  ): Promise<ProductItem> => {
    return apiFetch<ProductItem>(`/pricing/${productId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

export const usersAPI = {
  list: async (role?: string, search?: string) => {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    if (search) params.append("search", search);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<any[]>(`/users${query}`);
  },

  create: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: "ADMIN" | "DISTRIBUTOR" | "CUSTOMER";
    company_name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => {
    return apiFetch<any>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateRole: async (userId: number, role: "ADMIN" | "DISTRIBUTOR" | "CUSTOMER") => {
    return apiFetch<any>(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  toggleStatus: async (userId: number) => {
    return apiFetch<any>(`/users/${userId}/toggle-status`, {
      method: "PATCH",
    });
  },

  updateCreditLimit: async (userId: number, creditLimit: number) => {
    return apiFetch<any>(`/users/${userId}/credit-limit`, {
      method: "PATCH",
      body: JSON.stringify({ credit_limit: creditLimit }),
    });
  },
};



export const ordersAPI = {
  create: async (payload: OrderCreatePayload): Promise<OrderData> => {
    return apiFetch<OrderData>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMyOrders: async (): Promise<OrderData[]> => {
    return apiFetch<OrderData[]>("/orders/my-orders");
  },

  getAdminAllOrders: async (orderStatus?: string, search?: string): Promise<OrderData[]> => {
    const params = new URLSearchParams();
    if (orderStatus && orderStatus !== "All") params.append("order_status", orderStatus);
    if (search) params.append("search", search);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<OrderData[]>(`/orders/admin/all${query}`);
  },

  getOrder: async (orderId: number | string): Promise<OrderData> => {
    return apiFetch<OrderData>(`/orders/${orderId}`);
  },

  updateStatus: async (orderId: number, orderStatus: string, adminNotes?: string, trackingNumber?: string): Promise<OrderData> => {
    return apiFetch<OrderData>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        order_status: orderStatus,
        admin_notes: adminNotes,
        tracking_number: trackingNumber,
      }),
    });
  },

  getInvoice: async (orderId: number): Promise<any> => {
    return apiFetch<any>(`/orders/${orderId}/invoice`);
  },

  cancelOrder: async (orderId: number): Promise<OrderData> => {
    return apiFetch<OrderData>(`/orders/${orderId}/cancel`, {
      method: "POST",
    });
  },

  requestReturn: async (orderId: number, reason?: string): Promise<OrderData> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return apiFetch<OrderData>(`/orders/${orderId}/return${query}`, {
      method: "POST",
    });
  },

  refundOrder: async (orderId: number, reason?: string, amount?: number): Promise<OrderData> => {
    return apiFetch<OrderData>(`/orders/${orderId}/admin-refund`, {
      method: "POST",
      body: JSON.stringify({ reason, amount }),
    });
  },
};

export const kycAPI = {
  getPending: async (): Promise<KYCOut[]> => {
    return apiFetch<KYCOut[]>("/kyc/pending");
  },

  submit: async (payload: {
    gst_number: string;
    drug_license_no: string;
    pan_number?: string;
    document_file_url?: string;
  }): Promise<KYCOut> => {
    return apiFetch<KYCOut>("/kyc/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  review: async (submissionId: number, status: "APPROVED" | "REJECTED", adminRemarks?: string, creditLimit?: number): Promise<KYCOut> => {
    return apiFetch<KYCOut>(`/kyc/${submissionId}/review`, {
      method: "POST",
      body: JSON.stringify({ status, admin_remarks: adminRemarks, credit_limit: creditLimit }),
    });
  },
};

export interface ReportPackItem {
  id: string;
  title: string;
  period: string;
  type: string;
  records_count: string;
  metric_value: string;
  desc: string;
  badge: string;
  badge_color: string;
}

export const reportsAPI = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return apiFetch<DashboardSummary>("/reports/dashboard");
  },

  getCommercialAnalytics: async (): Promise<{
    total_revenue: number;
    b2b_wholesale_revenue: number;
    retail_direct_revenue: number;
    b2b_percentage: number;
    retail_percentage: number;
    total_orders_count: number;
    avg_order_value: number;
    total_customers_registered: number;
    total_distributors_registered: number;
    recent_transactions: Array<{
      order_number: string;
      user_name: string;
      role: string;
      amount: number;
      date: string;
    }>;
  }> => {
    return apiFetch<any>("/reports/commercial-analytics");
  },

  getReportPacks: async (): Promise<ReportPackItem[]> => {
    return apiFetch<ReportPackItem[]>("/reports/packs");
  },
};


export interface PaymentPublicConfig {
  key_id: string;
  is_active: boolean;
  mode: string;
  currency: string;
  cod_enabled: boolean;
}

export interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface PaymentAdminSettings {
  id: number;
  gateway_name: string;
  key_id: string;
  key_secret_masked: string;
  is_active: boolean;
  mode: string;
  currency: string;
  cod_enabled: boolean;
  auto_capture: boolean;
  stripe_active?: boolean;
  stripe_mode?: string;
  stripe_publishable_key?: string;
  stripe_secret_masked?: string;
  paypal_active?: boolean;
  paypal_mode?: string;
  paypal_client_id?: string;
  paypal_secret_masked?: string;
  wire_enabled?: boolean;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
  updated_at?: string | null;
}

export interface PaymentAdminSettingsUpdate {
  key_id?: string;
  key_secret?: string;
  is_active?: boolean;
  mode?: string;
  currency?: string;
  cod_enabled?: boolean;
  stripe_active?: boolean;
  stripe_mode?: string;
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  paypal_active?: boolean;
  paypal_mode?: string;
  paypal_client_id?: string;
  paypal_secret?: string;
  wire_enabled?: boolean;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
}

export const paymentsAPI = {
  getConfig: async (): Promise<PaymentPublicConfig> => {
    return apiFetch<PaymentPublicConfig>("/payments/config");
  },

  createRazorpayOrder: async (
    items: Array<{ product_id: number; quantity: number }>,
    notes?: Record<string, any>
  ): Promise<RazorpayOrderResponse> => {
    return apiFetch<RazorpayOrderResponse>("/payments/create-razorpay-order", {
      method: "POST",
      body: JSON.stringify({ items, currency: "INR", notes }),
    });
  },

  verifyAndPlaceOrder: async (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    order_data: OrderCreatePayload;
  }): Promise<OrderData> => {
    return apiFetch<OrderData>("/payments/verify-and-order", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getAdminSettings: async (): Promise<PaymentAdminSettings> => {
    return apiFetch<PaymentAdminSettings>("/payments/admin/settings");
  },

  updateAdminSettings: async (payload: PaymentAdminSettingsUpdate): Promise<PaymentAdminSettings> => {
    return apiFetch<PaymentAdminSettings>("/payments/admin/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  user_email?: string | null;
  action: string;
  module: string;
  details?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export const auditAPI = {
  getLogs: async (module?: string, search?: string, limit = 50): Promise<AuditLogItem[]> => {
    const params = new URLSearchParams();
    if (module && module !== "all") params.append("module", module);
    if (search) params.append("search", search);
    if (limit) params.append("limit", limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<AuditLogItem[]>(`/audit${query}`);
  },
};

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  product_count?: number;
}

export const categoriesAPI = {
  list: async (): Promise<CategoryData[]> => {
    return apiFetch<CategoryData[]>("/categories");
  },
  create: async (payload: { name: string; slug?: string; description?: string; is_active?: boolean; sort_order?: number }): Promise<CategoryData> => {
    const slug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    return apiFetch<CategoryData>("/categories", {
      method: "POST",
      body: JSON.stringify({ ...payload, slug }),
    });
  },
  update: async (id: number, payload: Partial<CategoryData>): Promise<CategoryData> => {
    return apiFetch<CategoryData>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  delete: async (id: number): Promise<any> => {
    return apiFetch<any>(`/categories/${id}`, {
      method: "DELETE",
    });
  },
};

export interface NotificationSettingsData {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password_masked: string;
  sender_email: string;
  sender_name: string;
  email_enabled: boolean;
  sms_provider: string;
  sms_api_key_masked: string;
  sms_sender_id: string;
  sms_enabled: boolean;
  notify_order_created: boolean;
  notify_order_status: boolean;
  notify_kyc_status: boolean;
  updated_at?: string;
}

export interface NotificationLogItem {
  id: number;
  recipient: string;
  channel: "EMAIL" | "SMS";
  event_type: string;
  status: string;
  subject?: string | null;
  message_body: string;
  sent_at: string;
}

export const notificationsAPI = {
  getSettings: async (): Promise<NotificationSettingsData> => {
    return apiFetch<NotificationSettingsData>("/notifications/settings");
  },
  updateSettings: async (payload: Partial<NotificationSettingsData> & { smtp_password?: string; sms_api_key?: string }): Promise<NotificationSettingsData> => {
    return apiFetch<NotificationSettingsData>("/notifications/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  sendTestEmail: async (target: string): Promise<{ success: boolean; message: string; status: string }> => {
    return apiFetch("/notifications/test-email", {
      method: "POST",
      body: JSON.stringify({ target, channel: "EMAIL" }),
    });
  },
  sendTestSMS: async (target: string): Promise<{ success: boolean; message: string; status: string }> => {
    return apiFetch("/notifications/test-sms", {
      method: "POST",
      body: JSON.stringify({ target, channel: "SMS" }),
    });
  },
  getLogs: async (limit = 50): Promise<NotificationLogItem[]> => {
    return apiFetch<NotificationLogItem[]>(`/notifications/logs?limit=${limit}`);
  },
};



