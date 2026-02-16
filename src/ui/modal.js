// src/ui/modal.js
/**
 * Simple Modal Component for Custom Confirmations & Previews
 */

export function createModal(title, content, actions = []) {
    // Remove existing
    const existing = document.getElementById('ocr-modal-overlay');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ocr-modal-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.2s ease', backdropFilter: 'blur(2px)'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#1f2937', color: '#f9fafb',
        padding: '24px', borderRadius: '12px',
        maxWidth: '500px', width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #374151', transform: 'scale(0.95)', transition: 'transform 0.2s ease',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column'
    });

    // Header
    const header = document.createElement('h2');
    header.textContent = title;
    Object.assign(header.style, { margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' });
    modal.appendChild(header);

    // Content
    const body = document.createElement('div');
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else {
        body.appendChild(content);
    }
    Object.assign(body.style, { marginBottom: '24px', overflowY: 'auto' });
    modal.appendChild(body);

    // Actions
    const actionRow = document.createElement('div');
    Object.assign(actionRow.style, { display: 'flex', justifyContent: 'flex-end', gap: '12px' });

    actions.forEach(act => {
        const btn = document.createElement('button');
        btn.textContent = act.text;
        
        let bg = '#374151', text = 'white', border = '1px solid #4b5563';
        if (act.variant === 'primary') { bg = '#4f46e5'; border = 'none'; }
        if (act.variant === 'danger') { bg = '#ef4444'; border = 'none'; }
        
        Object.assign(btn.style, {
            padding: '8px 16px', borderRadius: '6px', background: bg, 
            color: text, border: border, cursor: 'pointer', fontWeight: '500'
        });
        
        btn.onclick = async () => {
            if (act.onClick) await act.onClick();
            if (act.close !== false) close();
        };
        actionRow.appendChild(btn);
    });

    // Standard Cancel if no actions or explicit
    if (actions.length === 0) {
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        Object.assign(closeBtn.style, { padding: '8px 16px', borderRadius: '6px', background: '#374151', color: 'white', border: '1px solid #4b5563', cursor: 'pointer' });
        closeBtn.onclick = close;
        actionRow.appendChild(closeBtn);
    }

    modal.appendChild(actionRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });

    function close() {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => overlay.remove(), 200);
    }
}
