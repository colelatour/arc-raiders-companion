# Raider Search Feature Plan

## Overview
Add ability to search for raiders by username and view their progress (quests/blueprints).

## Database Structure (Already Exists!)
✅ users → raider_profiles → raider_completed_quests
✅ users → raider_profiles → raider_owned_blueprints

## Implementation Plan

### 1. Backend API (server/routes/)
- Create new endpoint: GET /api/raider/search?username=<username>
- Returns: raider profile info, completed quests, owned blueprints

### 2. Frontend (src/)
- Add new view: "Raider Search" 
- Search input for username
- Display results: raider name, expedition level, progress stats
- Show completed quests (with checkmarks)
- Show owned blueprints (with checkmarks)

### 3. Permissions
- Should this be public (anyone can search)?
- Or admin-only?
- Or friends-only?

### 4. UI Location
- Add sidebar item: "Raider Search" with Search icon
- New view similar to Quests/Blueprints views

## Privacy Considerations
- Show only username (not email)
- Option to make profile private?
- Default to public or private?

