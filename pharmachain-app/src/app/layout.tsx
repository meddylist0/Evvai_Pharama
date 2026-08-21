import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0b2341",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.evvaipharma.com"),
  title: {
    default: "EVVAI Pharmaceuticals - Trusted Medicines & Healthcare Solutions",
    template: "%s | EVVAI Pharmaceuticals",
  },
  description:
    "Evvai Pharmaceuticals is a leading provider of safe, effective, and high-quality medicines, specialized therapeutics, and healthcare products committed to patient care and better health.",
  keywords: [
    "EVVAI Pharmaceuticals",
    "Evvai Pharma",
    "Evvai Pharmaceuticals Hyderabad",
    "Pharma B2B Portal",
    "Zene Melatonin Spray",
    "NXTNERve B12",
    "Bilevia 300",
    "Evi-Ova",
    "Gestogen-Pro",
    "NXTLife 600",
    "WHO-GMP Certified Pharma",
    "Pharmaceutical Manufacturer India",
    "Third-Party Pharma Manufacturing",
    "Healthcare Formulations Catalog",
  ],
  authors: [{ name: "EVVAI Pharmaceuticals", url: "https://www.evvaipharma.com" }],
  creator: "EVVAI Pharmaceuticals",
  publisher: "EVVAI Pharmaceuticals",
  applicationName: "EVVAI Pharma Portal",
  category: "Pharmaceuticals & Healthcare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://www.evvaipharma.com",
  },
  openGraph: {
    title: "EVVAI Pharmaceuticals - Quality Medicines, Better Life",
    description:
      "Leading WHO-GMP compliant manufacturer and provider of safe, effective, high-quality medicines and B2B distributor ordering solutions.",
    url: "https://www.evvaipharma.com",
    siteName: "EVVAI Pharmaceuticals",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/evvai_logo_dark.png",
        width: 992,
        height: 252,
        alt: "EVVAI Pharmaceuticals - Your Cure is our Medicine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVVAI Pharmaceuticals - Trusted Healthcare Solutions",
    description: "Your Cure is our Medicine ! Providing reliable pharmaceutical formulations and B2B ordering.",
    images: ["/images/evvai_logo_dark.png"],
    creator: "@evvaipharma",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/evvai_icon.png",
    shortcut: "/images/evvai_icon.png",
    apple: "/images/evvai_icon.png",
  },
};

// JSON-LD Structured Data Schema for Search Engines (Google, Bing, Schema.org)
const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["MedicalOrganization", "Corporation"],
      "@id": "https://www.evvaipharma.com/#organization",
      name: "EVVAI Pharmaceuticals",
      alternateName: ["Evvai Pharma", "Evvai Pharmaceuticals Pvt Ltd"],
      url: "https://www.evvaipharma.com",
      logo: {
        "@type": "ImageObject",
        "@id": "https://www.evvaipharma.com/#logo",
        url: "https://www.evvaipharma.com/images/evvai_logo_dark.png",
        contentUrl: "https://www.evvaipharma.com/images/evvai_logo_dark.png",
        caption: "EVVAI Pharmaceuticals Logo",
      },
      image: "https://www.evvaipharma.com/images/evvai_logo_dark.png",
      slogan: "Your Cure is our Medicine !",
      description:
        "Evvai Pharmaceuticals is a leading provider of safe, effective, and high-quality medicines and healthcare products committed to patient care and better health.",
      telephone: "+91-7075730616",
      email: "sales@evvaipharma.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "EVVAI Pharmaceuticals Corporate Office",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        postalCode: "500081",
        addressCountry: "IN",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+91-7075730616",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["English", "Telugu", "Hindi"],
        },
        {
          "@type": "ContactPoint",
          telephone: "+91-7075730616",
          contactType: "sales",
          areaServed: "IN",
          availableLanguage: ["English", "Telugu", "Hindi"],
        },
      ],
      sameAs: [
        "https://www.facebook.com/evvaipharma",
        "https://twitter.com/evvaipharma",
        "https://www.linkedin.com/company/evvaipharma",
        "https://maps.app.goo.gl/H1ANvGG1yiYe68MT9",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.evvaipharma.com/#website",
      url: "https://www.evvaipharma.com",
      name: "EVVAI Pharmaceuticals",
      description: "Trusted Medicines & Healthcare Solutions",
      publisher: {
        "@id": "https://www.evvaipharma.com/#organization",
      },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.evvaipharma.com/catalog?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

import { ClientProvider } from "@/components/ClientProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${plusJakarta.variable} antialiased scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans" suppressHydrationWarning>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}

