import React, { useState, useEffect, useMemo } from 'react';
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
  Plus,
  Trash,
  ChevronRight,
  Terminal,
  Activity,
  AlertTriangle,
  Skull,
  Twitter
} from 'lucide-react';
import { QUESTS, BLUEPRINTS, CRAFTING_ITEMS, SAFE_TO_RECYCLE, SAFE_TO_SELL } from './constants';
import { ViewState, SafeItem, CraftingItem } from './types';

// --- Helpers ---

const getExpeditionLevel = (user: string): number => {
  const stored = localStorage.getItem(`arc_${user}_expedition_level`);
  return stored ? parseInt(stored, 10) : 0;
};

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
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-arc-accent text-white font-semibold shadow-lg shadow-red-900/20' 
        : 'text-gray-400 hover:bg-arc-700 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

const SectionHeader = ({ title, description }: { title: string, description: string }) => (
  <div className="mb-6">
    <h2 className="text-3xl font-bold text-white mb-2 tracking-wide uppercase border-l-4 border-arc-accent pl-4">{title}</h2>
    <p className="text-gray-400 pl-5">{description}</p>
  </div>
);

const ProgressBar = ({ current, total, colorClass = "bg-arc-accent" }: { current: number, total: number, colorClass?: string }) => {
  const percentage = Math.round((current / total) * 100);
  return (
    <div className="w-full bg-arc-900 rounded-full h-2.5 border border-arc-700">
      <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

// --- Views ---

const HomeView = ({ 
  currentUser, 
  users, 
  onSelectUser, 
  onCreateUser, 
  onDeleteUser,
  navigate,
  onDataUpdate
}: { 
  currentUser: string, 
  users: string[], 
  onSelectUser: (u: string) => void, 
  onCreateUser: (u: string) => void, 
  onDeleteUser: (u: string) => void,
  navigate: (v: ViewState) => void,
  onDataUpdate: () => void
}) => {
  const [newUserName, setNewUserName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  
  // Calculate stats for current user
  const stats = useMemo(() => {
    const completedQuests = (JSON.parse(localStorage.getItem(`arc_${currentUser}_completed_quests`) || "[]") as number[]);
    const ownedBlueprints = (JSON.parse(localStorage.getItem(`arc_${currentUser}_owned_blueprints`) || "[]") as string[]);
    const expeditionLevel = getExpeditionLevel(currentUser);
    return {
      questsCompleted: completedQuests.length,
      totalQuests: QUESTS.length,
      blueprintsOwned: ownedBlueprints.length,
      totalBlueprints: BLUEPRINTS.length,
      expeditionLevel
    };
  }, [currentUser, showWipeModal]); // Re-calc when modal closes (implies update)

  // Load Twitter Widget Script
  useEffect(() => {
    const scriptUrl = "https://platform.twitter.com/widgets.js";
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
    } else {
        // Force reload of widgets if script exists (for navigation/re-mounts)
        // We add a small timeout to let the DOM settle before asking Twitter to scan
        setTimeout(() => {
            // @ts-ignore
            if (window.twttr && window.twttr.widgets) {
                // @ts-ignore
                window.twttr.widgets.load();
            }
        }, 100);
    }
  }, []);

  const handleCreate = () => {
    if (newUserName.trim()) {
      onCreateUser(newUserName.trim());
      setNewUserName("");
      setIsCreating(false);
    }
  };

  const handleConfirmExpedition = () => {
    // 1. Increment Expedition Level
    const newLevel = stats.expeditionLevel + 1;
    localStorage.setItem(`arc_${currentUser}_expedition_level`, newLevel.toString());

    // 2. Wipe Quest Data
    localStorage.removeItem(`arc_${currentUser}_completed_quests`);
    
    // 3. Wipe Blueprint Data
    localStorage.removeItem(`arc_${currentUser}_owned_blueprints`);

    // 4. Update UI
    setShowWipeModal(false);
    onDataUpdate(); // Triggers app-wide refresh
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
            
            <div className="bg-arc-900/80 p-4 rounded-lg border border-arc-600 backdrop-blur-sm">
               <div className="text-xs text-gray-500 uppercase font-bold mb-1">Current Status</div>
               <div className="text-3xl font-black text-arc-gold tracking-tight">EXPEDITION {stats.expeditionLevel}</div>
            </div>
          </div>
        </div>

        {/* User Selection & Expedition Controls */}
        <div className="mt-8 pt-6 border-t border-arc-700">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            {/* User Selector */}
            <div>
              <label className="text-xs font-mono text-gray-500 uppercase block mb-1">Active Profile</label>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <select 
                    value={currentUser}
                    onChange={(e) => onSelectUser(e.target.value)}
                    className="appearance-none bg-arc-900 text-white font-bold py-2 pl-4 pr-10 rounded border border-arc-600 focus:border-arc-accent focus:outline-none cursor-pointer hover:bg-arc-800 transition-colors min-w-[200px]"
                  >
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none rotate-90" size={16} />
                </div>
                
                {!isCreating ? (
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-arc-700 rounded transition-colors"
                    title="Create New Profile"
                  >
                    <Plus size={20} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="New profile name"
                      className="bg-arc-900 text-white px-3 py-2 rounded border border-arc-600 text-sm focus:border-arc-accent focus:outline-none"
                      autoFocus
                    />
                    <button onClick={handleCreate} className="text-xs bg-arc-accent text-white px-3 py-2 rounded font-bold">ADD</button>
                    <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
                  </div>
                )}
                
                {users.length > 1 && (
                  <button 
                    onClick={() => { if(confirm(`Delete profile "${currentUser}"?`)) onDeleteUser(currentUser); }}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-arc-900 rounded transition-colors"
                    title="Delete Current Profile"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Expedition Reset Button */}
            <div className="flex items-center">
              <button 
                onClick={() => setShowWipeModal(true)}
                className="group flex items-center gap-3 px-5 py-2 rounded border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-200 transition-all"
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold uppercase tracking-wider">Conclude Expedition</span>
                  <span className="text-[10px] opacity-60">Wipes Progress & Level Up</span>
                </div>
                <div className="p-2 bg-red-900/20 rounded-full group-hover:bg-red-600 group-hover:text-white transition-colors border border-red-900/50">
                  <ChevronRight size={18} />
                </div>
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Quest Status */}
        <div 
          onClick={() => navigate('quests')}
          className="bg-arc-800 p-6 rounded-lg border border-arc-700 hover:border-arc-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Map size={20} className="text-arc-accent" />
              Mission Log
            </h3>
            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completion</span>
              <span className="text-white font-mono">{stats.questsCompleted}/{stats.totalQuests}</span>
            </div>
            <ProgressBar current={stats.questsCompleted} total={stats.totalQuests} />
            <p className="text-xs text-gray-500 mt-2">
              Track active contracts and objective locations.
            </p>
          </div>
        </div>

        {/* Blueprint Status */}
        <div 
          onClick={() => navigate('blueprints')}
          className="bg-arc-800 p-6 rounded-lg border border-arc-700 hover:border-arc-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Scroll size={20} className="text-blue-500" />
              Schematics
            </h3>
            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Collected</span>
              <span className="text-white font-mono">{stats.blueprintsOwned}/{stats.totalBlueprints}</span>
            </div>
            <ProgressBar current={stats.blueprintsOwned} total={stats.totalBlueprints} colorClass="bg-blue-500" />
            <p className="text-xs text-gray-500 mt-2">
              Manage learned blueprints and recipe requirements.
            </p>
          </div>
        </div>

        {/* Quick Tips / Briefing */}
        <div className="bg-arc-900 p-6 rounded-lg border border-arc-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-300 mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
              <Info size={14} />
              Tactical Briefing
            </h3>
            <p className="text-gray-400 text-sm italic leading-relaxed border-l-2 border-arc-700 pl-3">
              "Remember Raider, items marked with a <span className="text-yellow-500">$</span> in the Safe Items list are high-value trinkets. Sell them. Recycle everything else for raw materials."
            </p>
          </div>
          <button 
            onClick={() => navigate('safe-items')}
            className="mt-4 text-xs font-bold text-arc-accent hover:underline self-start"
          >
            CHECK ITEM DATABASE &rarr;
          </button>
        </div>
      </div>

      {/* Twitter Feed */}
      <div className="bg-arc-800 rounded-lg border border-arc-700 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="bg-arc-900/80 p-4 border-b border-arc-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Twitter size={20} className="text-[#1DA1F2]" />
              <h3 className="text-lg font-bold text-white tracking-wide">Incoming Transmissions</h3>
            </div>
            <a href="https://twitter.com/ARCRaidersGame" target="_blank" rel="noreferrer" className="text-xs text-arc-accent hover:underline font-mono">
              @ARCRaidersGame
            </a>
        </div>
        <div className="p-4 bg-arc-800 flex-grow flex items-center justify-center">
            <a 
              className="twitter-timeline" 
              data-theme="dark" 
              data-height="500"
              data-chrome="noheader noborders transparent"
              href="https://twitter.com/ARCRaidersGame?ref_src=twsrc%5Etfw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex flex-col items-center gap-3 p-6 border border-arc-700 rounded-lg bg-arc-900/50 hover:bg-arc-900 transition-colors group">
                <span className="text-gray-400 font-mono text-sm">Unable to establish uplink?</span>
                <span className="text-arc-accent font-bold group-hover:underline flex items-center gap-2">
                   Open Comms Channel (Twitter) <ExternalLink size={14}/>
                </span>
              </div>
            </a>
        </div>
      </div>

      {/* Info Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="bg-arc-800/50 p-4 rounded-lg border border-arc-700">
          <h3 className="font-bold text-white text-sm mb-2">Database Info</h3>
          <p className="text-xs text-gray-400">
            This companion app allows you to track multiple profiles. Data is stored locally on your device. Clearing your browser cache will remove your progress.
          </p>
        </div>
        <div className="bg-arc-800/50 p-4 rounded-lg border border-arc-700">
          <h3 className="font-bold text-white text-sm mb-2">Credits</h3>
          <p className="text-xs text-gray-400 mb-2">
            Data sourced from community spreadsheets (Maleficent_Fee_9313).
          </p>
          <div className="flex gap-4">
            <a href="#" className="flex items-center text-xs text-arc-accent hover:underline">
              <ExternalLink size={12} className="mr-1" /> Original Sheet
            </a>
            <a href="#" className="flex items-center text-xs text-arc-accent hover:underline">
              <ExternalLink size={12} className="mr-1" /> Reddit Thread
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestsView: React.FC<{ currentUser: string }> = ({ currentUser }) => {
  const storageKey = `arc_${currentUser}_completed_quests`;
  
  const [completedQuests, setCompletedQuests] = useState<number[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as number[]) : [];
  });
  const [hideCompleted, setHideCompleted] = useState(false);
  const [search, setSearch] = useState("");

  // Save whenever state changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completedQuests));
  }, [completedQuests, storageKey]);

  const toggleQuest = (id: number) => {
    if (completedQuests.includes(id)) {
      setCompletedQuests(prev => prev.filter(q => q !== id));
    } else {
      setCompletedQuests(prev => [...prev, id]);
    }
  };

  const filteredQuests = QUESTS.filter(q => {
    const matchesSearch = q.name.toLowerCase().includes(search.toLowerCase()) || 
                          q.objectives.some(o => o.toLowerCase().includes(search.toLowerCase()));
    if (hideCompleted && completedQuests.includes(q.id)) return false;
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <SectionHeader title="Quest Log" description={`Tracking progress for: ${currentUser}`} />
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-arc-800 p-4 rounded-lg border border-arc-700 sticky top-4 z-20 shadow-lg">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search quests or objectives..." 
            className="w-full bg-arc-900 text-white pl-10 pr-4 py-2 rounded-md border border-arc-600 focus:border-arc-accent focus:outline-none placeholder-gray-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
           <input 
            type="checkbox" 
            id="hideCompleted"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 text-arc-accent focus:ring-arc-accent bg-arc-900"
          />
          <label htmlFor="hideCompleted" className="text-sm text-gray-300 cursor-pointer select-none">Hide Completed</label>
        </div>
      </div>

      <div className="space-y-3">
        {filteredQuests.map(quest => {
          const isComplete = completedQuests.includes(quest.id);
          return (
            <div 
              key={quest.id} 
              className={`bg-arc-800 rounded-lg border p-4 transition-all duration-200 ${
                isComplete ? 'border-arc-700 opacity-60' : 'border-arc-600 hover:border-gray-500 shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => toggleQuest(quest.id)}
                  className="mt-1 text-gray-400 hover:text-arc-accent transition-colors"
                >
                  {isComplete ? <CheckCircle className="text-green-500" size={24} /> : <Circle size={24} />}
                </button>
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <h3 className={`font-bold text-lg ${isComplete ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {quest.id}. {quest.name}
                    </h3>
                    <span className="text-xs font-mono bg-arc-900 text-gray-400 px-2 py-1 rounded border border-arc-700">
                      {quest.locations}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Objectives</h4>
                      <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                        {quest.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Rewards</h4>
                      <div className="flex flex-wrap gap-2">
                        {quest.rewards.map((reward, i) => (
                          <span key={i} className="text-xs bg-arc-700 text-arc-gold px-2 py-1 rounded border border-arc-600">
                            {reward}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredQuests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No quests found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

const BlueprintsView: React.FC<{ currentUser: string }> = ({ currentUser }) => {
  const storageKey = `arc_${currentUser}_owned_blueprints`;

  const [ownedBlueprints, setOwnedBlueprints] = useState<string[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as string[]) : [];
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(ownedBlueprints));
  }, [ownedBlueprints, storageKey]);

  const toggleBlueprint = (name: string) => {
    if (ownedBlueprints.includes(name)) {
      setOwnedBlueprints(prev => prev.filter(n => n !== name));
    } else {
      setOwnedBlueprints(prev => [...prev, name]);
    }
  };

  const filtered = BLUEPRINTS.filter(bp => 
    bp.name.toLowerCase().includes(search.toLowerCase()) ||
    bp.workshop.toLowerCase().includes(search.toLowerCase()) ||
    (bp.recipe && bp.recipe.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="Blueprints" description={`Managing schematics for: ${currentUser}`} />
      
      <div className="mb-6 bg-arc-800 p-4 rounded-lg border border-arc-700 sticky top-4 z-20 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search blueprints by name, workshop, or recipe..." 
            className="w-full bg-arc-900 text-white pl-10 pr-4 py-2 rounded-md border border-arc-600 focus:border-arc-accent focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((bp) => {
          const isOwned = ownedBlueprints.includes(bp.name);
          return (
            <div 
              key={bp.name} 
              className={`relative bg-arc-800 rounded-lg border p-4 flex flex-col justify-between transition-colors ${
                isOwned ? 'border-green-800 bg-arc-800/50' : 'border-arc-600 hover:border-arc-500'
              }`}
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => toggleBlueprint(bp.name)}>
                  {isOwned ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-600 hover:text-white" size={20} />}
                </button>
              </div>

              <div>
                <h3 className={`font-bold text-lg mb-1 pr-8 ${isOwned ? 'text-green-500' : 'text-white'}`}>{bp.name}</h3>
                <div className="text-xs text-arc-accent font-mono mb-3">{bp.workshop}</div>
                
                <div className="mb-3">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Recipe</span>
                  <p className="text-sm text-gray-300">{bp.recipe || "?"}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-2 border-t border-arc-700 pt-3">
                {bp.lootable && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-900">Loot</span>}
                {bp.questReward && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-900">Quest</span>}
                {bp.trailsReward && <span className="text-[10px] bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded border border-yellow-900">Trails</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WorkbenchView = () => {
  const [search, setSearch] = useState("");

  const STATION_ORDER = useMemo(() => [
      "Scrappy",
      "Gunsmith",
      "Gear Bench",
      "Medical Lab",
      "Explosives Bench",
      "Utility Station",
      "Refiner",
      "Expedition"
  ], []);

  // Helper to parse "Gunsmith 2" -> ["Gunsmith", 2]
  // Used for filtering and sorting
  const parseRequirement = (req: string) => {
      let normalized = req;
      if (req.startsWith("Part ")) {
        normalized = req.replace("Part ", "Expedition ");
      }
      
      // Find which station this belongs to
      const station = STATION_ORDER.find(s => normalized.startsWith(s));
      if (station) {
          // Extract number
          const match = normalized.match(/\d+/);
          const level = match ? parseInt(match[0], 10) : 0;
          return { valid: true, name: station, level, raw: normalized, original: req };
      }
      return { valid: false, name: req, level: 0, raw: req, original: req };
  };

  const groupedData = useMemo<Record<string, CraftingItem[]>>(() => {
    // 1. Filter
    const filtered = CRAFTING_ITEMS.filter(item => {
      const parsed = parseRequirement(item.neededFor);
      if (!parsed.valid) return false;

      const matchesSearch = 
        item.item.toLowerCase().includes(search.toLowerCase()) ||
        item.neededFor.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase());
      
      return matchesSearch;
    });

    // 2. Group
    const groups: Record<string, CraftingItem[]> = {};
    STATION_ORDER.forEach(s => groups[s] = []);

    filtered.forEach(item => {
      const parsed = parseRequirement(item.neededFor);
      if (groups[parsed.name]) {
        groups[parsed.name].push(item);
      }
    });

    // 3. Sort within groups
    STATION_ORDER.forEach(station => {
      groups[station].sort((a, b) => {
        const reqA = parseRequirement(a.neededFor);
        const reqB = parseRequirement(b.neededFor);
        if (reqA.level !== reqB.level) return reqA.level - reqB.level;
        return a.item.localeCompare(b.item);
      });
    });

    return groups;
  }, [search, STATION_ORDER]); 

  const renderRows = (items: CraftingItem[]) => {
    const result: React.ReactNode[] = [];
    let lastReqLabel = "";

    items.forEach((item, index) => {
      let currentReqLabel = item.neededFor;
      if (currentReqLabel.startsWith("Part ")) {
         currentReqLabel = "Expedition - " + currentReqLabel;
      }

      if (currentReqLabel !== lastReqLabel) {
        lastReqLabel = currentReqLabel;
        result.push(
          <tr key={`header-${lastReqLabel}-${index}`} className="bg-arc-900/50">
            <td colSpan={3} className="p-3 pl-4 font-bold text-arc-accent uppercase tracking-wider border-y border-arc-700">
              {currentReqLabel}
            </td>
          </tr>
        );
      }
      result.push(
        <tr key={`item-${index}`} className="hover:bg-arc-700/50 transition-colors">
          <td className="p-4 font-medium text-white pl-8">{item.item}</td>
          <td className="p-4 text-arc-gold font-mono">{item.quantity}</td>
          <td className="p-4 text-gray-400">{item.location}</td>
        </tr>
      );
    });
    return result;
  };

  // Check if any items exist total
  const hasItems = Object.values(groupedData).some((g: CraftingItem[]) => g.length > 0);

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="space-y-4">
          <SectionHeader title="Station Upgrades" description="Track the materials required to upgrade your workbenches and expedition progress." />
          <div className="bg-arc-800 p-4 rounded-lg border border-arc-700 sticky top-4 z-20 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search items, stations, or locations..." 
                className="w-full bg-arc-900 text-white pl-10 pr-4 py-2 rounded-md border border-arc-600 focus:border-arc-accent focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
      </div>

      {hasItems ? (
        STATION_ORDER.map(station => {
          const items = groupedData[station] || [];
          if (items.length === 0) return null;

          return (
            <div key={station} className="bg-arc-800 rounded-lg border border-arc-700 overflow-hidden shadow-xl">
               <div className="bg-arc-900/80 p-4 border-b border-arc-700 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Hammer size={20} className="text-arc-500" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide">{station}</h3>
                 </div>
                 <span className="text-xs font-mono text-gray-500 bg-arc-900 px-2 py-1 rounded border border-arc-700">{items.length} ITEMS</span>
               </div>
               <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-arc-900 border-b border-arc-700 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="p-4 pl-8">Item Name</th>
                      <th className="p-4 w-24">Qty</th>
                      <th className="p-4">Location / Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-700">
                    {renderRows(items)}
                  </tbody>
                </table>
               </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 text-gray-500 bg-arc-800 rounded-lg border border-arc-700">
          No items found matching your search.
        </div>
      )}
    </div>
  );
};

const SafeItemsView = () => {
  const [search, setSearch] = useState("");
  
  const allItems = [...SAFE_TO_RECYCLE, ...SAFE_TO_SELL];
  
  const filtered = allItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <SectionHeader title="Safe to Recycle/Sell" description="Quickly check if that item in your inventory is trash or treasure." />
      
      <div className="mb-6 bg-arc-800 p-4 rounded-lg border border-arc-700 sticky top-4 z-20 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search item name..." 
            className="w-full bg-arc-900 text-white pl-10 pr-4 py-2 rounded-md border border-arc-600 focus:border-arc-accent focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
           <h3 className="text-green-500 font-bold uppercase tracking-wider border-b border-green-900 pb-2 mb-4">Safe to Recycle (Materials)</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {filtered.filter(i => i.category === 'Recycle').map((item, idx) => (
               <div key={idx} className="bg-arc-800 p-3 rounded border border-arc-700 flex items-center justify-between group hover:border-green-800">
                 <span className="text-gray-300 group-hover:text-white">{item.name}</span>
                 <Trash2 size={14} className="text-green-700" />
               </div>
             ))}
           </div>
        </div>

        <div className="space-y-2">
           <h3 className="text-yellow-500 font-bold uppercase tracking-wider border-b border-yellow-900 pb-2 mb-4">Safe to Sell (Trinkets)</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             {filtered.filter(i => i.category === 'Sell').map((item, idx) => (
               <div key={idx} className="bg-arc-800 p-3 rounded border border-arc-700 flex items-center justify-between group hover:border-yellow-800">
                 <span className="text-gray-300 group-hover:text-white">{item.name}</span>
                 <span className="text-xs text-yellow-600 font-bold">$</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Layout ---

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0); // Used to trigger re-renders on data change
  
  // User Management State
  const [users, setUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('arc_users');
    return saved ? (JSON.parse(saved) as string[]) : ['Default Raider'];
  });
  
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('arc_current_user') || 'Default Raider';
  });

  // Persist user list
  useEffect(() => {
    localStorage.setItem('arc_users', JSON.stringify(users));
  }, [users]);

  // Persist current user selection
  useEffect(() => {
    localStorage.setItem('arc_current_user', currentUser);
  }, [currentUser]);

  // Migration Check (One-time) for legacy data
  useEffect(() => {
    const legacyQuests = localStorage.getItem('arc_completed_quests');
    const legacyBlueprints = localStorage.getItem('arc_owned_blueprints');
    const defaultQuestsKey = 'arc_Default Raider_completed_quests';
    
    // If we have legacy data but no specific data for Default Raider, migrate it.
    if ((legacyQuests || legacyBlueprints) && !localStorage.getItem(defaultQuestsKey)) {
      if (legacyQuests) localStorage.setItem('arc_Default Raider_completed_quests', legacyQuests);
      if (legacyBlueprints) localStorage.setItem('arc_Default Raider_owned_blueprints', legacyBlueprints);
      console.log("Migrated legacy data to 'Default Raider' profile.");
    }
  }, []);

  const createUser = (name: string) => {
    if (!users.includes(name)) {
      const newUsers = [...users, name];
      setUsers(newUsers);
      setCurrentUser(name);
    }
  };

  const deleteUser = (name: string) => {
    if (users.length <= 1) return; // Prevent deleting last user
    const newUsers = users.filter(u => u !== name);
    setUsers(newUsers);
    if (currentUser === name) {
      setCurrentUser(newUsers[0]);
    }
    // Cleanup storage
    localStorage.removeItem(`arc_${name}_completed_quests`);
    localStorage.removeItem(`arc_${name}_owned_blueprints`);
    localStorage.removeItem(`arc_${name}_expedition_level`);
  };

  const navigate = (view: ViewState) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo(0,0);
  };

  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  // Get current user's expedition level for the sidebar (will re-run when dataVersion changes)
  const currentExpeditionLevel = useMemo(() => {
    return getExpeditionLevel(currentUser);
  }, [currentUser, dataVersion]);

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
            <SidebarItem 
              icon={Shield} 
              label="Terminal" 
              isActive={currentView === 'home'} 
              onClick={() => navigate('home')} 
            />
            <SidebarItem 
              icon={Map} 
              label="Quests" 
              isActive={currentView === 'quests'} 
              onClick={() => navigate('quests')} 
            />
            <SidebarItem 
              icon={Scroll} 
              label="Blueprints" 
              isActive={currentView === 'blueprints'} 
              onClick={() => navigate('blueprints')} 
            />
            <SidebarItem 
              icon={Hammer} 
              label="Workbench" 
              isActive={currentView === 'crafting'} 
              onClick={() => navigate('crafting')} 
            />
            <SidebarItem 
              icon={Trash2} 
              label="Safe Items" 
              isActive={currentView === 'safe-items'} 
              onClick={() => navigate('safe-items')} 
            />
          </nav>
          
          {/* User Badge in Sidebar */}
          <div className="mt-8 mx-4 p-3 bg-arc-800 rounded border border-arc-700 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-arc-700 flex items-center justify-center text-arc-accent border border-arc-600">
              <User size={16} />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs text-gray-500 uppercase font-bold">Operator</div>
              <div className="text-sm text-white font-mono truncate">{currentUser}</div>
              <div className="text-[10px] text-arc-gold font-mono tracking-wider mt-0.5">Expedition {currentExpeditionLevel}</div>
            </div>
          </div>

          <div className="mt-4 px-4 text-xs text-gray-500">
            <p>Data sourced from community efforts. Not affiliated with Embark Studios.</p>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen lg:border-l border-arc-800">
          {currentView === 'home' && (
            <HomeView 
              currentUser={currentUser} 
              users={users} 
              onSelectUser={setCurrentUser} 
              onCreateUser={createUser} 
              onDeleteUser={deleteUser}
              navigate={navigate}
              onDataUpdate={refreshData}
            />
          )}
          
          {/* We use 'key' to force re-mounting when user changes, ensuring state is refreshed */}
          {currentView === 'quests' && <QuestsView key={currentUser} currentUser={currentUser} />}
          {currentView === 'blueprints' && <BlueprintsView key={currentUser} currentUser={currentUser} />}
          {currentView === 'crafting' && <WorkbenchView />}
          {currentView === 'safe-items' && <SafeItemsView />}
        </main>
      </div>
    </div>
  );
}