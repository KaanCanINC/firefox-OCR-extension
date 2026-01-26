/**
 * Settings Page Module
 * Handles the settings page functionality
 */

export function initSettingsPage() {
  // Create settings page container
  const settingsContainer = document.createElement('div');
  settingsContainer.style.fontFamily = 'Inter, sans-serif';
  settingsContainer.style.backgroundColor = '#1f2937';
  settingsContainer.style.color = '#f9fafb';
  settingsContainer.style.minHeight = '100vh';
  settingsContainer.style.padding = '40px';
  settingsContainer.style.boxSizing = 'border-box';
  // Header
  const header = document.createElement('h1');
  header.textContent = 'OCR Extension Settings';
  header.style.fontSize = '32px';
  header.style.marginBottom = '40px';
  header.style.textAlign = 'center';

  // Content area
  const content = document.createElement('div');
  content.style.maxWidth = '800px';
  content.style.margin = '0 auto';
  content.style.backgroundColor = '#374151';
  content.style.padding = '30px';
  content.style.borderRadius = '12px';
  content.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';

  // Settings description
  const description = document.createElement('p');
  description.textContent = 'Settings page coming soon...';
  description.style.fontSize = '18px';
  description.style.color = '#9ca3af';
  description.style.textAlign = 'center';
  description.style.marginBottom = '30px';

  // Back button
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to Popup';
  backButton.style.padding = '12px 24px';
  backButton.style.backgroundColor = '#4f46e5';
  backButton.style.color = '#ffffff';
  backButton.style.border = 'none';
  backButton.style.borderRadius = '8px';
  backButton.style.cursor = 'pointer';
  backButton.style.fontSize = '16px';
  backButton.style.fontFamily = 'Inter, sans-serif';
  backButton.style.transition = 'all 0.2s ease';
  backButton.style.display = 'block';
  backButton.style.margin = '0 auto';
  backButton.addEventListener('click', () => { window.close(); });

  content.appendChild(description);
  content.appendChild(backButton);
  settingsContainer.appendChild(header);
  settingsContainer.appendChild(content);

  // Add to body
  document.body.appendChild(settingsContainer);
}

