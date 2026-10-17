import { Product, CatalogProduct, Customer, Document, StaffUser, BusinessSettings, FieldDispatch, Supplier, Purchase, SalesReturn, Expense } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  // Dynamic base-path resolution for 100% cPanel subdirectory / subfolder compatibility
  const targetUrl = url.startsWith('/api/') ? url.substring(1) : url;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (err: any) {
    throw new Error(`Network Error: ${err.message || 'Server unreachable'}`);
  }

  // If 404, attempt direct PHP endpoint fallback e.g. api/index.php?endpoint=products
  if (response.status === 404 && url.startsWith('/api/') && !url.startsWith('/api/index.php')) {
    const rawPath = url.replace(/^\/api\//, '');
    const parts = rawPath.split('/').filter(Boolean);
    const endpoint = parts[0] || '';
    const id = parts[1] || '';
    const fallbackUrl = `api/index.php?endpoint=${encodeURIComponent(endpoint)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;

    try {
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (fallbackResponse.ok) {
        return fallbackResponse.json();
      }
    } catch {
      // Ignore fallback network error and throw clear error below
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '' }));
    
    if (response.status === 404) {
      throw new Error(`Endpoint not found (${url})`);
    }

    throw new Error(errorData.error || `Server error (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data;
}

// Helper to normalize product keys between MySQL (snake_case) and JSON/Frontend (camelCase)
function normalizeProduct(p: any): Product {
  if (!p) return p;
  return {
    ...p,
    imageUrl: p.imageUrl || p.image_url || '',
    costPrice: p.costPrice !== undefined ? p.costPrice : (p.cost_price !== undefined ? p.cost_price : 0),
  };
}

// Helper to normalize catalog product keys
function normalizeCatalogProduct(p: any): CatalogProduct {
  if (!p) return p;
  return {
    ...p,
    imageUrl: p.imageUrl || p.image_url || '',
    callForPrice: Boolean(p.callForPrice || p.call_for_price),
    displayOrder: Number(p.displayOrder ?? p.display_order) || 0,
    specs: Array.isArray(p.specs) ? p.specs : (typeof p.specs === 'string' ? JSON.parse(p.specs || '[]') : []),
  };
}

// Public Showcase Catalog Products API (Completely independent of Inventory)
export const apiGetCatalogProducts = async (): Promise<CatalogProduct[]> => {
  const data = await fetchJson<CatalogProduct[]>('/api/catalog-products');
  return Array.isArray(data) ? data.map(normalizeCatalogProduct) : [];
};

export const apiSaveCatalogProduct = async (product: CatalogProduct): Promise<CatalogProduct> => {
  const data = await fetchJson<CatalogProduct>('/api/catalog-products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return normalizeCatalogProduct(data);
};

export const apiDeleteCatalogProduct = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/catalog-products/${id}`, { method: 'DELETE' });

// Products API (Internal ERP / Inventory Stock)
export const apiGetProducts = async (): Promise<Product[]> => {
  const data = await fetchJson<Product[]>('/api/products');
  return Array.isArray(data) ? data.map(normalizeProduct) : [];
};

export const apiSaveProduct = async (product: Product): Promise<Product> => {
  const data = await fetchJson<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return normalizeProduct(data);
};

export const apiDeleteProduct = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' });

// Customers API
export const apiGetCustomers = (): Promise<Customer[]> => fetchJson<Customer[]>('/api/customers');
export const apiSaveCustomer = (customer: Customer): Promise<Customer> =>
  fetchJson<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
export const apiDeleteCustomer = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/customers/${id}`, { method: 'DELETE' });

// Documents API
export const apiGetDocuments = (): Promise<Document[]> => fetchJson<Document[]>('/api/documents');
export const apiSaveDocument = (doc: Document): Promise<Document> =>
  fetchJson<Document>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(doc),
  });
export const apiDeleteDocument = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' });

// Staff API
export const apiGetStaff = (): Promise<StaffUser[]> => fetchJson<StaffUser[]>('/api/staff');
export const apiSaveStaff = (staff: StaffUser): Promise<StaffUser> =>
  fetchJson<StaffUser>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(staff),
  });
