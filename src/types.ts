export interface Salesman {
  id: string;
  name: string;
  phone: string;
  route: string;
  company: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  nameBn: string;
  category: string;
  categoryBn: string;
  packSize: string;
  unitPrice: number; // Regular TP in BDT (৳)
  effectivePrice?: number; // Effective TP in BDT (৳)
  mrp?: number; // Maximum Retail Price (৳)
  netProfit?: number; // Retailer Margin / Net Profit (৳)
  offerDetails?: string; // দোকানদারদের জন্য ছাড় বা ফ্রি অফার
  unit: string;
  stock?: number;
  image?: string; // Image URL or Base64 data URL
}

export interface OrderItem {
  productId: string;
  productName: string;
  productNameBn: string;
  packSize: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Shop {
  id: string;
  name: string;
  nameBn?: string;
  ownerName: string;
  phone: string;
  address: string;
  addressBn?: string;
  route: string;
  image?: string; // Storefront image URL or base64
  lastOrderDate?: string;
  lastOrderAmount?: number;
  lastOrderItemsCount?: number;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  items: OrderItem[];
  totalItems: number; // count of distinct products
  totalQuantity: number; // total units
  totalAmount: number; // in BDT (৳)
  date: string; // YYYY-MM-DD
  time: string; // hh:mm A
  timestamp: number;
  salesmanId: string;
  salesmanName: string;
  status: 'synced' | 'pending_sync';
  notes?: string;
}

export interface DailySummary {
  shopsVisited: number;
  totalOrders: number;
  totalItems: number;
  totalAmount: number;
}
