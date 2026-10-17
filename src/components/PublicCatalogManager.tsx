import React, { useState, useMemo, useRef } from 'react';
import { CatalogProduct, BusinessSettings, StaffUser } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  Globe, 
  MessageCircle, 
  Send, 
  Phone, 
  Mail, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Save, 
  ExternalLink, 
  Tag, 
  X,
  Sliders,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { apiUploadImage } from '../lib/api';

interface PublicCatalogManagerProps {
  catalogProducts: CatalogProduct[];
  settings: BusinessSettings;
  currentUser?: StaffUser | null;
  onSaveProduct: (product: CatalogProduct) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onSaveSettings: (settings: BusinessSettings) => Promise<void>;
  onVisitPublicSite: () => void;
}

const CATEGORY_PRESETS = [
  'Screw Air Compressor',
  'Air Dryer',
  'Line Filter',
  'Spare Parts',
  'Compressor Lubricant',
  'Air Receiver Tank',
  'Industrial Maintenance (AMC)'
];

const BRAND_PRESETS = [
  'Hitachi',
  'Atlas Copco',
  'KAESER',
  'Ingersoll Rand',
  'Kobelco',
  'Sullair',
  'BOGE',
  'ELGi',
  'Linghein'
];

const BADGE_PRESETS = [
  '',
  'Best Seller',
  'Featured',
  'Hot Deal',
  'New Arrival',
  'Commercial Grade',
  'Industrial Special'
];

