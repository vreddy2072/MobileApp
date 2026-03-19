import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
  PurchasesStoreProduct,
} from 'react-native-purchases';
import { logger } from '../utils/logger';
import { getRevenueCatIosKey, getRevenueCatAndroidKey } from './envService';

function getPlatformApiKeyFromEnv(): string {
  return Platform.OS === 'android' ? getRevenueCatAndroidKey() : getRevenueCatIosKey();
}

let isConfigured = false;
let currentUserId: string | undefined;
let cachedCustomerInfo: CustomerInfo | null = null;
let customerInfoUnsubscriber: (() => void) | null = null;

function updateCachedCustomerInfo(info: CustomerInfo) {
  cachedCustomerInfo = info;
  const activeEntitlements = Object.keys(info.entitlements.active || {});
  logger.debug('RevenueCat customer info updated', {
    entitlements: activeEntitlements,
  });
}

export async function initializeRevenueCat(appUserId?: string): Promise<void> {
  try {
    const apiKey = getPlatformApiKeyFromEnv();
    if (!apiKey) {
      logger.warn('RevenueCat API key not configured. Purchases will not work. Please set EXPO_PUBLIC_REVENUECAT_IOS_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in .env.local or via EAS Secrets.');
      return;
    }
    
    // Use INFO level instead of VERBOSE to reduce noise from cancellations
    // INFO level still shows important errors but filters out verbose cancellation messages
    Purchases.setLogLevel(LOG_LEVEL.INFO);

    if (!isConfigured) {
      await Purchases.configure({
        apiKey,
        appUserID: appUserId,
      });
      isConfigured = true;
      currentUserId = appUserId;

      if (customerInfoUnsubscriber) {
        customerInfoUnsubscriber();
      }
      customerInfoUnsubscriber = Purchases.addCustomerInfoUpdateListener((info) => {
        updateCachedCustomerInfo(info);
      });

      const info = await Purchases.getCustomerInfo();
      updateCachedCustomerInfo(info);
      logger.info('RevenueCat configured successfully');
      return;
    }

    if (currentUserId === appUserId) {
      return;
    }

    if (appUserId) {
      const result = await Purchases.logIn(appUserId);
      updateCachedCustomerInfo(result.customerInfo);
    } else {
      const result = await Purchases.logOut();
      updateCachedCustomerInfo(result);
    }

    currentUserId = appUserId;
  } catch (error) {
    logger.error('Failed to initialize RevenueCat', { error });
    throw error;
  }
}

export function getCachedCustomerInfo(): CustomerInfo | null {
  return cachedCustomerInfo;
}

export async function refreshCustomerInfo(): Promise<CustomerInfo> {
  const info = await Purchases.getCustomerInfo();
  updateCachedCustomerInfo(info);
  return info;
}

function isCancelledPurchase(error: PurchasesError | Error): boolean {
  if ('code' in error && error.code) {
    const code = String(error.code).toLowerCase();
    if (code.includes('cancel')) {
      return true;
    }
  }
  // Also check error message for cancellation
  const errorMessage = error.message?.toLowerCase() || '';
  if (errorMessage.includes('cancel') || errorMessage.includes('cancelled')) {
    return true;
  }
  return false;
}

function formatPurchasesError(error: PurchasesError | Error): string {
  if ('code' in error && error.code) {
    const code = String(error.code).toLowerCase();
    if (code.includes('cancel')) {
      return 'Purchase cancelled';
    }
    if (code.includes('pending')) {
      return 'Payment is pending. Please try again later.';
    }
    return error.message;
  }
  return error.message;
}

export async function purchaseProduct(
  productId: string
): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
  try {
    const products: PurchasesStoreProduct[] = await Purchases.getProducts([productId]);
    const product = products[0];
    if (!product) {
      return {
        success: false,
        error: `Product ${productId} not available in RevenueCat`,
      };
    }

    const result = await Purchases.purchaseStoreProduct(product);
    updateCachedCustomerInfo(result.customerInfo);
    return { success: true };
  } catch (error: any) {
    const isCancelled = isCancelledPurchase(error);
    
    if (isCancelled) {
      // User-initiated cancellation - log as info, not error
      logger.info('Purchase was cancelled by user', { productId });
      return {
        success: false,
        cancelled: true,
        error: formatPurchasesError(error),
      };
    } else {
      // Actual error (network failure, RevenueCat down, etc.) - log as error
      logger.error('RevenueCat purchase failed', { productId, error });
      return {
        success: false,
        error: formatPurchasesError(error),
      };
    }
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    updateCachedCustomerInfo(info);
    return true;
  } catch (error) {
    logger.error('Failed to restore purchases', { error });
    return false;
  }
}

