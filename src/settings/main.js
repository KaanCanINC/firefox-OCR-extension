// src/settings.js
/**
 * Settings Page Module
 * Handles the settings page functionality (both Modal and Full Page)
 * Revised: Modern layouts, Tabs, No-reload architecture.
 */

import { 
    loadRules, saveSettings, getSettings, 
    getProfileList, createProfile, deleteProfile, setActiveProfile, resetProfile,
    importSettings, exportSettings, resetSystem, renameProfile
} from "../utils/storage.js";
import { TESSERACT_LANGUAGES } from "../utils/languages.js";
import { TRANSLATION_LANGUAGES } from "../utils/translationLanguages.js";

// --- State Management ---
let currentState = {
    activeTab: 'general',
    scope: 'global',
    isFloating: false,
    restartRequired: false
};

const TABS = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'image', label: 'Image Processing', icon: '🖼️' },
    { id: 'text', label: 'Text Cleaning', icon: '📝' },
    { id: 'translation', label: 'Translation', icon: '🌐' },
    { id: 'rules', label: 'Find & Replace', icon: '🔍' },
    { id: 'ui', label: 'Interface', icon: '🖥️' },
    { id: 'data', label: 'Data', icon: '💾' }
];

export async function initSettingsPage() {
    currentState.isFloating = false;
    document.body.innerHTML = '';
    
    const container = document.createElement('div');
    Object.assign(container.style, {
        fontFamily: "'Segoe UI', Inter, sans-serif", backgroundColor: '#0f1724', color: '#f9fafb',
        minHeight: '100vh', display: 'flex', flexDirection: 'column'
    });

    // Main Layout (Full Page)
    const body = document.createElement('div');
    Object.assign(body.style, {
        flex: '1', display: 'flex', maxWidth: '1200px', width: '100%', margin: '0 auto',
        padding: '20px', gap: '20px', boxSizing: 'border-box'
    });

    // Sidebar
    const sidebar = document.createElement('aside');
    Object.assign(sidebar.style, { width: '260px', flexShrink: '0', display: 'flex', flexDirection: 'column', gap: '20px' });
    
    // Content
    const content = document.createElement('main');
    Object.assign(content.style, { 
        flex: '1', backgroundColor: '#1f2937', borderRadius: '12px', 
        padding: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
    });

    // Render Components
    await renderSidebar(sidebar, render);
    body.appendChild(sidebar);
    body.appendChild(content);
    container.appendChild(body);
    document.body.appendChild(container);

    // Initial Content Render
    async function render() {
        // Re-render sidebar active state
        renderSidebar(sidebar, render); 
        await renderContent(content);
    }
    await render();
}

