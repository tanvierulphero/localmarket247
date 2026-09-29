import { useState, useMemo } from 'react';
import { Product } from '../types';
import { Search, SlidersHorizontal, Check, ArrowRight, Phone, Mail, MapPin, Award, ShieldCheck, Settings2, Sparkles } from 'lucide-react';
import Logo from './Logo';

interface PublicCatalogProps {
  products: Product[];
  onAdminClick: () => void;
}

export default function PublicCatalog({ products, onAdminClick }: PublicCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Quote request form states
  const [quoteRequest, setQuoteRequest] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isQuoteSubmitted, setIsQuoteSubmitted] = useState(false);
  const [contactMessage, setContactMessage] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);

  // Categories list extracted from products
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Brands list extracted from products
  const brands = useMemo(() => {
    const list = new Set(products.map(p => p.brand));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchBrand = selectedBrand === 'All' || product.brand === selectedBrand;
      const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchBrand && matchSearch;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery]);

  // Handle Quote Submission
  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRequest.name || !quoteRequest.phone) {
      alert("Please provide your name and phone number so we can reach you.");
      return;
    }
    setIsQuoteSubmitted(true);
    setTimeout(() => {
      setIsQuoteSubmitted(false);
      setQuoteRequest({ name: '', company: '', phone: '', email: '', message: '' });
      setSelectedProduct(null);
    }, 4000);
  };

  // Handle Contact Submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.name || !contactMessage.phone) {
      alert("Please enter your name and phone number.");
      return;
    }
    setIsContactSubmitted(true);
    setTimeout(() => {
      setIsContactSubmitted(false);
      setContactMessage({ name: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* Top Notification Bar */}
      <div className="bg-blue-900 text-slate-100 text-[11px] md:text-xs font-semibold py-2 px-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-4 max-w-7xl mx-auto w-full justify-between">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <span className="bg-blue-800 text-blue-100 font-extrabold px-2.5 py-0.5 rounded text-[10px] tracking-wide border border-blue-700">
              Supported by Superstar Engineering BD
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-300" /> 01715-994956, 01799-498199
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-300" /> ssengbd25@gmail.com
            </span>
          </div>
          <button 
            onClick={onAdminClick}
            className="flex items-center gap-1 text-slate-100 hover:text-white bg-blue-800 hover:bg-blue-700 font-bold px-3 py-1 rounded transition-colors text-[11px] cursor-pointer flex-shrink-0"
          >
            <Settings2 className="w-3 h-3" />
            Admin Dashboard
          </button>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo & Technical Partner Tag */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-auto flex-shrink-0">
                <Logo className="h-full w-auto text-blue-900" forPublic={true} />
              </div>
              <div className="hidden lg:flex flex-col justify-center border-l border-slate-200 pl-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  Technical Partner
                </span>
                <span className="text-xs font-bold text-slate-800 tracking-tight mt-0.5">
                  Superstar Engineering BD
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#products-showcase" className="hover:text-blue-900 transition-colors">Products</a>
            <a href="#supported-brands" className="hover:text-blue-900 transition-colors">Brands Supported</a>
            <a href="#about-us" className="hover:text-blue-900 transition-colors">About Us</a>
            <a href="#contact" className="hover:text-blue-900 transition-colors">Contact</a>
          </nav>

          <a 
            href="#contact"
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
          >
            Get a Quote
          </a>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white py-16 md:py-24 px-4 relative overflow-hidden no-print">
        {/* Subtle geometric gear mesh in the background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <svg className="w-[800px] h-[800px] text-white animate-spin-slow" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50,15A35,35 0 1,0 85,50A35,35 0 0,0 50,15 M50,30 A20,20 0 1,1 30,50 A20,20 0 0,1 50,30" />
            <path d="M50,5 L46,15 L54,15 Z M50,95 L46,85 L54,85 Z M5,50 L15,46 L15,54 Z M95,50 L85,46 L85,54 Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-800/60 border border-blue-700 text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Industrial Machinery & Spares Supplier in Gazipur
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight leading-tight">
              Premium Screw Air Compressors & <span className="text-blue-300">Genuine Spare Parts</span>
            </h1>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
              We specialize in supply, commission, and repair services of all major brands of industrial screw air compressors, refrigerated dryers, and replacement filtration systems. Your Problem Solution is Sustainable Partner.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a 
                href="#products-showcase" 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all hover:translate-x-1 flex items-center gap-1.5 cursor-pointer"
              >
                Browse Catalog
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#contact" 
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-bold rounded-lg transition-colors cursor-pointer"
              >
                Contact Sales Office
              </a>
            </div>
          </div>

          {/* Slogan cards / visual points */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-5 rounded-xl space-y-2">
              <Award className="w-8 h-8 text-blue-300" />
              <h3 className="font-bold text-white text-base">Genuine Sourced</h3>
              <p className="text-xs text-slate-300">We source directly to provide 100% genuine spares from world-leading brands.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-5 rounded-xl space-y-2">
              <ShieldCheck className="w-8 h-8 text-blue-300" />
              <h3 className="font-bold text-white text-base">Expert Engineering</h3>
              <p className="text-xs text-slate-300">Professional setup, technical troubleshooting, and maintenance services.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-5 rounded-xl space-y-2 sm:col-span-2">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-widest">Our Promise</h4>
              <p className="text-xs text-slate-200">"We supply all brand screw air compressor genuine spare parts with guaranteed post-sales support across industrial sectors in Bangladesh."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Showcase / Filters and Catalog */}
      <main id="products-showcase" className="max-w-7xl mx-auto px-4 md:px-6 py-12 flex-1 w-full no-print">
        <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Our Industrial Machinery Catalog
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Explore available heavy machines, refrigeration air dryers, filtration equipment, and mechanical spare parts.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search SKU, brand or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-950 focus:ring-1 focus:ring-blue-950 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 bg-slate-100 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters:
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-blue-900 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-slate-300 mx-1 hidden lg:block"></div>

          {/* Brand Pills */}
          <div className="flex flex-wrap gap-1.5">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedBrand === brand 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {brand === 'All' ? 'All Brands' : brand}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image Block */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                      {product.brand}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      {product.stock > 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                          In Stock ({product.stock})
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 shadow-xs">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {product.category} &bull; Model {product.sku}
                    </div>
                    
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors text-base leading-snug line-clamp-2 h-11">
                      {product.name}
                    </h3>
                    
                    <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Specifications List */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                        {product.specs.slice(0, 4).map((spec, i) => (
                          <div key={i} className="text-slate-500 truncate">
                            <span className="font-bold text-slate-700">{spec.label}:</span> {spec.value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer and Price */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
                      Pricing Info
                    </span>
                    <span className="text-xs font-extrabold text-blue-950 italic">
                      Contact for Price
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Details & Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 py-16 px-4 text-center max-w-md mx-auto">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 font-display">No Products Match Filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try updating your search query or setting the category and brand filters back to "All".
            </p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedBrand('All'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-blue-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Brands Bottom Section */}
      <section id="supported-brands" className="bg-white border-t border-b border-slate-200 py-12 px-4 no-print">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h2 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Premium Brands We Support</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            We provide parts, overhaul services, and brand-new machinery of all major global compressed air giants.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-85">
            <div className="flex flex-col items-center">
              <span className="text-sm font-black font-display text-blue-900 tracking-tight">HITACHI</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Japan</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-black font-display text-blue-800 tracking-tight">Atlas Copco</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Sweden</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-black font-display text-teal-800 tracking-tight">KAESER</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Germany</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-black font-display text-slate-800 tracking-tight">BOGE</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">Germany</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-black font-display text-rose-800 tracking-tight">ELGi</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">India</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-black font-display text-indigo-950 tracking-tight">Ingersoll Rand</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">USA</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-us" className="py-16 px-4 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center no-print border-b border-slate-200">
        <div className="space-y-4">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-widest block">About hitachisolutioncenter</span>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 tracking-tight leading-tight">
            Reliable Partner in Industrial Compressed Air Solutions
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Based in Gazipur City, the heart of Bangladesh's manufacturing hubs, we supply screw air compressors, refrigerated dryers, line filters, and genuine spare parts. We maintain a showroom of standard components to ensure your mills run without interruption.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Check className="w-4 h-4 text-emerald-600" /> Fully integrated supply and troubleshooting setup.
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Check className="w-4 h-4 text-emerald-600" /> Authorized parts sourcing matching strict machinery specs.
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Check className="w-4 h-4 text-emerald-600" /> Technical on-site maintenance inside Gazipur, Dhaka, & Narsingdi.
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 space-y-6">
          <h3 className="font-bold text-slate-900 font-display text-lg">Our Vision Slogan</h3>
          <p className="text-sm italic text-blue-950 font-sans leading-relaxed">
            "Your Problem Solution is Sustainable Partner. We believe in building trust through authentic parts and professional engineer support to maximize machinery lifetime."
          </p>
          <div className="border-t border-blue-200 pt-4 flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-slate-900">MD MAHI UDDIN</p>
              <p className="text-slate-500">Managing Director</p>
            </div>
            <span className="bg-blue-900 text-white font-bold text-[10px] px-2 py-1 rounded">EST. 2018</span>
          </div>
        </div>
      </section>

      {/* Interactive Contact & Quotation Office Section */}
      <section id="contact" className="py-16 px-4 bg-slate-900 text-white no-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">Corporate Presence</span>
              <h2 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">
                Our Head Office & Showroom
              </h2>
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Drop by our showroom in Bason Sharok, Gazipur to inspect compressors in person, or reach out to our service team via phone or email for immediate diagnostics.
            </p>

            <div className="space-y-4 text-xs md:text-sm">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Office Address</h4>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    Corporate Office: Hazi Siddik Complex, Molla Market, Bason Sharok, Gazipur City, Bangladesh.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Direct Hotlines</h4>
                  <p className="text-slate-300 text-xs mt-1">
                    01715-994956<br />01799-498199
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Official Email</h4>
                  <p className="text-slate-300 text-xs mt-1">
                    jubayermachineries@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 bg-slate-850 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg font-display text-white mb-4">Send an Instant Inquiry</h3>
            
            {isContactSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-6 rounded-xl text-center space-y-2">
                <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-base text-white">Inquiry Submitted Successfully</h4>
                <p className="text-xs text-slate-300">
                  Thank you for contacting hitachisolutioncenter. Our sales team will reach out to you via your phone number within 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Your Full Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Engr. Atiqur Rahman" 
                      value={contactMessage.name}
                      onChange={(e) => setContactMessage({...contactMessage, name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 focus:outline-hidden focus:border-rose-500 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Phone Number <span className="text-rose-500">*</span></label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. 01712-XXXXXX" 
                      value={contactMessage.phone}
                      onChange={(e) => setContactMessage({...contactMessage, phone: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 focus:outline-hidden focus:border-rose-500 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. atiq@factory.com" 
                    value={contactMessage.email}
                    onChange={(e) => setContactMessage({...contactMessage, email: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 focus:outline-hidden focus:border-rose-500 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Requirement details or Spare Parts SNo.</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe which compressor model spare part or overhaul service you require..." 
                    value={contactMessage.message}
                    onChange={(e) => setContactMessage({...contactMessage, message: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 focus:outline-hidden focus:border-rose-500 rounded-lg p-2.5 text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-900 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-bold text-slate-200">
              &copy; 2026 hitachisolutioncenter &bull; <span className="text-blue-400">Supported by Superstar Engineering BD</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">All Rights Reserved &bull; Gazipur Industrial Zone, Bangladesh</p>
          </div>
          <p className="italic text-xs font-medium text-slate-400">"Your Problem Solution is Sustainable Partner."</p>
        </div>
      </footer>

      {/* PRODUCT SPECIFICATION & QUICK INQUIRY MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-blue-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-0.5">
                  Product Specifications
                </span>
                <h3 className="font-bold font-display text-base leading-none">
                  {selectedProduct.name}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedProduct(null); setIsQuoteSubmitted(false); }}
                className="text-white/80 hover:text-white font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Close &times;
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specs list */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 text-xs">Technical Details</h4>
                    <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100">
                      <div className="flex justify-between p-2.5 bg-slate-50">
                        <span className="text-slate-500 font-semibold">SKU Code</span>
                        <span className="font-bold text-slate-800">{selectedProduct.sku}</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-500 font-semibold">Category</span>
                        <span className="font-bold text-slate-800">{selectedProduct.category}</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-slate-50">
                        <span className="text-slate-500 font-semibold">Brand Origin</span>
                        <span className="font-bold text-slate-800">{selectedProduct.brand}</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-500 font-semibold">Unit Type</span>
                        <span className="font-bold text-slate-800">{selectedProduct.unit}</span>
                      </div>
                    </div>
                  </div>

                  {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1.5 text-xs">Manufacturer Specs</h4>
                      <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100">
                        {selectedProduct.specs.map((spec, i) => (
                          <div key={i} className="flex justify-between p-2.5 hover:bg-slate-50 transition-colors">
                            <span className="text-slate-500 font-semibold">{spec.label}</span>
                            <span className="font-bold text-slate-800 text-right">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right form inside detail modal */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                    Request Official Quotation
                  </h4>

                  {isQuoteSubmitted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-600 p-4 rounded-lg text-center space-y-2 h-full flex flex-col justify-center py-8">
                      <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                      <h5 className="font-bold text-slate-900">Quotation Requested</h5>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Your request for <b>{selectedProduct.name}</b> was logged. MD MAHI UDDIN's sales desk will contact you with a printed PDF quotation.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleQuoteSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Your Name <span className="text-rose-600">*</span></label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Engr. Yusuf" 
                          value={quoteRequest.name}
                          onChange={(e) => setQuoteRequest({...quoteRequest, name: e.target.value})}
                          className="w-full bg-white border border-slate-200 focus:outline-hidden focus:border-blue-900 rounded-md p-2 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Company Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Hamza Fabrics" 
                          value={quoteRequest.company}
                          onChange={(e) => setQuoteRequest({...quoteRequest, company: e.target.value})}
                          className="w-full bg-white border border-slate-200 focus:outline-hidden focus:border-blue-900 rounded-md p-2 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Phone / Contact <span className="text-rose-600">*</span></label>
                        <input 
                          type="tel" 
                          required
                          placeholder="e.g. 01712-XXXXXX" 
                          value={quoteRequest.phone}
                          onChange={(e) => setQuoteRequest({...quoteRequest, phone: e.target.value})}
                          className="w-full bg-white border border-slate-200 focus:outline-hidden focus:border-blue-900 rounded-md p-2 text-slate-800"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                      >
                        Request PDF Quotation
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">Extended Description</h4>
                <p className="text-slate-600 leading-relaxed font-sans">{selectedProduct.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
