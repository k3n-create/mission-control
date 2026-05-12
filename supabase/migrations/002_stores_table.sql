-- Migration: 002_stores_table
-- Date: 2026-05-12
-- Description: Create stores table for per-store sales reporting
-- Project: tfnysxaxngwrwmhlhjhp
-- Created by: Sprocket

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES delivery_platforms(id) ON DELETE CASCADE,
    platform_store_id TEXT NOT NULL,
    store_name TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS (Row Level Security)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Allow all access
CREATE POLICY "Allow all access to stores" ON stores FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_stores_client_id ON stores(client_id);
CREATE INDEX IF NOT EXISTS idx_stores_platform_id ON stores(platform_id);
CREATE INDEX IF NOT EXISTS idx_stores_platform_store_id ON stores(platform_store_id);

-- Add unique constraint per platform (one store_id per platform record)
ALTER TABLE stores ADD CONSTRAINT unique_platform_store UNIQUE (platform_id, platform_store_id);