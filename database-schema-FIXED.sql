-- ARC Raiders Companion Database Schema (FIXED)
-- This schema corrects the UNIQUE constraints on progress tracking tables.

-- Drop existing tables if they exist
DROP TABLE IF EXISTS favorite_raiders;
DROP TABLE IF EXISTS raider_completed_expedition_items;
DROP TABLE IF EXISTS raider_completed_expedition_parts;
DROP TABLE IF EXISTS expedition_requirements;
DROP TABLE IF EXISTS raider_completed_workbenches;
DROP TABLE IF EXISTS raider_owned_blueprints;
DROP TABLE IF EXISTS raider_completed_quests;
DROP TABLE IF EXISTS raider_profiles;
DROP TABLE IF EXISTS quest_rewards;
DROP TABLE IF EXISTS quest_objectives;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS expedition_parts;
DROP TABLE IF EXISTS workbenches;
DROP TABLE IF EXISTS crafting_items;
DROP TABLE IF EXISTS safe_items;
DROP TABLE IF EXISTS blueprints;
DROP TABLE IF EXISTS users;


-- Table: users
CREATE TABLE users (
  id INTEGER NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP,
  theme VARCHAR(10) DEFAULT 'dark',
  UNIQUE (email),
  UNIQUE (username)
);

-- Table: blueprints
CREATE TABLE blueprints (
  id INTEGER NOT NULL PRIMARY KEY,
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

-- Table: safe_items
CREATE TABLE safe_items (
  id INTEGER NOT NULL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (item_name)
);

-- Table: crafting_items
CREATE TABLE crafting_items (
  id INTEGER NOT NULL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  quantity VARCHAR(50),
  needed_for VARCHAR(255) NOT NULL,
  location TEXT,
  alternative_source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: workbenches
CREATE TABLE workbenches (
  id INTEGER NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);

-- Table: expedition_parts
CREATE TABLE expedition_parts (
  id INTEGER NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  part_number INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);

-- Table: expedition_requirements
CREATE TABLE expedition_requirements (
  id INTEGER PRIMARY KEY,
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

-- Table: quests
CREATE TABLE quests (
  id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  locations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  url VARCHAR(500),
  PRIMARY KEY (id)
);

-- Table: quest_objectives
CREATE TABLE quest_objectives (
  id INTEGER NOT NULL PRIMARY KEY,
  quest_id INTEGER NOT NULL,
  objective_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE(quest_id, order_index)
);

-- Table: quest_rewards
CREATE TABLE quest_rewards (
  id INTEGER NOT NULL PRIMARY KEY,
  quest_id INTEGER NOT NULL,
  reward_text VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Table: raider_profiles
CREATE TABLE raider_profiles (
  id INTEGER NOT NULL PRIMARY KEY,
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

-- === CORRECTED TABLES ===

-- Table: raider_completed_quests
CREATE TABLE raider_completed_quests (
  id INTEGER NOT NULL PRIMARY KEY,
  raider_profile_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE (raider_profile_id, quest_id)
);

-- Table: raider_owned_blueprints
CREATE TABLE raider_owned_blueprints (
  id INTEGER NOT NULL PRIMARY KEY,
  raider_profile_id INTEGER NOT NULL,
  blueprint_id INTEGER NOT NULL,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE,
  UNIQUE (raider_profile_id, blueprint_id)
);

-- Table: raider_completed_workbenches
CREATE TABLE raider_completed_workbenches (
  id INTEGER NOT NULL PRIMARY KEY,
  raider_profile_id INTEGER NOT NULL,
  workbench_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (workbench_id) REFERENCES workbenches(id) ON DELETE CASCADE,
  UNIQUE (raider_profile_id, workbench_id)
);

-- Table: raider_completed_expedition_parts
CREATE TABLE raider_completed_expedition_parts (
  id INTEGER NOT NULL PRIMARY KEY,
  raider_profile_id INTEGER NOT NULL,
  expedition_part_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (expedition_part_id) REFERENCES expedition_parts(id) ON DELETE CASCADE,
  UNIQUE (raider_profile_id, expedition_part_id)
);

-- Table: raider_completed_expedition_items
CREATE TABLE raider_completed_expedition_items (
  id INTEGER PRIMARY KEY,
  raider_profile_id INTEGER NOT NULL REFERENCES raider_profiles(id) ON DELETE CASCADE,
  part_name VARCHAR(50) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(raider_profile_id, part_name, item_name)
);

-- Table: favorite_raiders
CREATE TABLE favorite_raiders (
  id INTEGER NOT NULL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  raider_profile_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (raider_profile_id) REFERENCES raider_profiles(id) ON DELETE CASCADE,
  UNIQUE (user_id, raider_profile_id)
);

-- === SEED DATA ===
-- Default Admin User (Password: admin123)
INSERT INTO users (id, email, username, password_hash, role, created_at, updated_at, is_active, email_verified) VALUES (1, 'admin@arcraiders.com', 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1);
-- Note: The password 'admin123' is hashed with the insecure SHA-256 function from the app for consistency.
