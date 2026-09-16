"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ordersAPI,
  paymentsAPI,
  authAPI,
  addressesAPI,
  AddressItem,
  loadRazorpayScript,
  getStoredUser,
  StoredUser,
  ProductItem,
  OrderData,
  PaymentPublicConfig,
} from "@/lib/api";
import { usePlatform } from "@/lib/platform";
import { MobileCartFlow } from "@/components/mobile/customer/MobileCartFlow";

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const platform = usePlatform();

  if (platform.isNative || platform.isMobile) {
    return <MobileCartFlow />;
  }

  const [user, setUser] = useState<StoredUser | null>(null);
  const [cartItems, setCartItems] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savedForLater, setSavedForLater] = useState<{ product: ProductItem; quantity: number }[]>([]);

  // Checkout Steps: "cart" (Cart Review) | "checkout" (Delivery & Payment)
  const [currentStep, setCurrentStep] = useState<"cart" | "checkout">("cart");

  const [paymentConfig, setPaymentConfig] = useState<PaymentPublicConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("cod");
  const [configLoading, setConfigLoading] = useState(true);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Address Book for 1-click checkout (Amazon / Flipkart style)
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddAddressInline, setShowAddAddressInline] = useState(false);
  const [savingNewAddress, setSavingNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    address_type: "HOME",
    recipient_name: "",
    phone: "",
    street_address: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    is_default: true,
  });

  const [shippingForm, setShippingForm] = useState({
    full_name: "",
    phone: "+91 9988776655",
    gstin: "",
    delivery_address: "Road No. 36, Jubilee Hills",
    delivery_city: "Hyderabad",
    delivery_state: "Telangana",
    delivery_pincode: "500033",
  });

  const handleSaveNewAddressInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNewAddress(true);
    try {
      const created = await addressesAPI.create(newAddressForm);
      const updatedList = await addressesAPI.list();
      setSavedAddresses(updatedList);
      setSelectedAddressId(created.id);
      setShippingForm({
        full_name: created.recipient_name,
        phone: created.phone,
        gstin: shippingForm.gstin,
        delivery_address: created.street_address,
        delivery_city: created.city,
        delivery_state: created.state,
        delivery_pincode: created.pincode,
      });
      setShowAddAddressInline(false);
      setStatusMsg({ type: "success", text: "✓ New delivery address saved and selected!" });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to save address." });
    } finally {
      setSavingNewAddress(false);
    }
  };

  const loadData = async () => {
    try {
      setConfigLoading(true);
      const stored = getStoredUser();
      if (stored) {
        setUser(stored);
        setShippingForm((prev) => ({
          ...prev,
          full_name: stored.full_name || prev.full_name || "Valued Customer",
          phone: stored.phone || prev.phone || "+91 9988776655",
        }));
      }

      // Fetch saved delivery addresses from user address book
      try {
        const addressList = await addressesAPI.list();
        setSavedAddresses(addressList || []);
        if (addressList && addressList.length > 0) {
          const defaultAddr = addressList.find((a) => a.is_default) || addressList[0];
          setSelectedAddressId(defaultAddr.id);
          setShippingForm((prev) => ({
            ...prev,
            full_name: defaultAddr.recipient_name || prev.full_name,
            phone: defaultAddr.phone || prev.phone,
            delivery_address: defaultAddr.street_address || prev.delivery_address,
            delivery_city: defaultAddr.city || prev.delivery_city,
            delivery_state: defaultAddr.state || prev.delivery_state,
            delivery_pincode: defaultAddr.pincode || prev.delivery_pincode,
          }));
        } else {
          const me = await authAPI.getMe();
          if (me) {
            setShippingForm((prev) => ({
              ...prev,
              full_name: me.full_name || prev.full_name,
              phone: me.phone || prev.phone,
              delivery_address: me.address || prev.delivery_address,
              delivery_city: me.city || prev.delivery_city,
              delivery_state: me.state || prev.delivery_state,
              delivery_pincode: me.pincode || prev.delivery_pincode,
            }));
          }
        }
      } catch {
        // Fallback gracefully
      }

      // Fetch live payment gateway configuration from server
      const cfg = await paymentsAPI.getConfig();
      setPaymentConfig(cfg);
      if (cfg && cfg.is_active) {
        setPaymentMethod("razorpay");
      } else {
        setPaymentMethod("cod");
      }
    } catch (e) {
      console.error("Failed to load payment config:", e);
      setPaymentMethod("cod");
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pharmalink_cart");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCartItems(parsed);

          const params = new URLSearchParams(window.location.search);
          const buyNowId = params.get("buy_now_id");
          if (buyNowId) {
            setSelectedIds([Number(buyNowId)]);
            setCurrentStep("checkout"); // Instant Buy Now goes directly to Step 2
          } else {
            setSelectedIds(parsed.map((it: any) => it.product.id));
          }
        }

        const savedLater = localStorage.getItem("pharmalink_saved_for_later");
        if (savedLater) {
          setSavedForLater(JSON.parse(savedLater));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const updateCartState = (items: { product: ProductItem; quantity: number }[]) => {
    setCartItems(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_cart", JSON.stringify(items));
      window.dispatchEvent(new Event("storage"));
    }
  };

  const updateSavedForLaterState = (items: { product: ProductItem; quantity: number }[]) => {
    setSavedForLater(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_saved_for_later", JSON.stringify(items));
    }
  };

  // Checkbox selection methods (Amazon / Flipkart Style)
  const toggleSelectItem = (productId: number) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((it) => it.product.id));
    }
  };

  const handleQtyChange = (productId: number, delta: number) => {
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

  const handleRemove = (productId: number) => {
    const updated = cartItems.filter((it) => it.product.id !== productId);
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
    updateCartState(updated);
  };

  // Save for Later (Flipkart/Amazon Feature)
  const handleSaveForLater = (productId: number) => {
    const itemToSave = cartItems.find((it) => it.product.id === productId);
    if (!itemToSave) return;

    // Remove from active cart
    const updatedCart = cartItems.filter((it) => it.product.id !== productId);
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
    updateCartState(updatedCart);

    // Add to saved for later
    const existing = savedForLater.find((it) => it.product.id === productId);
    const updatedSaved = existing ? savedForLater : [...savedForLater, itemToSave];
    updateSavedForLaterState(updatedSaved);

    setStatusMsg({
      type: "success",
      text: `✓ '${itemToSave.product.name}' moved to Saved for Later.`,
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Move back from Saved for Later to Cart
  const handleMoveToCart = (productId: number) => {
    const itemToMove = savedForLater.find((it) => it.product.id === productId);
    if (!itemToMove) return;

    // Remove from saved for later
    const updatedSaved = savedForLater.filter((it) => it.product.id !== productId);
    updateSavedForLaterState(updatedSaved);

    // Add to active cart and select it
    const existing = cartItems.find((it) => it.product.id === productId);
    let updatedCart;
    if (existing) {
      updatedCart = cartItems.map((it) =>
        it.product.id === productId ? { ...it, quantity: it.quantity + 1 } : it
      );
    } else {
      updatedCart = [...cartItems, itemToMove];
    }
    updateCartState(updatedCart);
    setSelectedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

    setStatusMsg({
      type: "success",
      text: `✓ '${itemToMove.product.name}' moved back to Active Cart!`,
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleRemoveSaved = (productId: number) => {
    const updated = savedForLater.filter((it) => it.product.id !== productId);
    updateSavedForLaterState(updated);
  };

  const handleClear = () => {
    updateCartState([]);
    setSelectedIds([]);
  };

  const getProductImageUrl = (prod: ProductItem) => {
    if (prod.image && prod.image.trim().length > 0) {
      if (prod.image.startsWith("http") || prod.image.startsWith("/")) return prod.image;
      return `/images/${prod.image}`;
    }
    return "/images/dolotab_blister.jpg";
  };

  // Filter ONLY SELECTED ITEMS for calculations & checkout
  const selectedCartItems = cartItems.filter((it) => selectedIds.includes(it.product.id));

  // Calculations for SELECTED ITEMS ONLY
  const cartSubtotal = selectedCartItems.reduce((acc, it) => {
    const price = it.product.customer_price || it.product.display_price || it.product.mrp;
    return acc + Number(price) * it.quantity;
  }, 0);
  const cartTax = Math.round(cartSubtotal * 0.12 * 100) / 100;
  const shippingFee = cartSubtotal > 1000 || cartSubtotal === 0 ? 0 : 50;
  const grandTotal = Math.round((cartSubtotal + cartTax + shippingFee) * 100) / 100;
  const selectedItemsCount = selectedCartItems.reduce((acc, it) => acc + it.quantity, 0);

  // COD Order
  const processCodOrder = async () => {
    if (selectedCartItems.length === 0) {
      setStatusMsg({ type: "error", text: "Please select at least 1 item to checkout!" });
      return;
    }

    setOrderSubmitting(true);
    try {
      const payload = {
        items: selectedCartItems.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
        customer_name: shippingForm.full_name || user?.full_name || "Valued Customer",
        customer_phone: shippingForm.phone || user?.phone || "+91 9988776655",
        gstin: shippingForm.gstin || undefined,
        delivery_address: shippingForm.delivery_address,
        delivery_city: shippingForm.delivery_city,
        delivery_state: shippingForm.delivery_state,
        delivery_pincode: shippingForm.delivery_pincode,
        payment_method: "Cash on Delivery (COD)",
      };

      const placed = await ordersAPI.create(payload);
      setConfirmedOrder(placed);

      // Remove ONLY ordered items from cart (keeping unselected items safe in cart!)
      const remainingItems = cartItems.filter((it) => !selectedIds.includes(it.product.id));
      updateCartState(remainingItems);
      setSelectedIds(remainingItems.map((it) => it.product.id));

      setStatusMsg({
        type: "success",
        text: `✓ Cash on Delivery Order #${placed.order_code} placed successfully!`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to place order.",
      });
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Razorpay Payment
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCartItems.length === 0) {
      setStatusMsg({ type: "error", text: "Please select at least 1 formulation in your cart to proceed!" });
      return;
    }

    if (paymentMethod === "cod" || (paymentConfig && !paymentConfig.is_active)) {
      await processCodOrder();
      return;
    }

    setRazorpayLoading(true);
    setStatusMsg(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Could not load Razorpay SDK.");

      const orderItemsPayload = selectedCartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));
      const rzpOrder = await paymentsAPI.createRazorpayOrder(orderItemsPayload, {
        customer_name: shippingForm.full_name || user?.full_name || "Valued Customer",
        customer_email: user?.email || "customer@pharmalink.com",
      });

      const options = {
        key: rzpOrder.key_id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "EVVAI PharmaLink Enterprise",
        description: `Pharmaceutical Order (${selectedItemsCount} items)`,
        order_id: rzpOrder.razorpay_order_id,
        prefill: {
          name: shippingForm.full_name || user?.full_name || "Valued Customer",
          email: user?.email || "customer@pharmalink.com",
          contact: shippingForm.phone || user?.phone || "+91 9988776655",
        },
        theme: { color: "#A71380" },
        handler: async function (response: any) {
          setOrderSubmitting(true);
          try {
            const payload = {
              items: selectedCartItems.map((it) => ({
                product_id: it.product.id,
                quantity: it.quantity,
              })),
              customer_name: shippingForm.full_name || user?.full_name || "Valued Customer",
              customer_phone: shippingForm.phone || user?.phone || "+91 9988776655",
              gstin: shippingForm.gstin || undefined,
              delivery_address: shippingForm.delivery_address,
              delivery_city: shippingForm.delivery_city,
              delivery_state: shippingForm.delivery_state,
              delivery_pincode: shippingForm.delivery_pincode,
              payment_method: "Razorpay Online (UPI/Card)",
            };

            const paid = await paymentsAPI.verifyAndPlaceOrder({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_data: payload,
            });

            setConfirmedOrder(paid);

            // Remove ONLY ordered items from cart
            const remainingItems = cartItems.filter((it) => !selectedIds.includes(it.product.id));
            updateCartState(remainingItems);
            setSelectedIds(remainingItems.map((it) => it.product.id));

            setStatusMsg({
              type: "success",
              text: `✓ Payment Verified & Order #${paid.order_code} confirmed!`,
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (err: any) {
            setStatusMsg({
              type: "error",
              text: err.message || "Payment verification failed.",
            });
          } finally {
            setOrderSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setRazorpayLoading(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setStatusMsg({
          type: "error",
          text: `Payment failed: ${resp.error?.description || "Cancelled"}`,
        });
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Razorpay initialization error.",
      });
    } finally {
      setRazorpayLoading(false);
    }
  };

  const isRazorpayActive = paymentConfig ? paymentConfig.is_active : false;
  const isCodActive = paymentConfig ? paymentConfig.cod_enabled : true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              Direct WHO-GMP Fulfillment
            </span>
            {isRazorpayActive ? (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ● Secure Razorpay Gateway Active
              </span>
            ) : (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                ● Cash on Delivery (COD) Checkout Active
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            {confirmedOrder
              ? "Order Confirmation & Invoice"
              : currentStep === "checkout"
                ? "Finalize Delivery & Payment"
                : "Shopping Cart"}
          </h1>
          <p className="text-xs text-slate-500">
            {confirmedOrder
              ? "Your pharmaceutical order has been verified and registered for FEFO batch allocation and express dispatch."
              : currentStep === "checkout"
                ? "Enter your consignee shipping details and select your preferred payment mode."
                : "Review selected formulations in your cart, adjust quantities, or proceed to buy."}
          </p>
        </div>

        {cartItems.length > 0 && !confirmedOrder && currentStep === "cart" && (
          <div className="flex items-center space-x-3 self-start md:self-auto">
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-slate-600 hover:text-[#0b2341] cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-[4px]"
            >
              {selectedIds.length === cartItems.length ? "Deselect All" : "Select All Items"}
            </button>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
            >
              Clear Cart
            </button>
          </div>
        )}

        {currentStep === "checkout" && !confirmedOrder && (
          <button
            onClick={() => setCurrentStep("cart")}
            className="text-xs font-bold text-[#A71380] hover:text-[#8E0F6D] bg-[#F8EAF4] hover:bg-[#F3D0E9] border border-[#F3D0E9] px-3.5 py-2 rounded-[5px] cursor-pointer flex items-center space-x-1.5 self-start md:self-auto transition-all"
          >
            <span>&larr; Back to Shopping Cart</span>
          </button>
        )}
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-[5px] text-xs font-bold border transition-all ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
            : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* CONFIRMED ORDER VIEW */}
      {confirmedOrder ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Success Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-[6px] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                      WHO-GMP Verified Order
                    </span>
                    <span className="text-xs text-emerald-200">
                      {new Date(confirmedOrder.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mt-1">Thank You! Order Placed Successfully</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Order ID: <strong className="font-mono text-white text-sm">{confirmedOrder.order_code}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                <button
                  onClick={() => window.print()}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-[5px] font-bold text-xs border border-white/30 cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Receipt</span>
                </button>
                <Link
                  href="/customer/orders"
                  className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-2 rounded-[5px] font-extrabold text-xs shadow-xs transition-all"
                >
                  Track in My Orders &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* If there are still items remaining in the cart */}
          {cartItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-[6px] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">🛒</span>
                <div>
                  <h4 className="font-bold text-xs text-amber-900">
                    You have {cartItems.length} other item{cartItems.length > 1 ? "s" : ""} remaining in your cart!
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    These items were kept safe in your cart for your next purchase.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  setCurrentStep("cart");
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-[4px] cursor-pointer"
              >
                Go to Remaining Cart &rarr;
              </button>
            </div>
          )}

          {/* Fulfillment Pipeline */}
          <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Fulfillment & Dispatch Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-[5px] border border-emerald-200">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Order Received</h4>
                  <p className="text-[10px] text-emerald-700">Verified & Logged</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-[5px] border border-blue-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0b2341]">Batch QC &amp; FEFO Allocation</h4>
                  <p className="text-[10px] text-slate-500">In Progress</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-[5px] border border-slate-200 opacity-60">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Cold-Chain Packaging</h4>
                  <p className="text-[10px] text-slate-400">Next Step</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-[5px] border border-slate-200 opacity-60">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Express Delivery</h4>
                  <p className="text-[10px] text-slate-400">Within 24-48 Hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Ordered Formulations List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                    Purchased Formulations ({confirmedOrder.items?.length || 0} items)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Invoice: <strong className="text-slate-800">{confirmedOrder.invoice_number || "INV-EVV-2026"}</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {confirmedOrder.items && confirmedOrder.items.length > 0 ? (
                    confirmedOrder.items.map((it) => (
                      <div key={it.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              SKU: {it.sku}
                            </span>
                            {it.batch_no && (
                              <span className="text-[10px] font-mono text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded font-bold border border-[#F3D0E9]">
                                Batch: {it.batch_no}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-[#0b2341] truncate">{it.product_name}</h4>
                          <span className="text-xs text-slate-500">
                            ₹{Number(it.unit_price).toFixed(2)} × {it.quantity} units
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-[#0b2341]">
                            ₹{Number(it.total_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-xs text-slate-500">Formulations processed successfully.</div>
                  )}
                </div>
              </div>

              {/* Shipping Destination Summary */}
              <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-3 text-xs">
                <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                  Consignee & Delivery Destination
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-[5px] border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Recipient Name</span>
                    <span className="font-bold text-slate-800 text-sm">{confirmedOrder.customer_name}</span>
                    <span className="text-slate-500 block mt-1">📞 {confirmedOrder.customer_phone || "Not specified"}</span>
                    {confirmedOrder.gstin && (
                      <span className="text-[11px] font-mono text-slate-600 block mt-1">
                        GSTIN: {confirmedOrder.gstin}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Address</span>
                    <p className="text-slate-700 font-medium leading-relaxed mt-0.5">
                      {confirmedOrder.delivery_address}, {confirmedOrder.delivery_city}, {confirmedOrder.delivery_state} -{" "}
                      <strong className="font-mono text-slate-900">{confirmedOrder.delivery_pincode}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                  Payment & Invoice Summary
                </h3>

                <div className="space-y-2 bg-[#f8fafc] border border-slate-200 rounded-[5px] p-4 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-slate-800">₹{Number(confirmedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Pharma GST (12%):</span>
                    <span className="font-bold text-slate-800">₹{Number(confirmedOrder.tax_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery & Handling:</span>
                    <span className="font-bold text-slate-800">
                      {Number(confirmedOrder.shipping_charge) === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${Number(confirmedOrder.shipping_charge).toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-[#0b2341]">
                    <span>Total Amount:</span>
                    <span className="text-[#A71380]">₹{Number(confirmedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-[5px] border border-emerald-200 text-xs flex items-center justify-between">
                  <span className="text-emerald-800 font-bold">Payment Method</span>
                  <span className="font-mono font-bold text-emerald-900">{confirmedOrder.payment_method}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href="/customer/catalog"
                    className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3 rounded-[5px] font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Browse More Formulations &rarr;</span>
                  </Link>

                  <Link
                    href="/customer/orders"
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-[5px] font-bold text-xs transition-all flex items-center justify-center"
                  >
                    View All My Orders
                  </Link>

                  <button
                    onClick={() => {
                      setConfirmedOrder(null);
                      setCurrentStep("cart");
                    }}
                    className="w-full text-slate-400 hover:text-slate-600 py-1 text-[11px] font-medium cursor-pointer"
                  >
                    {cartItems.length > 0 ? "Back to Cart" : "Start New Checkout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : cartItems.length === 0 && savedForLater.length === 0 ? (
        /* COMPLETELY EMPTY CART & SAVED */
        <div className="bg-white p-12 rounded-[6px] text-center border border-slate-200 space-y-4 shadow-2xs">
          <div className="text-5xl">🛒</div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-800 text-lg">Your Cart is Currently Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven't added any formulations yet. Browse our WHO-GMP certified catalog to add medicines and healthcare products.
            </p>
          </div>
          <Link
            href="/customer/catalog"
            className="inline-block bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-[5px] font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all"
          >
            Browse Products &rarr;
          </Link>
        </div>
      ) : currentStep === "cart" ? (
        /* STAGE 1: AMAZON / FLIPKART STYLE SHOPPING CART REVIEW */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Cart Items (with checkboxes) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={cartItems.length > 0 && selectedIds.length === cartItems.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-[#A71380] rounded border-slate-300 focus:ring-[#A71380] cursor-pointer"
                    />
                    <label htmlFor="select-all" className="font-bold text-xs text-[#0b2341] cursor-pointer">
                      Select all items ({cartItems.length})
                    </label>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#A71380]">
                    {selectedIds.length} of {cartItems.length} selected
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No active items in cart. Check your "Saved for Later" list below.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cartItems.map((item) => {
                      const isSelected = selectedIds.includes(item.product.id);
                      const unitPrice =
                        item.product.customer_price || item.product.display_price || item.product.mrp;
                      const lineTotal = Number(unitPrice) * item.quantity;
                      const imageUrl = getProductImageUrl(item.product);

                      return (
                        <div
                          key={item.product.id}
                          className={`py-4 flex items-start sm:items-center justify-between gap-3 transition-colors ${isSelected ? "bg-white" : "bg-slate-50/70 opacity-75"
                            } p-2 rounded-[5px]`}
                        >
                          <div className="flex items-start sm:items-center space-x-3 min-w-0">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.product.id)}
                              className="mt-1 sm:mt-0 w-4 h-4 text-[#A71380] rounded border-slate-300 focus:ring-[#A71380] cursor-pointer shrink-0"
                            />

                            <div className="w-16 h-16 rounded-[6px] overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center shadow-2xs">
                              <img
                                src={imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded-[4px] border border-[#F3D0E9]">
                                  {item.product.category_name || "Pharma"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                              </div>
                              <h4 className="font-bold text-sm text-[#0b2341] truncate">{item.product.name}</h4>
                              <p className="text-[11px] text-slate-500 truncate max-w-md">{item.product.composition}</p>
                              <span className="text-xs font-mono font-bold text-slate-800 block">
                                ₹{Number(unitPrice).toFixed(2)} per unit
                              </span>
                              <div className="flex items-center space-x-3 pt-1">
                                <button
                                  onClick={() => handleSaveForLater(item.product.id)}
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                  Save for later
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => handleRemove(item.product.id)}
                                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 shrink-0">
                            {/* Quantity Counter */}
                            <div className="flex items-center border border-slate-200 rounded-[5px] overflow-hidden bg-white shadow-2xs">
                              <button
                                onClick={() => handleQtyChange(item.product.id, -1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 font-mono font-bold text-xs text-[#0b2341]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQtyChange(item.product.id, 1)}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right min-w-[80px]">
                              <span className="font-mono font-black text-sm text-[#0b2341] block">
                                ₹{lineTotal.toFixed(2)}
                              </span>
                              {!isSelected && (
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                  Not in subtotal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Amazon-Style "Proceed to Buy" Subtotal Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-5 sticky top-20">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Selected Items:</span>
                    <span className="font-bold text-slate-800">{selectedItemsCount} formulations</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-sm font-bold text-slate-700">Cart Subtotal:</span>
                    <span className="text-2xl font-black text-[#0b2341] font-mono">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    + Pharma GST (12%) & shipping calculated at next step
                  </p>
                </div>

                {/* Golden/Brand "Proceed to Buy" Button (Exact Amazon Style) */}
                <button
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      setStatusMsg({ type: "error", text: "Please select at least 1 formulation to proceed!" });
                      return;
                    }
                    setCurrentStep("checkout");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={selectedIds.length === 0}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0B800] text-slate-900 border border-[#FCD200] py-3.5 rounded-[8px] font-extrabold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Buy ({selectedItemsCount} items) &rarr;</span>
                </button>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Free Delivery on orders above ₹1,000</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Direct WHO-GMP Certified Formulations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Cash on Delivery (COD) & Razorpay Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SAVED FOR LATER SECTION */}
          {savedForLater.length > 0 && (
            <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">📌</span>
                  <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                    Saved for Later ({savedForLater.length} items)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Items you decided to buy later</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedForLater.map((it) => {
                  const unitPrice =
                    it.product.customer_price || it.product.display_price || it.product.mrp;
                  const imageUrl = getProductImageUrl(it.product);

                  return (
                    <div
                      key={it.product.id}
                      className="border border-slate-200 rounded-[5px] p-3.5 flex flex-col justify-between bg-slate-50/50 hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-14 h-14 rounded-[5px] overflow-hidden border border-slate-200 bg-white shrink-0 flex items-center justify-center">
                          <img src={imageUrl} alt={it.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="text-[9px] font-bold text-[#A71380] bg-[#F8EAF4] px-1.5 py-0.5 rounded border border-[#F3D0E9]">
                            {it.product.category_name || "Pharma"}
                          </span>
                          <h4 className="font-bold text-xs text-[#0b2341] truncate">{it.product.name}</h4>
                          <span className="text-xs font-mono font-bold text-slate-800 block">
                            ₹{Number(unitPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                        <button
                          onClick={() => handleMoveToCart(it.product.id)}
                          className="bg-[#0b2341] hover:bg-[#1a3d69] text-white text-[11px] font-bold px-3 py-1.5 rounded-[4px] cursor-pointer transition-all flex items-center space-x-1"
                        >
                          <span>Move to Cart</span>
                        </button>
                        <button
                          onClick={() => handleRemoveSaved(it.product.id)}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STAGE 2: SHIPPING ADDRESS & PAYMENT CHECKOUT SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Order Item Summary & Shipping Destination */}
          <div className="lg:col-span-7 space-y-6">
            {/* Selected Formulations Review */}
            <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                  1. Order Items ({selectedItemsCount} items)
                </h3>
                <button
                  onClick={() => setCurrentStep("cart")}
                  className="text-xs font-bold text-[#A71380] hover:underline cursor-pointer"
                >
                  Edit Cart
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedCartItems.map((item) => {
                  const unitPrice =
                    item.product.customer_price || item.product.display_price || item.product.mrp;
                  const lineTotal = Number(unitPrice) * item.quantity;
                  const imageUrl = getProductImageUrl(item.product);

                  return (
                    <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-[5px] overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center">
                          <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-bold text-xs text-[#0b2341] truncate">{item.product.name}</h4>
                          <span className="text-[11px] text-slate-500 block">
                            ₹{Number(unitPrice).toFixed(2)} × {item.quantity} qty
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#0b2341] shrink-0">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EXACT AMAZON / FLIPKART STYLE DELIVERY ADDRESS SELECTION */}
            <div className="bg-white p-6 rounded-[8px] border border-slate-200/90 shadow-2xs space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#0b2341] text-white flex items-center justify-center font-black text-[11px]">
                    2
                  </span>
                  <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
                    Select Delivery Address
                  </h3>
                </div>
                <Link href="/customer/profile" className="text-[11px] font-bold text-blue-600 hover:underline">
                  Manage Address Book &rarr;
                </Link>
              </div>

              {/* Amazon / Flipkart Radio List of Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const typeLabel =
                      addr.address_type === "HOME"
                        ? "🏠 HOME"
                        : addr.address_type === "OFFICE"
                          ? "🏢 WORK / OFFICE"
                          : addr.address_type === "CLINIC"
                            ? "🏥 CLINIC / HOSPITAL"
                            : "💊 PHARMACY";

                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setShippingForm((prev) => ({
                            ...prev,
                            full_name: addr.recipient_name,
                            phone: addr.phone,
                            delivery_address: addr.street_address,
                            delivery_city: addr.city,
                            delivery_state: addr.state,
                            delivery_pincode: addr.pincode,
                          }));
                        }}
                        className={`p-4 rounded-[8px] border-2 transition-all cursor-pointer ${isSelected
                          ? "border-amber-400 bg-amber-50/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <input
                              type="radio"
                              name="checkout_delivery_address"
                              checked={isSelected}
                              onChange={() => { }}
                              className="w-4 h-4 mt-0.5 text-amber-500 focus:ring-amber-400 cursor-pointer"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-black text-sm text-[#0b2341]">
                                  {addr.recipient_name}
                                </span>
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                  {typeLabel}
                                </span>
                                {addr.is_default && (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-700 font-medium text-xs leading-relaxed">
                                {addr.street_address}, {addr.city}, {addr.state} -{" "}
                                <strong className="font-mono text-[#0b2341]">{addr.pincode}</strong>
                              </p>

                              <p className="text-[11px] text-slate-500 font-mono">
                                Phone: <strong>{addr.phone}</strong>
                              </p>

                              {/* Amazon-style "Deliver to this address" button on active address */}
                              {isSelected && (
                                <div className="pt-2">
                                  <div className="inline-flex items-center space-x-2 bg-[#FFD814] text-slate-900 border border-[#FCD200] px-4 py-1.5 rounded-[6px] font-extrabold text-xs shadow-2xs">
                                    <span>✓ Selected for Delivery</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Address Accordion Button (Amazon / Flipkart Style) */}
              <div className="pt-2">
                {!showAddAddressInline ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNewAddressForm({
                        address_type: "HOME",
                        recipient_name: user?.full_name || "",
                        phone: user?.phone || "+91 9988776655",
                        street_address: "",
                        city: "Hyderabad",
                        state: "Telangana",
                        pincode: "500033",
                        is_default: savedAddresses.length === 0,
                      });
                      setShowAddAddressInline(true);
                    }}
                    className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-[8px] font-bold text-xs text-blue-700 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>➕ Add a new delivery address</span>
                  </button>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-[8px] border-2 border-blue-400 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-sm text-[#0b2341]">
                        Add a New Delivery Address
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddAddressInline(false)}
                        className="text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕ Cancel
                      </button>
                    </div>

                    <form onSubmit={handleSaveNewAddressInline} className="space-y-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Address Type *</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: "HOME", label: "🏠 Home" },
                            { id: "OFFICE", label: "🏢 Office" },
                            { id: "CLINIC", label: "🏥 Clinic" },
                            { id: "PHARMACY", label: "💊 Pharmacy" },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setNewAddressForm({ ...newAddressForm, address_type: t.id })}
                              className={`py-1.5 px-2 rounded-[6px] font-bold text-xs border transition-all cursor-pointer text-center ${newAddressForm.address_type === t.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200"
                                }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Recipient full name"
                            value={newAddressForm.recipient_name}
                            onChange={(e) =>
                              setNewAddressForm({ ...newAddressForm, recipient_name: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 9876543210"
                            value={newAddressForm.phone}
                            onChange={(e) =>
                              setNewAddressForm({ ...newAddressForm, phone: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Flat, House no., Building, Company, Apartment, Street *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Flat 302, Diamond Towers, Road No. 10"
                          value={newAddressForm.street_address}
                          onChange={(e) =>
                            setNewAddressForm({ ...newAddressForm, street_address: e.target.value })
                          }
                          className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.city}
                            onChange={(e) =>
                              setNewAddressForm({ ...newAddressForm, city: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.state}
                            onChange={(e) =>
                              setNewAddressForm({ ...newAddressForm, state: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required
                            value={newAddressForm.pincode}
                            onChange={(e) =>
                              setNewAddressForm({ ...newAddressForm, pincode: e.target.value })
                            }
                            className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAddressInline(false)}
                          className="px-3 py-1.5 rounded-[5px] border border-slate-200 bg-white font-bold text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingNewAddress}
                          className="bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 border border-[#FCD200] font-extrabold px-4 py-1.5 rounded-[5px] shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {savingNewAddress ? "Saving..." : "Use this address &rarr;"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Payment Selection & Price Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs space-y-5">
              <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                3. Payment Method & Billing
              </h3>

              {/* Payment Methods */}
              <div className="space-y-3">
                {/* Razorpay Option */}
                {isRazorpayActive ? (
                  <div
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`p-4 rounded-[8px] border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "razorpay"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-[#0b2341]">Razorpay Gateway</span>
                        <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">UPI (GPay, PhonePe, Paytm, QR), Cards & NetBanking</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                        }`}
                    >
                      {paymentMethod === "razorpay" && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-[5px] border border-slate-200 bg-slate-50/80 opacity-60 flex items-center justify-between cursor-not-allowed">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-500">Razorpay Online Gateway</span>
                        <span className="bg-slate-200 text-slate-600 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                          Temporarily Disabled
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Online UPI / Card gateway is currently disabled by administrator.</p>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery (COD) Option */}
                {isCodActive ? (
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 rounded-[5px] border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "cod"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-[#0b2341]">Cash on Delivery (COD)</span>
                        {!isRazorpayActive && (
                          <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Pay cash upon batch delivery at your address</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                        }`}
                    >
                      {paymentMethod === "cod" && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-[5px] p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal ({selectedItemsCount} items):</span>
                  <span className="font-bold text-slate-800">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pharma GST (12%):</span>
                  <span className="font-bold text-slate-800">₹{cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery & Handling:</span>
                  <span className="font-bold text-slate-800">
                    {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-[#0b2341]">
                  <span>Grand Total:</span>
                  <span className="text-[#A71380]">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order CTA Button (Amazon / Flipkart Style) */}
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={orderSubmitting || razorpayLoading || selectedIds.length === 0}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#F0B800] text-slate-900 border border-[#FCD200] py-3.5 rounded-[8px] font-black text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {orderSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    <span>Placing Order...</span>
                  </div>
                ) : razorpayLoading ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading Razorpay...</span>
                  </div>
                ) : paymentMethod === "razorpay" && isRazorpayActive ? (
                  <span>Pay ₹{grandTotal.toFixed(2)} via Razorpay &rarr;</span>
                ) : (
                  <span>Place Your Order (COD: ₹{grandTotal.toFixed(2)}) &rarr;</span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                🔒 256-bit SSL Encrypted • WHO-GMP Certified Dispatch
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
