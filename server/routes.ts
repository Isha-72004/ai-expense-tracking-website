/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { generateFinancialInsights } from './gemini';
import { User, UserRole, PaymentCard, Expense, AuditLog } from '../src/types';

export const apiRouter = Router();

// --- CONSTANTS ---
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_99881122';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_33445566';

// --- MIDDLEWARES ---

// Sliding-window Rate Limiter (SOLID Single Responsibility)
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};
export function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();

    if (!rateLimitStore[ip] || now > rateLimitStore[ip].resetTime) {
      rateLimitStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    rateLimitStore[ip].count++;
    if (rateLimitStore[ip].count > limit) {
      db.auditLogs.create({
        id: `l_${Date.now()}_limit`,
        action: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        details: `IP ${ip} hit rate limit on ${req.originalUrl}. Blocked.`,
      });
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    next();
  };
}

// Authenticate JWT Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token is missing' });
    return;
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Token is invalid or expired' });
      return;
    }
    (req as any).user = decoded;
    next();
  });
}

// Role-Based Access Control Middleware (RBAC)
export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      db.auditLogs.create({
        id: `l_${Date.now()}_rbac`,
        userId: user?.id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        timestamp: new Date().toISOString(),
        details: `User ${user?.email || 'Unknown'} attempted to access admin logs without authorization.`,
      });
      res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
}

