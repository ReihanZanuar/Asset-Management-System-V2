-- Migration: Add consumable_uses table for tracking usage
-- This table records when consumables are used, how much, and where

CREATE TABLE IF NOT EXISTS consumable_uses (
    id SERIAL PRIMARY KEY,
    consumable_id INTEGER NOT NULL REFERENCES consumables(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10,2) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consumable_uses_consumable_id ON consumable_uses(consumable_id);
CREATE INDEX IF NOT EXISTS idx_consumable_uses_used_at ON consumable_uses(used_at);
CREATE INDEX IF NOT EXISTS idx_consumable_uses_used_by ON consumable_uses(used_by);

-- Apply updated_at trigger
CREATE TRIGGER update_consumable_uses_updated_at BEFORE UPDATE ON consumable_uses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
