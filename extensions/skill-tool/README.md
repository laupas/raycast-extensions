# Skill Tool

A Raycast extension to discover, preview, and download AI skills from GitHub repositories and manage your local skill collection.

## Features

- 🔍 **Browse skills** from multiple GitHub repositories or local folders (880+ skills available)
- 👁️ **Live preview** - View full skill documentation before downloading
- ⚡ **Fast discovery** - Parallel processing with intelligent caching (8x faster)
- 💾 **Smart caching** - 1-hour cache reduces repeated API calls
- 🔀 **Dynamic branch detection** - Automatically detects repos using `main`, `master`, or other branches
- 📦 **One-click download** - Skills downloaded to `~/.raycast/skills`
- 🔗 **GitHub integration** - Easy links to view skills on GitHub
- 📂 **Flexible sources** - Add any GitHub repositories or manage local skills

## Installation

1. Open Raycast
2. Search for "skill tool"
3. Install the extension

## Configuration

### Basic Setup (Recommended)

By default, the extension is configured to use:

- **Anthropic Skills** (~17 skills) - Official skill examples
- **ComposioHQ Skills** (~864 skills) - Pre-built skills for 500+ SaaS apps

No configuration needed! Just start using the extension. You can also add your own repositories or use local skills.

### GitHub Token (Optional but Recommended)

For higher API rate limits (5000 requests/hour vs 60):

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select "repo" scope
4. Copy the token
5. In Raycast → Manage Extensions → skill tool → Preferences
6. Paste the token in "GitHub Personal Access Token"

### Custom Repositories

To add custom skill repositories from GitHub:

1. Open Raycast → Manage Extensions → Skill Tool → Preferences
2. Edit "Skill Repositories" field
3. Add comma-separated GitHub URLs:

```
https://github.com/anthropics/skills,https://github.com/ComposioHQ/awesome-claude-skills,https://github.com/your-org/your-skills
```

### Local Skills

You can also manage skills in your local `~/.raycast/skills` directory:

1. Use "List Skills" command to browse locally installed skills
2. Skills must have a `SKILL.md` file with YAML frontmatter (`name:` and `description:` fields)
3. Downloaded skills from GitHub are automatically saved here

## What Are Skills?

Skills are customizable workflows that teach AI models (like Claude) how to perform specific tasks. They consist of:

- **Structured instructions** for the AI model
- **Tool definitions** for integration
- **Usage examples** and best practices
- **Prerequisites** and dependencies

Skills enable AI to execute tasks in a repeatable, standardized manner. Skills can be:
- **Claude Skills** - Optimized for Claude from Anthropic
- **Tool Skills** - Integration skills for various SaaS platforms (via ComposioHQ)
- **Custom Skills** - Your own skills in any GitHub repository

## What Can I Do With This?

Skills + Raycast Tools = **Local AI Agents**

### Simple Agent Workflows

