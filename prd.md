PHARMACEUTICAL MANUFACTURING COMPANY
B2B + B2C DIGITAL ORDERING PLATFORM
Product Requirements Document (PRD)
Screen-by-Screen Functional Specification
 
1. Product Overview
Phase 1 is a digital ordering platform for a pharmaceutical manufacturing company. The initial business model supports direct retail customer sales and distributor order placement. The same product can have different prices for distributors and retail customers. The architecture should remain scalable for future ERP, manufacturing, quality, finance, regulatory and AI modules.
1.1 User Roles
•	Administrator
•	Distributor
•	Retail Customer
•	Sales Executive (future phase)
2. Core Business Rules
2.1 Role-Based Pricing
•	MRP
•	Distributor Price
•	Retail Customer Price
•	Promotional Price
•	Bulk Order Price
The system automatically selects the applicable price according to the logged-in user's role and configured pricing rules.
2.2 Order Status
•	Pending
•	Confirmed
•	Packed
•	Shipped
•	Delivered
•	Cancelled
•	Returned
3. Corporate Website
W001 — Home Page
Purpose: Introduce the company and drive visitors to products and enquiries.
Screen Elements:
•	Logo and navigation
•	Hero banner
•	About summary
•	Manufacturing capabilities
•	Certifications
•	Product categories
•	Featured products
•	Quality assurance
•	Third-party manufacturing CTA
•	Contact section
•	Footer
Primary Actions:
•	View Products
•	Customer Login
•	Distributor Login
•	Contact Us
W002 — About Us
Purpose: Explain company background and identity.
Screen Elements:
•	Company introduction
•	History
•	Vision
•	Mission
•	Core values
•	Leadership
•	Capabilities
Primary Actions:
•	Explore Products
W003 — Manufacturing Facilities
Purpose: Show manufacturing infrastructure.
Screen Elements:
•	Facility name
•	Location
•	Capacity
•	Manufacturing categories
•	Images
•	Quality information
Primary Actions:
•	View Facility
W004 — Certifications
Purpose: Display quality certifications.
Screen Elements:
•	Certification name
•	Certificate number/details
•	Issue date
•	Expiry date
•	Certificate document/image
Primary Actions:
•	View Certificate
W005 — Products Catalogue
Purpose: Allow visitors and logged-in users to discover products.
Screen Elements:
•	Search
•	Category filter
•	Product cards
•	Product image
•	Product name
•	Composition
•	Pack size
•	Availability
Primary Actions:
•	View Product
•	Login to Purchase
W006 — Product Details
Purpose: Show complete product information and applicable pricing.
Screen Elements:
•	Product image
•	Product name
•	Composition
•	Description
•	Category
•	Pack size
•	Availability
•	MRP
•	Applicable customer/distributor price
•	Offer/bulk price
Primary Actions:
•	Add to Cart
•	Buy Now
W007 — Third-Party / Contract Manufacturing
Purpose: Receive manufacturing enquiries.
Screen Elements:
•	Company
•	Contact person
•	Phone
•	Email
•	Product requirement
•	Expected quantity
•	Message
Primary Actions:
•	Submit Enquiry
W008 — R&D
Purpose: Present research and product-development capabilities.
Screen Elements:
•	R&D overview
•	Formulation/development capabilities
•	Research highlights
W009 — Quality Assurance
Purpose: Present quality policies and capabilities.
Screen Elements:
•	Quality policy
•	Quality systems
•	Testing information
•	Certifications
W010 — Careers
Purpose: Publish vacancies and receive applications.
Screen Elements:
•	Job title
•	Department
•	Location
•	Experience
•	Employment type
•	Job description
•	Resume upload
Primary Actions:
•	Apply
W011 — News & Media
Purpose: Publish company news and announcements.
Screen Elements:
•	News listing
•	Date
•	Image
•	Detail page
•	Related news
Primary Actions:
•	Read More
W012 — Contact Us
Purpose: Allow visitors to contact the company.
Screen Elements:
•	Name
•	Email
•	Phone
•	Company
•	Subject
•	Message
•	Address
•	Map
Primary Actions:
•	Submit
4. Customer Web Portal
C001 — Registration
Purpose: Create a retail customer account.
Screen Elements:
•	First name
•	Last name
•	Mobile
•	Email
•	Password
•	Confirm password
•	Address
•	City
•	State
•	Pincode
Primary Actions:
•	Create Account
•	OTP Verification
C002 — Login
Purpose: Authenticate a customer.
Screen Elements:
•	Mobile/email
•	Password
•	Forgot password
•	Create account
Primary Actions:
•	Login
C003 — Dashboard
Purpose: Give the customer a summary of activity.
Screen Elements:
•	Greeting
•	Pending orders
•	Delivered orders
•	Recent orders
•	Recommended products
•	Profile shortcut
Primary Actions:
•	Shop Now
•	View Orders
C004 — Product Catalogue
Purpose: Browse products for purchase.
Screen Elements:
•	Search
•	Categories
•	Availability filter
•	Price filter
•	Sort
•	Product cards
Primary Actions:
•	View Product
•	Add to Cart
C005 — Product Details
Purpose: Review a product before purchase.
Screen Elements:
•	Image
•	Name
•	Composition
•	Pack size
•	Description
•	MRP
•	Customer price
•	Offer price
•	Quantity
•	Availability
Primary Actions:
•	Add to Cart
•	Buy Now
C006 — Shopping Cart
Purpose: Review products before checkout.
Screen Elements:
•	Product
•	Quantity
•	Price
•	Subtotal
•	Discount
•	Shipping
•	Tax
•	Grand total
Primary Actions:
•	Update
•	Remove
•	Proceed to Checkout
C007 — Checkout
Purpose: Collect delivery and payment information.
Screen Elements:
•	Delivery address
•	Order summary
•	Subtotal
•	Discount
•	Tax
•	Total
•	UPI/cards/net banking/wallet/COD if enabled
Primary Actions:
•	Place Order
•	Pay Now
C008 — Order Success
Purpose: Confirm order placement.
Screen Elements:
•	Success message
•	Order ID
•	Amount
•	Expected delivery
Primary Actions:
•	Track Order
•	Continue Shopping
C009 — My Orders
Purpose: Display order history.
Screen Elements:
•	All
•	Pending
•	Confirmed
•	Packed
•	Shipped
•	Delivered
•	Cancelled
•	Returned
•	Search/filter
Primary Actions:
•	View Order
•	Reorder
C010 — Order Details
Purpose: Show complete order information.
Screen Elements:
•	Order ID
•	Date
•	Payment status
•	Items
•	Quantity
•	Price
•	Delivery address
•	Timeline
Primary Actions:
•	Track
•	Download Invoice
•	Reorder
C011 — Reorder
Purpose: Repeat a previous purchase.
Screen Elements:
•	Previous items
•	Current availability
•	Current applicable price
Primary Actions:
•	Add Available Items to Cart
C012 — Wishlist
Purpose: Save products for later.
Screen Elements:
•	Saved products
•	Price
•	Availability
Primary Actions:
•	Add to Cart
•	Remove
C013 — Profile
Purpose: Manage account information.
Screen Elements:
•	Personal details
•	Mobile
•	Email
•	Address
•	Password
•	Notification preferences
Primary Actions:
•	Save
C014 — Notifications
Purpose: Display customer notifications.
Screen Elements:
•	Order confirmation
•	Payment confirmation
•	Shipping update
•	Delivery update
•	Promotional offers
Primary Actions:
•	Open Notification
5. Distributor Portal
D001 — Distributor Registration
Purpose: Collect distributor details for verification.
Screen Elements:
•	Company name
•	Distributor name
•	Mobile
•	Email
•	GST number
•	Business address
•	State
•	City
•	Pincode
•	KYC/business documents
Primary Actions:
•	Submit for Verification
D002 — Distributor Login
Purpose: Authenticate an approved distributor.
Screen Elements:
•	Mobile/email
•	Password
•	Forgot password
Primary Actions:
•	Login
D003 — Distributor Dashboard
Purpose: Provide ordering and business summary.
Screen Elements:
•	Today's orders
•	Pending orders
•	Delivered orders
•	Total orders
•	Purchase value
•	Quick actions
Primary Actions:
•	New Order
•	Products
•	Orders
•	Invoices
D004 — Distributor Product Catalogue
Purpose: Show products using distributor pricing.
Screen Elements:
•	Search
•	Categories
•	Product image
•	Composition
•	Pack size
•	Stock
•	Distributor price
•	Bulk price
Primary Actions:
•	View Product
•	Add to Order
D005 — Distributor Product Details
Purpose: Show distributor-specific pricing.
Screen Elements:
•	Image
•	Product name
•	Composition
•	Pack size
•	Available stock
•	MRP
•	Distributor price
•	Bulk pricing
•	Quantity
Primary Actions:
•	Add to Order
•	Buy Now
D006 — Distributor Cart
Purpose: Review distributor order.
Screen Elements:
•	Product
•	Quantity
•	Distributor price
•	Discount
•	Subtotal
•	Tax
•	Total
Primary Actions:
•	Update
•	Remove
•	Proceed
D007 — Distributor Checkout
Purpose: Confirm delivery and order.
Screen Elements:
•	Delivery address
•	Items
•	Distributor pricing
•	Discount
•	Tax
•	Total
•	Payment method
Primary Actions:
•	Place Order
D008 — Distributor Orders
Purpose: Track distributor orders.
Screen Elements:
•	All
•	Pending
•	Confirmed
•	Packed
•	Shipped
•	Delivered
•	Cancelled
•	Returned
Primary Actions:
•	View Order
D009 — Distributor Order Details
Purpose: Show complete order information.
Screen Elements:
•	Order ID
•	Date
•	Products
•	Quantity
•	Price
•	Total
•	Delivery address
•	Payment status
•	Timeline
Primary Actions:
•	Download Invoice
•	Reorder
D010 — Distributor Invoice
Purpose: Provide invoice information and PDF.
Screen Elements:
•	Company details
•	GST
•	Distributor details
•	Invoice number
•	Invoice date
•	Products
•	HSN
•	Quantity
•	Rate
•	Tax
•	Discount
•	Total
Primary Actions:
•	Download PDF
D011 — Distributor Order History
Purpose: Search previous purchases.
Screen Elements:
•	Order ID
•	Date
•	Product
•	Status
•	Amount
Primary Actions:
•	View
•	Download Invoice
•	Reorder
D012 — Distributor Profile
Purpose: Manage business account information.
Screen Elements:
•	Company details
•	Contact
•	GST
•	Address
•	Documents
•	Password
Primary Actions:
•	Save
6. Admin Panel
A001 — Admin Login
Purpose: Securely authenticate administrators.
Screen Elements:
•	Email
•	Password
•	MFA/OTP
•	Forgot password
Primary Actions:
•	Login
A002 — Dashboard
Purpose: Give management a complete business summary.
Screen Elements:
•	Today's orders
•	Today's sales
•	Pending orders
•	Delivered orders
•	Customers
•	Distributors
•	Products
•	Low stock
•	Sales charts
•	Order status chart
•	Recent orders
Primary Actions:
•	Open Orders
•	Open Products
•	Reports
A003 — Category Management
Purpose: Manage product categories.
Screen Elements:
•	Category name
•	Description
•	Image
•	Status
•	Sort order
Primary Actions:
•	Add
•	Edit
•	Disable
A004 — Product Management
Purpose: Create and manage products.
Screen Elements:
•	Product name
•	Product code/SKU
•	Category
•	Composition
•	Description
•	Pack size
•	Images
•	Stock
•	Status
Primary Actions:
•	Add
•	Edit
•	Disable
A005 — Pricing Management
Purpose: Configure all product price levels.
Screen Elements:
•	MRP
•	Distributor price
•	Customer price
•	Offer price
•	Bulk price
•	Bulk quantity
•	Offer dates
Primary Actions:
•	Save Pricing
•	Enable/Disable Offer
A006 — Inventory Management
Purpose: Monitor product stock.
Screen Elements:
•	Product
•	Available quantity
•	Reserved quantity
•	Low-stock threshold
•	Status
•	Optional batch information
Primary Actions:
•	Add Stock
•	Adjust Stock
•	View History
A007 — Order Management
Purpose: Control the full order lifecycle.
Screen Elements:
•	Order ID
•	Customer/distributor
•	Items
•	Amount
•	Payment status
•	Order status
•	Delivery address
•	Timeline
Primary Actions:
•	Confirm
•	Pack
•	Ship
•	Deliver
•	Cancel
•	Return
A008 — Customer Management
Purpose: Manage retail customer accounts.
Screen Elements:
•	Customer list
•	Search
•	Profile
•	Order history
•	Status
•	Address
Primary Actions:
•	View
•	Edit
•	Activate
•	Deactivate
A009 — Distributor Management
Purpose: Manage distributor accounts.
Screen Elements:
•	Distributor list
•	Company
•	GST
•	KYC status
•	Account status
•	Order history
Primary Actions:
•	Approve
•	Reject
•	Activate
•	Deactivate
•	View
A010 — KYC Verification
Purpose: Review distributor documents.
Screen Elements:
•	Submitted documents
•	Business information
•	Verification status
•	Admin remarks
Primary Actions:
•	Approve
•	Reject
•	Request Correction
A011 — Payment Management
Purpose: Review payment transactions.
Screen Elements:
•	Transaction ID
•	Order ID
•	User
•	Amount
•	Method
•	Status
•	Date
Primary Actions:
•	View
•	Export
A012 — Invoice Management
Purpose: Manage invoices.
Screen Elements:
•	Invoice number
•	Order ID
•	Customer/distributor
•	Amount
•	Date
•	Status
Primary Actions:
•	View
•	Download
A013 — Notification Management
Purpose: Send platform notifications.
Screen Elements:
•	Title
•	Message
•	Audience
•	Channel
•	Schedule/status
Primary Actions:
•	Send
•	Schedule
A014 — Reports & Analytics
Purpose: Provide business reporting.
Screen Elements:
•	Daily sales
•	Monthly sales
•	Distributor sales
•	Customer sales
•	Top products
•	Product performance
•	Revenue reports
Primary Actions:
•	Filter
•	Export
A015 — Admin Users & Roles
Purpose: Control administrative permissions.
Screen Elements:
•	Admin users
•	Roles
•	Permissions
•	Status
•	Last login
Primary Actions:
•	Add User
•	Assign Role
•	Disable
A016 — Audit Logs
Purpose: Record important system/admin actions.
Screen Elements:
•	User
•	Action
•	Module
•	Timestamp
•	IP/device where configured
Primary Actions:
•	Search
•	Filter
•	Export
A017 — System Settings
Purpose: Manage platform configuration.
Screen Elements:
•	Company details
•	GST/tax settings
•	Order settings
•	Payment settings
•	Notification settings
•	Low-stock settings
•	Terms/policies
Primary Actions:
•	Save
7. Mobile Applications
7.1 Customer App
•	Splash
•	Onboarding
•	Login/Register
•	OTP
•	Home
•	Categories
•	Catalogue
•	Product Details
•	Cart
•	Checkout
•	Payment
•	Order Success
•	My Orders
•	Order Tracking
•	Wishlist
•	Notifications
•	Profile
•	Settings
7.2 Distributor App
•	Splash
•	Login
•	Dashboard
•	Product Catalogue
•	Distributor Pricing
•	Product Details
•	Cart
•	Checkout
•	Orders
•	Order Tracking
•	Invoices
•	Reorder
•	Notifications
•	Profile
8. Notification System
•	Email notifications
•	SMS notifications
•	Push notifications
•	Order confirmation
•	Payment confirmation
•	Shipping updates
•	Delivery updates
•	Promotional offers
•	New product launch
•	Low-stock admin alert
•	New distributor/KYC alert
9. Core Database Entities
•	Users
•	Roles
•	Customers
•	Distributors
•	Distributor Documents
•	Categories
•	Products
•	Product Images
•	Product Pricing
•	Bulk Pricing Rules
•	Inventory
•	Orders
•	Order Items
•	Payments
•	Invoices
•	Addresses
•	Wishlist
•	Notifications
•	Offers/Coupons
•	Audit Logs
•	System Settings
10. API Modules
•	Authentication API
•	User API
•	Customer API
•	Distributor API
•	Category API
•	Product API
•	Pricing API
•	Inventory API
•	Cart API
•	Order API
•	Payment API
•	Invoice API
•	Notification API
•	Report API
•	Admin API
•	Audit API
11. Security
•	Secure authentication
•	Role-based access control
•	Password hashing
•	HTTPS
•	Token/session management
•	MFA/OTP support
•	Audit logs
•	Secure payment integration
•	Database backup
•	Admin permission controls
•	Document access controls
12. Technology Architecture
Web: React.js
Mobile: Flutter for Android and iOS
Backend: Python & NodeJS, according to the supplied proposal
Database: PostgreSQL & MySQL, according to the supplied proposal
Cache: Redis
Storage: AWS S3 / Azure Blob-compatible object storage
API: REST API
Authentication: OAuth 2.0 + Multi-Factor Authentication
Deployment: AWS / Azure / On-Premises
13. Future Phase 2 – ERP Expansion
The initial platform should be designed so future modules can be added without rebuilding the core platform.
•	Production Management
•	Batch Manufacturing Records (BMR)
•	Batch Packing Records (BPR)
•	Quality Control
•	Quality Assurance
•	Procurement
•	Warehouse Management
•	Finance & Accounts
•	Human Resources
•	CRM
•	Regulatory Affairs
•	Manufacturing Planning
•	Barcode & QR Management
14. Future Phase 3 – AI & Analytics
•	AI Demand Forecasting
•	AI Inventory Prediction
•	AI Sales Forecasting
•	AI Customer Chatbot
•	AI Document Search
•	AI Compliance Alerts
•	Executive Business Dashboard
15. Development Roadmap
Phase	Module	Duration	Main Scope
1	Planning & UI/UX	2 Weeks	Requirements, database, wireframes, UI/UX, architecture
2	Website	2 Weeks	Corporate website, catalogue, contact, SEO
3	Backend APIs	3 Weeks	Auth, product, pricing, order, customer and distributor APIs
4	Admin Panel	2 Weeks	Dashboard, products, pricing, inventory, orders, reports
5	Mobile Apps	3 Weeks	Android/iOS customer and distributor modules
6	Testing & Deployment	1 Week	Functional, security, performance testing, deployment and training
The supplied proposal estimates approximately 10–12 weeks for the initial platform, subject to final requirements, design approval, integrations and testing.
16. Phase 1 Acceptance Criteria
•	Admin can create, edit and disable products.
•	Admin can configure MRP, customer price, distributor price, offers and bulk pricing.
•	Customers can register and log in.
•	Distributors can register and be approved.
•	Customers see customer pricing.
•	Distributors see distributor pricing.
•	Customers can add products to cart and place orders.
•	Distributors can add products to cart and place orders.
•	Admin can manage every order status.
•	Inventory can be viewed and adjusted.
•	Customers and distributors can view order history.
•	Invoices can be generated and downloaded.
•	Online payments can be integrated through the selected gateway.
•	Notifications can be generated for configured order events.
•	Admin can view sales and order reports.
•	Web and mobile applications use common backend APIs.
•	Role-based access prevents users from accessing unauthorized modules.
17. Out of Scope for Phase 1
•	Full pharmaceutical manufacturing ERP
•	BMR/BPR workflows
•	Advanced QC/QA system
•	Full regulatory affairs system
•	Payroll and HR ERP
•	Advanced CRM
•	Field sales/GPS automation
•	AI demand forecasting
•	AI quality defect detection
•	Advanced manufacturing planning
18. Final Product Structure
•	Corporate Website
•	Customer Web Portal
•	Distributor Web Portal
•	Customer Android/iOS App
•	Distributor Android/iOS App
•	Admin Web Panel
•	Backend REST APIs
•	Database
•	Object Storage
•	Notification Services
•	Payment Gateway
This Phase 1 solution provides the pharmaceutical company with a centralized B2B + B2C ordering platform for direct customers and distributors, role-based pricing, product management, inventory, orders, payments, invoices, notifications and reporting. The architecture is intended to support future ERP and AI expansion.
End of Product Requirements Document
