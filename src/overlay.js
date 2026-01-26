/**
 * Overlay Module
 * Handles creating and managing the selection overlay
 */

let topOverlay, bottomOverlay, leftOverlay, rightOverlay;

export function createOverlay() {
  // Remove existing overlays
  removeOverlay();

  // Create four overlay divs, initially covering the whole screen
  topOverlay = document.createElement('div');
  topOverlay.style.position = 'fixed';
  topOverlay.style.top = '0';
  topOverlay.style.left = '0';
  topOverlay.style.width = '100%';
  topOverlay.style.height = window.innerHeight + 'px';
  topOverlay.style.backgroundColor = 'rgba(213, 224, 58, 0.5)';
  topOverlay.style.zIndex = '999998';
  document.body.appendChild(topOverlay);

  bottomOverlay = document.createElement('div');
  bottomOverlay.style.position = 'fixed';
  bottomOverlay.style.bottom = '0';
  bottomOverlay.style.left = '0';
  bottomOverlay.style.width = '100%';
  bottomOverlay.style.height = '0';
  bottomOverlay.style.backgroundColor = 'rgba(213, 224, 58, 0.5)';
  bottomOverlay.style.zIndex = '999998';
  document.body.appendChild(bottomOverlay);

  leftOverlay = document.createElement('div');
  leftOverlay.style.position = 'fixed';
  leftOverlay.style.top = '0';
  leftOverlay.style.left = '0';
  leftOverlay.style.width = window.innerWidth + 'px';
  leftOverlay.style.height = window.innerHeight + 'px';
  leftOverlay.style.backgroundColor = 'rgba(213, 224, 58, 0.5)';
  leftOverlay.style.zIndex = '999998';
  document.body.appendChild(leftOverlay);

  rightOverlay = document.createElement('div');
  rightOverlay.style.position = 'fixed';
  rightOverlay.style.top = '0';
  rightOverlay.style.right = '0';
  rightOverlay.style.width = '0';
  rightOverlay.style.height = window.innerHeight + 'px';
  rightOverlay.style.backgroundColor = 'rgba(213, 224, 58, 0.5)';
  rightOverlay.style.zIndex = '999998';
  document.body.appendChild(rightOverlay);
}

export function updateOverlay(startX, startY, endX, endY) {
  if (!topOverlay || startX === undefined) return;
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);

  topOverlay.style.height = top + 'px';
  bottomOverlay.style.height = (window.innerHeight - top - height) + 'px';
  leftOverlay.style.width = left + 'px';
  leftOverlay.style.top = top + 'px';
  leftOverlay.style.height = height + 'px';
  rightOverlay.style.width = (window.innerWidth - left - width) + 'px';
  rightOverlay.style.top = top + 'px';
  rightOverlay.style.height = height + 'px';
}

export function removeOverlay() {
  try {
    if (topOverlay && document.body.contains(topOverlay)) document.body.removeChild(topOverlay);
  } catch (e) {}
  try {
    if (bottomOverlay && document.body.contains(bottomOverlay)) document.body.removeChild(bottomOverlay);
  } catch (e) {}
  try {
    if (leftOverlay && document.body.contains(leftOverlay)) document.body.removeChild(leftOverlay);
  } catch (e) {}
  try {
    if (rightOverlay && document.body.contains(rightOverlay)) document.body.removeChild(rightOverlay);
  } catch (e) {}
  topOverlay = bottomOverlay = leftOverlay = rightOverlay = null;
}
