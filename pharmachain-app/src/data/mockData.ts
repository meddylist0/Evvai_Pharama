export interface Product {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  composition: string;
  packSize: string;
  category: string;
  mrp: number;
  customerPrice: number;
  distributorPrice: number;
  bulkPrice: number;
  bulkMoq: number;
  stock: number;
  batchNo: string;
  expiryDate: string;
  image: string;
  status: "active" | "disabled";
}

export interface Order {
  id: string;
  customerName: string;
  role: "Retail Customer" | "Distributor";
  itemsCount: number;
  totalAmount: number;
  orderDate: string;
  paymentStatus: "Paid" | "Pending" | "COD";
  orderStatus: "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
  gstin?: string;
  deliveryCity: string;
}

export interface KYCRequest {
  id: string;
  companyName: string;
  distributorName: string;
  mobile: string;
  email: string;
  gstNumber: string;
  drugLicenseNo: string;
  city: string;
  state: string;
  submittedDate: string;
  status: "Pending" | "Approved" | "Rejected";
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "P001",
    sku: "EVV-ZEN-001",
    name: "Zene Melatonin Oral Spray",
    subtitle: "Mint-flavoured fast-absorbing oral spray designed to support your bedtime routine.",
    composition: "Melatonin Oral Formulation",
    packSize: "30ml Sublingual Spray",
    category: "Wellness & Sleep",
    mrp: 450,
    customerPrice: 395,
    distributorPrice: 280,
    bulkPrice: 250,
    bulkMoq: 40,
    stock: 3500,
    batchNo: "EV2026-Z01",
    expiryDate: "12/2028",
    image: "/images/product_zene.png",
    status: "active",
  },
  {
    id: "P002",
    sku: "EVV-NXT-002",
    name: "NXTNERve B12 Injection",
    subtitle: "Mecobalamin 1500 mcg injection formulated to support nerve health & neuropathy.",
    composition: "Mecobalamin 1500mcg / 2ml",
    packSize: "5 × 2ml Ampoules",
    category: "Injectables",
    mrp: 290,
    customerPrice: 245,
    distributorPrice: 175,
    bulkPrice: 155,
    bulkMoq: 50,
    stock: 4200,
    batchNo: "EV2026-N02",
    expiryDate: "10/2028",
    image: "/images/product_nxtnerve.png",
    status: "active",
  },
  {
    id: "P003",
    sku: "EVV-BIL-003",
    name: "Bilevia-300 Tablets",
    subtitle: "High-grade Ursodeoxycholic Acid formulation for liver & biliary support.",
    composition: "Ursodeoxycholic Acid 300mg",
    packSize: "10 × 10 ALU-ALU",
    category: "Gastroenterology",
    mrp: 580,
    customerPrice: 510,
    distributorPrice: 380,
    bulkPrice: 345,
    bulkMoq: 30,
    stock: 2800,
    batchNo: "EV2026-B03",
    expiryDate: "08/2028",
    image: "/images/product_bilevia.jpg",
    status: "active",
  },
  {
    id: "P004",
    sku: "EVV-OVA-004",
    name: "Evi-Ova Softgel & Tablets",
    subtitle: "Comprehensive hormonal balance & reproductive wellness formulation.",
    composition: "Myo-Inositol + D-Chiro Inositol + L-Methylfolate",
    packSize: "10 × 10 Strips",
    category: "Women's Health",
    mrp: 690,
    customerPrice: 620,
    distributorPrice: 460,
    bulkPrice: 420,
    bulkMoq: 25,
    stock: 1900,
    batchNo: "EV2026-O04",
    expiryDate: "09/2028",
    image: "/images/product_evi_ova.jpg",
    status: "active",
  },
  {
    id: "P005",
    sku: "EVV-GES-005",
    name: "Gestogen-Pro 200 SR",
    subtitle: "Natural Micronised Progesterone sustained-release for clinical gynecological care.",
    composition: "Micronised Progesterone 200mg SR",
    packSize: "10 × 10 Blister",
    category: "Gynecology",
    mrp: 620,
    customerPrice: 550,
    distributorPrice: 410,
    bulkPrice: 375,
    bulkMoq: 30,
    stock: 2400,
    batchNo: "EV2026-G05",
    expiryDate: "11/2027",
    image: "/images/product_gestogen.jpg",
    status: "active",
  },
  {
    id: "P006",
    sku: "EVV-LIF-006",
    name: "NXTLife-600 Glutathione",
    subtitle: "Potent cellular antioxidant & skin radiance tablets with Vitamin C.",
    composition: "L-Glutathione 600mg + Vitamin C 100mg",
    packSize: "30 Tablets Bottle",
    category: "Dermatology",
    mrp: 850,
    customerPrice: 760,
    distributorPrice: 540,
    bulkPrice: 490,
    bulkMoq: 20,
    stock: 3100,
    batchNo: "EV2026-L06",
    expiryDate: "07/2028",
    image: "/images/product_nxtlife.jpg",
    status: "active",
  },
  {
    id: "P007",
    sku: "EVV-GLI-007",
    name: "Evglip-Met 50/500",
    subtitle: "Dual action glycemic control therapy for type-2 diabetes management.",
    composition: "Teneligliptin 20mg + Metformin 500mg SR",
    packSize: "10 × 10 Strips",
    category: "Diabetology",
    mrp: 320,
    customerPrice: 280,
    distributorPrice: 200,
    bulkPrice: 180,
    bulkMoq: 50,
    stock: 4500,
    batchNo: "EV2026-M07",
    expiryDate: "05/2028",
    image: "/images/product_evglip.jpg",
    status: "active",
  },
  {
    id: "P008",
    sku: "EVV-FER-008",
    name: "Fervon-XT Hematinic",
    subtitle: "High bioavailability iron supplement with Folic Acid & Zinc.",
    composition: "Ferrous Ascorbate 100mg + Folic Acid 1.5mg + Zinc 22.5mg",
    packSize: "10 × 10 Strips",
    category: "Nutraceuticals",
    mrp: 210,
    customerPrice: 185,
    distributorPrice: 130,
    bulkPrice: 115,
    bulkMoq: 60,
    stock: 5800,
    batchNo: "EV2026-F08",
    expiryDate: "04/2028",
    image: "/images/product_fervon.jpg",
    status: "active",
  },
  {
    id: "P009",
    sku: "EVV-D3-009",
    name: "EV-D3 60K Drops / Softgel",
    subtitle: "High potency Vitamin D3 formulation for bone health & calcium absorption.",
    composition: "Cholecalciferol 60,000 IU",
    packSize: "4 × 1 Softgel Capsule",
    category: "Bone & Joint",
    mrp: 140,
    customerPrice: 120,
    distributorPrice: 85,
    bulkPrice: 75,
    bulkMoq: 100,
    stock: 6200,
    batchNo: "EV2026-D09",
    expiryDate: "01/2028",
    image: "/images/product_evd3.jpg",
    status: "active",
  },
  {
    id: "P010",
    sku: "EVV-RAB-010",
    name: "Rabevo-D DSR Capsules",
    subtitle: "Proton pump inhibitor with prokinetic domperidone for GERD and acid reflux.",
    composition: "Rabeprazole Sodium 20mg + Domperidone 30mg SR",
    packSize: "10 × 10 ALU-ALU Strip",
    category: "Gastroenterology",
    mrp: 230,
    customerPrice: 195,
    distributorPrice: 140,
    bulkPrice: 125,
    bulkMoq: 80,
    stock: 5000,
    batchNo: "EV2026-R10",
    expiryDate: "03/2028",
    image: "/images/product_rabevo.jpg",
    status: "active",
  },
  {
    id: "P011",
    sku: "EVV-MF-011",
    name: "Evvai-MF Antipyretic",
    subtitle: "Effective analgesic and antipyretic combination for pain & fever relief.",
    composition: "Mefenamic Acid 250mg + Paracetamol 325mg",
    packSize: "10 × 10 Strips",
    category: "Analgesics",
    mrp: 110,
    customerPrice: 95,
    distributorPrice: 65,
    bulkPrice: 55,
    bulkMoq: 100,
    stock: 7500,
    batchNo: "EV2026-M11",
    expiryDate: "12/2028",
    image: "/images/product_evvai_mf.jpg",
    status: "active",
  },
  {
    id: "P012",
    sku: "EVV-HEP-012",
    name: "Hepramax Infusion",
    subtitle: "Advanced hepatic encephalopathy and acute liver health therapeutic.",
    composition: "L-Ornithine L-Aspartate 5g / 10ml",
    packSize: "10ml Sterile Ampoule",
    category: "Injectables",
    mrp: 380,
    customerPrice: 330,
    distributorPrice: 240,
    bulkPrice: 215,
    bulkMoq: 30,
    stock: 2200,
    batchNo: "EV2026-H12",
    expiryDate: "06/2028",
    image: "/images/product_hepramax.jpg",
    status: "active",
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-9901",
    customerName: "Apollo Pharma Network",
    role: "Distributor",
    itemsCount: 150,
    totalAmount: 63000,
    orderDate: "14 Aug 2026, 09:45 AM",
    paymentStatus: "Paid",
    orderStatus: "Pending",
    gstin: "36AAACA1234A1Z5",
    deliveryCity: "Hyderabad",
  },
  {
    id: "ORD-9902",
    customerName: "MedPlus Logistics",
    role: "Distributor",
    itemsCount: 300,
    totalAmount: 126000,
    orderDate: "14 Aug 2026, 08:30 AM",
    paymentStatus: "Paid",
    orderStatus: "Confirmed",
    gstin: "27AAAAA5555B1Z0",
    deliveryCity: "Mumbai",
  },
  {
    id: "ORD-9903",
    customerName: "Dr. Rajesh Sharma",
    role: "Retail Customer",
    itemsCount: 2,
    totalAmount: 1160,
    orderDate: "13 Aug 2026, 06:15 PM",
    paymentStatus: "Paid",
    orderStatus: "Packed",
    deliveryCity: "Bengaluru",
  },
  {
    id: "ORD-9904",
    customerName: "Sanjeevani Medical Stores",
    role: "Distributor",
    itemsCount: 80,
    totalAmount: 33600,
    orderDate: "13 Aug 2026, 02:20 PM",
    paymentStatus: "COD",
    orderStatus: "Shipped",
    gstin: "07AAACX9999C1Z2",
    deliveryCity: "New Delhi",
  },
  {
    id: "ORD-9905",
    customerName: "Ananya Rao",
    role: "Retail Customer",
    itemsCount: 1,
    totalAmount: 580,
    orderDate: "12 Aug 2026, 11:10 AM",
    paymentStatus: "Paid",
    orderStatus: "Delivered",
    deliveryCity: "Chennai",
  },
];

