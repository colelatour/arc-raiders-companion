export interface Quest {
  id: number;
  name: string;
  objectives: string[];
  locations: string;
  rewards: string[];
  url?: string;
  notes?: string;
}

export interface Blueprint {
  name: string;
  workshop: string;
  recipe?: string;
  lootable: boolean;
  harvesterEvent: boolean;
  questReward: boolean;
  trailsReward: boolean;
}

export interface CraftingItem {
  item: string;
  quantity: string | number;
  neededFor: string;
  location: string;
  alternativeSource?: string;
}

export interface SafeItem {
  name: string;
  category: 'Recycle' | 'Sell' | 'KeepUntilDone';
  description?: string;
}

export type ViewState = 'home' | 'quests' | 'blueprints' | 'workbenches' | 'expedition-parts' | 'safe-items' | 'raider-search';