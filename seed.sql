-- Seed data for ARC Raiders Companion

INSERT INTO blueprints (id, name, workshop, recipe, is_lootable, is_harvester_event, is_quest_reward, is_trails_reward) VALUES
(1, 'Anvil', 'Gunsmith 2', '5x Mech Comp, 5x Simple Gun Parts', 1, 0, 0, 1),
(2, 'Anvil Splitter', 'Gunsmith 3', NULL, 1, 0, 0, 0),
(3, 'Angled Grip II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', 1, 0, 0, 0),
(4, 'Barricade Kit', 'Utility Station 2', '1x Mech Comp', 1, 0, 0, 0),
(5, 'Bettina', 'Gunsmith 3', '3x Adv Mech Comp, 3x Heavy Gun Parts, 3x Canister', 1, 0, 0, 0),
(6, 'Blaze Grenade', 'Explosives Station 3', '1x Expl Compound, 2x Oil', 1, 0, 0, 1),
(7, 'Bobcat', 'Gunsmith 3', NULL, 1, 0, 0, 0),
(8, 'Burletta', 'Gunsmith 1', '3x Mech Comp, 3x Simple Gun Parts', 0, 0, 1, 0),
(9, 'Combat Mk. 3 (AGGRESSIVE)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', 1, 0, 0, 0),
(10, 'Compensator II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', 1, 0, 0, 0),
(11, 'Complex Gun Parts', 'Refiner 3', '1x Light/Medium/Heavy Gun Parts', 1, 0, 0, 0),
(12, 'Defibrillator', 'Medical Lab 2', '9x Plastic Parts, 1x Moss', 1, 0, 0, 0),
(13, 'Explosive Mine', 'Explosives Station 3', '1x Expl Compound, 1x Sensors', 1, 0, 0, 0),
(14, 'Extended Light Magazine II', 'Gunsmith 2', '2x Mech Comp, 3x Steel Spring', 1, 0, 0, 0),
(15, 'Equalizer', 'Gunsmith 3', '3x Mag Accel, 3x Complex GP, 1x Queen Reactor', 0, 1, 0, 0),
(16, 'Heavy Gun Parts', 'Refiner 2', '4x Simple Gun Parts', 1, 0, 0, 0),
(17, 'Horizontal Grip', 'Gunsmith 3', '2x Mod Comp, 5x Duct Tape', 1, 0, 0, 1),
(18, 'Hullcracker', 'Gunsmith 3', '1x Mag Accel, 3x Heavy GP, 1x Exodus Mod', 0, 0, 1, 0),
(19, 'Il Toro', 'Gunsmith 1', '5x Mech Comp, 6x Simple GP', 1, 0, 0, 0),
(20, 'Jolt Mine', 'Explosives Station 2', '1x Elec Comp, 1x Battery', 1, 0, 0, 0),
(21, 'Jupiter', 'Gunsmith 3', '3x Mag Accel, 3x Complex GP, 1x Queen Reactor', 0, 1, 0, 0),
(22, 'Launcher Ammo', 'Workbench 1', '5x Metal Parts, 1x Crude Explosives', 0, 0, 1, 0),
(23, 'Light Gun Parts', 'Refiner 2', '4x Simple Gun Parts', 1, 0, 0, 0),
(24, 'Light Stick (Any)', 'Utility Station 1', '3x Chemicals', 1, 0, 0, 0),
(25, 'Looting Mk. 3 (SURVIVOR)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', 1, 0, 0, 0),
(26, 'Lure Grenade', 'Utility Station 2', '1x Speaker Comp, 1x Elec Comp', 0, 0, 1, 0),
(27, 'Muzzle Brake II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', 1, 0, 0, 0),
(28, 'Osprey', 'Gunsmith 3', '2x Adv Mech Comp, 3x Medium GP, 7x Wires', 1, 0, 0, 0),
(29, 'Padded Stock', 'Gunsmith 3', '2x Mod Comp, 5x Duct Tape', 1, 0, 0, 0),
(30, 'Remote Raider Flare', 'Utility Station 1', '2x Chemicals, 4x Rubber Parts', 1, 0, 0, 1),
(31, 'Shotgun Choke II', 'Gunsmith 2', '2x Mech Comp, 4x Wires', 1, 0, 0, 0),
(32, 'Smoke Grenade', 'Utility Station 2', '14x Chemicals, 1x Canister', 1, 0, 0, 0),
(33, 'Stable Stock II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', 1, 0, 0, 0),
(34, 'Tactical Mk. 3 (DEFENSE/HEAL)', 'Gear Bench 3', '2x Adv Elec Comp, 3x Processor', 1, 0, 0, 0),
(35, 'Tagging Grenade', 'Utility Station 3', '1x Elec Comp, 1x Sensors', 1, 0, 0, 0),
(36, 'Torrente', 'Gunsmith 3', '2x Adv Mech Comp, 3x Medium GP, 6x Steel Spring', 1, 0, 0, 0),
(37, 'Trigger ''Nade', 'Explosives Station 2', '2x Crude Explosives, 1x Processor', 1, 0, 1, 0),
(38, 'Venator', 'Gunsmith 2', '2x Adv Mech Comp, 3x Medium GP, 5x Magnet', 1, 0, 0, 0),
(39, 'Vertical Grip II', 'Gunsmith 2', '2x Mech Comp, 3x Duct Tape', 1, 0, 0, 0),
(40, 'Vita Shot', 'Medical Lab 3', '2x Antiseptic, 1x Syringe', 1, 0, 0, 0),
(41, 'Vita Spray', 'Medical Lab 3', '3x Antiseptic, 1x Canister', 1, 0, 0, 0),
(42, 'Vulcano', 'Gunsmith 3', '1x Mag Accel, 3x Heavy GP, 1x Exodus Mod', 1, 0, 0, 0),
(43, 'Wolfpack', 'Explosives Station 3', '2x Expl Compound, 2x Sensors', 1, 0, 0, 0);