export default function PublicCatalogManager({
  catalogProducts,
  settings,
  currentUser,
  onSaveProduct,
  onDeleteProduct,
  onSaveSettings,
  onVisitPublicSite
}: PublicCatalogManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'active' | 'hidden'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social Links Form in quick settings card
  const [socialForm, setSocialForm] = useState({
    whatsapp: settings.whatsapp || settings.phone1 || '',
    messengerUrl: settings.messengerUrl || '',
    facebookUrl: settings.facebookUrl || '',
    telegramUrl: settings.telegramUrl || '',
    phone1: settings.phone1 || '',
    phone2: settings.phone2 || '',
    email: settings.email || ''
  });
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [socialSaveSuccess, setSocialSaveSuccess] = useState(false);
  const [isSocialSettingsOpen, setIsSocialSettingsOpen] = useState(false);

  // Form State for Create/Edit Modal
  const [form, setForm] = useState<{
    id: string;
    name: string;
    category: string;
    brand: string;
    price: number | string;
    callForPrice: boolean;
    badge: string;
    description: string;
    specs: { label: string; value: string }[];
    imageUrl: string;
    status: 'active' | 'hidden';
    displayOrder: number;
  }>({
    id: '',
    name: '',
    category: 'Inverter Split AC',
    brand: 'Hitachi',
    price: '',
    callForPrice: false,
    badge: 'Featured',
    description: '',
    specs: [
      { label: 'Cooling Capacity', value: '1.5 Ton' },
      { label: 'Type', value: 'Inverter' },
      { label: 'Refrigerant', value: 'R32 Eco' },
      { label: 'Warranty', value: '10 Years Compressor' }
    ],
    imageUrl: '',
    status: 'active',
    displayOrder: 1
  });

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set(catalogProducts.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [catalogProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.badge && p.badge.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [catalogProducts, searchQuery, selectedCategory, selectedStatus]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({
      id: `cat-prod-${Date.now()}`,
      name: '',
      category: 'Inverter Split AC',
      brand: 'Hitachi',
      price: '',
      callForPrice: false,
      badge: '',
      description: '',
      specs: [
        { label: 'Cooling Capacity', value: '1.5 Ton (18,000 BTU)' },
        { label: 'Technology', value: 'Tropical Inverter' },
        { label: 'Refrigerant', value: 'R32' },
        { label: 'Warranty', value: '10 Years Compressor' }
      ],
      imageUrl: '',
      status: 'active',
      displayOrder: (catalogProducts.length || 0) + 1
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: CatalogProduct) => {
    setEditingProduct(p);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category || 'Inverter Split AC',
      brand: p.brand || 'Hitachi',
      price: p.callForPrice ? '' : (p.price || ''),
      callForPrice: Boolean(p.callForPrice),
      badge: p.badge || '',
      description: p.description || '',
      specs: p.specs && p.specs.length > 0 ? [...p.specs] : [{ label: '', value: '' }],
      imageUrl: p.imageUrl || '',
      status: p.status || 'active',
      displayOrder: p.displayOrder || 1
    });
    setIsModalOpen(true);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await apiUploadImage(file);
      if (result && result.url) {
        setForm(prev => ({ ...prev, imageUrl: result.url }));
      }
    } catch (err: any) {
      alert('Failed to upload image: ' + (err.message || 'Error'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Spec rows management
  const handleAddSpecRow = () => {
    setForm(prev => ({
      ...prev,
      specs: [...prev.specs, { label: '', value: '' }]
    }));
  };

  const handleRemoveSpecRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index)
    }));
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    setForm(prev => {
      const copy = [...prev.specs];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, specs: copy };
    });
  };

  // Quick Spec Presets
  const handleApplyAcPreset = () => {
    setForm(prev => ({
      ...prev,
      specs: [
        { label: 'Cooling Capacity', value: '1.5 Ton (18,000 BTU/hr)' },
        { label: 'Compressor Type', value: 'Dual Rotary Tropical Inverter' },
        { label: 'Refrigerant', value: 'Eco-Friendly R32' },
        { label: 'Energy Saving', value: 'Up to 60% Power Save' },
        { label: 'Copper Condenser', value: '100% Inner Grooved Copper' },
        { label: 'Warranty', value: '10 Years Compressor, 1 Year Parts' }
      ]
    }));
  };

  // Save Product
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter the product name.');
      return;
    }

    setIsSaving(true);
    try {
      const finalProduct: CatalogProduct = {
        id: form.id || `cat-prod-${Date.now()}`,
        name: form.name.trim(),
        category: form.category.trim() || 'General',
        brand: form.brand.trim() || 'Hitachi',
        price: form.callForPrice ? 0 : Number(form.price) || 0,
        callForPrice: form.callForPrice,
        badge: form.badge.trim(),
        description: form.description.trim(),
        specs: form.specs.filter(s => s.label.trim() && s.value.trim()),
        imageUrl: form.imageUrl.trim(),
        status: form.status,
        displayOrder: Number(form.displayOrder) || 1,
        createdAt: editingProduct?.createdAt || new Date().toISOString().split('T')[0]
      };

      await onSaveProduct(finalProduct);
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Failed to save product: ' + (err.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (product: CatalogProduct) => {
    const updated: CatalogProduct = {
      ...product,
      status: product.status === 'active' ? 'hidden' : 'active'
    };
    try {
      await onSaveProduct(updated);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Delete Product
  const handleDelete = async (id: string, name: string) => {
    if (!onDeleteProduct) return;
    if (confirm(`Are you sure you want to delete "${name}" from the showcase catalog?`)) {
      try {
        await onDeleteProduct(id);
      } catch (err: any) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  // Save Social Links
  const handleSaveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocial(true);
    try {
      const updatedSettings: BusinessSettings = {
        ...settings,
        whatsapp: socialForm.whatsapp.trim(),
        messengerUrl: socialForm.messengerUrl.trim(),
        facebookUrl: socialForm.facebookUrl.trim(),
        telegramUrl: socialForm.telegramUrl.trim(),
        phone1: socialForm.phone1.trim() || settings.phone1,
        phone2: socialForm.phone2.trim(),
        email: socialForm.email.trim() || settings.email
      };
      await onSaveSettings(updatedSettings);
      setSocialSaveSuccess(true);
      setTimeout(() => setSocialSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save social links: ' + err.message);
    } finally {
      setIsSavingSocial(false);
    }
  };

  // Format WhatsApp Link
  const cleanWaNumber = (socialForm.whatsapp || '').replace(/[^0-9]/g, '');
  const waTestUrl = cleanWaNumber 
    ? `https://wa.me/${cleanWaNumber.startsWith('88') ? cleanWaNumber : '88' + cleanWaNumber}?text=${encodeURIComponent('Hello Hitachi Air Solution Center! I am contacting you from the public website.')}`
    : '';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Public Showcase Catalog Manager
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            Public Website Custom Catalog
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Manage custom products specifically showcased on the public website. Completely separated from inventory stock and ERP operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onVisitPublicSite}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 cursor-pointer shadow-xs"
            title="Preview Public Website"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            Visit Public Site
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Products</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {catalogProducts.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Showcase items</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Live Visible</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {catalogProducts.filter(p => p.status === 'active').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active on public site</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Hidden / Draft</span>
            <EyeOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {catalogProducts.filter(p => p.status === 'hidden').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Hidden from public</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Categories</span>
            <Tag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">
            {categories.length - 1}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active groups</p>
        </div>
      </div>

      {/* Social Media 1-Click Contact Configuration Section */}
      <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
        <div 
          onClick={() => setIsSocialSettingsOpen(!isSocialSettingsOpen)}
          className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 flex items-center justify-between cursor-pointer border-b border-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  1-Click Social Media & Quick Contact Settings
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Instant Connect
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Configure direct WhatsApp numbers, Messenger links, and hotline contacts for the public website.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white/80 transition-all"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isSocialSettingsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isSocialSettingsOpen && (
          <form onSubmit={handleSaveSocialLinks} className="p-5 sm:p-6 space-y-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp Number
                  </span>
                  {waTestUrl && (
                    <a 
                      href={waTestUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      Test Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  value={socialForm.whatsapp}
                  onChange={(e) => setSocialForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="e.g. 01715-994956 or +8801715994956"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-semibold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Visitors can reach your team on WhatsApp directly in 1 click from product cards.
                </p>
              </div>

              {/* Facebook Messenger */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <Send className="w-3.5 h-3.5" />
                    Facebook Messenger URL
                  </span>
                  {socialForm.messengerUrl && (
                    <a 
                      href={socialForm.messengerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Test Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  value={socialForm.messengerUrl}
                  onChange={(e) => setSocialForm(prev => ({ ...prev, messengerUrl: e.target.value }))}
                  placeholder="e.g. https://m.me/hitachiairsolutioncenter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-semibold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Facebook Page Messenger short link (e.g. https://m.me/yourpage)
                </p>
              </div>

              {/* Facebook Page URL */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-blue-900">
                  <Globe className="w-3.5 h-3.5" />
                  Facebook Page URL
                </label>
                <input
                  type="text"
                  value={socialForm.facebookUrl}
                  onChange={(e) => setSocialForm(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  placeholder="e.g. https://www.facebook.com/hitachiairsolutioncenter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-semibold"
                />
              </div>

              {/* Telegram URL */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-sky-700">
                  <Send className="w-3.5 h-3.5" />
                  Telegram Username or URL
                </label>
                <input
                  type="text"
                  value={socialForm.telegramUrl}
                  onChange={(e) => setSocialForm(prev => ({ ...prev, telegramUrl: e.target.value }))}
                  placeholder="e.g. https://t.me/hitachiairsolution"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-sm font-semibold"
                />
              </div>

              {/* Primary Hotline */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  Hotline / Primary Phone
                </label>
                <input
                  type="text"
                  value={socialForm.phone1}
                  onChange={(e) => setSocialForm(prev => ({ ...prev, phone1: e.target.value }))}
                  placeholder="01715-994956"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-semibold"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={socialForm.email}
                  onChange={(e) => setSocialForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@hitachiairsolutioncenter.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {socialSaveSuccess ? (
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Social media contact settings saved successfully!
                </div>
              ) : <div />}

              <button
                type="submit"
                disabled={isSavingSocial}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingSocial ? 'Saving...' : 'Save Social Settings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, or category..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-semibold text-slate-800"
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

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active (Visible)</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            title="Table View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Display (Grid View) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                product.status === 'hidden' ? 'border-amber-200 bg-amber-50/20 opacity-80' : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs font-bold flex flex-col items-center gap-1">
                      <Tag className="w-8 h-8 opacity-40" />
                      No Image Uploaded
                    </div>
                  )}

                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                      {product.badge}
                    </span>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      product.status === 'active' 
                        ? 'bg-emerald-500 text-white shadow-2xs' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {product.status === 'active' ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                    <span>{product.brand}</span>
                    <span>•</span>
                    <span className="text-slate-500">{product.category}</span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base line-clamp-2 leading-tight">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="mt-3 flex items-baseline gap-2">
                    {product.callForPrice ? (
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-black border border-blue-200">
                        Call for Price / Negotiable
                      </span>
                    ) : (
                      <span className="text-lg font-black text-slate-900">
                        ৳ {Number(product.price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Specs summary pills */}
                  {product.specs && product.specs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {product.specs.slice(0, 3).map((spec, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                          <strong className="font-bold text-slate-900">{spec.label}:</strong> {spec.value}
                        </span>
                      ))}
                      {product.specs.length > 3 && (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 font-bold">
                          +{product.specs.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {product.description && (
                    <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleStatus(product)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    product.status === 'active'
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  title={product.status === 'active' ? 'Hide Product' : 'Make Visible'}
                >
                  {product.status === 'active' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" /> Show
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {onDeleteProduct && (
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-black text-slate-700">No showcase products found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click the button below to add custom products for display on the public website.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Display (Table View) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Image</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Brand</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Order</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="w-12 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900 max-w-xs">
                      <div className="truncate">{p.name}</div>
                      {p.badge && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {p.badge}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{p.category}</td>
                    <td className="p-3 font-bold text-blue-700">{p.brand}</td>
                    <td className="p-3 font-black text-slate-900">
                      {p.callForPrice ? (
                        <span className="text-blue-700 text-[11px] font-bold">On Request</span>
                      ) : (
                        `৳ ${Number(p.price).toLocaleString()}`
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-500">{p.displayOrder || 0}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                          p.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status === 'active' ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {onDeleteProduct && (
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  {editingProduct ? '✎' : '+'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {editingProduct ? 'Edit Showcase Product' : 'Add New Showcase Product'}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Custom catalog product displayed on the public website
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Hitachi 1.5 Ton Tropical Inverter Split AC (Shizen Series)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold"
                />
              </div>

              {/* Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    list="cat-presets"
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Inverter Split AC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold"
                  />
                  <datalist id="cat-presets">
                    {CATEGORY_PRESETS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    list="brand-presets"
                    value={form.brand}
                    onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Hitachi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold"
                  />
                  <datalist id="brand-presets">
                    {BRAND_PRESETS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
              </div>

              {/* Price & Call for Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Displayed Price (BDT)
                  </label>
                  <input
                    type="number"
                    disabled={form.callForPrice}
                    value={form.price}
                    onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder={form.callForPrice ? 'Negotiable / Call' : 'e.g. 78500'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm font-semibold ${
                      form.callForPrice 
                        ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' 
                        : 'bg-white border-slate-300 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="pt-2 sm:pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.callForPrice}
                      onChange={(e) => setForm(prev => ({ ...prev, callForPrice: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-slate-800">
                      "Call for Price" (Negotiable / On Request)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    When enabled, visitors will see "Call for Price / Negotiable" instead of a fixed price.
                  </p>
                </div>
              </div>

              {/* Badge & Display Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Highlight Badge
                  </label>
                  <select
                    value={form.badge}
                    onChange={(e) => setForm(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none cursor-pointer"
                  >
                    <option value="">No Badge</option>
                    <option value="Featured">Featured</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Hot Deal">Hot Deal</option>
                    <option value="New Arrival">New Arrival</option>
                    <option value="Popular Choice">Popular Choice</option>
                    <option value="Industrial Grade">Industrial Grade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm(prev => ({ ...prev, displayOrder: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none cursor-pointer"
                  >
                    <option value="active">Active (Visible on website)</option>
                    <option value="hidden">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Image Upload & URL */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Product Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-28 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Paste image URL or upload a file"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none focus:border-blue-500"
                    />

                    <div className="flex items-center gap-2">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingImage ? 'Uploading...' : 'Upload from Device'}
                      </button>

                      {form.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                          className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Key features, cooling capacity, technical highlights..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-medium"
                />
              </div>

              {/* Key Specifications Table Builder */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Key Technical Specifications
                  </label>
                  <button
                    type="button"
                    onClick={handleApplyAcPreset}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Load AC Preset
                  </button>
                </div>

                <div className="space-y-2">
                  {form.specs.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => handleSpecChange(index, 'label', e.target.value)}
                        placeholder="e.g. Capacity"
                        className="w-1/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold outline-none bg-white"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                        placeholder="e.g. 1.5 Ton / 18,000 BTU"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddSpecRow}
                  className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Specification
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
