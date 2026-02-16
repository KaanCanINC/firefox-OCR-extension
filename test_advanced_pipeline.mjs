import { processText } from './src/pipelines/text/pipeline.js';
import { dictionaryManager } from './src/utils/dictionary.js';

// Initialize Dictionary
await dictionaryManager.load();

const tests = [
    {
        name: "Noise Aggression: Low",
        input: "Hello World --- $100",
        expected: "Hello World $100", // Keeps currency and dashes?
        options: { noiseCleaning: true, noiseAggression: 'low' }
    },
    {
        name: "Noise Aggression: High",
        input: "Hello World | ~ $100",
        expected: "Hello World", // Removes symbols including currency
        options: { noiseCleaning: true, noiseAggression: 'high' }
    },
    {
        name: "Dictionary: Typo Fix",
        input: "Helle World",
        expected: "Hello World", // Helle -> Hello (dist 1)
        options: { dictionaryCorrection: true, dictionaryStrength: 1 }
    },
    {
        name: "Dictionary: Ignore Caps",
        input: "HELLE WORLD",
        expected: "HELLE WORLD", // Should assume acronym or name
        options: { dictionaryCorrection: true, dictionaryIgnoreCaps: true }
    },
    {
        name: "User Rule: Context Deletion",
        input: "self-destruct 3.14 word's",
        expected: "self-destruct 3.14 word's", // Should NOT delete - . '
        options: { 
            userRules: true, 
            deletions: [
                { char: '-', ignoreBetweenLetters: true },
                { char: '.', ignoreBetweenNumbers: true },
                { char: "'", ignoreInsideWords: true }
            ] 
        }
    },
    {
        name: "User Rule: Context Deletion (Negative)",
        input: "- self . 3 ' ",
        expected: " self  3  ", // Should delete isolated chars
        options: { 
            noiseCleaning: false, // Disable noise to test user rule impact solely on chars
            userRules: true, 
             deletions: [
                { char: '-', ignoreBetweenLetters: true },
                { char: '.', ignoreBetweenNumbers: true },
                { char: "'", ignoreInsideWords: true }
            ] 
        }
    }
];

async function run() {
    console.log("Running Advanced Pipeline Tests...");
    let passed = 0;
    for (const t of tests) {
        try {
            const out = processText(t.input, t.options);
            console.log(`[${t.name}]`);
            console.log(`In : "${t.input}"`);
            console.log(`Out: "${out}"`);
            
            if (out.trim() === t.expected.trim()) {
                console.log("PASS ✅");
                passed++;
            } else {
                console.log(`FAIL ❌ (Exp: "${t.expected}")`);
            }
            console.log("---");
        } catch (e) {
            console.error(e);
        }
    }
    console.log(`Passed ${passed}/${tests.length}`);
}

run();
