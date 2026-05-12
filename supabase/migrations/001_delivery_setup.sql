-- Migration: 001_delivery_setup
-- Date: 2026-05-12
-- Description: Create delivery_platforms table for food delivery integrations
-- Project: tfnysxaxngwrwmhlhjhp
-- Created by: Sprocket

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create delivery_platforms table
CREATE TABLE IF NOT EXISTS delivery_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID,
    platform_name TEXT NOT NULL,
    api_key_encrypted TEXT,
    merchant_id TEXT,
    is_master_account BOOLEAN DEFAULT false
);

-- Enable RLS (Row Level Security)
ALTER TABLE delivery_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Allow all access (can be refined later)
CREATE POLICY "Allow all access to delivery_platforms" ON delivery_platforms 
FOR ALL USING (true) WITH CHECK (true);

-- Create index for client_id lookups
CREATE INDEX IF NOT EXISTS idx_delivery_platforms_client_id ON delivery_platforms(client_id);

-- Create index for platform_name lookups  
CREATE INDEX IF NOT EXISTS idx_delivery_platforms_platform_name ON delivery_platforms(platform_name);