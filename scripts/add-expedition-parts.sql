-- Add expedition parts tracking
-- Allows users to track completion of the 5 expedition parts

CREATE TABLE IF NOT EXISTS expedition_parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    part_number INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expedition_parts_part_number ON expedition_parts(part_number);

COMMENT ON TABLE expedition_parts IS 'All 5 expedition parts that need to be completed';

-- User's completed expedition parts
CREATE TABLE IF NOT EXISTS raider_completed_expedition_parts (
    id SERIAL PRIMARY KEY,
    raider_profile_id INTEGER NOT NULL REFERENCES raider_profiles(id) ON DELETE CASCADE,
    expedition_part_id INTEGER NOT NULL REFERENCES expedition_parts(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(raider_profile_id, expedition_part_id)
);

CREATE INDEX idx_raider_completed_expedition_parts_profile ON raider_completed_expedition_parts(raider_profile_id);

COMMENT ON TABLE raider_completed_expedition_parts IS 'Tracks which expedition parts each raider has completed';

-- Insert expedition parts data
INSERT INTO expedition_parts (name, part_number, display_order) VALUES
('Part 1', 1, 1),
('Part 2', 2, 2),
('Part 3', 3, 3),
('Part 4', 4, 4),
('Part 5', 5, 5)
ON CONFLICT (name) DO NOTHING;
