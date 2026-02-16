// src/pipelines/text/stages/reconstruct.js
/**
 * Text Reconstruction Stage
 * Fixes broken lines and structure issues typical of OCR.
 */
export function reconstructText(text, options = {}) {
    if (!text) return text;
    let result = text;

    // 1. Line Merge
    // Merges lines that were incorrectly broken by OCR (e.g. column limits).
    if (options.mergeLines !== false) {
        // Basic strategy: Replace single newlines with space, keep double newlines (paragraphs)
        // Split by double newline to preserve paragraphs
        const paragraphs = result.split(/\n\s*\n/);
        
        const mergedParagraphs = paragraphs.map(p => {
             // Replace single newlines within paragraph with space
             // Check if newline is followed by lower case (likely sentence continuation)
             // or just standard wrap.
             return p.replace(/\n/g, ' ');
        });

        result = mergedParagraphs.join('\n\n');
    }

    // 2. Sentence Stabilization
    // Fixes broken sentences and spacing around them.
    if (options.stabilizeSentences !== false) {
        // Ensure proper capitalizing of new sentences (simplified)
        // Fix: "word.Next" -> "word. Next" (Covered in Normalize)
        // Fix: "- broken word" (hyphenation at line end is usually handled by line merge before)
        
        // Remove hyphenation artifacts that might remain: "pre-\nfix" -> "prefix"
        // If mergeLines already ran, they are "pre- fix".
        result = result.replace(/(\w+)-\s+(\w+)/g, '$1$2');
    }

    return result;
}
