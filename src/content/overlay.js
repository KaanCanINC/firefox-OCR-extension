/**
 * Overlay Module
 * Handles creating and managing the selection overlay (Canvas based)
 */

let overlayCanvas = null;
let ctx = null;

export function createOverlay() {
  removeOverlay();

  overlayCanvas = document.createElement('canvas');
  overlayCanvas.style.position = 'fixed';
  overlayCanvas.style.top = '0';
  overlayCanvas.style.left = '0';
  overlayCanvas.style.width = '100vw'; // Use vw/vh to cover viewport
  overlayCanvas.style.height = '100vh';
  overlayCanvas.style.zIndex = '999998'; // High z-index
  overlayCanvas.style.cursor = 'crosshair';
  
  // Interaction blocking: This canvas covers everything, so clicks go here.
  // We handle selection logic on this canvas.
  
  document.body.appendChild(overlayCanvas);
  
  // Set resolution
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;

  ctx = overlayCanvas.getContext('2d');
  drawOverlay(); // Initial draw (full dim)
  
  return overlayCanvas;
}

export function updateOverlay(currentSelection, pastSelections = []) {
  if (!ctx || !overlayCanvas) return;
  
  // Clear and fill with dim color
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // Darker dim for better contrast
  ctx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  
  // Cut out holes for past selections
  pastSelections.forEach(sel => {
    ctx.clearRect(sel.x, sel.y, sel.width, sel.height);
    // Draw border for visibility
    ctx.strokeStyle = '#3b82f6'; // Blue for stored
    ctx.lineWidth = 2;
    ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);
  });
  
  // Cut out hole for current selection
  if (currentSelection) {
    const { x, y, width, height } = currentSelection;
    ctx.clearRect(x, y, width, height);
    // Draw border
    ctx.strokeStyle = '#ef4444'; // Red for active
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Optional: draw dashed line or guide
  }
}

function drawOverlay() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

export function removeOverlay() {
  if (overlayCanvas && document.body.contains(overlayCanvas)) {
    document.body.removeChild(overlayCanvas);
  }
  overlayCanvas = null;
  ctx = null;
}