export const apiDeleteStaff = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/staff/${id}`, { method: 'DELETE' });

// Settings API
export const apiGetSettings = (): Promise<BusinessSettings> => fetchJson<BusinessSettings>('/api/settings');
export const apiSaveSettings = (settings: BusinessSettings): Promise<BusinessSettings> =>
  fetchJson<BusinessSettings>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });

// Field Dispatches API
export const apiGetFieldDispatches = (): Promise<FieldDispatch[]> => fetchJson<FieldDispatch[]>('/api/field-dispatches');
export const apiSaveFieldDispatch = (dispatch: FieldDispatch): Promise<FieldDispatch> =>
  fetchJson<FieldDispatch>('/api/field-dispatches', {
    method: 'POST',
    body: JSON.stringify(dispatch),
  });
export const apiDeleteFieldDispatch = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/field-dispatches/${id}`, { method: 'DELETE' });

// Suppliers API
export const apiGetSuppliers = (): Promise<Supplier[]> => fetchJson<Supplier[]>('/api/suppliers');
export const apiSaveSupplier = (supplier: Supplier): Promise<Supplier> =>
  fetchJson<Supplier>('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
export const apiDeleteSupplier = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/suppliers/${id}`, { method: 'DELETE' });

// Purchases / Stock Inward API
export const apiGetPurchases = (): Promise<Purchase[]> => fetchJson<Purchase[]>('/api/purchases');
export const apiSavePurchase = (purchase: Purchase): Promise<Purchase> =>
  fetchJson<Purchase>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
export const apiDeletePurchase = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/purchases/${id}`, { method: 'DELETE' });

// Sales Returns / Restock API
export const apiGetReturns = (): Promise<SalesReturn[]> => fetchJson<SalesReturn[]>('/api/returns');
export const apiSaveReturn = (salesReturn: SalesReturn): Promise<SalesReturn> =>
  fetchJson<SalesReturn>('/api/returns', {
    method: 'POST',
    body: JSON.stringify(salesReturn),
  });
