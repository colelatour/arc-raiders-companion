-- ARC Raiders Companion Database Schema with Data
-- Generated: 2025-12-10T21:44:29.837Z
-- PostgreSQL Database Schema and Data Dump
-- Updated: Added email verification fields

-- Drop existing tables if they exist
DROP TABLE IF EXISTS favorite_raiders CASCADE;
DROP TABLE IF EXISTS raider_completed_expedition_items CASCADE;
DROP TABLE IF EXISTS raider_completed_expedition_parts CASCADE;
DROP TABLE IF EXISTS expedition_requirements CASCADE;
DROP TABLE IF EXISTS raider_completed_workbenches CASCADE;
DROP TABLE IF EXISTS raider_owned_blueprints CASCADE;
DROP TABLE IF EXISTS raider_completed_quests CASCADE;
DROP TABLE IF EXISTS raider_profiles CASCADE;
DROP TABLE IF EXISTS quest_rewards CASCADE;
DROP TABLE IF EXISTS quest_objectives CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS expedition_parts CASCADE;
DROP TABLE IF EXISTS workbenches CASCADE;
DROP TABLE IF EXISTS crafting_items CASCADE;
DROP TABLE IF EXISTS safe_items CASCADE;
DROP TABLE IF EXISTS blueprints CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- Table: users
CREATE TABLE users (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user'::character varying,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  UNIQUE (email),
  UNIQUE (username)
);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_username ON public.users USING btree (username);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX idx_users_verification_token ON public.users USING btree (verification_token);

-- Default Admin User
-- Email: admin@arcraiders.com
-- Username: admin
-- Password: admin123
-- ⚠️  IMPORTANT: Change this password after first login!
-- Note: Admin user is pre-verified (email_verified = TRUE)
INSERT INTO users (id, email, username, password_hash, role, created_at, updated_at, is_active, email_verified) VALUES (1, 'admin@arcraiders.com', 'admin', '$2b$10$z01AERBMPtKFZfFlny5AJelUd2WJ/5fLSy0Mz6hYp3wcyz9Lhr502', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE, TRUE);

-- Create default raider profile for admin user
INSERT INTO raider_profiles (id, user_id, raider_name, expedition_level, created_at, updated_at, is_active) VALUES (1, 1, 'admin', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE);

-- Table: blueprints
CREATE TABLE blueprints (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  workshop VARCHAR(100) NOT NULL,
  recipe TEXT,
  is_lootable BOOLEAN DEFAULT false,
  is_harvester_event BOOLEAN DEFAULT false,
  is_quest_reward BOOLEAN DEFAULT false,
  is_trails_reward BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);
CREATE UNIQUE INDEX blueprints_name_key ON public.blueprints USING btree (name);
CREATE INDEX idx_blueprints_workshop ON public.blueprints USING btree (workshop);

