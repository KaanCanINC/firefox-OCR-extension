// src/utils/settingsManager.js

/**
 * Settings Manager (Unified with Profiles)
 * Handles configuration storage, retrieval, and profile management.
 */

const STORAGE_KEY = 'ocr_settings_data_v3';

// Default configuration for a new profile
const DEFAULT_PROFILE = {
    name: 'Default',
    // --- Preprocessing (Image) ---
    preprocess_resize: true,
    preprocess_grayscale: true,
    preprocess_contrast: true,
    preprocess_blur: false,
    preprocess_threshold: false,
    preprocess_morphology: false,
    preprocess_borders: false,

    // --- OCR Engine ---
    tess_psm: '3',
    tess_oem: '1',
    tess_lang: 'eng',
    tess_whitelist: '',
    auto_psm: false,

    // --- Postprocessing (Text Cleaning) ---
    clean_noise: true,
    noise_aggression: 'medium',
    clean_normalize: true,
    clean_regex: true,
    clean_dict: false,
    dict_strength: 1,
    dict_ignore_caps: true,
    clean_user: true,
    manhwa_mode: false,
    
    // --- Reconstruction ---
    reconstruct_text: true,
    reconstruct_merge: true,
    reconstruct_stabilize: true,

    // --- UI / UX ---
    debug_mode: false,
    popup_hidden_buttons: [],
    
    // --- Rules (Profile Scoped) ---
    user_replacements: [],
    user_deletions: []
};

const MANHWA_PROFILE = {
    ...DEFAULT_PROFILE,
    name: 'Manhwa Mode',
    preprocess_resize: true,
    preprocess_grayscale: true,
    preprocess_contrast: true,
    preprocess_blur: false, 
    preprocess_threshold: false, // Adaptive threshold can hurt detailed art BG
    clean_dict: false, // Names are often unique
    manhwa_mode: true, // Key feature
    reconstruct_merge: true,
    reconstruct_stabilize: true
};

// Global settings (shared across profiles)
const GLOBAL_SETTINGS = {
    active_profile_id: 'default',
    floating_button_enabled: true,
    floating_button_mode: 'blacklist', // 'blacklist' or 'whitelist'
    floating_button_blacklist: [],
    floating_button_whitelist: [],
    enable_multiselect: false
};

// Structure on disk:
// {
//    global: { ... },
//    profiles: {
//       'default': { ... },
//       'custom_123': { ... }
//    }
// }

export const CURRENT_VERSION = 1;

export async function getSettings(keys = null) {
    const data = await loadData();
    const activeId = data.global.active_profile_id;
    // Ensure profile exists, fallback to default if corrupt
    let profile = data.profiles[activeId];

    if (!profile) {
        // Fallback or repair
        profile = data.profiles['default'] || { ...DEFAULT_PROFILE };
    }

    // Merge global + profile settings into one flat object for easy consumption
    const merged = { ...data.global, ...profile, _profileId: activeId };
    
    // Return filtered or all
    if (Array.isArray(keys)) {
        return keys.reduce((acc, k) => {
            acc[k] = merged[k];
            return acc;
        }, {});
    }
    return merged;
}

export async function saveSettings(newSettings) {
    const data = await loadData();
    const activeId = data.global.active_profile_id;
    
    // Split settings into global vs profile
    const globalKeys = Object.keys(GLOBAL_SETTINGS);
    
    let profileUpdated = false;
    let globalUpdated = false;

    for (const [key, value] of Object.entries(newSettings)) {
        if (globalKeys.includes(key) || key === 'active_profile_id') {
            data.global[key] = value;
            globalUpdated = true;
        } else {
            // It's a profile setting
            if (!data.profiles[activeId]) data.profiles[activeId] = { ...DEFAULT_PROFILE };
            data.profiles[activeId][key] = value;
            profileUpdated = true;
        }
    }

    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return data;
}

// Profile Management API

export async function getProfileList() {
    const data = await loadData();
    // Default and Manhwa always first
    const list = [];
    const others = [];
    
    Object.entries(data.profiles).forEach(([id, p]) => {
        const item = { id, name: p.name || 'Unnamed' };
        if (id === 'default') list.unshift(item);
        else if (id === 'manhwa') list.push(item); // Should be second
        else others.push(item);
    });
    
    // Sort others by name
    others.sort((a,b) => a.name.localeCompare(b.name));
    return [...list, ...others];
}

