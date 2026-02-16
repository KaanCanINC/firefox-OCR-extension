// src/settings.js
/**
 * Settings Page Module
 * Handles the settings page functionality (both Modal and Full Page)
 */

import { 
    loadRules, saveSettings, getSettings, 
    getProfileList, createProfile, deleteProfile, setActiveProfile, resetProfile,
    importSettings, exportSettings, resetSystem, renameProfile
} from "./utils/settingsManager.js";
import { createModal } from "./ui/modal.js";


// Helper for unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export async function initSettingsPage() {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    Object.assign(container.style, {
        fontFamily: 'Inter, sans-serif', backgroundColor: '#0f1724', color: '#f9fafb',
        minHeight: '100vh', padding: '40px', boxSizing: 'border-box'
    });

    // --- Header ---
    const header = document.createElement('div');
    Object.assign(header.style, {
        maxWidth: '900px', margin: '0 auto 30px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    });

    const titleGroup = document.createElement('div');
    const title = document.createElement('h1');
    title.textContent = 'OCR Settings';
    Object.assign(title.style, { fontSize: '28px', margin: '0 0 5px 0' });
    const subtitle = document.createElement('div');
    subtitle.textContent = 'Configure extension behavior and profiles';
    Object.assign(subtitle.style, { fontSize: '14px', color: '#9ca3af' });
    titleGroup.appendChild(title);
    titleGroup.appendChild(subtitle);

    // Header Actions
    const actions = document.createElement('div');
    Object.assign(actions.style, { display: 'flex', gap: '10px' });

    const reloadBtn = createButton('Reload UI', async () => location.reload(), 'secondary');
    
    actions.appendChild(reloadBtn);
    header.appendChild(titleGroup);
    header.appendChild(actions);

    const content = document.createElement('div');
    Object.assign(content.style, {
        maxWidth: '900px', margin: '0 auto', backgroundColor: '#374151',
        padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
    });

    container.appendChild(header);
    container.appendChild(content);
    document.body.appendChild(container);

    // Initial Render
    await renderSettingsUI(content, 'global');
}

function createButton(text, onClick, variant = 'primary') {
    const btn = document.createElement('button');
    btn.textContent = text;
    const bg = variant === 'danger' ? 'transparent' : (variant === 'secondary' ? '#4b5563' : '#4f46e5');
    const color = variant === 'danger' ? '#ef4444' : 'white';
    const border = variant === 'danger' ? '1px solid #ef4444' : 'none';
    
    Object.assign(btn.style, {
        padding: '8px 16px', background: bg, border: border, color: color, borderRadius: '6px', cursor: 'pointer', fontSize:'13px'
    });
    btn.onclick = onClick;
    return btn;
}

export async function openSettingsPanel() {
    if (document.getElementById('ocr-settings-panel')) return;

    // Backdrop (modal)
    const backdrop = document.createElement('div');
    backdrop.id = 'ocr-settings-backdrop';
    Object.assign(backdrop.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.45)', zIndex: '2147483646', opacity: '0', transition: 'opacity 220ms ease'
    });

    // Panel
    const panel = document.createElement('aside');
    panel.id = 'ocr-settings-panel';
    Object.assign(panel.style, {
      position: 'fixed', top: '0', left: '0', height: '100vh', width: 'min(480px, 90vw)',
      backgroundColor: '#0f1724', color: '#f9fafb', boxShadow: '2px 0 30px rgba(0,0,0,0.6)',
      zIndex: '2147483647', transform: 'translateX(-100%)', transition: 'transform 320ms cubic-bezier(.2,.9,.2,1)',
      overflowY: 'auto', padding: '20px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
    });

    const closePanel = () => {
        panel.style.transform = 'translateX(-100%)';
        backdrop.style.opacity = '0';
        setTimeout(() => {
            if (panel.parentElement) panel.remove();
            if (backdrop.parentElement) backdrop.remove();
        }, 340);
        location.reload(); // Refresh to apply changes if any
    };

    backdrop.addEventListener('click', closePanel);

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex'; header.style.alignItems = 'center'; header.style.justifyContent = 'space-between'; header.style.marginBottom = '12px';
    
    const title = document.createElement('h2'); title.textContent = 'Settings'; title.style.margin = '0'; title.style.fontSize = '18px';
    const closeBtn = document.createElement('button'); closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, { background: 'transparent', border: 'none', color: '#f9fafb', fontSize: '20px', cursor: 'pointer' });
    closeBtn.onclick = closePanel;

    // visible site URL to the right of the title
    const siteInfo = document.createElement('div');
    siteInfo.style.color = '#9ca3af'; siteInfo.style.fontSize = '12px'; siteInfo.style.marginLeft = '8px';
    try { siteInfo.textContent = (new URL(window.location.href)).hostname || 'current site'; } catch(e){ siteInfo.textContent = 'current site'; }
    
    const leftHeader = document.createElement('div'); leftHeader.style.display='flex'; leftHeader.style.alignItems='center'; leftHeader.style.gap='12px';
    leftHeader.appendChild(title); leftHeader.appendChild(siteInfo);
    header.appendChild(leftHeader); header.appendChild(closeBtn); panel.appendChild(header);

    // Render UI
    let currentScope = 'global';
    try {
        if (window.location && window.location.origin && window.location.origin !== 'null') {
            // Default to previously saved scope for this site if user selected it?
            // For now, logic defaults to global but checks site context
            // actually let's try to load the last used scope or default to global
            currentScope = `site:${window.location.origin}`;
        }
    } catch (e) {}

    await renderSettingsUI(panel, currentScope, closePanel);

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    
    requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        panel.style.transform = 'translateX(0)';
    });
}

