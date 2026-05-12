-- Migration: 001_initial_schema
-- Date: 2026-05-12
-- Description: Initial database schema for Mission Control (Food Tracker)
-- Created by: Sprocket

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    owner_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB DEFAULT '[]'
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    agent_id TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'INBOX',
    priority INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags JSONB DEFAULT '[]',
    description TEXT DEFAULT '',
    assigned_agent TEXT DEFAULT ''
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'subagent',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients (allow all for now - can be refined)
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for tasks (allow all for now)
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for agents (allow all for now)
CREATE POLICY "Allow all access to agents" ON agents FOR ALL USING (true) WITH CHECK (true);

-- Create index on tasks for faster status queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create index on tasks for faster client_id lookups
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- Create index on tasks for agent assignments
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);