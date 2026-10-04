-- TOAST University Academic Operating System — Core PostgreSQL 16 Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS campus_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    theme_config JSONB DEFAULT '{"mode":"light","accent":"#1D4ED8"}'::jsonb,
    storage_quota_bytes BIGINT DEFAULT 1099511627776,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES campus_tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    building VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS degree_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_semesters INT DEFAULT 8,
    total_required_credits NUMERIC(5,1) DEFAULT 160.0
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES campus_tenants(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    institutional_id VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    primary_role VARCHAR(32) NOT NULL CHECK (primary_role IN ('STUDENT', 'TA', 'FACULTY', 'HOD', 'DEAN', 'ADMIN')),
    semester INT DEFAULT 5,
    section VARCHAR(32) DEFAULT 'CSE-5A',
    cgpa NUMERIC(4,2) DEFAULT 8.84,
    xp BIGINT DEFAULT 2450,
    streak_days INT DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_dept ON users(primary_role, department_id);
CREATE INDEX IF NOT EXISTS idx_users_inst_id ON users(institutional_id);
