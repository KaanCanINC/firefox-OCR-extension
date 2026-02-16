/**
 * Regex Correction Stage
 * Applies structured regex-based cleanup rules.
 */
export function applyRegexCorrections(text) {
    if (!text) return text;
    
    let processed = text;
    
    // 1. Join hyphenated words across lines (e.g. self-\ncorrection -> self-correction)
    // Actually, Tesseract often puts hyphens at EOL. If it's `word- \n next`, it should be `word-next`? No, usually `word-\nnext` -> `wordnext` (soft hyphen) or `word-next` (hard hyphen).
    // Let's assume standard English hyphenation: remove hyphen and newline if it looks like a split word,
    // unless it's clearly a compound word. This is tricky. Let's just normalize spaces.
    
    // 2. Fix multiple spaces (except newlines which are paragraph breaks)
    // "Hello   world" -> "Hello world"
    processed = processed.replace(/[ \t]+/g, ' ');
    
    // 3. Fix space before punctuation (common OCR error)
    // "Hello , world" -> "Hello, world"
    processed = processed.replace(/ ([.,;:!?])/g, '$1');
    
    // 4. Fix space after opening parenthesis/Before closing
    // "( word )" -> "(word)"
    processed = processed.replace(/\( /g, '(').replace(/ \)/g, ')');
    
    // 5. Enhance quotes (convert dumb to smart if desired? Maybe not, keep simple).
    // Ensure space valid: "word"next -> "word" next
    // processed = processed.replace(/([a-zA-Z])"([a-zA-Z])/g, '$1" $2'); // risky
    
    // 6. Fix `|` or `1` or `l` standing as `I` (Context: " l am " -> " I am ")
    processed = processed.replace(/\b[l1]\b(?= am| have| don't| will)/g, 'I');
    
    // 7. Remove vertical bars often read from page edges/dividers
    // If a line starts or ends with |, remove it.
    processed = processed.replace(/^\|\s*/gm, '').replace(/\s*\|$/gm, '');

    return processed.trim();
}