Combine skills with Raycast tools like the [Shell extension](https://www.raycast.com/asubbotin/shell) to build powerful local agents:

#### Example 1: Code Analysis Agent

1. Download the **code analysis skill** from Anthropic
2. Use the **Shell tool** to execute code in your project
3. Create a Raycast script that:
   - Takes user input (question about your code)
   - Loads the code analysis skill
   - Executes commands to fetch relevant code files
   - Summarizes findings using Claude

#### Example 2: Automation Agent

1. Download relevant **SaaS skills** from ComposioHQ (e.g., Slack, GitHub, Jira)
2. Use the **Shell tool** to execute API calls or scripts
3. Build a workflow that:
   - Monitors GitHub issues
   - Creates Jira tasks
   - Posts Slack notifications
   - All triggered from a Raycast command

#### Example 3: Content Processing Agent

1. Download the **document processing skill** from Anthropic
2. Use the **Shell tool** to interact with file system
3. Create an agent that:
   - Watches for new documents in a folder
   - Extracts metadata and content
   - Summarizes and categorizes them
   - Archives processed files

### Building Your Own Agent

To create a local agent in Raycast:

1. **Discover skills** - Use "Find and Download Skills" to browse available skills
2. **Preview documentation** - Read SKILL.md to understand capabilities
3. **Combine tools** - Use Shell tool or other Raycast tools alongside skills
4. **Create workflow** - Write a Raycast command that orchestrates the workflow
5. **Test locally** - Run and refine your agent in Raycast

### Benefits

- **No external services** - Everything runs locally on your machine
- **Fast execution** - Direct API calls without cloud roundtrips
- **Privacy** - Your data stays on your computer
- **Customization** - Adapt skills and workflows to your needs
- **Integration** - Works with existing Raycast tools and extensions

## Usage

### Finding Skills

1. Open Raycast with `cmd + space`
2. Type "Find and Download Skills"
3. Search for skills by name or description
4. Results show repository source and brief description

### Previewing and Downloading

1. Press `Enter` on a skill to open the preview
2. Read the full SKILL.md content (rendered as markdown)
3. Click "Download Skill" to save it to `~/.raycast/skills`
4. Press `Esc` to go back to the skill list

### Using Downloaded Skills

Downloaded skills are saved to `~/.raycast/skills/{skill-name}/`

To use them with Claude:

- Claude Code automatically loads skills from this folder
- In Claude.ai, you can upload individual skills to your projects

## Performance

### First Load

- Fetches ~880 skills from GitHub
- Parallel processing (8 concurrent downloads)
- Usually completes in 5-10 seconds
- Results automatically cached

### Subsequent Loads

- **Instant** (< 1 second) - Uses 1-hour cache
- Cache automatically refreshes after 1 hour

### Behind the Scenes

- **Parallel processing**: Fetches 8 skills simultaneously (8x faster than sequential)
- **Intelligent caching**: Stores results in `~/.raycast/skills/.cache/`
- **Progress feedback**: Toast notifications show processing status
- **Error resilience**: Failed skills don't block others

## File Structure

After downloading skills:

```
~/.raycast/skills/
├── skill-name-1/
│   └── SKILL.md
├── skill-name-2/
│   └── SKILL.md
└── .cache/
    ├── https_github_com_anthropics_skills.json
    └── https_github_com_ComposioHQ_awesome_claude_skills.json
```

## Popular Skill Collections

### ComposioHQ Awesome Claude Skills

**Collection**: 500+ pre-built automation skills categorized by:

- **CRM & Sales**: HubSpot, Salesforce, Pipedrive, Close
- **Project Management**: Asana, Jira, Linear, Monday.com, Notion, Trello
- **Communication**: Slack, Discord, Teams, Gmail, Outlook, Zoom
- **Data & Analytics**: Google Sheets, Airtable, Coda, Mixpanel
- **Marketing**: Mailchimp, Brevo, Klaviyo, ActiveCampaign
- **And 400+ more services**

### Anthropic Skills

**Collection**: Official example skills including:

- Document processing (DOCX, PDF, PPTX, XLSX)
- Web artifacts and code generation
- Data analysis tools

## Development

Repository structure:

```
src/
├── find-and-download-skills.tsx  # Main skill browser UI
├── skill-detail.tsx              # Skill preview/detail view
├── list-skills.tsx               # Local skill viewer
├── config.ts                      # Configuration & preferences
├── helpers/
│   ├── skill-downloader.ts       # GitHub API integration
│   └── cache.ts                  # Caching system
└── tools/
    └── skill-tool.ts            # AI chat tool integration
```

## Troubleshooting

### Skills not loading

- Check internet connection
- Verify GitHub repository URLs are accessible
- Check if repositories have SKILL.md files
- Try adding a GitHub token for higher rate limits

### Slow first load

- First load fetches all skill metadata (normal behavior)
- Subsequent loads are instant from cache
- Add GitHub token to increase rate limits

### Cache issues

- Cache is in `~/.raycast/skills/.cache/`
- Automatically refreshes after 1 hour
- Delete cache files to force a refresh

## Caching Details

- **TTL**: 1 hour
- **Location**: `~/.raycast/skills/.cache/`
- **File format**: JSON with timestamp
- **Auto-refresh**: After 1 hour, cache automatically refreshes

### Manual Cache Clear

```bash
rm -rf ~/.raycast/skills/.cache/
```

## API

The extension uses GitHub's public APIs:

- **Tree API**: Lists all SKILL.md files in a repository
- **Raw Content API**: Fetches skill metadata and descriptions
- **Repo API**: Detects default branch (main, master, etc.)

No authentication required, but rate limits are higher with a GitHub token.

## Performance Stats

### ComposioHQ (864 skills)

- **Initial load**: ~8-10 seconds (parallel, 8 concurrent)
- **Cached load**: <1 second
- **Cache validity**: 1 hour

### Anthropic (17 skills)

- **Initial load**: ~2 seconds
- **Cached load**: <0.5 seconds

## Contributing

Found an issue or have a feature request?

- [GitHub Issues](https://github.com/lauener/raycast-skill-tool/issues)
- Provide repository URLs to add custom skill collections

## License

MIT

## Resources

- [Claude Skills Guide](https://docs.anthropic.com/en/docs/build-a-system-with-claude/skills)
- [ComposioHQ Awesome Claude Skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [Anthropic Skills](https://github.com/anthropics/skills)
