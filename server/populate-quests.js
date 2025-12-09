import pool from './database.js';

const QUESTS = [
  { id: 1, name: "Picking Up The Pieces", objectives: ["Visit any area with a loot category icon", "Loot 3 containers"], locations: "Hydroponic Dome, Dam", rewards: ["1x Rattler III", "80x Medium Ammo"] },
  { id: 2, name: "Clearer Skies", objectives: ["Destroy 3 ARC enemies", "Get 3 ARC Alloy for Shani"], locations: "Dam Battlegrounds", rewards: ["3x Sterilized Bandage", "1x Light Shield", "Black Backpack Cosmetic"] },
  { id: 3, name: "Trash Into Treasure", objectives: ["Obtain 6 Wires", "Obtain 1 Battery"], locations: "Research Building, Dam", rewards: ["1x Tactical MK.1", "3x Adrenaline Shot"] },
  { id: 4, name: "Off The Radar", objectives: ["In one round: Visit a field depot", "Repair antenna on roof"], locations: "Field Depot (Any)", rewards: ["2x Defibrillator"] },
  { id: 5, name: "A Bad Feeling", objectives: ["Find and search any ARC Probe or ARC Courier"], locations: "Any Map", rewards: ["10x Metal Parts", "5x Steel Spring", "5x Duct Tape"] },
  { id: 6, name: "The Right Tool", objectives: ["Destroy a Fireball", "Destroy a Hornet", "Destroy a Turret"], locations: "Any Map", rewards: ["Cheer Emote", "1x Stitcher II", "1x Ext. Light Mag I"] },
  { id: 7, name: "Hatch Repairs", objectives: ["Repair leaking hydraulic pipes near Raider Hatch", "Search for hatch key near hatch"], locations: "Raider Hatch (Any)", rewards: ["1x Raider Hatch Key", "1x Binoculars"] },
  { id: 8, name: "Safe Passage", objectives: ["Destroy 2 ARC enemies using explosive grenade"], locations: "Research & Admin, Dam", rewards: ["5x Li'l Smoke Grenade", "3x Shrapnel Grenade", "3x Barricade Kit"] },
  { id: 9, name: "Down To Earth", objectives: ["In one round: Visit Field Depot", "Deliver Field Crate to Supply Station", "Collect reward"], locations: "Field Depot (Any)", rewards: ["1x Combat MK.1", "1x Medium Shield"] },
  { id: 10, name: "The Trifecta", objectives: ["Destroy Hornet", "Get Hornet Driver", "Destroy Snitch", "Get Snitch Scanner", "Destroy Wasp", "Get Wasp Driver"], locations: "Testing Annex, Dam", rewards: ["1x Dam Control Tower Key", "2x Defibrillator", "1x Raider Hatch Key"] },
  { id: 11, name: "A Better Use", objectives: ["Request Supply Drop from Call Station", "Loot a Supply Drop"], locations: "Supply Call Station (Any)", rewards: ["1x Ext. Light Mag I", "1x Stable Stock I", "1x Muzzle Brake II"] },
  { id: 12, name: "What Goes Around", objectives: ["Destroy any ARC enemy using a Fireball Burner"], locations: "Research & Admin, Dam", rewards: ["3x Blaze Grenade", "2x Noisemaker", "Cans Backpack"] },
  { id: 13, name: "Sparks Fly", objectives: ["Destroy Hornet with Trigger 'Nade or Snap Blast"], locations: "Any Map", rewards: ["1x Trigger Nade Blueprint", "4x Crude Explosives", "2x Processor"] },
  { id: 14, name: "Greasing Her Palms", objectives: ["Visit Locked Room in Water Treatment (Dam)", "Scope rocket thrusters (Spaceport)", "Visit barricaded area floor 6 Space Travel (Buried City)"], locations: "Various", rewards: ["1x Lure Grenade BP", "3x Speaker Component", "3x Electrical Components"] },
  { id: 15, name: "A First Foothold", objectives: ["Stabilize observation deck (Ridgeline)", "Enable comms (Olive Grove)", "Rotate satellite dishes", "Nail down roof plates"], locations: "Ridgeline, Blue Gate", rewards: ["3x Shrapnel Grenade", "3x Snap Blast", "3x Heavy Fuze"] },
  { id: 16, name: "Dormant Barons", objectives: ["Loot a Baron husk"], locations: "South Swamp Outpost", rewards: ["3x Door Blocker", "3x Li'l Smoke Grenade"] },
  { id: 17, name: "Mixed Signals", objectives: ["Destroy ARC Surveyor", "Obtain 1 Surveyor Vault"], locations: "Any Map", rewards: ["1x Photoelectric Cloak", "1x Raider Hatch Key"] },
  { id: 18, name: "What We Left Behind", objectives: ["Search 2 containers in Raider Camp", "Search South Swamp Outpost", "Search Bilguun's Hideout"], locations: "Various", rewards: ["1x Muzzle Brake II", "1x Vertical Grip II", "1x Stable Stock II"] },
  { id: 19, name: "Doctor's Orders", objectives: ["Obtain 2 Antiseptic", "Obtain 1 Syringe", "Obtain 1 Durable Cloth", "Obtain 1 Great Mullein"], locations: "Pharmacy, Buried City", rewards: ["3x Adrenaline Shot", "3x Sterilized Bandage", "1x Surge Shield Recharger"] },
  { id: 20, name: "Medical Merchandise", objectives: ["Search Departure Bldg exam rooms", "Search Hospital containers", "Search R&A medical room"], locations: "Various", rewards: ["1x Banana Charm", "3x Defibrillator", "2x Vita Shot"] },
  { id: 21, name: "A Reveal in Ruins", objectives: ["Search for ESR Analyzer in pharmacy", "Deliver to Lance"], locations: "Pharmacy, Buried City", rewards: ["1x Tactical Mk. 3 (Healing)", "1x Surge Shield Recharger"] },
  { id: 22, name: "Broken Monument", objectives: ["Reach Scrap Yard", "Search for compass", "Search for video tape", "Search for field rations", "Deliver items to Tian Wen"], locations: "Scrapyard, Dam", rewards: ["1x Arpeggio I", "1x Compensator II", "80x Medium Ammo"] },
  { id: 23, name: "Marked for Death", objectives: ["Reach Su Durante Warehouses in Outskirts"], locations: "Buried City", rewards: ["1x Shotgun Choke II", "1x Angled Grip II"] },
  { id: 24, name: "Straight Record", objectives: ["Reach Victory Ridge", "Disable power switches (3)", "Shutdown EMP trap"], locations: "Victory Ridge, Dam", rewards: ["5x Medium Gun Parts", "3x Adv. Mech Components"] },
  { id: 25, name: "A Lay of the Land", objectives: ["Reach Jiangsu Warehouse", "Find shipping notes", "Locate scanners in Control Tower A6", "Deliver LiDAR to Shani"], locations: "Jiangsu Warehouse, Spaceport", rewards: ["1x Dam Testing Key", "3x Zipline", "2x Smoke Grenade"] },
  { id: 26, name: "Market Correction", objectives: ["Locate cache near Marano Station"], locations: "Marano Station, Buried City", rewards: ["1x Silencer II", "1x Ext. Light Mag I", "1x Compensator I"] },
  { id: 27, name: "Keeping the Memory", objectives: ["Reach wreckage in Formical Hills"], locations: "Formical Hills, Dam", rewards: ["5x Simple Gun Parts", "5x Duct Tape", "5x Magnet"] },
  { id: 28, name: "Reduced to Rubble", objectives: ["Photo Collapsed Highway", "Go to Broken Earth", "Investigate unknown ARC machines"], locations: "Highway Collapse, Blue Gate", rewards: ["1x Zipline", "3x Barricade Kit", "3x Doorblockers"] },
  { id: 29, name: "With a Trace", objectives: ["Reach Barren Clearing", "Find signs of who brought down machines"], locations: "Barren Clearing, Blue Gate", rewards: ["1x Medium Shield"] },
  { id: 30, name: "Eyes on the Prize", objectives: ["Find roof terrace south-west of Southern Station", "Rewire solar panel using 3 Wires"], locations: "Old Town, Buried City", rewards: ["1x Ext. Shotgun Mag II", "1x Ext. Medium Mag II"] },
  { id: 31, name: "Battle Plans", objectives: ["Reach Victory Ridge", "Retrieve battle plans", "Deliver Aiva's Patch"], locations: "Victory Ridge, Dam", rewards: ["6x Crude Explosives", "2x Processor", "1x Music Box"] },
  { id: 32, name: "Industrial Espionage", objectives: ["Find Tian Wen's weapon cache", "Deliver Burletta"], locations: "Industrial Zone, Buried City", rewards: ["3x Mechanical Components", "3x Simple Gun Parts"] },
  { id: 33, name: "Unexpected Initiative", objectives: ["Reach Grandioso Apts", "Search for Fertilizer", "Search for Water Pump at Piazza Roma", "Deliver items"], locations: "Industrial, Buried City", rewards: ["1x IL Toro I", "1x Shotgun Choke II"] },
  { id: 34, name: "A Symbol of Unification", objectives: ["Reach Formicai Outpost", "Locate flag", "Hoist flag overlooking red lake"], locations: "Formicai Outpost, Dam", rewards: ["3x Mod Components", "5x Duct Tape"] },
  { id: 35, name: "Celeste's Journals", objectives: ["Retrieve journals from South Swamp", "Retrieve journals from northern outpost", "Deliver to Celeste"], locations: "South Swamp, Dam", rewards: ["1x Magnetic Accelerator", "3x Heavy Gun Parts", "1x Exodus Modules"] },
  { id: 36, name: "Back on Top", objectives: ["Mark Pattern House", "Mark white lookout tower", "Mark South Trench Tower", "Mark mural building"], locations: "Various", rewards: ["1x Renegade I", "1x Stable Stock III", "80x Medium Ammo"] },
  { id: 37, name: "The Major's Footlocker", objectives: ["Search for Aiva's mementos in apartments", "Deliver to Tian Wen"], locations: "Ruby Residences, Dam", rewards: ["1x Hullcracker Blueprint"] },
  { id: 38, name: "Out of the Shadows", objectives: ["Destroy a Rocketeer", "Obtain a Rocketeer Driver"], locations: "Testing Annex, Dam", rewards: ["3x Surge Shield Recharger", "2x Wolfpack"] },
  { id: 39, name: "Eyes in the Sky", objectives: ["Install LiDAR at Control Tower (Dam)", "Install LiDAR at Comm Tower (Spaceport)", "Install LiDAR on Galleria sign (Buried City)"], locations: "Various", rewards: ["1x Vita Spray", "5x Yellow Light Stick"] },
  { id: 40, name: "Our Presence Up There", objectives: ["Visit Pattern House", "Interact with Power Switch", "Complete antenna installation"], locations: "Pattern House, Dam", rewards: ["1x Buried City Town Hall Key", "1x Raider Hatch Key", "1x Jolt Mine"] },
  { id: 41, name: "Communication Hideout", objectives: ["Reach Red Tower", "Find missing battery", "Install and boot antenna"], locations: "Old Town, Buried City", rewards: ["1x Anvil III", "40x Heavy Ammo"] },
  { id: 42, name: "After Rain Comes", objectives: ["Find flooded solar panels", "Repair using 5 Wires and 2 Batteries"], locations: "Grandioso Apts, Buried City", rewards: ["5x Blue Light Stick", "3x Antiseptic", "5x Durable Cloth"] },
  { id: 43, name: "A Balanced Harvest", objectives: ["Go to Research Building", "Locate Lab 1"], locations: "Research Building, Dam", rewards: ["3x Adv. Mech Components", "3x Medium Gun Parts", "10x Steel Spring"] },
  { id: 44, name: "Untended Garden", objectives: ["Go to Hydroponic Dome", "Access data archive", "Upload data to terminal"], locations: "Hydroponic Dome, Dam", rewards: ["3x Adv. Mech Components", "3x Heavy Gun Parts", "5x Canister"] },
  { id: 45, name: "The Root of the Matter", objectives: ["Go to Research Building", "Search for seed vault", "Deliver Experimental Seed"], locations: "Research Building, Buried City", rewards: ["3x Adv. Mech Components", "3x Heavy Gun Parts", "3x Canister"] },
  { id: 46, name: "Water Troubles", objectives: ["Locate Flood Access Tunnel", "Find intake to Water Supply", "Sample water"], locations: "Red Lake Berm, Dam", rewards: ["3x Mechanical Components", "3x Simple Gun Parts", "3x Steel Spring"] },
  { id: 47, name: "Into the Fray", objectives: ["Destroy a Leaper", "Obtain Leaper Pulse Unit"], locations: "Research Building, Dam", rewards: ["1 Radio Renegade", "1 Burgerboy", "1 Vulcano III"] },
  { id: 48, name: "Source of Contamination", objectives: ["Reach Water Treatment", "Search Flood Spill Intake", "Investigate suspicious objects"], locations: "Water Treatment, Dam", rewards: ["5x Steel Spring", "5x Duct Tape", "1x Mod Components"] },
  { id: 49, name: "Switching the Supply", objectives: ["Find tunnels under Spaceport", "Find and turn valve"], locations: "Launch Towers, Spaceport", rewards: ["3x Synthesized Fuel"] },
  { id: 50, name: "A Warm Place to Rest", objectives: ["Locate Abandoned Highway Camp", "Search for survivors", "Follow markers", "Inspect grave"], locations: "Abandoned Highway, Buried City", rewards: ["3x Noisemaker", "5x Blue Light Stick"] },
  { id: 51, name: "Prescriptions of the Past", objectives: ["Visit Departure Building", "Find Medical Exam Room", "Search for records"], locations: "Departure Bldg, Spaceport", rewards: ["1x Heavy Shield", "1x Tactical Mk. 3 (Healing)"] },
  { id: 52, name: "Power Out", objectives: ["Find Electrical Substation", "Find missing engineer", "Carry fuse to Substation", "Enable power"], locations: "Electrical Substation, Spaceport", rewards: ["5x Wires", "5x Explosive Compound", "5x Oil"] },
  { id: 53, name: "Flickering Threat", objectives: ["Find Generator Room", "Repair Generator", "Find Ventilation Shaft", "Enable power"], locations: "North Complex Elevator, Dam", rewards: ["5x Medium Gun Parts", "3x Adv. Mech Components"] },
  { id: 54, name: "Bees!", objectives: ["Reach Olive Grove", "Search for bee hives"], locations: "Olive Grove, Blue Gate", rewards: ["1x Adv. Electrical Components", "3x Sensors"] },
  { id: 55, name: "Espresso", objectives: ["Find espresso machine", "Get parts for Apollo"], locations: "Plaza Rosa, Buried City", rewards: ["1x Coffee Pot", "3x Adrenaline Shot"] },
  { id: 56, name: "Life of a Pharmacist", objectives: ["Find Arbusto Farmacia", "Document hobbies, family, taste, skills"], locations: "Pharmacy, Buried City", rewards: ["1x Defibrillator", "1x Surge Shield Recharger", "3x Sterilized Bandage"] },
  { id: 57, name: "Tribute to Toledo", objectives: ["Get a Power Rod for Celeste"], locations: "Various", rewards: ["5x Magnet", "2x Adv. Mech Components", "3x Synthesized Fuel"] },
  { id: 58, name: "Digging Up Dirt", objectives: ["Locate Santa Maria Houses", "Locate Dead Drop"], locations: "Old Town, Buried City", rewards: ["2x Adv. Electrical Components", "4x Speaker Component"] },
  { id: 59, name: "Turnabout", objectives: ["Go to North Trench Tower", "Upload blackmail files"], locations: "North Trench Tower, Spaceport", rewards: ["2x Heavy Gun Parts", "2x Medium Gun Parts"] },
  { id: 60, name: "Building a Library", objectives: ["Locate Library", "Find romance, detective, and adventure books", "Deliver to Apollo"], locations: "Library, Buried City", rewards: ["1x Jolt Mine", "1x Heavy Fuze Grenade"] },
  { id: 61, name: "A New Type of Plant", objectives: ["Search for plant near Baron Husk", "Deliver to Lance"], locations: "Baron Husk, Dam", rewards: ["1x Vita Shot", "5x Antiseptic"] },
  { id: 62, name: "Armored Transports", objectives: ["Reach Checkpoint", "Search Guard huts for Key Card", "Reach Traffic Tunnel", "Unlock patrol car"], locations: "Headhouse, Blue Gate", rewards: ["3x Smoke Grenade", "3x Defibrillator"] },
  { id: 63, name: "Lost in Transmission", objectives: ["In one round: Visit Control Tower A6", "Reach top of tower"], locations: "Control Tower A6, Spaceport", rewards: ["1x Snap Hook"] }
];

