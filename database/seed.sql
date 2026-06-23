-- Seed data for AMS-SMK Database

-- Insert default admin user (password: admin123)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@tkj-lab.sch.id', '$2a$10$Ak8Hp83ihpBjB9/mSPix7.kumweCxah8Si5HKbgceYzHDelgDX7fy', 'Lab Administrator', 'admin'),
('laboran', 'laboran@tkj-lab.sch.id', '$2a$10$Ak8Hp83ihpBjB9/mSPix7.kumweCxah8Si5HKbgceYzHDelgDX7fy', 'Laboran TKJ', 'laboran')
ON CONFLICT (username) DO NOTHING;

-- Insert sample inventory items
INSERT INTO inventory (code, name, category, condition, location, purchase_date, price, specifications) VALUES
('INV-RTR-001', 'Cisco Router 2911', 'Networking', 'available', 'Lab TKJ Ruang A', '2023-01-15', 12500000, '3-port Gigabit Ethernet, ISR G2'),
('INV-RTR-002', 'Cisco Router 2921', 'Networking', 'available', 'Lab TKJ Ruang A', '2023-01-15', 15000000, '3-port Gigabit Ethernet, Enhanced'),
('INV-RTR-003', 'Cisco Router 1941', 'Networking', 'borrowed', 'Lab TKJ Ruang A', '2022-11-20', 8500000, '2-port Gigabit Ethernet'),
('INV-RTR-004', 'Cisco Router 2911', 'Networking', 'available', 'Lab TKJ Ruang B', '2023-02-10', 12500000, '3-port Gigabit Ethernet'),
('INV-MKT-011', 'Mikrotik RB951', 'Networking', 'available', 'Lab TKJ Ruang A', '2023-03-05', 850000, '5-port FastEthernet, WiFi'),
('INV-MKT-012', 'Mikrotik hEX', 'Networking', 'available', 'Lab TKJ Ruang B', '2023-04-12', 950000, '5-port Gigabit'),
('INV-SW-021', 'Cisco Catalyst 2960', 'Networking', 'available', 'Lab TKJ Ruang A', '2022-09-18', 4500000, '24-port managed switch'),
('INV-SW-022', 'TP-Link TL-SG1024D', 'Networking', 'maintenance', 'Lab TKJ Ruang A', '2022-08-25', 1200000, '24-port Gigabit unmanaged'),
('INV-PC-101', 'PC Lab Unit 01', 'Computer', 'available', 'Lab TKJ Ruang A', '2023-01-10', 8500000, 'i5-10400, 16GB RAM, 512GB SSD'),
('INV-PC-102', 'PC Lab Unit 02', 'Computer', 'available', 'Lab TKJ Ruang A', '2023-01-10', 8500000, 'i5-10400, 16GB RAM, 512GB SSD'),
('INV-PC-103', 'PC Lab Unit 03', 'Computer', 'damaged', 'Lab TKJ Ruang A', '2022-12-05', 8500000, 'i5-10400, 16GB RAM, 512GB SSD'),
('INV-PC-12', 'PC Lab Unit 12', 'Computer', 'available', 'Lab TKJ Ruang B', '2022-11-15', 7500000, 'i3-10100, 8GB RAM, 256GB SSD'),
('INV-TLS-001', 'Cable Tester', 'Tools', 'available', 'Lab TKJ Storage', '2022-07-20', 350000, 'RJ45 network cable tester'),
('INV-TLS-002', 'Crimping Tool', 'Tools', 'maintenance', 'Lab TKJ Storage', '2022-07-20', 180000, 'RJ45 crimping tool')
ON CONFLICT (code) DO NOTHING;

-- Insert sample consumables
INSERT INTO consumables (name, quantity, unit, min_threshold, location, last_restock_date) VALUES
('Kabel UTP Cat6', 2, 'Roll', 5, 'Lab TKJ Storage', '2024-01-10'),
('RJ45 Connectors', 0, 'Box', 2, 'Lab TKJ Storage', '2023-12-05'),
('Kabel Fiber Optic', 8, 'Meter', 10, 'Lab TKJ Storage', '2024-02-15'),
('Cable Ties', 150, 'Pieces', 50, 'Lab TKJ Storage', '2024-01-20'),
('Thermal Paste', 5, 'Tube', 3, 'Lab TKJ Storage', '2024-02-01'),
('SATA Cables', 12, 'Pieces', 5, 'Lab TKJ Storage', '2023-11-10')
ON CONFLICT DO NOTHING;

-- Insert sample active loans
INSERT INTO loans (inventory_id, borrower_name, borrower_class, borrower_contact, loan_date, due_date, status, condition_on_loan) VALUES
((SELECT id FROM inventory WHERE code = 'INV-RTR-003'), 'Andi Santoso', 'XII TKJ 1', '081234567890', '2024-06-20', '2024-06-27', 'borrowed', 'good'),
((SELECT id FROM inventory WHERE code = 'INV-MKT-011'), 'Budi Wijaya', 'XI TKJ 2', '081234567891', '2024-06-18', '2024-06-25', 'overdue', 'good')
ON CONFLICT DO NOTHING;

-- Insert sample cannibalization log
INSERT INTO cannibalization_logs (source_inventory_id, source_item_name, component_name, destination_inventory_id, destination_item_name, quantity, date, reason) VALUES
((SELECT id FROM inventory WHERE code = 'INV-PC-103'), 'PC Lab Unit 03', 'RAM 8GB DDR4', (SELECT id FROM inventory WHERE code = 'INV-PC-12'), 'PC Lab Unit 12', 1, '2024-06-15', 'Source PC damaged, upgrading destination PC')
ON CONFLICT DO NOTHING;
