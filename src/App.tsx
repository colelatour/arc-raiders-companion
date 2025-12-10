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
  Rocket,
  Twitter,
  LogOut,
  Loader,
  Settings,
  Edit,
  Plus as PlusIcon,
  Trash as TrashIcon,
  Save,
  Users,
  Star,
  Wrench,
  Package,
  UserCog
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useRaiderProfile } from './hooks/useRaiderProfile';
import { admin, raider } from './utils/api';
import { QUESTS, BLUEPRINTS, CRAFTING_ITEMS, SAFE_TO_RECYCLE, SAFE_TO_SELL } from './utils/constants';
import { ViewState, SafeItem, CraftingItem } from './types/types';
import TwitterTimeline from './components/TwitterTimeline';

// Add admin and settings to ViewState
type AppViewState = ViewState | 'admin' | 'settings';

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
  onWipe: () => Promise<any>,
  profileData: any
}) => {
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [showExpeditionUnavailableModal, setShowExpeditionUnavailableModal] = useState(false);
  const [showExpeditionIncompleteModal, setShowExpeditionIncompleteModal] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [newExpeditionLevel, setNewExpeditionLevel] = useState(0);
  const [expeditionUnavailableMessage, setExpeditionUnavailableMessage] = useState('');
  const [expeditionIncompleteMessage, setExpeditionIncompleteMessage] = useState('');
  const [totalQuestsCount, setTotalQuestsCount] = useState(QUESTS.length);
  const [totalBlueprintsCount, setTotalBlueprintsCount] = useState(BLUEPRINTS.length);
  const [totalExpeditionItems, setTotalExpeditionItems] = useState(20);
  const [completedExpeditionItems, setCompletedExpeditionItems] = useState(0);
  const [raiderTip, setRaiderTip] = useState('');

  // Check for expedition completion on mount
  useEffect(() => {
    const justCompleted = sessionStorage.getItem('expeditionJustCompleted');
    const completedLevel = sessionStorage.getItem('completedExpeditionLevel');
    
    if (justCompleted === 'true' && completedLevel) {
      setNewExpeditionLevel(parseInt(completedLevel));
      setShowCongratulationsModal(true);
      // Clear the flags
      sessionStorage.removeItem('expeditionJustCompleted');
      sessionStorage.removeItem('completedExpeditionLevel');
    }
    
    // Load random tip
    const loadTip = async () => {
      try {
        const response = await raider.getRandomTip();
        setRaiderTip(response.data.tip);
      } catch (error) {
        console.error('Failed to load tip:', error);
        setRaiderTip('Stay alert, Raider!');
      }
    };
    
    loadTip();
  }, []);

  // Load actual counts from database
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [questsRes, blueprintsRes, expeditionReqRes] = await Promise.all([
          raider.getAllQuests(),
          admin.getAllBlueprints().catch(() => ({ data: { blueprints: BLUEPRINTS } })),
          raider.getExpeditionRequirements().catch(() => ({ data: { requirements: [] } }))
        ]);
        
        setTotalQuestsCount(questsRes.data.quests?.length || QUESTS.length);
        setTotalBlueprintsCount(blueprintsRes.data.blueprints?.length || BLUEPRINTS.length);
        setTotalExpeditionItems(expeditionReqRes.data.requirements?.length || 20);
        setCompletedExpeditionItems(profileData?.completedExpeditionItems?.length || 0);
      } catch (error) {
        console.error('Failed to load counts:', error);
        // Use constants as fallback
        setTotalQuestsCount(QUESTS.length);
        setTotalBlueprintsCount(BLUEPRINTS.length);
        setTotalExpeditionItems(20);
      }
    };
    
    loadCounts();
  }, [profileData?.completedExpeditionItems]);

  const handleConfirmExpedition = async () => {
    const result = await onWipe();
    console.log('📝 Expedition completion result:', result);
    setShowWipeModal(false);
    
    if (result && result.success) {
      // Store completion info in session storage
      const newLevel = result.newExpeditionLevel || stats.expeditionLevel + 1;
      console.log('✅ Expedition completed! New level:', newLevel);
      sessionStorage.setItem('expeditionJustCompleted', 'true');
      sessionStorage.setItem('completedExpeditionLevel', newLevel.toString());
      // The page will reload from the hook, and the modal will show on mount
    } else if (result && !result.success) {
      console.log('❌ Expedition failed:', result.error);
      if (result.error === 'EXPEDITION_NOT_AVAILABLE') {
        setExpeditionUnavailableMessage(result.message || 'Next expedition is not available yet!');
        setShowExpeditionUnavailableModal(true);
      } else if (result.error === 'EXPEDITION_INCOMPLETE') {
        setExpeditionIncompleteMessage(result.message || 'You must complete all expedition requirements!');
        setShowExpeditionIncompleteModal(true);
      }
    } else {
      console.log('⚠️ Unexpected result format:', result);
    }
  };

  const stats = {
    questsCompleted: Number(profileData?.questsCount) || 0,
    totalQuests: totalQuestsCount,
    blueprintsOwned: Number(profileData?.blueprintsCount) || 0,
    totalBlueprints: totalBlueprintsCount,
    expeditionLevel: profileData?.expeditionLevel || 0,
    workbenchesCompleted: Number(profileData?.workbenchesCount) || 0,
    expeditionItemsCompleted: completedExpeditionItems,
    totalExpeditionItems: totalExpeditionItems
  };

  // Debug logging
  console.log('📊 Stats:', stats);
  console.log('📊 Type checks:', {
    questsCompletedType: typeof stats.questsCompleted,
    totalQuestsType: typeof stats.totalQuests,
    blueprintsOwnedType: typeof stats.blueprintsOwned,
    totalBlueprintsType: typeof stats.totalBlueprints,
    questsCompletedValue: stats.questsCompleted,
    totalQuestsValue: stats.totalQuests,
    blueprintsOwnedValue: stats.blueprintsOwned,
    totalBlueprintsValue: stats.totalBlueprints,
    strictEqual: stats.questsCompleted === stats.totalQuests,
    looseEqual: stats.questsCompleted == stats.totalQuests
  });
  console.log(`Quests: ${stats.questsCompleted}/${stats.totalQuests} (${stats.questsCompleted === stats.totalQuests ? '✅ COMPLETE' : '❌ INCOMPLETE'})`);
  console.log(`Blueprints: ${stats.blueprintsOwned}/${stats.totalBlueprints} (${stats.blueprintsOwned === stats.totalBlueprints ? '✅ COMPLETE' : '❌ INCOMPLETE'})`);
  console.log(`Workbenches: ${stats.workbenchesCompleted}/19 (${stats.workbenchesCompleted === 19 ? '✅ COMPLETE' : '❌ INCOMPLETE'})`);
  console.log(`Expedition Items: ${stats.expeditionItemsCompleted}/${stats.totalExpeditionItems} (${stats.expeditionItemsCompleted === stats.totalExpeditionItems ? '✅ COMPLETE' : '❌ INCOMPLETE'})`);

  // Check if all categories are 100% complete
  const isFullyComplete = 
    stats.questsCompleted === stats.totalQuests &&
    stats.blueprintsOwned === stats.totalBlueprints &&
    stats.workbenchesCompleted === 19 &&
    stats.expeditionItemsCompleted === stats.totalExpeditionItems;

  console.log(`🎯 Fully Complete: ${isFullyComplete ? '✅ YES' : '❌ NO'}`);

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-red-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-red-900/50">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-red-900/30 p-4 rounded-full border border-red-700 text-red-500">
                  <Rocket size={48} />
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
      
      {/* Expedition Unavailable Modal */}
      {showExpeditionUnavailableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-yellow-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-yellow-900/50">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-yellow-900/30 p-4 rounded-full border border-yellow-700 text-yellow-500">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">Expedition Not Available</h3>
                <div className="text-gray-300 space-y-2">
                  <p className="text-lg">{expeditionUnavailableMessage}</p>
                  <p className="text-sm text-gray-400">Check back later when the next expedition has been released!</p>
                </div>
                
                <button 
                  onClick={() => setShowExpeditionUnavailableModal(false)}
                  className="w-full py-3 px-4 rounded bg-yellow-600 text-white hover:bg-yellow-700 font-bold tracking-wide shadow-lg shadow-yellow-900/40 transition-all transform hover:scale-105 mt-4"
                >
                  GOT IT
                </button>
             </div>
          </div>
        </div>
      )}
      
      {/* Expedition Incomplete Modal */}
      {showExpeditionIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-red-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-red-900/50">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-red-900/30 p-4 rounded-full border border-red-700 text-red-500">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">Expedition Incomplete</h3>
                <div className="text-gray-300 space-y-2">
                  <p className="text-lg">{expeditionIncompleteMessage}</p>
                  <p className="text-sm text-gray-400">Complete all expedition items before progressing to the next level.</p>
                </div>
                
                <button 
                  onClick={() => setShowExpeditionIncompleteModal(false)}
                  className="w-full py-3 px-4 rounded bg-red-600 text-white hover:bg-red-700 font-bold tracking-wide shadow-lg shadow-red-900/40 transition-all transform hover:scale-105 mt-4"
                >
                  GOT IT
                </button>
             </div>
          </div>
        </div>
      )}
      
      {/* Congratulations Modal */}
      {(() => {
        console.log('🔍 Checking congratulations modal:', showCongratulationsModal, 'New level:', newExpeditionLevel);
        return showCongratulationsModal;
      })() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-green-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-green-900/50">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-green-900/30 p-4 rounded-full border border-green-700 text-green-500 animate-pulse">
                  <Rocket size={48} />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-wider">
                  Congratulations, Raider!
                </h3>
                <div className="text-gray-300 space-y-3">
                  <p className="text-xl font-bold text-green-400">
                    You've completed Expedition {newExpeditionLevel - 1}!
                  </p>
                  <p className="text-lg">
                    You are now ready for <span className="text-arc-accent font-black">Expedition {newExpeditionLevel}</span>
                  </p>
                  <div className="bg-arc-800/50 rounded-lg p-4 border border-green-900/30 mt-4">
                    <p className="text-sm text-gray-400">
                      🎯 Your progress has been reset
                    </p>
                    <p className="text-sm text-gray-400">
                      🚀 New challenges await you
                    </p>
                    <p className="text-sm text-gray-400">
                      ⚡ Good luck on your journey!
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowCongratulationsModal(false)}
                  className="w-full py-3 px-4 rounded bg-green-600 text-white hover:bg-green-700 font-bold tracking-wide shadow-lg shadow-green-900/40 transition-all transform hover:scale-105 mt-4"
                >
                  LET'S GO!
                </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            <div className="bg-arc-900/50 rounded p-4 border border-arc-700">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expedition Level</div>
              <div className="text-3xl font-black text-arc-gold">{stats.expeditionLevel}</div>
            </div>
            <div className={`rounded p-4 border transition-all ${
              stats.questsCompleted === stats.totalQuests 
                ? 'bg-green-950/30 border-green-900/50' 
                : 'bg-arc-900/50 border-arc-700'
            }`}>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Quests Completed</div>
              <div className={`text-3xl font-black ${
                stats.questsCompleted === stats.totalQuests ? 'text-green-400' : 'text-white'
              }`}>
                {stats.questsCompleted}<span className="text-xl text-gray-600">/{stats.totalQuests}</span>
              </div>
            </div>
            <div className={`rounded p-4 border transition-all ${
              stats.blueprintsOwned === stats.totalBlueprints 
                ? 'bg-green-950/30 border-green-900/50' 
                : 'bg-arc-900/50 border-arc-700'
            }`}>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Blueprints Owned</div>
              <div className={`text-3xl font-black ${
                stats.blueprintsOwned === stats.totalBlueprints ? 'text-green-400' : 'text-white'
              }`}>
                {stats.blueprintsOwned}<span className="text-xl text-gray-600">/{stats.totalBlueprints}</span>
              </div>
            </div>
            <div className={`rounded p-4 border transition-all ${
              (profileData?.workbenchesCount || 0) === 19
                ? 'bg-green-950/30 border-green-900/50' 
                : 'bg-arc-900/50 border-arc-700'
            }`}>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Workbenches Completed</div>
              <div className={`text-3xl font-black ${
                (profileData?.workbenchesCount || 0) === 19 ? 'text-green-400' : 'text-white'
              }`}>
                {profileData?.workbenchesCount || 0}<span className="text-xl text-gray-600">/19</span>
              </div>
            </div>
            <div className={`rounded p-4 border transition-all ${
              stats.expeditionItemsCompleted === stats.totalExpeditionItems
                ? 'bg-green-950/30 border-green-900/50' 
                : 'bg-arc-900/50 border-arc-700'
            }`}>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expedition</div>
              <div className={`text-3xl font-black ${
                stats.expeditionItemsCompleted === stats.totalExpeditionItems ? 'text-green-400' : 'text-white'
              }`}>
                {stats.expeditionItemsCompleted}<span className="text-xl text-gray-600">/{stats.totalExpeditionItems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 100% Completion Message */}
        {isFullyComplete && (
          <div className="mt-6 animate-fade-in">
            <div className="bg-gradient-to-r from-green-950/50 via-green-900/30 to-green-950/50 border-2 border-green-500 rounded-xl p-6 shadow-2xl shadow-green-900/50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 bg-green-500 text-white p-3 rounded-full animate-pulse">
                  <CheckCircle size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-green-400 mb-2 uppercase tracking-wide">
                    🎉 100% Complete - Ready for Expedition!
                  </h3>
                  <p className="text-green-200 text-lg mb-4">
                    You are ready for your expedition! Go ahead and click the "Complete Expedition" button below and start your new journey.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-300/80">
                    <Info size={16} />
                    <span>All quests, blueprints, workbenches, and expedition parts completed!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expedition Controls */}
        <div className="mt-8 pt-6 border-t border-arc-700">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">

            {/* Expedition Reset Button */}
            <div className="flex items-center">
              <button 
                onClick={() => setShowWipeModal(true)}
                className="group flex items-center gap-3 px-5 py-2 rounded border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-200 transition-all"
              >
                <Rocket size={18} className="group-hover:animate-pulse" />
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
          <div className="bg-arc-accent/20 rounded-full p-2">
            💡
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">Raider Tip</h3>
        </div>
        {raiderTip ? (
          <div className="bg-gradient-to-br from-arc-accent/10 to-transparent rounded-lg p-4 border border-arc-accent/30">
            <p className="text-gray-300 leading-relaxed">{raiderTip}</p>
          </div>
        ) : (
          <div className="bg-arc-900/50 rounded-lg p-4 border border-arc-700">
            <p className="text-gray-400 italic">Loading tip...</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-arc-700">
          <p className="text-xs text-gray-500 text-center">
            💡 Refresh the page for a new tip
          </p>
        </div>
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
        <div className="bg-arc-800 flex-grow">
            <TwitterTimeline 
              username="ARCRaidersGame" 
              tweetLimit={5} 
              theme="dark" 
            />
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
  const [quests, setQuests] = useState<Quest[]>(QUESTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setIsLoading(true);
      const response = await raider.getAllQuests();
      
      console.log('🔍 Loading quests from API...');
      console.log('📊 API returned:', response.data.quests?.length, 'quests');
      
      // Merge API quests with constants
      // Use API data if available, fall back to constants for missing data
      const apiQuests = response.data.quests || [];
      
      console.log('📊 QUESTS constant has:', QUESTS.length, 'quests');
      console.log('📊 API quests:', apiQuests.length);
      
      // Create an object map of API quests for quick lookup (avoiding Map constructor conflict)
      const apiQuestMap: Record<number, any> = {};
      apiQuests.forEach((q: any) => {
        apiQuestMap[q.id] = q;
      });
      
      // Merge: use API data when available, constants as fallback
      const mergedQuests = QUESTS.map(constantQuest => {
        const apiQuest = apiQuestMap[constantQuest.id];
        if (apiQuest) {
          // Use API quest but ensure objectives and rewards from constants if API data is empty
          return {
            ...constantQuest,
            ...apiQuest,
            objectives: (apiQuest.objectives && apiQuest.objectives.length > 0) 
              ? apiQuest.objectives 
              : constantQuest.objectives,
            rewards: (apiQuest.rewards && apiQuest.rewards.length > 0) 
              ? apiQuest.rewards 
              : constantQuest.rewards
          };
        }
        return constantQuest;
      });
      
      console.log('📊 After merging with constants:', mergedQuests.length);
      
      // Add any new quests from API that aren't in constants
      apiQuests.forEach((apiQuest: any) => {
        if (!QUESTS.find(q => q.id === apiQuest.id)) {
          console.log('✅ Found NEW quest from API:', apiQuest.id, apiQuest.name);
          mergedQuests.push(apiQuest);
        }
      });
      
      console.log('📊 After adding new quests:', mergedQuests.length);
      
      // Sort by ID
      mergedQuests.sort((a, b) => a.id - b.id);
      
      console.log('📊 Final quest list:', mergedQuests.map(q => ({ id: q.id, name: q.name })));
      
      setQuests(mergedQuests);
    } catch (error) {
      console.error('Failed to load quests from API:', error);
      // Fallback to constants if API fails
      setQuests(QUESTS);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = quests.filter(q =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.locations && q.locations.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (q.objectives && q.objectives.some(obj => obj.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const isCompleted = (questId: number) => completedQuests.includes(questId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-arc-accent" size={48} />
      </div>
    );
  }

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
                    {quest.objectives && quest.objectives.map((obj, i) => (
                      <div key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-arc-accent mt-1">▸</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>

                  {/* Rewards */}
                  <div className="ml-9 mt-3 flex flex-wrap gap-2">
                    {quest.rewards && quest.rewards.map((reward, i) => (
                      <span
                        key={i}
                        className="text-xs bg-arc-900/50 text-arc-gold px-2 py-1 rounded border border-arc-700"
                      >
                        {reward}
                      </span>
                    ))}
                  </div>

                  {/* Quest URL Link */}
                  {quest.url && (
                    <div className="ml-9 mt-3">
                      <a
                        href={quest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-arc-accent hover:text-red-400 transition-colors font-medium"
                      >
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No quests found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Attribution */}
      <div className="mt-8 pt-4 border-t border-arc-700 text-center">
        <p className="text-sm text-gray-500">
          Quest walkthroughs sourced from{' '}
          <a
            href="https://patchcrazy.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-arc-accent hover:text-red-400 transition-colors underline"
          >
            patchcrazy.co.uk
          </a>
        </p>
      </div>
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

// --- Workbenches View ---
const WorkbenchesView = ({ 
  completedWorkbenches,
  onToggleWorkbench
}: { 
  completedWorkbenches: string[],
  onToggleWorkbench: (name: string) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [workbenches, setWorkbenches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkbenches();
  }, []);

  const loadWorkbenches = async () => {
    try {
      setIsLoading(true);
      const response = await raider.getAllWorkbenches();
      setWorkbenches(response.data.workbenches);
    } catch (error) {
      console.error('Failed to load workbenches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(workbenches.map(w => w.category)))];

  const filtered = workbenches.filter(wb => {
    const matchesSearch = wb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          wb.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || wb.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isCompleted = (name: string) => completedWorkbenches.includes(name);

  // Group by category
  const groupedByCategory = filtered.reduce((acc, wb) => {
    if (!acc[wb.category]) {
      acc[wb.category] = [];
    }
    acc[wb.category].push(wb);
    return acc;
  }, {} as Record<string, typeof filtered>);

  // Sort categories by display_order (get the first item's display_order for each category)
  const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
    const orderA = groupedByCategory[a][0]?.display_order || 999;
    const orderB = groupedByCategory[b][0]?.display_order || 999;
    return orderA - orderB;
  });

  // Get materials for a workbench level from CRAFTING_ITEMS
  const getMaterialsForWorkbench = (workbenchName: string) => {
    return CRAFTING_ITEMS.filter(item => item.neededFor === workbenchName);
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
      <SectionHeader title="Workbench Progress" description="Track your station upgrades and view requirements" />

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search workbenches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-arc-800 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Workbenches by Category */}
      <div className="space-y-4">
        {sortedCategories.map(category => (
          <div key={category} className="bg-arc-800/50 rounded-lg border border-arc-700 overflow-hidden">
            <div className="bg-arc-800 border-b-2 border-arc-accent px-4 py-3">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Hammer size={20} className="text-arc-accent" />
                {category}
                <span className="text-xs text-gray-500 font-normal ml-2">
                  ({groupedByCategory[category].filter(wb => isCompleted(wb.name)).length}/{groupedByCategory[category].length} completed)
                </span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {groupedByCategory[category].map(wb => {
                const materials = getMaterialsForWorkbench(wb.name);
                const completed = isCompleted(wb.name);
                
                return (
                  <div
                    key={wb.id}
                    className={`
                      bg-arc-900/50 rounded-lg border transition-all
                      ${completed
                        ? 'border-green-900/50 bg-green-950/10'
                        : 'border-arc-700 hover:border-arc-600'
                      }
                    `}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => onToggleWorkbench(wb.name)}
                          className="flex-shrink-0 mt-1 transition-transform hover:scale-110"
                        >
                          {completed ? (
                            <CheckCircle className="text-green-500" size={24} />
                          ) : (
                            <Circle className="text-gray-600" size={24} />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-grow">
                          <h4 className={`text-lg font-bold mb-2 ${completed ? 'text-green-400 line-through' : 'text-white'}`}>
                            {wb.name}
                          </h4>

                          {/* Materials Required */}
                          {materials.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 uppercase font-bold">Materials Required:</p>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-arc-900/70">
                                    <tr>
                                      <th className="text-left p-2 text-xs uppercase text-gray-500 font-bold">Item</th>
                                      <th className="text-left p-2 text-xs uppercase text-gray-500 font-bold">Quantity</th>
                                      <th className="text-left p-2 text-xs uppercase text-gray-500 font-bold">Location</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {materials.map((mat, idx) => (
                                      <tr key={idx} className="border-t border-arc-700/50">
                                        <td className="p-2 text-sm text-white">{mat.item}</td>
                                        <td className="p-2 text-sm text-arc-accent font-mono">{mat.quantity}</td>
                                        <td className="p-2 text-sm text-gray-400">{mat.location}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No materials data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No workbenches found</p>
        </div>
      )}
    </div>
  );
};

// --- Expedition View ---
const ExpeditionPartsView = ({
  completedExpeditionParts,
  completedExpeditionItems,
  onToggleExpeditionItem
}: {
  completedExpeditionParts: string[],
  completedExpeditionItems: { part_name: string, item_name: string }[],
  onToggleExpeditionItem: (partName: string, itemName: string) => void
}) => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [expeditionLevel, setExpeditionLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setIsLoading(true);
      const response = await raider.getExpeditionRequirements();
      setExpeditionLevel(response.data.expeditionLevel);
      setRequirements(response.data.requirements);
    } catch (error) {
      console.error('Failed to load expedition requirements:', error);
      // Fallback to constants if API fails
      setRequirements([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if an individual item is completed
  const isItemCompleted = (partName: string, itemName: string) => {
    return completedExpeditionItems.some(
      item => item.part_name === partName && item.item_name === itemName
    );
  };

  // Get materials for an expedition part from loaded requirements
  const getMaterialsForPart = (partNumber: number) => {
    return requirements.filter(req => req.part_number === partNumber);
  };

  // Get count of completed items for a part
  const getCompletedItemsCount = (partNumber: number) => {
    const materials = getMaterialsForPart(partNumber);
    return materials.filter(mat => isItemCompleted(`Part ${partNumber}`, mat.item_name)).length;
  };

  // Check if all items in a part are completed
  const isPartFullyCompleted = (partNumber: number) => {
    const materials = getMaterialsForPart(partNumber);
    return materials.length > 0 && materials.every(mat => isItemCompleted(`Part ${partNumber}`, mat.item_name));
  };

  const parts = [1, 2, 3, 4, 5];

  // Count how many parts are fully completed
  const fullyCompletedParts = parts.filter(part => isPartFullyCompleted(part)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-arc-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader 
        title={`Expedition ${expeditionLevel}`} 
        description="Track your expedition completion progress" 
      />

      {/* Progress Summary */}
      <div className="bg-arc-800 rounded-xl p-6 border border-arc-700 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Expedition Progress</h3>
            <p className="text-gray-400">Complete all materials for each part to finish the expedition</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-black text-arc-gold">
              {fullyCompletedParts}<span className="text-3xl text-gray-600">/5</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {((fullyCompletedParts / 5) * 100).toFixed(0)}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Expedition */}
      <div className="space-y-4">
        {parts.map(partNumber => {
          const materials = getMaterialsForPart(partNumber);
          const completedCount = getCompletedItemsCount(partNumber);
          const totalCount = materials.length;
          const fullyCompleted = isPartFullyCompleted(partNumber);
          const partName = `Part ${partNumber}`;
          
          return (
            <div
              key={partNumber}
              className={`
                bg-arc-800/50 rounded-lg border transition-all
                ${fullyCompleted
                  ? 'border-green-900/50 bg-green-950/10'
                  : 'border-arc-700 hover:border-arc-600'
                }
              `}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {fullyCompleted ? (
                      <CheckCircle className="text-green-500" size={28} />
                    ) : (
                      <Circle className="text-gray-600" size={28} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-2xl font-black ${fullyCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                        {partName}
                      </h4>
                      <div className="text-sm font-bold">
                        <span className={fullyCompleted ? 'text-green-400' : 'text-arc-accent'}>
                          {completedCount}/{totalCount}
                        </span>
                        <span className="text-gray-500 ml-1">items</span>
                      </div>
                    </div>

                    {/* Materials Checklist */}
                    {materials.length > 0 ? (
                      <div className="space-y-2">
                        {materials.map((mat, idx) => {
                          const itemCompleted = isItemCompleted(partName, mat.item_name);
                          
                          return (
                            <div
                              key={idx}
                              className={`
                                flex items-center gap-3 p-3 rounded
                                transition-all
                                ${itemCompleted
                                  ? 'bg-green-950/20 border border-green-900/30'
                                  : 'bg-arc-900/50 border border-arc-700/50 hover:border-arc-600'
                                }
                              `}
                            >
                              {/* Checkbox */}
                              <button
                                onClick={() => onToggleExpeditionItem(partName, mat.item_name)}
                                className="flex-shrink-0 transition-transform hover:scale-110"
                              >
                                {itemCompleted ? (
                                  <CheckCircle className="text-green-500" size={20} />
                                ) : (
                                  <Circle className="text-gray-600" size={20} />
                                )}
                              </button>

                              {/* Item Details */}
                              <div className="flex-grow grid grid-cols-3 gap-4">
                                <div className={`text-sm font-medium ${itemCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                                  {mat.item_name}
                                </div>
                                <div className={`text-sm font-mono font-bold ${itemCompleted ? 'text-gray-600' : 'text-arc-accent'}`}>
                                  {mat.quantity}
                                </div>
                                <div className={`text-sm ${itemCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {mat.location}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No materials required</p>
                    )}
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

// --- Raider Search View ---
const RaiderSearchView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [allQuests, setAllQuests] = useState<any[]>([]);
  const [allBlueprints, setAllBlueprints] = useState<any[]>([]);
  const [questSearchQuery, setQuestSearchQuery] = useState("");
  const [blueprintSearchQuery, setBlueprintSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    loadGameData();
    loadFavorites();
  }, []);

  const loadGameData = async () => {
    try {
      const [questsRes, blueprintsRes] = await Promise.all([
        raider.getAllQuests(),
        admin.getAllBlueprints().catch(() => ({ data: { blueprints: BLUEPRINTS } }))
      ]);
      setAllQuests(questsRes.data.quests || QUESTS);
      setAllBlueprints(blueprintsRes.data.blueprints || BLUEPRINTS);
    } catch (err) {
      console.error('Failed to load game data:', err);
      setAllQuests(QUESTS);
      setAllBlueprints(BLUEPRINTS);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const response = await raider.getFavorites();
      setFavorites(response.data.favorites);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a username to search');
      return;
    }

    setIsLoading(true);
    setError("");
    setSearchResult(null);
    setQuestSearchQuery(""); // Reset search filters
    setBlueprintSearchQuery(""); // Reset search filters

    try {
      const response = await raider.searchRaider(searchQuery.trim());
      setSearchResult(response.data.raider);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(`Username "${searchQuery}" not found`);
      } else {
        setError('Failed to search for raider. Please try again.');
      }
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavoriteRaider = async (raiderName: string) => {
    setSearchQuery(raiderName);
    setIsLoading(true);
    setError("");
    setSearchResult(null);
    setQuestSearchQuery("");
    setBlueprintSearchQuery("");

    try {
      const response = await raider.searchRaider(raiderName);
      setSearchResult(response.data.raider);
    } catch (err: any) {
      setError('Failed to load raider. They may no longer exist.');
      console.error('Load favorite error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!searchResult) return;

    try {
      if (searchResult.isFavorited) {
        await raider.removeFavorite(searchResult.profileId);
        setSearchResult({ ...searchResult, isFavorited: false });
      } else {
        await raider.addFavorite(searchResult.profileId);
        setSearchResult({ ...searchResult, isFavorited: true });
      }
      loadFavorites(); // Refresh favorites list
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  // Filter quests based on search query
  const filteredQuests = allQuests.filter(quest =>
    quest.name.toLowerCase().includes(questSearchQuery.toLowerCase()) ||
    quest.id.toString().includes(questSearchQuery)
  );

  // Filter blueprints based on search query
  const filteredBlueprints = allBlueprints.filter(blueprint =>
    blueprint.name.toLowerCase().includes(blueprintSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Raider Search" description="Search for raiders and view their progress" />

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? <Loader className="animate-spin" size={18} /> : <Search size={18} />}
            Search
          </button>
          {(searchResult || error) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResult(null);
                setError('');
                setQuestSearchQuery('');
                setBlueprintSearchQuery('');
              }}
              className="px-6 py-3 bg-arc-700 text-gray-300 rounded font-bold hover:bg-arc-600 hover:text-white transition-colors flex items-center gap-2"
              title="Clear search"
            >
              <X size={18} />
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Favorite Raiders */}
      {favorites.length > 0 && (
        <div className="bg-arc-800 rounded-lg border border-arc-700 p-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <Star size={18} className="text-arc-gold" />
            Favorite Raiders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.map(fav => (
              <button
                key={fav.id}
                onClick={() => loadFavoriteRaider(fav.username)}
                className="bg-arc-900/50 border border-arc-700 rounded p-3 hover:bg-arc-700 hover:border-arc-accent transition-all text-left group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate group-hover:text-arc-accent transition-colors">
                      {fav.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expedition {fav.expedition_level}
                    </div>
                  </div>
                  <Star size={14} className="text-arc-gold flex-shrink-0" fill="currentColor" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-900 rounded p-4 text-red-400">
          <AlertTriangle size={18} className="inline mr-2" />
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResult && (
        <div className="space-y-6">
          {/* Raider Info Card */}
          <div className="bg-arc-800 rounded-xl p-6 border border-arc-700 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-3xl font-black text-white mb-2">{searchResult.username}</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expedition Level</div>
                  <div className="text-4xl font-black text-arc-gold">{searchResult.expeditionLevel}</div>
                </div>
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-lg border transition-all ${
                    searchResult.isFavorited
                      ? 'bg-arc-gold/20 border-arc-gold text-arc-gold hover:bg-arc-gold/30'
                      : 'bg-arc-900 border-arc-700 text-gray-400 hover:bg-arc-800 hover:border-arc-gold hover:text-arc-gold'
                  }`}
                  title={searchResult.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={24} fill={searchResult.isFavorited ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded p-4 border transition-all ${
                searchResult.stats.totalQuestsCompleted === allQuests.length
                  ? 'bg-green-950/30 border-green-900/50'
                  : 'bg-arc-900/50 border-arc-700'
              }`}>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Quests Completed</div>
                <div className={`text-2xl font-black ${
                  searchResult.stats.totalQuestsCompleted === allQuests.length ? 'text-green-400' : 'text-white'
                }`}>
                  {searchResult.stats.totalQuestsCompleted}
                  <span className="text-lg text-gray-600">/{allQuests.length}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {allQuests.length > 0 ? ((searchResult.stats.totalQuestsCompleted / allQuests.length) * 100).toFixed(1) : 0}% complete
                </div>
              </div>
              <div className={`rounded p-4 border transition-all ${
                searchResult.stats.totalBlueprintsOwned === allBlueprints.length
                  ? 'bg-green-950/30 border-green-900/50'
                  : 'bg-arc-900/50 border-arc-700'
              }`}>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Blueprints Owned</div>
                <div className={`text-2xl font-black ${
                  searchResult.stats.totalBlueprintsOwned === allBlueprints.length ? 'text-green-400' : 'text-white'
                }`}>
                  {searchResult.stats.totalBlueprintsOwned}
                  <span className="text-lg text-gray-600">/{allBlueprints.length}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {allBlueprints.length > 0 ? ((searchResult.stats.totalBlueprintsOwned / allBlueprints.length) * 100).toFixed(1) : 0}% complete
                </div>
              </div>
              <div className={`rounded p-4 border transition-all ${
                searchResult.stats.totalWorkbenchesCompleted === 19
                  ? 'bg-green-950/30 border-green-900/50'
                  : 'bg-arc-900/50 border-arc-700'
              }`}>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Workbenches Completed</div>
                <div className={`text-2xl font-black ${
                  searchResult.stats.totalWorkbenchesCompleted === 19 ? 'text-green-400' : 'text-white'
                }`}>
                  {searchResult.stats.totalWorkbenchesCompleted}
                  <span className="text-lg text-gray-600">/19</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {((searchResult.stats.totalWorkbenchesCompleted / 19) * 100).toFixed(1)}% complete
                </div>
              </div>
              <div className={`rounded p-4 border transition-all ${
                searchResult.stats.totalExpeditionPartsCompleted === 5
                  ? 'bg-green-950/30 border-green-900/50'
                  : 'bg-arc-900/50 border-arc-700'
              }`}>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expedition</div>
                <div className={`text-2xl font-black ${
                  searchResult.stats.totalExpeditionPartsCompleted === 5 ? 'text-green-400' : 'text-white'
                }`}>
                  {searchResult.stats.totalExpeditionPartsCompleted}
                  <span className="text-lg text-gray-600">/5</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {((searchResult.stats.totalExpeditionPartsCompleted / 5) * 100).toFixed(0)}% complete
                </div>
              </div>
            </div>
          </div>

          {/* Completed Quests */}
          <div className="bg-arc-800/50 rounded-lg border border-arc-700 overflow-hidden">
            <div className="bg-arc-800 border-b-2 border-arc-accent px-4 py-3">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Scroll size={20} className="text-arc-accent" />
                Completed Quests ({searchResult.stats.totalQuestsCompleted}/{allQuests.length})
              </h3>
            </div>
            
            {/* Quest Search Bar */}
            <div className="p-4 border-b border-arc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search quests by name or number..."
                  value={questSearchQuery}
                  onChange={(e) => setQuestSearchQuery(e.target.value)}
                  className="w-full bg-arc-900 text-white pl-10 pr-4 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {filteredQuests.map(quest => {
                const isCompleted = searchResult.questsCompleted.includes(quest.id);
                return (
                  <div
                    key={quest.id}
                    className={`p-3 rounded border transition-all ${
                      isCompleted
                        ? 'bg-green-950/20 border-green-900/50'
                        : 'bg-arc-900/30 border-arc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                      ) : (
                        <Circle className="text-gray-600 flex-shrink-0" size={20} />
                      )}
                      <div className="flex-grow">
                        <span className={`font-medium ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                          Quest {quest.id}: {quest.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredQuests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No quests found matching "{questSearchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Owned Blueprints */}
          <div className="bg-arc-800/50 rounded-lg border border-arc-700 overflow-hidden">
            <div className="bg-arc-800 border-b-2 border-arc-accent px-4 py-3">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Hammer size={20} className="text-arc-accent" />
                Owned Blueprints ({searchResult.stats.totalBlueprintsOwned}/{allBlueprints.length})
              </h3>
            </div>
            
            {/* Blueprint Search Bar */}
            <div className="p-4 border-b border-arc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search blueprints by name..."
                  value={blueprintSearchQuery}
                  onChange={(e) => setBlueprintSearchQuery(e.target.value)}
                  className="w-full bg-arc-900 text-white pl-10 pr-4 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredBlueprints.map(blueprint => {
                const isOwned = searchResult.blueprintsOwned.includes(blueprint.name);
                return (
                  <div
                    key={blueprint.name}
                    className={`p-3 rounded border transition-all ${
                      isOwned
                        ? 'bg-blue-950/20 border-blue-900/50'
                        : 'bg-arc-900/30 border-arc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isOwned ? (
                        <CheckCircle className="text-blue-500 flex-shrink-0" size={16} />
                      ) : (
                        <Circle className="text-gray-600 flex-shrink-0" size={16} />
                      )}
                      <span className={`text-sm font-medium ${isOwned ? 'text-blue-400' : 'text-gray-400'}`}>
                        {blueprint.name}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredBlueprints.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Search size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No blueprints found matching "{blueprintSearchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Completed Workbenches */}
          <div className="bg-arc-800/50 rounded-lg border border-arc-700 overflow-hidden">
            <div className="bg-arc-800 border-b-2 border-arc-accent px-4 py-3">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Wrench size={20} className="text-arc-accent" />
                Completed Workbenches ({searchResult.stats.totalWorkbenchesCompleted}/19)
              </h3>
            </div>
            
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {/* Scrappy */}
              {['Scrappy 2', 'Scrappy 3', 'Scrappy 4', 'Scrappy 5'].map(wb => {
                const isCompleted = searchResult.workbenchesCompleted?.includes(wb);
                return (
                  <div
                    key={wb}
                    className={`p-3 rounded border transition-all ${
                      isCompleted
                        ? 'bg-green-950/20 border-green-900/50'
                        : 'bg-arc-900/30 border-arc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                      ) : (
                        <Circle className="text-gray-600 flex-shrink-0" size={16} />
                      )}
                      <span className={`text-sm font-medium ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                        {wb}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Other Workbenches */}
              {['Gunsmith', 'Medical Lab', 'Utility Station', 'Explosives Bench', 'Refiner'].map(category => (
                [1, 2, 3].map(level => {
                  const wb = `${category} ${level}`;
                  const isCompleted = searchResult.workbenchesCompleted?.includes(wb);
                  return (
                    <div
                      key={wb}
                      className={`p-3 rounded border transition-all ${
                        isCompleted
                          ? 'bg-green-950/20 border-green-900/50'
                          : 'bg-arc-900/30 border-arc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                        ) : (
                          <Circle className="text-gray-600 flex-shrink-0" size={16} />
                        )}
                        <span className={`text-sm font-medium ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                          {wb}
                        </span>
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Completed Expedition */}
          <div className="bg-arc-800/50 rounded-lg border border-arc-700 overflow-hidden">
            <div className="bg-arc-800 border-b-2 border-arc-accent px-4 py-3">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Package size={20} className="text-arc-accent" />
                Expedition ({searchResult.stats.totalExpeditionPartsCompleted}/5)
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(partNumber => {
                const partName = `Part ${partNumber}`;
                const materials = searchResult.expeditionRequirements?.filter(
                  (req: any) => req.part_number === partNumber
                ) || [];
                const completedItems = searchResult.expeditionItemsCompleted?.filter(
                  (item: any) => item.part_name === partName
                ) || [];
                const completedCount = completedItems.length;
                const totalCount = materials.length;
                const isFullyCompleted = totalCount > 0 && completedCount === totalCount;
                
                return (
                  <div
                    key={partNumber}
                    className={`rounded-lg border p-4 ${
                      isFullyCompleted
                        ? 'bg-green-950/20 border-green-900/50'
                        : 'bg-arc-900/30 border-arc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isFullyCompleted ? (
                          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                        ) : (
                          <Circle className="text-gray-600 flex-shrink-0" size={20} />
                        )}
                        <span className={`text-lg font-bold ${isFullyCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                          {partName}
                        </span>
                      </div>
                      <div className="text-sm font-bold">
                        <span className={isFullyCompleted ? 'text-green-400' : 'text-arc-accent'}>
                          {completedCount}/{totalCount}
                        </span>
                        <span className="text-gray-500 ml-1">items</span>
                      </div>
                    </div>
                    
                    {/* Material breakdown */}
                    {materials.length > 0 && (
                      <div className="space-y-2">
                        {materials.map((mat: any, idx: number) => {
                          const isItemCompleted = completedItems.some(
                            (item: any) => item.item_name === mat.item_name
                          );
                          
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-2 rounded text-sm ${
                                isItemCompleted
                                  ? 'bg-green-950/20 border border-green-900/30'
                                  : 'bg-arc-900/20'
                              }`}
                            >
                              {isItemCompleted ? (
                                <CheckCircle className="text-green-500 flex-shrink-0" size={14} />
                              ) : (
                                <Circle className="text-gray-600 flex-shrink-0" size={14} />
                              )}
                              <div className="flex-grow grid grid-cols-3 gap-2">
                                <span className={isItemCompleted ? 'text-gray-500 line-through' : 'text-white'}>
                                  {mat.item_name}
                                </span>
                                <span className={`font-mono ${isItemCompleted ? 'text-gray-600' : 'text-arc-accent'}`}>
                                  {mat.quantity}
                                </span>
                                <span className={isItemCompleted ? 'text-gray-600' : 'text-gray-400'}>
                                  {mat.location}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searchResult && !error && !isLoading && (
        <div className="text-center py-20 text-gray-500">
          <Users size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Search for a raider to view their progress</p>
          <p className="text-sm mt-2">Enter a raider name and click Search</p>
        </div>
      )}
    </div>
  );
};

// --- Blueprint Manager Component ---
const BlueprintManager = () => {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBlueprint, setEditingBlueprint] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter blueprints based on search
  const filteredBlueprints = blueprints.filter(blueprint =>
    blueprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blueprint.workshop.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search blueprints by name or workshop..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        />
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
        {filteredBlueprints.map((blueprint) => (
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

      {filteredBlueprints.length === 0 && blueprints.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No blueprints found matching "{searchQuery}"</p>
        </div>
      )}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    locations: '',
    url: '',
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
      const apiQuests = response.data.quests || [];
      
      console.log('🔍 Admin: Loading quests from API...');
      console.log('📊 Admin: API returned:', apiQuests.length, 'quests');
      
      // Create an object map of API quests for quick lookup
      const apiQuestMap: Record<number, any> = {};
      apiQuests.forEach((q: any) => {
        apiQuestMap[q.id] = q;
      });
      
      // Merge: use API data when available, constants as fallback for objectives/rewards
      const mergedQuests = QUESTS.map(constantQuest => {
        const apiQuest = apiQuestMap[constantQuest.id];
        if (apiQuest) {
          // Use API quest but ensure objectives and rewards from constants if API data is empty
          return {
            ...constantQuest,
            ...apiQuest,
            objectives: (apiQuest.objectives && apiQuest.objectives.length > 0) 
              ? apiQuest.objectives 
              : constantQuest.objectives,
            rewards: (apiQuest.rewards && apiQuest.rewards.length > 0) 
              ? apiQuest.rewards 
              : constantQuest.rewards
          };
        }
        return constantQuest;
      });
      
      // Add any new quests from API that aren't in constants
      apiQuests.forEach((apiQuest: any) => {
        if (!QUESTS.find(q => q.id === apiQuest.id)) {
          console.log('✅ Admin: Found NEW quest from API:', apiQuest.id, apiQuest.name);
          mergedQuests.push(apiQuest);
        }
      });
      
      // Sort by ID
      mergedQuests.sort((a, b) => a.id - b.id);
      
      console.log('📊 Admin: Final quest list:', mergedQuests.length, 'quests');
      
      setQuests(mergedQuests);
    } catch (error: any) {
      console.error('Failed to load quests:', error);
      alert(error.response?.data?.error || 'Failed to load quests. Make sure you have admin permissions.');
      // Fallback to constants if API fails
      setQuests(QUESTS);
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
      url: '',
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
          url: formData.url,
          objectives: formData.objectives.filter(o => o.trim()),
          rewards: formData.rewards.filter(r => r.trim())
        });
        alert('Quest updated successfully!');
      } else {
        await admin.createQuest({
          id: parseInt(formData.id),
          name: formData.name,
          locations: formData.locations,
          url: formData.url,
          objectives: formData.objectives.filter(o => o.trim()),
          rewards: formData.rewards.filter(r => r.trim())
        });
        alert('Quest created successfully!');
      }
      setShowAddForm(false);
      setEditingQuest(null);
      setFormData({ id: '', name: '', locations: '', url: '', objectives: [''], rewards: [''] });
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
      url: quest.url || '',
      objectives: quest.objectives || [''],
      rewards: quest.rewards || ['']
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingQuest(null);
    setFormData({ id: '', name: '', locations: '', url: '', objectives: [''], rewards: [''] });
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-arc-accent" size={48} />
      </div>
    );
  }

  // Filter quests based on search
  const filteredQuests = quests.filter(quest => 
    quest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quest.id.toString().includes(searchQuery) ||
    (quest.locations && quest.locations.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search quests by name, ID, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        />
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
                <label className="block text-sm text-gray-400 mb-1">Quest Guide URL (optional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  placeholder="https://example.com/quest-guide"
                />
                <p className="text-xs text-gray-500 mt-1">Link to external quest guide or video</p>
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
        {filteredQuests.map((quest) => (
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

      {filteredQuests.length === 0 && quests.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No quests found matching "{searchQuery}"</p>
        </div>
      )}

      {quests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Settings size={48} className="mx-auto mb-4 opacity-50" />
          <p>No quests found. Click "Add Quest" to create one.</p>
        </div>
      )}
    </div>
  );
};

// --- User Manager Component ---
const UserManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await admin.getAllUsers();
      setUsers(response.data.users);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      alert(error.response?.data?.error || 'Failed to load users. Make sure you have admin permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({ email: '', username: '', password: '', role: 'user' });
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await admin.createUser(formData);
      alert('User created successfully!');
      setShowAddForm(false);
      setFormData({ email: '', username: '', password: '', role: 'user' });
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This will remove all their raider profiles and progress!`)) return;
    
    try {
      await admin.deleteUser(userId);
      alert('User deleted successfully!');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleRoleChange = async (userId: number, currentRole: string, username: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Change "${username}" role from ${currentRole.toUpperCase()} to ${newRole.toUpperCase()}?`)) return;
    
    try {
      await admin.updateUserRole(userId, newRole);
      alert('Role updated successfully!');
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleExpeditionLevelChange = async (userId: number, currentLevel: number, username: string) => {
    const newLevel = prompt(`Enter new expedition level for "${username}" (current: ${currentLevel}):`, currentLevel.toString());
    
    if (newLevel === null) return; // User cancelled
    
    const level = parseInt(newLevel);
    if (isNaN(level) || level < 0) {
      alert('Please enter a valid number (0 or greater)');
      return;
    }
    
    try {
      await admin.updateUserExpeditionLevel(userId, level);
      alert(`Expedition level updated to ${level} successfully!`);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update expedition level');
    }
  };

  const cancelAdd = () => {
    setFormData({ email: '', username: '', password: '', role: 'user' });
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-arc-accent" size={48} />
      </div>
    );
  }

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <SectionHeader title="User Manager" description="Manage user accounts" />
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors"
        >
          <PlusIcon size={20} />
          Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search users by username, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-arc-800 text-white pl-12 pr-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
        />
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-arc-accent rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Add New User</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  minLength={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-arc-700">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
                >
                  <Save size={18} />
                  Create User
                </button>
                <button
                  type="button"
                  onClick={cancelAdd}
                  className="px-6 py-3 bg-arc-700 text-gray-300 rounded font-bold hover:bg-arc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-arc-800 border-b border-arc-700">
            <tr>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">ID</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Username</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Email</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Role</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Expedition</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Created</th>
              <th className="text-left p-3 text-xs uppercase text-gray-500 font-bold">Last Login</th>
              <th className="text-center p-3 text-xs uppercase text-gray-500 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-arc-700 hover:bg-arc-800/50 transition-colors">
                <td className="p-3 text-gray-400 font-mono text-sm">{user.id}</td>
                <td className="p-3 text-white font-medium">{user.username}</td>
                <td className="p-3 text-gray-300">{user.email}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleRoleChange(user.id, user.role, user.username)}
                    className={`
                      text-xs px-2 py-1 rounded font-bold cursor-pointer transition-all hover:scale-105
                      ${user.role === 'admin' ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'}
                    `}
                    title="Click to change role"
                  >
                    {user.role.toUpperCase()}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleExpeditionLevelChange(user.id, user.expedition_level || 0, user.username)}
                    className="text-xs px-2 py-1 rounded font-bold cursor-pointer transition-all hover:scale-105 bg-arc-gold/20 text-arc-gold hover:bg-arc-gold/30"
                    title="Click to change expedition level"
                  >
                    Level {user.expedition_level || 0}
                  </button>
                </td>
                <td className="p-3 text-gray-500 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-3 text-gray-500 text-sm">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRoleChange(user.id, user.role, user.username)}
                      className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition-colors"
                      title="Change Role"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                      title="Delete User"
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && users.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>No users found matching "{searchQuery}"</p>
        </div>
      )}

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <User size={48} className="mx-auto mb-4 opacity-50" />
          <p>No users found. Click "Add User" to create one.</p>
        </div>
      )}
    </div>
  );
};

// --- Settings View ---
const SettingsView = ({ onRefresh }: { onRefresh: () => Promise<void> }) => {
  const { user, logout, setUser } = useAuth();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUsername.trim().length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }

    if (newUsername === user?.username) {
      alert('Please enter a different username');
      return;
    }

    try {
      setIsUpdatingUsername(true);
      await raider.updateUsername(newUsername.trim());
      
      // Update user context
      if (user) {
        setUser({ ...user, username: newUsername.trim() });
      }
      
      // Refresh profile data
      await onRefresh();
      
      alert('Username updated successfully! Your changes are reflected everywhere.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update username');
      setNewUsername(user?.username || '');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleResetAccount = async () => {
    try {
      console.log('Attempting to reset account...');
      const response = await raider.resetAccount();
      console.log('Reset response:', response);
      
      setShowResetModal(false);
      
      // Refresh profile data
      await onRefresh();
      
      alert('Account reset successfully! All progress has been wiped.');
    } catch (error: any) {
      console.error('Reset account error:', error);
      console.error('Error response:', error.response);
      alert(error.response?.data?.error || 'Failed to reset account');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await raider.deleteAccount();
      alert('Account deleted successfully. You will now be logged out.');
      setShowDeleteModal(false);
      logout();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete account');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      console.log('Attempting to update password...');
      const response = await raider.updatePassword(currentPassword, newPassword);
      console.log('Password update response:', response);
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert('Password updated successfully!');
    } catch (error: any) {
      console.error('Password update error:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to update password';
      alert(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Account Settings" description="Manage your account preferences" />

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-red-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-red-900/50">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-red-900/30 p-4 rounded-full border border-red-700 text-red-500">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider">Reset Account?</h3>
              <div className="text-gray-300 space-y-2 text-sm">
                <p className="p-3 bg-arc-800 rounded border border-red-900/30 text-red-200">
                  <AlertTriangle className="inline mb-1 mr-1" size={14}/>
                  WARNING: This will <strong>WIPE</strong> all your progress!
                </p>
                <p>This will:</p>
                <ul className="text-left space-y-1 pl-4">
                  <li>• Delete all completed quests</li>
                  <li>• Delete all owned blueprints</li>
                  <li>• Delete all completed workbenches</li>
                  <li>• Delete all expedition parts</li>
                  <li>• Reset your expedition level to 0</li>
                </ul>
                <p className="text-red-400 font-bold mt-3">This action cannot be undone!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className="py-3 px-4 rounded border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white font-bold transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleResetAccount}
                  className="py-3 px-4 rounded bg-red-600 text-white hover:bg-red-700 font-bold tracking-wide shadow-lg shadow-red-900/40 transition-all transform hover:scale-105"
                >
                  RESET ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-red-600 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-red-900/50">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-red-900/30 p-4 rounded-full border border-red-700 text-red-500">
                <TrashIcon size={48} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider">Delete Account?</h3>
              <div className="text-gray-300 space-y-2 text-sm">
                <p className="p-3 bg-arc-800 rounded border border-red-900/30 text-red-200">
                  <AlertTriangle className="inline mb-1 mr-1" size={14}/>
                  WARNING: This will <strong>PERMANENTLY DELETE</strong> your account!
                </p>
                <p>This will:</p>
                <ul className="text-left space-y-1 pl-4">
                  <li>• Delete your user account</li>
                  <li>• Delete all your raider profiles</li>
                  <li>• Delete all your progress</li>
                  <li>• Delete all your favorites</li>
                  <li>• Remove all your data from the system</li>
                </ul>
                <p className="text-red-400 font-bold mt-3">This action is PERMANENT and cannot be undone!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="py-3 px-4 rounded border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white font-bold transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="py-3 px-4 rounded bg-red-600 text-white hover:bg-red-700 font-bold tracking-wide shadow-lg shadow-red-900/40 transition-all transform hover:scale-105"
                >
                  DELETE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Username Update */}
      <div className="bg-arc-800 rounded-xl p-6 border border-arc-700 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <User size={24} className="text-arc-accent" />
          <h3 className="text-xl font-black text-white">Change Username</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Update your username. This will be reflected throughout the app and in your raider profile.
        </p>
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Current Username</label>
            <div className="bg-arc-900/50 text-gray-500 px-4 py-3 rounded border border-arc-700 font-mono">
              {user?.username}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">New Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-arc-900 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
              placeholder="Enter new username"
              minLength={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 3 characters</p>
          </div>
          <button
            type="submit"
            disabled={isUpdatingUsername || newUsername === user?.username}
            className="flex items-center gap-2 px-6 py-3 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingUsername ? (
              <>
                <Loader className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              <>
                <Save size={18} />
                Update Username
              </>
            )}
          </button>
        </form>
      </div>

      {/* Password Update */}
      <div className="bg-arc-800 rounded-xl p-6 border border-arc-700 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={24} className="text-arc-accent" />
          <h3 className="text-xl font-black text-white">Change Password</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Update your password to keep your account secure.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-arc-900 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-arc-900 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
              placeholder="Enter new password"
              minLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-arc-900 text-white px-4 py-3 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
              placeholder="Confirm new password"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="flex items-center gap-2 px-6 py-3 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingPassword ? (
              <>
                <Loader className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              <>
                <Save size={18} />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-arc-800 rounded-xl p-6 border-2 border-red-900/50 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={24} className="text-red-500" />
          <h3 className="text-xl font-black text-white">Danger Zone</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          These actions are permanent and cannot be undone. Proceed with caution.
        </p>

        <div className="space-y-4">
          {/* Reset Account */}
          <div className="bg-arc-900/50 rounded-lg p-4 border border-red-900/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">Reset Account Progress</h4>
                <p className="text-sm text-gray-400">
                  Wipe all your progress (quests, blueprints, workbenches, expedition parts) and reset to expedition level 0.
                  Your username and account will remain.
                </p>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 rounded border border-red-900/50 hover:bg-red-900/50 hover:text-red-300 transition-colors font-bold"
              >
                <Rocket size={18} />
                Reset Progress
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-arc-900/50 rounded-lg p-4 border border-red-900/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">Delete Account</h4>
                <p className="text-sm text-gray-400">
                  Permanently delete your account and all associated data. This action cannot be reversed.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold"
              >
                <TrashIcon size={18} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-arc-800 rounded-xl p-6 border border-arc-700 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Info size={24} className="text-arc-accent" />
          <h3 className="text-xl font-black text-white">Account Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Username</label>
            <div className="text-white font-medium">{user?.username}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Email</label>
            <div className="text-white font-mono">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Expedition Requirements Manager ---
const ExpeditionRequirementsManager = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [formData, setFormData] = useState({
    part_number: 1,
    item_name: '',
    quantity: '',
    location: '',
    display_order: 0
  });

  useEffect(() => {
    loadRequirements();
  }, [selectedLevel]);

  const loadRequirements = async () => {
    try {
      setIsLoading(true);
      const response = await admin.getExpeditionRequirements(selectedLevel);
      setRequirements(response.data.requirements);
    } catch (error: any) {
      console.error('Failed to load requirements:', error);
      alert('Failed to load requirements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = (partNumber: number) => {
    setFormData({
      part_number: partNumber,
      item_name: '',
      quantity: '',
      location: '',
      display_order: 0
    });
    setEditingRequirement(null);
    setShowAddForm(true);
  };

  const handleEdit = (requirement: any) => {
    setFormData({
      part_number: requirement.part_number,
      item_name: requirement.item_name,
      quantity: requirement.quantity,
      location: requirement.location,
      display_order: requirement.display_order
    });
    setEditingRequirement(requirement);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRequirement) {
        await admin.updateExpeditionRequirement(editingRequirement.id, {
          item_name: formData.item_name,
          quantity: formData.quantity,
          location: formData.location,
          display_order: formData.display_order
        });
        alert('Requirement updated successfully!');
      } else {
        await admin.createExpeditionRequirement({
          expedition_level: selectedLevel,
          part_number: formData.part_number,
          item_name: formData.item_name,
          quantity: formData.quantity,
          location: formData.location,
          display_order: formData.display_order
        });
        alert('Requirement created successfully!');
      }
      setShowAddForm(false);
      loadRequirements();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save requirement');
    }
  };

  const handleDelete = async (id: number, itemName: string) => {
    if (!confirm(`Delete "${itemName}"?`)) return;
    
    try {
      await admin.deleteExpeditionRequirement(id);
      alert('Requirement deleted successfully!');
      loadRequirements();
    } catch (error: any) {
      alert('Failed to delete requirement');
    }
  };

  const handleCopy = async () => {
    const toLevel = prompt(`Copy Expedition ${selectedLevel} requirements to which expedition level?`);
    if (!toLevel) return;
    
    try {
      await admin.copyExpeditionRequirements(selectedLevel, parseInt(toLevel));
      alert(`Successfully copied to Expedition ${toLevel}!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to copy requirements');
    }
  };

  const groupedRequirements = requirements.reduce((acc, req) => {
    if (!acc[req.part_number]) acc[req.part_number] = [];
    acc[req.part_number].push(req);
    return acc;
  }, {} as Record<number, any[]>);

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
        <SectionHeader title="Expedition Requirements Manager" description="Configure expedition requirements for each level" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400 font-bold">Expedition Level:</label>
            <input
              type="number"
              min="1"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(parseInt(e.target.value) || 1)}
              className="w-20 bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none text-center font-bold"
            />
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 text-blue-400 rounded font-bold hover:bg-blue-900/50 transition-colors"
          >
            Copy to Another Level
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-arc-900 border-2 border-arc-accent rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingRequirement ? 'Edit Requirement' : `Add Requirement to Part ${formData.part_number}`}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  placeholder="e.g., Metal Parts"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantity *</label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  placeholder="e.g., 150 or 250k Value"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                  placeholder="e.g., Basic Materials"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-arc-800 text-white px-3 py-2 rounded border border-arc-700 focus:border-arc-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors"
                >
                  {editingRequirement ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-arc-700 text-gray-300 rounded font-bold hover:bg-arc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parts List */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map(partNumber => {
          const partRequirements = groupedRequirements[partNumber] || [];
          
          return (
            <div key={partNumber} className="bg-arc-800 rounded-xl border border-arc-700 overflow-hidden">
              <div className="bg-arc-900/70 border-b border-arc-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-white">Part {partNumber}</h3>
                <button
                  onClick={() => handleAddNew(partNumber)}
                  className="flex items-center gap-2 px-4 py-2 bg-arc-accent text-white rounded font-bold hover:bg-red-700 transition-colors text-sm"
                >
                  <PlusIcon size={16} />
                  Add Item
                </button>
              </div>
              
              <div className="p-6">
                {partRequirements.length > 0 ? (
                  <div className="space-y-3">
                    {partRequirements.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-4 bg-arc-900/50 rounded border border-arc-700 hover:border-arc-600 transition-colors"
                      >
                        <div className="flex-grow grid grid-cols-3 gap-4">
                          <div className="text-white font-medium">{req.item_name}</div>
                          <div className="text-arc-accent font-mono font-bold">{req.quantity}</div>
                          <div className="text-gray-400">{req.location}</div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(req)}
                            className="p-2 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/50 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(req.id, req.item_name)}
                            className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No items for Part {partNumber}. Click "Add Item" to create one.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requirements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Settings size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">No requirements found for Expedition {selectedLevel}</p>
          <p className="text-sm">Add items to each part or copy from another expedition level</p>
        </div>
      )}
    </div>
  );
};

// --- Admin View with Tabs ---
const AdminView = () => {
  const [activeTab, setActiveTab] = useState<'quests' | 'blueprints' | 'users' | 'expeditions'>('quests');

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
        <button
          onClick={() => setActiveTab('expeditions')}
          className={`
            px-6 py-3 rounded-t font-bold uppercase tracking-wide transition-all duration-200
            ${activeTab === 'expeditions' 
              ? 'bg-arc-accent text-white shadow-lg' 
              : 'bg-arc-800 text-gray-400 hover:text-white hover:bg-arc-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Package size={20} />
            Expedition Manager
          </div>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`
            px-6 py-3 rounded-t font-bold uppercase tracking-wide transition-all duration-200
            ${activeTab === 'users' 
              ? 'bg-arc-accent text-white shadow-lg' 
              : 'bg-arc-800 text-gray-400 hover:text-white hover:bg-arc-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <User size={20} />
            User Manager
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'quests' && <QuestManager />}
      {activeTab === 'blueprints' && <BlueprintManager />}
      {activeTab === 'users' && <UserManager />}
      {activeTab === 'expeditions' && <ExpeditionRequirementsManager />}
    </div>
  );
};

// --- Main App ---
export default function App() {
  const { user, logout } = useAuth();
  const { profileData, isLoading, toggleQuest, toggleBlueprint, toggleWorkbench, toggleExpeditionPart, toggleExpeditionItem, completeExpedition, refresh } = useRaiderProfile();
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
        <button 
          onClick={() => navigate('home')}
          className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
        >
          ARC <span className="text-arc-accent">COMPANION</span>
        </button>
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
            <button 
              onClick={() => navigate('home')}
              className="text-2xl font-black italic tracking-tighter text-white hover:opacity-80 transition-opacity"
            >
              ARC <span className="text-arc-accent">COMPANION</span>
            </button>
          </div>

          <nav className="space-y-2">
            <SidebarItem icon={Shield} label="Terminal" isActive={currentView === 'home'} onClick={() => navigate('home')} />
            <SidebarItem icon={Map} label="Quests" isActive={currentView === 'quests'} onClick={() => navigate('quests')} />
            <SidebarItem icon={Scroll} label="Blueprints" isActive={currentView === 'blueprints'} onClick={() => navigate('blueprints')} />
            <SidebarItem icon={Wrench} label="Workbenches" isActive={currentView === 'workbenches'} onClick={() => navigate('workbenches')} />
            <SidebarItem icon={Package} label="Expedition" isActive={currentView === 'expedition-parts'} onClick={() => navigate('expedition-parts')} />
            <SidebarItem icon={Trash2} label="Safe Items" isActive={currentView === 'safe-items'} onClick={() => navigate('safe-items')} />
            <SidebarItem icon={Users} label="Raider Search" isActive={currentView === 'raider-search'} onClick={() => navigate('raider-search')} />
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
              onClick={() => navigate('settings')}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-arc-900 hover:bg-arc-800 text-gray-400 hover:text-white rounded border border-arc-700 hover:border-arc-accent transition-colors text-sm font-bold"
            >
              <UserCog size={14} />
              <span>SETTINGS</span>
            </button>
            
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
          {currentView === 'workbenches' && <WorkbenchesView completedWorkbenches={profileData?.completedWorkbenches || []} onToggleWorkbench={toggleWorkbench} />}
          {currentView === 'expedition-parts' && <ExpeditionPartsView completedExpeditionParts={profileData?.completedExpeditionParts || []} completedExpeditionItems={profileData?.completedExpeditionItems || []} onToggleExpeditionItem={toggleExpeditionItem} />}
          {currentView === 'safe-items' && <SafeItemsView />}
          {currentView === 'raider-search' && <RaiderSearchView />}
          {currentView === 'settings' && <SettingsView onRefresh={refresh} />}
          {currentView === 'admin' && isAdmin && <AdminView />}
        </div>
      </div>
    </div>
  );
}