export const INITIAL_KYC_REQUESTS: KYCRequest[] = [
  {
    id: "KYC-301",
    companyName: "Apex Pharma Agencies",
    distributorName: "Suresh Kumar",
    mobile: "+91 98765 43210",
    email: "skumar@apexpharma.com",
    gstNumber: "36AAACA4321B1Z2",
    drugLicenseNo: "TS/HYD/2025/8892",
    city: "Hyderabad",
    state: "Telangana",
    submittedDate: "14 Aug 2026",
    status: "Pending",
  },
  {
    id: "KYC-302",
    companyName: "Venkateshwara Medical Wholesalers",
    distributorName: "V. Raghunath",
    mobile: "+91 99887 76655",
    email: "raghu@vmwpharma.in",
    gstNumber: "37BBBCA9876C1Z4",
    drugLicenseNo: "AP/VZA/2026/1102",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    submittedDate: "13 Aug 2026",
    status: "Pending",
  },
];

export interface LocalBuyer {
  id: string;
  name: string;
  type: "RMP_DOCTOR" | "RETAIL_CHEMIST" | "RURAL_CLINIC" | "NURSING_HOME";
  ownerName: string;
  licenseNo: string;
  mobile: string;
  villageTown: string;
  district: string;
  creditLimit: number;
  currentOutstanding: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface SecondaryInvoiceItem {
  productId: string;
  productName: string;
  composition: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  tradePrice: number;
  mrp: number;
  total: number;
}

export interface SecondaryInvoice {
  id: string;
  invoiceNo: string;
  buyerId: string;
  buyerName: string;
  buyerType: "RMP_DOCTOR" | "RETAIL_CHEMIST" | "RURAL_CLINIC" | "NURSING_HOME";
  villageTown: string;
  items: SecondaryInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: "CASH" | "UPI" | "CREDIT_15_DAYS" | "CREDIT_30_DAYS";
  invoiceDate: string;
  status: "PAID" | "PARTIAL" | "CREDIT_PENDING";
}

export const INITIAL_LOCAL_BUYERS: LocalBuyer[] = [
  {
    id: "BUYER-101",
    name: "Dr. K. Srinivas Rao (RMP)",
    type: "RMP_DOCTOR",
    ownerName: "Dr. K. Srinivas Rao",
    licenseNo: "TS/RMP/2021/4892",
    mobile: "+91 94401 23456",
    villageTown: "Suryapet Rural",
    district: "Nalgonda",
    creditLimit: 25000,
    currentOutstanding: 8500,
    status: "ACTIVE",
  },
  {
    id: "BUYER-102",
    name: "Sri Laxmi Medical & General Stores",
    type: "RETAIL_CHEMIST",
    ownerName: "B. Mallesh Chemist",
    licenseNo: "TS/SUR/2024/7712",
    mobile: "+91 98492 88310",
    villageTown: "Chivvemla Mandal",
    district: "Suryapet",
    creditLimit: 50000,
    currentOutstanding: 14200,
    status: "ACTIVE",
  },
  {
    id: "BUYER-103",
    name: "Dr. Anji Reddy First Aid & Clinic",
    type: "RURAL_CLINIC",
    ownerName: "Dr. M. Anji Reddy",
    licenseNo: "RMP-TS-5519",
    mobile: "+91 97012 33411",
    villageTown: "Mothey Village",
    district: "Suryapet",
    creditLimit: 15000,
    currentOutstanding: 0,
    status: "ACTIVE",
  },
  {
    id: "BUYER-104",
    name: "Venkata Rama Pharmacy Counter",
    type: "RETAIL_CHEMIST",
    ownerName: "V. Satyanarayana",
    licenseNo: "AP/GNT/2023/3391",
    mobile: "+91 91234 56789",
    villageTown: "Kodad Town",
    district: "Suryapet",
    creditLimit: 40000,
    currentOutstanding: 5600,
    status: "ACTIVE",
  },
];

export const INITIAL_SECONDARY_INVOICES: SecondaryInvoice[] = [
  {
    id: "SINV-801",
    invoiceNo: "INV-2026-0081",
    buyerId: "BUYER-101",
    buyerName: "Dr. K. Srinivas Rao (RMP)",
    buyerType: "RMP_DOCTOR",
    villageTown: "Suryapet Rural",
    items: [
      {
        productId: "P001",
        productName: "Zene Melatonin Oral Spray",
        composition: "Melatonin Oral Formulation",
        batchNo: "EV2026-Z01",
        expiryDate: "12/2028",
        quantity: 20,
        tradePrice: 320,
        mrp: 450,
        total: 6400,
      },
      {
        productId: "P002",
        productName: "NXTNERve B12 Injection",
        composition: "Mecobalamin 1500mcg / 2ml",
        batchNo: "EV2026-N02",
        expiryDate: "10/2028",
        quantity: 10,
        tradePrice: 210,
        mrp: 290,
        total: 2100,
      },
    ],
    totalAmount: 8500,
    paidAmount: 0,
    balanceAmount: 8500,
    paymentMode: "CREDIT_15_DAYS",
    invoiceDate: "18 Aug 2026",
    status: "CREDIT_PENDING",
  },
  {
    id: "SINV-802",
    invoiceNo: "INV-2026-0082",
    buyerId: "BUYER-102",
    buyerName: "Sri Laxmi Medical & General Stores",
    buyerType: "RETAIL_CHEMIST",
    villageTown: "Chivvemla Mandal",
    items: [
      {
        productId: "P003",
        productName: "Bilevia-300 Tablets",
        composition: "Ursodeoxycholic Acid 300mg",
        batchNo: "EV2026-B03",
        expiryDate: "08/2028",
        quantity: 30,
        tradePrice: 440,
        mrp: 580,
        total: 13200,
      },
    ],
    totalAmount: 13200,
    paidAmount: 13200,
    balanceAmount: 0,
    paymentMode: "UPI",
    invoiceDate: "17 Aug 2026",
    status: "PAID",
  },
];

