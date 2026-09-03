import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from './services/storage';
import { Shop, Product, Order, Salesman, OrderItem, DailySummary } from './types';
import { Header } from './components/Header';
import { TodaySummary } from './components/TodaySummary';
import { ShopList } from './components/ShopList';
import { ShopDetailModal } from './components/ShopDetailModal';
import { NewOrderModal } from './components/NewOrderModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderHistoryView } from './components/OrderHistoryView';
import { SalesmanModal } from './components/SalesmanModal';
import { ExportModal } from './components/ExportModal';
import { AddShopModal } from './components/AddShopModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { DailyScheduleCard } from './components/DailyScheduleCard';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { ShoppingBag, Store, CheckCircle, RefreshCw, Cloud } from 'lucide-react';
import { getAccessToken } from './services/googleAuth';
import { syncOrdersToGoogleSheets } from './services/googleDriveService';
import { autoSyncTodayBatchToGoogleDrive, getCurrentScheduleStatus } from './services/dailyScheduleService';

export default function App() {
  // Online/Offline status hook
  const {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncMessage,
    performSync,
    refreshPendingCount
  } = useOnlineStatus();

  // Core App State
  const [salesman, setSalesman] = useState<Salesman>(() => {
    storageService.init();
    return storageService.getSalesman();
  });

  const [shops, setShops] = useState<Shop[]>(() => storageService.getShops());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [todaySummary, setTodaySummary] = useState<DailySummary>(() => storageService.getTodaySummary());

  // Navigation & Modals State
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [selectedShopForDetails, setSelectedShopForDetails] = useState<Shop | null>(null);

  // New Order / Repeat Order flow
  const [activeOrderShop, setActiveOrderShop] = useState<Shop | null>(null);
  const [activeOrderItems, setActiveOrderItems] = useState<OrderItem[]>([]);
  const [isRepeatOrder, setIsRepeatOrder] = useState<boolean>(false);

  // Confirmation screen state
  const [confirmOrderPayload, setConfirmOrderPayload] = useState<{
    shop: Shop;
    items: OrderItem[];
    notes?: string;
  } | null>(null);

  // Auxiliary Modals
  const [showSalesmanModal, setShowSalesmanModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [showProductCatalogModal, setShowProductCatalogModal] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleResetCatalog = () => {
    const fresh = storageService.resetProductsCatalog();
    setProducts(fresh);
    showToast('অফিসিয়াল রেকিট বেনকিজার প্রডাক্ট তালিকা লোড হয়েছে');
  };

  // Register PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration error:', err);
      });
    }
  }, []);

  // Periodic daily schedule check & auto-sync of today's orders to Google Sheets
  useEffect(() => {
    const processDailyScheduleAndSync = async () => {
      if (!navigator.onLine) return;

      const schedule = getCurrentScheduleStatus();
      const allOrders = storageService.getOrders();
      const todayOrders = allOrders.filter((o) => o.date === schedule.todayDate);

      // If at least 1 order exists today, auto-sync to today's date sheet in Google Drive
      if (todayOrders.length > 0) {
        try {
          const syncRes = await autoSyncTodayBatchToGoogleDrive(allOrders, false);
          if (syncRes.success && syncRes.result) {
            // Silently updated or synced
          }
        } catch (e) {
          console.warn('Daily auto-sync background check skipped or failed:', e);
        }
      }

      // Legacy 24-hour full backup check if enabled
      const isAutoSyncEnabled = localStorage.getItem('auto_sync_drive_24h') === 'true';
      if (isAutoSyncEnabled) {
        const lastSyncEpoch = Number(localStorage.getItem('last_drive_sync_epoch') || '0');
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - lastSyncEpoch >= twentyFourHours) {
          const token = await getAccessToken();
          if (token && allOrders.length > 0) {
            try {
              await syncOrdersToGoogleSheets(allOrders, '');
              const nowStr = new Date().toLocaleString('bn-BD', {
                dateStyle: 'medium',
                timeStyle: 'short'
              });
              localStorage.setItem('last_drive_sync_timestamp', nowStr);
              localStorage.setItem('last_drive_sync_epoch', String(Date.now()));
            } catch (e) {
              console.warn('Auto 24h drive backup background check error:', e);
            }
          }
        }
      }
    };

    // Run check on mount
    processDailyScheduleAndSync();

    // Check periodically every minute while app is open
    const interval = setInterval(processDailyScheduleAndSync, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh data helper
  const reloadData = useCallback(() => {
    setShops(storageService.getShops());
    setOrders(storageService.getOrders());
    setTodaySummary(storageService.getTodaySummary());
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Handle Salesman Profile Update
  const handleUpdateSalesman = (updated: Salesman) => {
    storageService.updateSalesman(updated);
    setSalesman(updated);
    showToast(`সেলসম্যান প্রোফাইল আপডেট করা হয়েছে (${updated.id})`);
  };

  // Handle Adding a New Shop
  const handleAddShop = (newShopData: Omit<Shop, 'id'>) => {
    const created = storageService.addShop(newShopData);
    reloadData();
    showToast(`নতুন দোকান '${created.name}' সফলভাবে যুক্ত হয়েছে`);
  };

  // Handle Updating Shop (e.g. photo or details)
  const handleUpdateShop = (updatedShop: Shop) => {
    storageService.updateShop(updatedShop);
    reloadData();
    setSelectedShopForDetails(updatedShop);
    showToast(`দোকানের তথ্য আপডেট হয়েছে`);
  };

  // Handle Updating Product (e.g. photo or details)
  const handleUpdateProduct = (updatedProduct: Product) => {
    storageService.updateProduct(updatedProduct);
    reloadData();
    showToast(`প্রোডাক্টের ছবি আপডেট হয়েছে`);
  };

  // Start a New Order from scratch
  const handleStartNewOrder = (shop: Shop) => {
    setSelectedShopForDetails(null);
    setActiveOrderShop(shop);
    setActiveOrderItems([]);
    setIsRepeatOrder(false);
  };

  // Start Quick Repeat Order from past order
  const handleRepeatOrder = (previousOrder: Order, shop: Shop) => {
    setSelectedShopForDetails(null);
    setActiveOrderShop(shop);
    setActiveOrderItems(previousOrder.items);
    setIsRepeatOrder(true);
  };

  // Step: Proceed to Order Review / Confirmation
  const handleProceedToConfirm = (items: OrderItem[], notes?: string) => {
    if (!activeOrderShop) return;
    setConfirmOrderPayload({
      shop: activeOrderShop,
      items,
      notes
    });
  };

  // Step: Final Order Confirmation
  const handleFinalOrderConfirm = async (orderData: Partial<Order>): Promise<Order> => {
    const orderId = storageService.generateOrderId();
    const newOrder: Order = {
      id: orderId,
      shopId: orderData.shopId!,
      shopName: orderData.shopName!,
      shopPhone: orderData.shopPhone!,
      shopAddress: orderData.shopAddress!,
      items: orderData.items!,
      totalItems: orderData.totalItems!,
      totalQuantity: orderData.totalQuantity!,
      totalAmount: orderData.totalAmount!,
      date: orderData.date!,
      time: orderData.time!,
      timestamp: Date.now(),
      salesmanId: salesman.id,
      salesmanName: salesman.name,
      status: isOnline ? 'synced' : 'pending_sync',
      notes: orderData.notes
    };

    storageService.saveOrder(newOrder);
    reloadData();

    // Trigger auto-sync to today's Google Sheet (even for 1 order)
    const allCurrentOrders = storageService.getOrders();
    autoSyncTodayBatchToGoogleDrive(allCurrentOrders, false).catch((err) => {
      console.warn('Auto drive sync check after order:', err);
    });

    return newOrder;
  };

  // Step: Finish order flow and return to shop list
  const handleFinishOrderFlow = () => {
    setConfirmOrderPayload(null);
    setActiveOrderShop(null);
    setActiveOrderItems([]);
    setIsRepeatOrder(false);
    showToast('অর্ডার সংরক্ষিত হয়েছে! পরবর্তী দোকানের অর্ডার নিন');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Maximum width container for mobile-first single-handed ergonomic experience */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col bg-slate-100 shadow-xl min-h-screen">
        {/* Sticky Header */}
        <Header
          salesman={salesman}
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          isSyncing={isSyncing}
          onSync={performSync}
          onOpenSalesmanModal={() => setShowSalesmanModal(true)}
          onOpenHistory={() => setActiveTab('history')}
          onOpenExport={() => setShowExportModal(true)}
          onOpenCatalog={() => setShowProductCatalogModal(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Global Toast / Sync Message */}
        {(toastMessage || lastSyncMessage) && (
          <div className="sticky top-24 z-40 px-4 py-1.5 animate-in slide-in-from-top duration-200">
            <div className="bg-slate-900/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-between border border-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{toastMessage || lastSyncMessage}</span>
              </div>
              <button
                onClick={() => {
                  setToastMessage(null);
                }}
                className="text-slate-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 p-3 sm:p-4 pb-20">
          {activeTab === 'home' ? (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Today's 4 Summary Metric Cards */}
              <TodaySummary
                summary={todaySummary}
                onStartNewOrder={() => {
                  // If shops exist, jump to the first shop or highlight shop list
                  const firstShop = shops[0];
                  if (firstShop) {
                    handleStartNewOrder(firstShop);
                  }
                }}
              />

              {/* Daily Operating Schedule & Google Drive / Sheet Sync Status */}
              <DailyScheduleCard
                orders={orders}
                onOpenExportModal={() => setShowExportModal(true)}
                onShowToast={showToast}
              />

              {/* Shop List with Search & Direct Order Actions */}
              <ShopList
                shops={shops}
                onSelectShop={(shop) => setSelectedShopForDetails(shop)}
                onDirectOrder={(shop) => handleStartNewOrder(shop)}
                onAddNewShop={() => setShowAddShopModal(true)}
              />
            </div>
          ) : (
            /* Order History View */
            <div className="max-w-4xl mx-auto">
              <OrderHistoryView
                orders={orders}
                shops={shops}
                onRepeatOrder={(order, shop) => handleRepeatOrder(order, shop)}
                onSelectShop={(shop) => setSelectedShopForDetails(shop)}
              />
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Shop Details & Previous Orders */}
      {selectedShopForDetails && (
        <ShopDetailModal
          shop={selectedShopForDetails}
          previousOrders={orders.filter((o) => o.shopId === selectedShopForDetails.id)}
          onClose={() => setSelectedShopForDetails(null)}
          onStartNewOrder={(shop) => handleStartNewOrder(shop)}
          onRepeatOrder={(order, shop) => handleRepeatOrder(order, shop)}
          onUpdateShop={handleUpdateShop}
        />
      )}

      {/* MODAL 2: New Order / Repeat Order Screen */}
      {activeOrderShop && !confirmOrderPayload && (
        <NewOrderModal
          shop={activeOrderShop}
          products={products}
          initialItems={activeOrderItems}
          isRepeatOrder={isRepeatOrder}
          onClose={() => {
            setActiveOrderShop(null);
            setActiveOrderItems([]);
            setIsRepeatOrder(false);
          }}
          onProceedToConfirm={handleProceedToConfirm}
          onUpdateProduct={handleUpdateProduct}
        />
      )}

      {/* MODAL 3: Order Confirmation Screen */}
      {confirmOrderPayload && (
        <OrderConfirmationModal
          shop={confirmOrderPayload.shop}
          salesman={salesman}
          items={confirmOrderPayload.items}
          notes={confirmOrderPayload.notes}
          isOnline={isOnline}
          onConfirm={handleFinalOrderConfirm}
          onBackToEdit={() => setConfirmOrderPayload(null)}
          onFinish={handleFinishOrderFlow}
        />
      )}

      {/* MODAL 4: Salesman Login & Profile Switcher */}
      {showSalesmanModal && (
        <SalesmanModal
          salesman={salesman}
          onClose={() => setShowSalesmanModal(false)}
          onUpdateSalesman={handleUpdateSalesman}
        />
      )}

      {/* MODAL 5: Excel / CSV Export Modal */}
      {showExportModal && (
        <ExportModal
          orders={orders}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* MODAL 6: Add New Shop Modal */}
      {showAddShopModal && (
        <AddShopModal
          defaultRoute={salesman.route}
          onClose={() => setShowAddShopModal(false)}
          onAddShop={handleAddShop}
        />
      )}

      {/* MODAL 7: Official Product & Trade Offer Catalog Modal */}
      {showProductCatalogModal && (
        <ProductCatalogModal
          products={products}
          onClose={() => setShowProductCatalogModal(false)}
          onResetCatalog={handleResetCatalog}
        />
      )}
    </div>
  );
}
