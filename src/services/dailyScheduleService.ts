import { Order } from '../types';
import { getAccessToken } from './googleAuth';
import { syncOrdersToGoogleSheets, DriveSyncResult } from './googleDriveService';
import { getTodayDateString } from './storage';

export interface DailyBatchState {
  date: string;
  orderCount: number;
  totalAmount: number;
  isFinalized: boolean; // True once 9:00 PM is reached or manually closed
  status: 'active' | 'closing' | 'completed' | 'upcoming';
  statusText: string;
  timeWindowText: string;
  sheetSyncStatus: 'synced' | 'pending' | 'not_connected' | 'error';
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  lastSyncedAt?: string;
  errorMessage?: string;
}

export interface ScheduleStatus {
  currentHour: number;
  currentMinute: number;
  formattedTime: string;
  todayDate: string;
  isCollectionWindowActive: boolean; // 9:00 AM - 8:00 PM (09:00 - 19:59)
  isClosingWindow: boolean;          // 8:00 PM - 9:00 PM (20:00 - 20:59)
  isFinalizedWindow: boolean;        // 9:00 PM onwards (>= 21:00)
  status: 'active' | 'closing' | 'completed' | 'upcoming';
  badgeTitle: string;
  badgeDescription: string;
}

const STORAGE_KEY_PREFIX = 'salesman_daily_batch_';

/**
 * Returns real-time schedule status according to company operational hours:
 * - 9:00 AM - 8:00 PM: Order submission window
 * - 8:00 PM - 9:00 PM: Review & closing process
 * - 9:00 PM (রাত ৯ টা): Considered Completed ("সম্পূর্ণ") & finalized for the day
 */
export function getCurrentScheduleStatus(now: Date = new Date()): ScheduleStatus {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayDate = getTodayDateString();

  const formattedTime = now.toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isCollectionWindowActive = currentHour >= 9 && currentHour < 20;
  const isClosingWindow = currentHour === 20;
  const isFinalizedWindow = currentHour >= 21;

  let status: 'active' | 'closing' | 'completed' | 'upcoming';
  let badgeTitle = '';
  let badgeDescription = '';

  if (isFinalizedWindow) {
    status = 'completed';
    badgeTitle = 'রাত ৯টা: আজকের অর্ডার সম্পূর্ণ';
    badgeDescription = 'আজকের অর্ডারগুলো রাত ৯টায় চূড়ান্ত সম্পূর্ণ হিসেবে ড্রাইভে সংরক্ষিত হয়েছে।';
  } else if (isClosingWindow) {
    status = 'closing';
    badgeTitle = 'রাত ৮টা - ৯টা: যাচাই ও সমাপনী';
    badgeDescription = 'রাত ৯টার মধ্যে আজকের দিনের সকল অর্ডার স্বয়ংক্রিয় সম্পূর্ণ হিসেবে ধরা হবে।';
  } else if (isCollectionWindowActive) {
    status = 'active';
    badgeTitle = 'সকাল ৯টা - রাত ৮টা: অর্ডার সাবমিট উইন্ডো';
    badgeDescription = 'অর্ডার সংগ্রহ ও সাবমিশন সক্রিয় রয়েছে।';
  } else {
    status = 'upcoming';
    badgeTitle = 'অর্ডার উইন্ডো শুরুর অপেক্ষায়';
    badgeDescription = 'প্রতিদিনের অর্ডার কালেকশন সকাল ৯:০০ টা থেকে শুরু হয়।';
  }

  return {
    currentHour,
    currentMinute,
    formattedTime,
    todayDate,
    isCollectionWindowActive,
    isClosingWindow,
    isFinalizedWindow,
    status,
    badgeTitle,
    badgeDescription,
  };
}

/**
 * Retrieves the daily batch state for a given date
 */
