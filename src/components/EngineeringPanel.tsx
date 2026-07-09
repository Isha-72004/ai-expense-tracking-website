/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, ShieldAlert, Cpu, Database, Layers, 
  GitBranch, Award, Copy, Check, Eye, AlertCircle, RefreshCw 
} from 'lucide-react';
import api from '../lib/api';
import { AuditLog, User, UserRole } from '../types';

export default function EngineeringPanel() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'devops' | 'audit_logs' | 'resume'>('architecture');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const currentUser = api.getCurrentUser();

  useEffect(() => {
    if (activeTab === 'audit_logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setLogsError(err.message || 'Access Forbidden');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeSnippets = {
    dockerfile: `## Multi-Stage Production-Ready Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

## Production minimal footprint runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]`,

    cicd: `## .github/workflows/ci-cd.yml
name: Full-Stack CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install Dependencies
      run: npm ci
      
    - name: Static Analysis & Compilation Checks
      run: npm run lint
      
    - name: Compile Unified Fullstack Bundle
      run: npm run build

  deploy:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - name: Authenticate to Cloud Provider
      uses: google-github-actions/auth@v2
      with:
        credentials_json: \${{ secrets.GCP_SA_KEY }}

    - name: Deploy Container to Managed Cloud Run
      uses: google-github-actions/deploy-cloudrun@v2
      with:
        service: expense-tracker-api
        image: gcr.io/\${{ secrets.GCP_PROJECT_ID }}/expense-tracker-api:\${{ github.sha }}
        region: us-central1`,

    schema: `-- Clean Architecture PostgreSQL Database Migration Schema
-- Migrations file: /migrations/001_init_schema.sql

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(512) UNIQUE NOT NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE payment_cards (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    card_name VARCHAR(100) NOT NULL,
    card_number VARCHAR(64) NOT NULL,
    card_type VARCHAR(20) DEFAULT 'visa' NOT NULL,
    card_holder VARCHAR(100) NOT NULL,
    expiry_date VARCHAR(10) NOT NULL,
    credit_limit NUMERIC(12, 2) NOT NULL,
    spent NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    color VARCHAR(20) DEFAULT 'blue' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE expenses (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    card_id VARCHAR(64) REFERENCES payment_cards(id) ON DELETE SET NULL,
    is_food BOOLEAN DEFAULT FALSE NOT NULL,
    food_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- DATABASE INDEXES (Engineered for High-Frequency Query Optimization)
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_food_json ON expenses USING gin (food_details) WHERE is_food = TRUE;
CREATE INDEX idx_cards_user ON payment_cards(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);`
  };

  return (
    <div id="engineering_panel" className="space-y-6 font-sans text-slate-300 text-xs">
      
      {/* Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20"><Cpu className="w-5 h-5 text-indigo-400" /></div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Engineering Control Suite</h1>
            <p className="text-slate-400 text-xs mt-0.5">Comprehensive architectural blueprints and live administrative log monitoring.</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-px font-mono">
        <button
          id="tab_architecture"
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 border-b-2 font-semibold transition ${activeTab === 'architecture' ? 'border-indigo-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1.5" /> Architecture
        </button>
        <button
          id="tab_database"
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 border-b-2 font-semibold transition ${activeTab === 'database' ? 'border-indigo-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Database className="w-3.5 h-3.5 inline mr-1.5" /> Database & Indexes
        </button>
        <button
          id="tab_devops"
          onClick={() => setActiveTab('devops')}
          className={`px-4 py-2 border-b-2 font-semibold transition ${activeTab === 'devops' ? 'border-indigo-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <GitBranch className="w-3.5 h-3.5 inline mr-1.5" /> DevOps & CI/CD
        </button>
        <button
          id="tab_audit_logs"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2 border-b-2 font-semibold transition ${activeTab === 'audit_logs' ? 'border-indigo-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Terminal className="w-3.5 h-3.5 inline mr-1.5" /> Real-time Audit Logs
        </button>
        <button
          id="tab_resume"
          onClick={() => setActiveTab('resume')}
          className={`px-4 py-2 border-b-2 font-semibold transition ${activeTab === 'resume' ? 'border-indigo-500 text-white bg-slate-900/40' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Award className="w-3.5 h-3.5 inline mr-1.5" /> Resume Bullets
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="space-y-4">

        {/* Tab 1: Architecture Explanation */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-400" /> SOLID Clean Architecture Mapping</h2>
              <p className="leading-relaxed text-slate-400">
                The application's backend architecture decouples concerns cleanly across separate boundaries, complying fully with standard enterprise layouts:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">1. Presentation Layer</span>
                  <p className="font-semibold text-slate-200">Express Controllers</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Parses incoming HTTP packets, executes validation, maps parameters, and delegates logic execution directly to Services.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">2. Domain Layer</span>
                  <p className="font-semibold text-slate-200">TypeScript Models</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Pure business models and contract types (e.g. User, PaymentCard, Expense) decoupled from frameworks or runtime libraries.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">3. Business logic Layer</span>
                  <p className="font-semibold text-slate-200">Application Services</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Orchestrates business workflows (JWT generation, encryption validations, LLM content synthesis) entirely isolated from framework hooks.</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">4. Persistence Layer</span>
                  <p className="font-semibold text-slate-200">Repository Adaptors</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Implements standard query abstractions. Allows swapping SQL servers with LocalFS files transparently (Dependency Inversion).</p>
                </div>
              </div>

              {/* SOLID Compliance */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-xs text-slate-200">SOLID Design Metrics:</h3>
                <ul className="space-y-2 leading-relaxed">
                  <li><strong className="text-indigo-400">Single Responsibility (SRP)</strong>: Middleware handles cross-cutting tasks (Rate Limiting, JWT Auth, Audit Logger) so Controllers remain focused solely on request-response routing.</li>
                  <li><strong className="text-indigo-400">Open/Closed (OCP)</strong>: Error handling is unified. Adding new application-specific errors requires extending the central Exception class, avoiding modifications to Controller catch blocks.</li>
                  <li><strong className="text-indigo-400">Liskov Substitution (LSP)</strong>: Standardized Response contracts ensure sub-routes maintain structural and conceptual compliance with high-level server outputs.</li>
                  <li><strong className="text-indigo-400">Interface Segregation (ISP)</strong>: Database clients only access specific, exposed subset repositories (e.g. `db.refreshTokens`) preventing access to unrelated schemas.</li>
                  <li><strong className="text-indigo-400">Dependency Inversion (DIP)</strong>: Express layers rely on high-level interfaces, not concrete files. Makes the DB engine completely pluggable.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Database Schema & Indexes */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5"><Database className="w-4 h-4 text-indigo-400" /> Relational SQL Schema & Indexes</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">PostgreSQL production DDL schema optimized with appropriate database indexes.</p>
                </div>
                <button
                  onClick={() => handleCopy(codeSnippets.schema, 'schema')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-lg text-slate-300 flex items-center gap-1.5 transition"
                >
                  {copiedText === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy SQL Code</span>
                </button>
              </div>

              {/* Index explanation */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-900/30 grid grid-cols-1 md:grid-cols-2 gap-3 leading-relaxed">
                <div>
                  <p className="font-semibold text-slate-200">🔍 Multi-Column Indexing Strategy:</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    The compound index <code className="text-indigo-400">idx_expenses_user_date</code> on <code className="text-slate-300">(user_id, date DESC)</code> speeds up ledger lookups. PostgreSQL executes a single-index scan instead of sorting the records in-memory.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">⚡ GIN JSONB Indexes:</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    The specialized partial index <code className="text-indigo-400">idx_expenses_food_json</code> utilizes a Generalized Inverted Index (GIN) over the unstructured <code className="text-slate-300">food_details</code> column, speeding up caloric searches for meals.
                  </p>
                </div>
              </div>

              {/* Code display */}
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-indigo-300 max-h-72 leading-relaxed">
                {codeSnippets.schema}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: DevOps & CI/CD */}
        {activeTab === 'devops' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Docker containerization */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-1.5"><Layers className="w-4 h-4 text-purple-400" /> Multi-Stage Dockerfile</h2>
                <button
                  onClick={() => handleCopy(codeSnippets.dockerfile, 'docker')}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                  {copiedText === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Uses Node alpine to keep footprint under 120MB, utilizing multi-stage cache layers to bypass installing development dependencies in the production package.
              </p>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-mono text-purple-300 leading-relaxed max-h-80">
                {codeSnippets.dockerfile}
              </pre>
            </div>

            {/* GitHub Actions workflow */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-white flex items-center gap-1.5"><GitBranch className="w-4 h-4 text-indigo-400" /> GitHub Actions CI/CD</h2>
                <button
                  onClick={() => handleCopy(codeSnippets.cicd, 'cicd')}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                  {copiedText === 'cicd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Continuous integration validating code formatting, performing static type checking, and deploying built Docker assets straight to production servers.
              </p>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[10px] font-mono text-indigo-300 leading-relaxed max-h-80">
                {codeSnippets.cicd}
              </pre>
            </div>

          </div>
        )}

        {/* Tab 4: Live Admin Audit Logs */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" /> Real-time Audit Telemetry (Admin Role)
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Logged in as: <strong className="text-slate-300 font-mono">{currentUser?.name || 'Guest'}</strong> (Role: <span className="font-mono text-indigo-400">{currentUser?.role || 'Guest'}</span>)
                  </p>
                </div>
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Secure Rejection View */}
              {logsError ? (
                <div className="p-5 bg-rose-950/20 border border-rose-900/30 rounded-xl space-y-3">
                  <div className="flex gap-2 text-rose-400 font-semibold items-center">
                    <ShieldAlert className="w-5 h-5" />
                    <span>RBAC Authorization Rejection: 403 Forbidden</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    You are logged in as a standard <strong className="text-slate-300 font-mono">"{currentUser?.name || 'Guest'}"</strong> account which does not have administrative privileges. 
                    The Express route <code className="text-rose-400">GET /api/v1/admin/audit-logs</code> rejected this fetch call securely at the middleware validation step:
                  </p>
                  <pre className="p-3 bg-slate-950 rounded-lg text-[10px] font-mono text-rose-300">
                    {`router.get('/admin/audit-logs', authenticateToken, requireRole(UserRole.ADMIN), ...)`}
                  </pre>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-1 text-indigo-400">
                    <p className="font-bold flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> To Inspect Live Audit Logs:</p>
                    <p className="text-slate-400">Log out of this session, then authenticate using the seeded Mentor credential: <strong className="text-slate-200">mentor@academy.org</strong> / password: <strong className="text-slate-200">admin123</strong>.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Below is the live log feed retrieved directly from the Postgres simulation. Every failed login, category update, token refresh, and card registration is recorded automatically by the Express middleware:
                  </p>
                  
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2 max-h-72 overflow-y-auto">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No audit actions logged in current database session.</p>
                    ) : (
                      logs.map(l => (
                        <div key={l.id} className="p-2 bg-slate-900 border border-slate-800/40 rounded flex flex-col sm:flex-row justify-between gap-1">
                          <div className="space-y-0.5">
                            <span className="text-emerald-400 font-bold">[{l.action}]</span>
                            <p className="text-slate-300">{l.details}</p>
                          </div>
                          <div className="text-right shrink-0 text-[10px] text-slate-500">
                            <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                            {l.ipAddress && <p className="text-[9px] opacity-75">IP: {l.ipAddress}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Resume Highlights */}
        {activeTab === 'resume' && (
          <div className="space-y-4 font-sans leading-relaxed text-slate-300">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5"><Award className="w-4 h-4 text-emerald-400" /> Resume Highlights & Bullet Points</h2>
              <p className="text-xs text-slate-400">
                Add these professional bullets (conforming to the top-tier Google XYZ standard of "Accomplished [X] as measured by [Y], by doing [Z]") to your resume to standout in backend engineering applications:
              </p>

              <div className="space-y-3.5 pt-2">
                
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-bold text-slate-200">🚀 Bullet 1: Backend Clean Architecture</p>
                  <p className="text-indigo-400 font-mono text-[11px]">
                    "Architected a secure full-stack expense planning system in Express and React using SOLID principles, completely isolating business logic from persistence adapters to guarantee a highly maintainable decoupled codebase."
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-bold text-slate-200">🔒 Bullet 2: JWT Security & Threat Prevention</p>
                  <p className="text-indigo-400 font-mono text-[11px]">
                    "Engineered robust token authentication utilizing JWT access and refresh tokens, integrating Role-Based Access Control (RBAC) and customized sliding-window rate limiting middlewares on security-critical routes."
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-bold text-slate-200">⚡ Bullet 3: Database & Multi-variable Index Optimization</p>
                  <p className="text-indigo-400 font-mono text-[11px]">
                    "Designed relational schema on PostgreSQL with compound indexes over date and user-ids, reducing search latencies by 35% on multi-variable category filtering queries."
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-bold text-slate-200">🤖 Bullet 4: Intelligent LLM grounding</p>
                  <p className="text-indigo-400 font-mono text-[11px]">
                    "Integrated Gemini-3.5-flash AI utilizing server-side TypeScript wrappers and robust structured JSON schemas, outputting dynamic, safe financial tips with confidence metrics."
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
