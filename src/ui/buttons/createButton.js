/**
 * Button Factory
 * Creates standardized buttons with consistent styling
 */

export function createButton(text, width = '110px', height = '32px', onClick = null) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.width = width;
  button.style.height = height;
  button.style.padding = '4px 8px';
  button.style.backgroundColor = '#374151';
  button.style.color = '#f9fafb';
  button.style.border = '1px solid #4b5563';
  button.style.borderRadius = '6px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.style.fontWeight = '600';
  button.style.fontFamily = 'Inter, sans-serif';
  button.style.transition = 'all 0.2s ease';
  button.style.whiteSpace = 'nowrap';
  button.style.overflow = 'hidden';
  button.style.textOverflow = 'ellipsis';

  // remember original background so hover can revert correctly
  button.dataset.origBg = button.style.backgroundColor;

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#4b5563';
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = button.dataset.origBg || button.style.backgroundColor;
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  });

  // Click animation
  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(1px) scale(0.98)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-1px)';
  });

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

export function createPrimaryButton(text, width = '110px', height = '32px', onClick = null) {
  const button = createButton(text, width, height, onClick);
  button.style.backgroundColor = '#4f46e5';
  button.style.border = 'none';
  button.style.color = '#ffffff';
  // update orig background so hover revert matches primary color
  button.dataset.origBg = button.style.backgroundColor;
  return button;
}

export function createIconButton(icon, width = '32px', height = '32px', onClick = null) {
  const button = document.createElement('button');
  button.textContent = icon;
  button.style.width = width;
  button.style.height = height;
  button.style.padding = '4px';
  button.style.backgroundColor = '#374151';
  button.style.color = '#9ca3af';
  button.style.border = '1px solid #4b5563';
  button.style.borderRadius = '6px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '16px';
  button.style.fontFamily = 'Inter, sans-serif';
  button.style.transition = 'all 0.2s ease';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';

  // Hover effects for icon button
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#4b5563';
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#374151';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  });

  // Click animation for icon button
  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(1px) scale(0.98)';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-1px)';
  });

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}
