/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Listing {
  id: string;
  title: string;
  listing_price: number;
  storage_location: string;
  status: 'Listed' | 'Sold';
  buying_cost: number | null;
  sold_price: number | null;
  created_at: string;
  sold_at: string | null;
}

export interface SalesSummary {
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  active_listings_count: number;
  sold_listings_count: number;
}
