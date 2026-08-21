"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { productsAPI, ordersAPI, authAPI, paymentsAPI, loadRazorpayScript, getStoredUser, StoredUser, ProductItem, OrderData } from "@/lib/api";

interface CustomerDashboardViewProps {
  initialTab?: string;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({ initialTab = "overview" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dynamic Data States
  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // E-commerce Product Enhanced & Pagination States
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "discount">("popular");
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductItem | null>(null);
  const [productQuantities, setProductQuantities] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Reset page to 1 when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, sortBy]);

  const getProductQuantity = (productId: number) => productQuantities[productId] || 1;
  const setProductQuantity = (productId: number, qty: number) => {
    setProductQuantities((prev) => ({ ...prev, [productId]: Math.max(1, qty) }));
  };

  const getProductImageUrl = (prod: ProductItem) => {
    // 1. Direct Database product image path (e.g. /images/product_zene.png)
    if (prod.image && prod.image.trim().length > 0) {
      if (prod.image.startsWith("http") || prod.image.startsWith("/")) {
        return prod.image;
      }
      return `/images/${prod.image}`;
    }

    // 2. High Quality Local Pharmaceutical Image Fallbacks based on product formulation name & category
    const cat = (prod.category_name || "").toLowerCase();
    const name = (prod.name || "").toLowerCase();

    if (name.includes("zene") || name.includes("melatonin")) return "/images/product_zene.png";
    if (name.includes("nxtnerve") || name.includes("b12")) return "/images/product_nxtnerve.png";
    if (name.includes("bilevia") || cat.includes("gastro")) return "/images/product_bilevia.jpg";
    if (name.includes("evi ova") || name.includes("ova")) return "/images/product_evi_ova.jpg";
    if (name.includes("gestogen") || name.includes("progest")) return "/images/product_gestogen.jpg";
    if (name.includes("nxtlife") || name.includes("life")) return "/images/product_nxtlife.jpg";
    if (name.includes("evglip") || name.includes("diab")) return "/images/product_evglip.jpg";
    if (name.includes("fervon") || name.includes("iron")) return "/images/product_fervon.jpg";
    if (name.includes("evd3") || name.includes("d3") || name.includes("vitamin")) return "/images/product_evd3.jpg";
    if (name.includes("rabevo") || name.includes("rabe")) return "/images/product_rabevo.jpg";
    if (name.includes("mf") || name.includes("metformin")) return "/images/product_evvai_mf.jpg";
    if (name.includes("hepramax") || name.includes("hepra")) return "/images/product_hepramax.jpg";

    if (cat.includes("cardio") || name.includes("heart")) return "/images/cardiovas_xr.jpg";
    if (cat.includes("analgesic") || name.includes("paracetamol") || name.includes("pain")) return "/images/dolotab_blister.jpg";
    if (cat.includes("antibiotic") || name.includes("amox") || name.includes("cipro")) return "/images/amoxiguard_blister.jpg";
    if (cat.includes("syrup") || name.includes("cough") || name.includes("liquid")) return "/images/respiklear_syrup.jpg";
    if (cat.includes("derma") || name.includes("cream")) return "/images/dermshield_cream.jpg";

    return "/images/dolotab_blister.jpg";
  };

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    address: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Checkout & Payment States
  const [checkoutForm, setCheckoutForm] = useState({
    full_name: "",
    phone: "+91 9988776655",
    company_name: "",
    gstin: "",
    delivery_address: "Road No. 36, Jubilee Hills",
    delivery_city: "Hyderabad",
    delivery_state: "Telangana",
    delivery_pincode: "500033",
  });
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);

  // Cancellation & Return States
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [returningOrder, setReturningOrder] = useState<OrderData | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const handleCancelOrder = async (orderId: number, orderCode: string) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderCode}? If prepaid, your refund will be automatically processed.`)) {
      return;
    }
    setCancellingOrderId(orderId);
    try {
      const updatedOrder = await ordersAPI.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      setStatusMsg({
        type: "success",
        text: `✓ Order #${orderCode} cancelled successfully. Payment status: ${updatedOrder.payment_status}`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to cancel order.",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningOrder) return;
    setReturnSubmitting(true);
    try {
      const updatedOrder = await ordersAPI.requestReturn(returningOrder.id, returnReason);
      setOrders((prev) => prev.map((o) => (o.id === returningOrder.id ? updatedOrder : o)));
      setStatusMsg({
        type: "success",
        text: `✓ Return & Refund request submitted for Order #${returningOrder.order_code}!`,
      });
      setReturningOrder(null);
      setReturnReason("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to submit return request.",
      });
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load User, Products, Orders & Cart
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. User
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
        const initialProfile = {
          full_name: stored.full_name || "",
          email: stored.email || "",
          phone: stored.phone || "+91 9988776655",
          company_name: stored.company_name || "Direct Retail Buyer",
          address: "Road No. 36, Jubilee Hills",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500033",
        };
        setProfileForm(initialProfile);
        setCheckoutForm({
          full_name: stored.full_name || "Valued Customer",
          phone: stored.phone || "+91 9988776655",
          company_name: stored.company_name || "",
          gstin: "",
          delivery_address: "Road No. 36, Jubilee Hills",
          delivery_city: "Hyderabad",
          delivery_state: "Telangana",
          delivery_pincode: "500033",
        });
      }

      // 2. Live Products
      const prods = await productsAPI.list();
      setProducts(prods);

      // 3. Live My Orders
      try {
        const myOrders = await ordersAPI.getMyOrders();
        setOrders(myOrders);
      } catch (e) {
        console.log("No orders or guest mode:", e);
      }

      // 4. Saved Wishlist
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pharmalink_wishlist");
        if (saved) {
          try {
            setSavedProductIds(JSON.parse(saved));
          } catch (e) { }
        }

        // 5. Saved Cart
        const savedCart = localStorage.getItem("pharmalink_cart");
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart));
          } catch (e) { }
        }
      }
    } catch (err: any) {
      console.error("Failed to load customer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Save Cart to LocalStorage on update
  const updateCartState = (items: { product: ProductItem; quantity: number }[]) => {
    setCartItems(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_cart", JSON.stringify(items));
    }
  };

  const toggleWishlist = (productId: number) => {
    setSavedProductIds((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      if (typeof window !== "undefined") {
        localStorage.setItem("pharmalink_wishlist", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleAddToCart = (product: ProductItem, quantity = 1) => {
    const existing = cartItems.find((item) => item.product.id === product.id);
    let updatedCart: { product: ProductItem; quantity: number }[];
    if (existing) {
      updatedCart = cartItems.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      updatedCart = [...cartItems, { product, quantity }];
    }
    updateCartState(updatedCart);

    setStatusMsg({
      type: "success",
      text: `✓ Added '${product.name}' to cart!`,
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Instant Buy Now -> Adds product to cart & switches to Checkout Tab with Razorpay
  const handleBuyNow = (product: ProductItem) => {
    const existing = cartItems.find((item) => item.product.id === product.id);
    let updatedCart: { product: ProductItem; quantity: number }[];
    if (existing) {
      updatedCart = cartItems;
    } else {
      updatedCart = [...cartItems, { product, quantity: 1 }];
    }
    updateCartState(updatedCart);
    setActiveTab("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as { product: ProductItem; quantity: number }[];
    updateCartState(updated);
  };

  const handleRemoveCartItem = (productId: number) => {
    const updated = cartItems.filter((item) => item.product.id !== productId);
    updateCartState(updated);
  };

  const handleClearCart = () => {
    updateCartState([]);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await authAPI.updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        company_name: profileForm.company_name,
      });

      const updated = getStoredUser();
      setUser(updated);

      setStatusMsg({ type: "success", text: "✓ Customer profile and shipping address updated!" });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  // Calculations for Cart & Checkout
  const cartSubtotal = cartItems.reduce((acc, it) => {
    const price = it.product.customer_price || it.product.display_price || it.product.mrp;
    return acc + Number(price) * it.quantity;
  }, 0);
  const cartTax = Math.round(cartSubtotal * 0.12 * 100) / 100; // 12% GST
  const shippingFee = cartSubtotal > 1000 || cartSubtotal === 0 || user?.role === "DISTRIBUTOR" ? 0 : 50;
  const grandTotal = Math.round((cartSubtotal + cartTax + shippingFee) * 100) / 100;
  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Execute Cash on Delivery Order Creation
  const processCodOrderCreation = async () => {
    if (cartItems.length === 0) {
      setStatusMsg({ type: "error", text: "Your cart is empty! Please add products before checking out." });
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderPayload = {
        items: cartItems.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
        customer_name: checkoutForm.full_name || user?.full_name || "Valued Customer",
        customer_phone: checkoutForm.phone || user?.phone || "+91 9988776655",
        gstin: checkoutForm.gstin || undefined,
        delivery_address: checkoutForm.delivery_address,
        delivery_city: checkoutForm.delivery_city,
        delivery_state: checkoutForm.delivery_state,
        delivery_pincode: checkoutForm.delivery_pincode,
        payment_method: "Cash on Delivery (COD)",
      };

      const placedOrder = await ordersAPI.create(orderPayload);
      setConfirmedOrder(placedOrder);

      // Refresh Orders List & Clear Cart
      try {
        const freshOrders = await ordersAPI.getMyOrders();
        setOrders(freshOrders);
      } catch {
        setOrders((prev) => [placedOrder, ...prev]);
      }

      updateCartState([]);
      setStatusMsg({
        type: "success",
        text: `✓ Cash on Delivery Order #${placedOrder.order_code} placed successfully!`,
      });
    } catch (err: any) {
      console.error("Order error:", err);
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to complete order. Please check available stock or contact support.",
      });
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Start Real Razorpay Standard Checkout flow (checkout.js)
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setStatusMsg({ type: "error", text: "Your cart is empty! Please add items to proceed." });
      return;
    }

    if (paymentMethod === "cod") {
      await processCodOrderCreation();
      return;
    }

    // Real Razorpay Gateway Execution
    setRazorpayLoading(true);
    setStatusMsg(null);

    try {
      // 1. Ensure official Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Could not load Razorpay SDK. Please check your internet connection.");
      }

      const orderItemsPayload = cartItems.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
      const rzpOrder = await paymentsAPI.createRazorpayOrder(orderItemsPayload, {
        customer_name: checkoutForm.full_name || user?.full_name || "Valued Customer",
        customer_email: user?.email || "customer@pharmalink.com",
      });

      // 3. Configure Razorpay Standard Checkout Popup
      const options = {
        key: rzpOrder.key_id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "EVVAI PharmaLink Enterprise",
        description: `Pharmaceutical Order (${totalCartCount} items)`,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=120&q=80",
        order_id: rzpOrder.razorpay_order_id,
        prefill: {
          name: checkoutForm.full_name || user?.full_name || "Valued Customer",
          email: user?.email || "customer@pharmalink.com",
          contact: checkoutForm.phone || user?.phone || "+91 9988776655",
        },
        theme: {
          color: "#0b2341",
        },
        handler: async function (response: any) {
          // Received Razorpay response tokens: razorpay_payment_id, razorpay_order_id, razorpay_signature
          setOrderSubmitting(true);
          try {
            const orderPayload = {
              items: cartItems.map((it) => ({
                product_id: it.product.id,
                quantity: it.quantity,
              })),
              customer_name: checkoutForm.full_name || user?.full_name || "Valued Customer",
              customer_phone: checkoutForm.phone || user?.phone || "+91 9988776655",
              gstin: checkoutForm.gstin || undefined,
              delivery_address: checkoutForm.delivery_address,
              delivery_city: checkoutForm.delivery_city,
              delivery_state: checkoutForm.delivery_state,
              delivery_pincode: checkoutForm.delivery_pincode,
              payment_method: "Razorpay Online (UPI/Card)",
            };

            const paidOrder = await paymentsAPI.verifyAndPlaceOrder({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_data: orderPayload,
            });

            setConfirmedOrder(paidOrder);

            try {
              const freshOrders = await ordersAPI.getMyOrders();
              setOrders(freshOrders);
            } catch {
              setOrders((prev) => [paidOrder, ...prev]);
            }

            updateCartState([]);
            setStatusMsg({
              type: "success",
              text: `✓ Payment Verified & Order #${paidOrder.order_code} confirmed! (Ref: ${response.razorpay_payment_id})`,
            });
          } catch (err: any) {
            console.error("Payment verification error:", err);
            setStatusMsg({
              type: "error",
              text: err.message || "Payment verification failed. Please contact support.",
            });
          } finally {
            setOrderSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (response: any) {
        setStatusMsg({
          type: "error",
          text: `Payment failed: ${response.error?.description || "Transaction cancelled"}`,
        });
        setRazorpayLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to initialize Razorpay checkout. Please check gateway credentials in Admin Settings.",
      });
    } finally {
      setRazorpayLoading(false);
    }
  };

  // Metrics calculation
  const pendingOrdersCount = orders.filter(
    (o) => o.order_status === "Pending" || o.order_status === "Confirmed" || o.order_status === "Packed"
  ).length;
  const deliveredOrdersCount = orders.filter((o) => o.order_status === "Delivered").length;
  const totalOrdersCount = orders.length;
  const savedCount = savedProductIds.length;

  const metrics = [
    {
      title: "Pending Orders",
      count: pendingOrdersCount,
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Delivered Orders",
      count: deliveredOrdersCount,
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Total Orders",
      count: totalOrdersCount,
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      title: "Active Cart Items",
      count: totalCartCount,
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  // Filtering & Sorting products
  const filteredProducts = products
    .filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        p.name?.toLowerCase().includes(term) ||
        p.composition?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (categoryFilter !== "all" && p.category_name !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = Number(a.customer_price || a.display_price || a.mrp || 0);
      const priceB = Number(b.customer_price || b.display_price || b.mrp || 0);
      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "discount") return (b.discount_percentage || 0) - (a.discount_percentage || 0);
      return 0;
    });

  const categories = Array.from(new Set(products.map((p) => p.category_name).filter(Boolean)));

  // Pagination Calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Render Modern E-Commerce Pharma Card
  const renderProductCard = (prod: ProductItem) => {
    const isSaved = savedProductIds.includes(prod.id);
    const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
    const mrp = Number(prod.mrp || (price > 0 ? price * 1.25 : 100));
    const discountPct = prod.discount_percentage || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 15);
    const qty = getProductQuantity(prod.id);
    const imageUrl = getProductImageUrl(prod);

    return (
      <div
        key={prod.id}
        className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative shadow-2xs"
      >
        {/* Product Image Header */}
        <div className="relative h-44 bg-slate-100/70 overflow-hidden flex items-center justify-center p-3">
          <img
            src={imageUrl}
            alt={prod.name}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
          />

          {/* Discount & Category Badge Overlay */}
          <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
            {discountPct > 0 && (
              <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                {discountPct}% OFF
              </span>
            )}
            <span className="bg-[#0b2341]/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              {prod.category_name || "Healthcare"}
            </span>
          </div>

          {/* Bookmark Heart Overlay */}
          <button
            onClick={() => toggleWishlist(prod.id)}
            title={isSaved ? "Remove from saved" : "Bookmark formulation"}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer z-10 ${isSaved ? "bg-rose-500 text-white shadow-md" : "bg-white/80 text-slate-500 hover:text-rose-500 hover:bg-white"
              }`}
          >
            ♥
          </button>

          {/* Quick View Button on Image Hover */}
          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={() => setSelectedProductForModal(prod)}
              className="bg-white/90 hover:bg-white text-[#0b2341] font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
            >
              👁 Quick View
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">SKU: {prod.sku}</span>
              <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                <span>★ 4.8</span>
                <span className="text-slate-400 text-[10px] font-normal">(94)</span>
              </div>
            </div>

            <h3
              onClick={() => setSelectedProductForModal(prod)}
              className="font-black text-sm text-[#0b2341] group-hover:text-blue-700 transition-colors line-clamp-1 cursor-pointer"
            >
              {prod.name}
            </h3>

            <p className="text-[11px] text-slate-500 line-clamp-1">
              {prod.composition || prod.subtitle || "WHO-GMP Certified Formulation"}
            </p>

            <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-medium">
                Pack: {prod.pack_size || "10 × 10"}
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● {prod.stock > 0 ? "In Stock (Express)" : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Pricing & In-Card Quantity Selector */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-black text-[#0b2341] font-mono">
                    ₹{price.toFixed(2)}
                  </span>
                  {mrp > price && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{mrp.toFixed(2)}
                    </span>
                  )}
                </div>
                {mrp > price && (
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    Save ₹{(mrp - price).toFixed(0)} per pack
                  </span>
                )}
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                <button
                  onClick={() => setProductQuantity(prod.id, qty - 1)}
                  className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                >
                  -
                </button>
                <span className="px-2.5 py-0.5 font-mono font-bold text-xs text-[#0b2341]">
                  {qty}
                </span>
                <button
                  onClick={() => setProductQuantity(prod.id, qty + 1)}
                  className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleAddToCart(prod, qty)}
                disabled={prod.stock <= 0}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-900 border border-slate-200 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  handleAddToCart(prod, qty);
                  setActiveTab("checkout");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={prod.stock <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>⚡ Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const displayName = user?.full_name || "Valued Customer";
  const userAccountCode = user ? `#CUS-${String(user.id || user.user_id).padStart(4, "0")}` : "#CUS-0004";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar (Fixed/Sticky Full Height) */}
      <div className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-30">
        <CustomerSidebar activeTab={activeTab} onSelectTab={setActiveTab} cartCount={totalCartCount} />
      </div>

      {/* Mobile Drawer Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white animate-in slide-in-from-left duration-200 border-r border-slate-200 shadow-2xl">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-2 cursor-pointer"
                aria-label="Close Sidebar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <CustomerSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setSidebarOpen(false);
                }}
                cartCount={totalCartCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Portal Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 py-3.5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-[#0b2341] hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <span className="bg-[#0b2341] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
                PharmaLink Customer Portal
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ● Live Connected
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab("checkout")}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs flex items-center space-x-2 cursor-pointer"
            >
              <span>🛒 Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              )}
              {cartSubtotal > 0 && <span className="font-mono text-emerald-700 hidden sm:inline">₹{cartSubtotal.toFixed(0)}</span>}
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <Link
                href="/"
                className="text-xs font-bold text-slate-600 hover:text-[#0b2341] px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors hidden sm:block"
              >
                Storefront
              </Link>
              <button
                onClick={() => {
                  authAPI.logout();
                  window.location.href = "/login";
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Body */}
        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl w-full mx-auto min-w-0">

          {/* User Greeting Banner & Quick Actions */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                  {user?.role === "DISTRIBUTOR" ? "B2B Wholesale Partner" : "Direct Retail Buyer"}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ● Live Connected
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1">
                Welcome Back, {displayName}
              </h1>
              <p className="text-xs text-slate-500">
                {user?.email || "customer@gmail.com"} • Direct Buyer Account {userAccountCode}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab("checkout")}
                className="relative bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs flex items-center space-x-2 cursor-pointer"
              >
                <span>🛒 My Cart</span>
                {totalCartCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {totalCartCount}
                  </span>
                )}
                {cartSubtotal > 0 && <span className="font-mono text-emerald-700">₹{cartSubtotal.toFixed(0)}</span>}
              </button>

              <button
                onClick={() => setActiveTab("catalog")}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs shrink-0 text-center cursor-pointer"
              >
                Browse Catalog &rarr;
              </button>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border transition-all ${statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* 4 Metric Summary Cards - Dynamic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">{metric.title}</span>
                  <span className="text-2xl font-black text-[#0b2341] block tracking-tight">
                    {loading ? "..." : metric.count}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">{metric.icon}</div>
              </div>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Featured Formulations Catalog */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-[#0b2341] tracking-tight">
                      Recommended OTC & Wellness Formulations
                    </h2>
                    <p className="text-xs text-slate-400">Directly fetched from WHO-GMP certified inventory</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="text-xs font-bold text-blue-700 hover:text-[#0b2341] transition-colors cursor-pointer"
                  >
                    View All {products.length} Products &rarr;
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
                    <p className="font-bold text-xs">Loading Live Products Catalog...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl text-center text-slate-400 border border-slate-200">
                    No products available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.slice(0, 6).map((prod) => renderProductCard(prod))}
                  </div>
                )}
              </div>

              {/* Recent Orders Overview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-[#0b2341] tracking-tight">Recent Orders & Shipments</h2>
                    <p className="text-xs text-slate-400">Live order fulfillment updates</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-blue-700 hover:text-[#0b2341] transition-colors cursor-pointer"
                  >
                    View All Orders &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl text-center border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-700 text-sm">No orders placed yet.</p>
                    <p className="text-xs text-slate-400">Browse the live formulation catalog to place your first order!</p>
                    <button
                      onClick={() => setActiveTab("catalog")}
                      className="bg-[#0b2341] text-white px-4 py-2 rounded-xl text-xs font-bold mt-2 cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="py-3.5 px-5">Order ID</th>
                          <th className="py-3.5 px-5">Date</th>
                          <th className="py-3.5 px-5">Order Items</th>
                          <th className="py-3.5 px-5">Total Amount</th>
                          <th className="py-3.5 px-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-5 font-mono font-bold text-blue-700">
                              {ord.order_code || `#ORD-${ord.id}`}
                            </td>
                            <td className="py-3.5 px-5 text-slate-600">
                              {new Date(ord.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3.5 px-5 font-medium text-slate-800">
                              {ord.items && ord.items.length > 0
                                ? `${ord.items.length} items (${ord.items[0]?.product_name || "Pharmaceutical Item"})`
                                : "Pharmaceutical Supplies"}
                            </td>
                            <td className="py-3.5 px-5 font-mono font-bold text-[#0b2341]">
                              ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ord.order_status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : ord.order_status === "Shipped"
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                              >
                                {ord.order_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CART & CHECKOUT WITH RAZORPAY */}
          {activeTab === "checkout" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-[#0b2341]">Shopping Cart & Razorpay Checkout</h2>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      WHO-GMP Direct Fulfilled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your order items, confirm delivery address, and pay securely via Razorpay UPI/Cards or Cash on Delivery.
                  </p>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer self-start md:self-auto"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Order Confirmed Receipt Banner if just placed */}
              {confirmedOrder && (
                <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm animate-in fade-in zoom-in duration-300">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-base">
                          ✓
                        </span>
                        <h3 className="text-xl font-black text-emerald-950">Payment & Order Confirmed!</h3>
                      </div>
                      <p className="text-xs text-emerald-800 pl-10">
                        Your pharmaceutical order has been verified and sent for WHO-GMP batch packing and dispatch.
                      </p>
                    </div>

                    <button
                      onClick={() => setConfirmedOrder(null)}
                      className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
                    >
                      ✕ Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 p-4 rounded-2xl border border-emerald-200 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Tracking ID</span>
                      <span className="font-bold text-blue-700 text-sm">{confirmedOrder.order_code}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Reference</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {confirmedOrder.invoice_number || "INV-EVV-2026"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid Total</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹{Number(confirmedOrder.total_amount).toFixed(2)} ({confirmedOrder.payment_method})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="bg-[#0b2341] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:bg-[#12315a] cursor-pointer"
                    >
                      Track in My Orders &rarr;
                    </button>
                    <button
                      onClick={() => setActiveTab("catalog")}
                      className="bg-white text-emerald-900 border border-emerald-300 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-50 cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}

              {cartItems.length === 0 && !confirmedOrder ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-4">
                  <div className="text-4xl">🛒</div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-base">Your Cart is Currently Empty</h3>
                    <p className="text-xs text-slate-400">
                      Explore recommended healthcare formulations or the catalog to add medicines to your checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="bg-[#0b2341] text-white px-6 py-2.5 rounded-2xl text-xs font-bold cursor-pointer hover:bg-[#12315a] transition-all"
                  >
                    Browse Formulation Catalog &rarr;
                  </button>
                </div>
              ) : cartItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Cart Items & Delivery Details */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Item List */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                      <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                        1. Selected Formulations ({totalCartCount} items)
                      </h3>

                      <div className="divide-y divide-slate-100">
                        {cartItems.map((item) => {
                          const unitPrice =
                            item.product.customer_price || item.product.display_price || item.product.mrp;
                          const lineTotal = Number(unitPrice) * item.quantity;

                          return (
                            <div key={item.product.id} className="py-4 flex items-center justify-between gap-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    {item.product.category_name || "Pharma"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                                </div>
                                <h4 className="font-bold text-sm text-[#0b2341] truncate">{item.product.name}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-1">{item.product.composition}</p>
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  ₹{Number(unitPrice).toFixed(2)} per unit
                                </span>
                              </div>

                              <div className="flex items-center space-x-4 shrink-0">
                                {/* Quantity Incrementer */}
                                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                  <button
                                    onClick={() => handleQuantityChange(item.product.id, -1)}
                                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 font-mono font-bold text-xs text-[#0b2341]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(item.product.id, 1)}
                                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right min-w-[70px]">
                                  <span className="font-mono font-black text-sm text-[#0b2341] block">
                                    ₹{lineTotal.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveCartItem(item.product.id)}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery Destination Form */}
                    <form onSubmit={handleInitiatePayment} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
                      <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                        2. Shipping & Delivery Address
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Customer / Consignee Name *</label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.full_name}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, full_name: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={checkoutForm.phone}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Street Address / Clinic / House *</label>
                        <input
                          type="text"
                          required
                          value={checkoutForm.delivery_address}
                          onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_address: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.delivery_city}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_city: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.delivery_state}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_state: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required
                            value={checkoutForm.delivery_pincode}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, delivery_pincode: e.target.value })}
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Order Summary & Razorpay Payment Selection */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
                      <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                        3. Payment Method & Billing
                      </h3>

                      {/* Payment Method Selector */}
                      <div className="space-y-3">
                        {/* Razorpay Option */}
                        <div
                          onClick={() => setPaymentMethod("razorpay")}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "razorpay"
                            ? "border-blue-600 bg-blue-50/50 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-sm text-[#0b2341]">Razorpay Gateway</span>
                              <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                Instant & Recommended
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              UPI (GPay, PhonePe, Paytm, QR), Cards & NetBanking
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                            }`}>
                            {paymentMethod === "razorpay" && <span className="text-white text-[10px]">✓</span>}
                          </div>
                        </div>

                        {/* Cash on Delivery Option */}
                        <div
                          onClick={() => setPaymentMethod("cod")}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "cod"
                            ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          <div className="space-y-1">
                            <span className="font-black text-sm text-[#0b2341]">Cash on Delivery (COD)</span>
                            <p className="text-[11px] text-slate-500">Pay cash upon batch delivery at your address</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                            }`}>
                            {paymentMethod === "cod" && <span className="text-white text-[10px]">✓</span>}
                          </div>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>Items Subtotal ({totalCartCount} items):</span>
                          <span className="font-bold text-slate-800">₹{cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Pharma GST (12%):</span>
                          <span className="font-bold text-slate-800">₹{cartTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Delivery & Handling:</span>
                          <span className="font-bold text-slate-800">
                            {shippingFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${shippingFee.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-[#0b2341]">
                          <span>Grand Total:</span>
                          <span className="text-emerald-700">₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Submit / Pay Button */}
                      <button
                        onClick={handleInitiatePayment}
                        disabled={orderSubmitting || razorpayLoading || cartItems.length === 0}
                        className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {orderSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Verifying Payment & Placing Order...</span>
                          </div>
                        ) : razorpayLoading ? (
                          <div className="flex items-center space-x-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Initializing Razorpay Gateway...</span>
                          </div>
                        ) : paymentMethod === "razorpay" ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                            <span>Proceed to Pay ₹{grandTotal.toFixed(2)} via Razorpay &rarr;</span>
                          </>
                        ) : (
                          <span>Confirm Cash on Delivery Order (₹{grandTotal.toFixed(2)}) &rarr;</span>
                        )}
                      </button>

                      <p className="text-[10px] text-center text-slate-400">
                        🔒 256-bit SSL Encrypted • WHO-GMP Certified Dispatch • Instant Invoicing
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: FULL CATALOG */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              {/* Catalog Hero Banner */}
              <div className="bg-gradient-to-r from-[#0b2341] via-[#12315a] to-[#1e4a7a] text-white p-6 md:p-8 rounded-3xl shadow-md space-y-3 relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/30">
                      WHO-GMP Certified Inventory
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">● {products.length} Formulations Live</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Browse Pharmaceutical & Healthcare Formulations
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Search by composition, brand name, or therapeutic category. Direct retail & B2B express dispatch with batch COA lab verification.
                  </p>
                </div>
              </div>

              {/* Search & Filter Row */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 text-xs">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${categoryFilter === "all"
                      ? "bg-[#0b2341] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    All Categories ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat!)}
                      className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${categoryFilter === cat
                        ? "bg-[#0b2341] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-60">
                    <input
                      type="text"
                      placeholder="Search formulations, compositions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 text-xs font-medium w-full pr-8"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="popular">Sort: Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Highest Discount</option>
                  </select>

                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${viewMode === "grid" ? "bg-[#0b2341] text-white" : "bg-white text-slate-600"}`}
                      title="Grid View"
                    >
                      ▦
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${viewMode === "list" ? "bg-[#0b2341] text-white" : "bg-white text-slate-600"}`}
                      title="List View"
                    >
                      ☰
                    </button>
                  </div>
                </div>
              </div>

              {/* Products List/Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
                  <div className="text-3xl">🔍</div>
                  <h3 className="font-bold text-[#0b2341] text-base">No Formulations Found</h3>
                  <p className="text-xs text-slate-400">No products matched your search term "{searchTerm}" or category filter.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                    }}
                    className="bg-[#0b2341] text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Reset Filters & View All ({products.length})
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedProducts.map((prod) => renderProductCard(prod))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3.5 px-5">SKU & Formulation</th>
                        <th className="py-3.5 px-5">Category</th>
                        <th className="py-3.5 px-5">Composition</th>
                        <th className="py-3.5 px-5">Stock Status</th>
                        <th className="py-3.5 px-5">Price (₹)</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProducts.map((prod) => {
                        const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
                        const mrp = Number(prod.mrp || (price > 0 ? price * 1.25 : 100));
                        const qty = getProductQuantity(prod.id);
                        const imageUrl = getProductImageUrl(prod);

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={imageUrl}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                                />
                                <div>
                                  <div
                                    onClick={() => setSelectedProductForModal(prod)}
                                    className="font-bold text-sm text-[#0b2341] hover:text-blue-700 cursor-pointer"
                                  >
                                    {prod.name}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                                {prod.category_name || "Healthcare"}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-600 text-[11px] max-w-xs truncate">
                              {prod.composition || prod.subtitle || "-"}
                            </td>
                            <td className="py-4 px-5 font-bold text-emerald-700 text-xs">
                              ● {prod.stock > 0 ? `${prod.stock} in stock` : "Out of stock"}
                            </td>
                            <td className="py-4 px-5 font-mono">
                              <div className="font-black text-sm text-[#0b2341]">₹{price.toFixed(2)}</div>
                              {mrp > price && (
                                <span className="text-[10px] text-slate-400 line-through">MRP ₹{mrp.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                                  <button
                                    onClick={() => setProductQuantity(prod.id, qty - 1)}
                                    className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 py-0.5 font-mono font-bold text-xs text-[#0b2341]">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() => setProductQuantity(prod.id, qty + 1)}
                                    className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleAddToCart(prod, qty)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                                >
                                  Add to Cart
                                </button>
                                <button
                                  onClick={() => {
                                    handleAddToCart(prod, qty);
                                    setActiveTab("checkout");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                                >
                                  ⚡ Buy Now
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Interactive Pagination Control Bar */}
              {filteredProducts.length > 0 && (
                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
                  <div>
                    Showing <span className="font-bold text-[#0b2341]">{startIndex + 1}</span> to{" "}
                    <span className="font-bold text-[#0b2341]">
                      {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                    </span>{" "}
                    of <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> formulations
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-slate-500 font-bold hidden sm:inline">Per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-none"
                    >
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                    </select>

                    {/* Prev Page Button */}
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      ← Prev
                    </button>

                    {/* Page Number Pills */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => {
                            setCurrentPage(pg);
                            window.scrollTo({ top: 200, behavior: "smooth" });
                          }}
                          className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${currentPage === pg
                              ? "bg-[#0b2341] text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                <h2 className="text-xl font-black text-[#0b2341]">My Order History & Invoices</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking from dispatch to doorstep delivery.</p>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
                  <div className="text-3xl">📦</div>
                  <h3 className="font-bold text-[#0b2341] text-base">No Orders Found</h3>
                  <p className="text-xs text-slate-400">You have not placed any orders yet.</p>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="bg-[#0b2341] text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3.5 px-5">Order Code</th>
                        <th className="py-3.5 px-5">Date</th>
                        <th className="py-3.5 px-5">Items Summary</th>
                        <th className="py-3.5 px-5">Payment</th>
                        <th className="py-3.5 px-5">Total (₹)</th>
                        <th className="py-3.5 px-5">Fulfillment Status</th>
                        <th className="py-3.5 px-5 text-right">Actions / Refund</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-5 font-mono font-bold text-blue-700">
                            {ord.order_code || `#ORD-${ord.id}`}
                          </td>
                          <td className="py-4 px-5 text-slate-600">
                            {new Date(ord.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-5 font-medium text-slate-800">
                            {ord.items && ord.items.length > 0
                              ? ord.items.map((it: any) => `${it.product_name} (×${it.quantity})`).join(", ")
                              : "Direct Supplies"}
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-bold text-slate-700">{ord.payment_method || "PREPAID"}</span>
                          </td>
                          <td className="py-4 px-5 font-mono font-black text-sm text-[#0b2341]">
                            ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${ord.order_status === "Delivered"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : ord.order_status === "Shipped"
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : ord.order_status === "Cancelled"
                                    ? "bg-slate-100 text-slate-600 border-slate-300"
                                    : ord.order_status === "Returned"
                                      ? "bg-purple-50 text-purple-800 border-purple-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${ord.order_status === "Delivered"
                                  ? "bg-emerald-500"
                                  : ord.order_status === "Returned"
                                    ? "bg-purple-500"
                                    : ord.order_status === "Cancelled"
                                      ? "bg-slate-400"
                                      : "bg-amber-500"
                                  }`}
                              ></span>
                              <span>{ord.order_status}</span>
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right space-x-2">
                            {ord.order_status === "Pending" || ord.order_status === "Confirmed" || ord.order_status === "Packed" ? (
                              <button
                                onClick={() => handleCancelOrder(ord.id, ord.order_code || `ORD-${ord.id}`)}
                                disabled={cancellingOrderId === ord.id}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                              >
                                {cancellingOrderId === ord.id ? "Cancelling..." : "Cancel Order"}
                              </button>
                            ) : ord.order_status === "Delivered" ? (
                              <button
                                onClick={() => { setReturningOrder(ord); setReturnReason(""); }}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                              >
                                ↩ Return / Refund
                              </button>
                            ) : ord.order_status === "Cancelled" ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                Cancelled {ord.payment_status === "Refunded" ? "(Refunded)" : ""}
                              </span>
                            ) : ord.order_status === "Returned" ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                ✓ Refunded ({ord.payment_status})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">In Transit</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RETURN & REFUND MODAL DIALOG */}
              {returningOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                  <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl space-y-4 text-xs border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-base text-[#0b2341]">Request Return & Refund</h3>
                      <button
                        onClick={() => setReturningOrder(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 space-y-1">
                      <div className="font-bold text-blue-900 text-xs">
                        Order #{returningOrder.order_code || returningOrder.id}
                      </div>
                      <div className="text-[11px] text-blue-700">
                        Total Paid: <span className="font-mono font-bold">₹{returningOrder.total_amount}</span> ({returningOrder.payment_method})
                      </div>
                    </div>

                    <form onSubmit={handleReturnSubmit} className="space-y-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Select / Describe Reason for Return *</label>
                        <select
                          required
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600 mb-2"
                        >
                          <option value="">-- Choose Return Reason --</option>
                          <option value="Damaged or broken packaging">Damaged or broken packaging</option>
                          <option value="Wrong medicine or formulation received">Wrong medicine or formulation received</option>
                          <option value="Expired or near-expiry batch">Expired or near-expiry batch</option>
                          <option value="Quality issue or seal compromised">Quality issue or seal compromised</option>
                          <option value="Product no longer needed">Product no longer needed</option>
                        </select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setReturningOrder(null)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={returnSubmitting || !returnReason}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50"
                        >
                          {returnSubmitting ? "Submitting..." : "Submit Return & Refund Request"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SAVED FORMULATIONS */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                <h2 className="text-xl font-black text-[#0b2341]">Saved Formulations (Wishlist)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Quickly access medicines and wellness formulations you have bookmarked.</p>
              </div>

              {products.filter((p) => savedProductIds.includes(p.id)).length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
                  <div className="text-3xl text-rose-400">♥</div>
                  <h3 className="font-bold text-[#0b2341] text-base">No Saved Formulations Yet</h3>
                  <p className="text-xs text-slate-400">Click the heart icon on any product in the catalog to bookmark it here.</p>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="bg-[#0b2341] text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products
                    .filter((p) => savedProductIds.includes(p.id))
                    .map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              {prod.category_name}
                            </span>
                            <button
                              onClick={() => toggleWishlist(prod.id)}
                              className="text-rose-600 p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 cursor-pointer"
                              title="Remove from saved"
                            >
                              ♥ Remove
                            </button>
                          </div>
                          <h4 className="font-bold text-[#0b2341] text-sm">{prod.name}</h4>
                          <p className="text-xs text-slate-500">{prod.composition || prod.subtitle}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="font-mono font-black text-sm text-[#0b2341]">
                            ₹{Number(prod.customer_price || prod.mrp).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleBuyNow(prod)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: COA & TESTING */}
          {activeTab === "coa" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                <h2 className="text-xl font-black text-[#0b2341]">Certificate of Analysis (COA) & Batch Verifications</h2>
                <p className="text-xs text-slate-500 mt-0.5">Government-audited laboratory batch purity testing reports.</p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-5">Batch Number</th>
                      <th className="py-3.5 px-5">Formulation Name</th>
                      <th className="py-3.5 px-5">Standard Compliance</th>
                      <th className="py-3.5 px-5">Audit Status</th>
                      <th className="py-3.5 px-5 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.slice(0, 6).map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5 font-mono font-bold text-blue-700">
                          {prod.batch_no || `BATCH-2026-X${prod.id}`}
                        </td>
                        <td className="py-4 px-5 font-bold text-[#0b2341]">{prod.name}</td>
                        <td className="py-4 px-5 text-slate-600">WHO-GMP & Schedule M Certified</td>
                        <td className="py-4 px-5">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            ✓ PASSED LAB PURITY
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => alert(`COA Lab Certificate for batch '${prod.batch_no || "WHO-GMP"}' verified!`)}
                            className="text-blue-700 hover:text-blue-900 font-bold text-xs underline cursor-pointer"
                          >
                            Download COA PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNT PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
                <h2 className="text-xl font-black text-[#0b2341]">Customer Profile & Delivery Address</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your contact credentials and default shipping destination.</p>
              </div>

              <form onSubmit={handleProfileSave} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Organization / Clinic / House Name</label>
                    <input
                      type="text"
                      value={profileForm.company_name}
                      onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-2.5 rounded-xl font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {profileSaving ? "Saving..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* PRODUCT QUICK VIEW MODAL DIALOG */}
          {selectedProductForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row">
                {/* Modal Product Image */}
                <div className="md:w-1/2 bg-slate-100 p-6 flex flex-col items-center justify-center relative">
                  <img
                    src={getProductImageUrl(selectedProductForModal)}
                    alt={selectedProductForModal.name}
                    className="w-full h-56 object-cover rounded-2xl shadow-sm"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                    WHO-GMP Certified
                  </div>
                </div>

                {/* Modal Product Details */}
                <div className="md:w-1/2 p-6 space-y-4 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {selectedProductForModal.category_name || "Healthcare"}
                      </span>
                      <button
                        onClick={() => setSelectedProductForModal(null)}
                        className="text-slate-400 hover:text-slate-700 font-bold text-base cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <h3 className="font-black text-lg text-[#0b2341] mt-2">{selectedProductForModal.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedProductForModal.composition || selectedProductForModal.subtitle || "Standard Formulation"}
                    </p>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono">
                      <div>Pack Size: <span className="font-bold">{selectedProductForModal.pack_size || "10 × 10 Strips"}</span></div>
                      <div>SKU Code: <span className="font-bold">{selectedProductForModal.sku}</span></div>
                      <div>Batch Number: <span className="font-bold">{selectedProductForModal.batch_no || "WHO-GMP-2026"}</span></div>
                      <div>Stock Availability: <span className="font-bold text-emerald-700">● {selectedProductForModal.stock} Units In Stock</span></div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-[#0b2341] font-mono">
                        ₹{Number(selectedProductForModal.customer_price || selectedProductForModal.mrp).toFixed(2)}
                      </span>
                      {selectedProductForModal.mrp && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          MRP ₹{Number(selectedProductForModal.mrp).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          handleAddToCart(selectedProductForModal, getProductQuantity(selectedProductForModal.id));
                          setSelectedProductForModal(null);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-xs cursor-pointer text-center"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => {
                          handleAddToCart(selectedProductForModal, getProductQuantity(selectedProductForModal.id));
                          setSelectedProductForModal(null);
                          setActiveTab("checkout");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs cursor-pointer shadow-md text-center"
                      >
                        ⚡ Instant Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
