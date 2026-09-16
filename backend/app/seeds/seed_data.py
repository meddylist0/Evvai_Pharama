from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, CustomerProfile, DistributorProfile, RetailerProfile, KYCStatus
from app.models.product import Category, Product
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.kyc import DistributorKYC
from app.models.audit import AuditLog


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@pharmalink.com").first():
            print("Database already contains seed data.")
            return

        print("Seeding database with EVVAI Pharma products, categories, and test accounts...")

        # 1. Seed Categories
        categories_data = [
            {
                "name": "Wellness & Sleep",
                "slug": "wellness-sleep",
                "description": "Formulations for restorative sleep, circadian balance, and everyday wellbeing.",
                "sort_order": 1
            },
            {
                "name": "Injectables",
                "slug": "injectables",
                "description": "Hospital-grade sterile injectables, vitamins, and critical care solutions.",
                "sort_order": 2
            },
            {
                "name": "Gastroenterology",
                "slug": "gastroenterology",
                "description": "Targeted gastro and hepatology medications for optimal digestive health.",
                "sort_order": 3
            },
            {
                "name": "Cardiology & Metabolic",
                "slug": "cardiology-metabolic",
                "description": "Hypertension, lipid-lowering, and cardiovascular health management.",
                "sort_order": 4
            },
            {
                "name": "Respiratory & Allergy",
                "slug": "respiratory-allergy",
                "description": "Antihistamines, bronchodilators, and allergy relief therapies.",
                "sort_order": 5
            },
            {
                "name": "Anti-Infectives & Antibiotics",
                "slug": "anti-infectives",
                "description": "Broad-spectrum oral and IV antimicrobials manufactured under cGMP.",
                "sort_order": 6
            }
        ]

        cat_map = {}
        for cat_item in categories_data:
            cat = Category(**cat_item)
            db.add(cat)
            db.flush()
            cat_map[cat.slug] = cat.id

        # 2. Seed Products (EVVAI Pharma Portfolio)
        products_data = [
            {
                "sku": "EVV-ZEN-001",
                "name": "Zene Melatonin Oral Spray",
                "subtitle": "Mint-flavoured fast-absorbing oral spray designed to support your bedtime routine.",
                "composition": "Melatonin Oral Formulation 5mg/ml",
                "pack_size": "30ml Sublingual Spray",
                "category_id": cat_map["wellness-sleep"],
                "description": "Zene Melatonin Oral Spray delivers rapid absorption through sublingual mucosa, ensuring non-habit forming relaxation and healthy sleep cycles.",
                "mrp": 450.0,
                "customer_price": 395.0,
                "distributor_price": 280.0,
                "bulk_price": 250.0,
                "bulk_moq": 40,
                "stock": 3500,
                "low_stock_threshold": 200,
                "batch_no": "EV2026-Z01",
                "expiry_date": "12/2028",
                "image": "/images/product_zene.png",
                "status": "active"
            },
            {
                "sku": "EVV-NXT-002",
                "name": "NXTNERve B12 Injection",
                "subtitle": "Mecobalamin 1500 mcg injection formulated to support nerve health & neuropathy.",
                "composition": "Mecobalamin 1500mcg / 2ml",
                "pack_size": "5 × 2ml Ampoules",
                "category_id": cat_map["injectables"],
                "description": "High-potency injectable Mecobalamin for rapid neural regeneration, diabetic neuropathy management, and severe B12 deficiency correction.",
                "mrp": 290.0,
                "customer_price": 245.0,
                "distributor_price": 175.0,
                "bulk_price": 155.0,
                "bulk_moq": 50,
                "stock": 4200,
                "low_stock_threshold": 300,
                "batch_no": "EV2026-N02",
                "expiry_date": "10/2028",
                "image": "/images/product_nxtnerve.png",
                "status": "active"
            },
            {
                "sku": "EVV-BIL-003",
                "name": "Bilevia-300 Tablets",
                "subtitle": "High-grade Ursodeoxycholic Acid formulation for liver & biliary support.",
                "composition": "Ursodeoxycholic Acid IP 300mg",
                "pack_size": "10 × 10 ALU-ALU",
                "category_id": cat_map["gastroenterology"],
                "description": "Indicated for the dissolution of radiolucent cholesterol gallstones and treatment of primary biliary cholangitis.",
                "mrp": 580.0,
                "customer_price": 510.0,
                "distributor_price": 380.0,
                "bulk_price": 345.0,
                "bulk_moq": 30,
                "stock": 2800,
                "low_stock_threshold": 250,
                "batch_no": "EV2026-B03",
                "expiry_date": "08/2028",
                "image": "/images/product_bilevia.png",
                "status": "active"
            },
            {
                "sku": "EVV-TEL-004",
                "name": "TelmiShield-40 Tablets",
                "subtitle": "High-efficacy Telmisartan 40mg for reliable 24-hour hypertension management.",
                "composition": "Telmisartan IP 40mg",
                "pack_size": "10 × 10 Strip",
                "category_id": cat_map["cardiology-metabolic"],
                "description": "Selective angiotensin II receptor antagonist for essential hypertension and reduction of cardiovascular morbidity.",
                "mrp": 210.0,
                "customer_price": 180.0,
                "distributor_price": 120.0,
                "bulk_price": 105.0,
                "bulk_moq": 60,
                "stock": 6500,
                "low_stock_threshold": 500,
                "batch_no": "EV2026-T04",
                "expiry_date": "05/2028",
                "image": "/images/product_telmi.png",
                "status": "active"
            },
            {
                "sku": "EVV-MON-005",
                "name": "Montair-LC Plus Syrup",
                "subtitle": "Montelukast + Levocetirizine combination for paediatric allergic rhinitis & asthma.",
                "composition": "Montelukast 4mg + Levocetirizine 2.5mg / 5ml",
                "pack_size": "60ml Pet Bottle",
                "category_id": cat_map["respiratory-allergy"],
                "description": "Palatable berry-flavoured dual-action oral suspension providing rapid relief from seasonal rhinitis and allergic asthma symptoms.",
                "mrp": 165.0,
                "customer_price": 145.0,
                "distributor_price": 95.0,
                "bulk_price": 82.0,
                "bulk_moq": 50,
                "stock": 1800,
                "low_stock_threshold": 150,
                "batch_no": "EV2026-M05",
                "expiry_date": "03/2028",
                "image": "/images/product_montair.png",
                "status": "active"
            },
            {
                "sku": "EVV-AZI-006",
                "name": "Azithro-500 Tablets",
                "subtitle": "Azithromycin 500mg broad spectrum macrolide antibiotic.",
                "composition": "Azithromycin Dihydrate IP 500mg",
                "pack_size": "1 × 3 Tablets Strip",
                "category_id": cat_map["anti-infectives"],
                "description": "Targeted 3-day antibiotic therapy for upper and lower respiratory tract infections, skin infections, and ENT conditions.",
                "mrp": 125.0,
                "customer_price": 110.0,
                "distributor_price": 72.0,
                "bulk_price": 64.0,
                "bulk_moq": 100,
                "stock": 5100,
                "low_stock_threshold": 400,
                "batch_no": "EV2026-A06",
                "expiry_date": "09/2028",
                "image": "/images/product_azithro.png",
                "status": "active"
            }
        ]

        from app.services.inventory_service import record_inventory_receipt

        created_products = []
        for p_item in products_data:
            init_batch_no = p_item.get("batch_no") or "EV2026-INIT"
            init_expiry = p_item.get("expiry_date") or "12/2028"
            init_stock = p_item.get("stock", 0)

            p_item["stock"] = 0
            p_item["batch_no"] = None
            p_item["expiry_date"] = None

            prod = Product(**p_item)
            db.add(prod)
            db.flush()

            if init_stock > 0 and init_batch_no and init_expiry:
                record_inventory_receipt(
                    db=db,
                    product=prod,
                    batch_no=init_batch_no,
                    expiry_date=init_expiry,
                    quantity=init_stock,
                    reason="Initial Seed Stock Receipt"
                )
            created_products.append(prod)

        # 3. Seed Users
        # Admin User
        admin = User(
            email="admin@pharmalink.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Dr. Arun Bhairi (Chief Administrator)",
            phone="+91 9876543210",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.flush()

        # Distributor User
        distributor = User(
            email="distributor@medplus.com",
            hashed_password=get_password_hash("Dist@123"),
            full_name="Rajesh Sharma (MedPlus Healthcare Hub)",
            phone="+91 9849012345",
            role=UserRole.DISTRIBUTOR,
            is_active=True,
            is_verified=True
        )
        db.add(distributor)
        db.flush()

        dist_profile = DistributorProfile(
            user_id=distributor.id,
            company_name="MedPlus Healthcare Distribution Ltd",
            distributor_name="Rajesh Sharma",
            gstin="36AAACR1234F1Z9",
            drug_license_no="DL-HYD-2024-88412",
            business_address="Plot 12, IDA Uppal Industrial Area",
            city="Hyderabad",
            state="Telangana",
            pincode="500039",
            kyc_status=KYCStatus.APPROVED
        )
        db.add(dist_profile)
        db.flush()

        # Add KYC Record
        kyc_record = DistributorKYC(
            distributor_id=dist_profile.id,
            gst_number="36AAACR1234F1Z9",
            drug_license_no="DL-HYD-2024-88412",
            pan_number="AAACR1234F",
            verification_status=KYCStatus.APPROVED,
            admin_remarks="All pharmaceutical licenses verified with State DCA.",
            verified_by_user_id=admin.id
        )
        db.add(kyc_record)

        # Pending KYC Distributor
        pending_dist = User(
            email="apollo.dist@apollopharm.com",
            hashed_password=get_password_hash("Apollo@123"),
            full_name="Suresh Verma (Apollo Logistics)",
            phone="+91 9700011223",
            role=UserRole.DISTRIBUTOR,
            is_active=True,
            is_verified=False
        )
        db.add(pending_dist)
        db.flush()

        pending_dist_profile = DistributorProfile(
            user_id=pending_dist.id,
            company_name="Apollo Pharma Supply Chain Pvt Ltd",
            distributor_name="Suresh Verma",
            gstin="36AABCA9876C1Z2",
            drug_license_no="DL-SEC-2025-10492",
            business_address="Secunderabad Pharma Hub, Phase 2",
            city="Secunderabad",
            state="Telangana",
            pincode="500003",
            kyc_status=KYCStatus.PENDING
        )
        db.add(pending_dist_profile)
        db.flush()

        pending_kyc = DistributorKYC(
            distributor_id=pending_dist_profile.id,
            gst_number="36AABCA9876C1Z2",
            drug_license_no="DL-SEC-2025-10492",
            pan_number="AABCA9876C",
            verification_status=KYCStatus.PENDING
        )
        db.add(pending_kyc)

        # Retail Customer User
        customer = User(
            email="customer@gmail.com",
            hashed_password=get_password_hash("Cust@123"),
            full_name="Kavita Reddy",
            phone="+91 9988776655",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )
        db.add(customer)
        db.flush()

        cust_profile = CustomerProfile(
            user_id=customer.id,
            address="Flat 402, Green Meadows, Madhapur",
            city="Hyderabad",
            state="Telangana",
            pincode="500081"
        )
        db.add(cust_profile)
        db.flush()

        # Retailer (Pharmacy Shop) User
        retailer = User(
            email="retailer@evvaipharma.com",
            hashed_password=get_password_hash("retailer123"),
            full_name="Srikanth Reddy (Srikanth MedPlus Pharmacy)",
            phone="+91 9876501234",
            role=UserRole.RETAILER,
            is_active=True,
            is_verified=True
        )
        db.add(retailer)
        db.flush()

        ret_profile = RetailerProfile(
            user_id=retailer.id,
            shop_name="Srikanth MedPlus Medical & General Store",
            owner_name="Srikanth Reddy",
            gstin="36AABCS4321E1Z5",
            drug_license_no="DL-HYD-20B-77491",
            shop_address="Shop #4, Main Road, KPHB Colony",
            city="Hyderabad",
            state="Telangana",
            pincode="500072",
            kyc_status=KYCStatus.APPROVED,
            credit_limit=100000.0
        )
        db.add(ret_profile)
        db.flush()

        # 4. Seed Initial Orders
        # Order 1: Customer retail order
        p1 = created_products[0]
        order1 = Order(
            order_code="ORD-260819-1001",
            user_id=customer.id,
            role="Retail Customer",
            subtotal=790.0,
            discount_amount=0.0,
            tax_amount=94.8,
            shipping_charge=50.0,
            total_amount=934.8,
            order_status=OrderStatus.PACKED,
            payment_status=PaymentStatus.PAID,
            payment_method="UPI",
            customer_name="Kavita Reddy",
            customer_phone="+91 9988776655",
            delivery_address="Flat 402, Green Meadows, Madhapur",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500081",
            invoice_number="INV-EVV-2026-1001",
            items=[
                OrderItem(
                    product_id=p1.id,
                    product_name=p1.name,
                    sku=p1.sku,
                    batch_no=p1.batch_no,
                    unit_price=395.0,
                    quantity=2,
                    total_price=790.0
                )
            ]
        )
        db.add(order1)

        # Order 2: Distributor bulk order
        p2 = created_products[1]
        p3 = created_products[2]
        order2 = Order(
            order_code="ORD-260819-2002",
            user_id=distributor.id,
            role="Distributor",
            subtotal=18100.0,
            discount_amount=0.0,
            tax_amount=2172.0,
            shipping_charge=0.0,
            total_amount=20272.0,
            order_status=OrderStatus.CONFIRMED,
            payment_status=PaymentStatus.PAID,
            payment_method="NEFT / Net Banking",
            customer_name="MedPlus Healthcare Distribution Ltd",
            customer_phone="+91 9849012345",
            gstin="36AAACR1234F1Z9",
            delivery_address="Plot 12, IDA Uppal Industrial Area",
            delivery_city="Hyderabad",
            delivery_state="Telangana",
            delivery_pincode="500039",
            invoice_number="INV-EVV-2026-2002",
            items=[
                OrderItem(
                    product_id=p2.id,
                    product_name=p2.name,
                    sku=p2.sku,
                    batch_no=p2.batch_no,
                    unit_price=155.0,  # bulk tier
                    quantity=50,
                    total_price=7750.0
                ),
                OrderItem(
                    product_id=p3.id,
                    product_name=p3.name,
                    sku=p3.sku,
                    batch_no=p3.batch_no,
                    unit_price=345.0,  # bulk tier
                    quantity=30,
                    total_price=10350.0
                )
            ]
        )
        db.add(order2)

        # 5. Seed Initial Audit Log
        db.add(
            AuditLog(
                user_id=admin.id,
                action="SYSTEM_INIT",
                module="SYSTEM",
                details="PharmaLink enterprise database initialized and seeded successfully with EVVAI portfolio."
            )
        )

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
