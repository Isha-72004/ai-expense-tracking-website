-- Clean Architecture PostgreSQL Database Migration Schema
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
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
