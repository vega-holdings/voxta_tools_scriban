# Voxta Scriban Template Editor

A web-based editor for managing Voxta's Scriban templates with version control, variable autocomplete, and diff comparison.

## Features

- **Template Browser**: Browse all Scriban templates organized by category (TextGen, ActionInference, Summarization, etc.)
- **Version Control**: Save multiple versions of templates with names and app types (Companion, Assistant, Roleplay, Storytelling)
- **Variable Reference**: Context-aware variable panel showing available variables for each template category
- **Diff Comparison**: Compare your changes against the original template
- **Disk Persistence**: Save changes directly to template files with automatic backups

## Installation

### 1. Copy the Editor Files

Copy these files to your Voxta installation's `wwwroot/assets/` directory:

```
wwwroot/assets/template-editor.js
wwwroot/assets/template-editor.css
```

### 2. Add to index.html

Add these lines to your Voxta's `wwwroot/index.html` just before the closing `</body>` tag:

```html
<!-- Voxta Template Editor -->
<link rel="stylesheet" href="/assets/template-editor.css">
<script src="/assets/template-editor.js" defer></script>
```

### 3. Set Up the File Server Bridge

The template editor needs a small Node.js server to read/write template files (since the web app can't access the filesystem directly).

Copy `template-server.js` to your Voxta installation root directory.

**Start the server:**

```bash
node template-server.js
```

The server runs on port 5385 and provides:
- `GET /api/templates` - List all templates
- `GET /api/templates/:path` - Read a template file
- `PUT /api/templates/:path` - Write a template file (creates automatic backup)
- `GET /health` - Health check

## Usage

1. Start the template server: `node template-server.js`
2. Start Voxta normally
3. Click the purple edit button in the bottom-left corner of the Voxta UI
4. Browse templates in the left sidebar
5. Edit templates in the main editor
6. Save versions using the right panel (stored in browser localStorage)
7. Click "Save to Disk" to write changes to the actual template files
8. **Refresh the Voxta page** (or start a new chat) to load the updated template - no restart required

## File Structure

```
voxta/
├── wwwroot/
│   ├── assets/
│   │   ├── template-editor.js    # Main editor module
│   │   └── template-editor.css   # Editor styles
│   └── index.html                # Add script/style tags here
├── template-server.js            # Node.js file server bridge
└── Resources/
    ├── Prompts/Default/en/       # Main prompt templates
    ├── Modules/                   # Module templates
    └── Formatting/                # Formatting templates
```

## Template Categories

| Category | Description | Location |
|----------|-------------|----------|
| TextGen | Main chat/roleplay generation | Resources/Prompts/Default/en/TextGen |
| ActionInference | Action/function selection | Resources/Prompts/Default/en/ActionInference |
| Summarization | Memory & summary generation | Resources/Prompts/Default/en/Summarization |
| ComputerVision | Image description | Resources/Prompts/Default/en/ComputerVision |
| ImageGen | Image prompt generation | Resources/Prompts/Default/en/ImageGen |
| SpecialMessages | Event notifications | Resources/Prompts/Default/en/SpecialMessages |
| ChainOfThought | Pre-reply thinking (module) | Resources/Modules/ChainOfThought/en |
| Continuations | Idle/continuation messages (module) | Resources/Modules/Continuations/en |

## Version Storage

Template versions are stored in browser localStorage. Each version includes:
- Version name
- App type (Companion, Assistant, Roleplay, Storytelling)
- Template content
- Creation timestamp

## Backups

When saving to disk, the server automatically creates backups in `Data/TemplateBackups/` with timestamps.

## Requirements

- Node.js (for the file server bridge)
- Modern web browser
- Voxta installation

## License

MIT
