import fs from 'fs';
import path from 'path';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATALOG_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_DOCUMENTS,
  INITIAL_STAFF_USERS,
  DEFAULT_SETTINGS,
  INITIAL_FIELD_DISPATCHES,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASES,
  INITIAL_SALES_RETURNS,
  INITIAL_EXPENSES,
} from '../initialData.ts';
import {
  Product,
  CatalogProduct,
  Customer,
  Document,
  StaffUser,
  BusinessSettings,
  FieldDispatch,
  Supplier,
  Purchase,
  SalesReturn,
  Expense,
} from '../types.ts';

export interface LocalDatabaseSchema {
  catalogProducts: CatalogProduct[];
  products: Product[];
  customers: Customer[];
  documents: Document[];
  staffUsers: StaffUser[];
  settings: BusinessSettings;
  fieldDispatches: FieldDispatch[];
  suppliers: Supplier[];
  purchases: Purchase[];
  salesReturns: SalesReturn[];
  expenses: Expense[];
}

const dataDir = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dataDir, 'database.json');

class LocalDatabase {
  private data: LocalDatabaseSchema;
  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): LocalDatabaseSchema {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          catalogProducts: parsed.catalogProducts || [...INITIAL_CATALOG_PRODUCTS],
          products: parsed.products || [...INITIAL_PRODUCTS],
          customers: parsed.customers || [...INITIAL_CUSTOMERS],
          documents: parsed.documents || [...INITIAL_DOCUMENTS],
          staffUsers: parsed.staffUsers || [...INITIAL_STAFF_USERS],
          settings: parsed.settings || { ...DEFAULT_SETTINGS },
          fieldDispatches: parsed.fieldDispatches || [...INITIAL_FIELD_DISPATCHES],
          suppliers: parsed.suppliers || [...INITIAL_SUPPLIERS],
          purchases: parsed.purchases || [...INITIAL_PURCHASES],
          salesReturns: parsed.salesReturns || [...INITIAL_SALES_RETURNS],
          expenses: parsed.expenses || [...INITIAL_EXPENSES],
        };
      }
    } catch (err) {
      console.warn('Failed to load existing database.json, initializing fresh store:', err);
    }

    const initial: LocalDatabaseSchema = {
      catalogProducts: [...INITIAL_CATALOG_PRODUCTS],
      products: [...INITIAL_PRODUCTS],
      customers: [...INITIAL_CUSTOMERS],
      documents: [...INITIAL_DOCUMENTS],
      staffUsers: [...INITIAL_STAFF_USERS],
      settings: { ...DEFAULT_SETTINGS },
      fieldDispatches: [...INITIAL_FIELD_DISPATCHES],
      suppliers: [...INITIAL_SUPPLIERS],
      purchases: [...INITIAL_PURCHASES],
      salesReturns: [...INITIAL_SALES_RETURNS],
      expenses: [...INITIAL_EXPENSES],
    };

    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write initial database.json:', err);
    }

    return initial;
  }

  public saveToDisk() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      const tempPath = `${dbFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, dbFilePath);
    } catch (err) {
      console.error('Failed to save database.json:', err);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.saveToDisk();
      }
    }
  }

  public getList<K extends keyof Omit<LocalDatabaseSchema, 'settings'>>(key: K): LocalDatabaseSchema[K] {
    return (this.data[key] || []) as LocalDatabaseSchema[K];
  }

  public upsert<K extends keyof Omit<LocalDatabaseSchema, 'settings'>>(
    key: K,
    item: any
  ): any {
    const list = this.data[key] as any[];
    const index = list.findIndex((i: any) => String(i.id) === String(item.id));
    if (index >= 0) {
      list[index] = { ...list[index], ...item };
    } else {
      list.push(item);
    }
    this.saveToDisk();
    return item;
  }

  public delete<K extends keyof Omit<LocalDatabaseSchema, 'settings'>>(
    key: K,
    id: string
  ): boolean {
    const list = this.data[key] as any[];
    const initialLen = list.length;
    this.data[key] = list.filter((i: any) => String(i.id) !== String(id)) as any;
    this.saveToDisk();
    return this.data[key].length < initialLen;
  }

  public getSettings(): BusinessSettings {
    return this.data.settings;
  }

  public saveSettings(settings: Partial<BusinessSettings>): BusinessSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveToDisk();
    return this.data.settings;
  }

  public clearAll() {
    this.data.products = [];
    this.data.customers = [];
    this.data.documents = [];
    this.data.fieldDispatches = [];
    this.data.suppliers = [];
    this.data.purchases = [];
    this.data.salesReturns = [];
    this.data.expenses = [];
    this.saveToDisk();
  }

  public seedDemo() {
    this.data.products = [...INITIAL_PRODUCTS];
    this.data.customers = [...INITIAL_CUSTOMERS];
    this.data.documents = [...INITIAL_DOCUMENTS];
    this.data.fieldDispatches = [...INITIAL_FIELD_DISPATCHES];
    this.data.suppliers = [...INITIAL_SUPPLIERS];
    this.data.purchases = [...INITIAL_PURCHASES];
    this.data.salesReturns = [...INITIAL_SALES_RETURNS];
    this.data.expenses = [...INITIAL_EXPENSES];
    this.saveToDisk();
  }

  public getCounts() {
    return {
      catalogProducts: this.data.catalogProducts?.length || 0,
      products: this.data.products?.length || 0,
      customers: this.data.customers?.length || 0,
      documents: this.data.documents?.length || 0,
      staffUsers: this.data.staffUsers?.length || 0,
      fieldDispatches: this.data.fieldDispatches?.length || 0,
      suppliers: this.data.suppliers?.length || 0,
      purchases: this.data.purchases?.length || 0,
      salesReturns: this.data.salesReturns?.length || 0,
      expenses: this.data.expenses?.length || 0,
    };
  }
}

export const localDb = new LocalDatabase();
