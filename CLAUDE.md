# Voxta Scriban Template Editor

## Project Overview
A web-based Scriban template editor for the Voxta LLM chat application. Enables editing, versioning, and managing prompt templates used for chat generation, action inference, summarization, and more.

**GitHub Repository:** https://github.com/vega-holdings/voxta_tools_scriban

## Directory Structure

### Template Locations
```
Resources/Prompts/Default/en/          # Core prompt templates (EN only for Phase 1)
├── ActionInference/                    # Action/function selection templates
├── ComputerVision/                     # Image description templates
├── ImageGen/                           # Image generation prompt templates
├── Includes/                           # Shared template components (Messages.scriban)
├── SpecialMessages/                    # Event notifications
├── Summarization/                      # Memory & summary generation
└── TextGen/                            # Main chat/roleplay generation
    └── Includes/                       # TextGen-specific includes

Resources/Modules/                      # Addon module templates
├── ChainOfThought/en/                  # Pre-reply thinking/review
└── Continuations/en/                   # Idle/continuation messages

Resources/Formatting/                   # Prompt formatters (LLM-specific)
└── [FormatName]/Chat.scriban, Instruct.scriban

Data/Formatting/                        # User custom formatters (same structure)
```

### Web Assets
```
wwwroot/
├── index.html                          # Main SPA entry point
├── assets/                             # Bundled JS/CSS (Vite build)
│   ├── template-editor.js              # Template editor module
│   └── template-editor.css             # Template editor styles
```

## Template Categories & Types

### 4 Main Application Types (User-Swappable)
1. **Companion** - Character companion mode
2. **Assistant** - Standard assistant mode (chat_style == "Assistant")
3. **Roleplay** - Roleplay conversation mode (chat_style == "Roleplay")
4. **Storytelling** - Narrative storytelling mode (chat_style == "Storytelling")

### Template Categories
| Category | Purpose | Key Files |
|----------|---------|-----------|
| **TextGen** | Main chat/roleplay generation | ChatInstruct*, ChatMessages*, StoryWriter*, PostHistory* |
| **ActionInference** | Action/function selection | CharacterActionInference*, UserActionInference*, ChatFlow* |
| **Summarization** | Memory & summary generation | Summarization*, MemoryExtraction*, MemoryMerge* |
| **ComputerVision** | Image description | ComputerVision* |
| **ImageGen** | Image prompt generation | Imagine* |
| **SpecialMessages** | Event notifications | ActionEffect, AttachedImage, ChatMember*, Interrupt, ReturnFromAway |
| **Includes** | Shared template components | Messages, Context, MainCharacterProfile, etc. |
| **ChainOfThought** (Module) | Pre-reply thinking/review | ThinkPassBeforeReply*, ReviewPassBeforeReply* |
| **Continuations** (Module) | Idle/continuation messages | LongContinuationMessage, ShortContinuationMessage |

## Scriban Variable Reference

See `scriban-template-variable-map.md` for complete documentation.

### Core Variables (Always Available)
- `char` - AI character name
- `user` - Human user name
- `char_description`, `char_personality`, `char_profile` - Character info
- `user_description` - User persona
- `messages` - Conversation history array
- `scenario`, `summary`, `now`, `context` - World state

### Configuration Enums
- `chat_style`: "Assistant" | "Roleplay" | "Storytelling"
- `chat_flow`: "Story" | (other)
- `explicitLevel`: "Prohibited" | "Allowed" | "Encouraged"
- `text_processing`: "Roleplay" | (other)

### Context-Specific Variables
Variables available depend on template category - see variable map for details.

## Version Control System Design

### Storage Structure
```
Browser localStorage:
├── voxta-template-editor-versions     # Version content storage
└── voxta-template-editor-manifest     # Version registry

Data/TemplateBackups/                   # Auto backups before disk writes
└── [template-path].[timestamp].bak
```

### Manifest Schema (localStorage)
```json
{
  "templates": {
    "[template-path]": {
      "activeVersion": "v1",
      "versions": [
        {
          "id": "v1",
          "name": "User Display Name",
          "type": "Roleplay",
          "created": "2025-01-01T00:00:00Z",
          "description": "Optional notes",
          "isOriginal": false
        }
      ]
    }
  }
}
```

## Architecture

### Components

1. **template-editor.js** - Main editor module (~1300 lines)
   - `CONFIG` - API endpoints and settings
   - `TEMPLATE_CATEGORIES` - Category definitions with variables
   - `VARIABLE_DEFINITIONS` - Variable types and descriptions
   - `Storage` - localStorage wrapper for versions
   - `TemplateAPI` - File operations via bridge server
   - `DiffEngine` - Text comparison for diff view
   - `UI` - Toast notifications, dialogs, icons
   - `Editor` - Main controller (open/close, load, save, etc.)

2. **template-editor.css** - Styling (~730 lines)
   - Dark theme matching Voxta UI
   - 3-column layout (browser | editor | panel)
   - Responsive design for smaller screens
   - Namespaced classes (`te-*`) to avoid Bootstrap conflicts

