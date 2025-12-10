-- Create table for managing expedition requirements per expedition level
CREATE TABLE IF NOT EXISTS expedition_requirements (
  id SERIAL PRIMARY KEY,
  expedition_level INTEGER NOT NULL,
  part_number INTEGER NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  location VARCHAR(200) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expedition_level, part_number, item_name)
);

CREATE INDEX idx_expedition_requirements_level ON expedition_requirements(expedition_level);
CREATE INDEX idx_expedition_requirements_part ON expedition_requirements(part_number);

-- Insert default requirements for Expedition 1 (same as current Part 1-5)
INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order) VALUES
-- Expedition 1, Part 1
(1, 1, 'Metal Parts', '150', 'Basic Materials', 1),
(1, 1, 'Rubber Parts', '200', 'Basic Materials', 2),
(1, 1, 'ARC Alloy', '80', 'Drones', 3),
(1, 1, 'Steel Spring', '15', 'Mechanical/Celeste', 4),
-- Expedition 1, Part 2
(1, 2, 'Durable Cloth', '35', 'Medical/Commercial', 1),
(1, 2, 'Wires', '30', 'Electrical/Tech/Celeste', 2),
(1, 2, 'Electrical Components', '30', 'Electrical/Refiner', 3),
(1, 2, 'Cooling Fans', '5', 'Technological', 4),
-- Expedition 1, Part 3
(1, 3, 'Light Bulb', '5', 'Electrical', 1),
(1, 3, 'Battery', '30', 'Tech/Electrical/Celeste', 2),
(1, 3, 'Sensors', '20', 'Security/Tech/Celeste', 3),
(1, 3, 'Exodus Modules', '1', 'Exodus/Celeste', 4),
-- Expedition 1, Part 4
(1, 4, 'Humidifier', '5', 'Residential', 1),
(1, 4, 'Adv. Electrical Components', '5', 'Electrical/Refiner', 2),
(1, 4, 'Magnetic Accelerator', '3', 'Exodus', 3),
(1, 4, 'Leaper Pulse Unit', '3', 'Drones', 4),
-- Expedition 1, Part 5
(1, 5, 'Combat Items', '250k Value', 'Turn in items', 1),
(1, 5, 'Survival Items', '100k Value', 'Turn in items', 2),
(1, 5, 'Provisions', '180k Value', 'Turn in items', 3),
(1, 5, 'Materials', '300k Value', 'Turn in items', 4);

-- Copy same requirements for Expedition 2 (can be changed later via admin)
INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order)
SELECT 2, part_number, item_name, quantity, location, display_order
FROM expedition_requirements
WHERE expedition_level = 1;
