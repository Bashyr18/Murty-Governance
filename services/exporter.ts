
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Exporter = {
    /**
     * Captures a DOM element, handling scrollable content by cloning and expanding it.
     */
    async capture(elementId: string, options: { scale?: number, padding?: number } = {}) {
        const originalElement = document.getElementById(elementId);
        if (!originalElement) {
            console.error(`Export error: Element #${elementId} not found`);
            return null;
        }

        // 1. Create a container for the clone that is IN THE VIEWPORT but hidden behind everything
        // Browsers optimize out elements that are too far off-screen (like top: -10000px), causing blank canvases.
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '-9999'; // Hidden behind app
        container.style.opacity = '1'; // Must be visible to renderer
        container.style.pointerEvents = 'none';
        container.style.background = '#ffffff'; // Force white background context
        
        // Match dimensions strictly to prevent collapse
        const rect = originalElement.getBoundingClientRect();
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;
        
        document.body.appendChild(container);

        // 2. Deep clone the element
        const clonedElement = originalElement.cloneNode(true) as HTMLElement;
        
        // 3. Force expansion of scrollable areas in the clone
        // We set specific styles to ensure it renders exactly as seen or expanded
        clonedElement.style.height = 'auto';
        clonedElement.style.minHeight = `${rect.height}px`;
        clonedElement.style.width = '100%';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.margin = '0';
        
        // Explicit background to prevent transparent/black PNGs
        const computedStyle = window.getComputedStyle(originalElement);
        if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyle.backgroundColor === 'transparent') {
             // Fallback to theme background if transparent
             clonedElement.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--bg');
        }

        // Handle Recharts/SVG specific sizing issues
        // SVGs inside flex containers often collapse in clones if they don't have explicit sizes
        const svgs = clonedElement.querySelectorAll('svg');
        svgs.forEach(svg => {
            const parent = svg.parentElement;
            if (parent) {
                svg.setAttribute('width', `${parent.offsetWidth}`);
                svg.setAttribute('height', `${parent.offsetHeight}`);
            }
        });

        // Handle scrollables
        const scrollables = clonedElement.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-x-auto, .custom-scrollbar');
        scrollables.forEach((el: any) => {
            el.style.height = 'auto';
            el.style.overflow = 'visible';
            el.style.maxHeight = 'none';
        });

        // Remove elements marked as no-export
        const toRemove = clonedElement.querySelectorAll('.no-export');
        toRemove.forEach(el => el.remove());

        // Add padding if requested (for clean chart exports)
        if (options.padding) {
            clonedElement.style.padding = `${options.padding}px`;
            clonedElement.style.boxSizing = 'border-box';
        }

        container.appendChild(clonedElement);

        // 4. Wait for styles/fonts/images to settle
        await document.fonts.ready;
        // Short delay to allow DOM paint
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // 5. Capture the CLONED element
            const canvas = await html2canvas(clonedElement, {
                scale: options.scale || 2, // High DPI
                useCORS: true,
                logging: false,
                backgroundColor: null, // Allow transparency (we handled bg on element)
                width: clonedElement.offsetWidth,
                height: clonedElement.offsetHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight
            });

            // Clean up
            document.body.removeChild(container);
            return canvas;

        } catch (err) {
            console.error('Export capture failed:', err);
            if(document.body.contains(container)) document.body.removeChild(container);
            return null;
        }
    },

    async exportToPdf(elementId: string, fileName: string = 'export.pdf') {
        try {
            // Lower scale for full page PDF to avoid massive file size/crash
            const canvas = await this.capture(elementId, { scale: 1.5 }); 
            if (!canvas) return false;

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Landscape orientation by default
            // Create PDF with custom page size matching the content perfectly
            const pdf = new jsPDF({ 
                orientation: 'landscape', 
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

    async exportToPng(elementId: string, fileName: string = 'export.png') {
        try {
            const canvas = await this.capture(elementId, { scale: 3, padding: 40 }); 
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
            // Extract headers
            const headers = Object.keys(data[0]);
            
            // Map rows
            const csvRows = data.map(row => 
                headers.map(fieldName => {
                    const val = row[fieldName];
                    const stringVal = val === null || val === undefined ? '' : String(val);
                    // Escape quotes and wrap in quotes if contains comma
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }).join(',')
            );
            
            // Combine
            const csvContent = [headers.join(','), ...csvRows].join('\n');
            
            // Download
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
