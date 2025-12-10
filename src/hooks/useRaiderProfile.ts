import { useState, useEffect } from 'react';
import { raider } from '../utils/api';

interface ProfileData {
  profileId: number;
  expeditionLevel: number;
  completedQuests: number[];
  ownedBlueprints: string[];
  completedWorkbenches: string[];
  completedExpeditionParts: string[];
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
          questsCount: 0,
          blueprintsCount: 0,
          workbenchesCount: 0,
          expeditionPartsCount: 0
        });
      } else {
        // Use first profile (we can expand this later for multiple profiles)
        const profile = profiles[0];
        
        // Get quests and blueprints
        const [questsResponse, blueprintsResponse, workbenchesResponse, expeditionPartsResponse, statsResponse] = await Promise.all([
          raider.getCompletedQuests(profile.id),
          raider.getOwnedBlueprints(profile.id),
          raider.getCompletedWorkbenches(profile.id),
          raider.getCompletedExpeditionParts(profile.id),
          raider.getStats(profile.id)
        ]);
        
        setProfileData({
          profileId: profile.id,
          expeditionLevel: profile.expedition_level,
          completedQuests: questsResponse.data.completedQuests,
          ownedBlueprints: blueprintsResponse.data.ownedBlueprints,
          completedWorkbenches: workbenchesResponse.data.completedWorkbenches,
          completedExpeditionParts: expeditionPartsResponse.data.completedExpeditionParts,
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

  const completeExpedition = async () => {
    if (!profileData) return;
    
    try {
      await raider.completeExpedition(profileData.profileId);
      await loadProfile(); // Reload data
    } catch (error) {
      console.error('Failed to complete expedition:', error);
    }
  };

  return {
    profileData,
    isLoading,
    toggleQuest,
    toggleBlueprint,
    toggleWorkbench,
    toggleExpeditionPart,
    completeExpedition,
    refresh: loadProfile
  };
};
