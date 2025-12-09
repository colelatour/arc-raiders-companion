-- ARC Raiders Companion Database Schema
-- PostgreSQL compatible SQL script
-- Created: 2025-12-09

-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- RAIDER PROFILES (Multiple profiles per user)
-- ============================================================

CREATE TABLE raider_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raider_name VARCHAR(100) NOT NULL,
    expedition_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, raider_name)
);

CREATE INDEX idx_raider_profiles_user_id ON raider_profiles(user_id);

-- ============================================================
-- GAME DATA - QUESTS
-- ============================================================

CREATE TABLE quests (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    locations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quest_objectives (
    id SERIAL PRIMARY KEY,
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    objective_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    UNIQUE(quest_id, order_index)
);

CREATE TABLE quest_rewards (
    id SERIAL PRIMARY KEY,
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    reward_text VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL
);

-- User's completed quests
CREATE TABLE raider_completed_quests (
    id SERIAL PRIMARY KEY,
    raider_profile_id INTEGER NOT NULL REFERENCES raider_profiles(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(raider_profile_id, quest_id)
);

CREATE INDEX idx_raider_completed_quests_profile ON raider_completed_quests(raider_profile_id);

-- ============================================================
-- GAME DATA - BLUEPRINTS
-- ============================================================

CREATE TABLE blueprints (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    workshop VARCHAR(100) NOT NULL,
    recipe TEXT,
    is_lootable BOOLEAN DEFAULT FALSE,
    is_harvester_event BOOLEAN DEFAULT FALSE,
    is_quest_reward BOOLEAN DEFAULT FALSE,
    is_trails_reward BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blueprints_workshop ON blueprints(workshop);

-- User's owned blueprints
CREATE TABLE raider_owned_blueprints (
    id SERIAL PRIMARY KEY,
    raider_profile_id INTEGER NOT NULL REFERENCES raider_profiles(id) ON DELETE CASCADE,
    blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(raider_profile_id, blueprint_id)
);

CREATE INDEX idx_raider_owned_blueprints_profile ON raider_owned_blueprints(raider_profile_id);

-- ============================================================
-- GAME DATA - CRAFTING ITEMS
-- ============================================================

CREATE TABLE crafting_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(50),
    needed_for VARCHAR(255) NOT NULL,
    location TEXT,
    alternative_source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crafting_items_needed_for ON crafting_items(needed_for);

-- ============================================================
-- GAME DATA - SAFE ITEMS (Recycle/Sell)
-- ============================================================

CREATE TABLE safe_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(20) CHECK (category IN ('Recycle', 'Sell', 'KeepUntilDone')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safe_items_category ON safe_items(category);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raider_profiles_updated_at 
    BEFORE UPDATE ON raider_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE QUERIES
-- ============================================================

-- Get all raider profiles for a user
-- SELECT * FROM raider_profiles WHERE user_id = 1 AND is_active = TRUE;

-- Get quest completion status for a raider
-- SELECT q.id, q.name, rcq.completed_at IS NOT NULL as is_completed
-- FROM quests q
-- LEFT JOIN raider_completed_quests rcq 
--   ON q.id = rcq.quest_id AND rcq.raider_profile_id = 1
-- ORDER BY q.id;

-- Get blueprint ownership status for a raider
-- SELECT b.id, b.name, b.workshop, rob.acquired_at IS NOT NULL as is_owned
-- FROM blueprints b
-- LEFT JOIN raider_owned_blueprints rob 
--   ON b.id = rob.blueprint_id AND rob.raider_profile_id = 1
-- ORDER BY b.workshop, b.name;

-- Get raider stats
-- SELECT 
--   rp.raider_name,
--   rp.expedition_level,
--   COUNT(DISTINCT rcq.quest_id) as quests_completed,
--   COUNT(DISTINCT rob.blueprint_id) as blueprints_owned
-- FROM raider_profiles rp
-- LEFT JOIN raider_completed_quests rcq ON rp.id = rcq.raider_profile_id
-- LEFT JOIN raider_owned_blueprints rob ON rp.id = rob.raider_profile_id
-- WHERE rp.id = 1
-- GROUP BY rp.id, rp.raider_name, rp.expedition_level;

-- ============================================================
-- DATA INSERTS - QUESTS
-- ============================================================

INSERT INTO quests (id, name, locations) VALUES
(1, 'Picking Up The Pieces', 'Hydroponic Dome, Dam'),
(2, 'Clearer Skies', 'Dam Battlegrounds'),
(3, 'Trash Into Treasure', 'Research Building, Dam'),
(4, 'Off The Radar', 'Field Depot (Any)'),
(5, 'A Bad Feeling', 'Any Map'),
(6, 'The Right Tool', 'Any Map'),
(7, 'Hatch Repairs', 'Raider Hatch (Any)'),
(8, 'Safe Passage', 'Research & Admin, Dam'),
(9, 'Down To Earth', 'Field Depot (Any)'),
(10, 'The Trifecta', 'Testing Annex, Dam'),
(11, 'A Better Use', 'Supply Call Station (Any)'),
(12, 'What Goes Around', 'Research & Admin, Dam'),
(13, 'Sparks Fly', 'Any Map'),
(14, 'Greasing Her Palms', 'Various'),
(15, 'A First Foothold', 'Ridgeline, Blue Gate'),
(16, 'Dormant Barons', 'South Swamp Outpost'),
(17, 'Mixed Signals', 'Any Map'),
(18, 'What We Left Behind', 'Various'),
(19, 'Doctor''s Orders', 'Pharmacy, Buried City'),
(20, 'Medical Merchandise', 'Various'),
(21, 'A Reveal in Ruins', 'Pharmacy, Buried City'),
(22, 'Broken Monument', 'Scrapyard, Dam'),
(23, 'Marked for Death', 'Buried City'),
(24, 'Straight Record', 'Victory Ridge, Dam'),
(25, 'A Lay of the Land', 'Jiangsu Warehouse, Spaceport'),
(26, 'Market Correction', 'Marano Station, Buried City'),
(27, 'Keeping the Memory', 'Formical Hills, Dam'),
(28, 'Reduced to Rubble', 'Highway Collapse, Blue Gate'),
(29, 'With a Trace', 'Barren Clearing, Blue Gate'),
(30, 'Eyes on the Prize', 'Old Town, Buried City'),
(31, 'Battle Plans', 'Victory Ridge, Dam'),
(32, 'Industrial Espionage', 'Industrial Zone, Buried City'),
(33, 'Unexpected Initiative', 'Industrial, Buried City'),
(34, 'A Symbol of Unification', 'Formicai Outpost, Dam'),
(35, 'Celeste''s Journals', 'South Swamp, Dam'),
(36, 'Back on Top', 'Various'),
(37, 'The Major''s Footlocker', 'Ruby Residences, Dam'),
(38, 'Out of the Shadows', 'Testing Annex, Dam'),
(39, 'Eyes in the Sky', 'Various'),
(40, 'Our Presence Up There', 'Pattern House, Dam'),
(41, 'Communication Hideout', 'Old Town, Buried City'),
(42, 'After Rain Comes', 'Grandioso Apts, Buried City'),
(43, 'A Balanced Harvest', 'Research Building, Dam'),
(44, 'Untended Garden', 'Hydroponic Dome, Dam'),
(45, 'The Root of the Matter', 'Research Building, Buried City'),
(46, 'Water Troubles', 'Red Lake Berm, Dam'),
(47, 'Into the Fray', 'Research Building, Dam'),
(48, 'Source of Contamination', 'Water Treatment, Dam'),
(49, 'Switching the Supply', 'Launch Towers, Spaceport'),
(50, 'A Warm Place to Rest', 'Abandoned Highway, Buried City'),
(51, 'Prescriptions of the Past', 'Departure Bldg, Spaceport'),
(52, 'Power Out', 'Electrical Substation, Spaceport'),
(53, 'Flickering Threat', 'North Complex Elevator, Dam'),
(54, 'Bees!', 'Olive Grove, Blue Gate'),
(55, 'Espresso', 'Plaza Rosa, Buried City'),
(56, 'Life of a Pharmacist', 'Pharmacy, Buried City'),
(57, 'Tribute to Toledo', 'Various'),
(58, 'Digging Up Dirt', 'Old Town, Buried City'),
(59, 'Turnabout', 'North Trench Tower, Spaceport'),
(60, 'Building a Library', 'Library, Buried City'),
(61, 'A New Type of Plant', 'Baron Husk, Dam'),
(62, 'Armored Transports', 'Headhouse, Blue Gate'),
(63, 'Lost in Transmission', 'Control Tower A6, Spaceport');

-- Quest Objectives (sample - showing pattern, full data would follow)
INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES
(1, 'Visit any area with a loot category icon', 0),
(1, 'Loot 3 containers', 1),
(2, 'Destroy 3 ARC enemies', 0),
(2, 'Get 3 ARC Alloy for Shani', 1),
(3, 'Obtain 6 Wires', 0),
(3, 'Obtain 1 Battery', 1),
(4, 'In one round: Visit a field depot', 0),
(4, 'Repair antenna on roof', 1),
(5, 'Find and search any ARC Probe or ARC Courier', 0),
(6, 'Destroy a Fireball', 0),
(6, 'Destroy a Hornet', 1),
(6, 'Destroy a Turret', 2),
(7, 'Repair leaking hydraulic pipes near Raider Hatch', 0),
(7, 'Search for hatch key near hatch', 1),
(8, 'Destroy 2 ARC enemies using explosive grenade', 0),
(9, 'In one round: Visit Field Depot', 0),
(9, 'Deliver Field Crate to Supply Station', 1),
(9, 'Collect reward', 2),
(10, 'Destroy Hornet', 0),
(10, 'Get Hornet Driver', 1),
(10, 'Destroy Snitch', 2),
(10, 'Get Snitch Scanner', 3),
(10, 'Destroy Wasp', 4),
(10, 'Get Wasp Driver', 5);

-- Quest Rewards
INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES
(1, '1x Rattler III', 0),
(1, '80x Medium Ammo', 1),
(2, '3x Sterilized Bandage', 0),
(2, '1x Light Shield', 1),
(2, 'Black Backpack Cosmetic', 2),
(3, '1x Tactical MK.1', 0),
(3, '3x Adrenaline Shot', 1),
(4, '2x Defibrillator', 0),
(5, '10x Metal Parts', 0),
(5, '5x Steel Spring', 1),
(5, '5x Duct Tape', 2),
(6, 'Cheer Emote', 0),
(6, '1x Stitcher II', 1),
(6, '1x Ext. Light Mag I', 2),
(7, '1x Raider Hatch Key', 0),
(7, '1x Binoculars', 1),
(8, '5x Li''l Smoke Grenade', 0),
(8, '3x Shrapnel Grenade', 1),
(8, '3x Barricade Kit', 2),
(9, '1x Combat MK.1', 0),
(9, '1x Medium Shield', 1),
(10, '1x Dam Control Tower Key', 0),
(10, '2x Defibrillator', 1),
(10, '1x Raider Hatch Key', 2);

-- ============================================================
-- DATA INSERTS - BLUEPRINTS
-- ============================================================

INSERT INTO blueprints (name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward) VALUES
('Anvil', 'Gunsmith 2', '5x Mech Comp, 5x Simple Gun Parts', TRUE, FALSE, FALSE, TRUE),
('Anvil Splitter', 'Gunsmith 3', NULL, TRUE, FALSE, FALSE, FALSE),
('Angled Grip II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', TRUE, FALSE, FALSE, FALSE),
('Barricade Kit', 'Utility Station 2', '1x Mech Comp', TRUE, FALSE, FALSE, FALSE),
('Bettina', 'Gunsmith 3', '3x Adv Mech Comp, 3x Heavy Gun Parts, 3x Canister', TRUE, FALSE, FALSE, FALSE),
('Blaze Grenade', 'Explosives Station 3', '1x Expl Compound, 2x Oil', TRUE, FALSE, FALSE, TRUE),
('Bobcat', 'Gunsmith 3', NULL, TRUE, FALSE, FALSE, FALSE),
('Burletta', 'Gunsmith 1', '3x Mech Comp, 3x Simple Gun Parts', FALSE, FALSE, TRUE, FALSE),
('Combat Mk. 3 (AGGRESSIVE)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', TRUE, FALSE, FALSE, FALSE),
('Compensator II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', TRUE, FALSE, FALSE, FALSE),
('Complex Gun Parts', 'Refiner 3', '1x Light/Medium/Heavy Gun Parts', TRUE, FALSE, FALSE, FALSE),
('Defibrillator', 'Medical Lab 2', '9x Plastic Parts, 1x Moss', TRUE, FALSE, FALSE, FALSE),
('Explosive Mine', 'Explosives Station 3', '1x Expl Compound, 1x Sensors', TRUE, FALSE, FALSE, FALSE),
('Extended Light Magazine II', 'Gunsmith 2', '2x Mech Comp, 3x Steel Spring', TRUE, FALSE, FALSE, FALSE),
('Equalizer', 'Gunsmith 3', '3x Mag Accel, 3x Complex GP, 1x Queen Reactor', FALSE, TRUE, FALSE, FALSE),
('Heavy Gun Parts', 'Refiner 2', '4x Simple Gun Parts', TRUE, FALSE, FALSE, FALSE),
('Horizontal Grip', 'Gunsmith 3', '2x Mod Comp, 5x Duct Tape', TRUE, FALSE, FALSE, TRUE),
('Hullcracker', 'Gunsmith 3', '1x Mag Accel, 3x Heavy GP, 1x Exodus Mod', FALSE, FALSE, TRUE, FALSE),
('Il Toro', 'Gunsmith 1', '5x Mech Comp, 6x Simple GP', TRUE, FALSE, FALSE, FALSE),
('Jolt Mine', 'Explosives Station 2', '1x Elec Comp, 1x Battery', TRUE, FALSE, FALSE, FALSE),
('Jupiter', 'Gunsmith 3', '3x Mag Accel, 3x Complex GP, 1x Queen Reactor', FALSE, TRUE, FALSE, FALSE),
('Launcher Ammo', 'Workbench 1', '5x Metal Parts, 1x Crude Explosives', FALSE, FALSE, TRUE, FALSE),
('Light Gun Parts', 'Refiner 2', '4x Simple Gun Parts', TRUE, FALSE, FALSE, FALSE),
('Light Stick (Any)', 'Utility Station 1', '3x Chemicals', TRUE, FALSE, FALSE, FALSE),
('Looting Mk. 3 (SURVIVOR)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', TRUE, FALSE, FALSE, FALSE),
('Lure Grenade', 'Utility Station 2', '1x Speaker Comp, 1x Elec Comp', FALSE, FALSE, TRUE, FALSE),
('Muzzle Brake II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', TRUE, FALSE, FALSE, FALSE),
('Osprey', 'Gunsmith 3', '2x Adv Mech Comp, 3x Medium GP, 7x Wires', TRUE, FALSE, FALSE, FALSE),
('Padded Stock', 'Gunsmith 3', '2x Mod Comp, 5x Duct Tape', TRUE, FALSE, FALSE, FALSE),
('Remote Raider Flare', 'Utility Station 1', '2x Chemicals, 4x Rubber Parts', TRUE, FALSE, FALSE, TRUE),
('Shotgun Choke II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', TRUE, FALSE, FALSE, FALSE),
('Smoke Grenade', 'Utility Station 2', '14x Chemicals, 1x Canister', TRUE, FALSE, FALSE, FALSE),
('Stable Stock II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', TRUE, FALSE, FALSE, FALSE),
('Tactical Mk. 3 (DEFENSE/HEAL)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', TRUE, FALSE, FALSE, FALSE),
('Tagging Grenade', 'Utility Station 3', '1x Elec Comp, 1x Sensors', TRUE, FALSE, FALSE, FALSE),
('Torrente', 'Gunsmith 3', '2x Adv Mech Comp, 3x Medium GP, 6x Steel Spring', TRUE, FALSE, FALSE, FALSE),
('Trigger ''Nade', 'Explosives Station 2', '2x Crude Explosives, 1x Processor', TRUE, FALSE, TRUE, FALSE),
('Venator', 'Gunsmith 2', '2x Adv Mech Comp, 3x Medium GP, 5x Magnet', TRUE, FALSE, FALSE, FALSE),
('Vertical Grip II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', TRUE, FALSE, FALSE, FALSE),
('Vita Shot', 'Medical Lab 3', '2x Antiseptic, 1x Syringe', TRUE, FALSE, FALSE, FALSE),
('Vita Spray', 'Medical Lab 3', '3x Antiseptic, 1x Canister', TRUE, FALSE, FALSE, FALSE),
('Vulcano', 'Gunsmith 3', '1x Mag Accel, 3x Heavy GP, 1x Exodus Mod', TRUE, FALSE, FALSE, FALSE),
('Wolfpack', 'Explosives Station 3', '2x Expl Compound, 2x Sensors', TRUE, FALSE, FALSE, FALSE);

-- ============================================================
-- DATA INSERTS - CRAFTING ITEMS
-- ============================================================

INSERT INTO crafting_items (item_name, quantity, needed_for, location, alternative_source) VALUES
('Dog Collar', '1', 'Scrappy 2', 'Residential', NULL),
('Lemons', '3', 'Scrappy 3', 'Nature', NULL),
('Apricots', '3', 'Scrappy 3', 'Nature', NULL),
('Prickly Pears', '6', 'Scrappy 4', 'Nature', NULL),
('Olives', '6', 'Scrappy 4', 'Nature', NULL),
('Cat Bed', '1', 'Scrappy 4', 'Residential/Commercial', NULL),
('Mushrooms', '12', 'Scrappy 5', 'Nature', NULL),
('Apricots', '12', 'Scrappy 5', 'Nature', NULL),
('Very Comfortable Pillow', '3', 'Scrappy 5', 'Residential/Commercial', NULL),
('Metal Parts', '20', 'Gunsmith 1', 'Basic Material', NULL),
('Rubber Parts', '30', 'Gunsmith 1', 'Basic Material', NULL),
('Rusted Tools', '3', 'Gunsmith 2', 'Mechanical', NULL),
('Mechanical Components', '5', 'Gunsmith 2', 'Mechanical/Refiner', NULL),
('Wasp Driver', '8', 'Gunsmith 2', 'Drones', NULL),
('Rusted Gear', '3', 'Gunsmith 3', 'Industrial', NULL),
('Adv. Mechanical Components', '5', 'Gunsmith 3', 'Mechanical/Refiner', NULL),
('Sentinel Firing Core', '4', 'Gunsmith 3', 'Drones', NULL),
('Plastic Parts', '25', 'Gear Bench 1', 'Basic Material', NULL),
('Fabric', '30', 'Gear Bench 1', 'Basic Material', NULL),
('Power Cable', '3', 'Gear Bench 2', 'Electrical/Resid./Comm.', NULL),
('Electrical Components', '5', 'Gear Bench 2', 'Electrical/Refiner', NULL),
('Wasp Driver', '5', 'Gear Bench 2', 'Drones', NULL),
('Industrial Battery', '3', 'Gear Bench 3', 'Industrial', NULL),
('Adv. Electrical Components', '5', 'Gear Bench 3', 'Electrical/Refiner', NULL),
('Bastion Cell', '6', 'Gear Bench 3', 'Drones', NULL),
('Fabric', '50', 'Medical Lab 1', 'Basic Material', NULL),
('ARC Alloy', '6', 'Medical Lab 1', 'Drones', NULL),
('Cracked Bioscanner', '2', 'Medical Lab 2', 'Medical', NULL),
('Durable Cloth', '5', 'Medical Lab 2', 'Medical/Commercial', NULL),
('Tick Pod', '8', 'Medical Lab 2', 'Drones', NULL),
('Rusted Shut Medical Kit', '3', 'Medical Lab 3', 'Medical', NULL),
('Antiseptic', '8', 'Medical Lab 3', 'Medical', NULL),
('Surveyor Vault', '5', 'Medical Lab 3', 'Drones', NULL),
('Rubber Parts', '50', 'Explosives Bench 1', 'Basic Material', NULL),
('ARC Alloy', '6', 'Explosives Bench 1', 'Drones', NULL),
('Synthesized Fuel', '3', 'Explosives Bench 2', 'Exodus/Celeste', NULL),
('Crude Explosives', '5', 'Explosives Bench 2', 'Industrial/Security/Refiner', NULL),
('Pop Trigger', '5', 'Explosives Bench 2', 'Drones', NULL),
('Laboratory Reagents', '3', 'Explosives Bench 3', 'Medical', NULL),
('Explosive Compound', '5', 'Explosives Bench 3', 'Industrial/Security/Refiner', NULL),
('Rocketeer Driver', '3', 'Explosives Bench 3', 'Drones', NULL),
('Plastic Parts', '50', 'Utility Station 1', 'Basic Material', NULL),
('ARC Alloy', '6', 'Utility Station 1', 'Drones', NULL),
('Damaged Heat Sink', '2', 'Utility Station 2', 'Technological', NULL),
('Electrical Components', '5', 'Utility Station 2', 'Electrical/Refiner', NULL),
('Snitch Scanner', '6', 'Utility Station 2', 'Drones', NULL),
('Fried Motherboard', '3', 'Utility Station 3', 'Technological', NULL),
('Adv. Electrical Components', '5', 'Utility Station 3', 'Electrical/Refiner', NULL),
('Leaper Pulse Unit', '4', 'Utility Station 3', 'Drones', NULL),
('Metal Parts', '60', 'Refiner 1', 'Basic Material', NULL),
('ARC Powercell', '5', 'Refiner 1', 'Drones', NULL),
('Toaster', '3', 'Refiner 2', 'Residential', NULL),
('ARC Motion Core', '5', 'Refiner 2', 'Drones (Probes)', NULL),
('Fireball Burner', '8', 'Refiner 2', 'Drones', NULL),
('Motor', '3', 'Refiner 3', 'Mechanical', NULL),
('ARC Circuitry', '10', 'Refiner 3', 'Drones (Probes)', NULL),
('Bombardier Cell', '6', 'Refiner 3', 'Drones', NULL),
('ARC Alloy', '3', 'Clearer Skies', 'Drones', NULL),
('Wires', '6', 'Trash Into Treasure', 'Electrical/Tech/Celeste', NULL),
('Battery', '1', 'Trash Into Treasure', 'Tech/Electrical/Celeste', NULL),
('Snitch Scanner', '2', 'The Trifecta', 'Drones', NULL),
('Wasp Driver', '2', 'The Trifecta', 'Drones', NULL),
('Hornet Driver', '2', 'The Trifecta', 'Drones', NULL),
('Surveyor Vault', '1', 'Mixed Signals', 'Drones', NULL),
('Water Pump', '1', 'Unexpected Initiative', 'Mechanical/Industrial', NULL),
('Rocketeer Driver', '1', 'Out of the Shadows', 'Drones', NULL),
('Antiseptic', '2', 'Doctor''s Orders', 'Medical', NULL),
('Syringe', '1', 'Doctor''s Orders', 'Medical/Celeste', NULL),
('Durable Cloth', '1', 'Doctor''s Orders', 'Medical/Comm', NULL),
('Great Mullein', '1', 'Doctor''s Orders', 'Nature/Celeste', NULL),
('ESR Analyzer', '1', 'A Reveal in Ruins', 'Plaza Rosa Pharmacy', NULL),
('Metal Parts', '150', 'Part 1', 'Basic Materials', NULL),
('Rubber Parts', '200', 'Part 1', 'Basic Materials', NULL),
('ARC Alloy', '80', 'Part 1', 'Drones', NULL),
('Steel Spring', '15', 'Part 1', 'Mechanical/Celeste', NULL),
('Durable Cloth', '35', 'Part 2', 'Medical/Commercial', NULL),
('Wires', '30', 'Part 2', 'Electrical/Tech/Celeste', NULL),
('Electrical Components', '30', 'Part 2', 'Electrical/Refiner', NULL),
('Cooling Fans', '5', 'Part 2', 'Technological', NULL),
('Light Bulb', '5', 'Part 3', 'Electrical', NULL),
('Battery', '30', 'Part 3', 'Tech/Electrical/Celeste', NULL),
('Sensors', '20', 'Part 3', 'Security/Tech/Celeste', NULL),
('Exodus Modules', '1', 'Part 3', 'Exodus/Celeste', NULL),
('Humidifier', '5', 'Part 4', 'Residential', NULL),
('Adv. Electrical Components', '5', 'Part 4', 'Electrical/Refiner', NULL),
('Magnetic Accelerator', '3', 'Part 4', 'Exodus', NULL),
('Leaper Pulse Unit', '3', 'Part 4', 'Drones', NULL),
('Combat Items', '250k Value', 'Part 5', 'Turn in items', NULL),
('Survival Items', '100k Value', 'Part 5', 'Turn in items', NULL),
('Provisions', '180k Value', 'Part 5', 'Turn in items', NULL),
('Materials', '300k Value', 'Part 5', 'Turn in items', NULL);

-- ============================================================
-- DATA INSERTS - SAFE ITEMS
-- ============================================================

INSERT INTO safe_items (item_name, category, description) VALUES
('Alarm Clock', 'Recycle', NULL),
('ARC Coolant', 'Recycle', NULL),
('ARC Flex Rubber', 'Recycle', NULL),
('ARC Performance Steel', 'Recycle', NULL),
('ARC Synthetic Resin', 'Recycle', NULL),
('ARC Thermo Lining', 'Recycle', NULL),
('Bicycle Pump', 'Recycle', NULL),
('Broken Flashlight', 'Recycle', NULL),
('Broken Guidance System', 'Recycle', NULL),
('Broken Handheld Radio', 'Recycle', NULL),
('Broken Taser', 'Recycle', NULL),
('Burned ARC Circuitry', 'Recycle', NULL),
('Burned Tick Pod', 'Recycle', NULL),
('Candle Holder', 'Recycle', NULL),
('Coolant', 'Recycle', NULL),
('Cooling Coil', 'Recycle', NULL),
('Crumpled Plastic Bottle', 'Recycle', NULL),
('Damaged ARC Motion Core', 'Recycle', NULL),
('Damaged ARC Powercell', 'Recycle', NULL),
('Damaged Fireball Burner', 'Recycle', NULL),
('Damaged Hornet Driver', 'Recycle', NULL),
('Damaged Rocketeer Driver', 'Recycle', NULL),
('Damaged Snitch Scanner', 'Recycle', NULL),
('Damaged Wasp Driver', 'Recycle', NULL),
('Deflated Football', 'Recycle', NULL),
('Degraded ARC Rubber', 'Recycle', NULL),
('Diving Goggles', 'Recycle', NULL),
('Dried-Out ARC Resin', 'Recycle', NULL),
('Expired Respirator', 'Recycle', NULL),
('Frying Pan', 'Recycle', NULL),
('Garlic Press', 'Recycle', NULL),
('Household Cleaner', 'Recycle', NULL),
('Ice Cream Scooper', 'Recycle', NULL),
('Impure ARC Coolant', 'Recycle', NULL),
('Industrial Charger', 'Recycle', NULL),
('Industrial Magnet', 'Recycle', NULL),
('Metal Brackets', 'Recycle', NULL),
('Number Plate', 'Recycle', NULL),
('Polluted Air Filter', 'Recycle', NULL),
('Power Bank', 'Recycle', NULL),
('Radio', 'Recycle', NULL),
('Remote Control', 'Recycle', NULL),
('Ripped Safety Vest', 'Recycle', NULL),
('Rocket Thruster', 'Recycle', NULL),
('Rubber Pad', 'Recycle', NULL),
('Ruined Accordion', 'Recycle', NULL),
('Ruined Augment', 'Recycle', NULL),
('Ruined Baton', 'Recycle', NULL),
('Ruined Handcuffs', 'Recycle', NULL),
('Ruined Parachute', 'Recycle', NULL),
('Ruined Tactical Vest', 'Recycle', NULL),
('Ruined Riot Shield', 'Recycle', NULL),
('Rusted Bolts', 'Recycle', NULL),
('Rusty ARC Steel', 'Recycle', NULL),
('Spring Cushion', 'Recycle', NULL),
('Spotter Relay', 'Recycle', NULL),
('Tattered ARC Lining', 'Recycle', NULL),
('Tattered Clothes', 'Recycle', NULL),
('Thermostat', 'Recycle', NULL),
('Torn Blanket', 'Recycle', NULL),
('Turbo Pump', 'Recycle', NULL),
('Unusable Weapon', 'Recycle', NULL),
('Water Filter', 'Recycle', NULL),
('Bloated Tuna Can', 'Sell', NULL),
('Blown Fuses', 'Sell', NULL),
('Breathtaking Snow Globe', 'Sell', NULL),
('Coffee Pot', 'Sell', NULL),
('Dart Board', 'Sell', NULL),
('Expired Pasta', 'Sell', NULL),
('Fine Wristwatch', 'Sell', NULL),
('Lance''s Mixtape (5th Edition)', 'Sell', NULL),
('Music Album', 'Sell', NULL),
('Music Box', 'Sell', NULL),
('Painted Box', 'Sell', NULL),
('Playing Cards', 'Sell', NULL),
('Poster of Natural Wonders', 'Sell', NULL),
('Pottery', 'Sell', NULL),
('Red Coral Jewelry', 'Sell', NULL),
('Rosary', 'Sell', NULL),
('Silver Teaspoon Set', 'Sell', NULL),
('Statuette', 'Sell', NULL),
('Torn Book', 'Sell', NULL),
('Vase', 'Sell', NULL),
('Volcanic Rock', 'Sell', NULL);

-- ============================================================
-- NOTES
-- ============================================================

-- Password Hashing: Use bcrypt or Argon2 in your application layer
-- Example (Node.js with bcrypt):
--   const bcrypt = require('bcrypt');
--   const hashedPassword = await bcrypt.hash(plainPassword, 10);
--   const isValid = await bcrypt.compare(plainPassword, hashedPassword);

-- Session Management: Consider adding a sessions table for JWT/session tokens
-- CREATE TABLE user_sessions (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     token VARCHAR(255) UNIQUE NOT NULL,
--     expires_at TIMESTAMP NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