async function populateQuests() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Populating quest data...');
    let updatedCount = 0;
    
    for (const quest of QUESTS) {
      // Update quest locations
      await client.query(
        'UPDATE quests SET locations = $1 WHERE id = $2',
        [quest.locations, quest.id]
      );
      
      // Delete existing objectives and rewards for this quest
      await client.query('DELETE FROM quest_objectives WHERE quest_id = $1', [quest.id]);
      await client.query('DELETE FROM quest_rewards WHERE quest_id = $1', [quest.id]);
      
      // Insert objectives
      if (quest.objectives && quest.objectives.length > 0) {
        for (let i = 0; i < quest.objectives.length; i++) {
          await client.query(
            'INSERT INTO quest_objectives (quest_id, objective_text, order_index) VALUES ($1, $2, $3)',
            [quest.id, quest.objectives[i], i]
          );
        }
      }
      
      // Insert rewards
      if (quest.rewards && quest.rewards.length > 0) {
        for (let i = 0; i < quest.rewards.length; i++) {
          await client.query(
            'INSERT INTO quest_rewards (quest_id, reward_text, order_index) VALUES ($1, $2, $3)',
            [quest.id, quest.rewards[i], i]
          );
        }
      }
      
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`  Updated ${updatedCount} quests...`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`\n✅ Successfully populated ${updatedCount} quests with objectives and rewards!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error populating quests:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

populateQuests().catch(console.error);