export function getDailyBatchState(date: string = getTodayDateString()): DailyBatchState {
  const schedule = getCurrentScheduleStatus();
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${date}`);

  let savedData: Partial<DailyBatchState> = {};
  if (raw) {
    try {
      savedData = JSON.parse(raw);
    } catch {
      savedData = {};
    }
  }

  const isFinalized = Boolean(savedData.isFinalized || schedule.isFinalizedWindow);

  return {
    date,
    orderCount: savedData.orderCount || 0,
    totalAmount: savedData.totalAmount || 0,
    isFinalized,
    status: isFinalized ? 'completed' : schedule.status,
    statusText: isFinalized ? 'সম্পূর্ণ (Finalized)' : schedule.badgeTitle,
    timeWindowText: 'সকাল ৯:০০ - রাত ৮:০০ (রাত ৯টায় সম্পূর্ণ)',
    sheetSyncStatus: savedData.sheetSyncStatus || 'pending',
    spreadsheetId: savedData.spreadsheetId,
    spreadsheetUrl: savedData.spreadsheetUrl,
    spreadsheetName: savedData.spreadsheetName || `Sales_Orders_${date}`,
    lastSyncedAt: savedData.lastSyncedAt,
    errorMessage: savedData.errorMessage,
  };
}

/**
 * Persists the daily batch state
 */
export function saveDailyBatchState(date: string, state: Partial<DailyBatchState>): DailyBatchState {
  const current = getDailyBatchState(date);
  const updated: DailyBatchState = {
    ...current,
    ...state,
    date,
  };
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${date}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save daily batch state:', e);
  }
  return updated;
}

/**
 * Checks and auto-syncs today's orders to Google Sheets if conditions are met
 */
export async function autoSyncTodayBatchToGoogleDrive(
  orders: Order[],
  forceSync: boolean = false
): Promise<{ success: boolean; result?: DriveSyncResult; error?: string }> {
  const schedule = getCurrentScheduleStatus();
  const todayOrders = orders.filter((o) => o.date === schedule.todayDate);

  // If there are zero orders today, nothing to push yet
  if (todayOrders.length === 0) {
    return { success: false, error: 'আজকের কোনো অর্ডার নেই' };
  }

  const currentState = getDailyBatchState(schedule.todayDate);
  currentState.orderCount = todayOrders.length;
  currentState.totalAmount = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // If already marked as finalized by time
  if (schedule.isFinalizedWindow) {
    currentState.isFinalized = true;
  }

  // Check if Google Drive access token is available
  const token = await getAccessToken();
  if (!token) {
    saveDailyBatchState(schedule.todayDate, {
      ...currentState,
      sheetSyncStatus: 'not_connected',
    });
    return {
      success: false,
      error: 'গুগল অ্যাকাউন্টে সাইন ইন করা নেই। সাইন ইন করলে ড্রাইভে আজকের তারিখের শিটে চলে যাবে।',
    };
  }

  // If not forcing sync and already synced with the same order count
  if (!forceSync && currentState.sheetSyncStatus === 'synced' && currentState.orderCount === todayOrders.length && currentState.spreadsheetUrl) {
    return {
      success: true,
      result: {
        spreadsheetId: currentState.spreadsheetId || '',
        spreadsheetUrl: currentState.spreadsheetUrl || '',
        spreadsheetName: currentState.spreadsheetName || `Sales_Orders_${schedule.todayDate}`,
        totalOrdersExported: todayOrders.length,
      },
    };
  }

  try {
    // Perform sync to Google Sheets specifically for today's date
    const syncResult = await syncOrdersToGoogleSheets(todayOrders, schedule.todayDate);

    const nowFormatted = new Date().toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const updatedState = saveDailyBatchState(schedule.todayDate, {
      ...currentState,
      sheetSyncStatus: 'synced',
      spreadsheetId: syncResult.spreadsheetId,
      spreadsheetUrl: syncResult.spreadsheetUrl,
      spreadsheetName: syncResult.spreadsheetName,
      lastSyncedAt: nowFormatted,
      errorMessage: undefined,
    });

    return { success: true, result: syncResult };
  } catch (err: any) {
    console.error('Auto sync to Google Sheets error:', err);
    saveDailyBatchState(schedule.todayDate, {
      ...currentState,
      sheetSyncStatus: 'error',
      errorMessage: err.message || 'গুগল শিট আপডেট ব্যর্থ হয়েছে',
    });
    return { success: false, error: err.message || 'গুগল শিট আপডেট ব্যর্থ হয়েছে' };
  }
}
