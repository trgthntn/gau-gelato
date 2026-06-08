/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'vi' | 'en';

export type UserRole = 'admin' | 'staff';

export interface Branch {
  id: string;
  name: string;
  companyName: string;
  mst: string; // Tax ID
  address: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  vietQrUrl?: string; // Optional custom VietQR string
}

export interface Staff {
  id: string;
  name: string;
  cccd: string; // Citizen ID
  phone: string;
  startDate: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  notes: string;
  role: UserRole;
  branchId: string; // Belongs to exactly 1 branch
  pin: string; // 10 digit secure pin
}

export interface Flavor {
  id: string;
  nameVi: string;
  nameEn: string;
  color?: string;
  iconType?: string;
  descVi: string;
  descEn: string;
  stockGrams: number;
  costPerKg?: number; // Optional since we are removing it from flavor menu management
  disabled?: boolean;
  image?: string; // Base64 encoded image
}

export interface Topping {
  id: string;
  nameVi: string;
  nameEn: string;
  price: number;
  stockQuantity: number;
  disabled?: boolean;
  image?: string; // Base64 encoded image
}

export interface Accompaniment {
  id: string;
  nameVi: string;
  nameEn: string;
  price: number;
  stockQuantity: number;
  disabled?: boolean;
  image?: string; // Base64 encoded image
}

export interface Voucher {
  code: string;
  campaignVi: string;
  campaignEn: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  expiryDate: string;
  usageCount: number;
  disabled?: boolean;
  applicableBranches?: string[];
}

export interface LoyaltyMember {
  phone: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  points: number;
  exchangeHistory: RewardRedeem[];
}

export interface RewardRedeem {
  id: string;
  date: string;
  rewardVi: string;
  rewardEn: string;
  pointsCost: number;
}

export interface OrderItem {
  id: string;
  type: 'set' | 'gram' | 'accompaniment' | 'topping';
  nameVi: string;
  nameEn: string;
  quantity: number;
  price: number;
  // Details for items like Set or Gram
  flavorsSelected?: string[]; // IDs of Flavors chosen
  toppingsSelected?: string[]; // IDs of toppings added
  gramWeight?: number; // Weight in grams (for weight ice cream)
}

export interface EditHistoryEntry {
  editedBy: string; // Staff/Admin Name & ID
  date: string;
  reason: string;
  oldTotal: number;
  newTotal: number;
}

export interface Order {
  id: string;
  branchId: string;
  staffId: string;
  staffName: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number; // e.g., 8 or 10
  taxAmount: number;
  discountAmount: number;
  voucherCode?: string;
  total: number;
  paymentMethod: 'cash' | 'qr';
  memberPhone?: string;
  invoiceStatus: 'not_issued' | 'issued' | 'replaced' | 'canceled';
  invoiceCode?: string; // VAT Invoice Code
  editHistory?: EditHistoryEntry[];
}

export interface OperationalExpense {
  id: string;
  date: string;
  category: 'rent' | 'utilities' | 'labor' | 'repair' | 'equipment' | 'ingredients' | 'other';
  amount: number;
  descriptionVi: string;
  descriptionEn: string;
  branchId: string; // Multi-branch expense
}

export interface AuditLog {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  branchId: string;
  branchName: string;
  actionVi: string;
  actionEn: string;
  details: string;
}

export interface InventoryLog {
  id: string;
  timestamp: string;
  branchId: string;
  itemId: string; // flavor, topping, etc
  itemType: 'flavor' | 'topping' | 'accompaniment';
  changeAmount: number; // can be negative
  reasonVi: string;
  reasonEn: string;
  staffName: string;
  importPrice?: number; // Price elements at which it was stocked in
}
