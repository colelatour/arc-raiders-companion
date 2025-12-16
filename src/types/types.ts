// src/types/types.ts

export interface ProfileData {
  profileId: number;
  expeditionLevel: number;
  completedQuests: number[];
  ownedBlueprints: string[];
  completedWorkbenches: string[];
  completedExpeditionParts: string[];
  completedExpeditionItems: CompletedExpeditionItem[];
}

export interface CompletedExpeditionItem {
  part_name: string;
  item_name: string;
}

export interface AllQuests {
  id: number;
  name: string;
  locations: string;
  url: string;
  objectives: { text: string, order: number }[];
  rewards: { text: string, order: number }[];
}

export interface Blueprint {
  id: number;
  name: string;
  workshop: string;
  recipe: string | null;
  is_lootable: number;
  is_harvester_event: number;
  is_quest_reward: number;
  is_trails_reward: number;
}

export interface Workbench {
  id: number;
  name: string;
  category: string;
  level: number;
  display_order: number;
}

export interface ExpeditionPart {
  id: number;
  name: string;
  part_number: number;
  display_order: number;
}

export interface ExpeditionItem {
  id: number;
  expedition_level: number;
  part_name: string;
  part_number: number;
  item_name: string;
  quantity: string;
  location: string;
  display_order: number;
}
