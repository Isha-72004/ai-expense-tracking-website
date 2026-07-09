/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PaymentCard {
  id: string;
  userId: string;
  cardName: string; // e.g. "Chase Sapphire"
  cardNumber: string; // e.g. "**** **** **** 4242"
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
  cardHolder: string;
  expiryDate: string;
  creditLimit: number;
  spent: number;
  color: 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string; // e.g. "Food", "Transport", "Utilities", "Shopping", "Entertainment", "Other"
  description: string;
  date: string; // ISO Date String
  cardId?: string; // Optional payment card link
  isFood?: boolean;
  foodDetails?: FoodDetails;
  createdAt: string;
}

export interface FoodDetails {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  healthRating?: 1 | 2 | 3 | 4 | 5; // 1-5 stars
  restaurant?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AIInsight {
  title: string;
  type: 'warning' | 'tip' | 'success' | 'info';
  description: string;
  recommendations: string[];
  confidence: number; // 0.0 to 1.0
}

export interface DashboardStats {
  totalBalance: number;
  monthlyExpenses: number;
  monthlyLimit: number;
  activeCardsCount: number;
  dailyAverage: number;
  topCategory: string;
}

export interface SpendTrend {
  date: string; // e.g. "07/01"
  amount: number;
  limit: number;
}

export interface CategorySpend {
  name: string;
  value: number;
  color: string;
}