export async function createProfile(name, cloneSourceId = null) {
    const data = await loadData();
    const id = `profile_${Date.now()}`;
    let template = DEFAULT_PROFILE;
    
    if (cloneSourceId && data.profiles[cloneSourceId]) {
        template = data.profiles[cloneSourceId];
    }
    
    data.profiles[id] = { ...template, name };
    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return id;
}

export async function renameProfile(id, newName) {
    const data = await loadData();
    if (!data.profiles[id]) return false;
    data.profiles[id].name = newName;
    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return true;
}

export async function deleteProfile(id) {
    const data = await loadData();
    if (id === 'default' || id === 'manhwa') return false; // Prevent deleting defaults

    
    delete data.profiles[id];
    if (data.global.active_profile_id === id) {
        data.global.active_profile_id = 'default';
    }
    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return true;
}

export async function setActiveProfile(id) {
    const data = await loadData();
    if (!data.profiles[id]) return false;
    data.global.active_profile_id = id;
    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return true;
}

export async function resetProfile(id) {
    const data = await loadData();
    if (!data.profiles[id]) return false;
    const name = data.profiles[id].name;
    data.profiles[id] = { ...DEFAULT_PROFILE, name };
    await browser.storage.local.set({ [STORAGE_KEY]: data });
    return true;
}

// --- Import / Export / Reset ---

export async function exportSettings(scope = 'full', options = {}) {
    // 1. Full Export
    const data = await loadData();
    if (scope === 'full') {
        const fullDump = {
            version: CURRENT_VERSION,
            timestamp: Date.now(),
            type: 'full_backup',
            data: data, // contains global + profiles
            // Site rules are tricky since they are root keys?
            site_replacements: {},
            site_deletions: {}
        };
        
        // Optionally export site rules too? 
        // We'll iterate all storage for `user_replacements_site:` keys
        const allKeys = await browser.storage.local.get(null);
        Object.keys(allKeys).forEach(k => {
            if (k.startsWith('user_replacements_site:')) fullDump.site_replacements[k] = allKeys[k];
            if (k.startsWith('user_deletions_site:')) fullDump.site_deletions[k] = allKeys[k];
        });
        
        return JSON.stringify(fullDump, null, 2);
    }
    
    // 2. Single Profile Export
    if (scope === 'profile') {
        const id = options.id || data.global.active_profile_id;
        const profile = data.profiles[id];
        if (!profile) throw new Error('Profile not found');
        
        const profileDump = {
            version: CURRENT_VERSION,
            timestamp: Date.now(),
            type: 'profile_export',
            name: profile.name,
            data: profile
        };
        return JSON.stringify(profileDump, null, 2);
    }
}

export async function importSettings(jsonString, mode = 'merge') {
    let imported;
    try {
        imported = JSON.parse(jsonString);
    } catch (e) {
        throw new Error('Invalid JSON format');
    }
    
    // Validate
    if (!imported.version || !imported.type) throw new Error('Invalid settings file (missing metadata)');
    
    const currentData = await loadData();
    
    // --- Scenario A: Profile Import ---
    if (imported.type === 'profile_export') {
        // Always add as NEW profile to be safe, unless replace active?
        // Let's create new profile with imported name + timestamp
        const newId = `profile_${Date.now()}_imp`;
        const newName = imported.name + (mode === 'merge' ? ' (Imported)' : ''); // mode logic for profile?
        
        // If mode is replace, overwrite ACTIVE profile? Or create new?
        // Safest: Create new, let user switch/delete old.
        currentData.profiles[newId] = { ...DEFAULT_PROFILE, ...imported.data };
        currentData.profiles[newId].name = newName;
        
        await browser.storage.local.set({ [STORAGE_KEY]: currentData });
        return { success: true, message: `Imported profile "${newName}"` };
    }
    
    // --- Scenario B: Full Backup Import ---
    if (imported.type === 'full_backup') {
        const newData = imported.data;
        
        if (mode === 'replace') {
            // Dangerous: Wipe it all
            // 1. Main settings
            await browser.storage.local.set({ [STORAGE_KEY]: newData });
            
            // 2. Site rules?
            // If replace, we should probably clear old site rules first?
            // That's very destructive. Let's stick to main settings replacement for now unless explicitly requested.
            // But we should restore site rules if present in backup.
            if (imported.site_replacements) await browser.storage.local.set(imported.site_replacements);
            if (imported.site_deletions) await browser.storage.local.set(imported.site_deletions);
            
            return { success: true, message: 'Settings fully restored.' };
        } 
        
        if (mode === 'merge') {
            // Merge Import:
            // 1. Add missing profiles
            let added = 0;
            for (const [pid, pdata] of Object.entries(newData.profiles)) {
                if (!currentData.profiles[pid]) {
                    currentData.profiles[pid] = pdata;
                    added++;
                } else {
                    // Conflict? Add as copy?
                    const newPid = `${pid}_merge_${Date.now()}`;
                    currentData.profiles[newPid] = { ...pdata, name: pdata.name + ' (Imported)' };
                    added++;
                }
            }
            // 2. What about global?
            // Keep current global unless unset?
            // Usually merge prefers current, or just adds data. We don't overwrite global active ID.
            await browser.storage.local.set({ [STORAGE_KEY]: currentData });
            return { success: true, message: `Merged ${added} profiles.` };
        }
    }
    
    throw new Error('Unknown import type');
}


