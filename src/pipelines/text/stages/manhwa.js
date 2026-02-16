/**
 * Manhwa Mode Cleanup Stage
 * Optimized for vertical text and speech bubbles found in comics.
 * Includes Text Reconstruction logic.
 */
export function cleanManhwaText(text) {
    if (!text) return text;
    
    // 1. Repair Stylized Uppercase (e.g. "H E L L O" -> "HELLO")
    // Look for sequences of single uppercase letters separated by space
    // We try to identify "spaced out words" vs "spaced letters".
    // Strategy: Match sequences of (Letter + Single/Small Space + Letter).
    // Large spaces (2+ spaces) usually indicate word breaks.
    
    // First, preserve legitimate large spaces by replacing them temporarily if needed, 
    // or just ensure our regex doesn't cross them.
    // \h matches horizontal whitespace.
    // We'll use space character explicitly or [ \t] but exclude newlines usually handled later.
    // However, JS regex \s includes newlines.
    
    // Regex: Single char word, followed by (one space, single char word)+
    // We use {1} for space to be strict, or {1,2} to show tolerance?
    // Let's retry with strict single space for "letter spacing"
    
    // Convert multiple spaces to a specific marker? No.
    // Just run replacement on patterns with single spaces.
    
    let processed = text;
    
    // We loop to find all occurrences manually or use sophisticated regex
    // Current approach: Replace (WordBoundary Upper Space Upper WordBoundary)
    // Note: \b matches between word char and non-word char (like space).
    // So [A-Z] is a word. Space is non-word.
    
    // Use a regex that matches "Char Space Char" but not "Char Space Space Char"
    // (?: [A-Z])+ where space is literal ' '
    
    processed = processed.replace(/\b[A-Z](?: [A-Z])+\b/g, (match) => {
        return match.replace(/ /g, '');
    });

    // 2. Normalize line breaks
    // In Manhwa, text is often split into short lines. We want to join them into sentences.
    // However, if there's a double newline, it's likely a paragraph break or a new bubble.
    
    // Split by paragraphs (double newline)
    const paragraphs = processed.split(/\n\s*\n/);
    
    const processedParagraphs = paragraphs.map(para => {
        // Replace single newlines with spaces to join sentence fragments
        // Be careful with hyphens at end of line? e.g. "com-\nputer" -> "computer"
        // Tesseract usually handles this, but custom logic:
        
        let joined = para;
        
        // Handle hyphen hyphenation
        joined = joined.replace(/-\n/g, ''); 
        
        // Join remaining lines with space
        joined = joined.replace(/\n/g, ' ');
        
        // Normalize spaces (tabs, multiple spaces)
        joined = joined.replace(/\s+/g, ' ').trim();
        
        // Repair spacing around punctuation
        // e.g. "Hello ." -> "Hello."
        joined = joined.replace(/\s+([.,;?!])/g, '$1');
        
        return joined;
    });
    
    // Join paragraphs with double newline to preserve separation
    return processedParagraphs.join('\n\n');
}