-- Data for blueprints
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (1, 'Anvil', 'Gunsmith 2', '5x Mech Comp, 5x Simple Gun Parts', TRUE, FALSE, FALSE, TRUE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (2, 'Anvil Splitter', 'Gunsmith 3', NULL, TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (3, 'Angled Grip II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (4, 'Barricade Kit', 'Utility Station 2', '1x Mech Comp', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (5, 'Bettina', 'Gunsmith 3', '3x Adv Mech Comp, 3x Heavy Gun Parts, 3x Canister', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (6, 'Blaze Grenade', 'Explosives Station 3', '1x Expl Compound, 2x Oil', TRUE, FALSE, FALSE, TRUE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (7, 'Bobcat', 'Gunsmith 3', NULL, TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (8, 'Burletta', 'Gunsmith 1', '3x Mech Comp, 3x Simple Gun Parts', FALSE, FALSE, TRUE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (9, 'Combat Mk. 3 (AGGRESSIVE)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (10, 'Compensator II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (11, 'Complex Gun Parts', 'Refiner 3', '1x Light/Medium/Heavy Gun Parts', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (12, 'Defibrillator', 'Medical Lab 2', '9x Plastic Parts, 1x Moss', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (13, 'Explosive Mine', 'Explosives Station 3', '1x Expl Compound, 1x Sensors', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (14, 'Extended Light Magazine II', 'Gunsmith 2', '2x Mech Comp, 3x Steel Spring', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (15, 'Equalizer', 'Gunsmith 3', '3x Mag Accel, 3x Complex GP, 1x Queen Reactor', FALSE, TRUE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (16, 'Heavy Gun Parts', 'Refiner 2', '4x Simple Gun Parts', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (17, 'Horizontal Grip', 'Gunsmith 3', '2x Mod Comp, 5x Duct Tape', TRUE, FALSE, FALSE, TRUE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (18, 'Hullcracker', 'Gunsmith 3', '1x Mag Accel, 3x Heavy GP, 1x Exodus Mod', FALSE, FALSE, TRUE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (19, 'Il Toro', 'Gunsmith 1', '5x Mech Comp, 6x Simple GP', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (20, 'Jolt Mine', 'Explosives Station 2', '1x Elec Comp, 1x Battery', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (21, 'Jupiter', 'Gunsmith 3', '3x Mag Accel, 3x Complex GP, 1x Queen Reactor', FALSE, TRUE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (22, 'Launcher Ammo', 'Workbench 1', '5x Metal Parts, 1x Crude Explosives', FALSE, FALSE, TRUE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (23, 'Light Gun Parts', 'Refiner 2', '4x Simple Gun Parts', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (24, 'Light Stick (Any)', 'Utility Station 1', '3x Chemicals', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (25, 'Looting Mk. 3 (SURVIVOR)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (26, 'Lure Grenade', 'Utility Station 2', '1x Speaker Comp, 1x Elec Comp', FALSE, FALSE, TRUE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (27, 'Muzzle Brake II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (28, 'Osprey', 'Gunsmith 3', '2x Adv Mech Comp, 3x Medium GP, 7x Wires', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (29, 'Padded Stock', 'Gunsmith 3', '2x Mod Comp, 5x Duct Tape', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (30, 'Remote Raider Flare', 'Utility Station 1', '2x Chemicals, 4x Rubber Parts', TRUE, FALSE, FALSE, TRUE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (31, 'Shotgun Choke II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (32, 'Smoke Grenade', 'Utility Station 2', '14x Chemicals, 1x Canister', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (33, 'Stable Stock II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (34, 'Tactical Mk. 3 (DEFENSE/HEAL)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (35, 'Tagging Grenade', 'Utility Station 3', '1x Elec Comp, 1x Sensors', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (36, 'Torrente', 'Gunsmith 3', '2x Adv Mech Comp, 3x Medium GP, 6x Steel Spring', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (37, 'Trigger ''Nade', 'Explosives Station 2', '2x Crude Explosives, 1x Processor', TRUE, FALSE, TRUE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (38, 'Venator', 'Gunsmith 2', '2x Adv Mech Comp, 3x Medium GP, 5x Magnet', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (39, 'Vertical Grip II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (40, 'Vita Shot', 'Medical Lab 3', '2x Antiseptic, 1x Syringe', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (41, 'Vita Spray', 'Medical Lab 3', '3x Antiseptic, 1x Canister', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (42, 'Vulcano', 'Gunsmith 3', '1x Mag Accel, 3x Heavy GP, 1x Exodus Mod', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');
INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward, created_at) VALUES (43, 'Wolfpack', 'Explosives Station 3', '2x Expl Compound, 2x Sensors', TRUE, FALSE, FALSE, FALSE, '2025-12-09T20:33:25.654Z');


-- Table: safe_items
CREATE TABLE safe_items (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (item_name)
);
CREATE UNIQUE INDEX safe_items_item_name_key ON public.safe_items USING btree (item_name);
CREATE INDEX idx_safe_items_category ON public.safe_items USING btree (category);

-- Data for safe_items
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (1, 'Alarm Clock', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (2, 'ARC Coolant', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (3, 'ARC Flex Rubber', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (4, 'ARC Performance Steel', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (5, 'ARC Synthetic Resin', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (6, 'ARC Thermo Lining', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (7, 'Bicycle Pump', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (8, 'Broken Flashlight', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (9, 'Broken Guidance System', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (10, 'Broken Handheld Radio', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (11, 'Broken Taser', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (12, 'Burned ARC Circuitry', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (13, 'Burned Tick Pod', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (14, 'Candle Holder', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (15, 'Coolant', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (16, 'Cooling Coil', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (17, 'Crumpled Plastic Bottle', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (18, 'Damaged ARC Motion Core', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (19, 'Damaged ARC Powercell', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (20, 'Damaged Fireball Burner', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (21, 'Damaged Hornet Driver', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (22, 'Damaged Rocketeer Driver', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (23, 'Damaged Snitch Scanner', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (24, 'Damaged Wasp Driver', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (25, 'Deflated Football', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (26, 'Degraded ARC Rubber', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (27, 'Diving Goggles', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (28, 'Dried-Out ARC Resin', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (29, 'Expired Respirator', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (30, 'Frying Pan', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (31, 'Garlic Press', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (32, 'Household Cleaner', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (33, 'Ice Cream Scooper', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (34, 'Impure ARC Coolant', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (35, 'Industrial Charger', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (36, 'Industrial Magnet', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (37, 'Metal Brackets', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (38, 'Number Plate', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (39, 'Polluted Air Filter', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (40, 'Power Bank', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (41, 'Radio', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (42, 'Remote Control', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (43, 'Ripped Safety Vest', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (44, 'Rocket Thruster', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (45, 'Rubber Pad', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (46, 'Ruined Accordion', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (47, 'Ruined Augment', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (48, 'Ruined Baton', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (49, 'Ruined Handcuffs', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (50, 'Ruined Parachute', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (51, 'Ruined Tactical Vest', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (52, 'Ruined Riot Shield', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (53, 'Rusted Bolts', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (54, 'Rusty ARC Steel', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (55, 'Spring Cushion', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (56, 'Spotter Relay', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (57, 'Tattered ARC Lining', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (58, 'Tattered Clothes', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (59, 'Thermostat', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (60, 'Torn Blanket', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (61, 'Turbo Pump', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (62, 'Unusable Weapon', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (63, 'Water Filter', 'Recycle', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (64, 'Bloated Tuna Can', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (65, 'Blown Fuses', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (66, 'Breathtaking Snow Globe', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (67, 'Coffee Pot', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (68, 'Dart Board', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (69, 'Expired Pasta', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (70, 'Fine Wristwatch', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (71, 'Lance''s Mixtape (5th Edition)', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (72, 'Music Album', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (73, 'Music Box', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (74, 'Painted Box', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (75, 'Playing Cards', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (76, 'Poster of Natural Wonders', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (77, 'Pottery', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (78, 'Red Coral Jewelry', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (79, 'Rosary', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (80, 'Silver Teaspoon Set', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (81, 'Statuette', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (82, 'Torn Book', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (83, 'Vase', 'Sell', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO safe_items (id, item_name, category, description, created_at) VALUES (84, 'Volcanic Rock', 'Sell', NULL, '2025-12-09T20:33:25.654Z');


-- Table: crafting_items
CREATE TABLE crafting_items (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_name VARCHAR(255) NOT NULL,
  quantity VARCHAR(50),
  needed_for VARCHAR(255) NOT NULL,
  location TEXT,
  alternative_source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_crafting_items_needed_for ON public.crafting_items USING btree (needed_for);

-- Data for crafting_items
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (1, 'Dog Collar', '1', 'Scrappy 2', 'Residential', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (2, 'Lemons', '3', 'Scrappy 3', 'Nature', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (3, 'Apricots', '3', 'Scrappy 3', 'Nature', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (4, 'Prickly Pears', '6', 'Scrappy 4', 'Nature', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (5, 'Olives', '6', 'Scrappy 4', 'Nature', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (6, 'Cat Bed', '1', 'Scrappy 4', 'Residential/Commercial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (7, 'Mushrooms', '12', 'Scrappy 5', 'Nature', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (8, 'Apricots', '12', 'Scrappy 5', 'Nature', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (9, 'Very Comfortable Pillow', '3', 'Scrappy 5', 'Residential/Commercial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (10, 'Metal Parts', '20', 'Gunsmith 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (11, 'Rubber Parts', '30', 'Gunsmith 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (12, 'Rusted Tools', '3', 'Gunsmith 2', 'Mechanical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (13, 'Mechanical Components', '5', 'Gunsmith 2', 'Mechanical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (14, 'Wasp Driver', '8', 'Gunsmith 2', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (15, 'Rusted Gear', '3', 'Gunsmith 3', 'Industrial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (16, 'Adv. Mechanical Components', '5', 'Gunsmith 3', 'Mechanical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (17, 'Sentinel Firing Core', '4', 'Gunsmith 3', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (18, 'Plastic Parts', '25', 'Gear Bench 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (19, 'Fabric', '30', 'Gear Bench 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (20, 'Power Cable', '3', 'Gear Bench 2', 'Electrical/Resid./Comm.', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (21, 'Electrical Components', '5', 'Gear Bench 2', 'Electrical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (22, 'Wasp Driver', '5', 'Gear Bench 2', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (23, 'Industrial Battery', '3', 'Gear Bench 3', 'Industrial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (24, 'Adv. Electrical Components', '5', 'Gear Bench 3', 'Electrical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (25, 'Bastion Cell', '6', 'Gear Bench 3', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (26, 'Fabric', '50', 'Medical Lab 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (27, 'ARC Alloy', '6', 'Medical Lab 1', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (28, 'Cracked Bioscanner', '2', 'Medical Lab 2', 'Medical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (29, 'Durable Cloth', '5', 'Medical Lab 2', 'Medical/Commercial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (30, 'Tick Pod', '8', 'Medical Lab 2', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (31, 'Rusted Shut Medical Kit', '3', 'Medical Lab 3', 'Medical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (32, 'Antiseptic', '8', 'Medical Lab 3', 'Medical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (33, 'Surveyor Vault', '5', 'Medical Lab 3', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (34, 'Rubber Parts', '50', 'Explosives Bench 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (35, 'ARC Alloy', '6', 'Explosives Bench 1', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (36, 'Synthesized Fuel', '3', 'Explosives Bench 2', 'Exodus/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (37, 'Crude Explosives', '5', 'Explosives Bench 2', 'Industrial/Security/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (38, 'Pop Trigger', '5', 'Explosives Bench 2', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (39, 'Laboratory Reagents', '3', 'Explosives Bench 3', 'Medical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (40, 'Explosive Compound', '5', 'Explosives Bench 3', 'Industrial/Security/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (41, 'Rocketeer Driver', '3', 'Explosives Bench 3', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (42, 'Plastic Parts', '50', 'Utility Station 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (43, 'ARC Alloy', '6', 'Utility Station 1', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (44, 'Damaged Heat Sink', '2', 'Utility Station 2', 'Technological', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (45, 'Electrical Components', '5', 'Utility Station 2', 'Electrical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (46, 'Snitch Scanner', '6', 'Utility Station 2', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (47, 'Fried Motherboard', '3', 'Utility Station 3', 'Technological', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (48, 'Adv. Electrical Components', '5', 'Utility Station 3', 'Electrical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (49, 'Leaper Pulse Unit', '4', 'Utility Station 3', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (50, 'Metal Parts', '60', 'Refiner 1', 'Basic Material', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (51, 'ARC Powercell', '5', 'Refiner 1', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (52, 'Toaster', '3', 'Refiner 2', 'Residential', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (53, 'ARC Motion Core', '5', 'Refiner 2', 'Drones (Probes)', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (54, 'Fireball Burner', '8', 'Refiner 2', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (55, 'Motor', '3', 'Refiner 3', 'Mechanical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (56, 'ARC Circuitry', '10', 'Refiner 3', 'Drones (Probes)', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (57, 'Bombardier Cell', '6', 'Refiner 3', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (58, 'ARC Alloy', '3', 'Clearer Skies', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (59, 'Wires', '6', 'Trash Into Treasure', 'Electrical/Tech/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (60, 'Battery', '1', 'Trash Into Treasure', 'Tech/Electrical/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (61, 'Snitch Scanner', '2', 'The Trifecta', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (62, 'Wasp Driver', '2', 'The Trifecta', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (63, 'Hornet Driver', '2', 'The Trifecta', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (64, 'Surveyor Vault', '1', 'Mixed Signals', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (65, 'Water Pump', '1', 'Unexpected Initiative', 'Mechanical/Industrial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (66, 'Rocketeer Driver', '1', 'Out of the Shadows', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (67, 'Antiseptic', '2', 'Doctor''s Orders', 'Medical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (68, 'Syringe', '1', 'Doctor''s Orders', 'Medical/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (69, 'Durable Cloth', '1', 'Doctor''s Orders', 'Medical/Comm', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (70, 'Great Mullein', '1', 'Doctor''s Orders', 'Nature/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (71, 'ESR Analyzer', '1', 'A Reveal in Ruins', 'Plaza Rosa Pharmacy', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (72, 'Metal Parts', '150', 'Part 1', 'Basic Materials', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (73, 'Rubber Parts', '200', 'Part 1', 'Basic Materials', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (74, 'ARC Alloy', '80', 'Part 1', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (75, 'Steel Spring', '15', 'Part 1', 'Mechanical/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (76, 'Durable Cloth', '35', 'Part 2', 'Medical/Commercial', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (77, 'Wires', '30', 'Part 2', 'Electrical/Tech/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (78, 'Electrical Components', '30', 'Part 2', 'Electrical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (79, 'Cooling Fans', '5', 'Part 2', 'Technological', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (80, 'Light Bulb', '5', 'Part 3', 'Electrical', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (81, 'Battery', '30', 'Part 3', 'Tech/Electrical/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (82, 'Sensors', '20', 'Part 3', 'Security/Tech/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (83, 'Exodus Modules', '1', 'Part 3', 'Exodus/Celeste', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (84, 'Humidifier', '5', 'Part 4', 'Residential', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (85, 'Adv. Electrical Components', '5', 'Part 4', 'Electrical/Refiner', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (86, 'Magnetic Accelerator', '3', 'Part 4', 'Exodus', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (87, 'Leaper Pulse Unit', '3', 'Part 4', 'Drones', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (88, 'Combat Items', '250k Value', 'Part 5', 'Turn in items', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (89, 'Survival Items', '100k Value', 'Part 5', 'Turn in items', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (90, 'Provisions', '180k Value', 'Part 5', 'Turn in items', NULL, '2025-12-09T20:33:25.654Z');
INSERT INTO crafting_items (id, item_name, quantity, needed_for, location, alternative_source, created_at) VALUES (91, 'Materials', '300k Value', 'Part 5', 'Turn in items', NULL, '2025-12-09T20:33:25.654Z');


-- Table: workbenches
CREATE TABLE workbenches (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);
CREATE UNIQUE INDEX workbenches_name_key ON public.workbenches USING btree (name);
CREATE INDEX idx_workbenches_category ON public.workbenches USING btree (category);

-- Data for workbenches
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (2, 'Scrappy 2', 'Scrappy', 2, 1, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (3, 'Scrappy 3', 'Scrappy', 3, 1, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (4, 'Scrappy 4', 'Scrappy', 4, 1, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (5, 'Scrappy 5', 'Scrappy', 5, 1, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (6, 'Gunsmith 1', 'Gunsmith', 1, 2, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (7, 'Gunsmith 2', 'Gunsmith', 2, 2, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (8, 'Gunsmith 3', 'Gunsmith', 3, 2, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (16, 'Medical Lab 1', 'Medical Lab', 1, 3, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (17, 'Medical Lab 2', 'Medical Lab', 2, 3, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (18, 'Medical Lab 3', 'Medical Lab', 3, 3, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (21, 'Explosives Bench 1', 'Explosives Bench', 1, 5, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (22, 'Explosives Bench 2', 'Explosives Bench', 2, 5, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (23, 'Explosives Bench 3', 'Explosives Bench', 3, 5, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (26, 'Utility Station 1', 'Utility Station', 1, 4, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (27, 'Utility Station 2', 'Utility Station', 2, 4, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (28, 'Utility Station 3', 'Utility Station', 3, 4, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (31, 'Refiner 1', 'Refiner', 1, 6, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (32, 'Refiner 2', 'Refiner', 2, 6, '2025-12-09T21:51:05.063Z');
INSERT INTO workbenches (id, name, category, level, display_order, created_at) VALUES (33, 'Refiner 3', 'Refiner', 3, 6, '2025-12-09T21:51:05.063Z');


-- Table: expedition_parts
CREATE TABLE expedition_parts (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  part_number INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);
CREATE UNIQUE INDEX expedition_parts_name_key ON public.expedition_parts USING btree (name);
CREATE INDEX idx_expedition_parts_part_number ON public.expedition_parts USING btree (part_number);

-- Data for expedition_parts
INSERT INTO expedition_parts (id, name, part_number, display_order, created_at) VALUES (1, 'Part 1', 1, 1, '2025-12-09T22:15:49.252Z');
INSERT INTO expedition_parts (id, name, part_number, display_order, created_at) VALUES (2, 'Part 2', 2, 2, '2025-12-09T22:15:49.252Z');
INSERT INTO expedition_parts (id, name, part_number, display_order, created_at) VALUES (3, 'Part 3', 3, 3, '2025-12-09T22:15:49.252Z');
INSERT INTO expedition_parts (id, name, part_number, display_order, created_at) VALUES (4, 'Part 4', 4, 4, '2025-12-09T22:15:49.252Z');
INSERT INTO expedition_parts (id, name, part_number, display_order, created_at) VALUES (5, 'Part 5', 5, 5, '2025-12-09T22:15:49.252Z');


-- Table: expedition_requirements
-- Manages expedition requirements per expedition level
CREATE TABLE expedition_requirements (
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

-- Data for expedition_requirements (Expedition 1)
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

-- Data for expedition_requirements (Expedition 2 - same as Expedition 1 for now)
INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order)
SELECT 2, part_number, item_name, quantity, location, display_order
FROM expedition_requirements
WHERE expedition_level = 1;


-- Table: quests
CREATE TABLE quests (
  id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  locations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  url VARCHAR(500),
  PRIMARY KEY (id)
);

-- Data for quests
INSERT INTO quests (id, name, locations, created_at, url) VALUES (1, 'Picking Up The Pieces', 'Hydroponic Dome, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/picking-up-the-pieces-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (2, 'Clearer Skies', 'Dam Battlegrounds', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/clearer-skies-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (3, 'Trash Into Treasure', 'Research Building, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/trash-into-treasure-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (4, 'Off The Radar', 'Field Depot (Any)', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/off-the-radar-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (5, 'A Bad Feeling', 'Any Map', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-bad-feeling-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (6, 'The Right Tool', 'Any Map', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/the-right-tool-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (7, 'Hatch Repairs', 'Raider Hatch (Any)', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/hatch-repairs-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (8, 'Safe Passage', 'Research & Admin, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/safe-passage-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (9, 'Down To Earth', 'Field Depot (Any)', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/down-to-earth-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (10, 'The Trifecta', 'Testing Annex, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/trifecta-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (11, 'A Better Use', 'Supply Call Station (Any)', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/supply-call-stations-locations-a-better-use-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (12, 'What Goes Around', 'Research & Admin, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/arc-raiders-what-goes-around-quest-guide/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (13, 'Sparks Fly', 'Any Map', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/sparks-fly-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (14, 'Greasing Her Palms', 'Various', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/greasing-her-palms-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (15, 'A First Foothold', 'Ridgeline, Blue Gate', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-first-foothold-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (16, 'Dormant Barons', 'South Swamp Outpost', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/dormant-baron-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (17, 'Mixed Signals', 'Any Map', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/mixed-signals-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (18, 'What We Left Behind', 'Various', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/what-we-left-behind-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (19, 'Doctor''s Orders', 'Pharmacy, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/doctors-orders-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (20, 'Medical Merchandise', 'Various', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/medical-merchandise-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (21, 'A Reveal in Ruins', 'Pharmacy, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-reveal-in-ruins-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (22, 'Broken Monument', 'Scrapyard, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/broken-monument-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (23, 'Marked for Death', 'Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/marked-for-death-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (24, 'Straight Record', 'Victory Ridge, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/straight-record-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (25, 'A Lay of the Land', 'Jiangsu Warehouse, Spaceport', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/lay-of-the-land-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (26, 'Market Correction', 'Marano Station, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/market-correction-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (27, 'Keeping the Memory', 'Formical Hills, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/keeping-the-memory-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (28, 'Reduced to Rubble', 'Highway Collapse, Blue Gate', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/reduced-to-rubble-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (29, 'With a Trace', 'Barren Clearing, Blue Gate', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/with-a-trace-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (30, 'Eyes on the Prize', 'Old Town, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/eyes-on-the-prize-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (31, 'Echos of Victory Ridge', 'Victory Ridge, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/echoes-of-victory-ridge-quest-guide-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (32, 'Industrial Espionage', 'Industrial Zone, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/industrial-espionage-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (33, 'Unexpected Initiative', 'Industrial, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/how-to-find-lemons-for-unexpected-initiatives-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (34, 'A Symbol of Unification', 'Formicai Outpost, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-symbol-of-unification-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (35, 'Celeste''s Journals', 'South Swamp, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/celestes-journal-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (36, 'Back on Top', 'Various', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/back-on-top-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (37, 'The Major''s Footlocker', 'Ruby Residences, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/the-majors-footlocker-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (38, 'Out of the Shadows', 'Testing Annex, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/out-of-the-shadows-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (39, 'Eyes in the Sky', 'Various', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/eyes-in-the-sky-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (40, 'Our Presence Up There', 'Pattern House, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/our-presence-up-there-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (41, 'Communication Hideout', 'Old Town, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/communication-hideout-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (42, 'After Rain Comes', 'Grandioso Apts, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/after-rain-comes-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (43, 'A Balanced Harvest', 'Research Building, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-balanced-harvest-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (44, 'Untended Garden', 'Hydroponic Dome, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/untended-garden-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (45, 'The Root of the Matter', 'Research Building, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/the-root-of-the-matter-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (46, 'Water Troubles', 'Red Lake Berm, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/water-troubles-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (47, 'Into the Fray', 'Research Building, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/into-the-fray-quest-in-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (48, 'Source of the Contamination', 'Water Treatment, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/source-of-the-contamination-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (49, 'Switching the Supply', 'Launch Towers, Spaceport', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/switching-the-supply-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (50, 'A Warm Place to Rest', 'Abandoned Highway, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-warm-place-to-rest-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (51, 'Prescriptions of the Past', 'Departure Bldg, Spaceport', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/prescriptions-of-the-past-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (52, 'Power Out', 'Electrical Substation, Spaceport', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/power-out-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (53, 'Flickering Threat', 'North Complex Elevator, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/flickering-threat-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (54, 'Bees!', 'Olive Grove, Blue Gate', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/bees-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (55, 'Espresso', 'Plaza Rosa, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/espresso-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (56, 'Life of a Pharmacist', 'Pharmacy, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/life-of-a-pharmacist-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (57, 'Tribute to Toledo', 'Various', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/tribute-to-toledo-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (58, 'Digging Up Dirt', 'Old Town, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/digging-up-dirt-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (59, 'Turnabout', 'North Trench Tower, Spaceport', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/turnabout-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (60, 'Building a Library', 'Library, Buried City', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/building-a-library-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (61, 'A New Type of Plant', 'Baron Husk, Dam', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/a-new-type-of-plant-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (62, 'Armored Transports', 'Headhouse, Blue Gate', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/armored-transports-quest-guide-arc-raiders/');
INSERT INTO quests (id, name, locations, created_at, url) VALUES (63, 'Lost in Transmission', 'Control Tower A6, Spaceport', '2025-12-09T20:33:25.654Z', 'https://patchcrazy.co.uk/lost-in-transmission-quest-guide-arc-raiders/');


-- Table: quest_objectives
CREATE TABLE quest_objectives (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  quest_id INTEGER NOT NULL,
  objective_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  UNIQUE (quest_id),
  UNIQUE (order_index),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX quest_objectives_quest_id_order_index_key ON public.quest_objectives USING btree (quest_id, order_index);

-- Data for quest_objectives
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (3, 2, 'Destroy 3 ARC enemies', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (4, 2, 'Get 3 ARC Alloy for Shani', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (5, 3, 'Obtain 6 Wires', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (6, 3, 'Obtain 1 Battery', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (7, 4, 'In one round: Visit a field depot', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (8, 4, 'Repair antenna on roof', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (9, 5, 'Find and search any ARC Probe or ARC Courier', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (10, 6, 'Destroy a Fireball', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (11, 6, 'Destroy a Hornet', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (12, 6, 'Destroy a Turret', 2);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (13, 7, 'Repair leaking hydraulic pipes near Raider Hatch', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (14, 7, 'Search for hatch key near hatch', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (15, 8, 'Destroy 2 ARC enemies using explosive grenade', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (16, 9, 'In one round: Visit Field Depot', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (17, 9, 'Deliver Field Crate to Supply Station', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (18, 9, 'Collect reward', 2);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (19, 10, 'Destroy Hornet', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (20, 10, 'Get Hornet Driver', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (21, 10, 'Destroy Snitch', 2);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (22, 10, 'Get Snitch Scanner', 3);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (23, 10, 'Destroy Wasp', 4);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (24, 10, 'Get Wasp Driver', 5);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (27, 1, 'Loot 3 containers', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (28, 1, 'Visit any area with a loot category icon', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (30, 19, 'Obtain 2 Antiseptic', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (31, 19, 'Obtain 1 Syringe', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (32, 19, 'Obtain 1 Durable Cloth', 2);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (33, 19, 'Obtain 1 Great Mullein', 3);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (34, 31, 'Reach Victory Ridge', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (35, 31, 'Retrieve battle plans', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (36, 31, 'Deliver Aiva''s Patch', 2);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (37, 35, 'Retrieve journals from South Swamp', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (38, 35, 'Retrieve journals from northern outpost', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (39, 35, 'Deliver to Celeste', 2);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (40, 37, 'Search for Aiva''s mementos in apartments', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (41, 37, 'Deliver to Tian Wen', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (42, 48, 'Reach Water Treatment', 0);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (43, 48, 'Search Flood Spill Intake', 1);
INSERT INTO quest_objectives (id, quest_id, objective_text, order_index) VALUES (44, 48, 'Investigate suspicious objects', 2);


-- Table: quest_rewards
CREATE TABLE quest_rewards (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  quest_id INTEGER NOT NULL,
  reward_text VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Data for quest_rewards
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (3, 2, '3x Sterilized Bandage', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (4, 2, '1x Light Shield', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (5, 2, 'Black Backpack Cosmetic', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (6, 3, '1x Tactical MK.1', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (7, 3, '3x Adrenaline Shot', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (8, 4, '2x Defibrillator', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (9, 5, '10x Metal Parts', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (10, 5, '5x Steel Spring', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (11, 5, '5x Duct Tape', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (12, 6, 'Cheer Emote', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (13, 6, '1x Stitcher II', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (14, 6, '1x Ext. Light Mag I', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (15, 7, '1x Raider Hatch Key', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (16, 7, '1x Binoculars', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (17, 8, '5x Li''l Smoke Grenade', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (18, 8, '3x Shrapnel Grenade', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (19, 8, '3x Barricade Kit', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (20, 9, '1x Combat MK.1', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (21, 9, '1x Medium Shield', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (22, 10, '1x Dam Control Tower Key', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (23, 10, '2x Defibrillator', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (24, 10, '1x Raider Hatch Key', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (27, 1, '1x Rattler III', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (28, 1, '80x Medium Ammo', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (30, 19, '3x Adrenaline Shot', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (31, 19, '3x Sterilized Bandage', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (32, 19, '1x Surge Shield Recharger', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (33, 31, '6x Crude Explosives', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (34, 31, '2x Processor', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (35, 31, '1x Music Box', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (36, 35, '1x Magnetic Accelerator', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (37, 35, '3x Heavy Gun Parts', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (38, 35, '1x Exodus Modules', 2);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (39, 37, '1x Hullcracker Blueprint', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (40, 48, '5x Steel Spring', 0);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (41, 48, '5x Duct Tape', 1);
INSERT INTO quest_rewards (id, quest_id, reward_text, order_index) VALUES (42, 48, '1x Mod Components', 2);


-- Table: raider_profiles
CREATE TABLE raider_profiles (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL,
  raider_name VARCHAR(100) NOT NULL,
  expedition_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (user_id),
  UNIQUE (raider_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX raider_profiles_user_id_raider_name_key ON public.raider_profiles USING btree (user_id, raider_name);
CREATE INDEX idx_raider_profiles_user_id ON public.raider_profiles USING btree (user_id);

-- Table: raider_completed_quests
CREATE TABLE raider_completed_quests (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  raider_profile_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (raider_profile_id),
  UNIQUE (quest_id),
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX raider_completed_quests_raider_profile_id_quest_id_key ON public.raider_completed_quests USING btree (raider_profile_id, quest_id);
CREATE INDEX idx_raider_completed_quests_profile ON public.raider_completed_quests USING btree (raider_profile_id);

-- Table: raider_owned_blueprints
CREATE TABLE raider_owned_blueprints (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  raider_profile_id INTEGER NOT NULL,
  blueprint_id INTEGER NOT NULL,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (raider_profile_id),
  UNIQUE (blueprint_id),
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX raider_owned_blueprints_raider_profile_id_blueprint_id_key ON public.raider_owned_blueprints USING btree (raider_profile_id, blueprint_id);
CREATE INDEX idx_raider_owned_blueprints_profile ON public.raider_owned_blueprints USING btree (raider_profile_id);

-- Table: raider_completed_workbenches
CREATE TABLE raider_completed_workbenches (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  raider_profile_id INTEGER NOT NULL,
  workbench_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (raider_profile_id),
  UNIQUE (workbench_id),
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (workbench_id) REFERENCES workbenches(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX raider_completed_workbenches_raider_profile_id_workbench_id_key ON public.raider_completed_workbenches USING btree (raider_profile_id, workbench_id);
CREATE INDEX idx_raider_completed_workbenches_profile ON public.raider_completed_workbenches USING btree (raider_profile_id);

-- Table: raider_completed_expedition_parts
CREATE TABLE raider_completed_expedition_parts (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  raider_profile_id INTEGER NOT NULL,
  expedition_part_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (raider_profile_id),
  UNIQUE (expedition_part_id),
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (expedition_part_id) REFERENCES expedition_parts(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX raider_completed_expedition_p_raider_profile_id_expedition__key ON public.raider_completed_expedition_parts USING btree (raider_profile_id, expedition_part_id);
CREATE INDEX idx_raider_completed_expedition_parts_profile ON public.raider_completed_expedition_parts USING btree (raider_profile_id);

-- Table: raider_completed_expedition_items
-- Tracks individual materials/items completed for each expedition part
CREATE TABLE raider_completed_expedition_items (
  id SERIAL PRIMARY KEY,
  raider_profile_id INTEGER NOT NULL REFERENCES raider_profiles(id) ON DELETE CASCADE,
  part_name VARCHAR(50) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(raider_profile_id, part_name, item_name)
);
CREATE INDEX idx_raider_expedition_items_profile ON raider_completed_expedition_items(raider_profile_id);
CREATE INDEX idx_raider_expedition_items_part ON raider_completed_expedition_items(part_name);

-- Table: favorite_raiders
CREATE TABLE favorite_raiders (
  id INTEGER NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL,
  raider_profile_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id),
  UNIQUE (raider_profile_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX favorite_raiders_user_id_raider_profile_id_key ON public.favorite_raiders USING btree (user_id, raider_profile_id);
CREATE INDEX idx_favorite_raiders_user_id ON public.favorite_raiders USING btree (user_id);

-- Reset sequences
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users), true);
SELECT setval(pg_get_serial_sequence('raider_profiles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM raider_profiles), true);
SELECT setval(pg_get_serial_sequence('blueprints', 'id'), (SELECT COALESCE(MAX(id), 1) FROM blueprints), true);
SELECT setval(pg_get_serial_sequence('safe_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM safe_items), true);
SELECT setval(pg_get_serial_sequence('crafting_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM crafting_items), true);
SELECT setval(pg_get_serial_sequence('workbenches', 'id'), (SELECT COALESCE(MAX(id), 1) FROM workbenches), true);
SELECT setval(pg_get_serial_sequence('expedition_parts', 'id'), (SELECT COALESCE(MAX(id), 1) FROM expedition_parts), true);
SELECT setval(pg_get_serial_sequence('quests', 'id'), (SELECT COALESCE(MAX(id), 1) FROM quests), true);
SELECT setval(pg_get_serial_sequence('quest_objectives', 'id'), (SELECT COALESCE(MAX(id), 1) FROM quest_objectives), true);
SELECT setval(pg_get_serial_sequence('quest_rewards', 'id'), (SELECT COALESCE(MAX(id), 1) FROM quest_rewards), true);