/**
 * Main UI Builder
 */
async function renderSettingsUI(container, initialScope, closePanel) {
    // Reference Style: Darker background for scope row
    // Rule Scope controls (VERY TOP)
    const scopeRow = document.createElement('div'); 
    scopeRow.style.display = 'flex'; scopeRow.style.alignItems = 'center'; scopeRow.style.justifyContent = 'center'; 
    scopeRow.style.gap = '8px'; scopeRow.style.margin = '8px 0 12px 0';

    const scopeLeft = document.createElement('div'); 
    scopeLeft.style.display='flex'; scopeLeft.style.margin='8px 0 0 '; scopeLeft.style.alignItems='center'; 
    scopeLeft.style.gap='6px'; scopeLeft.style.flex='1';
    
    // Label
    const scopeLabel = document.createElement('label'); 
    scopeLabel.textContent = 'Rule Scope'; 
    scopeLabel.style.color='#e6eef8'; scopeLabel.style.fontSize='13px';
    
    // Select
    const scopeSelect = document.createElement('select'); 
    scopeSelect.id = 'rule_scope';
    Object.assign(scopeSelect.style, { 
        padding: '6px', background:'#0b1220', color:'#e6eef8', border:'1px solid #25303a', 
        borderRadius:'6px', minWidth: '160px', margin: '0 auto' 
    });

    const scopes = ['global'];
    // logic to add current site if not global
    let currentSite = null;
    try {
        if (window.location.origin && window.location.origin !== 'null') currentSite = `site:${window.location.origin}`;
    } catch(e){}
    
    if (currentSite && !scopes.includes(currentSite)) scopes.push(currentSite);

    // Populate select
    const populateScopes = () => {
        scopeSelect.innerHTML = '';
        scopes.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s === 'global' ? 'Global Rules' : (s.replace('site:', '') + ' (This Site)');
            scopeSelect.appendChild(opt);
        });
        scopeSelect.value = initialScope;
    };
    populateScopes();

    scopeLeft.appendChild(scopeLabel); 
    scopeLeft.appendChild(scopeSelect);

    // Scope Actions
    const scopeRight = document.createElement('div'); 
    scopeRight.style.display='flex'; scopeRight.style.alignItems='center'; scopeRight.style.gap='8px';
    
    const addScopeBtn = document.createElement('button'); 
    addScopeBtn.textContent = '+'; 
    Object.assign(addScopeBtn.style,{
        padding:'6px 8px',borderRadius:'6px',border:'none',background:'#4f46e5',color:'#fff',cursor:'pointer'
    });
    
    const deleteScopeBtn = document.createElement('button'); 
    deleteScopeBtn.textContent = '🗑️'; 
    Object.assign(deleteScopeBtn.style,{
        padding:'6px 8px',borderRadius:'6px',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer'
    });

    scopeRight.appendChild(addScopeBtn); 
    scopeRight.appendChild(deleteScopeBtn);

    scopeRow.appendChild(scopeLeft); 
    scopeRow.appendChild(scopeRight);
    container.appendChild(scopeRow);

    // Events for Scope
    scopeSelect.onchange = () => renderContent(scopeSelect.value);
    
    addScopeBtn.onclick = () => {
        if (currentSite && !scopes.includes(currentSite)) {
             scopes.push(currentSite);
             populateScopes();
             scopeSelect.value = currentSite;
             renderContent(currentSite);
        } else {
             alert('You are already on the current site scope or it is invalid.');
        }
    };

    deleteScopeBtn.onclick = async () => {
        const val = scopeSelect.value;
        if (val === 'global') return alert('Cannot delete Global scope.');
        if (confirm(`Delete rules for "${val}"?`)) {
            // Delete logic (clear storage keys)
            await saveDeletions(val, []); // Helpers handle site specific storage clearing effectively
            await saveReplacements(val, []);
             
            const idx = scopes.indexOf(val);
            if(idx > -1) scopes.splice(idx, 1);
            populateScopes();
            scopeSelect.value = 'global';
            renderContent('global');
        }
    };

    // Sections container
    const contentContainer = document.createElement('div'); 
    contentContainer.style.display = 'flex'; contentContainer.style.flexDirection = 'column'; contentContainer.style.gap = '14px';
    container.appendChild(contentContainer);

    const renderContent = async (scope) => {
        contentContainer.innerHTML = '';
        
        // 1. Profile Manager (as a card)
        if (scope === 'global') {
            const profileCard = createCard('Profile Management');
            await renderProfileManager(profileCard);
            contentContainer.appendChild(profileCard);
        }

        // 2. Rules Card (Manhwa Mode style)
        const rulesCard = createCard('Find & Replace Rules');
        const rulesSubtitle = document.createElement('div');
        rulesSubtitle.textContent = 'Characters/words to replace in the OCR text';
        rulesSubtitle.style.color = '#9ca3af'; rulesSubtitle.style.fontSize = '13px'; rulesSubtitle.style.marginBottom = '10px';
        rulesCard.insertBefore(rulesSubtitle, rulesCard.children[1]); // Insert after title

        const rules = await loadRules(scope);
        // We will render sections INTO the card
        renderReplacementsSection(rulesCard, rules.replacements, scope);
        renderDeletionsSection(rulesCard, rules.deletions, scope);
        contentContainer.appendChild(rulesCard);

        // 3. Configuration Card (Global only)
        if (scope === 'global') {
            const configCard = createCard('Pipeline Configuration');
            await renderPipelineConfig(configCard);
            
            const cleanDivider = document.createElement('div');
            cleanDivider.style.borderTop = '1px solid #374151'; cleanDivider.style.margin = '12px 0';
            configCard.appendChild(cleanDivider);
            
            await renderTextCleaningConfig(configCard, scope);
            
            const reconDivider = document.createElement('div');
            reconDivider.style.borderTop = '1px solid #374151'; reconDivider.style.margin = '12px 0';
            configCard.appendChild(reconDivider);
            
            await renderReconstructionConfig(configCard, scope);
            contentContainer.appendChild(configCard);

            const uiCard = createCard('UI & Behavior');
            await renderUIConfig(uiCard);
            contentContainer.appendChild(uiCard);
        }

        // 4. Data Management (Import/Export) - styled like reference
        if (scope === 'global') {
            const manageCard = document.createElement('section');
            Object.assign(manageCard.style, { 
                background: '#111827', padding: '12px', borderRadius: '8px', 
                display: 'flex', gap: '8px', justifyContent: 'center' 
            });
            await renderDataManagement(manageCard);
            contentContainer.appendChild(manageCard);
        }

        // Footer Actions
        const footer = document.createElement('div'); 
        footer.style.display='flex'; footer.style.justifyContent='center'; footer.style.marginTop='6px'; 
        footer.style.alignItems='center'; footer.style.gap='8px';
        
        // Auto-save dummy (functionality is implicitly auto-save in my engine, but UI requested)
        const autoSaveRow = document.createElement('div'); 
        autoSaveRow.style.display='flex'; autoSaveRow.style.justifyContent='center'; 
        autoSaveRow.style.alignItems='center'; autoSaveRow.style.gap='8px'; autoSaveRow.style.marginTop='6px';
        
        const autoSaveChk = document.createElement('input'); 
        autoSaveChk.type='checkbox'; autoSaveChk.checked = true; autoSaveChk.disabled = true; // Always on in this implementation
        const autoLabel = document.createElement('label'); 
        autoLabel.textContent = 'Auto-save (Always On)'; 
        autoLabel.style.color='#e6eef8'; autoLabel.style.fontSize='13px';
        
        autoSaveRow.appendChild(autoSaveChk); 
        autoSaveRow.appendChild(autoLabel);
        contentContainer.appendChild(autoSaveRow);

        const saveBtn = document.createElement('button'); 
        saveBtn.textContent='Close';
        Object.assign(saveBtn.style,{
            padding:'10px 14px',borderRadius:'8px',border:'none',background:'#4f46e5',color:'#fff',cursor:'pointer'
        });
        saveBtn.onclick = () => { if(closePanel) closePanel(); };
        
        footer.appendChild(saveBtn);
        contentContainer.appendChild(footer);
    };

    await renderContent(initialScope);
}