export async function openSettingsPanel() {
    if (document.getElementById('ocr-settings-panel')) return;
    currentState.isFloating = true;
    currentState.activeTab = 'general';

    // Determine Scope
    try {
        if (window.location.origin && window.location.origin !== 'null') {
            currentState.scope = `site:${window.location.origin}`;
        }
    } catch (e) { currentState.scope = 'global'; }

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'ocr-settings-backdrop';
    Object.assign(backdrop.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '2147483646', opacity: '0', transition: 'opacity 0.2s ease',
      backdropFilter: 'blur(2px)'
    });

    // Panel
    const panel = document.createElement('aside');
    panel.id = 'ocr-settings-panel';
    Object.assign(panel.style, {
      position: 'fixed', top: '0', right: '0', height: '100vh', width: 'min(500px, 90vw)',
      backgroundColor: '#111827', color: '#f9fafb', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)',
      zIndex: '2147483647', transform: 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', Inter, sans-serif"
    });

    // Prevent Host Page Navigation (Fix for Manhwa readers)
    panel.addEventListener('keydown', (e) => {
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Space'].includes(e.code)) {
            e.stopPropagation(); 
        }
    });

    // Close Logic
    const closePanel = () => {
        panel.style.transform = 'translateX(100%)';
        backdrop.style.opacity = '0';
        setTimeout(() => {
            panel.remove();
            backdrop.remove();
            if (currentState.restartRequired) {
                if(confirm("Some settings require a page refresh to take effect. Refresh now?")){
                    location.reload();
                }
            }
        }, 300);
    };
    backdrop.onclick = closePanel;

    // --- Header ---
    const header = document.createElement('div');
    Object.assign(header.style, { padding: '20px 20px 10px 20px', flexShrink: '0' });
    
    // Top Row
    const topRow = document.createElement('div');
    topRow.style.display = 'flex'; topRow.style.justifyContent = 'space-between'; topRow.style.alignItems = 'center'; topRow.style.marginBottom = '15px';
    const h2 = document.createElement('h2'); h2.textContent = 'Settings'; Object.assign(h2.style, { margin: 0, fontSize: '20px', fontWeight: '600' });
    const closeBtn = document.createElement('button'); closeBtn.innerHTML = '✕';
    Object.assign(closeBtn.style, { background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer', padding: '5px' });
    closeBtn.onclick = closePanel;
    topRow.appendChild(h2); topRow.appendChild(closeBtn);
    header.appendChild(topRow);

    // Tab Bar (Scrollable)
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, { display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px', borderBottom: '1px solid #374151' });
    
    // Content
    const content = document.createElement('div');
    Object.assign(content.style, { flex: '1', overflowY: 'auto', padding: '20px' });

    // Render Loop
    const render = async () => {
        // Update Tabs
        tabBar.innerHTML = '';
        const vSettings = await getSettings(['floating_visible_preprocess', 'floating_visible_cleaning', 'floating_visible_findreplace', 'floating_visible_ui', 'floating_visible_profiles']);
        
        // Filter tabs based on explicit visibility settings (if needed) or just show all
        // To be simpler and cleaner, we just show all tabs but maybe highlight active
        TABS.forEach(t => {
            // Optional: Hide tabs if user strictly disabled them in 'Floating Config' to save space?
            // For now, render all.
            if(t.id === 'data') return; // Hide Data tab in floating usually
            
            const btn = document.createElement('button');
            const isActive = currentState.activeTab === t.id;
            btn.textContent = t.label;
            Object.assign(btn.style, {
                padding: '8px 12px', borderRadius: '6px', border: 'none', background: isActive ? '#374151' : 'transparent',
                color: isActive ? '#fff' : '#9ca3af', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.2s'
            });
            btn.onclick = () => { currentState.activeTab = t.id; render(); };
            tabBar.appendChild(btn);
        });

        // Update Content
        await renderContent(content);
    };

    header.appendChild(tabBar);
    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        panel.style.transform = 'translateX(0)';
    });

    await render();
}


// --- Components ---

async function renderSidebar(container, reRenderCallback) {
    container.innerHTML = '';
    
    // Profile Manager (Compact)
    const profileSection = document.createElement('div');
    Object.assign(profileSection.style, { background: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '10px' });
    await renderProfileManagerCompact(profileSection, reRenderCallback);
    container.appendChild(profileSection);

    // Nav Links
    const nav = document.createElement('nav');
    Object.assign(nav.style, { display: 'flex', flexDirection: 'column', gap: '5px' });
    
    TABS.forEach(tab => {
        const btn = document.createElement('button');
        const isActive = currentState.activeTab === tab.id;
        
        btn.innerHTML = `<span style="margin-right:10px">${tab.icon}</span> ${tab.label}`;
        Object.assign(btn.style, {
            textAlign: 'left', padding: '12px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: isActive ? '#4f46e5' : 'transparent', color: isActive ? '#fff' : '#d1d5db',
            fontSize: '14px', transition: 'background 0.2s'
        });
        
        btn.onclick = () => {
             currentState.activeTab = tab.id;
             reRenderCallback();
        };
        nav.appendChild(btn);
    });
    container.appendChild(nav);
}

async function renderProfileManagerCompact(container, cb) {
    const settings = await getSettings(['active_profile_id']);
    const profiles = await getProfileList();
    const activeId = settings.active_profile_id;

    const label = document.createElement('div');
    label.textContent = 'Active Profile';
    label.style.fontSize = '12px'; label.style.color = '#9ca3af'; label.style.marginBottom = '8px';
    container.appendChild(label);

    const select = document.createElement('select');
    Object.assign(select.style, {
        width: '100%', padding: '8px', background: '#374151', color: 'white', border: '1px solid #4b5563', borderRadius: '6px'
    });
    
    profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
    select.value = activeId;
    select.onchange = async () => {
        await setActiveProfile(select.value);
        if(cb) cb(); // Re-render all to reflect new profile settings
    };
    container.appendChild(select);
    
    // Edit Link
    const editLink = document.createElement('button');
    editLink.textContent = 'Manage Profiles';
    Object.assign(editLink.style, { 
        background:'none', border:'none', color:'#60a5fa', fontSize:'12px', cursor:'pointer', padding:'0', marginTop:'8px' 
    });
    editLink.onclick = () => {
        currentState.activeTab = 'general'; // Force general tab where profile manager is
        if(cb) cb();
    };
    container.appendChild(editLink);
}

