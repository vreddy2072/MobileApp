/**
 * IAP Product Type
 * 
 * Represents an in-app purchase product fetched from Supabase.
 * Matches the response structure from get-iap-products-function edge function.
 */

export interface IAPProduct {
  id: number;
  product_id: string;      // Used for StoreKit/RevenueCat purchase
  display_name: string;    // Show in UI as pack name
  credits: number;         // Credit amount
  price_label: string;     // Human-readable price (MUST be displayed)
  sort_order: number;      // Display order (use for sorting)
  is_active?: boolean;
}

