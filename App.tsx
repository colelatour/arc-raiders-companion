import React, { useState, useEffect } from 'react';
import {
  Shield,
  Map,
  Scroll,
  Hammer,
  Trash2,
  Search,
  CheckCircle,
  Circle,
  Menu,
  X,
  Info,
  ExternalLink,
  User,
  Terminal,
  Activity,
  AlertTriangle,
  Skull,
  Twitter,
  LogOut,
  Loader,
  Settings,
  Edit,
  Plus as PlusIcon,
  Trash as TrashIcon,
  Save
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useRaiderProfile } from './useRaiderProfile';
import { admin } from './api';
import { QUESTS, BLUEPRINTS, CRAFTING_ITEMS, SAFE_TO_RECYCLE, SAFE_TO_SELL } from './constants';
import { ViewState, SafeItem, CraftingItem } from './types';

// Add admin to ViewState
type AppViewState = ViewState | 'admin';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ElementType, 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center space-x-3 w-full px-4 py-3 rounded transition-all duration-200
      ${isActive 
        ? 'bg-arc-accent text-white shadow-lg shadow-red-900/40' 
        : 'text-gray-400 hover:text-white hover:bg-arc-800'
      }
    `}
  >
    <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
    <span className="font-bold uppercase text-sm tracking-wide">{label}</span>
  </button>
);

const SectionHeader = ({ title, description }: { title: string, description?: string }) => (
  <div className="mb-6">
    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-3">
      <Terminal size={28} className="text-arc-accent" />
      {title}
    </h2>
    {description && <p className="text-gray-500 text-sm font-mono">{description}</p>}
  </div>
);

// --- Home View ---
const HomeView = ({ 
  onWipe,
  profileData
}: { 
  onWipe: () => void,
  profileData: any
}) => {
  const [showWipeModal, setShowWipeModal] = useState(false);

  const handleConfirmExpedition = async () => {
    await onWipe();
    setShowWipeModal(false);
  };

  const stats = {
    questsCompleted: profileData?.questsCount || 0,
    totalQuests: QUESTS.length,
    blueprintsOwned: profileData?.blueprintsCount || 0,
    totalBlueprints: BLUEPRINTS.length,
    expeditionLevel: profileData?.expeditionLevel || 0
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-red-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-red-900/50">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-red-900/30 p-4 rounded-full border border-red-700 text-red-500">
                  <Skull size={48} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">Confirm Expedition?</h3>
                <div className="text-gray-300 space-y-2 text-sm">
                  <p>You are about to conclude <span className="text-arc-accent font-bold">Expedition {stats.expeditionLevel}</span>.</p>
                  <p className="p-3 bg-arc-800 rounded border border-red-900/30 text-red-200">
                    <AlertTriangle className="inline mb-1 mr-1" size={14}/>
                    WARNING: This will <strong>WIPE</strong> all tracked Quests and Blueprints for this profile.
                  </p>
                  <p>Your Expedition Level will increase to <strong className="text-white">{stats.expeditionLevel + 1}</strong>.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button 
                    onClick={() => setShowWipeModal(false)}
                    className="py-3 px-4 rounded border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white font-bold transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleConfirmExpedition}
                    className="py-3 px-4 rounded bg-red-600 text-white hover:bg-red-700 font-bold tracking-wide shadow-lg shadow-red-900/40 transition-all transform hover:scale-105"
                  >
                    CONFIRM WIPE
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="relative bg-arc-800 rounded-xl p-8 border border-arc-700 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Terminal size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-arc-accent mb-2">
                <Activity size={18} className="animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest">System Online</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase">
                ARC <span className="text-arc-accent">Companion</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                Welcome back, Raider.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-arc-900/50 rounded p-4 border border-arc-700">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expedition Level</div>
              <div className="text-3xl font-black text-arc-gold">{stats.expeditionLevel}</div>
            </div>
            <div className="bg-arc-900/50 rounded p-4 border border-arc-700">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Quests Completed</div>
              <div className="text-3xl font-black text-white">{stats.questsCompleted}<span className="text-xl text-gray-600">/{stats.totalQuests}</span></div>
            </div>
            <div className="bg-arc-900/50 rounded p-4 border border-arc-700">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Blueprints Owned</div>
              <div className="text-3xl font-black text-white">{stats.blueprintsOwned}<span className="text-xl text-gray-600">/{stats.totalBlueprints}</span></div>
            </div>
          </div>
        </div>

        {/* Expedition Controls */}
        <div className="mt-8 pt-6 border-t border-arc-700">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">

            {/* Expedition Reset Button */}
            <div className="flex items-center">
              <button 
                onClick={() => setShowWipeModal(true)}
                className="group flex items-center gap-3 px-5 py-2 rounded border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-200 transition-all"
              >
                <Skull size={18} className="group-hover:animate-pulse" />
                <span className="font-bold text-sm uppercase tracking-wide">Complete Expedition</span>
                <span className="text-xs text-red-600/80 font-mono">(WIPE & LEVEL UP)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Twitter & Tips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Tips Section */}
      <div className="lg:col-span-2 bg-arc-800 rounded-lg border border-arc-700 shadow-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info size={20} className="text-arc-accent" />
          <h3 className="text-lg font-bold text-white tracking-wide">Raider Tips</h3>
        </div>
        <ul className="space-y-3 text-sm text-gray-400">
          <li className="flex items-start space-x-2">
            <span className="text-arc-accent mt-1">▸</span>
            <span>Completing an expedition <strong className="text-white">wipes</strong> your progress but increases your level.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-arc-accent mt-1">▸</span>
            <span>Use the <strong className="text-white">Workbench</strong> tab to find materials needed for station upgrades.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-arc-accent mt-1">▸</span>
            <span>Check <strong className="text-white">Safe Items</strong> to know what's safe to recycle or sell.</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-arc-accent mt-1">▸</span>
            <span>Your progress is <strong className="text-white">automatically saved</strong> to the database.</span>
          </li>
        </ul>
      </div>

      {/* Twitter Feed */}
      <div className="lg:col-span-3 bg-arc-800 rounded-lg border border-arc-700 shadow-xl overflow-hidden flex flex-col">
        <div className="bg-arc-900/80 p-4 border-b border-arc-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Twitter size={20} className="text-[#1DA1F2]" />
              <h3 className="text-lg font-bold text-white tracking-wide">Incoming Transmissions</h3>
            </div>
            <a href="https://twitter.com/ARCRaidersGame" target="_blank" rel="noreferrer" className="text-xs text-arc-accent hover:underline font-mono">
              @ARCRaidersGame
            </a>
        </div>
        <div className="bg-arc-800 flex-grow p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="bg-arc-900/50 p-8 rounded-lg border border-arc-700">
                <Twitter size={48} className="text-[#1DA1F2] mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Follow for Updates</h4>
                <p className="text-gray-400 text-sm mb-6">
                  Get the latest news, updates, and community content from the official ARC Raiders account.
                </p>
                <a 
                  href="https://twitter.com/ARCRaidersGame" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1DA1F2] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1a8cd8] transition-colors"
                >
                  <Twitter size={20} />
                  View @ARCRaidersGame
                  <ExternalLink size={16} />
                </a>
              </div>
              <p className="text-xs text-gray-500">
                Note: Twitter embeds require a public domain. When deployed, the live timeline will appear here.
              </p>
            </div>
        </div>
      </div>

      </div>
    </div>
  );
};

// --- Quests View ---
const QuestsView = ({ 
  completedQuests,
  onToggleQuest
}: { 
  completedQuests: number[],
  onToggleQuest: (questId: number) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = QUESTS.filter(q =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.locations.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.objectives.some(obj => obj.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isCompleted = (questId: number) => completedQuests.includes(questId);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Quest Log" description="Track your mission progress" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search quests by name, location, or objective..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        />
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filtered.map(quest => (
          <div 
            key={quest.id}
            className={`
              bg-arc-800 rounded border transition-all
              ${isCompleted(quest.id) 
                ? 'border-green-900/50 bg-green-950/10' 
                : 'border-arc-700 hover:border-arc-600'
              }
            `}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => onToggleQuest(quest.id)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      {isCompleted(quest.id) ? (
                        <CheckCircle className="text-green-500" size={24} />
                      ) : (
                        <Circle className="text-gray-600" size={24} />
                      )}
                    </button>
                    <div>
                      <h3 className={`font-bold ${isCompleted(quest.id) ? 'text-green-400 line-through' : 'text-white'}`}>
                        Quest {quest.id}: {quest.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        <Map size={12} className="inline mb-0.5 mr-1" />
                        {quest.locations}
                      </p>
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="ml-9 mt-2 space-y-1">
                    {quest.objectives.map((obj, i) => (
                      <div key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-arc-accent mt-1">▸</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>

                  {/* Rewards */}
                  <div className="ml-9 mt-3 flex flex-wrap gap-2">
                    {quest.rewards.map((reward, i) => (
                      <span
                        key={i}
                        className="text-xs bg-arc-900/50 text-arc-gold px-2 py-1 rounded border border-arc-700"
                      >
                        {reward}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No quests found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

// --- Blueprints View ---
const BlueprintsView = ({ 
  ownedBlueprints,
  onToggleBlueprint
}: { 
  ownedBlueprints: string[],
  onToggleBlueprint: (name: string) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("All");

  const workshops = ["All", ...Array.from(new Set(BLUEPRINTS.map(b => b.workshop)))];

  const filtered = BLUEPRINTS.filter(bp => {
    const matchesSearch = bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bp.workshop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWorkshop = workshopFilter === "All" || bp.workshop === workshopFilter;
    return matchesSearch && matchesWorkshop;
  });

  const isOwned = (name: string) => ownedBlueprints.includes(name);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Blueprints" description="Manage your schematics collection" />

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search blueprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
          />
        </div>
        <select
          value={workshopFilter}
          onChange={(e) => setWorkshopFilter(e.target.value)}
          className="bg-arc-800 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        >
          {workshops.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(bp => (
          <div
            key={bp.name}
            className={`
              bg-arc-800 rounded border p-4 transition-all cursor-pointer
              ${isOwned(bp.name)
                ? 'border-blue-900/50 bg-blue-950/10'
                : 'border-arc-700 hover:border-arc-600'
              }
            `}
            onClick={() => onToggleBlueprint(bp.name)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {isOwned(bp.name) ? (
                  <CheckCircle className="text-blue-500" size={20} />
                ) : (
                  <Circle className="text-gray-600" size={20} />
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className={`font-bold text-sm mb-1 ${isOwned(bp.name) ? 'text-blue-400' : 'text-white'}`}>
                  {bp.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{bp.workshop}</p>
                {bp.recipe && (
                  <p className="text-xs text-gray-400 font-mono">{bp.recipe}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {bp.lootable && <span className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">Lootable</span>}
                  {bp.questReward && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded">Quest</span>}
                  {bp.harvesterEvent && <span className="text-xs bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">Harvester</span>}
                  {bp.trailsReward && <span className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">Trails</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No blueprints found</p>
        </div>
      )}
    </div>
  );
};

// --- Crafting View ---
const CraftingView = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = CRAFTING_ITEMS.filter(item =>
    item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.neededFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Workbench" description="Materials needed for crafting stations" />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-arc-800 border-b border-arc-700">
            <tr>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Item</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Quantity</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Needed For</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Location</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={idx} className="border-b border-arc-700 hover:bg-arc-800/50 transition-colors">
                <td className="p-3 text-white font-medium">{item.item}</td>
                <td className="p-3 text-arc-accent font-mono">{item.quantity}</td>
                <td className="p-3 text-gray-300">{item.neededFor}</td>
                <td className="p-3 text-gray-500 text-sm">{item.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Safe Items View ---
const SafeItemsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Recycle' | 'Sell'>('All');

  const allItems = [...SAFE_TO_RECYCLE, ...SAFE_TO_SELL];
  
  const filtered = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Safe Items" description="Items safe to recycle or sell" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Recycle', 'Sell'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                flex-1 py-3 px-4 rounded font-bold text-sm uppercase transition-all
                ${categoryFilter === cat
                  ? 'bg-arc-accent text-white'
                  : 'bg-arc-800 text-gray-400 hover:text-white border border-arc-700'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-arc-800 border border-arc-700 rounded p-3 flex items-center justify-between"
          >
            <span className="text-white text-sm">{item.name}</span>
            <span className={`
              text-xs px-2 py-1 rounded font-bold
              ${item.category === 'Recycle' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}
            `}>
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Blueprint Manager Component ---
const BlueprintManager = () => {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlueprint, setEditingBlueprint] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    workshop: '',
    recipe: '',
    is_lootable: false,
    is_quest_reward: false,
    is_harvester_event: false,
    is_trails_reward: false
  });

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      setIsLoading(true);
      const response = await admin.getAllBlueprints();
      setBlueprints(response.data.blueprints);
    } catch (error: any) {
      console.error('Failed to load blueprints:', error);
      alert(error.response?.data?.error || 'Failed to load blueprints. Make sure you have admin permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({ 
      name: '', 
      workshop: '', 
      recipe: '', 
      is_lootable: false, 
      is_quest_reward: false, 
      is_harvester_event: false, 
      is_trails_reward: false 
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBlueprint) {
        await admin.updateBlueprint(editingBlueprint.id, formData);
        alert('Blueprint updated successfully!');
      } else {
        await admin.createBlueprint(formData);
        alert('Blueprint created successfully!');
      }
      setShowAddForm(false);
      setEditingBlueprint(null);
      setFormData({ name: '', workshop: '', recipe: '', is_lootable: false, is_quest_reward: false, is_harvester_event: false, is_trails_reward: false });
      loadBlueprints();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save blueprint');
    }
  };

  const handleDelete = async (blueprintId: number) => {
    if (!confirm(`Delete this blueprint? This will remove it from all players' collections!`)) return;
    
    try {
      await admin.deleteBlueprint(blueprintId);
      alert('Blueprint deleted successfully!');
      loadBlueprints();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete blueprint');
    }
  };

  const startEdit = (blueprint: any) => {
    setEditingBlueprint(blueprint);
    setFormData({
      name: blueprint.name,
      workshop: blueprint.workshop,
      recipe: blueprint.recipe || '',
      is_lootable: blueprint.is_lootable,
      is_quest_reward: blueprint.is_quest_reward,
      is_harvester_event: blueprint.is_harvester_event,
      is_trails_reward: blueprint.is_trails_reward
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingBlueprint(null);
    setFormData({ name: '', workshop: '', recipe: '', is_lootable: false, is_quest_reward: false, is_harvester_event: false, is_trails_reward: false });
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-arc-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <SectionHeader title="Blueprint Manager" description="Add, edit, or delete blueprints" />
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors"
        >
          <PlusIcon size={20} />
          Add Blueprint
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-arc-accent rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingBlueprint ? `Edit Blueprint: ${editingBlueprint.name}` : 'Add New Blueprint'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Blueprint Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Workshop *</label>
                  <input
                    type="text"
                    value={formData.workshop}
                    onChange={(e) => setFormData({ ...formData, workshop: e.target.value })}
                    className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                    placeholder="e.g., Equipment, Weapon, Gear"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Recipe (optional)</label>
                <textarea
                  value={formData.recipe}
                  onChange={(e) => setFormData({ ...formData, recipe: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  placeholder="Crafting materials and requirements"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_lootable}
                    onChange={(e) => setFormData({ ...formData, is_lootable: e.target.checked })}
                    className="w-4 h-4 bg-arc-800 border border-arc-700 rounded text-arc-accent focus:ring-arc-accent"
                  />
                  <span className="text-sm text-gray-300">Lootable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_quest_reward}
                    onChange={(e) => setFormData({ ...formData, is_quest_reward: e.target.checked })}
                    className="w-4 h-4 bg-arc-800 border border-arc-700 rounded text-arc-accent focus:ring-arc-accent"
                  />
                  <span className="text-sm text-gray-300">Quest Reward</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_harvester_event}
                    onChange={(e) => setFormData({ ...formData, is_harvester_event: e.target.checked })}
                    className="w-4 h-4 bg-arc-800 border border-arc-700 rounded text-arc-accent focus:ring-arc-accent"
                  />
                  <span className="text-sm text-gray-300">Harvester Event</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_trails_reward}
                    onChange={(e) => setFormData({ ...formData, is_trails_reward: e.target.checked })}
                    className="w-4 h-4 bg-arc-800 border border-arc-700 rounded text-arc-accent focus:ring-arc-accent"
                  />
                  <span className="text-sm text-gray-300">Trails Reward</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-arc-700">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
                >
                  <Save size={18} />
                  {editingBlueprint ? 'Update Blueprint' : 'Create Blueprint'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-arc-700 text-gray-300 rounded font-bold hover:bg-arc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blueprint List */}
      <div className="space-y-3">
        {blueprints.map((blueprint) => (
          <div key={blueprint.id} className="bg-arc-800 border border-arc-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  {blueprint.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">🔨 {blueprint.workshop}</p>
                
                {blueprint.recipe && (
                  <p className="text-sm text-gray-400 mb-2 italic">{blueprint.recipe}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {blueprint.is_lootable && (
                    <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">Lootable</span>
                  )}
                  {blueprint.is_quest_reward && (
                    <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">Quest Reward</span>
                  )}
                  {blueprint.is_harvester_event && (
                    <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">Harvester Event</span>
                  )}
                  {blueprint.is_trails_reward && (
                    <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded">Trails Reward</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => startEdit(blueprint)}
                  className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition-colors"
                  title="Edit Blueprint"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(blueprint.id)}
                  className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                  title="Delete Blueprint"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {blueprints.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Hammer size={48} className="mx-auto mb-4 opacity-50" />
          <p>No blueprints found. Click "Add Blueprint" to create one.</p>
        </div>
      )}
    </div>
  );
};

// --- Quest Manager Component ---
const QuestManager = () => {
  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingQuest, setEditingQuest] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    locations: '',
    objectives: [''],
    rewards: ['']
  });

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setIsLoading(true);
      const response = await admin.getAllQuests();
      setQuests(response.data.quests);
    } catch (error: any) {
      console.error('Failed to load quests:', error);
      alert(error.response?.data?.error || 'Failed to load quests. Make sure you have admin permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextQuestId = () => {
    if (quests.length === 0) return 1;
    const maxId = Math.max(...quests.map(q => q.id));
    return maxId + 1;
  };

  const handleAddNew = () => {
    const nextId = getNextQuestId();
    setFormData({ 
      id: nextId.toString(), 
      name: '', 
      locations: '', 
      objectives: [''], 
      rewards: [''] 
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuest) {
        await admin.updateQuest(editingQuest.id, {
          name: formData.name,
          locations: formData.locations,
          objectives: formData.objectives.filter(o => o.trim()),
          rewards: formData.rewards.filter(r => r.trim())
        });
        alert('Quest updated successfully!');
      } else {
        await admin.createQuest({
          id: parseInt(formData.id),
          name: formData.name,
          locations: formData.locations,
          objectives: formData.objectives.filter(o => o.trim()),
          rewards: formData.rewards.filter(r => r.trim())
        });
        alert('Quest created successfully!');
      }
      setShowAddForm(false);
      setEditingQuest(null);
      setFormData({ id: '', name: '', locations: '', objectives: [''], rewards: [''] });
      loadQuests();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save quest');
    }
  };

  const handleDelete = async (questId: number) => {
    if (!confirm(`Delete Quest ${questId}? This will remove it from all players' progress!`)) return;
    
    try {
      await admin.deleteQuest(questId);
      alert('Quest deleted successfully!');
      loadQuests();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete quest');
    }
  };

  const startEdit = (quest: any) => {
    setEditingQuest(quest);
    setFormData({
      id: quest.id.toString(),
      name: quest.name,
      locations: quest.locations || '',
      objectives: quest.objectives || [''],
      rewards: quest.rewards || ['']
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingQuest(null);
    setFormData({ id: '', name: '', locations: '', objectives: [''], rewards: [''] });
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-arc-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <SectionHeader title="Quest Manager" description="Add, edit, or delete quests" />
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors"
        >
          <PlusIcon size={20} />
          Add Quest
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-arc-accent rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingQuest ? `Edit Quest ${editingQuest.id}` : 'Add New Quest'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Quest ID</label>
                  <input
                    type="number"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingQuest}
                    className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Quest Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Locations</label>
                <input
                  type="text"
                  value={formData.locations}
                  onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  placeholder="e.g., Arid Flats, Construction Site"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Objectives</label>
                {formData.objectives.map((obj, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const newObjs = [...formData.objectives];
                        newObjs[idx] = e.target.value;
                        setFormData({ ...formData, objectives: newObjs });
                      }}
                      className="flex-1 bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                      placeholder="Objective description"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, objectives: formData.objectives.filter((_, i) => i !== idx) })}
                      className="px-3 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, objectives: [...formData.objectives, ''] })}
                  className="text-sm text-arc-accent hover:underline"
                >
                  + Add Objective
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rewards</label>
                {formData.rewards.map((reward, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={reward}
                      onChange={(e) => {
                        const newRewards = [...formData.rewards];
                        newRewards[idx] = e.target.value;
                        setFormData({ ...formData, rewards: newRewards });
                      }}
                      className="flex-1 bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                      placeholder="Reward description"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rewards: formData.rewards.filter((_, i) => i !== idx) })}
                      className="px-3 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rewards: [...formData.rewards, ''] })}
                  className="text-sm text-arc-accent hover:underline"
                >
                  + Add Reward
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-arc-700">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
                >
                  <Save size={18} />
                  {editingQuest ? 'Update Quest' : 'Create Quest'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-arc-700 text-gray-300 rounded font-bold hover:bg-arc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quest List */}
      <div className="space-y-3">
        {quests.map((quest) => (
          <div key={quest.id} className="bg-arc-800 border border-arc-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  Quest {quest.id}: {quest.name}
                </h3>
                {quest.locations && (
                  <p className="text-sm text-gray-500 mb-2">📍 {quest.locations}</p>
                )}
                
                {quest.objectives && quest.objectives.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Objectives:</p>
                    {quest.objectives.map((obj: string, idx: number) => (
                      <p key={idx} className="text-sm text-gray-400 ml-2">▸ {obj}</p>
                    ))}
                  </div>
                )}
                
                {quest.rewards && quest.rewards.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {quest.rewards.map((reward: string, idx: number) => (
                      <span key={idx} className="text-xs bg-arc-900/50 text-arc-gold px-2 py-1 rounded">
                        {reward}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => startEdit(quest)}
                  className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition-colors"
                  title="Edit Quest"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(quest.id)}
                  className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                  title="Delete Quest"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {quests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Settings size={48} className="mx-auto mb-4 opacity-50" />
          <p>No quests found. Click "Add Quest" to create one.</p>
        </div>
      )}
    </div>
  );
};

// --- Admin View with Tabs ---
const AdminView = () => {
  const [activeTab, setActiveTab] = useState<'quests' | 'blueprints'>('quests');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-arc-700 pb-4">
        <button
          onClick={() => setActiveTab('quests')}
          className={`
            px-6 py-3 rounded-t font-bold uppercase tracking-wide transition-all duration-200
            ${activeTab === 'quests' 
              ? 'bg-arc-accent text-white shadow-lg' 
              : 'bg-arc-800 text-gray-400 hover:text-white hover:bg-arc-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Scroll size={20} />
            Quest Manager
          </div>
        </button>
        <button
          onClick={() => setActiveTab('blueprints')}
          className={`
            px-6 py-3 rounded-t font-bold uppercase tracking-wide transition-all duration-200
            ${activeTab === 'blueprints' 
              ? 'bg-arc-accent text-white shadow-lg' 
              : 'bg-arc-800 text-gray-400 hover:text-white hover:bg-arc-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Hammer size={20} />
            Blueprint Manager
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'quests' ? <QuestManager /> : <BlueprintManager />}
    </div>
  );
};

// --- Main App ---
export default function App() {
  const { user, logout } = useAuth();
  const { profileData, isLoading, toggleQuest, toggleBlueprint, completeExpedition } = useRaiderProfile();
  const [currentView, setCurrentView] = useState<AppViewState>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const navigate = (view: AppViewState) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-arc-900 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-arc-accent animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono">Loading Raider Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arc-900 text-gray-100 font-sans selection:bg-arc-accent selection:text-white">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-arc-800 border-b border-arc-700 sticky top-0 z-50">
        <div className="font-bold text-xl tracking-tight">ARC <span className="text-arc-accent">COMPANION</span></div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex w-full">
        {/* Sidebar Navigation */}
        <div className={`
          fixed inset-0 z-40 bg-arc-900/95 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:bg-transparent lg:w-64 lg:block lg:pt-8 lg:pl-4
          ${mobileMenuOpen ? 'translate-x-0 pt-20 px-4' : '-translate-x-full'}
        `}>
          <div className="mb-8 hidden lg:block px-4">
            <h1 className="text-2xl font-black italic tracking-tighter text-white">
              ARC <span className="text-arc-accent">COMPANION</span>
            </h1>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={Shield} label="Terminal" isActive={currentView === 'home'} onClick={() => navigate('home')} />
            <SidebarItem icon={Map} label="Quests" isActive={currentView === 'quests'} onClick={() => navigate('quests')} />
            <SidebarItem icon={Scroll} label="Blueprints" isActive={currentView === 'blueprints'} onClick={() => navigate('blueprints')} />
            <SidebarItem icon={Hammer} label="Workbench" isActive={currentView === 'crafting'} onClick={() => navigate('crafting')} />
            <SidebarItem icon={Trash2} label="Safe Items" isActive={currentView === 'safe-items'} onClick={() => navigate('safe-items')} />
            {isAdmin && (
              <SidebarItem icon={Settings} label="Database Manager" isActive={currentView === 'admin'} onClick={() => navigate('admin')} />
            )}
          </nav>
          
          {/* User Badge in Sidebar */}
          <div className="mt-8 mx-4 space-y-2">
            <div className="p-3 bg-arc-800 rounded border border-arc-700 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-arc-700 flex items-center justify-center text-arc-accent border border-arc-600">
                <User size={16} />
              </div>
              <div className="overflow-hidden flex-grow">
                <div className="text-xs text-gray-500 uppercase font-bold">Operator</div>
                <div className="text-sm text-white font-mono truncate">{user?.username || 'Raider'}</div>
                <div className="text-[10px] text-arc-gold font-mono tracking-wider mt-0.5">Expedition {profileData?.expeditionLevel || 0}</div>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (confirm('Logout from ARC Terminal?')) {
                  logout();
                }
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-arc-900 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded border border-arc-700 hover:border-red-900 transition-colors text-sm font-bold"
            >
              <LogOut size={14} />
              <span>LOGOUT</span>
            </button>
          </div>

          <div className="mt-4 px-4 text-xs text-gray-500">
            <p>Data sourced from community efforts. Not affiliated with Embark Studios.</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'home' && <HomeView onWipe={completeExpedition} profileData={profileData} />}
          {currentView === 'quests' && <QuestsView completedQuests={profileData?.completedQuests || []} onToggleQuest={toggleQuest} />}
          {currentView === 'blueprints' && <BlueprintsView ownedBlueprints={profileData?.ownedBlueprints || []} onToggleBlueprint={toggleBlueprint} />}
          {currentView === 'crafting' && <CraftingView />}
          {currentView === 'safe-items' && <SafeItemsView />}
          {currentView === 'admin' && isAdmin && <AdminView />}
        </div>
      </div>
    </div>
  );
}
