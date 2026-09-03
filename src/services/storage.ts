import { Shop, Product, Order, Salesman, DailySummary } from '../types';
import { sampleShops, sampleProducts, initialSampleOrders, defaultSalesman } from '../data/mockData';

const STORAGE_KEYS = {
  SHOPS: 'salesman_shops_v1',
  PRODUCTS: 'salesman_products_rb_v2026',
  ORDERS: 'salesman_orders_rb_v2026',
  SALESMAN: 'salesman_profile_mohebbulla_v1'
};

// Helper to get formatted local date YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get formatted 12-hour time (e.g. 11:30 AM)
export function getCurrentTimeString(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export const storageService = {
  // Initialize storage with default data if empty
  init(): void {
    if (typeof window === 'undefined') return;

    const storedShopsRaw = localStorage.getItem(STORAGE_KEYS.SHOPS);
    // Ensure shops are strictly in Mohammadpur zone
    if (!storedShopsRaw || storedShopsRaw.includes('মিরপুর') || storedShopsRaw.includes('কাজীপাড়া')) {
      localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(sampleShops));
    }

    // Always ensure fresh Reckitt Benckiser catalog is loaded
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sampleProducts));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      const today = getTodayDateString();
      const updatedSampleOrders = [...initialSampleOrders];
      if (updatedSampleOrders.length > 0) {
        updatedSampleOrders[0].date = today;
      }
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedSampleOrders));
    }

    const storedSalesmanRaw = localStorage.getItem(STORAGE_KEYS.SALESMAN);
    if (!storedSalesmanRaw || !storedSalesmanRaw.includes('মোহাম্মদপুর')) {
      localStorage.setItem(STORAGE_KEYS.SALESMAN, JSON.stringify(defaultSalesman));
    }
  },

  // Reset product catalog to official Reckitt list
  resetProductsCatalog(): Product[] {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sampleProducts));
    return sampleProducts;
  },

  // Salesman Profile
  getSalesman(): Salesman {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALESMAN);
      if (!data) return defaultSalesman;
      const parsed = JSON.parse(data);
      if (!parsed.image) {
        parsed.image = defaultSalesman.image;
      }
      return parsed;
    } catch {
      return defaultSalesman;
    }
  },

  updateSalesman(salesman: Salesman): void {
    localStorage.setItem(STORAGE_KEYS.SALESMAN, JSON.stringify(salesman));
  },

  // Shops
  getShops(): Shop[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHOPS);
      return data ? JSON.parse(data) : sampleShops;
    } catch {
      return sampleShops;
    }
  },

  addShop(shop: Omit<Shop, 'id'>): Shop {
    const shops = this.getShops();
    const newShop: Shop = {
      ...shop,
      id: `SHP-${Date.now().toString().slice(-4)}`
    };
    shops.unshift(newShop);
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
    return newShop;
  },

  updateShop(updated: Shop): void {
    const shops = this.getShops();
    const index = shops.findIndex((s) => s.id === updated.id);
    if (index !== -1) {
      shops[index] = updated;
      localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
    }
  },

  setShops(shops: Shop[]): void {
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
  },

  getShopById(id: string): Shop | undefined {
    return this.getShops().find((s) => s.id === id);
  },

  // Products
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : sampleProducts;
    } catch {
      return sampleProducts;
    }
  },

  addProduct(product: Omit<Product, 'id'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `PRD-${Date.now().toString().slice(-4)}`
    };
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  },

  updateProduct(updated: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      products[index] = updated;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  setProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Orders
  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders: Order[] = data ? JSON.parse(data) : [];
      // Sort newest first
      return orders.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  },

  getOrdersByShop(shopId: string): Order[] {
    return this.getOrders().filter((o) => o.shopId === shopId);
  },

  getLastOrderByShop(shopId: string): Order | undefined {
    const shopOrders = this.getOrdersByShop(shopId);
    return shopOrders[0];
  },

  // Save new order with duplicate prevention and offline queue handling
  saveOrder(order: Order): { success: boolean; isDuplicate: boolean; order: Order } {
    const orders = this.getOrders();

    // Prevent duplicate submission
    const existingIndex = orders.findIndex((o) => o.id === order.id);
    if (existingIndex !== -1) {
      return { success: true, isDuplicate: true, order: orders[existingIndex] };
    }

    // Save order
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Update shop metadata (last order date, amount, items)
    const shops = this.getShops();
    const shopIndex = shops.findIndex((s) => s.id === order.shopId);
    if (shopIndex !== -1) {
      shops[shopIndex].lastOrderDate = order.date;
      shops[shopIndex].lastOrderAmount = order.totalAmount;
      shops[shopIndex].lastOrderItemsCount = order.totalItems;
      localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
    }

    return { success: true, isDuplicate: false, order };
  },

  // Generate unique order ID
  generateOrderId(): string {
    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${randomPart}`;
  },

  // Offline Sync Management
  getPendingSyncCount(): number {
    const orders = this.getOrders();
    return orders.filter((o) => o.status === 'pending_sync').length;
  },

  syncPendingOrders(): Promise<{ syncedCount: number; errors: number }> {
    return new Promise((resolve) => {
      // Simulate/perform syncing with cloud server/Firestore
      setTimeout(() => {
        const orders = this.getOrders();
        let syncedCount = 0;

        const updated = orders.map((o) => {
          if (o.status === 'pending_sync') {
            syncedCount++;
            return { ...o, status: 'synced' as const };
          }
          return o;
        });

        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
        resolve({ syncedCount, errors: 0 });
      }, 800);
    });
  },

  // Today's summary metrics
  getTodaySummary(): DailySummary {
    const today = getTodayDateString();
    const orders = this.getOrders().filter((o) => o.date === today);

    const visitedShopIds = new Set(orders.map((o) => o.shopId));
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
    const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      shopsVisited: visitedShopIds.size,
      totalOrders,
      totalItems,
      totalAmount
    };
  },

  // Export orders to CSV (Excel / Dashboard compatible with UTF-8 BOM)
  exportOrdersToCSV(dateFilter?: string): void {
    let orders = this.getOrders();
    if (dateFilter && dateFilter !== 'all') {
      orders = orders.filter((o) => o.date === dateFilter);
    }

    if (orders.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো অর্ডার পাওয়া যায়নি (No orders to export)');
      return;
    }

    // CSV Headers
    const headers = [
      'Order ID',
      'Order Date',
      'Order Time',
      'Salesman ID',
      'Salesman Name',
      'Shop ID',
      'Shop Name',
      'Shop Phone',
      'Shop Address',
      'Product ID',
      'Product Name',
      'Pack Size',
      'Unit Price (BDT)',
      'Quantity',
      'Item Total (BDT)',
      'Order Grand Total (BDT)',
      'Sync Status',
      'Notes'
    ];

    const rows: string[] = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const row = [
          `"${order.id}"`,
          `"${order.date}"`,
          `"${order.time}"`,
          `"${order.salesmanId}"`,
          `"${order.salesmanName}"`,
          `"${order.shopId}"`,
          `"${order.shopName.replace(/"/g, '""')}"`,
          `"${order.shopPhone}"`,
          `"${order.shopAddress.replace(/"/g, '""')}"`,
          `"${item.productId}"`,
          `"${(item.productNameBn || item.productName).replace(/"/g, '""')}"`,
          `"${item.packSize}"`,
          item.unitPrice,
          item.quantity,
          item.total,
          order.totalAmount,
          `"${order.status}"`,
          `"${(order.notes || '').replace(/"/g, '""')}"`
        ];
        rows.push(row.join(','));
      });
    });

    // UTF-8 BOM prefix (\uFEFF) ensures Bengali characters open correctly in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Orders_${dateFilter || 'All'}_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
