/**
 * ASCII 3D Game Engine - Display & Canvas Presenter
 * Renders the ASCII frame buffer onto HTML5 Canvas or raw text pre element.
 */

export class AsciiDisplay {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });

        this.fontSize = options.fontSize || 13;
        this.fontFamily = options.fontFamily || '"Courier New", Courier, monospace';
        this.charWidth = 0;
        this.charHeight = 0;

        this.theme = options.theme || "fullcolor"; // "fullcolor", "matrix", "amber", "monochrome", "cyberpunk"

        this.initFontMetrics();
    }

    initFontMetrics() {
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        // Measure monospace character dimensions
        const metrics = this.ctx.measureText('M');
        this.charWidth = metrics.width;
        this.charHeight = Math.round(this.fontSize * 1.15);
    }

    resizeToBuffer(bufferWidth, bufferHeight) {
        this.canvas.width = Math.ceil(bufferWidth * this.charWidth);
        this.canvas.height = Math.ceil(bufferHeight * this.charHeight);
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        this.ctx.textBaseline = 'top';
    }

    render(buffer) {
        const { width, height, chars, colors } = buffer;
        const cw = this.charWidth;
        const ch = this.charHeight;
        const ctx = this.ctx;

        // Clear canvas background
        ctx.fillStyle = '#0a0d12';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        ctx.textBaseline = 'top';

        for (let y = 0; y < height; y++) {
            const rowOffset = y * width;
            const posY = y * ch;

            for (let x = 0; x < width; x++) {
                const idx = rowOffset + x;
                const char = chars[idx];

                if (!char || char === ' ') continue;

                const cIdx = idx * 3;
                let r = colors[cIdx];
                let g = colors[cIdx + 1];
                let b = colors[cIdx + 2];

                // Apply Color Themes
                if (this.theme === "matrix") {
                    // Phosphor green terminal
                    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                    r = Math.floor(lum * 40);
                    g = Math.floor(lum * 255);
                    b = Math.floor(lum * 70);
                } else if (this.theme === "amber") {
                    // Retro amber phosphor
                    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                    r = Math.floor(lum * 255);
                    g = Math.floor(lum * 170);
                    b = Math.floor(lum * 20);
                } else if (this.theme === "monochrome") {
                    const lum = Math.floor(r * 0.299 + g * 0.587 + b * 0.114);
                    r = g = b = lum;
                } else if (this.theme === "cyberpunk") {
                    // Cyan / Magenta vibe
                    r = Math.floor(r * 0.9 + 50);
                    g = Math.floor(g * 0.3);
                    b = Math.floor(b * 1.1 + 40);
                }

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillText(char, x * cw, posY);
            }
        }
    }

    getPlainText(buffer) {
        let text = '';
        for (let y = 0; y < buffer.height; y++) {
            const rowStart = y * buffer.width;
            for (let x = 0; x < buffer.width; x++) {
                text += buffer.chars[rowStart + x] || ' ';
            }
            text += '\n';
        }
        return text;
    }
}
