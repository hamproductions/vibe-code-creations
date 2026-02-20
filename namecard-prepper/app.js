import { PDFDocument, rgb, degrees } from 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm';

const fileInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const statusText = document.getElementById('statusText');
const rotateBacksCheckbox = document.getElementById('rotateBacks');
const fakeBleedCheckbox = document.getElementById('fakeBleed');

let selectedFile = null;

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        processBtn.disabled = false;
        statusText.textContent = "Ready to process.";
        statusText.className = "text-sm text-gray-400 mt-2";
    } else {
        processBtn.disabled = true;
        selectedFile = null;
    }
});

processBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    processBtn.disabled = true;
    processBtn.textContent = "Processing High-Res PDF...";
    statusText.textContent = "Loading and manipulating PDF, preserving original quality...";

    try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const pdfDoc = await PDFDocument.create();

        const pageCount = srcDoc.getPageCount();
        if (pageCount !== 2 && pageCount < 4) {
            throw new Error(`Expected 2 or at least 4 pages, but found ${pageCount}.`);
        }

        const MM_TO_PT = 72 / 25.4;
        const PAGE_W = 100 * MM_TO_PT;
        const PAGE_H = 148 * MM_TO_PT;
        const CARD_W = 91 * MM_TO_PT;
        const CARD_H = 55 * MM_TO_PT;

        const xOffset = (PAGE_W - CARD_W) / 2;

        // Front margins
        const topMarginMM = 31; // Changed from 28mm to 31mm
        const bottomMarginMM = 148 - topMarginMM - (55 * 2); // 7mm

        // Front Page Y Coordinates
        const yOffsetTop = (148 - topMarginMM - 55) * MM_TO_PT; // 62mm from bottom
        const yOffsetBottom = yOffsetTop - CARD_H; // 7mm from bottom

        // Back Page Y Coordinates for 7-Eleven Top-to-Bottom physical flip
        const yOffsetBack1 = topMarginMM * MM_TO_PT; // 31mm from bottom
        const yOffsetBack2 = (148 - bottomMarginMM - 55) * MM_TO_PT; // 86mm from bottom

        // Duplicate pages if it's a 2-page PDF
        const pagesToEmbed = await pdfDoc.embedPdf(srcDoc,
            pageCount === 2 ? [0, 1, 0, 1] : [0, 1, 2, 3]
        );

        const [f1, b1, f2, b2] = pagesToEmbed;
        const rotateBacks = rotateBacksCheckbox.checked;
        const applyBleed = fakeBleedCheckbox.checked;

        const frontPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
        const backPage = pdfDoc.addPage([PAGE_W, PAGE_H]);

        const drawCard = (page, embeddedPage, baseX, baseY, rotate180 = false) => {
            const rotation = rotate180 ? degrees(180) : degrees(0);

            if (applyBleed) {
                const b = 3 * MM_TO_PT; // 3mm bleed on all sides
                const offsets = [-b, 0, b];

                // Draw 8 shifted background copies to fake the extended color border
                for (const dx of offsets) {
                    for (const dy of offsets) {
                        if (dx === 0 && dy === 0) continue;
                        page.drawPage(embeddedPage, {
                            x: baseX + dx,
                            y: baseY + dy,
                            width: CARD_W,
                            height: CARD_H,
                            rotate: rotation
                        });
                    }
                }
            }

            // Draw the main foreground card exactly on the trim line
            page.drawPage(embeddedPage, {
                x: baseX,
                y: baseY,
                width: CARD_W,
                height: CARD_H,
                rotate: rotation
            });
        };

        const drawCropMarks = (page, x, y, w, h) => {
            const strokeColor = rgb(0, 0, 0);
            const thickness = 0.5;
            const markLen = 3 * MM_TO_PT;
            // Offset pushed to 4mm so it doesn't print on top of the 3mm generated bleed
            const offset = 4 * MM_TO_PT;

            const drawLine = (x1, y1, x2, y2) => {
                page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: strokeColor });
            };

            // Bottom Left & Right
            drawLine(x - offset, y, x - offset - markLen, y);
            drawLine(x, y - offset, x, y - offset - markLen);
            drawLine(x + w + offset, y, x + w + offset + markLen, y);
            drawLine(x + w, y - offset, x + w, y - offset - markLen);

            // Top Left & Right
            drawLine(x - offset, y + h, x - offset - markLen, y + h);
            drawLine(x, y + h + offset, x, y + h + offset + markLen);
            drawLine(x + w + offset, y + h, x + w + offset + markLen, y + h);
            drawLine(x + w, y + h + offset, x + w, y + h + offset + markLen);
        };

        // Front Page Placements
        drawCard(frontPage, f1, xOffset, yOffsetTop);
        drawCard(frontPage, f2, xOffset, yOffsetBottom);
        drawCropMarks(frontPage, xOffset, yOffsetTop, CARD_W, CARD_H);
        drawCropMarks(frontPage, xOffset, yOffsetBottom, CARD_W, CARD_H);

        // Back Page Placements
        if (rotateBacks) {
            drawCard(backPage, b1, xOffset + CARD_W, yOffsetBack1 + CARD_H, true);
            drawCard(backPage, b2, xOffset + CARD_W, yOffsetBack2 + CARD_H, true);
            drawCropMarks(backPage, xOffset, yOffsetBack1, CARD_W, CARD_H);
            drawCropMarks(backPage, xOffset, yOffsetBack2, CARD_W, CARD_H);
        } else {
            drawCard(backPage, b1, xOffset, yOffsetTop);
            drawCard(backPage, b2, xOffset, yOffsetBottom);
            drawCropMarks(backPage, xOffset, yOffsetTop, CARD_W, CARD_H);
            drawCropMarks(backPage, xOffset, yOffsetBottom, CARD_W, CARD_H);
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '100x148_Duplex_Namecards_With_Bleed.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusText.textContent = "Processing complete. File downloaded.";
        statusText.className = "text-sm text-green-400 mt-2";
    } catch (error) {
        console.error(error);
        statusText.textContent = `Error: ${error.message}`;
        statusText.className = "text-sm text-red-400 mt-2";
    } finally {
        processBtn.disabled = false;
        processBtn.textContent = "Process & Download PDF";
    }
});
