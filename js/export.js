/**
 * ExportTool — screenshot/PNG export of the current map view
 *
 * Uses html2canvas to capture the viewport, adds a watermark,
 * and downloads the image as a PNG file.
 */
const ExportTool = {
    init() {
        document.getElementById('export-btn').addEventListener('click', () => this.capture());
    },

    async capture() {
        const btn = document.getElementById('export-btn');
        btn.disabled = true;

        // Flash effect to indicate capture
        const flash = document.createElement('div');
        flash.id = 'capture-flash';
        document.body.appendChild(flash);

        try {
            const canvas = await html2canvas(document.body, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                logging: false
            });

            // Add watermark
            const ctx = canvas.getContext('2d');
            const date = new Date().toISOString().split('T')[0];
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.textAlign = 'right';
            ctx.fillText(
                'Gezira Irrigation Scheme \u2014 Problem Report \u00B7 ' + date,
                canvas.width - 40,
                canvas.height - 40
            );

            // Download as PNG
            const link = document.createElement('a');
            link.download = 'gezira-report-' + date + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setTimeout(() => {
                flash.remove();
                btn.disabled = false;
            }, 400);
        }
    }
};