// Audit Logger Helper
export function logAuditAction(userId: string | undefined, action: string, details: string, req: Request) {
  db.auditLogs.create({
    id: `l_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    action,
    timestamp: new Date().toISOString(),
    details,
    ipAddress: req.ip || req.headers['x-forwarded-for'] as string || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'unknown',
  });
}


// --- API VERSION 1 ROUTES ---

// Rate Limit sensitive Auth endpoints: 10 requests per minute
const authRateLimiter = rateLimiter(10, 60 * 1000);

// SIGNUP
apiRouter.post('/auth/signup', authRateLimiter, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (db.users.findByEmail(email)) {
      res.status(409).json({ error: 'A user with this email address already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `u_${Date.now()}`;

    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      name,
      role: UserRole.USER,
      createdAt: new Date().toISOString(),
    };

    db.users.create(newUser, passwordHash);

    // Create Audit Log
    logAuditAction(userId, 'USER_REGISTERED', `User account ${email} registered successfully.`, req);

    // Create JWTs
    const accessToken = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: newUser.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    db.refreshTokens.create(userId, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    res.status(201).json({
      accessToken,
      refreshToken,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
});

// SIGNIN
apiRouter.post('/auth/signin', authRateLimiter, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      logAuditAction(undefined, 'LOGIN_FAILED', `Failed sign-in attempt for non-existent user: ${email}`, req);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const hash = db.users.getPasswordHash(user.id);
    if (!hash || !bcrypt.compareSync(password, hash)) {
      logAuditAction(user.id, 'LOGIN_FAILED', `Failed password validation for user: ${email}`, req);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Success
    logAuditAction(user.id, 'USER_LOGIN', `User ${user.email} successfully logged in.`, req);

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    db.refreshTokens.create(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    res.json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// TOKEN REFRESH
apiRouter.post('/auth/refresh', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const savedToken = db.refreshTokens.find(refreshToken);
    if (!savedToken) {
      res.status(403).json({ error: 'Invalid or revoked refresh token' });
      return;
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err: any, decoded: any) => {
      if (err) {
        db.refreshTokens.delete(refreshToken);
        res.status(403).json({ error: 'Expired or tampered refresh token' });
        return;
      }

      const user = db.users.findById(decoded.id);
      if (!user) {
        res.status(403).json({ error: 'User associated with this token no longer exists' });
        return;
      }

      const newAccessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    next(error);
  }
});

// LOGOUT
apiRouter.post('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      db.refreshTokens.delete(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// GET CURRENT USER Profile
apiRouter.get('/auth/me', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenUser = (req as any).user;
    const user = db.users.findById(tokenUser.id);
    if (!user) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});


// --- CARDS ENDPOINTS ---

apiRouter.get('/cards', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    res.json(db.cards.listByUserId(userId));
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/cards', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { cardName, cardNumber, cardType, cardHolder, expiryDate, creditLimit, color } = req.body;

    if (!cardName || !cardNumber || !creditLimit) {
      res.status(400).json({ error: 'Card name, number, and credit limit are required' });
      return;
    }

    const newCard: PaymentCard = {
      id: `c_${Date.now()}`,
      userId,
      cardName,
      cardNumber: cardNumber.startsWith('****') ? cardNumber : `**** **** **** ${cardNumber.slice(-4)}`,
      cardType: cardType || 'visa',
      cardHolder: cardHolder || (req as any).user.email.split('@')[0],
      expiryDate: expiryDate || '12/28',
      creditLimit: Number(creditLimit),
      spent: 0,
      color: color || 'blue',
      createdAt: new Date().toISOString(),
    };

    db.cards.create(newCard);
    logAuditAction(userId, 'CARD_CREATED', `Created new payment card: ${cardName}`, req);

    res.status(201).json(newCard);
  } catch (error) {
    next(error);
  }
});

apiRouter.delete('/cards/:id', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const cardId = req.params.id;

    const card = db.cards.findById(cardId);
    if (!card || card.userId !== userId) {
      res.status(404).json({ error: 'Payment card not found' });
      return;
    }

    db.cards.delete(cardId, userId);
    logAuditAction(userId, 'CARD_DELETED', `Deleted card: ${card.cardName}`, req);

    res.json({ message: 'Card removed successfully' });
  } catch (error) {
    next(error);
  }
});


// --- EXPENSES ENDPOINTS ---

apiRouter.get('/expenses', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    let list = db.expenses.listByUserId(userId);

    // Filter by category
    const { category, cardId, search, startDate, endDate, isFood } = req.query;

    if (category) {
      list = list.filter(e => e.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (cardId) {
      list = list.filter(e => e.cardId === cardId);
    }

    if (isFood) {
      list = list.filter(e => e.isFood === (isFood === 'true'));
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(e => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }

    if (startDate) {
      list = list.filter(e => e.date >= (startDate as string));
    }

    if (endDate) {
      list = list.filter(e => e.date <= (endDate as string));
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(list);
  } catch (error) {
    next(error);
  }
});

apiRouter.post('/expenses', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { amount, category, description, date, cardId, isFood, foodDetails } = req.body;

    if (!amount || !category || !description) {
      res.status(400).json({ error: 'Amount, category, and description are required' });
      return;
    }

    const numAmount = Number(amount);

    const newExpense: Expense = {
      id: `e_${Date.now()}`,
      userId,
      amount: numAmount,
      category,
      description,
      date: date || new Date().toISOString(),
      cardId,
      isFood: !!isFood,
      foodDetails: isFood ? {
        mealType: foodDetails?.mealType || 'lunch',
        calories: foodDetails?.calories ? Number(foodDetails.calories) : undefined,
        healthRating: foodDetails?.healthRating ? Number(foodDetails.healthRating) as any : undefined,
        restaurant: foodDetails?.restaurant || undefined,
      } : undefined,
      createdAt: new Date().toISOString(),
    };

    db.expenses.create(newExpense);

    // Update spending limit on linked card
    if (cardId) {
      db.cards.updateSpent(cardId, numAmount);
    }

    logAuditAction(userId, 'EXPENSE_CREATED', `Created expense: $${numAmount.toFixed(2)} on ${category}`, req);

    res.status(201).json(newExpense);
  } catch (error) {
    next(error);
  }
});

apiRouter.put('/expenses/:id', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const expenseId = req.params.id;
    const { amount, category, description, date, cardId, isFood, foodDetails } = req.body;

    const oldExpense = db.expenses.findById(expenseId);
    if (!oldExpense || oldExpense.userId !== userId) {
      res.status(404).json({ error: 'Expense item not found' });
      return;
    }

    const originalAmount = oldExpense.amount;
    const originalCardId = oldExpense.cardId;

    const updates: Partial<Expense> = {};
    if (amount !== undefined) updates.amount = Number(amount);
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = date;
    if (cardId !== undefined) updates.cardId = cardId;
    if (isFood !== undefined) updates.isFood = !!isFood;
    if (foodDetails !== undefined) {
      updates.foodDetails = {
        mealType: foodDetails.mealType || 'lunch',
        calories: foodDetails.calories ? Number(foodDetails.calories) : undefined,
        healthRating: foodDetails.healthRating ? Number(foodDetails.healthRating) as any : undefined,
        restaurant: foodDetails.restaurant || undefined,
      };
    }

    const updated = db.expenses.update(expenseId, userId, updates);

    // Adjust card limits if card or amount changed
    if (amount !== undefined || cardId !== undefined) {
      const newAmt = amount !== undefined ? Number(amount) : originalAmount;
      const newCardId = cardId !== undefined ? cardId : originalCardId;

      if (originalCardId === newCardId) {
        if (originalCardId) {
          const difference = newAmt - originalAmount;
          db.cards.updateSpent(originalCardId, difference);
        }
      } else {
        // Refund old card
        if (originalCardId) {
          db.cards.updateSpent(originalCardId, -originalAmount);
        }
        // Charge new card
        if (newCardId) {
          db.cards.updateSpent(newCardId, newAmt);
        }
      }
    }

    logAuditAction(userId, 'EXPENSE_UPDATED', `Updated expense: ${oldExpense.description}`, req);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

apiRouter.delete('/expenses/:id', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const expenseId = req.params.id;

    const expense = db.expenses.findById(expenseId);
    if (!expense || expense.userId !== userId) {
      res.status(404).json({ error: 'Expense item not found' });
      return;
    }

    db.expenses.delete(expenseId, userId);

    // Refund associated card spent value
    if (expense.cardId) {
      db.cards.updateSpent(expense.cardId, -expense.amount);
    }

    logAuditAction(userId, 'EXPENSE_DELETED', `Deleted expense: $${expense.amount.toFixed(2)} - ${expense.description}`, req);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
});


// --- ADMIN AUDIT LOGS ENDPOINT (RBAC) ---

apiRouter.get('/admin/audit-logs', authenticateToken, requireRole(UserRole.ADMIN), (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(db.auditLogs.list());
  } catch (error) {
    next(error);
  }
});


// --- AI MODULE ENDPOINT ---

apiRouter.post('/ai/analyze', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const expenses = db.expenses.listByUserId(userId);

    const insights = await generateFinancialInsights(expenses);
    res.json({ insights });
  } catch (error) {
    next(error);
  }
});


// --- CENTRALIZED ERROR HANDLER (SOLID Open/Closed Principle) ---
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('SERVER_UNHANDLED_ERROR:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal error occurred';

  db.auditLogs.create({
    id: `l_${Date.now()}_err`,
    action: 'SERVER_CRASH_PREVENTED',
    timestamp: new Date().toISOString(),
    details: `Error caught by router: "${message}". Stack: ${err.stack?.slice(0, 150)}`,
  });

  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
    },
  });
}