export const apiDeleteReturn = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/returns/${id}`, { method: 'DELETE' });

// Database Clear & Reset Management
export const apiClearDatabase = (): Promise<{ success: boolean; message: string }> =>
  fetchJson<{ success: boolean; message: string }>('/api/database/clear', { method: 'POST' });

export const apiSeedDemoData = (): Promise<{ success: boolean; message: string }> =>
  fetchJson<{ success: boolean; message: string }>('/api/database/seed-demo', { method: 'POST' });

// Daily Expenses API
export const apiGetExpenses = (): Promise<Expense[]> => fetchJson<Expense[]>('/api/expenses');
export const apiSaveExpense = (expense: Expense): Promise<Expense> =>
  fetchJson<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
export const apiDeleteExpense = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' });

// Helper to read file as data URL, preserving vector SVG and PNG transparency
export function readFileAsDataUrl(file: File, maxDim: number = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('File reader produced empty result'));
        return;
      }

      const isSvg = file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg');
      // SVGs must never be rasterized onto a canvas — they are crisp vector XML
      if (isSvg) {
        resolve(rawDataUrl);
        return;
      }

      // If image is already lightweight (under 600KB), return directly to preserve pristine quality
      if (file.size <= 600 * 1024) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          resolve(rawDataUrl);
          return;
        }

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Preserve PNG transparency! Never convert PNG with transparency into JPEG!
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
        const mimeType = isPng ? 'image/png' : (isWebp ? 'image/webp' : 'image/jpeg');
        const quality = isPng ? undefined : 0.88;

        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        // Direct data url fallback if canvas cannot decode
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
}

// Helper to convert file to Base64 for server-side cPanel decode
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file from disk for cPanel upload'));
    reader.readAsDataURL(file);
  });
}

// Image Upload API - Uploads exclusively to cPanel Server (/uploads directory)
// Pure server-side persistence: File is physically uploaded and stored on the cPanel server.
export async function apiUploadImage(file: File): Promise<{ url: string; relative_url?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);

  // 1. Try standard FormData POST to cPanel & Node upload endpoints
  const endpoints = [
    'api/upload.php',
    '/api/upload.php',
    'api/upload',
    '/api/upload',
    'api/index.php?endpoint=upload',
    '/api/index.php?endpoint=upload'
  ];

  let lastServerError = '';

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(ep, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => null);
        const url = data?.url || data?.image_url || data?.image;
        if (url) {
          return { url, relative_url: data?.relative_url };
        }
      } else {
        const errData = await response.json().catch(() => null);
        if (errData?.error || errData?.message) {
          lastServerError = errData.error || errData.message;
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        lastServerError = e?.message || lastServerError;
      }
    }
  }

  // 2. If FormData was rejected by cPanel post limits or proxy, send Base64 JSON payload
  // The cPanel PHP server will decode this directly on the server and write the physical file to /uploads/
  try {
    const base64Data = await fileToBase64(file);
    const jsonPayload = JSON.stringify({
      base64: base64Data,
      filename: file.name,
    });

    const jsonEndpoints = [
      'api/upload.php',
      '/api/upload.php',
      'api/index.php?endpoint=upload',
      '/api/index.php?endpoint=upload'
    ];

    for (const ep of jsonEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonPayload,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json().catch(() => null);
          const url = data?.url || data?.image_url || data?.image;
          if (url) {
            return { url, relative_url: data?.relative_url };
          }
        } else {
          const errData = await response.json().catch(() => null);
          if (errData?.error || errData?.message) {
            lastServerError = errData.error || errData.message;
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          lastServerError = err?.message || lastServerError;
        }
      }
    }
  } catch (base64Err: any) {
    lastServerError = base64Err?.message || lastServerError;
  }

  // Exclusively upload to server - no local storage or client data url fallback
  throw new Error(
    'Failed to upload file to server. Please ensure the /uploads directory exists and has write permissions (755 or 777).'
  );
}

export function isCpanelDeployment(): boolean {
  return true;
}

export interface DbHealthResult {
  status: 'ok' | 'error';
  database: string;
  connected: boolean;
  latencyMs?: number;
  tables?: {
    products: number;
    customers: number;
    documents: number;
    staff_users: number;
    field_dispatches?: number;
  };
  uploadsFolderWritable?: boolean;
  timestamp: string;
  error?: string;
}

export async function apiCheckDatabaseHealth(): Promise<DbHealthResult> {
  // 1. First try /api/health (Node server / Cloud SQL)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('/api/health', {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && (data.status === 'ok' || data.connected)) {
        return data;
      }
    }
  } catch {
    // Continue to cPanel endpoint
  }

  // 2. Try cPanel PHP API endpoint (api/index.php?endpoint=health)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('api/index.php?endpoint=health', {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'db_config_required') {
        return {
          status: 'error',
          database: 'MySQL / MariaDB (cPanel)',
          connected: false,
          error: data.message || 'Please configure MySQL database credentials in api/config.php',
          timestamp: new Date().toISOString(),
        };
      }
      return data;
    }
    const errData = await response.json().catch(() => ({}));
    return {
      status: 'error',
      database: 'MySQL / MariaDB (cPanel)',
      connected: false,
      error: errData.error || `HTTP ${response.status} ${response.statusText}`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: 'error',
      database: 'SQL Database',
      connected: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Database server unreachable'),
      timestamp: new Date().toISOString(),
    };
  }
}

// Sync All Live Data to SQL Files (database.sql / schema.sql)
export const apiSyncAllToSql = (allData: {
  products?: Product[];
  customers?: Customer[];
  documents?: Document[];
  staff?: StaffUser[];
  settings?: BusinessSettings;
  fieldDispatches?: FieldDispatch[];
  suppliers?: Supplier[];
  purchases?: Purchase[];
  salesReturns?: SalesReturn[];
  expenses?: Expense[];
}): Promise<{ success: boolean; count: number; message: string }> =>
  fetchJson<{ success: boolean; count: number; message: string }>('/api/sync-all-to-sql', {
    method: 'POST',
    body: JSON.stringify(allData),
  });

// Get raw SQL text from server for preview / copy
export const apiGetSqlText = async (fileName: 'database.sql' | 'schema.sql' = 'database.sql'): Promise<{ success: boolean; fileName: string; sql: string }> => {
  try {
    const res = await fetchJson<{ success: boolean; fileName: string; sql: string }>(`/api/export-sql-text?file=${encodeURIComponent(fileName)}`);
    return res;
  } catch (err: any) {
    // Fallback: fetch directly
    const fallbackRes = await fetch(`/${fileName}?t=${Date.now()}`);
    if (fallbackRes.ok) {
      const text = await fallbackRes.text();
      return { success: true, fileName, sql: text };
    }
    throw err;
  }
};

/**
 * Direct file download trigger in browser
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'application/sql') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