3. **template-server.js** - Node.js file bridge (~220 lines)
   - Runs on port 5385
   - CORS-enabled for browser access
   - Auto-backup before writes

### CSS Class Namespacing
To avoid conflicts with Voxta's Bootstrap CSS:
- `te-modal-backdrop` (not `modal-dialog-backdrop`)
- `te-modal-dialog` (not `modal-dialog`)
- `te-form-group` (not `form-group`)
- `te-form-actions` (not `form-actions`)

## API Endpoints (template-server.js)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all .scriban files |
| GET | `/api/templates/:path` | Read template content |
| PUT | `/api/templates/:path` | Write template (auto-backup) |
| GET | `/health` | Health check |

## Frontend Features

### Editor UI
- **Toggle Button**: Purple circle, bottom-left (left: 166px, bottom: 11px)
- **Modal Overlay**: 95vw x 90vh, dark theme
- **3-Column Layout**:
  - Left: Template browser with collapsible categories
  - Center: Text editor with toolbar
  - Right: Versions panel / Variables panel (tabbed)

### Toolbar Actions
- **New Version**: Save current content as named version
- **Reset**: Revert to last saved content
- **Diff**: Compare with original template
- **Save to Disk**: Write to actual .scriban file

### Footer Actions
- **Backup Originals**: Create backup of all original templates
- **Apply Changes**: Save to disk + refresh page (reloads templates)

### Version Management
- Create named versions with app type (Companion/Assistant/Roleplay/Storytelling)
- Set active version
- Load previous versions
- Delete versions (except original)
- Inline form in panel (no modal dialog)

### Variables Panel
- Context-aware: shows only variables for current template category
- Click to insert variable at cursor
- Grouped by type (Identity, Character, Messages, etc.)

## Usage

### Quick Start
1. Start the template server:
   ```bash
   cd D:\voxtatest
   node template-server.js
   ```
2. Open Voxta in browser
3. Click purple edit button (bottom-left)
4. Browse/edit templates
5. Save versions or save to disk
6. **Click "Apply Changes"** or refresh page to reload templates

### Important: Template Reloading
Per Acidbubbles: Templates reload on page refresh or new chat - no Voxta restart needed.

## Files

### Created
| File | Purpose |
|------|---------|
| `wwwroot/assets/template-editor.js` | Main editor module |
| `wwwroot/assets/template-editor.css` | Editor styling |
| `template-server.js` | Node.js file bridge server |
| `README.md` | Public documentation |
| `.gitignore` | Git ignore rules |
| `CLAUDE.md` | This file - development notes |

### Modified
| File | Change |
|------|--------|
| `wwwroot/index.html` | Added CSS/JS includes for editor |

### Auto-Generated
| Location | Purpose |
|----------|---------|
| `Data/TemplateBackups/` | Automatic backups before disk writes |
| Browser localStorage | Version storage and manifest |

## Technical Notes

### Scriban Syntax Highlights
- `{{~ ... ~}}` - Whitespace-eating delimiters
- `{{ include 'TemplateName' }}` - Include other templates
- `{{ variable | filter }}` - Filter pipes
- `{{ for item in collection }}` - Loops
- `{{ if condition }}` - Conditionals
- `{{ case variable }}` - Switch statements
- `one_of [array]` - Random selection
- `some_of count [array]` - Select N random items

### Formatter Templates
Formatters (ChatML, Llama3, etc.) use different variables:
- `system_message` - Complete system prompt
- `messages` - Array with `role` and `value`
- `prefix` - Response prefix

### Known Issues Fixed
1. **Modal positioning**: Fixed with `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`
2. **Bootstrap CSS conflicts**: Namespaced all classes with `te-` prefix
3. **File serving**: Templates served via Node.js bridge on port 5385

## Current Status

**Phase**: Phase 1 Complete
**Last Updated**: 2025-11-28

### Completed
- [x] Template editor UI (modal/lightbox)
- [x] Template browser with categories
- [x] Version control system (localStorage)
- [x] Context-aware variable panel
- [x] Diff viewer for comparisons
- [x] Edit toggle button in Voxta UI
- [x] Node.js file bridge server
- [x] Save to disk functionality
- [x] Auto-backup on disk writes
- [x] Apply Changes button (save + refresh)
- [x] CSS namespacing to avoid Bootstrap conflicts
- [x] Inline version form (replaced modal dialog)
- [x] GitHub repo: vega-holdings/voxta_tools_scriban

### Phase 2 Roadmap
- [ ] Scriban syntax highlighting
- [ ] Variable autocomplete in editor
- [ ] Template preview with mock data
- [ ] Import/export templates as JSON
- [ ] Multi-language support (non-EN)
- [ ] Real-time template validation
- [ ] Formatter template editing

## Git History

```
0b7f0aa - Add "Apply Changes" button
be8f462 - Fix: namespace CSS classes to avoid Bootstrap conflicts
1293fd3 - Update README: clarify reload behavior
8c2f6ca - Initial commit: Voxta Scriban Template Editor
```
