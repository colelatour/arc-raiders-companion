import { useState, useEffect } from 'react';
import { raider } from './api';

interface ProfileData {
  profileId: number;
  raiderName: string;
  expeditionLevel: number;
  completedQuests: number[];
  ownedBlueprints: string[];
  questsCount: number;
  blueprintsCount: number;
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
        const createResponse = await raider.createProfile('Default Raider');
        const newProfile = createResponse.data.profile;
        
        setProfileData({
          profileId: newProfile.id,
          raiderName: newProfile.raider_name,
          expeditionLevel: newProfile.expedition_level,
          completedQuests: [],
          ownedBlueprints: [],
          questsCount: 0,
          blueprintsCount: 0
        });
      } else {
        // Use first profile (we can expand this later for multiple profiles)
        const profile = profiles[0];
        
        // Get quests and blueprints
        const [questsResponse, blueprintsResponse, statsResponse] = await Promise.all([
          raider.getCompletedQuests(profile.id),
          raider.getOwnedBlueprints(profile.id),
          raider.getStats(profile.id)
        ]);
        
        setProfileData({
          profileId: profile.id,
          raiderName: profile.raider_name,
          expeditionLevel: profile.expedition_level,
          completedQuests: questsResponse.data.completedQuests,
          ownedBlueprints: blueprintsResponse.data.ownedBlueprints,
          questsCount: statsResponse.data.stats.quests_completed,
          blueprintsCount: statsResponse.data.stats.blueprints_owned
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
      await raider.toggleQuest(profileData.profileId, questId);
      await loadProfile(); // Reload data
    } catch (error) {
      console.error('Failed to toggle quest:', error);
    }
  };

  const toggleBlueprint = async (blueprintName: string) => {
    if (!profileData) return;
    
    try {
      await raider.toggleBlueprint(profileData.profileId, blueprintName);
      await loadProfile(); // Reload data
    } catch (error) {
      console.error('Failed to toggle blueprint:', error);
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
    completeExpedition,
    refresh: loadProfile
  };
};
