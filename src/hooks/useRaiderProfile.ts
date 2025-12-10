import { useState, useEffect } from 'react';
import { raider } from '../utils/api';

interface ExpeditionItem {
  part_name: string;
  item_name: string;
}

interface ProfileData {
  profileId: number;
  expeditionLevel: number;
  completedQuests: number[];
  ownedBlueprints: string[];
  completedWorkbenches: string[];
  completedExpeditionParts: string[];
  completedExpeditionItems: ExpeditionItem[];
  questsCount: number;
  blueprintsCount: number;
  workbenchesCount: number;
  expeditionPartsCount: number;
}

export const useRaiderProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Get user's profiles
      const profilesResponse = await raider.getProfiles();
      const profiles = profilesResponse.data.profiles;
      
      if (profiles.length === 0) {
        // Create default profile
        const createResponse = await raider.createProfile();
        const newProfile = createResponse.data.profile;
        
        setProfileData({
          profileId: newProfile.id,
          expeditionLevel: newProfile.expedition_level,
          completedQuests: [],
          ownedBlueprints: [],
          completedWorkbenches: [],
          completedExpeditionParts: [],
          completedExpeditionItems: [],
          questsCount: 0,
          blueprintsCount: 0,
          workbenchesCount: 0,
          expeditionPartsCount: 0
        });
      } else {
        // Use first profile (we can expand this later for multiple profiles)
        const profile = profiles[0];
        
        // Get quests and blueprints
        const [questsResponse, blueprintsResponse, workbenchesResponse, expeditionPartsResponse, expeditionItemsResponse, statsResponse] = await Promise.all([
          raider.getCompletedQuests(profile.id),
          raider.getOwnedBlueprints(profile.id),
          raider.getCompletedWorkbenches(profile.id),
          raider.getCompletedExpeditionParts(profile.id),
          raider.getCompletedExpeditionItems(profile.id),
          raider.getStats(profile.id)
        ]);
        
        setProfileData({
          profileId: profile.id,
          expeditionLevel: profile.expedition_level,
          completedQuests: questsResponse.data.completedQuests,
          ownedBlueprints: blueprintsResponse.data.ownedBlueprints,
          completedWorkbenches: workbenchesResponse.data.completedWorkbenches,
          completedExpeditionParts: expeditionPartsResponse.data.completedExpeditionParts,
          completedExpeditionItems: expeditionItemsResponse.data.completedExpeditionItems,
          questsCount: questsResponse.data.completedQuests.length,
          blueprintsCount: blueprintsResponse.data.ownedBlueprints.length,
          workbenchesCount: workbenchesResponse.data.completedWorkbenches.length,
          expeditionPartsCount: expeditionPartsResponse.data.completedExpeditionParts.length
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleQuest = async (questId: number) => {
    if (!profileData) return;
    
    try {
      // Optimistically update UI
      const wasCompleted = profileData.completedQuests.includes(questId);
      setProfileData({
        ...profileData,
        completedQuests: wasCompleted
          ? profileData.completedQuests.filter(id => id !== questId)
          : [...profileData.completedQuests, questId],
        questsCount: wasCompleted ? profileData.questsCount - 1 : profileData.questsCount + 1
      });
      
      // Send to backend
      await raider.toggleQuest(profileData.profileId, questId);
    } catch (error) {
      console.error('Failed to toggle quest:', error);
      // Reload on error to restore correct state
      await loadProfile();
    }
  };

  const toggleBlueprint = async (blueprintName: string) => {
    if (!profileData) return;
    
    try {
      // Optimistically update UI
      const wasOwned = profileData.ownedBlueprints.includes(blueprintName);
      setProfileData({
        ...profileData,
        ownedBlueprints: wasOwned
          ? profileData.ownedBlueprints.filter(name => name !== blueprintName)
          : [...profileData.ownedBlueprints, blueprintName],
        blueprintsCount: wasOwned ? profileData.blueprintsCount - 1 : profileData.blueprintsCount + 1
      });
      
      // Send to backend
      await raider.toggleBlueprint(profileData.profileId, blueprintName);
    } catch (error) {
      console.error('Failed to toggle blueprint:', error);
      // Reload on error to restore correct state
      await loadProfile();
    }
  };

  const toggleWorkbench = async (workbenchName: string) => {
    if (!profileData) return;
    
    try {
      // Optimistically update UI
      const wasCompleted = profileData.completedWorkbenches.includes(workbenchName);
      setProfileData({
        ...profileData,
        completedWorkbenches: wasCompleted
          ? profileData.completedWorkbenches.filter(name => name !== workbenchName)
          : [...profileData.completedWorkbenches, workbenchName],
        workbenchesCount: wasCompleted ? profileData.workbenchesCount - 1 : profileData.workbenchesCount + 1
      });
      
      // Send to backend
      await raider.toggleWorkbench(profileData.profileId, workbenchName);
    } catch (error) {
      console.error('Failed to toggle workbench:', error);
      // Reload on error to restore correct state
      await loadProfile();
    }
  };

  const toggleExpeditionPart = async (partName: string) => {
    if (!profileData) return;
    
    try {
      // Optimistically update UI
      const wasCompleted = profileData.completedExpeditionParts.includes(partName);
      setProfileData({
        ...profileData,
        completedExpeditionParts: wasCompleted
          ? profileData.completedExpeditionParts.filter(name => name !== partName)
          : [...profileData.completedExpeditionParts, partName],
        expeditionPartsCount: wasCompleted ? profileData.expeditionPartsCount - 1 : profileData.expeditionPartsCount + 1
      });
      
      // Send to backend
      await raider.toggleExpeditionPart(profileData.profileId, partName);
    } catch (error) {
      console.error('Failed to toggle expedition part:', error);
      // Reload on error to restore correct state
      await loadProfile();
    }
  };

  const toggleExpeditionItem = async (partName: string, itemName: string) => {
    if (!profileData) return;
    
    console.log('🔄 Toggling expedition item:', partName, '/', itemName, 'Profile:', profileData.profileId);
    
    try {
      // Check if item is currently completed
      const wasCompleted = profileData.completedExpeditionItems.some(
        item => item.part_name === partName && item.item_name === itemName
      );

      console.log('📊 Current state:', wasCompleted ? '✅ Completed - Will uncomplete' : '❌ Not completed - Will complete');

      // Optimistically update UI
      const newCompletedItems = wasCompleted
        ? profileData.completedExpeditionItems.filter(
            item => !(item.part_name === partName && item.item_name === itemName)
          )
        : [...profileData.completedExpeditionItems, { part_name: partName, item_name: itemName }];

      setProfileData({
        ...profileData,
        completedExpeditionItems: newCompletedItems
      });
      
      // Send to backend
      const response = await raider.toggleExpeditionItem(profileData.profileId, partName, itemName);
      console.log('✅ Saved to database:', response.data.completed ? 'Marked complete' : 'Unmarked');
    } catch (error) {
      console.error('❌ Failed to toggle expedition item:', error);
      // Reload on error to restore correct state
      await loadProfile();
    }
  };

  const completeExpedition = async () => {
    if (!profileData) return;
    
    try {
      const response = await raider.completeExpedition(profileData.profileId);
      console.log('✅ Expedition API response:', response.data);
      await loadProfile(); // Reload data
      return { 
        success: true, 
        newExpeditionLevel: response.data.newExpeditionLevel 
      };
    } catch (error: any) {
      console.error('Failed to complete expedition:', error);
      if (error.response?.data?.error === 'EXPEDITION_NOT_AVAILABLE') {
        return { 
          success: false, 
          error: 'EXPEDITION_NOT_AVAILABLE',
          message: error.response.data.message 
        };
      }
      if (error.response?.data?.error === 'EXPEDITION_INCOMPLETE') {
        return { 
          success: false, 
          error: 'EXPEDITION_INCOMPLETE',
          message: error.response.data.message 
        };
      }
      return { success: false, error: 'UNKNOWN_ERROR' };
    }
  };

  return {
    profileData,
    isLoading,
    toggleQuest,
    toggleBlueprint,
    toggleWorkbench,
    toggleExpeditionPart,
    toggleExpeditionItem,
    completeExpedition,
    refresh: loadProfile
  };
};
