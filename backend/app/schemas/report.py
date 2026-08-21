from typing import List, Optional
from pydantic import BaseModel


class DashboardSummaryOut(BaseModel):
    total_sales_today: float
    total_sales_all_time: float
    total_orders: int = 0
    orders_today: int
    orders_pending: int
    orders_delivered: int
    total_customers: int
    total_distributors: int
    pending_kyc_count: int
    total_products: int
    low_stock_count: int


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    module: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: str

    class Config:
        from_attributes = True


class CommercialAnalyticsOut(BaseModel):
    total_revenue: float
    b2b_wholesale_revenue: float
    retail_direct_revenue: float
    b2b_percentage: float
    retail_percentage: float
    total_orders_count: int
    avg_order_value: float
    total_customers_registered: int
    total_distributors_registered: int
    recent_transactions: List[dict]


class ReportPackItem(BaseModel):
    id: str
    title: str
    period: str
    type: str
    records_count: str
    metric_value: str
    desc: str
    badge: str
    badge_color: str

