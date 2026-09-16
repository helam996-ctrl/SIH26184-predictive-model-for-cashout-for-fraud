-- ====================================================================
-- CYBERSURAKSHA (SIH 26184) - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ====================================================================
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click "Run"
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fraud Complaints Table (NCRP / 1930 Helpline Ingestion)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(64) UNIQUE NOT NULL,
    source_account VARCHAR(64) NOT NULL,
    victim_name VARCHAR(128) NOT NULL,
    victim_phone VARCHAR(20) NOT NULL,
    utr VARCHAR(64) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    channel VARCHAR(32) DEFAULT 'UPI',
    reporting_agency VARCHAR(128) DEFAULT '1930 / I4C CFCFRMS',
    source_ifsc VARCHAR(32),
    status VARCHAR(32) DEFAULT 'INGESTED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mule Accounts & Layering Traces Table
CREATE TABLE IF NOT EXISTS mule_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(64) REFERENCES complaints(incident_id) ON DELETE CASCADE,
    total_stolen_amount NUMERIC(14, 2) NOT NULL,
    hops_count INT NOT NULL DEFAULT 1,
    terminal_account VARCHAR(64) NOT NULL,
    terminal_holder_name VARCHAR(128) NOT NULL,
    terminal_bank VARCHAR(128) NOT NULL,
    terminal_ifsc VARCHAR(32) NOT NULL,
    kyc_branch_name VARCHAR(128),
    kyc_latitude NUMERIC(10, 6) NOT NULL,
    kyc_longitude NUMERIC(10, 6) NOT NULL,
    mule_account_age_days INT DEFAULT 0,
    is_dormant_reactivated BOOLEAN DEFAULT FALSE,
    transfer_velocity_inr_per_min NUMERIC(12, 2) DEFAULT 0.0,
    time_delta_minutes NUMERIC(8, 2) DEFAULT 0.0,
    composite_risk_score NUMERIC(5, 2) NOT NULL,
    threat_level VARCHAR(32) NOT NULL,
    operational_window_minutes INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Statutory Section 102 BNSS Legal Hold Notices Table
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notice_id VARCHAR(64) UNIQUE NOT NULL,
    incident_id VARCHAR(64) REFERENCES complaints(incident_id) ON DELETE CASCADE,
    statutory_authority VARCHAR(128) DEFAULT 'Section 102 BNSS, 2023 / Form 91',
    bank_name VARCHAR(128) NOT NULL,
    nodal_officer_email VARCHAR(128) NOT NULL,
    terminal_account VARCHAR(64) NOT NULL,
    terminal_holder VARCHAR(128) NOT NULL,
    frozen_amount NUMERIC(14, 2) NOT NULL,
    utr_chain TEXT[] DEFAULT '{}',
    issuing_officer VARCHAR(128) NOT NULL,
    issuing_badge VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'DISPATCHED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Field & Bank Dispatch Logs (Resend / Fast2SMS)
CREATE TABLE IF NOT EXISTS dispatch_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id VARCHAR(64) REFERENCES complaints(incident_id) ON DELETE CASCADE,
    dispatch_type VARCHAR(32) NOT NULL, -- 'BANK_EMAIL' or 'PATROL_SMS'
    recipient VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'SENT_LIVE', 'SIMULATED_SUCCESS', 'FAILED'
    external_provider_id VARCHAR(128),
    payload_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Authorized Personnel & Registered Officers Table
CREATE TABLE IF NOT EXISTS personnel_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    badge_id VARCHAR(64) UNIQUE NOT NULL,
    rank VARCHAR(128) NOT NULL,
    agency VARCHAR(128) NOT NULL,
    agency_type VARCHAR(32) NOT NULL, -- 'lea', 'i4c', 'bank'
    jurisdiction VARCHAR(128) NOT NULL,
    phone VARCHAR(20),
    gov_sso_id VARCHAR(64) UNIQUE NOT NULL,
    clearance_level VARCHAR(64) DEFAULT 'Level 3 - Section 102 BNSS Authorized',
    sso_provider VARCHAR(64) DEFAULT 'National Single Sign-On (Govt of India)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Seed Initial Authorized Evaluator Demo Profiles
INSERT INTO personnel_users (name, email, badge_id, rank, agency, agency_type, jurisdiction, phone, gov_sso_id)
VALUES
('Inspector Vikram Rawat', 'v.rawat@delhipolice.gov.in', 'DL-CYBER-8841', 'Station House Officer / Lead IO', 'Delhi Police Cyber PS South', 'lea', 'South Delhi / NCR Zone', '+91 98101 23456', 'GOV-DL-8841'),
('Dr. S. Nambiar', 's.nambiar@i4c.gov.in', 'MHA-I4C-0922', 'Director / Principal Forensic Analyst', 'Indian Cyber Crime Coordination Centre (I4C)', 'i4c', 'National Command Desk, MHA', '+91 99200 78901', 'GOV-MHA-0922'),
('Neha Sharma', 'neha.sharma@sbi.co.in', 'SBI-NODAL-4109', 'Chief Manager / Nodal Desk Lead', 'State Bank of India (FRM Wing)', 'bank', 'Northern Zonal Clearing Hub', '+91 98711 54321', 'GOV-SBI-4109'),
('SI Amit Deshmukh', 'amit.deshmukh@delhipolice.gov.in', 'DL-PATROL-104', 'Sub-Inspector / QRT Interdiction', 'South Delhi Beat Patrol Unit', 'lea', 'Saket - Malviya Nagar Corridor', '+91 97112 33445', 'GOV-DL-104')
ON CONFLICT (email) DO NOTHING;

-- 8. Enable Row Level Security (RLS) & Public Read for Prototype
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE mule_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on complaints" ON complaints FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on mule_traces" ON mule_traces FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on mule_traces" ON mule_traces FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on legal_holds" ON legal_holds FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on legal_holds" ON legal_holds FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on dispatch_logs" ON dispatch_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on dispatch_logs" ON dispatch_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on personnel_users" ON personnel_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on personnel_users" ON personnel_users FOR INSERT WITH CHECK (true);
