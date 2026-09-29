import { useState } from 'react';
import { Document, BusinessSettings } from '../types';
import { Mail, Phone, Globe, MapPin, Printer, Download, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface PrintDocumentProps {
  document: Document;
  settings: BusinessSettings;
  onBack?: () => void;
}

// Convert numbers to Bangladeshi/Indian format words (Taka Only)
function numberToWords(num: number): string {
  const integerPart = Math.floor(num);
  if (integerPart === 0) return 'Zero Taka Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const grp = (n: number): string => {
    let s = '';
    const h = Math.floor(n / 100);
    const t = n % 100;
    if (h) {
      s += a[h] + ' Hundred ';
    }
    if (t) {
      if (s !== '') s += 'and ';
      if (t < 20) {
        s += a[t];
      } else {
        s += b[Math.floor(t / 10)] + (t % 10 ? '-' + a[t % 10] : '');
      }
    }
    return s.trim();
  };

  let rem = integerPart;
  let words = '';

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  const hundred = Math.floor(rem / 100);
  rem %= 100;

  if (crore) {
    words += grp(crore) + ' Crore ';
  }
  if (lakh) {
    words += grp(lakh) + ' Lakh ';
  }
  if (thousand) {
    words += grp(thousand) + ' Thousand ';
  }
  if (hundred) {
    words += grp(hundred) + ' Hundred ';
  }
  if (rem) {
    if (words !== '') words += 'and ';
    if (rem < 20) {
      words += a[rem] + ' ';
    } else {
      words += b[Math.floor(rem / 10)] + (rem % 10 ? '-' + a[rem % 10] : '') + ' ';
    }
  }

  return words.trim() + ' Taka Only';
}

