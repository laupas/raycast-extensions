# skill tool Changelog

## [v1.2.0] - {PR_MERGE_DATE}

### Added

- **Skill detail view**: Selecting a skill now shows full SKILL.md content in a detail panel instead of downloading immediately
- **Preview before download**: Users can read the full description, instructions, and usage examples before deciding to download
- **Two-step workflow**:
  1. Select skill → View full details (markdown rendered)
  2. Click "Download Skill" button in detail view
- **Caching system**: Skill discovery results cached to `~/.raycast/skills/.cache/` with 1-hour TTL
- **Skill-level progress feedback**: Shows toast while loading, updating every 50 skills
- **Parallel processing**: Processes up to 8 skills concurrently (8x faster than sequential)
- **Repository diagnostics**: Shows repository count, token status, and detected branches

### Fixed

- **Performance issue**: Added caching to avoid re-fetching 864+ skills from ComposioHQ on every load
- **Long loading times**: Cache results reused within 1 hour, making subsequent loads instant
- **Dynamic branch detection**: Repositories like ComposioHQ (using `master` branch) now properly detected
- **GitHub API error handling**: Better error messages when API calls fail

### Removed

- **VoltAgent repository**: Removed from defaults as it returns no skills. Can still be manually added to preferences.

### Performance Improvements

- **Caching**: First load full time, subsequent loads instant
- **Parallel processing**: 8x faster skill metadata fetching
- **Progress indicators**: Real-time feedback prevents hanging appearance
