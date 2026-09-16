# EVVAI Pharma - Mobile App Development & Build Guide 📱

This guide explains how the **EVVAI Pharma Next.js Application** is packaged into a **Native Android / Mobile App** using **Capacitor**, what changes were implemented, and how to build, test, and update the app.

---

## 📑 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Key Changes Implemented](#2-key-changes-implemented)
3. [Quick Start: How to Run the App](#3-quick-start-how-to-run-the-app)
4. [Step-by-Step Build & Sync Workflow](#4-step-by-step-build--sync-workflow)
5. [Generating Standalone `.apk` File](#5-generating-standalone-apk-file)
6. [Troubleshooting & Cache Clearing](#6-troubleshooting--cache-clearing)

---

## 1. Overview & Architecture

The application uses **Next.js 16 (Turbopack)** with static export (`output: "export"`) combined with **Capacitor 8**.

```
[ Next.js React Code (src/) ]
           ↓ (npm run build)
[ Static Web Export (out/) ]
           ↓ (npx cap sync)
[ Android Native Project (android/) ]
           ↓ (Android Studio / Gradle)
[ Native APK / Mobile App ]
```

- **App ID:** `com.evvaipharma.app`
- **App Name:** `EVVAI Pharma`
- **Native Platform:** `android/`

---

## 2. Key Changes Implemented

### A. Pure Tailwind CSS Styling
- Removed all inline `style={{ ... }}` objects and imperative event listener style mutations across all components ([Header.tsx](src/components/shared/Header.tsx), [HeroSection.tsx](src/components/landing/HeroSection.tsx), [AboutCompanySection.tsx](src/components/landing/AboutCompanySection.tsx), [HexagonServicesSection.tsx](src/components/landing/HexagonServicesSection.tsx), etc.).
- Replaced with dynamic, responsive Tailwind CSS utility classes and brand signature `#A71380` hover states.

### B. Mobile Bottom Navigation Bar ([MobileBottomNav.tsx](src/components/shared/MobileBottomNav.tsx))
- Added a sticky 5-tab native navigation bar on mobile screens (`md:hidden`):
  1. **Home** (`/`)
  2. **Products** (`/products`)
  3. **Services** (`/services`)
  4. **Partners** (`/partners`)
  5. **Account / Sign In** (Dynamic role-based routing)
- Features active-state indicator dots, magenta pill highlights, and touch micro-animations.

### C. App Splash Screen ([AppSplashScreen.tsx](src/components/shared/AppSplashScreen.tsx))
- Smooth native-style splash screen displaying the pulsating EVVAI Pharma logo and tagline on launch.

### D. Mobile App Header & Touch Optimizations
- Compact mobile app bar with direct product search shortcut and quick menu.
- Safe-area inset support (`env(safe-area-inset-bottom)`) and tap delay removal (`touch-action: manipulation`, `-webkit-tap-highlight-color: transparent`).

### E. Next.js Static Export ([next.config.ts](next.config.ts))
- Enabled `output: 'export'` and `images: { unoptimized: true }`.
- Configured `generateStaticParams()` on all dynamic routes (`products/[slug]`, `admin/orders/[id]`) so all 122 pages pre-render without a Node server.

---

## 3. Quick Start: How to Run the App

### Option A: Test on Mobile Browser / PWA (Instant)
1. Ensure your laptop and mobile are connected to the same Wi-Fi.
2. In your mobile Chrome/Safari browser, open:
   ```text
   http://192.168.0.155:3000
   ```
3. To use it in full-screen app mode: tap Chrome Menu (3 dots) > **"Add to Home screen"** / **"Install App"**.

---

### Option B: Run via Android Studio onto Physical Phone (USB)
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
   *(On Xiaomi phones: also enable **"Install via USB"** in Developer Options)*.
2. Connect your phone to your PC via USB.
3. Open Android Studio:
   ```bash
   npm run cap:open:android
   ```
4. Select your phone in the top device dropdown (e.g. `Xiaomi 2409FPCC4I`).
5. Click the **Green Play ( ▶ )** button.

---

## 4. Step-by-Step Build & Sync Workflow

Whenever you modify any code in Next.js, run this single command:

```bash
npm run cap:build:android
```

This runs:
1. `next build` (compiles pages into `out/`)
2. `cap sync android` (copies assets to `android/app/src/main/assets/public/`)

Then in Android Studio, click **Play ( ▶ )** to update the app on your phone.

---

## 5. Generating Standalone `.apk` File

To build an `.apk` file you can share and install on any Android phone:

1. Open Android Studio (`npm run cap:open:android`).
2. Click top menu: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once completed, click **"locate"** in the popup to find:
   ```text
   pharmachain-app/android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Send this `app-debug.apk` via WhatsApp, Google Drive, or USB to any phone and tap to install!

---

## 6. Troubleshooting & Cache Clearing

If changes made in code are not reflecting on your phone:

### 1. Clear Mobile App Cache:
- On your phone: Long press **EVVAI Pharma App** > **App Info** > **Clear Data** (or **Uninstall** the old debug app).

### 2. Clean Rebuild in Android Studio:
- In Android Studio: Click **Build** > **Clean Project**, then **Build** > **Rebuild Project**.
- Click **Play ( ▶ )**.

---

*Generated for EVVAI Pharmaceuticals Mobile App Development.*
