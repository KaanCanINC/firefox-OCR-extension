import { getSafeImageData } from '../../../utils/imageUtils.js';

/**
 * White Region Extraction Stage
 * Isolates the largest white region (Speech Bubble) and removes outer noise.
 * Preserves text inside the bubble by filling holes.
 * @param {ImageData|HTMLCanvasElement} input Input image
 */
export function extractLargestWhiteRegion(inputObj) {
    let width, height, input;

    if (inputObj instanceof HTMLCanvasElement || (inputObj && inputObj.tagName === 'CANVAS')) {
        width = inputObj.width;
        height = inputObj.height;
        const temp = inputObj.getContext('2d').getImageData(0, 0, width, height);
        // Create local copy to avoid Xray limitations
        input = getSafeImageData(temp).data;
    } else if (inputObj instanceof ImageData || (inputObj && inputObj.data && inputObj.width && inputObj.height)) {
        width = inputObj.width;
        height = inputObj.height;
        // Create local copy
        if (!(inputObj instanceof ImageData)) {
             input = new Uint8ClampedArray(inputObj.data);
        } else {
             input = getSafeImageData(inputObj).data;
        }
    } else {
        throw new Error("Invalid input type for region stage");
    }

    const output = new Uint8ClampedArray(input.length);
    output.fill(255); // Default to White (erased)

    const visited = new Uint8Array(width * height); // 0 = unvisited, 1 = visited
    const components = [];

    // Helper: Get pixel index
    const idx = (x, y) => y * width + x;

    // 1. Find White Components
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = idx(x, y);
            if (visited[i]) continue;

            const isWhite = input[i * 4] > 128; // Threshold 128
            if (!isWhite) {
                visited[i] = 1; // Mark black pixels as visited (ignored for now)
                continue;
            }

            // Start BFS for White Component
            const component = [];
            const queue = [i];
            visited[i] = 1;
            component.push(i);

            let head = 0;
            while (head < queue.length) {
                const curr = queue[head++];
                const cx = curr % width;
                const cy = Math.floor(curr / width);

                // 4-connectivity
                const neighbors = [
                    { x: cx + 1, y: cy },
                    { x: cx - 1, y: cy },
                    { x: cx, y: cy + 1 },
                    { x: cx, y: cy - 1 }
                ];

                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                        const ni = idx(n.x, n.y);
                        if (!visited[ni]) {
                            const nIsWhite = input[ni * 4] > 128;
                            if (nIsWhite) {
                                visited[ni] = 1;
                                queue.push(ni);
                                component.push(ni);
                            }
                        }
                    }
                }
            }
            components.push(component);
        }
    }

    if (components.length === 0) return inputObj; // Return original if fails

    // 2. Find Largest White Component
    components.sort((a, b) => b.length - a.length);
    const largest = components[0];

    // 3. Create Mask from Largest Component
    const mask = new Uint8Array(width * height); // 1 = inside bubble
    for (const p of largest) {
        mask[p] = 1;
    }

    // 4. Fill Holes (Recover Text)
    // Find Connected Components of "Non-Mask" (Black/Background) pixels
    // If a component touches the border, it's outside. If it doesn't, it's inside (text).

    const visitedHoles = new Uint8Array(width * height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = idx(x, y);
            if (mask[i] === 1 || visitedHoles[i]) continue;

            // Start BFS for Black Component
            const holeComp = [];
            const queue = [i];
            visitedHoles[i] = 1;
            holeComp.push(i);
            
            let touchesBorder = false;
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) touchesBorder = true;

            let head = 0;
            while (head < queue.length) {
                const curr = queue[head++];
                const cx = curr % width;
                const cy = Math.floor(curr / width);

                const neighbors = [
                    { x: cx + 1, y: cy },
                    { x: cx - 1, y: cy },
                    { x: cx, y: cy + 1 },
                    { x: cx, y: cy - 1 }
                ];

                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                        const ni = idx(n.x, n.y);
                        if (!visitedHoles[ni] && mask[ni] === 0) { // Should be 0 (Black/Non-Mask)
                            visitedHoles[ni] = 1;
                            queue.push(ni);
                            holeComp.push(ni);
                            if (n.x === 0 || n.x === width - 1 || n.y === 0 || n.y === height - 1) {
                                touchesBorder = true;
                            }
                        }
                    }
                }
            }

            // If it doesn't touch border, it's internal text -> Add to Mask
            if (!touchesBorder) {
                for (const p of holeComp) {
                    mask[p] = 1;
                }
            }
        }
    }

    // 5. Apply Mask
    for (let i = 0; i < width * height; i++) {
        if (mask[i] === 1) {
            output[i * 4] = input[i * 4];
            output[i * 4 + 1] = input[i * 4 + 1];
            output[i * 4 + 2] = input[i * 4 + 2];
            output[i * 4 + 3] = 255;
        } else {
            // Mask 0 -> Outside -> Set to White
            output[i * 4] = 255;
            output[i * 4 + 1] = 255;
            output[i * 4 + 2] = 255;
            output[i * 4 + 3] = 255;
        }
    }

    return new ImageData(output, width, height);
}