export default function PrintDocument({ document, settings, onBack }: PrintDocumentProps) {
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [wordSuccessNotice, setWordSuccessNotice] = useState(false);

  const isOffer = document.type === 'OFFER_LETTER';
  const isQuotation = document.type === 'QUOTATION';
  const isInvoice = document.type === 'INVOICE';
  const isBill = document.type === 'BILL';

  // Format document titles for presentation
  const getDocTitle = () => {
    switch (document.type) {
      case 'OFFER_LETTER': return 'OFFER LETTER';
      case 'QUOTATION': return 'QUOTATION';
      case 'CHALLAN': return 'DELIVERY CHALLAN (চালান)';
      case 'BILL': return 'BILL';
      case 'INVOICE': return 'INVOICE';
      default: return 'DOCUMENT';
    }
  };

  // Native high-fidelity print on the main window directly using exact A4 styles
  const handlePrint = () => {
    window.print();
  };

  // Helper function to dynamically generate a high-res PNG base64 representation of our exact Jubayer Machineries logo
  const getLogoBase64Png = (): Promise<string> => {
    return new Promise((resolve) => {
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
          <rect width="200" height="200" fill="#ffffff" />
          <!-- 1. BACKGROUND: DIAGONAL INDUSTRIAL WRENCH -->
          <g opacity="0.18">
            <line x1="45" y1="155" x2="140" y2="60" stroke="#475569" stroke-width="14" stroke-linecap="round" />
            <line x1="45" y1="155" x2="140" y2="60" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
            <g transform="translate(142, 58) rotate(-45)">
              <circle cx="0" cy="0" r="16" fill="#475569" />
              <rect x="-16" y="-8" width="20" height="16" fill="#ffffff" />
              <polygon points="-6,-12 -6,12 16,0" fill="#ffffff" />
            </g>
            <g transform="translate(42, 158) rotate(-45)">
              <circle cx="0" cy="0" r="14" fill="#475569" />
              <circle cx="0" cy="0" r="7" fill="#ffffff" />
            </g>
          </g>
          <!-- 2. GEAR SEGMENTS -->
          <g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
            <path d="M 100,20 A 75,75 0 0,1 175,95" fill="none" stroke="#1c3f94" stroke-width="11" stroke-linecap="square" />
            <g fill="#1c3f94">
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(0, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(18, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(36, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(54, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(72, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(90, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
            </g>
            <path d="M 25,105 A 75,75 0 0,0 100,180" fill="none" stroke="#1c3f94" stroke-width="11" stroke-linecap="square" />
            <g fill="#1c3f94">
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(180, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(198, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(216, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(234, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(252, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
              <rect x="94" y="10" width="12" height="10" rx="1.5" transform="rotate(270, 100, 100)" stroke="#ffffff" stroke-width="1.5" />
            </g>
          </g>
          <!-- 3. CENTER BRAND TYPOGRAPHY -->
          <g text-anchor="middle" font-family="Georgia, serif">
            <text x="100" y="93" font-size="25" font-weight="900" letter-spacing="0.06em" fill="#00a651" font-family="Impact, Arial Black, sans-serif">JUBAYER</text>
            <text x="100" y="119" font-size="23" font-weight="900" letter-spacing="0.02em" fill="#c1272d" font-family="Impact, Arial Black, sans-serif">MACHINERIES</text>
            <text x="100" y="136" font-size="10" font-weight="bold" font-style="italic" fill="#222222">Your Sustainable Partner</text>
          </g>
          <!-- 4. BOTTOM CROSSHAIR -->
          <g stroke="#000000" stroke-width="1.5">
            <line x1="50" y1="152" x2="150" y2="152" stroke-width="2" />
            <line x1="120" y1="140" x2="120" y2="170" />
            <rect x="113" y="145" width="14" height="14" fill="#ffffff" stroke="#000000" stroke-width="1.5" />
            <line x1="113" y1="152" x2="127" y2="152" stroke-width="1" />
            <line x1="120" y1="145" x2="120" y2="159" stroke-width="1" />
          </g>
        </svg>
      `;

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = window.document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, 400);
            ctx.drawImage(img, 0, 0, 400, 400);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        };
        img.onerror = () => resolve('');
        img.src = reader.result as string;
      };
      reader.readAsDataURL(svgBlob);
    });
  };

  // Export and download document directly as a Microsoft Word Document (.doc) with high-fidelity formatting
  const handleSaveWord = async () => {
    if (isGeneratingWord) return;
    setIsGeneratingWord(true);
    setWordSuccessNotice(false);

    try {
      // 1. Generate the Base64 PNG image string of our custom logo
      const logoPngBase64 = await getLogoBase64Png().catch(() => '');

      const cleanCustomerName = document.customerName ? document.customerName.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
      const filename = `${document.docNumber}_${cleanCustomerName}.doc`;

      // Build rich Word-friendly HTML content with CSS matching our beautiful 12pt theme
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>${getDocTitle()}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              font-family: "Segoe UI", "Arial", sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #1e293b;
            }
            .header-table {
              width: 100%;
              border-bottom: 3px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 19pt;
              font-weight: bold;
              color: #1e3a8a;
              text-transform: uppercase;
              margin: 0;
            }
            .slogan {
              font-size: 10pt;
              font-weight: bold;
              font-style: italic;
              color: #dc2626;
              margin: 4px 0 0 0;
            }
            .contact-details {
              font-size: 9.5pt;
              color: #475569;
              text-align: right;
              line-height: 1.35;
            }
            .title-bar {
              background-color: #f1f5f9;
              border-left: 5px solid #1e3a8a;
              padding: 10px 15px;
              margin-bottom: 20px;
              width: 100%;
            }
            .title-text {
              font-size: 13pt;
              font-weight: bold;
              color: #1e3a8a;
              text-transform: uppercase;
            }
            .metadata-table {
              width: 100%;
              margin-bottom: 20px;
            }
            .metadata-cell {
              vertical-align: top;
              font-size: 11pt;
              color: #334155;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .items-table th {
              background-color: #1e3a8a;
              color: #ffffff;
              font-weight: bold;
              padding: 10px;
              font-size: 11pt;
              border: 1px solid #1e3a8a;
              text-align: left;
            }
            .items-table td {
              padding: 12px 10px;
              border-bottom: 1px solid #cbd5e1;
              font-size: 11pt;
            }
            .item-name {
              font-weight: bold;
              color: #0f172a;
            }
            .totals-table {
              width: 100%;
              margin-bottom: 25px;
            }
            .amount-words-box {
              background-color: #f0f9ff;
              border: 1px solid #bae6fd;
              padding: 12px;
              font-size: 10.5pt;
              color: #0369a1;
            }
            .totals-breakdown {
              text-align: right;
              font-size: 11pt;
              color: #475569;
            }
            .total-payable {
              font-size: 12pt;
              font-weight: bold;
              color: #1e3a8a;
              border-top: 2px solid #94a3b8;
              padding-top: 8px;
            }
            .terms-box {
              background-color: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 12px;
              font-size: 10pt;
              color: #334155;
            }
            .signature-box {
              text-align: right;
              margin-top: 30px;
              font-size: 11pt;
            }
            .signature-line {
              border-top: 1px solid #475569;
              width: 180px;
              margin-left: auto;
              margin-bottom: 5px;
            }
            .footer-brands {
              border-top: 2px solid #1e3a8a;
              padding-top: 15px;
              margin-top: 40px;
              text-align: center;
              font-size: 8.5pt;
              font-weight: bold;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <!-- Header Address Info block -->
          <table class="header-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
              ${logoPngBase64 ? `
                <td style="vertical-align: middle; width: 85px; padding-right: 15px;">
                  <img src="${logoPngBase64}" width="75" height="75" style="display: block; border: 0;" />
                </td>
              ` : ''}
              <td style="vertical-align: middle;">
                <h1 class="company-name">Jubayer Machineries</h1>
                <p class="slogan">Your Problem Solution is Sustainable Partner</p>
              </td>
              <td class="contact-details" style="vertical-align: middle;">
                <p style="margin: 0; font-weight: bold; color: #1e293b;">Corporate Office: ${settings.address}</p>
                <p style="margin: 3px 0 0 0;">Hotline: ${settings.phone1}, ${settings.phone2}</p>
                <p style="margin: 3px 0 0 0;">Email: ${settings.email}</p>
                <p style="margin: 3px 0 0 0; color: #1e3a8a; font-weight: bold;">Website: ${settings.website}</p>
              </td>
            </tr>
          </table>

          <!-- Document Title & No/Date Bar -->
          <table class="title-bar" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td class="title-text" style="vertical-align: middle;">${getDocTitle()}</td>
              <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 11pt; vertical-align: middle;">
                No: ${document.docNumber}<br/>
                Date: ${document.date}
                ${document.dueDate ? `<br/><span style="color: #dc2626;">Due Date: ${document.dueDate}</span>` : ''}
              </td>
            </tr>
          </table>

          <!-- Recipient Details -->
          <table class="metadata-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td class="metadata-cell" width="55%">
                <p style="margin: 0 0 4px 0; font-size: 9.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Recipient / Client:</p>
                ${document.customerCompany ? `
                  <p style="margin: 0; font-size: 12.5pt; font-weight: bold; color: #0f172a; text-transform: uppercase;">${document.customerCompany}</p>
                  <p style="margin: 2px 0 0 0; font-weight: bold;">Attention: ${document.customerName}</p>
                ` : `
                  <p style="margin: 0; font-size: 12.5pt; font-weight: bold; color: #0f172a;">${document.customerName}</p>
                `}
                <p style="margin: 3px 0 0 0;">Phone: ${document.customerPhone}</p>
                ${document.customerEmail ? `<p style="margin: 3px 0 0 0;">Email: ${document.customerEmail}</p>` : ''}
              </td>
              <td class="metadata-cell" width="45%" style="text-align: right;">
                <p style="margin: 0 0 4px 0; font-size: 9.5pt; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Address:</p>
                <p style="margin: 0; line-height: 1.4; color: #334155; font-weight: bold;">${document.customerAddress.replace(/\n/g, '<br/>')}</p>
              </td>
            </tr>
          </table>

          <!-- Subject and Salutations if Offer Letter/Quotation -->
          ${(isOffer || isQuotation) ? `
            <div style="margin-bottom: 20px; font-size: 11pt; color: #1e293b;">
              ${document.subject ? `<p style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;"><span style="color: #1e3a8a;">Subject:</span> ${document.subject}</p>` : ''}
              ${document.salutation ? `<p style="font-weight: bold; margin-bottom: 10px;">${document.salutation}</p>` : ''}
              ${document.openingParagraph ? `<p style="line-height: 1.5; color: #334155; margin-bottom: 15px;">${document.openingParagraph.replace(/\n/g, '<br/>')}</p>` : ''}
            </div>
          ` : ''}

          <!-- Items list Table -->
          ${document.items && document.items.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th width="8%" style="text-align: center;">SL</th>
                  <th width="42%">Description of Goods / Spare Parts</th>
                  <th width="15%" style="text-align: center;">Brand</th>
                  <th width="10%" style="text-align: center;">Qty</th>
                  <th width="10%" style="text-align: center;">Unit</th>
                  <th width="15%" style="text-align: right;">Price (BDT)</th>
                </tr>
              </thead>
              <tbody>
                ${document.items.map((item, index) => `
                  <tr>
                    <td style="text-align: center; color: #64748b;">${index + 1}</td>
                    <td class="item-name">${item.name}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold;">${item.brand || '—'}</td>
                    <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                    <td style="text-align: center; color: #64748b;">${item.unit || 'Pcs'}</td>
                    <td style="text-align: right; font-weight: bold;">৳${item.price.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <!-- Calculation details table -->
          <table class="totals-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="55%" style="vertical-align: top;">
                <div class="amount-words-box">
                  <span style="font-size: 8pt; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 3px; color: #0284c7;">Amount in Words</span>
                  <strong>${numberToWords(document.total).toUpperCase()}</strong>
                </div>
              </td>
              <td width="45%" class="totals-breakdown" style="vertical-align: top;">
                <table width="100%" border="0" cellspacing="0" cellpadding="4">
                  <tr>
                    <td style="color: #64748b;">Sub-Total:</td>
                    <td style="font-weight: bold; color: #1e293b;">৳${document.subtotal.toLocaleString()}</td>
                  </tr>
                  ${document.vatEnabled !== false && document.vatEnabled !== 0 ? `
                    <tr>
                      <td style="color: #64748b;">VAT / Tax (${document.taxRate}%):</td>
                      <td style="font-weight: bold; color: #1e293b;">৳${document.taxAmount.toLocaleString()}</td>
                    </tr>
                  ` : ''}
                  ${document.discount > 0 ? `
                    <tr style="color: #dc2626; font-weight: bold;">
                      <td>Special Discount:</td>
                      <td>- ৳${document.discount.toLocaleString()}</td>
                    </tr>
                  ` : ''}
                  <tr class="total-payable">
                    <td style="font-weight: bold; color: #1e3a8a;">Total Payable:</td>
                    <td style="font-weight: bold; color: #1e3a8a;">৳${document.total.toLocaleString()}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Terms, signatures and footers -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
            <tr>
              <td width="55%" style="vertical-align: top; padding-right: 20px;">
                ${document.terms ? `
                  <div class="terms-box">
                    <h4 style="font-weight: bold; color: #1e293b; margin: 0 0 5px 0; text-transform: uppercase; font-size: 9pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">Terms & Conditions:</h4>
                    <p style="margin: 0; line-height: 1.4; color: #475569; font-size: 9pt;">${document.terms.replace(/\n/g, '<br/>')}</p>
                  </div>
                ` : ''}
              </td>
              <td width="45%" class="signature-box" style="vertical-align: bottom;">
                ${(isOffer || isQuotation) && document.closingParagraph ? `
                  <p style="font-style: italic; color: #64748b; margin-bottom: 20px; font-size: 9.5pt; text-align: right; line-height: 1.4;">${document.closingParagraph.replace(/\n/g, '<br/>')}</p>
                ` : ''}
                <div class="signature-line"></div>
                <strong style="color: #0f172a; font-size: 11pt;">${document.signatureName}</strong><br/>
                <span style="font-size: 9.5pt; color: #64748b; font-weight: bold; text-transform: uppercase;">${document.signatureLabel}</span><br/>
                <span style="font-size: 8.5pt; color: #94a3b8; font-weight: bold; text-transform: uppercase;">JUBAYER MACHINERIES</span>
              </td>
            </tr>
          </table>

          <!-- Footer brand screw list -->
          <div class="footer-brands">
            <span style="color: #1e293b;">HITACHI</span> | 
            <span style="color: #0054a6;">ATLAS COPCO</span> | 
            <span style="color: #007cc3;">LINGHEIN</span> | 
            <span style="color: #f15a24;">KAESER</span> | 
            <span style="color: #009639;">BOGE</span> | 
            <span style="color: #ed1c24;">ELGI</span> | 
            <span style="color: #003b46;">JAGUAR</span> | 
            <span style="color: #e31b23;">IR INGERSOLL RAND</span> | 
            <span style="color: #00529b;">GARDNER DENVER</span>
            <p style="margin: 5px 0 0 0; font-style: italic; color: #1e3a8a; font-size: 10pt;">
              "We supply all brand screw air compressor genuine spare parts"
            </p>
          </div>
        </body>
        </html>
      `;

      // Convert to blob and trigger safe direct file download as .doc format
      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8'
      });

      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setWordSuccessNotice(true);
      setTimeout(() => setWordSuccessNotice(false), 4000);
    } catch (err) {
      console.error('Word export error:', err);
      alert('An error occurred while generating the Word document. Please try again.');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen py-6 px-2 sm:px-4 flex flex-col items-center">
      {/* Top action bar, hidden in print mode - sticky to ensure it is always accessible */}
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200 p-3 sm:p-4 mb-4 flex flex-wrap gap-3 items-center justify-between no-print sticky top-2 z-40">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer animate-fade-in"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
          )}
          <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            {getDocTitle()} : <span className="font-mono text-blue-900 font-extrabold">{document.docNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            title="Open browser print preview dialog"
          >
            <Printer className="w-4 h-4 text-blue-300" />
            Print Document
          </button>

          {/* Download Word Button */}
          <button
            onClick={handleSaveWord}
            disabled={isGeneratingWord}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download MS Word (.doc) file directly to your device"
          >
            {isGeneratingWord ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                Downloading Word...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-300" />
                Download Word Document
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {wordSuccessNotice && (
        <div className="w-full max-w-4xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between text-xs font-bold shadow-xs animate-fade-in no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Word Document (.doc) successfully generated and saved to downloads!</span>
          </div>
          <button onClick={() => setWordSuccessNotice(false)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
        </div>
      )}

      {/* RENDER STYLED LETTERHEAD SHEETS FOR PRINT AND DISPLAY */}
      <div className="w-full flex justify-center pb-8">
        <div 
          id="printable-area" 
          className="w-full max-w-[210mm] bg-white shadow-xl rounded-lg p-6 sm:p-10 md:p-12 text-slate-800 watermark-container flex flex-col justify-between border border-slate-200 relative print-container mx-auto box-border"
          style={{ minHeight: '297mm' }}
        >
          {/* Header Logo background watermark for crisp PDF/Print support */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[90%] pointer-events-none select-none z-0" style={{ color: '#1e3a8a', opacity: 0.04 }}>
            <Logo className="w-full h-auto text-blue-900" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full space-y-6 flex-1">
            {/* Header Block matching uploaded image */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b-2 border-[#1e3a8a]">
              {/* Left Brand Identity */}
              <div className="flex items-center gap-3 h-12 sm:h-14 md:h-16 w-auto flex-shrink-0">
                <Logo className="h-full w-auto text-blue-900" />
              </div>

              {/* Right Contact Details */}
              <div className="text-right text-[11px] sm:text-xs text-slate-600 space-y-1 font-sans flex-shrink-0 leading-normal">
                <div className="flex items-center justify-end gap-1 font-bold text-slate-800 text-[12px] sm:text-[13px]">
                  <MapPin className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  <span>Corporate Office: {settings.address}</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] sm:text-xs">
                  <Phone className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  <span>{settings.phone1}, {settings.phone2}</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] sm:text-xs">
                  <Mail className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                  <span>{settings.email}</span>
                </div>
                <div className="flex items-center justify-end gap-1 text-blue-800 font-bold text-[11px] sm:text-xs">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <a href={`https://${settings.website}`} target="_blank" rel="noopener noreferrer">{settings.website}</a>
                </div>
              </div>
            </div>

            {/* Document Title Bar */}
            <div className="flex justify-between items-center bg-slate-100 px-4 py-3 rounded border-l-4 border-[#1e3a8a] my-1">
              <span className="text-base sm:text-lg font-black text-blue-900 font-display uppercase tracking-wider">
                {getDocTitle()}
              </span>
              <div className="text-right text-xs sm:text-sm space-y-0.5 font-bold">
                <div><span className="font-semibold text-slate-500">No:</span> <span className="font-black text-slate-900">{document.docNumber}</span></div>
                <div><span className="font-semibold text-slate-500">Date:</span> <span className="font-black text-slate-900">{document.date}</span></div>
                {document.dueDate && (
                  <div><span className="font-semibold text-rose-500">Due Date:</span> <span className="font-black text-slate-900">{document.dueDate}</span></div>
                )}
              </div>
            </div>

            {/* Customer Metadata Block - Increased to 12pt (15px-16px) */}
            <div className="grid grid-cols-2 gap-4 text-sm sm:text-[15px] leading-relaxed pb-4 border-b border-slate-300">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Recipient / Client:</h3>
                {document.customerCompany ? (
                  <>
                    <p className="text-base sm:text-[17px] font-black text-slate-950 font-display uppercase tracking-tight">{document.customerCompany}</p>
                    <p className="font-extrabold text-slate-800 text-sm sm:text-[15px]">Attention: {document.customerName}</p>
                  </>
                ) : (
                  <p className="text-base sm:text-[17px] font-black text-slate-950 font-display">{document.customerName}</p>
                )}
                <p className="text-slate-700 font-semibold flex items-center gap-1.5 text-sm sm:text-[15px]">
                  <Phone className="w-4 h-4 text-blue-800 inline" /> {document.customerPhone}
                </p>
                {document.customerEmail && (
                  <p className="text-slate-700 font-semibold flex items-center gap-1.5 text-sm sm:text-[15px]">
                    <Mail className="w-4 h-4 text-blue-800 inline" /> {document.customerEmail}
                  </p>
                )}
              </div>
              
              <div className="text-right space-y-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Address:</h3>
                <p className="text-slate-800 font-bold whitespace-pre-line text-sm sm:text-[15px] leading-snug">{document.customerAddress}</p>
              </div>
            </div>

            {/* Offer Letter / Quotation Paragraphs - Increased to 12pt (15px-16px) */}
            {(isOffer || isQuotation) && (
              <div className="space-y-2 text-sm sm:text-[15px] leading-relaxed text-slate-800 my-2">
                {document.subject && (
                  <p className="font-black text-slate-950 border-b border-slate-200 pb-1.5 text-sm sm:text-[15px]">
                    <span className="text-blue-900 font-black">Subject:</span> {document.subject}
                  </p>
                )}
                {document.salutation && (
                  <p className="font-extrabold text-slate-900 text-sm sm:text-[15px] pt-1">{document.salutation}</p>
                )}
                {document.openingParagraph && (
                  <p className="whitespace-pre-line text-slate-700 leading-relaxed text-sm sm:text-[15px]">{document.openingParagraph}</p>
                )}
              </div>
            )}

            {/* DOCUMENT ITEMS TABLE - Set to 12pt (15px-16px) and added extra padding to fill the page */}
            {document.items && document.items.length > 0 ? (
              <div className="w-full relative z-10 overflow-hidden my-3">
                <table className="w-full text-left text-sm sm:text-[15px] border-collapse table-fixed">
                  <thead>
                    <tr className="text-white uppercase text-xs sm:text-xs tracking-wider font-extrabold bg-[#1e3a8a]">
                      <th className="py-3 px-1 sm:px-2 text-center rounded-l w-[6%]">SL</th>
                      <th className="py-3 px-3 text-left w-[36%]">Description of Goods / Spare Parts</th>
                      <th className="py-3 px-1 sm:px-2 text-center w-[16%]">Parts Number</th>
                      <th className="py-3 px-1 sm:px-2 text-center w-[8%]">Qty</th>
                      <th className="py-3 px-1 sm:px-2 text-center w-[8%]">Unit</th>
                      <th className="py-3 px-2 sm:px-3 text-right w-[13%]">Unit Price</th>
                      <th className="py-3 px-2 sm:px-3 text-right rounded-r w-[13%]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm sm:text-[15px]">
                    {document.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-1 sm:px-2 text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="py-3.5 px-3 font-extrabold text-slate-950 whitespace-normal leading-normal break-words text-sm sm:text-[15px]">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-1 sm:px-2 text-center">
                          <span className="inline-block bg-slate-100 text-slate-900 font-extrabold px-2 py-0.5 rounded text-xs sm:text-sm font-mono max-w-full border border-slate-200">
                            {item.brand || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-1 sm:px-2 text-center font-extrabold text-slate-950 text-sm sm:text-[15px]">{item.quantity}</td>
                        <td className="py-3.5 px-1 sm:px-2 text-center font-semibold text-slate-600 text-xs sm:text-sm">{item.unit || 'Pcs'}</td>
                        <td className="py-3.5 px-2 sm:px-3 text-right font-extrabold text-slate-950">৳{item.price.toLocaleString()}</td>
                        <td className="py-3.5 px-2 sm:px-3 text-right font-black text-slate-950 text-sm sm:text-[16px]">৳{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm sm:text-base italic bg-slate-50 rounded border border-dashed border-slate-200">
                No items listed in this document.
              </div>
            )}

            {/* Pricing Totals & Word Conversion - Set to 12pt (15px-16px) */}
            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start my-3 relative z-10">
              {/* Word Conversion (Left column) */}
              <div className="col-span-7 p-3 sm:p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1 text-blue-900">
                  Amount in Words
                </span>
                <p className="text-xs sm:text-sm font-black italic text-blue-950 leading-relaxed uppercase">
                  {numberToWords(document.total)}
                </p>
              </div>

              {/* Calculations Breakdown (Right column) */}
              <div className="col-span-5 text-xs sm:text-sm space-y-1.5 font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Sub-Total:</span>
                  <span className="text-slate-900 font-bold">৳{document.subtotal.toLocaleString()}</span>
                </div>
                {document.vatEnabled !== false && document.vatEnabled !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT / Tax ({document.taxRate}%):</span>
                    <span className="text-slate-900 font-bold">৳{document.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {document.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-extrabold">
                    <span>Special Discount:</span>
                    <span>- ৳{document.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-black border-t-2 border-slate-300 pt-2 text-blue-900">
                  <span>Total Payable:</span>
                  <span className="text-base sm:text-lg font-black text-blue-950">৳{document.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms, Conditions & Closing - Increased text readability */}
            <div className="grid grid-cols-2 gap-4 mt-3 border-t border-slate-200 pt-4 text-xs sm:text-sm relative z-10 flex-1">
              {/* Left side: Terms of Offer */}
              {document.terms ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300">
                  <h4 className="font-black text-slate-800 uppercase tracking-widest mb-1.5 border-b border-slate-200 pb-1 text-[10px] sm:text-xs">
                    Terms & Conditions:
                  </h4>
                  <p className="whitespace-pre-line text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans font-semibold">
                    {document.terms}
                  </p>
                </div>
              ) : <div />}

              {/* Right side: Closing letter text & Signatures */}
              <div className="flex flex-col justify-between items-end text-right h-full min-h-[120px]">
                {(isOffer || isQuotation) && document.closingParagraph && (
                  <p className="text-slate-600 font-bold italic text-xs sm:text-[13px] mb-3 leading-normal max-w-sm">
                    {document.closingParagraph}
                  </p>
                )}
                
                <div className="mt-auto pt-3 text-right w-44 sm:w-52">
                  <div className="h-10 w-full mb-1 border-b-2 border-slate-400"></div>
                  <p className="font-black text-slate-950 text-xs sm:text-sm font-display leading-none">{document.signatureName}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase font-bold">{document.signatureLabel}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">{settings.name}</p>
                </div>
              </div>
            </div>

            {/* High-Fidelity Print Slogan and Brands Footer matching the image */}
            <div className="pt-4 mt-auto text-center relative z-10 border-t-2 border-[#1e3a8a] space-y-1">
              {/* Logo labels representing standard machinery footer brands with exact colors and uppercase styling */}
              <div className="flex flex-wrap items-center justify-center gap-y-1 gap-x-2 mb-1.5 text-[9px] sm:text-[10px] font-extrabold tracking-wider font-sans uppercase">
                <span className="text-[#0a192f] font-black">HITACHI</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#0054a6] font-black">ATLAS COPCO</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#007cc3] font-black">LINGHEIN</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#f15a24] font-black">KAESER</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#009639] font-black">BOGE</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#ed1c24] font-black">ELGI</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#003b46] font-black">JAGUAR</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#e31b23] font-black">IR INGERSOLL RAND</span>
                <span className="text-slate-300">|</span>
                <span className="text-[#00529b] font-black">GARDNER DENVER</span>
              </div>
              <p className="text-[10px] sm:text-xs font-black italic font-sans text-blue-900">
                "We supply all brand screw air compressor genuine spare parts"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
