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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessNotice, setPdfSuccessNotice] = useState(false);

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

  // Download PDF file directly using browser native SVG engine (html-to-image) and jsPDF
  const handleSavePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfSuccessNotice(false);

    // Fail-safe timeout to guarantee button state is reset
    const safetyTimeout = setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 10000);

    try {
      const element = window.document.getElementById('printable-area');
      if (!element) {
        setIsGeneratingPdf(false);
        clearTimeout(safetyTimeout);
        alert('Printable document area not found.');
        return;
      }

      const cleanCustomerName = document.customerName ? document.customerName.replace(/[^a-zA-Z0-9]/g, '_') : 'Customer';
      const filename = `${document.docNumber}_${cleanCustomerName}.pdf`;

      // Render the DOM node to a crisp high-resolution PNG with fixed 2x scale
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          borderRadius: '0px',
          boxShadow: 'none',
        }
      });

      // Construct A4 PDF document (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (imgHeight <= pdfHeight) {
        // Fits on single page - position in the vertical middle of the page
        const yOffset = (pdfHeight - imgHeight) / 2;
        pdf.addImage(dataUrl, 'PNG', 0, Math.max(0, yOffset), pdfWidth, imgHeight);
      } else {
        // Multi-page document handling for lengthy item tables
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 2) {
          position = position - pdfHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      pdf.save(filename);

      setPdfSuccessNotice(true);
      setTimeout(() => setPdfSuccessNotice(false), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('An error occurred while generating the PDF file. Please try again.');
    } finally {
      clearTimeout(safetyTimeout);
      setIsGeneratingPdf(false);
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

          {/* Download PDF Button */}
          <button
            onClick={handleSavePdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download PDF file directly to your device"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                Downloading PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-300" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {pdfSuccessNotice && (
        <div className="w-full max-w-4xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between text-xs font-bold shadow-xs animate-fade-in no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PDF Document successfully generated and saved to downloads!</span>
          </div>
          <button onClick={() => setPdfSuccessNotice(false)} className="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
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