INSERT INTO workbenches (id, name, category, level, display_order) VALUES 
(2, 'Scrappy 2', 'Scrappy', 2, 1),
(3, 'Scrappy 3', 'Scrappy', 3, 1),
(4, 'Scrappy 4', 'Scrappy', 4, 1),
(5, 'Scrappy 5', 'Scrappy', 5, 1),
(6, 'Gunsmith 1', 'Gunsmith', 1, 2),
(7, 'Gunsmith 2', 'Gunsmith', 2, 2),
(8, 'Gunsmith 3', 'Gunsmith', 3, 2),
(16, 'Medical Lab 1', 'Medical Lab', 1, 3),
(17, 'Medical Lab 2', 'Medical Lab', 2, 3),
(18, 'Medical Lab 3', 'Medical Lab', 3, 3),
(21, 'Explosives Bench 1', 'Explosives Bench', 1, 5),
(22, 'Explosives Bench 2', 'Explosives Bench', 2, 5),
(23, 'Explosives Bench 3', 'Explosives Bench', 3, 5),
(26, 'Utility Station 1', 'Utility Station', 1, 4),
(27, 'Utility Station 2', 'Utility Station', 2, 4),
(28, 'Utility Station 3', 'Utility Station', 3, 4),
(31, 'Refiner 1', 'Refiner', 1, 6),
(32, 'Refiner 2', 'Refiner', 2, 6),
(33, 'Refiner 3', 'Refiner', 3, 6);

INSERT INTO expedition_parts (id, name, part_number, display_order) VALUES 
(1, 'Part 1', 1, 1),
(2, 'Part 2', 2, 2),
(3, 'Part 3', 3, 3),
(4, 'Part 4', 4, 4),
(5, 'Part 5', 5, 5);

INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order) VALUES
(1, 1, 'Metal Parts', '150', 'Basic Materials', 1),
(1, 1, 'Rubber Parts', '200', 'Basic Materials', 2),
(1, 1, 'ARC Alloy', '80', 'Drones', 3),
(1, 1, 'Steel Spring', '15', 'Mechanical/Celeste', 4),
(1, 2, 'Durable Cloth', '35', 'Medical/Commercial', 1),
(1, 2, 'Wires', '30', 'Electrical/Tech/Celeste', 2),
(1, 2, 'Electrical Components', '30', 'Electrical/Refiner', 3),
(1, 2, 'Cooling Fans', '5', 'Technological', 4),
(1, 3, 'Light Bulb', '5', 'Electrical', 1),
(1, 3, 'Battery', '30', 'Tech/Electrical/Celeste', 2),
(1, 3, 'Sensors', '20', 'Security/Tech/Celeste', 3),
(1, 3, 'Exodus Modules', '1', 'Exodus/Celeste', 4),
(1, 4, 'Humidifier', '5', 'Residential', 1),
(1, 4, 'Adv. Electrical Components', '5', 'Electrical/Refiner', 2),
(1, 4, 'Magnetic Accelerator', '3', 'Exodus', 3),
(1, 4, 'Leaper Pulse Unit', '3', 'Drones', 4),
(1, 5, 'Combat Items', '250k Value', 'Turn in items', 1),
(1, 5, 'Survival Items', '100k Value', 'Turn in items', 2),
(1, 5, 'Provisions', '180k Value', 'Turn in items', 3),
(1, 5, 'Materials', '300k Value', 'Turn in items', 4);

INSERT INTO expedition_requirements (expedition_level, part_number, item_name, quantity, location, display_order)
SELECT 2, part_number, item_name, quantity, location, display_order
FROM expedition_requirements
WHERE expedition_level = 1;

INSERT INTO quests (id, name, locations, url) VALUES 
(1, 'Picking Up The Pieces', 'Hydroponic Dome, Dam', 'https://patchcrazy.co.uk/picking-up-the-pieces-quest-guide-arc-raiders/'),
(2, 'Clearer Skies', 'Dam Battlegrounds', 'https://patchcrazy.co.uk/clearer-skies-quest-guide-arc-raiders/'),
(3, 'Trash Into Treasure', 'Research Building, Dam', 'https://patchcrazy.co.uk/trash-into-treasure-quest-guide-arc-raiders/'),
(4, 'Off The Radar', 'Field Depot (Any)', 'https://patchcrazy.co.uk/off-the-radar-quest-guide-arc-raiders/'),
(5, 'A Bad Feeling', 'Any Map', 'https://patchcrazy.co.uk/a-bad-feeling-quest-guide-in-arc-raiders/'),
(6, 'The Right Tool', 'Any Map', 'https://patchcrazy.co.uk/the-right-tool-quest-in-arc-raiders/'),
(7, 'Hatch Repairs', 'Raider Hatch (Any)', 'https://patchcrazy.co.uk/hatch-repairs-quest-guide-arc-raiders/'),
(8, 'Safe Passage', 'Research & Admin, Dam', 'https://patchcrazy.co.uk/safe-passage-quest-guide-arc-raiders/'),
(9, 'Down To Earth', 'Field Depot (Any)', 'https://patchcrazy.co.uk/down-to-earth-quest-guide-arc-raiders/'),
(10, 'The Trifecta', 'Testing Annex, Dam', 'https://patchcrazy.co.uk/trifecta-quest-guide-arc-raiders/');

INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES
(1, 'Loot 3 containers', 0),
(1, 'Visit any area with a loot category icon', 1),
(2, 'Destroy 3 ARC enemies', 0),
(2, 'Get 3 ARC Alloy for Shani', 1);

INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES
(1, '1x Rattler III', 0),
(1, '80x Medium Ammo', 1),
(2, '3x Sterilized Bandage', 0),
(2, '1x Light Shield', 1),
(2, 'Black Backpack Cosmetic', 2);