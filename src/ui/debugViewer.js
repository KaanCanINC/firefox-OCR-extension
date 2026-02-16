/**
 * Debug Viewer Module
 * Injects a debug panel into the DOM to show preprocessing steps.
 */

export const debugViewer = {
    container: null,

    show() {
        if (!this.container) {
            this.create();
        }
        this.container.style.display = 'block';
    },

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    },

    clear() {
        if (this.container) {
            const list = this.container.querySelector('.debug-list');
            if (list) list.innerHTML = '';
        }
    },

    create() {
        const div = document.createElement('div');
        div.id = 'ocr-debug-viewer';
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            max-height: 80vh;
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid #444;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            z-index: 1000000;
            display: flex;
            flex-direction: column;
            color: #eee;
            font-family: sans-serif;
            overflow: hidden;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px;
            background: #252526;
            border-bottom: 1px solid #444;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `<strong>Preprocessing Debug</strong>`;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #aaa;
            font-size: 18px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);
        div.appendChild(header);

        // Content List
        const list = document.createElement('div');
        list.className = 'debug-list';
        list.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        `;
        div.appendChild(list);

        document.body.appendChild(div);
        this.container = div;
    },

    addStep(name, image) {
        if (!this.container) return;
        const list = this.container.querySelector('.debug-list');
        
        const item = document.createElement('div');
        item.style.marginBottom = '15px';
        
        const label = document.createElement('div');
        label.textContent = name;
        label.style.fontSize = '12px';
        label.style.marginBottom = '5px';
        label.style.color = '#ccc';
        item.appendChild(label);

        let canvas;
        if (image instanceof HTMLCanvasElement) {
            canvas = image;
            // Create a copy to avoid reference issues if processed further
            const copy = document.createElement('canvas');
            copy.width = canvas.width;
            copy.height = canvas.height;
            copy.getContext('2d').drawImage(canvas, 0, 0);
            canvas = copy;
        } else if (image instanceof ImageData) {
            canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            try {
                canvas.getContext('2d').putImageData(image, 0, 0);
            } catch (e) {
                // Fallback for debug viewer
                const ctx = canvas.getContext('2d');
                const newImg = ctx.createImageData(image.width, image.height);
                newImg.data.set(new Uint8ClampedArray(image.data));
                ctx.putImageData(newImg, 0, 0);
            }
        }

        if (canvas) {
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            canvas.style.border = '1px solid #555';
            item.appendChild(canvas);
        }

        list.appendChild(item);
        // Scroll to bottom
        list.scrollTop = list.scrollHeight;
    }
};
