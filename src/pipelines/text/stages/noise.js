/**
 * Smart Noise Cleaning Stage
 * Removes stray symbols and isolated characters likely caused by border spikes or OCR artifacts.
 * Context-aware: preserves meaningful punctuation.
 */
export function cleanNoise(text, options = {}) {
    if (!text) return text;

    const aggression = options.noiseAggression || 'medium'; // low, medium, high

    let lines = text.split('\n');

    lines = lines.map(line => {
        let cleaned = line.trim();

        // 1. Remove Border Spikes (Vertical bars, underscores, equals) at edges
        // Aggressive trims
        // Remove leading: |, _, =, —
        cleaned = cleaned.replace(/^[|_=\u2014\-]+/, ''); 
        // Remove trailing: |, _, =, —
        cleaned = cleaned.replace(/[|_=\u2014\-]+$/, '');

        // 2. Remove entire lines that are just noise
        // e.g. "..." is distinct from ".,."
        if (/^[^a-zA-Z0-9]+$/.test(cleaned)) {
            // Keep common ellipses
            if (/^[.?!]+$/.test(cleaned)) return cleaned; 
            // Keep tilde (common in manhwa)
            if (cleaned.includes('~')) return cleaned;
            // Keep dashes if low aggression? "---"
            if (aggression === 'low' && cleaned.includes('-')) return cleaned;
            
            return ''; // Remove line
        }
        
        // 3. Context-aware cleaning within line
        // Remove isolated symbols that are NOT standard punctuation
        
        cleaned = cleaned.split(' ').map(token => {
            // If token is single char
            if (token.length === 1) {
                // Keep alphanumeric
                if (/[a-zA-Z0-9]/.test(token)) return token;
                // Keep standard punctuation
                if (/[.,;?!'"~]/.test(token)) return token;
                
                // Symbols to remove: | \ / = _ - (if isolated)
                // In High aggression, remove anything undefined?
                if (/[|\\/=_\-]/.test(token)) return '';
                
                // Keep currency, math only if low aggression
                if (aggression === 'low' && /[$€£%&+]/.test(token)) return token;
                
                return ''; // Remove likely noise (default for unknown symbols)
            }
            
            // If token is multiple chars but just noise symbols? e.g. "--"
            if (/^[|\\/=_\-]+$/.test(token)) return '';

            return token;
        }).join(' ');

        // Clean up multiple spaces created by removal
        // Note: We avoid heavy space normalization here to allow other stages (like Manhwa mode) 
        // to detect spacing patterns. Simple trim is enough.
        return cleaned.trim();
    });

    return lines.filter(l => l.length > 0).join('\n');
}