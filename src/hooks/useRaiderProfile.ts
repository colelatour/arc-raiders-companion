import { useState, useEffect, useCallback } from 'react';
import { raider } from '../utils/api';
import { AllQuests, Blueprint, CompletedExpeditionItem, ExpeditionItem, ExpeditionPart, ProfileData, Workbench } from '../types/types';

export const useRaiderProfile = () => {
  // State for user-specific profile data
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  // State for master lists of all items
  const [allQuests, setAllQuests] = useState<AllQuests[]>([]);
  const [allBlueprints, setAllBlueprints] = useState<Blueprint[]>([]);
  const [allWorkbenches, setAllWorkbenches] = useState<Workbench[]>([]);
  const [allExpeditionParts, setAllExpeditionParts] = useState<ExpeditionPart[]>([]);
  const [allExpeditionItems, setAllExpeditionItems] = useState<ExpeditionItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const profilesResponse = await raider.getProfiles();
      const profiles = profilesResponse.data.profiles;

      // Fetch all master lists regardless of profile status
      const [
        questsMaster,
        blueprintsMaster,
        workbenchesMaster,
        expeditionPartsMaster,
        expeditionItemsMaster,
      ] = await Promise.all([
        raider.getAllQuests(),
        raider.getAllBlueprints(),
        raider.getAllWorkbenches(),
        raider.getAllExpeditionParts(),
        raider.getAllExpeditionItems(),
      ]);

      setAllQuests(questsMaster.data.quests);
      setAllBlueprints(blueprintsMaster.data.blueprints);
      setAllWorkbenches(workbenchesMaster.data.workbenches);
      setAllExpeditionParts(expeditionPartsMaster.data.expeditionParts);
      setAllExpeditionItems(expeditionItemsMaster.data.expeditionItems);
      
      if (profiles.length === 0) {
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
        });
      } else {
        const profile = profiles[0];
        
        const [
          completedQuests,
          ownedBlueprints,
          completedWorkbenches,
          completedExpeditionParts,
          completedExpeditionItems,
        ] = await Promise.all([
          raider.getCompletedQuests(profile.id),
          raider.getOwnedBlueprints(profile.id),
          raider.getCompletedWorkbenches(profile.id),
          raider.getCompletedExpeditionParts(profile.id),
          raider.getCompletedExpeditionItems(profile.id),
        ]);
        
        setProfileData({
          profileId: profile.id,
          expeditionLevel: profile.expedition_level,
          completedQuests: completedQuests.data.completedQuests,
          ownedBlueprints: ownedBlueprints.data.ownedBlueprints,
          completedWorkbenches: completedWorkbenches.data.completedWorkbenches,
          completedExpeditionParts: completedExpeditionParts.data.completedExpeditionParts,
          completedExpeditionItems: completedExpeditionItems.data.completedExpeditionItems,
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleQuest = async (questId: number) => {
    if (!profileData) return;
    
    const wasCompleted = profileData.completedQuests.includes(questId);
    const newCompleted = wasCompleted
      ? profileData.completedQuests.filter(id => id !== questId)
      : [...profileData.completedQuests, questId];
      
    setProfileData({ ...profileData, completedQuests: newCompleted });
    await raider.toggleQuest(profileData.profileId, questId).catch(() => loadProfile());
  };

  const toggleBlueprint = async (blueprintName: string) => {
    if (!profileData) return;
    
    const wasOwned = profileData.ownedBlueprints.includes(blueprintName);
    const newOwned = wasOwned
      ? profileData.ownedBlueprints.filter(name => name !== blueprintName)
      : [...profileData.ownedBlueprints, blueprintName];

    setProfileData({ ...profileData, ownedBlueprints: newOwned });
    await raider.toggleBlueprint(profileData.profileId, blueprintName).catch(() => loadProfile());
  };

  const toggleWorkbench = async (workbenchName: string) => {
    if (!profileData) return;
    
    const wasCompleted = profileData.completedWorkbenches.includes(workbenchName);
    const newCompleted = wasCompleted
      ? profileData.completedWorkbenches.filter(name => name !== workbenchName)
      : [...profileData.completedWorkbenches, workbenchName];

    setProfileData({ ...profileData, completedWorkbenches: newCompleted });
    await raider.toggleWorkbench(profileData.profileId, workbenchName).catch(() => loadProfile());
  };

  const toggleExpeditionPart = async (partName: string) => {
    if (!profileData) return;
    
    const wasCompleted = profileData.completedExpeditionParts.includes(partName);
    const newCompleted = wasCompleted
        ? profileData.completedExpeditionParts.filter(name => name !== partName)
        : [...profileData.completedExpeditionParts, partName];

    setProfileData({ ...profileData, completedExpeditionParts: newCompleted });
    // Note: The backend endpoint for this might not exist yet if it wasn't part of the original scope.
    // await raider.toggleExpeditionPart(profileData.profileId, partName).catch(() => loadProfile());
  };

  const toggleExpeditionItem = async (partName: string, itemName: string) => {
    if (!profileData) return;
    
    const wasCompleted = profileData.completedExpeditionItems.some(
      item => item.part_name === partName && item.item_name === itemName
    );

    const newCompletedItems = wasCompleted
      ? profileData.completedExpeditionItems.filter(
          item => !(item.part_name === partName && item.item_name === itemName)
        )
      : [...profileData.completedExpeditionItems, { part_name: partName, item_name: itemName }];

    setProfileData({ ...profileData, completedExpeditionItems: newCompletedItems });
    await raider.toggleExpeditionItem(profileData.profileId, partName, itemName).catch(() => loadProfile());
  };

  return {
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
    toggleExpeditionPart,
    toggleExpeditionItem,
    refresh: loadProfile,
  };
};