export function openSettingsPanel() {
    if (document.getElementById('ocr-settings-panel')) return;

    // Backdrop (modal)
    const backdrop = document.createElement('div');
    backdrop.id = 'ocr-settings-backdrop';
    Object.assign(backdrop.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.45)', zIndex: '1000000', opacity: '0', transition: 'opacity 220ms ease'
    });

    // Panel
    const panel = document.createElement('aside');
    panel.id = 'ocr-settings-panel';
    Object.assign(panel.style, {
      position: 'fixed', top: '0', left: '0', height: '100vh', width: 'min(420px, 90vw)',
      backgroundColor: '#0f1724', color: '#f9fafb', boxShadow: '2px 0 30px rgba(0,0,0,0.6)',
      zIndex: '1000001', transform: 'translateX(-100%)', transition: 'transform 320ms cubic-bezier(.2,.9,.2,1)',
      overflowY: 'auto', padding: '20px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'
    });

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex'; header.style.alignItems = 'center'; header.style.justifyContent = 'space-between'; header.style.marginBottom = '12px';
    const title = document.createElement('h2'); title.textContent = 'Settings'; title.style.margin = '0'; title.style.fontSize = '18px';
    const closeBtn = document.createElement('button'); closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, { background: 'transparent', border: 'none', color: '#f9fafb', fontSize: '20px', cursor: 'pointer' });
    // visible site URL to the right of the title
    const siteInfo = document.createElement('div');
    siteInfo.style.color = '#9ca3af'; siteInfo.style.fontSize = '12px'; siteInfo.style.marginLeft = '8px';
    try { siteInfo.textContent = (new URL(window.location.href)).hostname || 'current site'; } catch(e){ siteInfo.textContent = 'current site'; }
    const leftHeader = document.createElement('div'); leftHeader.style.display='flex'; leftHeader.style.alignItems='center'; leftHeader.style.gap='12px';
    leftHeader.appendChild(title); leftHeader.appendChild(siteInfo);
    header.appendChild(leftHeader); header.appendChild(closeBtn); panel.appendChild(header);

    // Rule Scope controls (VERY TOP)
    const scopeRow = document.createElement('div'); scopeRow.style.display = 'flex'; scopeRow.style.alignItems = 'center'; scopeRow.style.justifyContent = 'center'; scopeRow.style.gap = '8px'; scopeRow.style.margin = '8px 0 12px 0';
    const scopeLeft = document.createElement('div'); scopeLeft.style.display='flex'; scopeLeft.style.margin='8px 0 0 '; scopeLeft.style.alignItems='center'; scopeLeft.style.gap='6px'; scopeLeft.style.flex='1';
    const scopeLabel = document.createElement('label'); scopeLabel.textContent = 'Rule Scope'; scopeLabel.style.color='#e6eef8'; scopeLabel.style.fontSize='13px';
    const scopeSelect = document.createElement('select'); scopeSelect.id = 'rule_scope';
    const optGlobal = document.createElement('option'); optGlobal.value = 'global'; optGlobal.textContent = 'Global Rules'; scopeSelect.appendChild(optGlobal);
    Object.assign(scopeSelect.style, { padding: '6px', background:'#0b1220', color:'#e6eef8', border:'1px solid #25303a', borderRadius:'6px', minWidth: '160px', margin: '0 auto' });
    scopeLeft.appendChild(scopeLabel); scopeLeft.appendChild(scopeSelect);

    const scopeRight = document.createElement('div'); scopeRight.style.display='flex'; scopeRight.style.alignItems='center'; scopeRight.style.gap='8px';
    const addScopeBtn = document.createElement('button'); addScopeBtn.textContent = '+'; Object.assign(addScopeBtn.style,{padding:'6px 8px',borderRadius:'6px',border:'none',background:'#4f46e5',color:'#fff',cursor:'pointer'});
    const deleteScopeBtn = document.createElement('button'); deleteScopeBtn.textContent = '🗑️'; Object.assign(deleteScopeBtn.style,{padding:'6px 8px',borderRadius:'6px',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer'});
    scopeRight.appendChild(addScopeBtn); scopeRight.appendChild(deleteScopeBtn);

    scopeRow.appendChild(scopeLeft); scopeRow.appendChild(scopeRight);
    panel.appendChild(scopeRow);

    // Sections container
    const container = document.createElement('div'); container.style.display = 'flex'; container.style.flexDirection = 'column'; container.style.gap = '14px';

    // --- A. Manhwa Mode Section ---
    const manhwaCard = document.createElement('section');
    Object.assign(manhwaCard.style, { background: '#111827', padding: '12px', borderRadius: '8px' });
    const manhwaTitle = document.createElement('h3'); manhwaTitle.textContent = 'Find & Replace Rules'; manhwaTitle.style.margin = '0 0 8px 0';
    const manhwaDesc = document.createElement('div'); manhwaDesc.textContent = 'Characters/words to replace in the OCR text'; manhwaDesc.style.color = '#9ca3af'; manhwaDesc.style.fontSize = '13px'; manhwaDesc.style.marginBottom = '10px';

    // Replace rule inputs
    const replaceRow = document.createElement('div');
    replaceRow.style.display = 'flex'; replaceRow.style.flexDirection = 'column'; replaceRow.style.gap = '8px';
    const inputsRow = document.createElement('div'); inputsRow.style.display = 'flex'; inputsRow.style.gap = '12px'; inputsRow.style.alignItems = 'center'; inputsRow.style.flexWrap = 'wrap'; inputsRow.style.margin = '0 auto';
    const findInput = document.createElement('input'); findInput.placeholder = 'Character to Find';
    Object.assign(findInput.style, { width: '150px', padding: '8px', borderRadius: '6px', background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a' });
    const replaceInput = document.createElement('input'); replaceInput.placeholder = 'Replace With';
    Object.assign(replaceInput.style, { width: '150px', padding: '8px', borderRadius: '6px', background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a' });
    const arrow = document.createElement('div'); arrow.textContent = '→'; arrow.style.color = '#9ca3af'; arrow.style.fontSize = '18px'; arrow.style.display = 'flex'; arrow.style.alignItems = 'center'; arrow.style.padding = '0 4px';
    inputsRow.appendChild(findInput); inputsRow.appendChild(arrow); inputsRow.appendChild(replaceInput);
    const errorMsg = document.createElement('div'); errorMsg.style.color = '#f87171'; errorMsg.style.fontSize = '12px'; errorMsg.style.marginTop = '6px'; errorMsg.style.display = 'none'; errorMsg.textContent = '';
    const addRuleBtn = document.createElement('button'); addRuleBtn.textContent = 'Add';
    Object.assign(addRuleBtn.style, { padding: '8px 10px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', width: '72px', alignSelf: 'center' });
    replaceRow.appendChild(inputsRow); replaceRow.appendChild(errorMsg); replaceRow.appendChild(addRuleBtn);

    const replaceList = document.createElement('div'); replaceList.style.marginTop = '8px'; replaceList.style.display = 'grid'; replaceList.style.gridTemplateColumns = '1fr 1fr'; replaceList.style.gap = '8px';

    // Delete char input
    const delTitle = document.createElement('h4'); delTitle.textContent = 'Characters to Delete'; delTitle.style.margin = '12px 0 6px 0'; delTitle.style.fontSize = '15px';
    const delDesc = document.createElement('div'); delDesc.textContent = 'These characters will be removed from the OCR text'; delDesc.style.color = '#9ca3af'; delDesc.style.fontSize = '13px';

    const deleteRow = document.createElement('div'); deleteRow.style.display = 'flex'; deleteRow.style.gap = '8px'; deleteRow.style.alignItems = 'center'; deleteRow.style.marginTop = '8px';
    const deleteInput = document.createElement('input'); deleteInput.placeholder = 'Character to Delete';
    Object.assign(deleteInput.style, { flex: '1', padding: '8px', borderRadius: '6px', background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a' });
    const addDeleteBtn = document.createElement('button'); addDeleteBtn.textContent = 'Add';
    Object.assign(addDeleteBtn.style, { padding: '8px 10px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', width: '72px', flex: '0 0 auto' });
    deleteRow.appendChild(deleteInput); deleteRow.appendChild(addDeleteBtn);

    const deleteList = document.createElement('div'); deleteList.style.marginTop = '8px'; deleteList.style.display = 'flex'; deleteList.style.flexWrap = 'wrap'; deleteList.style.gap = '6px';

    manhwaCard.appendChild(manhwaTitle);
    manhwaCard.appendChild(manhwaDesc);
    manhwaCard.appendChild(replaceRow);
    manhwaCard.appendChild(replaceList);
    manhwaCard.appendChild(delTitle);
    manhwaCard.appendChild(delDesc);
    manhwaCard.appendChild(deleteRow);
    manhwaCard.appendChild(deleteList);

    // --- B. Settings Management ---
    const manageCard = document.createElement('section');
    Object.assign(manageCard.style, { background: '#111827', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', justifyContent: 'center' });
    const importBtn = document.createElement('button'); importBtn.textContent = '📥 Import Settings';
    const exportBtn = document.createElement('button'); exportBtn.textContent = '📤 Export Settings';
    [importBtn, exportBtn].forEach(b=>Object.assign(b.style,{padding:'8px 12px',borderRadius:'6px',border:'none',background:'#4f46e5',color:'#fff',cursor:'pointer'}));

    // hidden file input for import
    const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'application/json'; fileInput.style.display = 'none';
    manageCard.appendChild(importBtn); manageCard.appendChild(exportBtn); manageCard.appendChild(fileInput);

    // (Language select moved to popup) -- removed from settings panel

    // --- D. Copy Function Configuration ---
    const copyCard = document.createElement('section'); Object.assign(copyCard.style,{background:'#111827',padding:'12px',borderRadius:'8px'});
    const copyTitle = document.createElement('h3'); copyTitle.textContent='Copy Function Configuration'; copyTitle.style.margin='0 0 8px 0';
    const copyDesc = document.createElement('p'); copyDesc.textContent='When checked, clicking the action will also copy the resulting text to clipboard.'; copyDesc.style.color='#9ca3af'; copyDesc.style.margin='0 0 8px 0'; copyDesc.style.fontSize='13px';
    const actions = ['Lowercase','Uppercase','Single Line','Manhwa Mode'];
    const copyList = document.createElement('div'); copyList.style.display='flex'; copyList.style.flexDirection='column'; copyList.style.gap='6px';
    actions.forEach(a=>{
      const row=document.createElement('label'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.color = '#e6eef8';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.id=`copy_${a.replace(/\s+/g,'_').toLowerCase()}`;
      // Themed checkbox
      cb.style.width = '16px'; cb.style.height = '16px'; cb.style.accentColor = '#4f46e5'; cb.style.cursor = 'pointer';
      const span=document.createElement('span'); span.textContent=a; span.style.userSelect = 'none';
      row.appendChild(cb); row.appendChild(span); copyList.appendChild(row);
    });
    copyCard.appendChild(copyTitle); copyCard.appendChild(copyDesc); copyCard.appendChild(copyList);

    // Footer actions
    // auto-save flag (read from storage before creating checkbox)
    const autoSave = JSON.parse(localStorage.getItem('manhwa_autoSave') || 'false');
    // Auto-save row (placed above the Close button)
    const autoSaveRow = document.createElement('div'); autoSaveRow.style.display='flex'; autoSaveRow.style.justifyContent='center'; autoSaveRow.style.alignItems='center'; autoSaveRow.style.gap='8px'; autoSaveRow.style.marginTop='6px';
    const autoSaveChk = document.createElement('input'); autoSaveChk.type='checkbox'; autoSaveChk.id='autosave_chk'; autoSaveChk.checked = autoSave;
    const autoSaveLabel = document.createElement('label'); autoSaveLabel.textContent='Auto-save'; autoSaveLabel.style.color='#e6eef8'; autoSaveLabel.style.fontSize='13px';
    // help icon with tooltip
    const autoHelp = document.createElement('span'); autoHelp.textContent=' ?'; autoHelp.title = 'Automatically saves rule changes without needing to click Save'; autoHelp.style.cursor = 'help'; autoHelp.style.color = '#9ca3af'; autoHelp.style.fontSize = '13px';
    autoSaveRow.appendChild(autoSaveChk); autoSaveRow.appendChild(autoSaveLabel); autoSaveRow.appendChild(autoHelp);

    const footer = document.createElement('div'); footer.style.display='flex'; footer.style.justifyContent='center'; footer.style.marginTop='6px'; footer.style.alignItems='center'; footer.style.gap='8px';
    const saveBtn = document.createElement('button'); saveBtn.textContent='Close & Save';
    Object.assign(saveBtn.style,{padding:'10px 14px',borderRadius:'8px',border:'none',background:'#4f46e5',color:'#fff',cursor:'pointer'});
    const saveIndicator = document.createElement('div'); saveIndicator.style.color = '#9ca3af'; saveIndicator.style.fontSize = '13px'; saveIndicator.style.display='none'; saveIndicator.textContent = '';
    footer.appendChild(saveIndicator); footer.appendChild(saveBtn);

    // assemble in requested order: rules, delete, copy config, import/export, footer
    container.appendChild(manhwaCard);
    container.appendChild(copyCard);
    container.appendChild(manageCard);
    // place autosave row above the footer
    container.appendChild(autoSaveRow);
    container.appendChild(footer);
    panel.appendChild(container);

    // small toast helper for notifications
    function showToast(msg){
      const t = document.createElement('div');
      t.textContent = msg;
      Object.assign(t.style,{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',background:'#0b1220',color:'#e6eef8',padding:'8px 12px',borderRadius:'8px',border:'1px solid #25303a',zIndex:1000003,opacity:'0',transition:'opacity 160ms ease'});
      panel.appendChild(t);
      requestAnimationFrame(()=>t.style.opacity='1');
      setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 1800);
    }

    autoSaveChk.addEventListener('change', ()=>{
      try{ localStorage.setItem('manhwa_autoSave', JSON.stringify(!!autoSaveChk.checked)); }catch(e){}
      if(autoSaveChk.checked){ saveSettings(); clearDirty(); showToast('Auto-save enabled: Changes are saved automatically'); }
      else { showToast('Auto-save disabled'); }
    });

    // In-memory rule storage (also persisted to localStorage per-scope)
    window.manhwaRules = window.manhwaRules || []; // array of {find, replace}
    window.manhwaDeleteChars = window.manhwaDeleteChars || []; // array of single-char strings
    let previousScope = 'global';
    let dirty = false;

    function scopeKeyRules(scope) { return 'manhwa_rules::' + encodeURIComponent(scope); }
    function scopeKeyDeletes(scope) { return 'manhwa_deletes::' + encodeURIComponent(scope); }
    function currentScope() { return document.getElementById('rule_scope') ? document.getElementById('rule_scope').value : 'global'; }

    function markDirty() { dirty = true; saveIndicator.style.display = 'inline-block'; saveIndicator.textContent = 'Unsaved'; }
    function clearDirty() { dirty = false; saveIndicator.style.display = 'inline-block'; saveIndicator.textContent = 'Saved'; setTimeout(()=>{ if(!dirty) saveIndicator.style.display='none'; }, 900); }

    // Render functions
    function removeRuleAt(idx){ window.manhwaRules.splice(idx,1); renderReplaceList(); if(autoSaveChk && autoSaveChk.checked) saveSettings(); else markDirty(); }

    function renderReplaceList() {
      replaceList.innerHTML = '';
      window.manhwaRules.forEach((r, idx)=>{
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.flexDirection = 'row';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.padding = '6px 8px';
        item.style.background = '#071022';
        item.style.borderRadius = '8px';
        item.style.minHeight = '36px';
        item.style.boxSizing = 'border-box';

        const label = document.createElement('div');
        label.textContent = `${r.find} → ${r.replace}`;
        label.style.color = '#e6eef8';
        label.style.fontSize = '14px';
        label.style.flex = '1';
        label.style.marginRight = '8px';
        label.style.whiteSpace = 'nowrap';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';

        const del = document.createElement('button'); del.textContent='✕';
        Object.assign(del.style,{padding:'6px',borderRadius:'6px',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer', marginLeft: '8px'});
        del.addEventListener('click', ()=>{ removeRuleAt(idx); });

        item.appendChild(label);
        item.appendChild(del);
        replaceList.appendChild(item);
      });
    }

    function removeDeleteAt(idx){ window.manhwaDeleteChars.splice(idx,1); renderDeleteList(); if(autoSaveChk && autoSaveChk.checked) saveSettings(); else markDirty(); }

    function renderDeleteList() {
      deleteList.innerHTML = '';
      window.manhwaDeleteChars.forEach((ch, idx)=>{
        const chip = document.createElement('div');
        chip.style.display = 'inline-flex';
        chip.style.alignItems = 'center';
        chip.style.gap = '8px';
        chip.style.padding = '6px 8px';
        chip.style.background = '#07202a';
        chip.style.color = '#e6eef8';
        chip.style.borderRadius = '8px';
        chip.style.border = '1px solid rgba(255,255,255,0.03)';

        const span = document.createElement('span'); span.textContent = ch; span.style.fontSize = '13px'; span.style.marginRight = '10px';

        const del = document.createElement('button'); del.textContent='✕';
        Object.assign(del.style,{padding:'6px',borderRadius:'6px',border:'none',background:'#ef4444',color:'#fff',cursor:'pointer'});
        del.addEventListener('click', ()=>{ removeDeleteAt(idx); });

        chip.appendChild(span); chip.appendChild(del); deleteList.appendChild(chip);
      });
    }

    function loadSettings() {
      const scope = currentScope() || 'global';
      // populate scopeSelect with known scopes from localStorage (keep global)
      try {
        const seen = new Set();
        seen.add('global');
        for (let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith('manhwa_rules::') || k.startsWith('manhwa_deletes::')){
            const sc = decodeURIComponent(k.split('::')[1]||'');
            if (sc && !seen.has(sc)) { const opt=document.createElement('option'); opt.value=sc; opt.textContent = sc.startsWith('site:') ? sc.replace(/^site:/,'') : sc; scopeSelect.appendChild(opt); seen.add(sc); }
          }
        }
      } catch(e){}

      // deletes for this scope
      const deletesRaw = localStorage.getItem(scopeKeyDeletes(scope)) || '[]';
      try { const parsed = JSON.parse(deletesRaw); window.manhwaDeleteChars = Array.isArray(parsed) ? parsed.slice() : []; } catch (e) { window.manhwaDeleteChars = []; }

      // rules for this scope
      const rulesRaw = localStorage.getItem(scopeKeyRules(scope)) || '[]';
      try { const parsed = JSON.parse(rulesRaw); window.manhwaRules = Array.isArray(parsed) ? parsed.map(p=>({find: String(p.find||''), replace: String(p.replace||'')})) : []; } catch (e) { window.manhwaRules = []; }

      // load copy config (global)
      const copyCfg = JSON.parse(localStorage.getItem('copyConfig') || '{}');
      actions.forEach(a=>{ const id=`copy_${a.replace(/\s+/g,'_').toLowerCase()}`; const el=document.getElementById(id); if(el) el.checked = !!copyCfg[id]; });

      renderReplaceList(); renderDeleteList();
      previousScope = scope;
      clearDirty();
    }

    function saveSettings() {
      const scope = currentScope() || 'global';
      try { localStorage.setItem(scopeKeyDeletes(scope), JSON.stringify(window.manhwaDeleteChars)); } catch (e) { localStorage.setItem(scopeKeyDeletes(scope), JSON.stringify(window.manhwaDeleteChars || [])); }
      try { localStorage.setItem(scopeKeyRules(scope), JSON.stringify(window.manhwaRules)); } catch (e) { localStorage.setItem(scopeKeyRules(scope), JSON.stringify(window.manhwaRules || [])); }
      // for backward compatibility persist global legacy keys when saving global scope
      if (scope === 'global') {
        try { localStorage.setItem('charsToDelete', JSON.stringify(window.manhwaDeleteChars)); } catch (e) { localStorage.setItem('charsToDelete', (window.manhwaDeleteChars || []).join('')); }
        try { localStorage.setItem('replacementsText', JSON.stringify(window.manhwaRules)); } catch (e) { localStorage.setItem('replacementsText', '[]'); }
      }
      // language moved to popup; do not persist here
      const cfg = {};
      actions.forEach(a=>{ const id=`copy_${a.replace(/\s+/g,'_').toLowerCase()}`; const el=document.getElementById(id); cfg[id]=!!(el && el.checked); });
      localStorage.setItem('copyConfig', JSON.stringify(cfg));
    }

    // Import/export handlers
    importBtn.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if(parsed.manhwaDeleteChars) window.manhwaDeleteChars = parsed.manhwaDeleteChars.slice();
          if(parsed.manhwaRules) window.manhwaRules = parsed.manhwaRules.map(r=>({find:r.find+'',replace:r.replace+''}));
          if(parsed.charsToDelete && !parsed.manhwaDeleteChars) {
            try { const p = JSON.parse(parsed.charsToDelete); if(Array.isArray(p)) window.manhwaDeleteChars = p.slice(); else window.manhwaDeleteChars = (parsed.charsToDelete||'').split(''); } catch { window.manhwaDeleteChars = (parsed.charsToDelete||'').split(''); }
          }
          if(parsed.replacementsText && !parsed.manhwaRules) {
            // try legacy format
            try { const p = JSON.parse(parsed.replacementsText); if(Array.isArray(p)) window.manhwaRules = p.slice(); } catch { const lines=(parsed.replacementsText||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean); window.manhwaRules = []; lines.forEach(line=>{ const arrow = line.indexOf('→')>=0 ? '→' : (line.indexOf('=>')>=0 ? '=>' : null); if(arrow){ const parts=line.split(arrow); window.manhwaRules.push({find:parts[0], replace:parts.slice(1).join(arrow)}); } }); }
          }
          // language handled in popup now
          if(parsed.copyConfig) { Object.keys(parsed.copyConfig).forEach(k=>{ const el=document.getElementById(k); if(el) el.checked=!!parsed.copyConfig[k]; }); }
          renderReplaceList(); renderDeleteList(); saveSettings();
          alert('Imported settings');
        } catch (err) { alert('Invalid settings file'); }
      };
      reader.readAsText(f);
      e.target.value = '';
    });

    exportBtn.addEventListener('click', ()=>{
      // export ALL scopes (includes site-specific rules)
      const all = {};
      try{
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i);
          if(!k) continue;
          if(k.startsWith('manhwa_rules::')){
            const sc = decodeURIComponent(k.split('::')[1]||'');
            try{ all[sc] = all[sc] || {}; all[sc].manhwaRules = JSON.parse(localStorage.getItem(k) || '[]'); }catch(e){ all[sc].manhwaRules = []; }
          }
          if(k.startsWith('manhwa_deletes::')){
            const sc = decodeURIComponent(k.split('::')[1]||'');
            try{ all[sc] = all[sc] || {}; all[sc].manhwaDeleteChars = JSON.parse(localStorage.getItem(k) || '[]'); }catch(e){ all[sc].manhwaDeleteChars = []; }
          }
        }
      }catch(e){}
      const payload = { exportedAt: new Date().toISOString(), scopes: all, copyConfig: JSON.parse(localStorage.getItem('copyConfig') || '{}') };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ocr-settings-all.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    // Close handlers with unsaved-change confirmation
    function doClose(save){ if(save) saveSettings(); panel.style.transform='translateX(-100%)'; backdrop.style.opacity='0'; setTimeout(()=>{ if(backdrop.parentElement) backdrop.parentElement.removeChild(backdrop); if(panel.parentElement) panel.parentElement.removeChild(panel); window.removeEventListener('keydown', onKey); }, 340); }

    function closePanel(){
      if (dirty && !(autoSaveChk && autoSaveChk.checked)){
        // show confirm dialog inside panel
        const confirmBox = document.createElement('div');
        Object.assign(confirmBox.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',background:'#0b1220',padding:'12px',borderRadius:'8px',border:'1px solid #25303a',zIndex:1000003});
        const msg = document.createElement('div'); msg.textContent = 'You have unsaved changes. Save before closing?'; msg.style.marginBottom='8px'; msg.style.color='#e6eef8';
        const bSave = document.createElement('button'); bSave.textContent='Save & Close'; Object.assign(bSave.style,{marginRight:'8px',padding:'6px 8px',background:'#4f46e5',color:'#fff',border:'none',borderRadius:'6px'});
        const bDiscard = document.createElement('button'); bDiscard.textContent='Discard & Close'; Object.assign(bDiscard.style,{marginRight:'8px',padding:'6px 8px',background:'#ef4444',color:'#fff',border:'none',borderRadius:'6px'});
        const bCancel = document.createElement('button'); bCancel.textContent='Cancel'; Object.assign(bCancel.style,{padding:'6px 8px',background:'#374151',color:'#fff',border:'none',borderRadius:'6px'});
        confirmBox.appendChild(msg); confirmBox.appendChild(bSave); confirmBox.appendChild(bDiscard); confirmBox.appendChild(bCancel);
        panel.appendChild(confirmBox);
        bSave.addEventListener('click', ()=>{ confirmBox.remove(); doClose(true); });
        bDiscard.addEventListener('click', ()=>{ confirmBox.remove(); doClose(false); });
        bCancel.addEventListener('click', ()=>{ confirmBox.remove(); });
        return;
      }
      doClose(true);
    }

    closeBtn.addEventListener('click', ()=> closePanel());
    saveBtn.addEventListener('click', ()=> { saveSettings(); clearDirty(); doClose(true); });
    backdrop.addEventListener('click', ()=> closePanel());

    function onKey(e){ if(e.key === 'Escape') closePanel(); }
    window.addEventListener('keydown', onKey);

    // Append and animate
    document.body.appendChild(backdrop); document.body.appendChild(panel);
    requestAnimationFrame(()=>{ backdrop.style.opacity='1'; panel.style.transform = 'translateX(0)'; });

    // Load existing settings
    loadSettings();

    // Scope change handling and add-scope button
    const scopeSelectEl = document.getElementById('rule_scope');
    scopeSelectEl.addEventListener('change', (e)=>{
      const newScope = scopeSelectEl.value;
      if (newScope === previousScope) return;
      const ok = confirm(`Switch rule scope to "${newScope}"?`);
      if (!ok) { scopeSelectEl.value = previousScope; return; }
      previousScope = newScope;
      loadSettings();
    });

    addScopeBtn.addEventListener('click', ()=>{
      const origin = window.location && window.location.origin ? window.location.origin : (window.location && window.location.href ? window.location.href : 'current');
      const val = `site:${origin}`;
      // add option if missing
      if (!Array.from(scopeSelectEl.options).some(o=>o.value === val)) {
        const opt = document.createElement('option'); opt.value = val; opt.textContent = origin; scopeSelectEl.appendChild(opt);
      }
      // switch to the new scope
      scopeSelectEl.value = val;
      previousScope = val;
      // initialize empty rules for this site if not present
      try { if(!localStorage.getItem(scopeKeyRules(val))) { localStorage.setItem(scopeKeyRules(val), JSON.stringify([])); } if(!localStorage.getItem(scopeKeyDeletes(val))) { localStorage.setItem(scopeKeyDeletes(val), JSON.stringify([])); } } catch(e) {}
      window.manhwaRules = []; window.manhwaDeleteChars = [];
      renderReplaceList(); renderDeleteList(); saveSettings();
    });

    deleteScopeBtn.addEventListener('click', ()=>{
      const scope = scopeSelectEl.value || 'global';
      if(scope === 'global') { alert('Cannot delete the Global scope.'); return; }
      const ok = confirm(`Delete rules for scope "${scope}"? This will remove saved rules for this site.`);
      if(!ok) return;
      try{
        localStorage.removeItem(scopeKeyRules(scope));
        localStorage.removeItem(scopeKeyDeletes(scope));
      }catch(e){}
      // remove option from select
      const opt = Array.from(scopeSelectEl.options).find(o=>o.value===scope);
      if(opt) opt.remove();
      // switch back to global
      scopeSelectEl.value = 'global'; previousScope = 'global'; loadSettings();
      alert('Scope deleted');
    });

    // Add rule handlers
    addRuleBtn.addEventListener('click', ()=>{
      const f = (findInput.value || '').trim();
      const r = (replaceInput.value || '').trim();
      if(!f || !r) {
        errorMsg.textContent = 'Both fields are required';
        errorMsg.style.display = 'block';
        return;
      }
      errorMsg.style.display = 'none';
      window.manhwaRules.push({ find: f, replace: r });
      findInput.value = ''; replaceInput.value = '';
      renderReplaceList();
      if (autoSaveChk && autoSaveChk.checked) saveSettings(); else markDirty();
    });

    // Enter key triggers add; Esc handled globally
    [findInput, replaceInput].forEach(inp=>{
      inp.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter') { e.preventDefault(); addRuleBtn.click(); }
      });
    });

    addDeleteBtn.addEventListener('click', ()=>{
      const ch = (deleteInput.value || '').trim();
      if(!ch) { alert('Enter a character to delete'); return; }
      // allow multi-char but store as string entries
      window.manhwaDeleteChars.push(ch);
      deleteInput.value = '';
      renderDeleteList();
      if (autoSaveChk && autoSaveChk.checked) saveSettings(); else markDirty();
    });

  }