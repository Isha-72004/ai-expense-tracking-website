/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthResponse, User, PaymentCard, Expense, AuditLog, AIInsight } from '../types';

class ApiClient {
  private accessToken: string | null = localStorage.getItem('access_token');
  private refreshToken: string | null = localStorage.getItem('refresh_token');
  private user: User | null = null;
  private onAuthChangeListeners: ((user: User | null) => void)[] = [];

  constructor() {
    const cachedUser = localStorage.getItem('user_profile');
    if (cachedUser) {
      try {
        this.user = JSON.parse(cachedUser);
      } catch (e) {
        this.logout();
      }
    }
  }

  public addAuthListener(callback: (user: User | null) => void) {
    this.onAuthChangeListeners.push(callback);
    callback(this.user);
    return () => {
      this.onAuthChangeListeners = this.onAuthChangeListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.onAuthChangeListeners.forEach(listener => listener(this.user));
  }

  public setTokens(auth: AuthResponse) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    this.user = auth.user;
    
    localStorage.setItem('access_token', auth.accessToken);
    localStorage.setItem('refresh_token', auth.refreshToken);
    localStorage.setItem('user_profile', JSON.stringify(auth.user));
    
    this.notifyListeners();
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public async signup(email: string, name: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Signup failed');
    }

    const data: AuthResponse = await res.json();
    this.setTokens(data);
    return data;
  }

  public async signin(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/v1/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Authentication failed');
    }

    const data: AuthResponse = await res.json();
    this.setTokens(data);
    return data;
  }

  public logout() {
    if (this.refreshToken) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      }).catch(() => {});
    }

    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');

    this.notifyListeners();
  }

  /**
   * Safe Fetch with automatic token refresh (DIP, Single Responsibility)
   */
  private async safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
    } as Record<string, string>;

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized by attempting a token refresh
    if (res.status === 401 && this.refreshToken) {
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          this.accessToken = refreshData.accessToken;
          localStorage.setItem('access_token', refreshData.accessToken);

          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          return await fetch(url, { ...options, headers });
        } else {
          // Refresh token expired or revoked
          this.logout();
          throw new Error('Session expired. Please sign in again.');
        }
      } catch (e) {
        this.logout();
        throw e;
      }
    }

    return res;
  }

  // --- CARDS API ---

  public async getCards(): Promise<PaymentCard[]> {
    const res = await this.safeFetch('/api/v1/cards');
    if (!res.ok) throw new Error('Failed to retrieve payment cards');
    return res.json();
  }

  public async createCard(cardData: Partial<PaymentCard>): Promise<PaymentCard> {
    const res = await this.safeFetch('/api/v1/cards', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create payment card');
    }
    return res.json();
  }

  public async deleteCard(cardId: string): Promise<void> {
    const res = await this.safeFetch(`/api/v1/cards/${cardId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete payment card');
  }

  // --- EXPENSES API ---

  public async getExpenses(filters: {
    category?: string;
    cardId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    isFood?: boolean;
  } = {}): Promise<Expense[]> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.append(key, String(val));
      }
    });

    const res = await this.safeFetch(`/api/v1/expenses?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve expenses');
    return res.json();
  }

  public async createExpense(expenseData: Partial<Expense>): Promise<Expense> {
    const res = await this.safeFetch('/api/v1/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record expense');
    }
    return res.json();
  }

  public async updateExpense(id: string, expenseData: Partial<Expense>): Promise<Expense> {
    const res = await this.safeFetch(`/api/v1/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    if (!res.ok) throw new Error('Failed to update expense details');
    return res.json();
  }

  public async deleteExpense(id: string): Promise<void> {
    const res = await this.safeFetch(`/api/v1/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete expense record');
  }

  // --- ADMIN AUDIT LOGS API ---

  public async getAuditLogs(): Promise<AuditLog[]> {
    const res = await this.safeFetch('/api/v1/admin/audit-logs');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Insufficient privileges to access administrative logs');
    }
    return res.json();
  }

  // --- AI ANALYSIS API ---

  public async getAiInsights(): Promise<AIInsight[]> {
    const res = await this.safeFetch('/api/v1/ai/analyze', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to generate AI financial insights');
    const data = await res.json();
    return data.insights;
  }
}

export const api = new ApiClient();
export default api;