export async function resetSystem(level, target) {
    const data = await loadData();
    
    if (level === 'profile') {
        // Reset active profile to defaults
        const id = data.global.active_profile_id;
        const name = data.profiles[id].name;
        // Keep name, reset values
        data.profiles[id] = { ...DEFAULT_PROFILE, name };
        await browser.storage.local.set({ [STORAGE_KEY]: data });
        return true;
    }
    
    if (level === 'full') {
        // Reset everything to factory state
        await browser.storage.local.clear(); // Nuclear option
        // Re-init default
        const empty = {
            global: { ...GLOBAL_SETTINGS },
            profiles: { 'default': { ...DEFAULT_PROFILE } }
        };
        await browser.storage.local.set({ [STORAGE_KEY]: empty });
        return true;
    }
    
    if (level === 'section') {
        // Reset specific keys in active profile
        // Target is list of keys?
        if (!Array.isArray(target)) return false;
        const id = data.global.active_profile_id;
        
        target.forEach(k => {
            if (DEFAULT_PROFILE.hasOwnProperty(k)) {
                data.profiles[id][k] = DEFAULT_PROFILE[k];
            }
        });
        await browser.storage.local.set({ [STORAGE_KEY]: data });
        return true;
    }
}

// Legacy rule loader adapter (For UI - Loads ONLY specific scope)
export async function loadRules(scope) {
    if (scope === 'global') {
        const s = await getSettings(['user_replacements', 'user_deletions']);
        return {
            replacements: s.user_replacements || [],
            deletions: s.user_deletions || []
        };
    } else {
        const rKey = `user_replacements_${scope}`;
        const dKey = `user_deletions_${scope}`;
        const res = await browser.storage.local.get([rKey, dKey]);
        return {
            replacements: res[rKey] || [],
            deletions: res[dKey] || []
        };
    }
}

// For OCR Engine - Merges Global + Site rules
export async function getEffectiveRules(scope) {
    const globalRules = await loadRules('global');
    if (!scope || scope === 'global') return globalRules;
    
    const siteRules = await loadRules(scope);
    return {
        replacements: [...globalRules.replacements, ...siteRules.replacements],
        deletions: [...globalRules.deletions, ...siteRules.deletions]
    };
}

// Internal Helper
async function loadData() {
    const res = await browser.storage.local.get(STORAGE_KEY);
    let data = res[STORAGE_KEY];
    
    // Initialize if empty
    if (!data.profiles) {
        data = {
            global: { ...GLOBAL_SETTINGS },
            profiles: {
                'default': { ...DEFAULT_PROFILE },
                'manhwa': { ...MANHWA_PROFILE }
            }
        };
    }
    // Check if manwha profile exists, add it if this is a fresh update
    if (!data.profiles['manhwa'] && !data.profiles['manhwa_v1']) {
        // Only if it doesn't conflict or if user hasn't explicitly deleted? 
        // For simplicity, just ensure it exists on load if missing.
        data.profiles['manhwa'] = { ...MANHWA_PROFILE };
        // We modified data, should save back?
        // Let's optimize: only save if we created it.
        // Actually, loadData is usually read-only. We should return it and let caller modify if needed.
        // But for initialization, maybe better to save.
        // We'll rely on the fact that if getSettings is called, it might use this.
        // To persist, we need to save.
        await browser.storage.local.set({ [STORAGE_KEY]: data });
    }
    return data;
}
