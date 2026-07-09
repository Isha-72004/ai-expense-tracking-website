/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, UserRole, PaymentCard, Expense, AuditLog } from '../src/types';

const STORE_PATH = path.join(process.cwd(), 'server', 'data-store.json');

interface Schema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashedPassword
  refreshTokens: { token: string; userId: string; expiresAt: string }[];
  cards: PaymentCard[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}

/**
 * Clean Architecture Database Engine
 * Implements persistent state in file storage to simulate PostgreSQL for local/preview modes.
 * Features production-ready SOLID repository interfaces.
 */
class JsonDatabase {
  private data: Schema = {
    users: [],
    passwords: {},
    refreshTokens: [],
    cards: [],
    expenses: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.seed();
      }
    } catch (e) {
      console.error('Failed to initialize database store, falling back to in-memory', e);
      this.seed();
    }
  }

  private seed() {
    // Seed default admin and user for mentoring/testing
    const demoUserId = 'u_demo123';
    const adminUserId = 'u_admin456';

    const salt = bcrypt.genSaltSync(10);
    const demoPassHash = bcrypt.hashSync('student123', salt);
    const adminPassHash = bcrypt.hashSync('admin123', salt);

    this.data = {
      users: [
        {
          id: demoUserId,
          email: 'student@college.edu',
          name: 'Alex Mercer',
          role: UserRole.USER,
          createdAt: new Date().toISOString(),
        },
        {
          id: adminUserId,
          email: 'mentor@academy.org',
          name: 'Dr. Sarah Connor',
          role: UserRole.ADMIN,
          createdAt: new Date().toISOString(),
        },
      ],
      passwords: {
        [demoUserId]: demoPassHash,
        [adminUserId]: adminPassHash,
      },
      refreshTokens: [],
      cards: [
        {
          id: 'c_1',
          userId: demoUserId,
          cardName: 'Chase Sapphire Preferred',
          cardNumber: '**** **** **** 4582',
          cardType: 'visa',
          cardHolder: 'Alex Mercer',
          expiryDate: '09/29',
          creditLimit: 10000,
          spent: 2450.75,
          color: 'blue',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c_2',
          userId: demoUserId,
          cardName: 'AMEX Gold Card',
          cardNumber: '**** ****** 31005',
          cardType: 'amex',
          cardHolder: 'Alex Mercer',
          expiryDate: '12/28',
          creditLimit: 15000,
          spent: 1280.40,
          color: 'amber',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'c_3',
          userId: demoUserId,
          cardName: 'Crypto Cashback Card',
          cardNumber: '**** **** **** 9012',
          cardType: 'visa',
          cardHolder: 'Alex Mercer',
          expiryDate: '03/30',
          creditLimit: 5000,
          spent: 850.20,
          color: 'purple',
          createdAt: new Date().toISOString(),
        },
      ],
      expenses: [
        {
          id: 'e_1',
          userId: demoUserId,
          amount: 120.50,
          category: 'Food',
          description: 'Team dinner at Sushi Zen',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
          cardId: 'c_1',
          isFood: true,
          foodDetails: {
            mealType: 'dinner',
            calories: 850,
            healthRating: 4,
            restaurant: 'Sushi Zen',
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_2',
          userId: demoUserId,
          amount: 45.00,
          category: 'Transport',
          description: 'Uber ride to campus lab',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          cardId: 'c_1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_3',
          userId: demoUserId,
          amount: 8.50,
          category: 'Food',
          description: 'Coffee and donut at Dunkin',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          cardId: 'c_2',
          isFood: true,
          foodDetails: {
            mealType: 'breakfast',
            calories: 450,
            healthRating: 2,
            restaurant: 'Dunkin',
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_4',
          userId: demoUserId,
          amount: 320.00,
          category: 'Utilities',
          description: 'Electricity & High-speed Fiber Internet',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          cardId: 'c_1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_5',
          userId: demoUserId,
          amount: 85.00,
          category: 'Food',
          description: 'Organic groceries from Whole Foods',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
          cardId: 'c_2',
          isFood: true,
          foodDetails: {
            mealType: 'lunch',
            calories: 620,
            healthRating: 5,
            restaurant: 'Whole Foods',
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_6',
          userId: demoUserId,
          amount: 15.99,
          category: 'Entertainment',
          description: 'Netflix Monthly Premium Subscription',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          cardId: 'c_3',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_7',
          userId: demoUserId,
          amount: 150.00,
          category: 'Shopping',
          description: 'Ergonomic Desk Chair',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
          cardId: 'c_1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'e_8',
          userId: demoUserId,
          amount: 32.50,
          category: 'Food',
          description: 'Gourmet Ramen for Dinner',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          cardId: 'c_2',
          isFood: true,
          foodDetails: {
            mealType: 'dinner',
            calories: 950,
            healthRating: 3,
            restaurant: 'Ramen Ichiran',
          },
          createdAt: new Date().toISOString(),
        },
      ],
      auditLogs: [
        {
          id: 'l_1',
          userId: demoUserId,
          action: 'USER_REGISTERED',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          details: 'Demo user student@college.edu registered via application portal.',
        },
        {
          id: 'l_2',
          userId: demoUserId,
          action: 'USER_LOGIN',
          timestamp: new Date().toISOString(),
          details: 'User logged in successfully.',
          ipAddress: '127.0.0.1',
        },
      ],
    };
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save database state to file system', e);
    }
  }

  // --- REPOSITORIES ---

  public users = {
    findById: (id: string): User | undefined => {
      return this.data.users.find(u => u.id === id);
    },
    findByEmail: (email: string): User | undefined => {
      return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    getPasswordHash: (userId: string): string | undefined => {
      return this.data.passwords[userId];
    },
    create: (user: User, passwordHash: string): User => {
      this.data.users.push(user);
      this.data.passwords[user.id] = passwordHash;
      this.save();
      return user;
    },
  };

  public refreshTokens = {
    find: (token: string) => {
      return this.data.refreshTokens.find(rt => rt.token === token);
    },
    create: (userId: string, token: string, expiresAt: string) => {
      // Clean up existing tokens for this user first
      this.data.refreshTokens = this.data.refreshTokens.filter(rt => rt.userId !== userId);
      this.data.refreshTokens.push({ token, userId, expiresAt });
      this.save();
    },
    delete: (token: string) => {
      this.data.refreshTokens = this.data.refreshTokens.filter(rt => rt.token !== token);
      this.save();
    },
  };

  public cards = {
    listByUserId: (userId: string): PaymentCard[] => {
      return this.data.cards.filter(c => c.userId === userId);
    },
    findById: (id: string): PaymentCard | undefined => {
      return this.data.cards.find(c => c.id === id);
    },
    create: (card: PaymentCard): PaymentCard => {
      this.data.cards.push(card);
      this.save();
      return card;
    },
    updateSpent: (id: string, amount: number): boolean => {
      const card = this.data.cards.find(c => c.id === id);
      if (card) {
        card.spent = Number((card.spent + amount).toFixed(2));
        this.save();
        return true;
      }
      return false;
    },
    delete: (id: string, userId: string): boolean => {
      const idx = this.data.cards.findIndex(c => c.id === id && c.userId === userId);
      if (idx !== -1) {
        this.data.cards.splice(idx, 1);
        this.save();
        return true;
      }
      return false;
    },
  };

  public expenses = {
    listByUserId: (userId: string): Expense[] => {
      return this.data.expenses.filter(e => e.userId === userId);
    },
    findById: (id: string): Expense | undefined => {
      return this.data.expenses.find(e => e.id === id);
    },
    create: (expense: Expense): Expense => {
      this.data.expenses.push(expense);
      this.save();
      return expense;
    },
    update: (id: string, userId: string, updates: Partial<Expense>): Expense | undefined => {
      const expense = this.data.expenses.find(e => e.id === id && e.userId === userId);
      if (expense) {
        Object.assign(expense, updates);
        this.save();
        return expense;
      }
      return undefined;
    },
    delete: (id: string, userId: string): boolean => {
      const idx = this.data.expenses.findIndex(e => e.id === id && e.userId === userId);
      if (idx !== -1) {
        this.data.expenses.splice(idx, 1);
        this.save();
        return true;
      }
      return false;
    },
  };

  public auditLogs = {
    create: (log: AuditLog): AuditLog => {
      this.data.auditLogs.unshift(log); // newest first
      // Keep only last 200 logs
      if (this.data.auditLogs.length > 200) {
        this.data.auditLogs = this.data.auditLogs.slice(0, 200);
      }
      this.save();
      return log;
    },
    list: (): AuditLog[] => {
      return this.data.auditLogs;
    },
  };
}

export const db = new JsonDatabase();
