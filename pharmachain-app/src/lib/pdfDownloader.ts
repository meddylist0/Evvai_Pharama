/**
 * Client-Side Direct PDF Exporter for EVVAI PharmaLink
 * 
 * Captures the EXACT React-rendered InvoiceDocument component (pixel-for-pixel)
 * and exports directly to an A4 PDF saved in the user's Downloads folder.
 * Uses html-to-image which natively supports all modern Tailwind v4 CSS without color errors.
 */

declare global {
  interface Window {
    htmlToImage?: any;
    jspdf?: any;
    html2canvas?: any;
  }
}

/**
 * Dynamically loads html-to-image and jsPDF from CDN
 */
async function loadPdfEngines(): Promise<{ htmlToImage: any; jsPDF: any }> {
  if (typeof window === "undefined") {
    throw new Error("Cannot load PDF engines on server");
  }

  // 1. Load html-to-image (Native SVG foreignObject renderer - 0 lab() errors)
  if (!window.htmlToImage) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/htmlToImage.min.js";
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = () => {
        // Fallback to unpkg
        const backup = document.createElement("script");
        backup.src = "https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.js";
        backup.onload = resolve;
        backup.onerror = reject;
        document.head.appendChild(backup);
      };
      document.head.appendChild(script);
    });
  }

  // 2. Load jsPDF
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const jsPDF = window.jspdf?.jsPDF || (window as any).jsPDF;
  return {
    htmlToImage: window.htmlToImage || (window as any).htmlToImage,
    jsPDF,
  };
}

/**
 * Directly downloads the exact DOM element (#printable-invoice) as a high-res PDF.
 */
export async function downloadInvoiceDirectPDF(
  order: any,
  _adminSettings?: any
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const invoiceNo = order.invoice_number || `EVV-INV-2026-${String(order.id).padStart(4, "0")}`;
  const filename = `EVVAI_Tax_Invoice_${invoiceNo}.pdf`;

  try {
    const { htmlToImage, jsPDF } = await loadPdfEngines();
    if (!htmlToImage || !jsPDF) {
      throw new Error("PDF libraries could not be loaded");
    }

    // Find the rendered invoice element in the DOM
    let element: HTMLElement | null = document.getElementById("printable-invoice");
    if (!element) {
      element = document.querySelector(".invoice-document-root") as HTMLElement;
    }

    if (!element) {
      console.warn("Invoice element not found in DOM");
      return false;
    }

    // Convert the exact React component to a high-DPI PNG image
    const dataUrl = await htmlToImage.toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5, // 300 DPI high clarity
      backgroundColor: "#ffffff",
      cacheBust: true,
      filter: (node: HTMLElement) => {
        // Exclude any modal buttons if nested
        if (node.classList && (node.classList.contains("modal-action-btn") || node.tagName === "BUTTON")) {
          return false;
        }
        return true;
      },
    });

    // Create jsPDF A4 Document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    // Create a temporary image to read natural dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Calculate proportional fit onto A4 page with 6mm margins
    const margin = 8;
    const availableWidth = pdfPageWidth - margin * 2;
    const renderHeight = (img.height * availableWidth) / img.width;

    pdf.addImage(
      dataUrl,
      "PNG",
      margin,
      margin,
      availableWidth,
      Math.min(renderHeight, pdfPageHeight - margin * 2),
      undefined,
      "FAST"
    );

    // 🚀 DIRECT FILE DOWNLOAD TO USER'S LAPTOP DOWNLOADS FOLDER
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("Direct PDF download failed:", error);
    return false;
  }
}

/**
 * Clean A4 Print: Prints the rendered invoice without modal displacement or extra whitespace
 */
export function printInvoiceDocumentClean(
  order: any,
  _adminSettings?: any
) {
  if (typeof window === "undefined") return;

  const element = document.getElementById("printable-invoice") || document.querySelector(".invoice-document-root");
  if (!element) {
    window.print();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const invNo = order?.invoice_number || `EVV-INV-2026-${order?.id || ""}`;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>EVVAI_Tax_Invoice_${invNo}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #ffffff; color: #0f172a; padding: 4px; }
        img { max-height: 44px; width: auto; object-fit: contain; }
      </style>
      <link rel="stylesheet" href="/_next/static/css/app/layout.css" />
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto;">
        ${element.outerHTML}
      </div>
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1500);
  }, 250);
}