async function renderContent(container) {
    container.innerHTML = '';
    container.scrollTop = 0; // Reset scroll

    // Scope Header (Available in all tabs except 'data' or 'general')
    // We want to be able to set scope for Rules, Cleaning, etc.
    const showScope = !['data', 'general'].includes(currentState.activeTab);

    if (showScope) {
        const scopeContainer = document.createElement('div');
        Object.assign(scopeContainer.style, { marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #374151' });
        await renderScopeSelector(scopeContainer, () => renderContent(container));
        container.appendChild(scopeContainer);
    }

    // Determine current scope handling
    const effScope = currentState.scope;

    switch(currentState.activeTab) {
        case 'general':
            await renderGeneralTab(container);
            break;
        case 'image':
            await renderImageTab(container); // Usually Global
            break;
        case 'text':
            await renderTextTab(container, effScope);
            break;
        case 'translation':
            await renderTranslationTab(container, effScope);
            break;
        case 'rules':
            await renderRulesTab(container, effScope);
            break;
        case 'ui':
            await renderUITab(container); // Global
            break;
        case 'data':
            await renderDataTab(container);
            break;
    }
}

// --- Tab Renderers ---

async function renderGeneralTab(container) {
    appendSectionTitle(container, 'Profile Management');
    const pMgr = document.createElement('div');
    await renderFullProfileManager(pMgr);
    container.appendChild(pMgr);
}

async function renderImageTab(container) {
    appendSectionTitle(container, 'Preprocessing Pipeline');
    const settings = await getSettings([
        'preprocess_resize', 'preprocess_grayscale', 'preprocess_contrast', 
        'preprocess_blur', 'preprocess_threshold', 'preprocess_morphology', 
        'tess_lang'
    ]);

    // Language
    const langGroup = createControlGroup('OCR Language', 'Language model to use for recognition.');
    const langSel = document.createElement('select'); Object.assign(langSel.style, getInputStyle());
    TESSERACT_LANGUAGES.forEach(lang => {
        const o = document.createElement('option'); o.value = lang.code; o.textContent = `${lang.name} (${lang.code})`; langSel.appendChild(o);
    });
    
    // Custom check
    if (!TESSERACT_LANGUAGES.some(l => l.code === settings.tess_lang)) {
        const o = document.createElement('option'); o.value = settings.tess_lang; o.textContent = settings.tess_lang; langSel.appendChild(o);
    }
    langSel.value = settings.tess_lang || 'eng';
    langSel.onchange = async () => await saveSettings({ tess_lang: langSel.value });
    langGroup.appendChild(langSel);
    container.appendChild(langGroup);

    // Toggles
    container.appendChild(createSwitch('Resize 2x', 'Upscale image for better accuracy', settings.preprocess_resize !== false, v => saveSettings({preprocess_resize: v})));
    container.appendChild(createSwitch('Grayscale', 'Convert to B&W', settings.preprocess_grayscale !== false, v => saveSettings({preprocess_grayscale: v})));
    container.appendChild(createSwitch('Contrast', 'Enhance text contrast', settings.preprocess_contrast !== false, v => saveSettings({preprocess_contrast: v})));
    container.appendChild(createSwitch('Median Blur', 'Reduce noise (Slower)', settings.preprocess_blur === true, v => saveSettings({preprocess_blur: v})));
    container.appendChild(createSwitch('Adaptive Threshold', 'Binarize image (Good for bad lighting)', settings.preprocess_threshold === true, v => saveSettings({preprocess_threshold: v})));
    // container.appendChild(createSwitch('Morphology', 'Clean artifacts', settings.preprocess_morphology === true, v => saveSettings({preprocess_morphology: v})));
}

async function renderTextTab(container, scope) {
    // Note: Text cleaning can be scope-specific theoretically, but usually global.
    // Logic implies global unless we change settingManager to support scoped config for these.
    // Existing logic in settingsManager.js uses GLOBAL settings for cleaning options.
    // So we hide scope selector effects here.
    
    appendSectionTitle(container, 'Text Cleaning');
    const settings = await getSettings([
        'clean_noise', 'noise_aggression', 'clean_normalize', 
        'clean_dict', 'dict_strength', 'dict_ignore_caps', 'manhwa_mode',
        'reconstruct_text', 'reconstruct_merge', 'reconstruct_stabilize'
    ]);

    container.appendChild(createSwitch('Noise Cleaning', 'Remove non-text artifacts', settings.clean_noise !== false, v => saveSettings({clean_noise: v})));
    
    // Noise Level
    const noiseGroup = createControlGroup('Noise Aggression', 'How aggressively to remove small dots.');
    const noiseSel = document.createElement('select'); Object.assign(noiseSel.style, getInputStyle());
    ['low', 'medium', 'high'].forEach(v => { const o = document.createElement('option'); o.value=v; o.textContent=v.charAt(0).toUpperCase() + v.slice(1); noiseSel.appendChild(o); });
    noiseSel.value = settings.noise_aggression || 'medium';
    noiseSel.onchange = async () => saveSettings({noise_aggression: noiseSel.value});
    noiseGroup.appendChild(noiseSel);
    container.appendChild(noiseGroup);

    container.appendChild(createSwitch('Normalize Whitespace', 'Fix spacing and line breaks', settings.clean_normalize !== false, v => saveSettings({clean_normalize: v})));
    
    container.appendChild(createDivider());
    
    container.appendChild(createSwitch('Dictionary Correction', 'Fix spelling using vocabulary', settings.clean_dict === true, v => saveSettings({clean_dict: v})));
    container.appendChild(createSwitch('Ignore ALL CAPS', 'Skip dictionary for UPPERCASE words', settings.dict_ignore_caps !== false, v => saveSettings({dict_ignore_caps: v})));
    
    container.appendChild(createDivider());
    
    appendSectionTitle(container, 'Reconstruction');
    container.appendChild(createSwitch('Enable Reconstruction', 'Rebuild sentences from lines', settings.reconstruct_text !== false, v => saveSettings({reconstruct_text: v})));
    container.appendChild(createSwitch('Broken Line Merge', 'Join lines split by hyphens', settings.reconstruct_merge !== false, v => saveSettings({reconstruct_merge: v})));
    container.appendChild(createSwitch('Manhwa Mode', 'Optimize for vertical text bubbles', settings.manhwa_mode === true, v => saveSettings({manhwa_mode: v})));
}

async function renderTranslationTab(container, scope) {
    appendSectionTitle(container, 'Translation Settings');
    const settings = await getSettings(['trans_src', 'trans_target', 'trans_auto', 'trans_style']);

    // Source Language
    const srcGroup = createControlGroup('Source Language', 'Language of the text in image.');
    const srcSel = document.createElement('select'); Object.assign(srcSel.style, getInputStyle());
    
    const autoOpt = document.createElement('option'); autoOpt.value = 'auto'; autoOpt.textContent = 'Detect Language (Auto)';
    srcSel.appendChild(autoOpt);
    
    TRANSLATION_LANGUAGES.forEach(l => {
        const o = document.createElement('option'); o.value = l.code; o.textContent = l.name; srcSel.appendChild(o);
    });
    srcSel.value = settings.trans_src || 'auto';
    srcSel.onchange = async () => await saveSettings({ trans_src: srcSel.value });
    srcGroup.appendChild(srcSel);
    container.appendChild(srcGroup);

    // Auto-detect Toggle (Force auto detection logic)
    container.appendChild(createSwitch('Auto-Detect Source', 'Always try to detect source language first', settings.trans_auto !== false, v => saveSettings({trans_auto: v})));

    // Target Language
    const targetGroup = createControlGroup('Target Language', 'Language to translate into.');
    const targetSel = document.createElement('select'); Object.assign(targetSel.style, getInputStyle());
    TRANSLATION_LANGUAGES.forEach(l => {
        const o = document.createElement('option'); o.value = l.code; o.textContent = l.name; targetSel.appendChild(o);
    });
    targetSel.value = settings.trans_target || 'en';
    targetSel.onchange = async () => await saveSettings({ trans_target: targetSel.value });
    targetGroup.appendChild(targetSel);
    container.appendChild(targetGroup);

    container.appendChild(createDivider());

    // Display Style
    const styleGroup = createControlGroup('Display Style', 'How translation results are shown.');
    const styleSel = document.createElement('select'); Object.assign(styleSel.style, getInputStyle());
    [
        {v: 'replace', t: 'Replace Original Text'},
        {v: 'below', t: 'Show Below Original'},
        {v: 'side', t: 'Show Side-by-Side (Tooltip)'}
    ].forEach(opt => {
         const o = document.createElement('option'); o.value = opt.v; o.textContent = opt.t; styleSel.appendChild(o);
    });
    styleSel.value = settings.trans_style || 'replace';
    styleSel.onchange = async () => await saveSettings({ trans_style: styleSel.value });
    styleGroup.appendChild(styleSel);
    container.appendChild(styleGroup);
}

async function renderRulesTab(container, scope) {
    const rules = await loadRules(scope);
    
    appendSectionTitle(container, 'Find & Replace Rules');
    await renderReplacements(container, rules.replacements, scope);
    
    appendSectionTitle(container, 'Character Deletion', true);
    await renderDeletions(container, rules.deletions, scope);
}

async function renderUITab(container) {
    const settings = await getSettings([
        'floating_button_enabled', 'floating_button_mode',
        'floating_button_blacklist', 'floating_button_whitelist', 
        'popup_hidden_buttons', 'debug_mode',
        // Visibility Settings for floating panel tabs
        'floating_visible_preprocess', 'floating_visible_cleaning', 'floating_visible_findreplace', 
        'floating_visible_profiles', 'floating_visible_ui', 'floating_visible_translation'
    ]);

    appendSectionTitle(container, 'Floating Button');
    container.appendChild(createSwitch('Show Floating Button', 'Enable the OCR button on pages', settings.floating_button_enabled !== false, async v => {
        await saveSettings({floating_button_enabled: v});
        currentState.restartRequired = true;
    }));

    // Filter List
    const filterGroup = createControlGroup('Filter Rules', 'Where should the button appear?');
    const modeSel = document.createElement('select'); Object.assign(modeSel.style, getInputStyle());
    modeSel.innerHTML = `<option value="blacklist">Show Everywhere (Except...)</option><option value="whitelist">Hide Everywhere (Except...)</option>`;
    modeSel.value = settings.floating_button_mode || 'blacklist';
    
    const textArea = document.createElement('textarea');
    Object.assign(textArea.style, { ...getInputStyle(), height: '100px', marginTop: '10px', fontFamily: 'monospace' });
    const loadList = () => {
        const list = settings.floating_button_mode === 'whitelist' ? (settings.floating_button_whitelist||[]) : (settings.floating_button_blacklist||[]);
        textArea.value = list.join('\n');
    };
    loadList();
    
    modeSel.onchange = async () => {
        await saveSettings({floating_button_mode: modeSel.value});
        settings.floating_button_mode = modeSel.value; // update local ref
        loadList(); 
    };
    textArea.onchange = async () => {
        const key = settings.floating_button_mode === 'whitelist' ? 'floating_button_whitelist' : 'floating_button_blacklist';
        const raw = textArea.value.split('\n').map(s=>s.trim()).filter(Boolean);
        await saveSettings({[key]: raw});
        settings[key] = raw; // update local ref
    };

    filterGroup.appendChild(modeSel);
    filterGroup.appendChild(textArea);
    container.appendChild(filterGroup);

    // Popup UI
    appendSectionTitle(container, 'Popup Configuration', true);
    const popupGroup = document.createElement('div');
    popupGroup.style.display = 'grid'; popupGroup.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))'; popupGroup.style.gap = '10px';
    
    const btns = ['Lowercase', 'Uppercase', 'Single Line', 'Manhwa Mode', 'Copy', 'Translate'];
    const hidden = settings.popup_hidden_buttons || [];
    
    btns.forEach(b => {
        const isVisible = !hidden.includes(b);
        const toggle = createCheckbox(b, isVisible, async (checked) => {
            let newHidden = await getSettings(['popup_hidden_buttons']).then(s => s.popup_hidden_buttons || []);
            if (checked) newHidden = newHidden.filter(x => x !== b);
            else if (!newHidden.includes(b)) newHidden.push(b);
            await saveSettings({popup_hidden_buttons: newHidden});
        });
        popupGroup.appendChild(toggle);
    });
    container.appendChild(popupGroup);
    
    // Debug
    appendSectionTitle(container, 'System', true);
    container.appendChild(createSwitch('Debug Mode', 'Log detailed info to console', settings.debug_mode === true, v => saveSettings({debug_mode: v})));
    
    // Floating Panel Config (Only show if not floating, to avoid inception confusion)
    if (!currentState.isFloating) {
        appendSectionTitle(container, 'Floating Settings Panel', true);
        const floatOpts = [
             {k: 'floating_visible_profiles', l: 'Show Profiles Tab'},
             {k: 'floating_visible_preprocess', l: 'Show Image Tab'},
             {k: 'floating_visible_cleaning', l: 'Show Text Tab'},
             {k: 'floating_visible_translation', l: 'Show Translation Tab'},
             {k: 'floating_visible_findreplace', l: 'Show Rules Tab'},
             {k: 'floating_visible_ui', l: 'Show UI Tab'},
        ];
        floatOpts.forEach(o => {
            const checked = settings[o.k] !== false;
            container.appendChild(createSwitch(o.l, '', checked, v => saveSettings({[o.k]: v})));
        });
    }
}

