# Database Schema Summary

## Updated: December 9, 2025

### Core Tables

1. **users** - User accounts and authentication
2. **raider_profiles** - Player profiles (multiple per user)

### Game Data Tables

3. **quests** - Quest definitions
4. **quest_objectives** - Quest objectives
5. **quest_rewards** - Quest rewards
6. **blueprints** - Blueprint definitions
7. **workbenches** - Workbench/station levels (NEW)
8. **crafting_items** - Crafting material requirements
9. **safe_items** - Items safe to recycle/sell

### Progress Tracking Tables

10. **raider_completed_quests** - Tracks completed quests per profile
11. **raider_owned_blueprints** - Tracks owned blueprints per profile
12. **raider_completed_workbenches** - Tracks completed workbench levels per profile (NEW)

### Social Features

13. **favorite_raiders** - Bookmarked raiders for quick access (NEW)

### Workbench Categories (19 total levels)
- **Scrappy**: Levels 2, 3, 4, 5 (4 levels)
- **Gunsmith**: Levels 1, 2, 3 (3 levels)
- **Medical Lab**: Levels 1, 2, 3 (3 levels)
- **Utility Station**: Levels 1, 2, 3 (3 levels)
- **Explosives Bench**: Levels 1, 2, 3 (3 levels)
- **Refiner**: Levels 1, 2, 3 (3 levels)

### Recent Additions
- ✅ Workbenches tracking system
- ✅ Favorite raiders/bookmarking
- ✅ Quest URL field for walkthrough links
- ✅ Display order for workbenches
