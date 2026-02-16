/**
 * Manhwa Mode Button
 * Applies OCR corrections and converts to single line + lowercase
 */

import { createButton } from './createButton.js';

export function createManhwaModeButton(textarea) {
  const button = createButton('Manhwa Mode', '120px', '32px', () => {
    let correctedText = textarea.value || '';
    // get delete chars from in-memory array or fallback to localStorage
    let deleteChars = [];
    try { if (window.manhwaDeleteChars && Array.isArray(window.manhwaDeleteChars)) deleteChars = window.manhwaDeleteChars.slice(); }
    catch (e) { /* ignore */ }
    if (deleteChars.length === 0) {
      const raw = localStorage.getItem('charsToDelete') || '';
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) deleteChars = parsed.slice(); else deleteChars = (raw||'').split(''); } catch { deleteChars = (raw||'').split(''); }
    }
    // remove delete chars
    deleteChars.forEach(ch => { if (!ch) return; correctedText = correctedText.split(ch).join(''); });

    // apply replacement rules from in-memory or localStorage
    let rules = [];
    try { if (window.manhwaRules && Array.isArray(window.manhwaRules)) rules = window.manhwaRules.map(r=>({find:r.find+'',replace:r.replace+''})); }
    catch (e) { }
    if (rules.length === 0) {
      // try per-site scoped rules first
      try {
        const origin = (window.location && window.location.origin) ? window.location.origin : null;
        if (origin) {
          const key = 'manhwa_rules::' + encodeURIComponent('site:' + origin);
          const rawScoped = localStorage.getItem(key);
          if (rawScoped) {
            const parsed = JSON.parse(rawScoped);
            if (Array.isArray(parsed)) {
              rules = parsed.map(p => ({ find: String(p.find || ''), replace: String(p.replace || '') }));
            }
          }
        }
      } catch (e) { /* ignore */ }

      if (rules.length === 0) {
        const raw = localStorage.getItem('replacementsText') || '';
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            rules = parsed.map(p => ({ find: String(p.find || ''), replace: String(p.replace || '') }));
          } else {
            // legacy newline format
            const lines = String(raw || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            const parsedRules = [];
            lines.forEach(line => {
              const arrow = line.indexOf('→') >= 0 ? '→' : (line.indexOf('=>') >= 0 ? '=>' : null);
              if (arrow) {
                const parts = line.split(arrow);
                parsedRules.push({ find: parts[0], replace: parts.slice(1).join(arrow) });
              }
            });
            rules = parsedRules;
          }
        } catch (e) {
          // fallback parse legacy format
          const lines = String(raw || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          const parsedRules = [];
          lines.forEach(line => {
            const arrow = line.indexOf('→') >= 0 ? '→' : (line.indexOf('=>') >= 0 ? '=>' : null);
            if (arrow) {
              const parts = line.split(arrow);
              parsedRules.push({ find: parts[0], replace: parts.slice(1).join(arrow) });
            }
          });
          rules = parsedRules;
        }
      }
    }

    // helper to escape regex special chars
    function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    // apply replacements with exact matching (not inside larger words), case-insensitive
    rules.forEach(rule => {
      if (!rule || !rule.find) return;
      try {
        const esc = escapeRegExp(rule.find);
        const pattern = `(?<!\\w)${esc}(?!\\w)`; // ensure not part of larger word
        const re = new RegExp(pattern, 'gi');
        correctedText = correctedText.replace(re, rule.replace || '');
      } catch (e) {
        // fallback to simple replace if regex fails
        try { correctedText = correctedText.split(rule.find).join(rule.replace || ''); } catch (err) { /* ignore */ }
      }
    });

    textarea.value = correctedText.replace(/\n/g, ' ').toLowerCase();
  });

  return button;
}