function createCard(titleText) {
    const card = document.createElement('section');
    Object.assign(card.style, { background: '#111827', padding: '12px', borderRadius: '8px' });
    if (titleText) {
        const title = document.createElement('h3'); 
        title.textContent = titleText; 
        title.style.margin = '0 0 8px 0';
        title.style.fontSize = '16px';
        card.appendChild(title);
    }
    return card;
}

async function renderDataManagement(container) {
    // Reference style: simple row of buttons
    const importBtn = document.createElement('button'); importBtn.textContent = '📥 Import Settings';
    const exportBtn = document.createElement('button'); exportBtn.textContent = '📤 Export Settings';
    const resetBtn = document.createElement('button'); resetBtn.textContent = '⚠️ Reset'; // Added reset for safety
    
    [importBtn, exportBtn, resetBtn].forEach(b=>Object.assign(b.style,{
        padding:'8px 12px',borderRadius:'6px',border:'none',background:'#4f46e5',color:'#fff',cursor:'pointer'
    }));
    resetBtn.style.background = '#7f1d1d'; // Dark red for reset

    // Export Logic
    exportBtn.onclick = () => {
        // Simple export (Full)
        exportSettings('full').then(json => {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ocr-settings-all.json`;
            a.click();
        });
    };

    // Import Logic
    importBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async (e) => {
             const f = e.target.files[0];
             if(!f) return;
             const text = await f.text();
             try {
                // Determine type for confirmation
                const data = JSON.parse(text);
                if(confirm(`Import settings? This will overwrite existing configuration.`)) {
                     await importSettings(text, 'merge');
                     location.reload();
                }
             } catch(e) { alert(' invalid file '); }
        };
        input.click();
    };

    resetBtn.onclick = () => {
        if(confirm('Factory Reset? This cannot be undone.')) {
            resetSystem('full').then(() => location.reload());
        }
    };

    container.appendChild(importBtn);
    container.appendChild(exportBtn);
    container.appendChild(resetBtn);
}


// --- Profile Manager Renderer ---
async function renderProfileManager(container) {
    const settings = await getSettings(['active_profile_id']);
    const profiles = await getProfileList();
    const activeId = settings.active_profile_id;
    
    // Container style reset (handled by parent card now)
    Object.assign(container.style, { display: 'flex', flexDirection: 'column', gap: '10px' });
    
    const controls = document.createElement('div');
    Object.assign(controls.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' });
    
    // Select Profile
    const select = document.createElement('select');
    Object.assign(select.style, { 
        padding:'8px', background:'#0b1220', color:'#e6eef8', border:'1px solid #25303a', 
        borderRadius:'6px', minWidth: '180px', flex: '1'
    });
    
    profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name + (p.id === activeId ? ' (Active)' : '') + (['default','manhwa'].includes(p.id) ? ' [System]' : '');
        select.appendChild(opt);
    });
    select.value = activeId;
    
    // Switch Handler (Runtime)
    select.onchange = async () => {
        await setActiveProfile(select.value);
        location.reload(); 
    };
    
    controls.appendChild(select);
    
    // Actions Group
    const btnGroup = document.createElement('div');
    Object.assign(btnGroup.style, { display: 'flex', gap: '6px' });
    
    // Helper for mini buttons
    const createMiniBtn = (icon, title, action, variant='primary') => {
        const b = document.createElement('button');
        b.textContent = icon; b.title = title;
        Object.assign(b.style, {
            padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: variant==='danger' ? '#7f1d1d' : '#374151', color: 'white'
        });
        b.onclick = action;
        return b;
    };
    
    // --- New / Duplicate ---
    btnGroup.appendChild(createMiniBtn('📋', 'Duplicate Profile', async () => {
        const name = prompt('New profile name (copy of current):', profiles.find(p=>p.id===activeId).name + ' Copy');
        if(name) {
            const id = await createProfile(name, activeId);
            await setActiveProfile(id);
            location.reload();
        }
    }));
    
    btnGroup.appendChild(createMiniBtn('➕', 'New Empty Profile', async () => {
        const name = prompt('New profile name:');
        if(name) {
            const id = await createProfile(name);
            await setActiveProfile(id);
            location.reload();
        }
    }));

    const isSystem = ['default', 'manhwa'].includes(activeId);
    
    if (!isSystem) {
        btnGroup.appendChild(createMiniBtn('✏️', 'Rename Profile', async () => {
            const currentName = profiles.find(p => p.id === activeId).name;
            const newName = prompt('Rename profile:', currentName);
            if (newName && newName !== currentName) {
                await renameProfile(activeId, newName);
                location.reload();
            }
        }));
    }

    // --- Reset ---
    btnGroup.appendChild(createMiniBtn('↺', 'Reset Profile to Defaults', async () => {
        if(confirm(`Reset "${profiles.find(p=>p.id===activeId).name}" to factory defaults?`)) {
            await resetProfile(activeId);
            location.reload();
        }
    }, 'danger'));

    // --- Delete ---
    const delBtn = createMiniBtn('🗑️', 'Delete Profile', async () => {
        if(confirm('Delete this profile permanently?')) {
            await deleteProfile(activeId);
            location.reload();
        }
    }, 'danger');
    if (isSystem) delBtn.disabled = true;
    if (isSystem) delBtn.style.opacity = '0.5';
    
    btnGroup.appendChild(delBtn);
    controls.appendChild(btnGroup);

    container.appendChild(controls);
}

// --- Component Renderers ---

async function renderTextCleaningConfig(container, scope) {
    if (scope !== 'global') return; 

    const h3 = document.createElement('h3'); h3.textContent = 'Text Cleaning Pipeline'; Object.assign(h3.style, { fontSize: '18px', borderBottom: '1px solid #4b5563', paddingBottom: '8px' });
    container.appendChild(h3);

    const settings = await getSettings([
        'clean_noise', 'noise_aggression', 'clean_normalize', 
        'clean_dict', 'dict_strength', 'dict_ignore_caps', 'manhwa_mode'
    ]);

    const opts = [
        { key: 'clean_noise', label: 'Noise Cleaning (Remove Artifacts)', default: true },
        { key: 'clean_normalize', label: 'Normalize Whitespace (Fix spaces)', default: true },
        { key: 'clean_dict', label: 'Dictionary Correction (Levenshtein)', default: false },
        { key: 'dict_ignore_caps', label: 'Dictionary: Ignore ALL CAPS', default: true },
        { key: 'manhwa_mode', label: 'Manhwa Mode (Vertical Text Fixes)', default: false },
    ];

    opts.forEach(opt => {
         container.appendChild(createToggle(opt.label, settings[opt.key] !== undefined ? settings[opt.key] : opt.default, async (val) => await saveSettings({ [opt.key]: val })));
    });

    // Dropdowns / Extras
    const noiseRow = document.createElement('div');
    Object.assign(noiseRow.style, { display: 'flex', alignItems: 'center', justifyContent:'space-between', background: '#1f2937', padding: '8px', borderRadius: '6px', marginTop: '8px' });
    noiseRow.innerHTML = '<span style="font-size:14px">Noise Aggression</span>';
    const noiseSel = document.createElement('select'); Object.assign(noiseSel.style, { background: '#374151', color: 'white', border: 'none', padding: '4px' });
    ['low', 'medium', 'high'].forEach(v => { const o = document.createElement('option'); o.value=v; o.textContent=v; noiseSel.appendChild(o); });
    noiseSel.value = settings.noise_aggression || 'medium';
    noiseSel.onchange = async () => await saveSettings({ noise_aggression: noiseSel.value });
    noiseRow.appendChild(noiseSel);
    container.appendChild(noiseRow);
    
    const dictRow = document.createElement('div');
    Object.assign(dictRow.style, { display: 'flex', alignItems: 'center', justifyContent:'space-between', background: '#1f2937', padding: '8px', borderRadius: '6px', marginTop: '8px' });
    dictRow.innerHTML = '<span style="font-size:14px">Dict Strength (Distance)</span>';
    const dictSel = document.createElement('select'); Object.assign(dictSel.style, { background: '#374151', color: 'white', border: 'none', padding: '4px' });
    ['1', '2', '3'].forEach(v => { const o = document.createElement('option'); o.value=v; o.textContent=v; dictSel.appendChild(o); });
    dictSel.value = settings.dict_strength || 1;
    dictSel.onchange = async () => await saveSettings({ dict_strength: parseInt(dictSel.value) });
    dictRow.appendChild(dictSel);
    container.appendChild(dictRow);
}

async function renderReconstructionConfig(container, scope) {
    if (scope !== 'global') return;

    const h3 = document.createElement('h3'); h3.textContent = 'Text Reconstruction'; Object.assign(h3.style, { fontSize: '18px', borderBottom: '1px solid #4b5563', paddingBottom: '8px' });
    container.appendChild(h3);

    const settings = await getSettings(['reconstruct_text', 'reconstruct_merge', 'reconstruct_stabilize']);

    // Master switch
    container.appendChild(createToggle('Enable Reconstruction', settings.reconstruct_text === true, async (val) => await saveSettings({ reconstruct_text: val })));
    
    // Sub switches
    const subContainer = document.createElement('div');
    subContainer.style.marginLeft = '20px';
    subContainer.style.marginTop = '8px';
    
    subContainer.appendChild(createToggle('Merge Broken Lines', settings.reconstruct_merge !== false, async (val) => await saveSettings({ reconstruct_merge: val })));
    subContainer.appendChild(createToggle('Stabilize Sentences', settings.reconstruct_stabilize !== false, async (val) => await saveSettings({ reconstruct_stabilize: val })));
    
    container.appendChild(subContainer);
}

async function renderPipelineConfig(container) {
    const h3 = document.createElement('h3'); h3.textContent = 'Image Preprocessing'; Object.assign(h3.style, { fontSize: '18px', borderBottom: '1px solid #4b5563', paddingBottom: '8px' });
    container.appendChild(h3);
    
    const settings = await getSettings([
        'preprocess_resize', 'preprocess_grayscale', 'preprocess_contrast', 
        'preprocess_blur', 'preprocess_threshold', 'preprocess_morphology', 'preprocess_borders'
    ]);

    const opts = [
        { key: 'preprocess_resize', label: 'Resize Image (2x)', default: true },
        { key: 'preprocess_grayscale', label: 'Grayscale', default: true },
        { key: 'preprocess_contrast', label: 'Enhance Contrast', default: true },
        { key: 'preprocess_blur', label: 'Median Blur', default: false },
        { key: 'preprocess_threshold', label: 'Adaptive Threshold', default: false },
        { key: 'preprocess_morphology', label: 'Morphology (Clean)', default: false },
    ];

    opts.forEach(opt => {
        container.appendChild(createToggle(opt.label, settings[opt.key] !== undefined ? settings[opt.key] : opt.default, async (val) => await saveSettings({ [opt.key]: val })));
    });
}

async function renderUIConfig(container) {
    const h3 = document.createElement('h3'); h3.textContent = 'UI Settings'; Object.assign(h3.style, { fontSize: '18px', borderBottom: '1px solid #4b5563', paddingBottom: '8px' });
    container.appendChild(h3);
    
    // --- Floating Button Controls ---
    const settings = await getSettings([
        'floating_button_enabled', 'floating_button_mode',
        'floating_button_blacklist', 'floating_button_whitelist', 
        'debug_mode'
    ]);
    
    // 1. Master Toggle
    container.appendChild(createToggle('Show Floating Button', settings.floating_button_enabled !== false, async (val) => await saveSettings({ floating_button_enabled: val })));

    // 2. Mode Selector and Lists
    // Only show if enabled
    const subConfig = document.createElement('div');
    subConfig.style.marginLeft = '20px';
    subConfig.style.marginBottom = '20px';
    subConfig.style.display = (settings.floating_button_enabled !== false) ? 'block' : 'none';

    // Mode Toggle
    const modeRow = document.createElement('div');
    Object.assign(modeRow.style, { display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' });
    modeRow.innerHTML = `<span style="font-size:14px; color:#d1d5db">Filter Mode:</span>`;
    
    const modeSel = document.createElement('select');
    Object.assign(modeSel.style, { padding: '4px 8px', borderRadius: '4px', background: '#374151', color: 'white', border: 'none' });
    const mOpt1 = document.createElement('option'); mOpt1.value = 'blacklist'; mOpt1.textContent = 'Show Everywhere (Excluded Sites)';
    const mOpt2 = document.createElement('option'); mOpt2.value = 'whitelist'; mOpt2.textContent = 'Hide Everywhere (Allowed Sites)';
    modeSel.appendChild(mOpt1); modeSel.appendChild(mOpt2);
    modeSel.value = settings.floating_button_mode || 'blacklist';
    
    modeSel.onchange = async () => {
        await saveSettings({ floating_button_mode: modeSel.value });
        renderListEditor(modeSel.value);
    };
    modeRow.appendChild(modeSel);
    subConfig.appendChild(modeRow);

    // List Editor Container
    const listContainer = document.createElement('div');
    subConfig.appendChild(listContainer);
    
    const renderListEditor = async (mode) => {
        listContainer.innerHTML = '';
        const currentList = await getSettings(mode === 'blacklist' ? ['floating_button_blacklist'] : ['floating_button_whitelist']);
        const items = currentList[mode === 'blacklist' ? 'floating_button_blacklist' : 'floating_button_whitelist'] || [];

        const info = document.createElement('p');
        info.style.fontSize = '12px'; info.style.color = '#9ca3af'; info.style.marginBottom = '8px';
        info.textContent = mode === 'blacklist' 
            ? 'Button will NOT appear on these URLs (one per line):'
            : 'Button WILL appear ONLY on these URLs (one per line):';
        listContainer.appendChild(info);

        const textarea = document.createElement('textarea');
        textarea.rows = 5;
        Object.assign(textarea.style, { 
            width: '100%', background: '#0b1220', color: '#e6eef8', 
            border: '1px solid #25303a', borderRadius: '4px', padding: '8px', 
            fontFamily: 'monospace', boxSizing: 'border-box' 
        });
        textarea.value = items.join('\n');
        
        textarea.onchange = async () => {
            const raw = textarea.value.split('\n').map(s => s.trim()).filter(s => s);
            const key = mode === 'blacklist' ? 'floating_button_blacklist' : 'floating_button_whitelist';
            await saveSettings({ [key]: raw });
        };
        listContainer.appendChild(textarea);
    };

    // Initial fill
    await renderListEditor(settings.floating_button_mode || 'blacklist');
    container.appendChild(subConfig);

    // 3. Simple toggles
    container.appendChild(createToggle('Debug Mode', settings.debug_mode === true, async (val) => await saveSettings({ debug_mode: val })));
    
    // Manage listener for disable
    // Re-render UIConfig part if master toggle changes? 
    // Just toggle visibility for simplicity
    const masterCheck = container.querySelector('input[type="checkbox"]'); // First one is floating button
    if(masterCheck) {
        // Need to hook deeply, but createToggle is simple. 
        // We can add a re-render hook or just manual display toggle.
        const originalOnChange = masterCheck.onchange;
        masterCheck.onchange = (e) => {
             subConfig.style.display = e.target.checked ? 'block' : 'none';
             if(originalOnChange) originalOnChange(e);
        };
    }
}

function renderReplacementsSection(container, replacements, scope) {
    // 1. Simple Add Form (Top)
    const form = document.createElement('div');
    form.style.display = 'flex'; form.style.flexDirection = 'column'; form.style.gap = '8px';
    
    // Inputs
    const inputsRow = document.createElement('div'); 
    inputsRow.style.display = 'flex'; inputsRow.style.gap = '12px'; inputsRow.style.alignItems = 'center'; 
    inputsRow.style.flexWrap = 'wrap'; inputsRow.style.margin = '0 auto';
    
    const findInput = document.createElement('input'); 
    findInput.placeholder = 'Character to Find';
    Object.assign(findInput.style, {
        width: '150px', padding: '8px', borderRadius: '6px', 
        background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a'
    });
    
    const replaceInput = document.createElement('input'); 
    replaceInput.placeholder = 'Replace With';
    Object.assign(replaceInput.style, {
        width: '150px', padding: '8px', borderRadius: '6px', 
        background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a'
    });
    
    const arrow = document.createElement('div'); 
    arrow.textContent = '→'; 
    arrow.style.color = '#9ca3af'; arrow.style.fontSize = '18px'; 
    arrow.style.display = 'flex'; arrow.style.alignItems = 'center'; arrow.style.padding = '0 4px';
    
    inputsRow.appendChild(findInput); 
    inputsRow.appendChild(arrow); 
    inputsRow.appendChild(replaceInput);
    
    // Advanced Toggles (Compact)
    const togglesRow = document.createElement('div');
    togglesRow.style.display = 'flex'; togglesRow.style.gap = '10px'; togglesRow.style.justifyContent = 'center'; togglesRow.style.fontSize = '12px';
    togglesRow.innerHTML = `
        <label style="color:#d1d5db; display:flex; gap:4px; align-items:center; cursor:pointer"><input type="checkbox" id="adv_rgx"> Regex</label>
        <label style="color:#d1d5db; display:flex; gap:4px; align-items:center; cursor:pointer"><input type="checkbox" id="adv_case"> Case</label>
        <label style="color:#d1d5db; display:flex; gap:4px; align-items:center; cursor:pointer"><input type="checkbox" id="adv_word"> Word</label>
    `;

    const addRuleBtn = document.createElement('button'); 
    addRuleBtn.textContent = 'Add';
    Object.assign(addRuleBtn.style, {
        padding: '8px 10px', borderRadius: '6px', border: 'none', 
        background: '#4f46e5', color: '#fff', cursor: 'pointer', width: '72px', alignSelf: 'center'
    });

    form.appendChild(inputsRow);
    form.appendChild(togglesRow);
    form.appendChild(addRuleBtn);
    container.appendChild(form);

    // 2. List
    const list = document.createElement('div'); 
    list.style.marginTop = '12px'; 
    list.style.display = 'grid'; 
    list.style.gridTemplateColumns = '1fr 1fr'; // Grid layout from reference
    list.style.gap = '8px';
    
    // Re-render helper
    const renderItems = () => {
        list.innerHTML = '';
        replacements.forEach((rule, idx) => {
            const item = document.createElement('div');
            Object.assign(item.style, {
                display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 8px', background: '#071022', borderRadius: '8px', minHeight: '36px', boxSizing: 'border-box'
            });

            // Reordering controls (Mini)
            const controls = document.createElement('div');
            controls.style.display='flex'; controls.style.flexDirection='column'; controls.style.gap='2px'; controls.style.marginRight='6px';
            const up = document.createElement('button'); up.textContent='▲'; up.onclick = () => moveRule(idx, idx-1);
            const down = document.createElement('button'); down.textContent='▼'; down.onclick = () => moveRule(idx, idx+1);
            [up, down].forEach(b => {
                 Object.assign(b.style, { fontSize:'8px', padding:'0', background:'transparent', border:'none', color:'#6b7280', cursor:'pointer' });
            });
            if(idx > 0) controls.appendChild(up);
            if(idx < replacements.length-1) controls.appendChild(down);
            item.appendChild(controls);

            // Label
            const label = document.createElement('div');
            // Show flags
            const flags = [];
            if(rule.isRegex) flags.push('R');
            if(rule.caseSensitive) flags.push('C');
            if(rule.wholeWord) flags.push('W');
            const flagStr = flags.length ? `<sup style="color:#f59e0b; margin-left:2px">${flags.join('')}</sup>` : '';

            label.innerHTML = `<span style="color:#e6eef8">${rule.find}</span> <span style="color:#6b7280">→</span> <span style="color:#a5f3fc">${rule.replace}</span> ${flagStr}`;
            Object.assign(label.style, {
                fontSize: '13px', flex: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect:'none'
            });
            // Toggle enabled on click text
            label.style.cursor = 'pointer';
            label.style.opacity = (rule.enabled !== false) ? '1' : '0.5';
            label.onclick = async () => {
                replacements[idx].enabled = !(replacements[idx].enabled !== false);
                await saveReplacements(scope, replacements);
                renderItems();
            };
            item.appendChild(label);

            const del = document.createElement('button'); 
            del.textContent='✕';
            Object.assign(del.style, {
                padding: '4px', borderRadius: '4px', border: 'none', background: '#ef4444', 
                color: '#fff', cursor: 'pointer', marginLeft: '8px', fontSize:'12px', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center'
            });
            del.onclick = async (e) => {
                e.preventDefault();
                replacements.splice(idx, 1);
                await saveReplacements(scope, replacements);
                renderItems();
            };
            item.appendChild(del);
            
            list.appendChild(item);
        });
    };

    const moveRule = async (from, to) => {
         if(to < 0 || to >= replacements.length) return;
         const x = replacements.splice(from, 1)[0];
         replacements.splice(to, 0, x);
         await saveReplacements(scope, replacements);
         renderItems();
    };

    renderItems();
    container.appendChild(list);

    // Bind Add
    addRuleBtn.onclick = async () => {
        const f = findInput.value;
        const r = replaceInput.value;
        if (!f) return;
        const rule = {
            find: f, replace: r,
            isRegex: document.getElementById('adv_rgx').checked,
            caseSensitive: document.getElementById('adv_case').checked,
            wholeWord: document.getElementById('adv_word').checked,
            enabled: true
        };
        replacements.push(rule);
        await saveReplacements(scope, replacements);
        renderItems();
        findInput.value = ''; replaceInput.value = '';
    };
}

function renderDeletionsSection(container, deletions, scope) {
    const title = document.createElement('h4'); 
    title.textContent = 'Characters to Delete'; 
    title.style.margin = '12px 0 6px 0'; title.style.fontSize = '15px';
    container.appendChild(title);
    
    const desc = document.createElement('div'); 
    desc.textContent = 'These characters will be removed from the OCR text'; 
    desc.style.color = '#9ca3af'; desc.style.fontSize = '13px';
    container.appendChild(desc);

    const row = document.createElement('div'); 
    row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center'; row.style.marginTop = '8px';
    
    const input = document.createElement('input'); 
    input.placeholder = 'Character to Delete';
    Object.assign(input.style, {
        flex: '1', padding: '8px', borderRadius: '6px', 
        background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a'
    });
    
    const addBtn = document.createElement('button'); 
    addBtn.textContent = 'Add';
    Object.assign(addBtn.style, {
        padding: '8px 10px', borderRadius: '6px', border: 'none', 
        background: '#4f46e5', color: '#fff', cursor: 'pointer', width: '72px', flex: '0 0 auto'
    });
    
    row.appendChild(input);
    row.appendChild(addBtn);
    container.appendChild(row);

    // Options for Context (Mini checkboxes below input)
    const ctxRow = document.createElement('div');
    ctxRow.style.display='flex'; ctxRow.style.gap='10px'; ctxRow.style.marginTop='6px'; ctxRow.style.fontSize='11px'; ctxRow.style.color='#9ca3af';
    ctxRow.innerHTML = `
        <span>Safe if between: </span>
        <label style="display:flex;gap:4px;cursor:pointer"><input type="checkbox" id="del_let">Letters</label>
        <label style="display:flex;gap:4px;cursor:pointer"><input type="checkbox" id="del_num">Numbers</label>
        <label style="display:flex;gap:4px;cursor:pointer"><input type="checkbox" id="del_wrd">Inside Words</label>
    `;
    container.appendChild(ctxRow);

    const list = document.createElement('div'); 
    list.style.marginTop = '8px'; list.style.display = 'flex'; list.style.flexWrap = 'wrap'; list.style.gap = '6px';
    
    const renderItems = () => {
        list.innerHTML = '';
        deletions.forEach((rule, idx) => {
             const char = typeof rule === 'string' ? rule : rule.char;
             
             const chip = document.createElement('div');
             Object.assign(chip.style, {
                 display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                 background: '#07202a', color: '#e6eef8', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)'
             });

             let txt = char;
             if (typeof rule !== 'string' && (rule.ignoreBetweenLetters || rule.ignoreBetweenNumbers || rule.ignoreInsideWords)) {
                 txt += '*'; // Indicator for context rules
             }

             const span = document.createElement('span'); 
             span.textContent = txt; span.style.fontSize = '13px'; span.style.marginRight = '4px';
             if (txt.endsWith('*')) span.title = "Has context protection rules";
             
             const del = document.createElement('button'); 
             del.textContent='✕';
             Object.assign(del.style, {
                 padding: '2px 4px', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize:'10px'
             });
             del.onclick = async () => {
                 deletions.splice(idx, 1);
                 await saveDeletions(scope, deletions);
                 renderItems();
             };
             
             chip.appendChild(span);
             chip.appendChild(del);
             list.appendChild(chip);
        });
    };
    renderItems();
    container.appendChild(list);

    addBtn.onclick = async () => {
        const c = input.value;
        if (!c) return;
        
        const l = document.getElementById('del_let').checked;
        const n = document.getElementById('del_num').checked;
        const w = document.getElementById('del_wrd').checked;
        
        const rule = { 
            char: c, 
            ignoreBetweenLetters: l, 
            ignoreBetweenNumbers: n,
            ignoreInsideWords: w
        };
        
        deletions.push(rule);
        await saveDeletions(scope, deletions);
        renderItems();
        input.value = '';
    };
}

// Helpers
function createToggle(label, checked, onChange) {
    const row = document.createElement('label');
    Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#1f2937', padding: '8px', borderRadius: '6px', marginBottom: '8px' });
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.onchange = (e) => onChange(e.target.checked);
    
    row.appendChild(input);
    row.appendChild(document.createTextNode(label));
    return row;
}

function createCheckbox(label) {
    const l = document.createElement('label');
    Object.assign(l.style, { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' });
    const i = document.createElement('input'); i.type = 'checkbox';
    l.appendChild(i); l.appendChild(document.createTextNode(label));
    return l;
}

async function saveDeletions(scope, deletions) {
    if (scope === 'global') {
        await saveSettings({ user_deletions: deletions });
    } else {
        // Site specific rules are stored in root storage, not profile
        const key = `user_deletions_${scope}`;
        await browser.storage.local.set({ [key]: deletions });
    }
}

async function saveReplacements(scope, replacements) {
    if (scope === 'global') {
        await saveSettings({ user_replacements: replacements });
    } else {
        // Site specific rules are stored in root storage, not profile
        const key = `user_replacements_${scope}`;
        await browser.storage.local.set({ [key]: replacements });
    }
}
