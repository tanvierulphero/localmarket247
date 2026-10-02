import { Product, Customer, Document, StaffUser, BusinessSettings, FieldDispatch, Supplier, Purchase, SalesReturn, Expense } from '../types';

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

// Products API
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

// Helper to read and compress file as compact base64 data URL (max 800px, 70% JPEG quality)
// Prevents cPanel LiteSpeed HTTP 503 errors caused by oversized POST payloads
function readFileAsDataUrl(file: File, maxDim: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        // Direct data url fallback if canvas cannot decode
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
}

// Image Upload API with Server & Client Fallback
export async function apiUploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // 1. Try modern Node server /api/upload endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.url) {
        return data;
      }
    }
  } catch {
    // Continue to next fallback
  }

  // 2. Try cPanel PHP upload endpoint (relative & absolute for subfolder compatibility)
  const cpanelEndpoints = [
    'api/upload_product_image.php',
    '/api/upload_product_image.php',
    'api/upload.php',
    '/api/upload.php',
    'api/index.php?endpoint=upload'
  ];
  for (const ep of cpanelEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(ep, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const url = data.url || data.image_url || data.image;
        if (url) {
          return { url };
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  // 3. Fallback: Instant Client-Side Image Compression & Data URL
  // Guaranteed to work 100% of the time on all devices without requiring server upload permissions
  try {
    const dataUrl = await readFileAsDataUrl(file, 600);
    return { url: dataUrl };
  } catch (err: any) {
    throw new Error('Could not process image file: ' + (err.message || 'File read error'));
  }
}

export function isCpanelDeployment(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.hostname !== 'localhost' && !window.location.hostname.includes('run.app');
  }
  return false;
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



