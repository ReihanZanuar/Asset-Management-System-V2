-- Stock opname audit sessions
CREATE TABLE IF NOT EXISTS stock_audits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock opname scanned items
CREATE TABLE IF NOT EXISTS stock_audit_items (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES stock_audits(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    scanned_code VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    expected_location VARCHAR(255),
    found_location VARCHAR(255),
    expected_condition VARCHAR(50),
    found_condition VARCHAR(50),
    notes TEXT,
    scanned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (audit_id, scanned_code)
);

CREATE INDEX IF NOT EXISTS idx_stock_audit_items_audit_id ON stock_audit_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_stock_audit_items_status ON stock_audit_items(status);