async function renderDataTab(container) {
    appendSectionTitle(container, 'Data Management');
    const p = document.createElement('p'); p.textContent = 'Import/Export your configuration and profiles.';
    p.style.color = '#9ca3af'; p.style.fontSize = '14px';
    container.appendChild(p);
    
    const row = document.createElement('div');
    row.style.display = 'flex'; row.style.gap = '10px'; row.style.marginTop = '20px';
    
    const btnStyle = { padding: '10px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' };
    
    const imp = document.createElement('button'); imp.textContent = 'Import JSON';
    Object.assign(imp.style, { ...btnStyle, background: '#374151', color: 'white' });
    
    const exp = document.createElement('button'); exp.textContent = 'Export JSON';
    Object.assign(exp.style, { ...btnStyle, background: '#4f46e5', color: 'white' });
    
    const rst = document.createElement('button'); rst.textContent = 'Factory Reset';
    Object.assign(rst.style, { ...btnStyle, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' });

    // Handlers
    exp.onclick = () => {
        exportSettings('full').then(json => {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'ocr-settings.json'; a.click();
        });
    };
    
    imp.onclick = () => {
        const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
        i.onchange = async (e) => {
             const f = e.target.files[0];
             if(!f) return;
             if(confirm("Import settings? Previous data will be overwritten.")) {
                 await importSettings(await f.text(), 'merge');
                 location.reload();
             }
        };
        i.click();
    };
    
    rst.onclick = () => {
        if(confirm("DANGER: This will delete ALL profiles and settings. Continue?")) {
            resetSystem('full').then(() => location.reload());
        }
    };

    row.appendChild(imp); row.appendChild(exp); row.appendChild(rst);
    container.appendChild(row);
}

// --- Specific Logic Helpers ---

async function renderFullProfileManager(container) {
    const settings = await getSettings(['active_profile_id']);
    const profiles = await getProfileList();
    const activeId = settings.active_profile_id;

    // List View
    const list = document.createElement('div');
    Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' });
    
    profiles.forEach(p => {
        const item = document.createElement('div');
        const isActive = p.id === activeId;
        Object.assign(item.style, { 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px', background: isActive ? 'rgba(79, 70, 229, 0.1)' : '#111827',
            border: isActive ? '1px solid #4f46e5' : '1px solid transparent',
            borderRadius: '8px'
        });
        
        const name = document.createElement('span'); 
        name.textContent = p.name; 
        if(isActive) name.style.fontWeight = 'bold';
        if(isActive) name.style.color = '#818cf8';

        const actions = document.createElement('div');
        actions.style.display = 'flex'; actions.style.gap = '8px';

        if (!isActive) {
            const loadBtn = createMiniBtn('Load', async () => { await setActiveProfile(p.id); renderFullProfileManager(container); });
            actions.appendChild(loadBtn);
        }
        
        const isSystem = ['default', 'manhwa'].includes(p.id);
        if (!isSystem) {
             const renBtn = createMiniBtn('Rename', async () => {
                 const n = prompt("Rename:", p.name);
                 if (n) { await renameProfile(p.id, n); renderFullProfileManager(container); }
             });
             const delBtn = createMiniBtn('Delete', async () => {
                 if(confirm(`Delete ${p.name}?`)) { await deleteProfile(p.id); renderFullProfileManager(container); }
             }, 'danger');
             actions.appendChild(renBtn);
             actions.appendChild(delBtn);
        }
        
        item.appendChild(name);
        item.appendChild(actions);
        list.appendChild(item);
    });
    
    // Add New
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Create New Profil';
    Object.assign(addBtn.style, { width: '100%', padding: '10px', background: '#374151', color: '#9ca3af', border: '2px dashed #4b5563', borderRadius: '8px', cursor: 'pointer' });
    addBtn.onclick = async () => {
        const n = prompt("Profile Name:");
        if (n) { await createProfile(n); renderFullProfileManager(container); }
    };

    container.innerHTML = '';
    container.appendChild(list);
    container.appendChild(addBtn);
}


async function renderReplacements(container, rules, scope) {
    const list = document.createElement('div');
    Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' });
    
    // Header
    const addRow = document.createElement('div');
    addRow.style.display = 'flex'; addRow.style.gap = '10px'; addRow.style.marginBottom = '15px';
    const i1 = document.createElement('input'); i1.placeholder = 'Find'; Object.assign(i1.style, { ...getInputStyle(), flex: '1' });
    const i2 = document.createElement('input'); i2.placeholder = 'Replace'; Object.assign(i2.style, { ...getInputStyle(), flex: '1' });
    const addB = document.createElement('button'); addB.textContent = 'Add';
    Object.assign(addB.style, { background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', padding: '0 15px', cursor: 'pointer' });
    
    // Options
    const optRow = document.createElement('div');
    optRow.style.display = 'flex'; optRow.style.gap = '15px'; optRow.style.marginBottom = '10px'; optRow.style.fontSize = '13px';
    const c1 = createCheckbox('Regex');
    const c2 = createCheckbox('Match Case');
    const c3 = createCheckbox('Whole Word');
    optRow.appendChild(c1); optRow.appendChild(c2); optRow.appendChild(c3);

    addB.onclick = async () => {
        if(!i1.value) return;
        rules.push({ find: i1.value, replace: i2.value, isRegex: c1.querySelector('input').checked, caseSensitive: c2.querySelector('input').checked, wholeWord: c3.querySelector('input').checked, enabled: true });
        await saveReplacements(scope, rules);
        render();
        i1.value = ''; i2.value = '';
    };
    
    addRow.appendChild(i1); addRow.appendChild(i2); addRow.appendChild(addB);
    container.appendChild(addRow);
    container.appendChild(optRow);

    const render = () => {
        list.innerHTML = '';
        rules.forEach((r, idx) => {
            const item = document.createElement('div');
            Object.assign(item.style, { display: 'flex', alignItems: 'center', background: '#111827', padding: '8px 12px', borderRadius: '6px', gap: '10px' });
            
            const txt = document.createElement('div');
            txt.innerHTML = `<span style="color:#d1d5db">${r.find}</span> <span style="color:#6b7280">➞</span> <span style="color:#93c5fd">${r.replace}</span>`;
            Object.assign(txt.style, { flex: '1', fontSize: '14px', fontFamily: 'monospace' });
            if (!r.enabled) txt.style.opacity = '0.5';

            const del = document.createElement('button'); del.textContent = '✕';
            Object.assign(del.style, { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' });
            del.onclick = async () => { rules.splice(idx, 1); await saveReplacements(scope, rules); render(); };
            
            item.appendChild(txt);
            item.appendChild(del);
            list.appendChild(item);
        });
    };
    render();
    container.appendChild(list);
}

async function renderDeletions(container, rules, scope) {
    const wrap = document.createElement('div');
    const input = document.createElement('input'); input.placeholder = 'Add char...';
    Object.assign(input.style, { ...getInputStyle(), width: '120px', fontSize: '13px' });
    
    input.onkeydown = async (e) => {
        if(e.key === 'Enter' && input.value) {
            rules.push({ char: input.value });
            await saveDeletions(scope, rules);
            input.value = '';
            render();
        }
    };

    const cloud = document.createElement('div');
    Object.assign(cloud.style, { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' });
    
    const render = () => {
        cloud.innerHTML = '';
        rules.forEach((r, idx) => {
            const c = typeof r === 'string' ? r : r.char;
            const tag = document.createElement('div');
            Object.assign(tag.style, { background: '#374151', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' });
            tag.innerHTML = `<span>${c}</span>`;
            const x = document.createElement('span'); x.textContent = '×'; x.style.cursor = 'pointer'; x.style.color = '#ef4444';
            x.onclick = async () => { rules.splice(idx, 1); await saveDeletions(scope, rules); render(); };
            tag.appendChild(x);
            cloud.appendChild(tag);
        });
    };
    render();
    
    wrap.appendChild(input);
    wrap.appendChild(cloud);
    container.appendChild(wrap);
}

// --- UI Helpers ---

function appendSectionTitle(container, text, small=false) {
    const h = document.createElement(small ? 'h4' : 'h3');
    h.textContent = text;
    Object.assign(h.style, { 
        margin: small ? '20px 0 10px 0' : '0 0 20px 0', 
        fontSize: small ? '16px' : '22px', 
        color: '#f3f4f6', fontWeight: '600'
    });
    container.appendChild(h);
}

function createControlGroup(label, desc) {
    const d = document.createElement('div');
    Object.assign(d.style, { marginBottom: '15px' });
    const l = document.createElement('label'); l.textContent = label;
    Object.assign(l.style, { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' });
    const s = document.createElement('div'); s.textContent = desc;
    Object.assign(s.style, { fontSize: '12px', color: '#9ca3af', marginBottom: '8px' });
    d.appendChild(l); d.appendChild(s);
    return d;
}

function createSwitch(label, desc, checked, onChange) {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '12px', background: '#111827', borderRadius: '8px', marginBottom: '10px'
    });
    
    const textCol = document.createElement('div');
    const l = document.createElement('div'); l.textContent = label; l.style.fontSize = '14px'; l.style.fontWeight = '500';
    const d = document.createElement('div'); d.textContent = desc; d.style.fontSize = '12px'; d.style.color = '#9ca3af';
    textCol.appendChild(l); if(desc) textCol.appendChild(d);
    
    // Toggle UI
    const toggle = document.createElement('div');
    Object.assign(toggle.style, {
        width: '44px', height: '24px', borderRadius: '12px', 
        background: checked ? '#4f46e5' : '#374151', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
    });
    const knob = document.createElement('div');
    Object.assign(knob.style, {
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '3px', left: checked ? '23px' : '3px', transition: 'left 0.2s'
    });
    toggle.appendChild(knob);
    
    toggle.onclick = () => {
        const newVal = !checked;
        onChange(newVal);
        // Animate locally
        toggle.style.background = newVal ? '#4f46e5' : '#374151';
        knob.style.left = newVal ? '23px' : '3px';
        checked = newVal;
    };
    
    wrapper.appendChild(textCol);
    wrapper.appendChild(toggle);
    return wrapper;
}
function createCheckbox(label, checked=false, onChange=null) {
    const l = document.createElement('label');
    Object.assign(l.style, { display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' });
    const i = document.createElement('input'); i.type = 'checkbox'; i.checked = checked;
    if(onChange) i.onchange = (e) => onChange(e.target.checked);
    l.appendChild(i); l.appendChild(document.createTextNode(label));
    return l;
}

function getInputStyle() {
    return {
        background: '#111827', border: '1px solid #374151', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box'
    };
}

function createMiniBtn(text, onClick, variant='normal') {
    const b = document.createElement('button'); b.textContent = text;
    Object.assign(b.style, {
        padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer',
        background: variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : '#374151',
        color: variant === 'danger' ? '#ef4444' : '#e5e7eb'
    });
    b.onclick = onClick;
    return b;
}

function createDivider() {
    const d = document.createElement('div'); d.style.borderTop = '1px solid #374151'; d.style.margin = '15px 0';
    return d;
}

async function renderScopeSelector(container, renderCb) {
    const scopes = ['global'];
    if (currentState.scope.startsWith('site:') && !scopes.includes(currentState.scope)) {
        scopes.push(currentState.scope);
    }
    
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between' });

    const left = document.createElement('div');
    left.style.display = 'flex'; left.style.alignItems = 'center'; left.style.gap = '10px';
    
    const label = document.createElement('span'); label.textContent = 'Configuring Scope:';
    label.style.fontSize = '12px'; label.style.color='#9ca3af';

    const sel = document.createElement('select'); Object.assign(sel.style, { ...getInputStyle(), width: 'auto', padding: '6px 12px' });
    scopes.forEach(s => {
        const o = document.createElement('option'); o.value = s;
        o.textContent = s === 'global' ? 'Global Defaults' : 'This Site Only (' + s.replace('site:', '') + ')';
        sel.appendChild(o);
    });
    sel.value = currentState.scope;
    sel.onchange = () => { currentState.scope = sel.value; renderCb(); };
    
    left.appendChild(label); left.appendChild(sel);
    
    // Add site button
    const actions = document.createElement('div');
    if (currentState.scope === 'global' && window.location.origin) {
        const addBtn = createMiniBtn('+ Add Site Scope', () => {
             const site = `site:${window.location.origin}`;
             currentState.scope = site;
             renderCb();
        });
        actions.appendChild(addBtn);
    } else if (currentState.scope !== 'global') {
        const delBtn = createMiniBtn('Delete Scope', async () => {
            if(confirm('Delete all rules for this site?')) {
                 await saveDeletions(currentState.scope, []);
                 await saveReplacements(currentState.scope, []);
                 currentState.scope = 'global';
                 renderCb();
            }
        }, 'danger');
        actions.appendChild(delBtn);
    }

    wrapper.appendChild(left);
    wrapper.appendChild(actions);
    container.appendChild(wrapper);
}

// Persist helpers
async function saveDeletions(scope, deletions) {
    const key = scope === 'global' ? 'user_deletions' : `user_deletions_${scope}`;
    if (scope === 'global') await saveSettings({ user_deletions: deletions });
    else await browser.storage.local.set({ [key]: deletions });
}

async function saveReplacements(scope, replacements) {
    const key = scope === 'global' ? 'user_replacements' : `user_replacements_${scope}`;
    if (scope === 'global') await saveSettings({ user_replacements: replacements });
    else await browser.storage.local.set({ [key]: replacements });
}
