
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Exporter = {
    async capture(elementId: string, options: { scale?: number } = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Export error: Element #${elementId} not found`);
            return null;
        }

        // Capture dimensions directly from the element's current state
        const width = element.scrollWidth;
        const height = element.scrollHeight;
        
        // Capture the viewport dimensions to ensure media queries resolve correctly (Desktop vs Mobile)
        // If we use 'width' (element width) as windowWidth, a small card will trigger mobile styles.
        const viewportWidth = window.innerWidth; 
        const viewportHeight = window.innerHeight;

        // Detect current theme background to ensure no transparent artifacts
        const bodyStyle = window.getComputedStyle(document.body);
        const bgColor = bodyStyle.backgroundColor || '#ffffff';

        // Create a clone container off-screen
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = `${width}px`;
        document.body.appendChild(container);

        // Deep clone the element
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;
        clone.style.transform = 'none';
        clone.style.margin = '0';
        clone.style.backgroundColor = bgColor; // Force opaque background
        
        // Remove UI elements marked as no-export
        const toRemove = clone.querySelectorAll('.no-export');
        toRemove.forEach(el => el.remove());

        // Flatten glassmorphism for cleaner export (optional but recommended for canvas consistency)
        const glassElements = clone.querySelectorAll('.backdrop-blur-md, .backdrop-blur-xl');
        glassElements.forEach((el: any) => {
            el.style.backdropFilter = 'none';
            el.style.background = getComputedStyle(el).backgroundColor; // Fallback to computed color
        });

        container.appendChild(clone);

        // Small delay to allow layout/fonts to settle in the clone
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(clone, {
                scale: options.scale || 2,
                useCORS: true,
                logging: false,
                width: width, // The dimension of the output canvas
                height: height,
                windowWidth: viewportWidth, // CRITICAL: Ensure media queries resolve against the full viewport, not the element width
                windowHeight: viewportHeight,
                backgroundColor: bgColor // Explicitly set background color
            });
            document.body.removeChild(container);
            return canvas;
        } catch (e) {
            console.error("Export capture failed", e);
            if (document.body.contains(container)) document.body.removeChild(container);
            return null;
        }
    },

    async exportToPdf(elementId: string, fileName: string = 'report.pdf') {
        try {
            const canvas = await this.capture(elementId, { scale: 2 });
            if (!canvas) return false;

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Create PDF matching the image dimensions exactly (Single Page / Long Scroll)
            // This prevents "stretching" to fit A4 paper
            const pdf = new jsPDF({
                orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [imgWidth, imgHeight]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            pdf.save(fileName);
            return true;
        } catch (error) {
            console.error("PDF Export failed:", error);
            return false;
        }
    },

    async exportToPng(elementId: string, fileName: string = 'chart.png') {
        try {
            const canvas = await this.capture(elementId, { scale: 3 });
            if (!canvas) return false;
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
            return true;
        } catch (error) {
            console.error("PNG Export failed:", error);
            return false;
        }
    },

    exportToCsv(data: any[], fileName: string) {
        if (!data || !data.length) return false;
        try {
            const headers = Object.keys(data[0]);
            const csvRows = data.map(row => 
                headers.map(fieldName => {
                    const val = row[fieldName];
                    const stringVal = val === null || val === undefined ? '' : String(val);
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }).join(',')
            );
            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error("CSV Export failed:", error);
            return false;
        }
    }
};
