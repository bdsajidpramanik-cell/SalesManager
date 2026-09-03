import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  const refreshPendingCount = () => {
    setPendingSyncCount(storageService.getPendingSyncCount());
  };

  const performSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await storageService.syncPendingOrders();
      refreshPendingCount();
      if (result.syncedCount > 0) {
        setLastSyncMessage(`${result.syncedCount}টি অর্ডার সফলভাবে ক্লাউডে সিঙ্ক হয়েছে`);
        setTimeout(() => setLastSyncMessage(null), 4000);
      }
    } catch {
      setLastSyncMessage('সিঙ্ক করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
      setTimeout(() => setLastSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync immediately when returning online
      const count = storageService.getPendingSyncCount();
      if (count > 0) {
        performSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncMessage,
    performSync,
    refreshPendingCount
  };
}
