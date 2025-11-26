/**
 * Voxta Scriban Template Editor
 * A web-based editor for managing Scriban templates with version control
 */

(function () {
    'use strict';

    // ===========================================
    // Configuration & Constants
    // ===========================================

    const CONFIG = {
        API_BASE: 'http://localhost:5385/api/templates',
        TEMPLATE_PATHS: {
            prompts: 'Resources/Prompts/Default/en',
            modules: 'Resources/Modules',
            formatting: 'Resources/Formatting'
        },
        APP_TYPES: ['Companion', 'Assistant', 'Roleplay', 'Storytelling'],
        STORAGE_KEY: 'voxta-template-editor-state'
    };

    // Template categories with their file patterns and available variables
    const TEMPLATE_CATEGORIES = {
        'TextGen': {
            path: 'TextGen',
            description: 'Main chat/roleplay generation',
            variables: ['char', 'user', 'char_description', 'char_personality', 'char_profile',
                       'char_message_examples', 'char_post_history_instructions', 'user_description',
                       'other_chars', 'other_characters', 'messages', 'previous_messages', 'reply_to',
                       'prefix', 'last_char', 'scenario', 'summary', 'context', 'now', 'documents',
                       'memories', 'functions', 'last_function_call', 'vision', 'chat_style',
                       'chat_flow', 'explicitLevel', 'text_processing', 'system_prompt',
                       'system_intro', 'system_prompt_addons']
        },
        'TextGen/Includes': {
            path: 'TextGen/Includes',
            description: 'Shared TextGen components',
            variables: ['char', 'user', 'char_description', 'char_personality', 'char_profile',
                       'char_message_examples', 'user_description', 'other_chars', 'other_characters',
                       'scenario', 'summary', 'context', 'now', 'documents', 'memories', 'functions',
                       'vision', 'chat_style', 'chat_flow', 'explicitLevel', 'text_processing',
                       'system_prompt_addons']
        },
        'ActionInference': {
            path: 'ActionInference',
            description: 'Action/function selection',
            variables: ['char', 'user', 'char_personality', 'scenario', 'now', 'context',
                       'messages', 'previous_messages', 'last_messages', 'message', 'functions',
                       'last_function_call', 'characters', 'user_description', 'last_char']
        },
        'Summarization': {
            path: 'Summarization',
            description: 'Memory & summary generation',
            variables: ['char', 'user', 'char_description', 'char_personality', 'char_profile',
                       'user_description', 'other_characters', 'scenario', 'summary', 'explicit',
                       'messages_to_summarize', 'messages_to_extract', 'document', 'memories']
        },
        'ComputerVision': {
            path: 'ComputerVision',
            description: 'Image description',
            variables: ['char', 'user', 'explicitLevel', 'source', 'vision', 'image_label',
                       'image_filename', 'message']
        },
        'ImageGen': {
            path: 'ImageGen',
            description: 'Image prompt generation',
            variables: ['char', 'user', 'char_description', 'user_description', 'instructions',
                       'user_prompt', 'include_char_appearance', 'include_user_appearance',
                       'previous_messages', 'latest_messages', 'last_image_prompt']
        },
        'SpecialMessages': {
            path: 'SpecialMessages',
            description: 'Event notifications',
            variables: ['char', 'user', 'message', 'effect', 'away_duration', 'image_description', 'source']
        },
        'Includes': {
            path: 'Includes',
            description: 'Shared template components',
            variables: ['char', 'user', 'messages', 'chat_style']
        },
        'ChainOfThought': {
            path: 'ChainOfThought/en',
            isModule: true,
            description: 'Pre-reply thinking/review',
            variables: ['char', 'user', 'char_personality', 'char_description', 'char_profile',
                       'scenario', 'summary', 'context', 'now', 'messages', 'explicit', 'suggested_reply']
        },
        'Continuations': {
            path: 'Continuations/en',
            isModule: true,
            description: 'Idle/continuation messages',
            variables: ['char', 'user', 'maybe', 'x']
        }
    };

    // Variable definitions with types and descriptions
    const VARIABLE_DEFINITIONS = {
        // Identity
        char: { type: 'string', description: 'Name of the AI character being role-played' },
        user: { type: 'string', description: 'Name of the human user' },

        // Character Profile
        char_description: { type: 'string', description: 'Physical appearance of the character' },
        char_personality: { type: 'string', description: 'Personality traits and behavior' },
        char_profile: { type: 'string', description: 'Extended character information/lore' },
        char_message_examples: { type: 'array', description: 'Example messages showing how character speaks' },
        char_post_history_instructions: { type: 'string', description: 'Instructions added after message history' },

        // User Profile
        user_description: { type: 'string', description: 'Description of the user/persona' },

        // Other Characters
        other_chars: { type: 'array<string>', description: 'List of other character names' },
        other_characters: { type: 'array<object>', description: 'Detailed character objects' },
        characters: { type: 'array<object>', description: 'All characters (story mode)' },

        // Messages
        messages: { type: 'array', description: 'Full conversation history' },
        previous_messages: { type: 'array', description: 'Earlier messages for context' },
        last_messages: { type: 'array', description: 'Recent messages for action inference' },
        latest_messages: { type: 'array', description: 'Most recent messages (image gen)' },
        messages_to_extract: { type: 'array', description: 'Messages for memory extraction' },
        messages_to_summarize: { type: 'array', description: 'Messages for summarization' },
        message: { type: 'object|string', description: 'Current message being processed' },

        // Reply Context
        reply_to: { type: 'object', description: 'Message being replied to' },
        prefix: { type: 'string', description: 'Forced start of response' },
        last_char: { type: 'string', description: 'Name of last character who spoke' },

        // Context & World State
        scenario: { type: 'string', description: 'Initial scenario/setting description' },
        summary: { type: 'string', description: 'Summary of story so far' },
        context: { type: 'array<string>', description: 'Current contextual information' },
        now: { type: 'string', description: 'Current date/time' },
        event_text: { type: 'string', description: 'Specific event specifications (story mode)' },
        narrator_profile: { type: 'string', description: 'Profile for narrator voice (story mode)' },

        // Documents & Memories
        documents: { type: 'array', description: 'Documents for reference (RAG)' },
        document: { type: 'string|object', description: 'Single document for memory extraction' },
        memories: { type: 'array', description: 'Stored memories for the character' },

        // Functions
        functions: { type: 'array', description: 'Available functions/actions' },
        last_function_call: { type: 'object|null', description: 'Previously executed function' },

        // Vision/Image
        vision: { type: 'string', description: 'Description of what character currently sees' },
        source: { type: 'enum', description: 'Image source: "Eyes", "Screen", "Attachment"' },
        image_description: { type: 'string', description: 'Generated description of an image' },
        image_label: { type: 'string', description: 'Additional info provided with image' },
        image_filename: { type: 'string', description: 'Filename of attached image' },
        last_image_prompt: { type: 'string', description: 'Previously generated image prompt' },
        include_char_appearance: { type: 'boolean', description: 'Include character appearance in prompt' },
        include_user_appearance: { type: 'boolean', description: 'Include user appearance in prompt' },
        instructions: { type: 'string', description: 'Custom image gen prompting instructions' },
        user_prompt: { type: 'string', description: 'Custom user prompt override' },

        // Configuration
        chat_style: { type: 'enum', description: '"Assistant" | "Roleplay" | "Storytelling"' },
        chat_flow: { type: 'enum', description: '"Story" | (other)' },
        explicitLevel: { type: 'enum', description: '"Prohibited" | "Allowed" | "Encouraged"' },
        text_processing: { type: 'enum', description: '"Roleplay" | (other)' },
        explicit: { type: 'boolean', description: 'Allows unrestricted vocabulary' },

        // System
        system_prompt: { type: 'string', description: 'Complete override for system prompt' },
        system_intro: { type: 'string', description: 'Intro section override' },
        system_prompt_addons: { type: 'array<string>', description: 'Additional system instructions' },

        // Special Messages
        away_duration: { type: 'string', description: 'Human-readable duration' },
        effect: { type: 'string', description: 'Action effect description' },

        // Module-specific
        suggested_reply: { type: 'string', description: 'Reply fragment to review (ReviewPass)' },
        maybe: { type: 'boolean', description: 'Flag to include optional phrases' },
        x: { type: 'integer', description: 'Internal random counter' }
    };

    // ===========================================
    // State Management
    // ===========================================

    const state = {
        isOpen: false,
        templates: [],
        versions: {},
        currentTemplate: null,
        currentVersion: null,
        originalContent: '',
        modifiedContent: '',
        isDirty: false,
        activePanel: 'versions',
        editorInstance: null
    };

    // ===========================================
    // Utility Functions
    // ===========================================

    function generateId() {
        return 'v' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ===========================================
    // Storage Layer
    // ===========================================

    const Storage = {
        getManifest() {
            const data = localStorage.getItem(CONFIG.STORAGE_KEY + '-manifest');
            if (data) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.error('Failed to parse manifest:', e);
                }
            }
            return {
                templates: {},
                originalBackup: null
            };
        },

        saveManifest(manifest) {
            localStorage.setItem(CONFIG.STORAGE_KEY + '-manifest', JSON.stringify(manifest));
        },

        getVersionContent(templatePath, versionId) {
            const key = `${CONFIG.STORAGE_KEY}-content-${templatePath}-${versionId}`;
            return localStorage.getItem(key);
        },

        saveVersionContent(templatePath, versionId, content) {
            const key = `${CONFIG.STORAGE_KEY}-content-${templatePath}-${versionId}`;
            localStorage.setItem(key, content);
        },

        deleteVersionContent(templatePath, versionId) {
            const key = `${CONFIG.STORAGE_KEY}-content-${templatePath}-${versionId}`;
            localStorage.removeItem(key);
        }
    };

    // ===========================================
    // Template API
    // ===========================================

    const TemplateAPI = {
        async fetchTemplate(path) {
            // Fetch from the template server bridge
            try {
                const response = await fetch(`${CONFIG.API_BASE}/${encodeURIComponent(path)}`);
                if (response.ok) {
                    return await response.text();
                }
            } catch (e) {
                console.warn(`Could not fetch template: ${path}`, e);
                UI.showToast('Template server not running. Start it with: node template-server.js', 'error');
            }
            return null;
        },

        async saveTemplate(path, content) {
            try {
                const response = await fetch(`${CONFIG.API_BASE}/${encodeURIComponent(path)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                if (response.ok) {
                    return true;
                }
            } catch (e) {
                console.warn(`Could not save template: ${path}`, e);
                UI.showToast('Failed to save template. Is the server running?', 'error');
            }
            return false;
        },

        async checkServer() {
            try {
                const response = await fetch('http://localhost:5385/health');
                return response.ok;
            } catch (e) {
                return false;
            }
        },

        async listTemplates() {
            // Build template list from known categories
            const templates = [];

            for (const [category, config] of Object.entries(TEMPLATE_CATEGORIES)) {
                const basePath = config.isModule
                    ? `${CONFIG.TEMPLATE_PATHS.modules}/${config.path}`
                    : `${CONFIG.TEMPLATE_PATHS.prompts}/${config.path}`;

                templates.push({
                    category,
                    basePath,
                    description: config.description,
                    isModule: config.isModule || false,
                    variables: config.variables,
                    files: [] // Will be populated by discovery
                });
            }

            return templates;
        },

        getVersions(templatePath) {
            const manifest = Storage.getManifest();
            return manifest.templates[templatePath]?.versions || [];
        },

        getActiveVersion(templatePath) {
            const manifest = Storage.getManifest();
            return manifest.templates[templatePath]?.activeVersion || 'original';
        },

        createVersion(templatePath, name, type, content, description = '') {
            const manifest = Storage.getManifest();
            const versionId = generateId();

            if (!manifest.templates[templatePath]) {
                manifest.templates[templatePath] = {
                    activeVersion: 'original',
                    versions: []
                };
            }

            const version = {
                id: versionId,
                name,
                type,
                created: new Date().toISOString(),
                description,
                isOriginal: false
            };

            manifest.templates[templatePath].versions.push(version);
            Storage.saveManifest(manifest);
            Storage.saveVersionContent(templatePath, versionId, content);

            return version;
        },

        setActiveVersion(templatePath, versionId) {
            const manifest = Storage.getManifest();
            if (manifest.templates[templatePath]) {
                manifest.templates[templatePath].activeVersion = versionId;
                Storage.saveManifest(manifest);
            }
        },

        deleteVersion(templatePath, versionId) {
            const manifest = Storage.getManifest();
            if (manifest.templates[templatePath]) {
                manifest.templates[templatePath].versions =
                    manifest.templates[templatePath].versions.filter(v => v.id !== versionId);

                if (manifest.templates[templatePath].activeVersion === versionId) {
                    manifest.templates[templatePath].activeVersion = 'original';
                }

                Storage.saveManifest(manifest);
                Storage.deleteVersionContent(templatePath, versionId);
            }
        },

        async getVersionContent(templatePath, versionId) {
            if (versionId === 'original') {
                return await this.fetchTemplate(templatePath);
            }
            return Storage.getVersionContent(templatePath, versionId);
        }
    };

    // ===========================================
    // Diff Engine
    // ===========================================

    const DiffEngine = {
        compute(oldText, newText) {
            const oldLines = oldText.split('\n');
            const newLines = newText.split('\n');
            const diff = [];

            // Simple line-by-line diff (for a production app, use a proper diff library)
            let i = 0, j = 0;

            while (i < oldLines.length || j < newLines.length) {
                if (i >= oldLines.length) {
                    diff.push({ type: 'added', line: newLines[j++] });
                } else if (j >= newLines.length) {
                    diff.push({ type: 'removed', line: oldLines[i++] });
                } else if (oldLines[i] === newLines[j]) {
                    diff.push({ type: 'unchanged', line: oldLines[i] });
                    i++;
                    j++;
                } else {
                    // Look ahead to find matching lines
                    let foundInNew = newLines.indexOf(oldLines[i], j);
                    let foundInOld = oldLines.indexOf(newLines[j], i);

                    if (foundInNew !== -1 && (foundInOld === -1 || foundInNew - j < foundInOld - i)) {
                        while (j < foundInNew) {
                            diff.push({ type: 'added', line: newLines[j++] });
                        }
                    } else if (foundInOld !== -1) {
                        while (i < foundInOld) {
                            diff.push({ type: 'removed', line: oldLines[i++] });
                        }
                    } else {
                        diff.push({ type: 'removed', line: oldLines[i++] });
                        diff.push({ type: 'added', line: newLines[j++] });
                    }
                }
            }

            return diff;
        },

        render(diff) {
            return diff.map(d => {
                const prefix = d.type === 'added' ? '+' : d.type === 'removed' ? '-' : ' ';
                const className = d.type !== 'unchanged' ? `diff-line ${d.type}` : 'diff-line';
                return `<div class="${className}">${prefix} ${escapeHtml(d.line)}</div>`;
            }).join('');
        }
    };

    // ===========================================
    // UI Components
    // ===========================================

    const UI = {
        icons: {
            edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
            save: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
            file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
            folder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
            chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
            plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
            diff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
            reset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
            code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
        },

        createToggleButton() {
            const button = document.createElement('button');
            button.className = 'template-editor-toggle';
            button.innerHTML = this.icons.edit;
            button.title = 'Open Template Editor';
            button.addEventListener('click', () => Editor.open());
            return button;
        },

        createOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'template-editor-overlay';
            overlay.innerHTML = `
                <div class="template-editor-container">
                    <header class="template-editor-header">
                        <h2>${this.icons.code} Scriban Template Editor</h2>
                        <button class="template-editor-close" title="Close">${this.icons.close}</button>
                    </header>

                    <aside class="template-browser">
                        <div class="template-browser-header">
                            <input type="text" class="template-browser-search" placeholder="Search templates...">
                        </div>
                        <div class="template-categories"></div>
                    </aside>

                    <main class="template-editor-main">
                        <div class="editor-toolbar">
                            <div class="editor-toolbar-group">
                                <button class="toolbar-btn" id="btn-save" title="Save as new version">
                                    ${this.icons.save} Save
                                </button>
                                <button class="toolbar-btn" id="btn-reset" title="Reset to saved">
                                    ${this.icons.reset} Reset
                                </button>
                            </div>
                            <div class="editor-toolbar-divider"></div>
                            <div class="editor-toolbar-group">
                                <button class="toolbar-btn" id="btn-diff" title="Compare versions">
                                    ${this.icons.diff} Diff
                                </button>
                            </div>
                            <div class="editor-toolbar-divider"></div>
                            <div class="editor-toolbar-group">
                                <button class="toolbar-btn primary" id="btn-save-disk" title="Save changes to disk">
                                    ${this.icons.save} Save to Disk
                                </button>
                            </div>
                            <div class="editor-path" id="editor-path">Select a template to edit</div>
                        </div>
                        <div class="editor-codemirror-wrapper" id="editor-wrapper">
                            <div style="padding: 40px; text-align: center; color: #666;">
                                Select a template from the sidebar to begin editing
                            </div>
                        </div>
                    </main>

                    <aside class="template-editor-panel">
                        <div class="panel-tabs">
                            <button class="panel-tab active" data-panel="versions">Versions</button>
                            <button class="panel-tab" data-panel="variables">Variables</button>
                        </div>
                        <div class="panel-content active" data-panel="versions" id="panel-versions">
                            <div class="version-list" id="version-list">
                                <p style="color: #666; text-align: center;">Select a template to see versions</p>
                            </div>
                        </div>
                        <div class="panel-content" data-panel="variables" id="panel-variables">
                            <div id="variables-list">
                                <p style="color: #666; text-align: center;">Select a template to see available variables</p>
                            </div>
                        </div>
                    </aside>

                    <footer class="template-editor-footer">
                        <div class="footer-info">
                            <span id="footer-status">Ready</span>
                        </div>
                        <div class="footer-actions">
                            <button class="toolbar-btn" id="btn-backup">Backup Originals</button>
                        </div>
                    </footer>
                </div>
            `;
            return overlay;
        },

        showToast(message, type = 'info') {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => toast.remove(), 3000);
        },

        showDialog(title, content, actions) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-dialog-backdrop';

            const dialog = document.createElement('div');
            dialog.className = 'modal-dialog';
            dialog.innerHTML = `
                <h3>${title}</h3>
                <div class="modal-dialog-content">${content}</div>
                <div class="form-actions"></div>
            `;

            const actionsContainer = dialog.querySelector('.form-actions');
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = `toolbar-btn ${action.primary ? 'primary' : ''}`;
                btn.textContent = action.label;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (action.callback) {
                        const shouldClose = action.callback(dialog);
                        if (shouldClose === false) return;
                    }
                    backdrop.remove();
                });
                actionsContainer.appendChild(btn);
            });

            backdrop.appendChild(dialog);
            document.body.appendChild(backdrop);

            // Close on backdrop click
            let clickStartedOnBackdrop = false;
            backdrop.addEventListener('mousedown', (e) => {
                clickStartedOnBackdrop = (e.target === backdrop);
            });

            backdrop.addEventListener('mouseup', (e) => {
                if (clickStartedOnBackdrop && e.target === backdrop) {
                    backdrop.remove();
                }
                clickStartedOnBackdrop = false;
            });

            requestAnimationFrame(() => {
                const firstInput = dialog.querySelector('input, select, textarea');
                if (firstInput) firstInput.focus();
            });

            return dialog;
        }
    };

    // ===========================================
    // Editor Controller
    // ===========================================

    const Editor = {
        overlay: null,
        cmEditor: null,

        async init() {
            // Create toggle button
            const toggle = UI.createToggleButton();
            document.body.appendChild(toggle);

            // Create overlay (hidden)
            this.overlay = UI.createOverlay();
            document.body.appendChild(this.overlay);

            // Bind events
            this.bindEvents();

            console.log('Template Editor initialized');
        },

        bindEvents() {
            // Close button
            this.overlay.querySelector('.template-editor-close').addEventListener('click', () => this.close());

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && state.isOpen) {
                    this.close();
                }
            });

            // Panel tabs
            this.overlay.querySelectorAll('.panel-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    this.overlay.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                    this.overlay.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
                    tab.classList.add('active');
                    this.overlay.querySelector(`.panel-content[data-panel="${tab.dataset.panel}"]`).classList.add('active');
                });
            });

            // Template search
            const searchInput = this.overlay.querySelector('.template-browser-search');
            searchInput.addEventListener('input', debounce((e) => {
                this.filterTemplates(e.target.value);
            }, 200));

            // Toolbar buttons
            document.getElementById('btn-save').addEventListener('click', () => this.saveVersion());
            document.getElementById('btn-reset').addEventListener('click', () => this.resetContent());
            document.getElementById('btn-diff').addEventListener('click', () => this.showDiff());
            document.getElementById('btn-backup').addEventListener('click', () => this.backupOriginals());
            document.getElementById('btn-save-disk').addEventListener('click', () => this.saveToDisk());
        },

        async open() {
            state.isOpen = true;
            this.overlay.classList.add('visible');

            // Check if template server is running
            const serverOk = await TemplateAPI.checkServer();
            if (!serverOk) {
                UI.showToast('Template server not running! Start it with: node template-server.js', 'error');
            }

            await this.loadTemplateList();
        },

        close() {
            if (state.isDirty) {
                if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                    return;
                }
            }
            state.isOpen = false;
            this.overlay.classList.remove('visible');
        },

        async loadTemplateList() {
            const categories = this.overlay.querySelector('.template-categories');
            categories.innerHTML = '';

            // Build the template tree based on known categories
            for (const [categoryName, config] of Object.entries(TEMPLATE_CATEGORIES)) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'template-category';
                categoryDiv.innerHTML = `
                    <div class="template-category-header">
                        <span>${config.isModule ? '🧩 ' : ''}${categoryName}</span>
                        <span class="chevron">${UI.icons.chevron}</span>
                    </div>
                    <ul class="template-list" data-category="${categoryName}"></ul>
                `;

                categoryDiv.querySelector('.template-category-header').addEventListener('click', () => {
                    categoryDiv.classList.toggle('collapsed');
                });

                categories.appendChild(categoryDiv);

                // Load templates for this category
                await this.loadCategoryTemplates(categoryName, config, categoryDiv.querySelector('.template-list'));
            }
        },

        async loadCategoryTemplates(categoryName, config, listElement) {
            // Define known template files for each category
            const knownFiles = this.getKnownTemplateFiles(categoryName);

            for (const fileName of knownFiles) {
                const basePath = config.isModule
                    ? `${CONFIG.TEMPLATE_PATHS.modules}/${config.path}`
                    : `${CONFIG.TEMPLATE_PATHS.prompts}/${config.path}`;
                const fullPath = `${basePath}/${fileName}`;

                const li = document.createElement('li');
                li.className = 'template-item';
                li.innerHTML = `
                    <span class="template-icon">${UI.icons.file}</span>
                    <span class="template-name">${fileName.replace('.scriban', '')}</span>
                `;
                li.dataset.path = fullPath;
                li.dataset.category = categoryName;

                // Check if modified
                const versions = TemplateAPI.getVersions(fullPath);
                if (versions.length > 0) {
                    li.classList.add('modified');
                }

                li.addEventListener('click', () => this.selectTemplate(fullPath, categoryName));
                listElement.appendChild(li);
            }
        },

        getKnownTemplateFiles(categoryName) {
            const fileMap = {
                'TextGen': [
                    'ChatInstructSystemMessage.scriban',
                    'ChatInstructUserMessage.scriban',
                    'ChatInstructResponsePrefix.scriban',
                    'ChatMessagesSystemMessage.scriban',
                    'PostHistorySystemMessage.scriban',
                    'StoryWriterSystemMessage.scriban',
                    'StoryWriterUserMessage.scriban',
                    'StoryWriterResponsePrefix.scriban'
                ],
                'TextGen/Includes': [
                    'Intro.scriban',
                    'MainCharacterProfile.scriban',
                    'MainCharacterProfileHeader.scriban',
                    'UserProfile.scriban',
                    'UserProfileHeader.scriban',
                    'Scenario.scriban',
                    'ScenarioHeader.scriban',
                    'Summary.scriban',
                    'SummaryHeader.scriban',
                    'Context.scriban',
                    'ContextHeader.scriban',
                    'DateTime.scriban',
                    'Documents.scriban',
                    'DocumentsHeader.scriban',
                    'Memories.scriban',
                    'MemoriesHeader.scriban',
                    'MessagesHeader.scriban',
                    'OtherCharacters.scriban',
                    'OtherCharactersHeader.scriban',
                    'ReplyHeader.scriban',
                    'ReplyInstructions.scriban'
                ],
                'ActionInference': [
                    'CharacterActionInferenceSystemMessage.scriban',
                    'CharacterActionInferenceUserMessage.scriban',
                    'CharacterActionInferenceResponsePrefix.scriban',
                    'UserActionInferenceSystemMessage.scriban',
                    'UserActionInferenceUserMessage.scriban',
                    'UserActionInferenceResponsePrefix.scriban',
                    'ChatFlowSystemMessage.scriban',
                    'ChatFlowUserMessage.scriban',
                    'ChatFlowResponsePrefix.scriban'
                ],
                'Summarization': [
                    'SummarizationSystemMessage.scriban',
                    'SummarizationUserMessage.scriban',
                    'SummarizationResponsePrefix.scriban',
                    'MemoryExtractionSystemMessage.scriban',
                    'MemoryExtractionUserMessage.scriban',
                    'MemoryExtractionResponsePrefix.scriban',
                    'MemoryMergeSystemMessage.scriban',
                    'MemoryMergeUserMessage.scriban',
                    'MemoryMergeResponsePrefix.scriban'
                ],
                'ComputerVision': [
                    'ComputerVisionSystemMessage.scriban',
                    'ComputerVisionUserMessage.scriban',
                    'ComputerVisionResponsePrefix.scriban'
                ],
                'ImageGen': [
                    'ImagineSystemMessage.scriban',
                    'ImagineUserMessage.scriban',
                    'ImagineResponsePrefix.scriban'
                ],
                'SpecialMessages': [
                    'ActionEffect.scriban',
                    'AttachedImage.scriban',
                    'ChatMemberAdded.scriban',
                    'ChatMemberRemoved.scriban',
                    'Interrupt.scriban',
                    'ReturnFromAway.scriban'
                ],
                'Includes': [
                    'Messages.scriban'
                ],
                'ChainOfThought': [
                    'ThinkPassBeforeReplySystemMessage.scriban',
                    'ThinkPassBeforeReplyUserMessage.scriban',
                    'ThinkPassBeforeReplyResponsePrefix.scriban',
                    'ReviewPassBeforeReplySystemMessage.scriban',
                    'ReviewPassBeforeReplyUserMessage.scriban',
                    'ReviewPassBeforeReplyResponsePrefix.scriban'
                ],
                'Continuations': [
                    'LongContinuationMessage.scriban',
                    'ShortContinuationMessage.scriban'
                ]
            };
            return fileMap[categoryName] || [];
        },

        async selectTemplate(path, category) {
            if (state.isDirty) {
                if (!confirm('You have unsaved changes. Continue without saving?')) {
                    return;
                }
            }

            // Update UI
            this.overlay.querySelectorAll('.template-item').forEach(item => {
                item.classList.toggle('active', item.dataset.path === path);
            });

            // Load template content
            state.currentTemplate = path;
            const activeVersion = TemplateAPI.getActiveVersion(path);
            const content = await TemplateAPI.getVersionContent(path, activeVersion);

            if (content === null) {
                this.updateEditorContent('// Template not found or could not be loaded\n// Path: ' + path);
                return;
            }

            state.originalContent = content;
            state.modifiedContent = content;
            state.currentVersion = activeVersion;
            state.isDirty = false;

            // Update editor
            this.updateEditorContent(content);
            document.getElementById('editor-path').textContent = path;

            // Update panels
            this.updateVersionsPanel(path);
            this.updateVariablesPanel(category);
        },

        updateEditorContent(content) {
            const wrapper = document.getElementById('editor-wrapper');

            // Create a basic textarea editor (CodeMirror integration would go here)
            wrapper.innerHTML = `
                <textarea id="template-editor-textarea"
                    style="width: 100%; height: 100%; background: #1a1b1e; color: #d4d4d4;
                           border: none; padding: 16px; font-family: 'JetBrains Mono', monospace;
                           font-size: 13px; line-height: 1.6; resize: none; outline: none;">
                </textarea>
            `;

            const textarea = document.getElementById('template-editor-textarea');
            textarea.value = content;

            textarea.addEventListener('input', () => {
                state.modifiedContent = textarea.value;
                state.isDirty = state.modifiedContent !== state.originalContent;
                this.updateStatus();
            });
        },

        updateVersionsPanel(templatePath, showNewForm = false) {
            const panel = document.getElementById('version-list');
            const versions = TemplateAPI.getVersions(templatePath);
            const activeVersion = TemplateAPI.getActiveVersion(templatePath);

            let html = `
                <div class="version-item ${activeVersion === 'original' ? 'active' : ''}" data-version="original">
                    <div class="version-item-header">
                        <span class="version-name">Original</span>
                        <span class="version-badge original">Default</span>
                    </div>
                    <div class="version-meta">Built-in template (read-only)</div>
                    <div class="version-actions">
                        <button class="version-action-btn" data-action="activate" data-version="original">Set Active</button>
                    </div>
                </div>
            `;

            for (const version of versions) {
                const isActive = activeVersion === version.id;
                html += `
                    <div class="version-item ${isActive ? 'active' : ''}" data-version="${version.id}">
                        <div class="version-item-header">
                            <span class="version-name">${escapeHtml(version.name)}</span>
                            ${isActive ? '<span class="version-badge active">Active</span>' : ''}
                        </div>
                        <div class="version-meta">${formatDate(version.created)}</div>
                        <div class="version-type">${escapeHtml(version.type)}</div>
                        <div class="version-actions">
                            <button class="version-action-btn" data-action="activate" data-version="${version.id}">Set Active</button>
                            <button class="version-action-btn" data-action="load" data-version="${version.id}">Load</button>
                            <button class="version-action-btn danger" data-action="delete" data-version="${version.id}">Delete</button>
                        </div>
                    </div>
                `;
            }

            // Inline new version form or button
            if (showNewForm) {
                html += `
                    <div class="version-item new-version-form" style="background: #2a2b2e;">
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">Version Name</label>
                            <input type="text" id="inline-version-name" placeholder="e.g., My Custom v1"
                                   style="width: 100%; padding: 8px; background: #1a1b1e; border: 1px solid #404040; border-radius: 4px; color: #fff; font-size: 12px; box-sizing: border-box;">
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">App Type</label>
                            <select id="inline-version-type" style="width: 100%; padding: 8px; background: #1a1b1e; border: 1px solid #404040; border-radius: 4px; color: #fff; font-size: 12px; box-sizing: border-box;">
                                ${CONFIG.APP_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="version-actions" style="display: flex; gap: 6px;">
                            <button class="version-action-btn" id="btn-cancel-version">Cancel</button>
                            <button class="toolbar-btn primary" id="btn-save-version" style="padding: 6px 12px; font-size: 12px;">Save</button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <button class="toolbar-btn primary" id="btn-new-version" style="width: 100%; margin-top: 12px;">
                        ${UI.icons.plus} New Version
                    </button>
                `;
            }

            panel.innerHTML = html;

            // Bind version actions
            panel.querySelectorAll('.version-action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const versionId = btn.dataset.version;
                    this.handleVersionAction(action, versionId);
                });
            });

            if (showNewForm) {
                const nameInput = document.getElementById('inline-version-name');
                nameInput.focus();

                document.getElementById('btn-cancel-version').addEventListener('click', () => {
                    this.updateVersionsPanel(templatePath, false);
                });

                document.getElementById('btn-save-version').addEventListener('click', () => {
                    this.doSaveVersion();
                });

                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.doSaveVersion();
                    } else if (e.key === 'Escape') {
                        this.updateVersionsPanel(templatePath, false);
                    }
                });
            } else {
                document.getElementById('btn-new-version').addEventListener('click', () => this.saveVersion());
            }
        },

        updateVariablesPanel(category) {
            const panel = document.getElementById('variables-list');
            const categoryConfig = TEMPLATE_CATEGORIES[category];

            if (!categoryConfig) {
                panel.innerHTML = '<p style="color: #666;">No variable information available</p>';
                return;
            }

            const variables = categoryConfig.variables || [];

            // Group variables by type
            const groups = {
                'Identity': ['char', 'user'],
                'Character': ['char_description', 'char_personality', 'char_profile', 'char_message_examples', 'char_post_history_instructions'],
                'User': ['user_description'],
                'Messages': ['messages', 'previous_messages', 'last_messages', 'latest_messages', 'messages_to_extract', 'messages_to_summarize', 'message', 'reply_to', 'prefix', 'last_char'],
                'Context': ['scenario', 'summary', 'context', 'now', 'event_text', 'narrator_profile', 'documents', 'document', 'memories'],
                'Functions': ['functions', 'last_function_call'],
                'Vision': ['vision', 'source', 'image_description', 'image_label', 'image_filename', 'last_image_prompt', 'include_char_appearance', 'include_user_appearance', 'instructions', 'user_prompt'],
                'Config': ['chat_style', 'chat_flow', 'explicitLevel', 'text_processing', 'explicit', 'system_prompt', 'system_intro', 'system_prompt_addons'],
                'Other': ['other_chars', 'other_characters', 'characters', 'away_duration', 'effect', 'suggested_reply', 'maybe', 'x']
            };

            let html = '';

            for (const [groupName, groupVars] of Object.entries(groups)) {
                const availableVars = groupVars.filter(v => variables.includes(v));
                if (availableVars.length === 0) continue;

                html += `
                    <div class="variable-section">
                        <div class="variable-section-title">${groupName}</div>
                        <div class="variable-list">
                            ${availableVars.map(v => {
                                const def = VARIABLE_DEFINITIONS[v] || { type: 'unknown', description: '' };
                                return `
                                    <div class="variable-item" data-var="${v}" title="${escapeHtml(def.description)}">
                                        <span class="variable-name">{{ ${v} }}</span>
                                        <span class="variable-type">${def.type}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            panel.innerHTML = html || '<p style="color: #666;">No variables available for this template</p>';

            // Click to insert
            panel.querySelectorAll('.variable-item').forEach(item => {
                item.addEventListener('click', () => {
                    const varName = item.dataset.var;
                    const textarea = document.getElementById('template-editor-textarea');
                    if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const insertion = `{{ ${varName} }}`;
                        textarea.value = text.substring(0, start) + insertion + text.substring(end);
                        textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
                        textarea.focus();
                        state.modifiedContent = textarea.value;
                        state.isDirty = true;
                        this.updateStatus();
                    }
                });
            });
        },

        async handleVersionAction(action, versionId) {
            const templatePath = state.currentTemplate;

            switch (action) {
                case 'activate':
                    TemplateAPI.setActiveVersion(templatePath, versionId);
                    UI.showToast('Version activated', 'success');
                    this.updateVersionsPanel(templatePath);
                    break;

                case 'load':
                    const content = await TemplateAPI.getVersionContent(templatePath, versionId);
                    if (content) {
                        state.modifiedContent = content;
                        state.currentVersion = versionId;
                        state.isDirty = content !== state.originalContent;
                        this.updateEditorContent(content);
                        this.updateStatus();
                    }
                    break;

                case 'delete':
                    if (confirm('Are you sure you want to delete this version?')) {
                        TemplateAPI.deleteVersion(templatePath, versionId);
                        UI.showToast('Version deleted', 'success');
                        this.updateVersionsPanel(templatePath);
                    }
                    break;
            }
        },

        saveVersion() {
            if (!state.currentTemplate) {
                UI.showToast('No template selected', 'error');
                return;
            }

            // Show inline form in the versions panel
            this.updateVersionsPanel(state.currentTemplate, true);
        },

        doSaveVersion() {
            const nameInput = document.getElementById('inline-version-name');
            const typeSelect = document.getElementById('inline-version-type');

            const name = nameInput.value.trim();
            const type = typeSelect.value;

            if (!name) {
                UI.showToast('Please enter a version name', 'error');
                nameInput.focus();
                return;
            }

            TemplateAPI.createVersion(state.currentTemplate, name, type, state.modifiedContent, '');
            state.isDirty = false;
            state.originalContent = state.modifiedContent;
            UI.showToast('Version saved successfully', 'success');
            this.updateVersionsPanel(state.currentTemplate, false);
            this.updateStatus();
        },

        resetContent() {
            if (!state.isDirty) {
                UI.showToast('No changes to reset', 'info');
                return;
            }

            if (confirm('Reset all changes to the last saved version?')) {
                state.modifiedContent = state.originalContent;
                state.isDirty = false;
                this.updateEditorContent(state.originalContent);
                this.updateStatus();
                UI.showToast('Changes reset', 'success');
            }
        },

        async saveToDisk() {
            if (!state.currentTemplate) {
                UI.showToast('No template selected', 'error');
                return;
            }

            if (!state.isDirty) {
                UI.showToast('No changes to save', 'info');
                return;
            }

            if (!confirm(`Save changes to ${state.currentTemplate}?\n\nThis will overwrite the file on disk. A backup will be created automatically.`)) {
                return;
            }

            const success = await TemplateAPI.saveTemplate(state.currentTemplate, state.modifiedContent);

            if (success) {
                state.originalContent = state.modifiedContent;
                state.isDirty = false;
                this.updateStatus();
                UI.showToast('Template saved to disk!', 'success');
            }
        },

        async showDiff() {
            if (!state.currentTemplate) {
                UI.showToast('No template selected', 'error');
                return;
            }

            const original = await TemplateAPI.getVersionContent(state.currentTemplate, 'original');
            const current = state.modifiedContent;

            if (!original) {
                UI.showToast('Could not load original template', 'error');
                return;
            }

            const diff = DiffEngine.compute(original, current);

            UI.showDialog('Compare with Original', `
                <div class="diff-container" style="max-height: 400px; overflow: auto;">
                    <div class="diff-content">${DiffEngine.render(diff)}</div>
                </div>
            `, [
                { label: 'Close' }
            ]);
        },

        backupOriginals() {
            UI.showDialog('Backup Original Templates', `
                <p style="color: #aaa; margin-bottom: 16px;">
                    This will save a copy of all original templates as a backup.
                    You can use this to restore templates after an app update.
                </p>
                <p style="color: #888; font-size: 12px;">
                    Note: Backups are stored in browser local storage.
                </p>
            `, [
                { label: 'Cancel' },
                {
                    label: 'Create Backup',
                    primary: true,
                    callback: () => {
                        const manifest = Storage.getManifest();
                        manifest.originalBackup = new Date().toISOString();
                        Storage.saveManifest(manifest);
                        UI.showToast('Backup created successfully', 'success');
                    }
                }
            ]);
        },

        filterTemplates(query) {
            const items = this.overlay.querySelectorAll('.template-item');
            const q = query.toLowerCase();

            items.forEach(item => {
                const name = item.querySelector('.template-name').textContent.toLowerCase();
                const category = item.dataset.category.toLowerCase();
                const matches = name.includes(q) || category.includes(q);
                item.style.display = matches ? '' : 'none';
            });

            // Show/hide empty categories
            this.overlay.querySelectorAll('.template-category').forEach(cat => {
                const visibleItems = cat.querySelectorAll('.template-item:not([style*="display: none"])');
                cat.style.display = visibleItems.length > 0 ? '' : 'none';
            });
        },

        updateStatus() {
            const status = document.getElementById('footer-status');
            if (state.isDirty) {
                status.textContent = 'Modified - unsaved changes';
                status.style.color = '#f59e0b';
            } else {
                status.textContent = 'Ready';
                status.style.color = '#666';
            }
        }
    };

    // ===========================================
    // Initialize on DOM Ready
    // ===========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Editor.init());
    } else {
        Editor.init();
    }

    // Expose for debugging
    window.VoxtaTemplateEditor = {
        Editor,
        TemplateAPI,
        state,
        CONFIG
    };

})();
