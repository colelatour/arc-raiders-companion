import React, { useState } from 'react';
import {
  Shield, Map, Scroll, Hammer, Search, CheckCircle, Circle, Menu, X, Info, ExternalLink, User,
  Terminal, Activity, AlertTriangle, Rocket, Twitter, LogOut, Loader, Settings, Star, Wrench, Package, Sun, Moon,
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useRaiderProfile } from './hooks/useRaiderProfile';
import { AllQuests, Blueprint, CompletedExpeditionItem, ExpeditionItem, ExpeditionPart, Workbench } from './types/types';
import TwitterTimeline from './components/TwitterTimeline';

type ViewState = 'home' | 'quests' | 'blueprints' | 'workbenches' | 'expedition';
type AppViewState = ViewState | 'settings' | 'search';

// --- Reusable Components ---

const SidebarItem = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full px-4 py-3 rounded transition-all duration-200 ${isActive ? 'bg-arc-accent text-white shadow-lg shadow-red-900/40' : 'text-gray-400 hover:text-white hover:bg-arc-800'}`}
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

// --- View Components ---

const QuestsView = ({
  quests,
  completedQuests,
  onToggleQuest
}: {
  quests: AllQuests[],
  completedQuests: number[],
  onToggleQuest: (questId: number) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = quests.filter(q =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.locations && q.locations.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (q.objectives && q.objectives.some(obj => obj.text.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const isCompleted = (questId: number) => completedQuests.includes(questId);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Quest Log" description="Track your mission progress" />
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search quests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        />
      </div>
      <div className="space-y-3">
        {filtered.map(quest => (
          <div key={quest.id} className={`bg-arc-800 rounded border transition-all ${isCompleted(quest.id) ? 'border-green-900/50 bg-green-950/10' : 'border-arc-700 hover:border-arc-600'}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => onToggleQuest(quest.id)} className="flex-shrink-0 transition-transform hover:scale-110">
                      {isCompleted(quest.id) ? <CheckCircle className="text-green-500" size={24} /> : <Circle className="text-gray-600" size={24} />}
                    </button>
                    <div>
                      <h3 className={`font-bold ${isCompleted(quest.id) ? 'text-green-400 line-through' : 'text-white'}`}>
                        Quest {quest.id}: {quest.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono"><Map size={12} className="inline mb-0.5 mr-1" />{quest.locations}</p>
                    </div>
                  </div>
                  <div className="ml-9 mt-2 space-y-1">
                    {quest.objectives?.map((obj, i) => (
                      <div key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-arc-accent mt-1">▸</span>
                        <span>{obj.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ml-9 mt-3 flex flex-wrap gap-2">
                    {quest.rewards?.map((reward, i) => (
                      <span key={i} className="text-xs bg-arc-900/50 text-arc-gold px-2 py-1 rounded border border-arc-700">{reward.text}</span>
                    ))}
                  </div>
                  {quest.url && (
                    <div className="ml-9 mt-3">
                      <a href={quest.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-arc-accent hover:text-red-400 transition-colors font-medium">
                        <ExternalLink size={16} />
                        Click here for walkthrough
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BlueprintsView = ({
  blueprints,
  ownedBlueprints,
  onToggleBlueprint
}: {
  blueprints: Blueprint[],
  ownedBlueprints: string[],
  onToggleBlueprint: (name: string) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("All");

  const workshops = ["All", ...Array.from(new Set(blueprints.map(b => b.workshop).filter(Boolean)))];

  const filtered = blueprints.filter(bp => {
    const matchesSearch = bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (bp.workshop && bp.workshop.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesWorkshop = workshopFilter === "All" || bp.workshop === workshopFilter;
    return matchesSearch && matchesWorkshop;
  });

  const isOwned = (name: string) => ownedBlueprints.includes(name);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Blueprints" description="Manage your schematics collection" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input type="text" placeholder="Search blueprints..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none" />
        </div>
        <select value={workshopFilter} onChange={(e) => setWorkshopFilter(e.target.value)} className="bg-arc-800 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none">
          {workshops.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(bp => (
          <div key={bp.id} onClick={() => onToggleBlueprint(bp.name)} className={`bg-arc-800 rounded border p-4 transition-all cursor-pointer ${isOwned(bp.name) ? 'border-blue-900/50 bg-blue-950/10' : 'border-arc-700 hover:border-arc-600'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">{isOwned(bp.name) ? <CheckCircle className="text-blue-500" size={20} /> : <Circle className="text-gray-600" size={20} />}</div>
              <div className="flex-grow min-w-0">
                <h3 className={`font-bold text-sm mb-1 ${isOwned(bp.name) ? 'text-blue-400' : 'text-white'}`}>{bp.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{bp.workshop}</p>
                {bp.recipe && <p className="text-xs text-gray-400 font-mono">{bp.recipe}</p>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {!!bp.is_lootable && <span className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">Lootable</span>}
                  {!!bp.is_quest_reward && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded">Quest</span>}
                  {!!bp.is_harvester_event && <span className="text-xs bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">Harvester</span>}
                  {!!bp.is_trails_reward && <span className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">Trails</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkbenchesView = ({
  workbenches,
  completedWorkbenches,
  onToggleWorkbench
}: {
  workbenches: Workbench[],
  completedWorkbenches: string[],
  onToggleWorkbench: (name: string) => void
}) => {
  const isCompleted = (name: string) => completedWorkbenches.includes(name);

  const groupedByCategory = workbenches.reduce((acc, wb) => {
    if (!acc[wb.category]) acc[wb.category] = [];
    acc[wb.category].push(wb);
    return acc;
  }, {} as Record<string, Workbench[]>);

  const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
    const orderA = groupedByCategory[a][0]?.display_order || 999;
    const orderB = groupedByCategory[b][0]?.display_order || 999;
    return orderA - orderB;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Workbench Progress" description="Track your station upgrades" />
      <div className="space-y-4">
        {sortedCategories.map(category => (
          <div key={category} className="bg-arc-800/50 rounded-lg border border-arc-700 overflow-hidden">
            <div className="bg-arc-800 border-b-2 border-arc-accent px-4 py-3">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><Hammer size={20} className="text-arc-accent" />{category}</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupedByCategory[category].map(wb => (
                <div key={wb.id} onClick={() => onToggleWorkbench(wb.name)} className={`flex items-center gap-3 p-3 rounded border transition-all cursor-pointer ${isCompleted(wb.name) ? 'bg-green-950/20 border-green-900/30' : 'bg-arc-900/50 border-arc-700/50 hover:border-arc-600'}`}>
                  <button className="flex-shrink-0">{isCompleted(wb.name) ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-600" size={20} />}</button>
                  <span className={`font-medium text-sm ${isCompleted(wb.name) ? 'text-green-400 line-through' : 'text-white'}`}>{wb.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExpeditionPartsView = ({
  expeditionParts,
  expeditionItems,
  completedExpeditionItems,
  onToggleExpeditionItem,
  expeditionLevel,
}: {
  expeditionParts: ExpeditionPart[],
  expeditionItems: ExpeditionItem[],
  completedExpeditionItems: CompletedExpeditionItem[],
  onToggleExpeditionItem: (partName: string, itemName: string) => void
  expeditionLevel: number,
}) => {
  const currentLevelRequirements = expeditionItems.filter(item => item.expedition_level === expeditionLevel);

  const isItemCompleted = (partName: string, itemName: string) => completedExpeditionItems.some(item => item.part_name === partName && item.item_name === itemName);

  const getMaterialsForPart = (partNumber: number) => currentLevelRequirements.filter(req => req.part_number === partNumber);

  const getCompletedItemsCount = (partNumber: number) => {
    const materials = getMaterialsForPart(partNumber);
    const partName = expeditionParts.find(p => p.part_number === partNumber)?.name || '';
    return materials.filter(mat => isItemCompleted(partName, mat.item_name)).length;
  };

  const isPartFullyCompleted = (partNumber: number) => {
    const materials = getMaterialsForPart(partNumber);
    const partName = expeditionParts.find(p => p.part_number === partNumber)?.name || '';
    return materials.length > 0 && materials.every(mat => isItemCompleted(partName, mat.item_name));
  };

  const fullyCompletedPartsCount = expeditionParts.filter(part => isPartFullyCompleted(part.part_number)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title={`Expedition ${expeditionLevel}`} description="Track your expedition completion progress" />
      <div className="bg-arc-800 rounded-xl p-6 border border-arc-700 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Expedition Progress</h3>
            <p className="text-gray-400">Complete all materials for each part to finish the expedition</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black text-arc-gold">{fullyCompletedPartsCount}<span className="text-3xl text-gray-600">/{expeditionParts.length}</span></div>
            <div className="text-sm text-gray-500 mt-1">{((fullyCompletedPartsCount / expeditionParts.length) * 100).toFixed(0)}% Complete</div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {expeditionParts.map(part => {
          const materials = getMaterialsForPart(part.part_number);
          if (materials.length === 0) return null; // Don't render parts with no requirements for the current level

          const completedCount = getCompletedItemsCount(part.part_number);
          const totalCount = materials.length;
          const isFullyCompleted = isPartFullyCompleted(part.part_number);

          return (
            <div key={part.id} className={`bg-arc-800/50 rounded-lg border transition-all ${isFullyCompleted ? 'border-green-900/50 bg-green-950/10' : 'border-arc-700 hover:border-arc-600'}`}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">{isFullyCompleted ? <CheckCircle className="text-green-500" size={28} /> : <Circle className="text-gray-600" size={28} />}</div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-2xl font-black ${isFullyCompleted ? 'text-green-400 line-through' : 'text-white'}`}>{part.name}</h4>
                      <div className="text-sm font-bold">
                        <span className={isFullyCompleted ? 'text-green-400' : 'text-arc-accent'}>{completedCount}/{totalCount}</span><span className="text-gray-500 ml-1">items</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {materials.map((mat, idx) => {
                        const itemCompleted = isItemCompleted(part.name, mat.item_name);
                        return (
                          <div key={idx} onClick={() => onToggleExpeditionItem(part.name, mat.item_name)} className={`flex items-center gap-3 p-3 rounded transition-all cursor-pointer ${itemCompleted ? 'bg-green-950/20 border border-green-900/30' : 'bg-arc-900/50 border border-arc-700/50 hover:border-arc-600'}`}>
                            <button className="flex-shrink-0">{itemCompleted ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-600" size={20} />}</button>
                            <div className="flex-grow grid grid-cols-3 gap-4">
                              <div className={`text-sm font-medium ${itemCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{mat.item_name}</div>
                              <div className={`text-sm font-mono font-bold ${itemCompleted ? 'text-gray-600' : 'text-arc-accent'}`}>{mat.quantity}</div>
                              <div className={`text-sm ${itemCompleted ? 'text-gray-600' : 'text-gray-400'}`}>{mat.location}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<AppViewState>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    isLoading,
    profileData,
    allQuests,
    allBlueprints,
    allWorkbenches,
    allExpeditionParts,
    allExpeditionItems,
    toggleQuest,
    toggleBlueprint,
    toggleWorkbench,
    toggleExpeditionItem,
  } = useRaiderProfile();

  if (!isAuthenticated) {
    // This part is handled by the AuthProvider, which redirects to LoginPage.
    // This return is a fallback.
    return <div className="h-screen w-full flex items-center justify-center bg-arc-900 text-white">Redirecting to login...</div>;
  }

  const renderView = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Loader size={48} className="animate-spin text-arc-accent" /></div>;
    }
    
    if (!profileData) {
      return <div className="text-center text-gray-500">Could not load Raider Profile.</div>;
    }

    switch (view) {
      case 'quests':
        return <QuestsView quests={allQuests} completedQuests={profileData.completedQuests} onToggleQuest={toggleQuest} />;
      case 'blueprints':
        return <BlueprintsView blueprints={allBlueprints} ownedBlueprints={profileData.ownedBlueprints} onToggleBlueprint={toggleBlueprint} />;
      case 'workbenches':
        return <WorkbenchesView workbenches={allWorkbenches} completedWorkbenches={profileData.completedWorkbenches} onToggleWorkbench={toggleWorkbench} />;
      case 'expedition':
        return <ExpeditionPartsView
                  expeditionParts={allExpeditionParts}
                  expeditionItems={allExpeditionItems}
                  completedExpeditionItems={profileData.completedExpeditionItems}
                  onToggleExpeditionItem={toggleExpeditionItem}
                  expeditionLevel={profileData.expeditionLevel}
                />;
      default:
        return <div>Home View Placeholder</div>;
    }
  };

  return (
    <div className={`flex h-screen bg-arc-900 text-gray-300 font-sans ${theme}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-arc-950 border-r border-arc-800 flex flex-col p-4`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-white">ARC <span className="text-arc-accent">Companion</span></h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <nav className="flex-grow space-y-2">
          <SidebarItem icon={Shield} label="Home" isActive={view === 'home'} onClick={() => setView('home')} />
          <SidebarItem icon={Scroll} label="Quests" isActive={view === 'quests'} onClick={() => setView('quests')} />
          <SidebarItem icon={Hammer} label="Blueprints" isActive={view === 'blueprints'} onClick={() => setView('blueprints')} />
          <SidebarItem icon={Wrench} label="Workbenches" isActive={view === 'workbenches'} onClick={() => setView('workbenches')} />
          <SidebarItem icon={Package} label="Expedition" isActive={view === 'expedition'} onClick={() => setView('expedition')} />
          <SidebarItem icon={Search} label="Raider Search" isActive={view === 'search'} onClick={() => setView('search')} />
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-2 p-2 rounded hover:bg-arc-800">
            <User size={20} className="text-gray-500" />
            <span className="text-sm font-medium">{user?.username || 'Raider'}</span>
          </div>
          <button onClick={toggleTheme} className="w-full flex items-center gap-2 p-2 rounded hover:bg-arc-800">
            {theme === 'dark' ? <Sun size={20} className="text-gray-500" /> : <Moon size={20} className="text-gray-500" />}
            <span className="text-sm font-medium">Toggle Theme</span>
          </button>
          <button onClick={logout} className="w-full flex items-center gap-2 p-2 rounded hover:bg-arc-800 text-red-500">
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-arc-950/50 backdrop-blur-sm border-b border-arc-800 px-6 py-3 flex items-center justify-between lg:justify-end">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white"><Menu size={24} /></button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome, {user?.username}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;