import React, { useState, useMemo } from 'react';
import { CatalogProduct, Customer, Document, BusinessSettings } from '../types';
import { 
  Search, 
  SlidersHorizontal, 
  Check, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  ShieldCheck, 
  Settings2, 
  LogIn,
  Sparkles, 
  Loader2, 
  FileText, 
  ExternalLink,
  MessageCircle,
  Send,
  X,
  Tag,
  Zap,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { apiSaveDocument, apiSaveCustomer } from '../lib/api';
import { generateNextDocNumber } from '../lib/documentNumber';
import Logo from './Logo';

interface PublicCatalogProps {
  catalogProducts: CatalogProduct[];
  onAdminClick: () => void;
  onSaveDocument?: (doc: Document) => Promise<void>;
  onSaveCustomer?: (c: Customer) => Promise<void>;
  settings?: BusinessSettings;
  customers?: Customer[];
  documents?: Document[];
}

export default function PublicCatalog({ 
  catalogProducts = [], 
  onAdminClick,
  onSaveDocument,
  onSaveCustomer,
  settings,
  customers = [],
  documents = []
}: PublicCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'contact' | 'quote'>('contact');
  
  // Quote request form states
  const [quoteRequest, setQuoteRequest] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    quantity: 1,
    message: ''
  });
  const [isQuoteSubmitted, setIsQuoteSubmitted] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [generatedQuoteNumber, setGeneratedQuoteNumber] = useState<string>('');

  const [contactMessage, setContactMessage] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Filter only active catalog products for the public showcase
  const activeProducts = useMemo(() => {
    return (catalogProducts || []).filter(p => p.status !== 'hidden');
  }, [catalogProducts]);

  // Categories list extracted from active showcase products
  const categories = useMemo(() => {
    const list = new Set(activeProducts.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [activeProducts]);

  // Brands list extracted from active showcase products
  const brands = useMemo(() => {
    const list = new Set(activeProducts.map(p => p.brand).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [activeProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeProducts.filter(product => {
      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchBrand = selectedBrand === 'All' || product.brand === selectedBrand;
      const matchSearch = 
        !query ||
        product.name.toLowerCase().includes(query) || 
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.specs && product.specs.some(s => s.label.toLowerCase().includes(query) || s.value.toLowerCase().includes(query)));
      return matchCategory && matchBrand && matchSearch;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [activeProducts, selectedCategory, selectedBrand, searchQuery]);

  // WhatsApp helper
  const rawWa = (settings?.whatsapp || settings?.phone1 || '01715-994956').replace(/[^0-9]/g, '');
  const cleanWaNumber = rawWa.startsWith('88') ? rawWa : (rawWa ? `88${rawWa}` : '8801715994956');

  // Generate 1-click WhatsApp link for a specific product
  const getProductWhatsAppUrl = (product: CatalogProduct) => {
    const priceText = 'Price on Request / Negotiable';
    const text = `Hello ${settings?.name || 'Hitachi Air Solution Center'}! I am interested in:\n\n*${product.name}*\n• Brand: ${product.brand}\n• Category: ${product.category}\n• Price: ${priceText}\n\nPlease share more details and availability. Thank you!`;
    return `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(text)}`;
  };

  // General WhatsApp contact link
  const generalWhatsAppUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(`Hello hitachiairsolutioncenter (Technical support by ${settings?.name || 'Jubayer Machineries'})! I visited your website and would like to inquire about your Screw Air Compressors and genuine spare parts.`)}`;

  // Messenger URL
  const rawMessenger = (settings?.messengerUrl || '').trim();
  const messengerUrl = rawMessenger.startsWith('http') 
    ? rawMessenger 
    : (rawMessenger ? `https://m.me/${rawMessenger.replace('@', '')}` : 'https://m.me/hitachiairsolutioncenter');

  // Phone Call URL
  const hotlinePhone = (settings?.phone1 || '01715-994956').trim();
  const phoneCallUrl = `tel:${hotlinePhone.replace(/[^0-9+]/g, '')}`;

  // Handle Quote Submission
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRequest.name?.trim() || !quoteRequest.phone?.trim()) {
      alert("Please enter your name and phone number.");
      return;
    }
    if (!selectedProduct) return;

    setIsSubmittingQuote(true);

    try {
      const cleanPhone = String(quoteRequest.phone || '').trim();
      const existingCustomer = (customers || []).find(c => 
        (c.phone && cleanPhone && String(c.phone).replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')) ||
        (c.company && quoteRequest.company && String(c.company).toLowerCase().trim() === String(quoteRequest.company).toLowerCase().trim())
      );

      const customerId = existingCustomer ? existingCustomer.id : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const customerObj: Customer = {
        id: customerId,
        companyId: existingCustomer?.companyId || `COMP-${1001 + (customers?.length || 0)}`,
        name: quoteRequest.name.trim(),
        company: quoteRequest.company.trim() || quoteRequest.name.trim(),
        phone: cleanPhone,
        email: quoteRequest.email.trim() || existingCustomer?.email || '',
        address: existingCustomer?.address || '',
        notes: `Website Quote Inquiry for Showcase Product: ${selectedProduct.name} (${selectedProduct.brand})${quoteRequest.message ? ' - Message: ' + quoteRequest.message : ''}`,
        createdAt: existingCustomer?.createdAt || new Date().toISOString()
      };

      const generatedDocNumber = generateNextDocNumber('QUOTATION', documents, settings);
      const todayStr = new Date().toISOString().split('T')[0];
      const qty = Math.max(1, Number(quoteRequest.quantity) || 1);
      const unitPrice = selectedProduct.callForPrice ? 0 : (selectedProduct.price || 0);
      const totalAmount = unitPrice * qty;

      const newQuotation: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'QUOTATION',
        docNumber: generatedDocNumber,
        date: todayStr,
        customerId: customerObj.id,
        customerName: customerObj.name,
        customerCompany: customerObj.company,
        customerPhone: customerObj.phone,
        customerEmail: customerObj.email,
        customerAddress: customerObj.address,
        subject: `Quotation Proposal for ${selectedProduct.name} (${selectedProduct.brand})`,
        salutation: `Dear ${customerObj.name},`,
        openingParagraph: `Thank you for your inquiry via our official product showcase website. We are pleased to provide our formal price quotation for the following equipment:`,
        closingParagraph: `This quotation proposal is valid for 15 days. For technical site inspection, delivery schedule, or order confirmation, please reach our sales desk directly.`,
        items: [
          {
            id: `item-${Date.now()}`,
            name: selectedProduct.name,
            brand: selectedProduct.brand,
            quantity: qty,
            price: unitPrice,
            total: totalAmount,
            unit: 'Set',
            warrantyMonths: 12
          }
        ],
        subtotal: totalAmount,
        taxRate: 0,
        taxAmount: 0,
        discount: 0,
        total: totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        status: 'Draft',
        terms: settings?.terms || '1. Delivery within 1-3 business days upon confirmed work order.\n2. Genuine industrial quality guarantee.\n3. Brand warranty applicable.',
        notes: quoteRequest.message ? `Visitor inquiry notes: ${quoteRequest.message}` : `Online Showcase Inquiry for ${selectedProduct.name}`,
        signatureName: settings?.signatureName || 'MD MAHI UDDIN',
        signatureLabel: settings?.signatureLabel || 'Managing Director'
      };

      if (onSaveCustomer) {
        await onSaveCustomer(customerObj);
      } else {
        await apiSaveCustomer(customerObj).catch(() => {});
      }

      if (onSaveDocument) {
        await onSaveDocument(newQuotation);
      } else {
        await apiSaveDocument(newQuotation).catch(() => {});
      }

      setGeneratedQuoteNumber(generatedDocNumber);
      setIsQuoteSubmitted(true);

      setTimeout(() => {
        setIsQuoteSubmitted(false);
        setQuoteRequest({ name: '', company: '', phone: '', email: '', quantity: 1, message: '' });
      }, 5000);
    } catch (err: any) {
      console.error('Failed to submit quote request:', err);
      setIsQuoteSubmitted(true);
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Handle General Contact Form Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.name?.trim() || !contactMessage.phone?.trim()) {
      alert("Please provide your name and phone number.");
      return;
    }

    setIsSubmittingContact(true);

    try {
      const cleanPhone = contactMessage.phone.trim();
      const customerObj: Customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        companyId: `COMP-${1001 + (customers?.length || 0)}`,
        name: contactMessage.name.trim(),
        company: contactMessage.name.trim(),
        phone: cleanPhone,
        email: contactMessage.email.trim(),
        address: '',
        notes: `Website General Contact Message: ${contactMessage.message || 'General inquiry from public contact form'}`,
        createdAt: new Date().toISOString()
      };

      if (onSaveCustomer) {
        await onSaveCustomer(customerObj);
      } else {
        await apiSaveCustomer(customerObj).catch(() => {});
      }
    } catch (err) {
      console.warn('Contact sync note:', err);
    } finally {
      setIsSubmittingContact(false);
    }

    setIsContactSubmitted(true);
    setTimeout(() => {
      setIsContactSubmitted(false);
      setContactMessage({ name: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      {/* 1. TOP ANNOUNCEMENT & CONTACT STRIP */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2.5 px-4 border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>hitachiairsolutioncenter</span>
              <span className="text-slate-400 font-medium hidden sm:inline">&bull; Technical support by {settings?.name || 'Jubayer Machineries'}</span>
            </span>
            <a 
              href={phoneCallUrl} 
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{hotlinePhone}</span>
            </a>
            {settings?.email && (
              <a 
                href={`mailto:${settings.email}`} 
                className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>{settings.email}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick 1-Click Social Bar in Header */}
            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-2xs"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-all shadow-2xs"
              title="Contact on Facebook Messenger"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Messenger</span>
            </a>

            <button 
              onClick={onAdminClick}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer border border-slate-700 ml-1"
              title="Staff & Management Login"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {settings?.publicLogoUrl ? (
              <div className="h-10 sm:h-12 w-auto max-w-[260px] flex items-center">
                <Logo logoUrl={settings.publicLogoUrl} className="h-full w-auto object-contain" forPublic={true} />
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  hitachiairsolutioncenter
                </span>
                <span className="text-[11px] font-bold text-blue-800 tracking-wide">
                  Technical support by {settings?.name || 'Jubayer Machineries'}
                </span>
                {settings?.slogan && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {settings.slogan}
                  </span>
                )}
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs uppercase font-extrabold tracking-wider text-slate-600">
            <a href="#showcase-catalog" className="hover:text-blue-600 transition-colors">Showcase Catalog</a>
            <a href="#engineering-solutions" className="hover:text-blue-600 transition-colors">Solutions & Services</a>
            <a href="#why-choose-us" className="hover:text-blue-600 transition-colors">Why Choose Us</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact Us</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a 
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Direct Chat
            </a>
            <a 
              href="#contact"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Request Quote
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER WITH HITACHI SHOWCASE ACCENTS */}
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white py-12 md:py-16 px-4 relative overflow-hidden no-print">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 text-blue-200 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Industrial Screw Air Compressors &amp; Genuine Spare Parts
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-tight text-white">
              Hitachi Air Solution Center
              <span className="block text-lg sm:text-xl lg:text-2xl font-bold text-blue-400 mt-1 font-sans">
                Technical Support by Jubayer Machineries
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Specialized showcase catalog for Hitachi, Atlas Copco, Kaeser, Ingersoll Rand, and all brand screw air compressors, refrigerated air dryers, precision line filters, and 100% genuine replacement spare parts.
            </p>

            <div className="bg-blue-900/40 border border-blue-700/50 rounded-xl p-3 text-xs text-blue-200 max-w-xl font-medium">
              &ldquo;We supply all brand screw air compressor genuine spare parts&rdquo; &bull; Your Problem Solution is Sustainable Partner.
            </div>

            {/* Quick 1-Click Social Media CTAs in Hero */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={generalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>

              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Facebook Messenger
              </a>

              <a
                href={phoneCallUrl}
                className="px-5 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                Call Hotline
              </a>
            </div>

            <div className="pt-2 flex items-center gap-6 text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Genuine Original Equipment
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                Certified Technical Support
              </div>
            </div>
          </div>

          {/* Hero Feature Highlights Card */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Screw Air Compressors</h3>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Heavy-duty fixed speed and VSD inverter rotary screw compressors for 24/7 industrial factory air demand.
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-3">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">100% Genuine Spares</h3>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                Air filters, oil filters, air/oil separators, and New Hiscrew Oil 2000 Japanese synthetic lubricants.
              </p>
            </div>

            <div className="sm:col-span-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/40 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-white text-sm">Need Engineering Advice or a Quote?</h4>
                <p className="text-xs text-blue-200 mt-0.5">Our experienced technical engineering team is ready to assist.</p>
              </div>
              <a
                href={generalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 flex-shrink-0 shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN CUSTOM PRODUCT SHOWCASE CATALOG */}
      <main id="showcase-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full no-print">
        {/* Title & Search bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Public Product Showcase
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              Our Showcase Collection
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Select any equipment to explore specifications and connect directly with our engineering team via 1-click WhatsApp or Messenger.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search products, models, or brands..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills & Filters */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-blue-900 text-white shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Products' : cat}
              </button>
            ))}
          </div>

          {brands.length > 2 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pl-1">
                Brand Filter:
              </span>
              {brands.map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBrand === brand 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {brand === 'All' ? 'All Brands' : brand}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const waUrl = getProductWhatsAppUrl(product);

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Tag className="w-8 h-8 opacity-40 mb-1" />
                        <span className="text-xs font-bold">Image Preview</span>
                      </div>
                    )}

                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                        {product.badge}
                      </span>
                    )}

                    <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      {product.brand}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">
                      {product.category}
                    </div>

                    <h3 
                      onClick={() => setSelectedProduct(product)}
                      className="font-black text-slate-900 text-base line-clamp-2 leading-snug cursor-pointer hover:text-blue-600 transition-colors"
                      title={product.name}
                    >
                      {product.name}
                    </h3>

                    {/* Price - Call for Price / Negotiable */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 text-xs font-extrabold border border-blue-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        Call for Price / Negotiable
                      </span>
                    </div>

                    {/* Specs Pills */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="mt-3.5 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {product.specs.slice(0, 3).map((spec, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                            <span className="text-[11px] font-bold text-slate-400">{spec.label}:</span>
                            <span className="text-[11px] font-bold text-slate-800">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {product.description && (
                      <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* 1-CLICK SOCIAL MEDIA CONTACT ACTIONS ON CARD */}
                <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* 1-Click WhatsApp Button */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-2xs hover:shadow-emerald-500/25 cursor-pointer"
                      title="Inquire about this product on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* 1-Click Messenger Button */}
                    <a
                      href={messengerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-2xs hover:shadow-blue-500/25 cursor-pointer"
                      title="Contact on Facebook Messenger"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Messenger</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={phoneCallUrl}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" /> Direct Call
                    </a>

                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setActiveModalTab('contact');
                      }}
                      className="text-[11px] font-black text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-black text-slate-700">No products found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search query or choosing another category.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedBrand('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 5. ENGINEERING SOLUTIONS & WHY CHOOSE US */}
      <section id="engineering-solutions" className="bg-white py-14 border-t border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              Our Engineering Services & Solutions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Beyond equipment sales — we are your reliable long-term engineering partner for technical planning, installation, and preventive maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Screw Air Compressor Engineering</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turnkey installation, piping design, pressure regulation, and commissioning of fixed speed and VSD inverter rotary screw compressor systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">100% Genuine Spare Parts & Oil</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Factory OEM air/oil separator elements, intake filters, micro line filters, and Hitachi New Hiscrew Oil 2000 Japanese synthetic lubricants.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Annual Maintenance Contracts (AMC)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive scheduled maintenance, screw airend overhauling, cooler cleaning, vibration diagnostics, and 24/7 breakdown technical support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT & QUICK INQUIRY SECTION */}
      <section id="contact" className="bg-slate-900 text-white py-14 px-4 no-print border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-blue-400 text-xs font-black uppercase tracking-wider">
              Get In Touch
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Our Office & Showroom
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Connect with our technical consultants for product demonstrations, customized VRF project estimates, or emergency servicing.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200">
                  {settings?.address || 'Haji Siddique Complex, Mollah Market, Bason Sarak, Gazipur City.'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200">{hotlinePhone}{settings?.phone2 ? `, ${settings.phone2}` : ''}</span>
              </div>

              {settings?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-200">{settings.email}</span>
                </div>
              )}
            </div>

            {/* Direct Social Links */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href={generalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Chat
              </a>

              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Send className="w-4 h-4" />
                Facebook Messenger
              </a>

              {settings?.telegramUrl && (
                <a
                  href={settings.telegramUrl.startsWith('http') ? settings.telegramUrl : `https://t.me/${settings.telegramUrl.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <Send className="w-4 h-4" />
                  Telegram
                </a>
              )}
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="lg:col-span-7 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
            <h3 className="text-base font-black text-white mb-1">
              Send Us a Direct Message
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit your inquiry and contact information. Our representative will get back to you promptly.
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactMessage.name}
                    onChange={(e) => setContactMessage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Engr. Tanvir Ahmed"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={contactMessage.phone}
                    onChange={(e) => setContactMessage(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 01715-XXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={contactMessage.email}
                  onChange={(e) => setContactMessage(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Your Message / Requirements</label>
                <textarea
                  rows={3}
                  value={contactMessage.message}
                  onChange={(e) => setContactMessage(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your HVAC inquiry, required capacity, or project details..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {isContactSubmitted && (
                <div className="p-3 bg-emerald-900/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Thank you! Your message has been submitted. Our sales and engineering team will reach out shortly.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingContact}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingContact ? 'Sending Message...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 px-4 border-t border-slate-900 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="font-extrabold text-white text-sm">
              hitachiairsolutioncenter
              <span className="text-slate-400 font-semibold block text-[11px] mt-0.5">
                Technical support by {settings?.name || 'Jubayer Machineries'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {settings?.slogan || 'Your Problem Solution is Sustainable Partner'}
            </p>

          <div className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} {settings?.name || 'Hitachi Air Solution Center'}. All rights reserved.
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <a href={generalWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              WhatsApp
            </a>
            <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Messenger
            </a>
            <button onClick={onAdminClick} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              Admin Login
            </button>
          </div>
        </div>
      </footer>

      {/* 8. FLOATING 1-CLICK QUICK CONTACT SPEED DIAL (Fixed bottom corner) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 no-print">
        {/* WhatsApp Floating Action Button */}
        <a
          href={generalWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-2xl hover:scale-105 transition-all group"
          title="Chat directly on WhatsApp"
        >
          <MessageCircle className="w-5 h-5 animate-bounce" />
          <span className="hidden sm:inline font-bold">WhatsApp Chat</span>
        </a>

        {/* Messenger Floating Action Button */}
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all"
          title="Facebook Messenger"
        >
          <Send className="w-5 h-5" />
        </a>
      </div>

      {/* 9. PRODUCT DETAILS & 1-CLICK SOCIAL CONTACT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  {selectedProduct.category}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg line-clamp-1 text-white">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsQuoteSubmitted(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Product Visual & Price */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-full sm:w-52 aspect-video sm:aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                  {selectedProduct.imageUrl ? (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                      No Image
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider">
                      {selectedProduct.brand}
                    </span>
                    {selectedProduct.badge && (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider">
                        {selectedProduct.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                    {selectedProduct.name}
                  </h4>

                  <div className="pt-2">
                    <span className="text-blue-900 text-xs font-extrabold bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200/80 inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      Call for Price / Negotiable
                    </span>
                  </div>

                  {selectedProduct.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Specifications Table */}
              {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Technical Specifications:
                  </h5>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200 text-xs">
                    {selectedProduct.specs.map((spec, i) => (
                      <div key={i} className="flex items-center justify-between px-3.5 py-2">
                        <span className="font-bold text-slate-500">{spec.label}</span>
                        <span className="font-extrabold text-slate-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1-CLICK INSTANT SOCIAL CONTACT PANEL IN MODAL */}
              <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    1-Click Instant Connect
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Direct Response
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={getProductWhatsAppUrl(selectedProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat on WhatsApp
                  </a>

                  <a
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Facebook Messenger
                  </a>
                </div>

                <div className="text-center">
                  <a
                    href={phoneCallUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Direct Hotline: <strong className="text-slate-900">{hotlinePhone}</strong>
                  </a>
                </div>
              </div>

              {/* Tabs for Quote Request */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab(activeModalTab === 'quote' ? 'contact' : 'quote')}
                    className="text-xs font-extrabold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {activeModalTab === 'quote' ? 'Hide Form' : 'Need an official quotation proposal? Click here to request'}
                  </button>
                </div>

                {activeModalTab === 'quote' && (
                  <form onSubmit={handleQuoteSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={quoteRequest.name}
                          onChange={(e) => setQuoteRequest(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your full name"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={quoteRequest.phone}
                          onChange={(e) => setQuoteRequest(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="017XXXXXXXX"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          value={quoteRequest.company}
                          onChange={(e) => setQuoteRequest(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Company or facility name"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={quoteRequest.quantity}
                          onChange={(e) => setQuoteRequest(prev => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 outline-none"
                        />
                      </div>
                    </div>

                    {isQuoteSubmitted && (
                      <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Quotation request received! Quotation Ref: {generatedQuoteNumber}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingQuote}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingQuote ? 'Submitting...' : 'Submit Quotation Request'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
