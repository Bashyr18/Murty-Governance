
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Exporter = {
    /**
     * Captures a DOM element, handling scrollable content by cloning and expanding it.
     * Special handling for SVGs to ensure they render correctly (Recharts).
     */
    async capture(elementId: string, options: { scale?: number, padding?: number, minWidth?: number } = {}) {
        const originalElement = document.getElementById(elementId);
        if (!originalElement) {
            console.error(`Export error: Element #${elementId} not found`);
            return null;
        }

        // 1. Get accurate dimensions from the original
        const rect = originalElement.getBoundingClientRect();
        const width = originalElement.scrollWidth || rect.width;
        const height = originalElement.scrollHeight || rect.height;

        // 2. Create a container for the clone hidden from view
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-10000px';
        container.style.left = '-10000px';
        container.style.zIndex = '-1000';
        // Force the container to be large enough
        container.style.width = `${width + (options.padding || 0) * 2}px`;
        container.style.height = `${height + (options.padding || 0) * 2}px`;
        
        document.body.appendChild(container);

        // 3. Deep clone
        const clonedElement = originalElement.cloneNode(true) as HTMLElement;
        
        // 4. CRITICAL FIX: Explicitly size SVGs in the clone based on original computed layout
        const originalSvgs = originalElement.querySelectorAll('svg');
        const clonedSvgs = clonedElement.querySelectorAll('svg');

        originalSvgs.forEach((orig, index) => {
            const clone = clonedSvgs[index];
            if (clone) {
                const origRect = orig.getBoundingClientRect();
                const origComputed = window.getComputedStyle(orig);
                
                clone.setAttribute('width', `${origRect.width}`);
                clone.setAttribute('height', `${origRect.height}`);
                clone.style.width = `${origRect.width}px`;
                clone.style.height = `${origRect.height}px`;
                clone.style.display = origComputed.display;
                clone.style.overflow = 'visible'; 
            }
        });

        // 5. Styles for the cloned wrapper
        clonedElement.style.width = `${width}px`;
        clonedElement.style.height = 'auto'; 
        clonedElement.style.minHeight = `${height}px`;
        clonedElement.style.margin = '0';
        clonedElement.style.transform = 'none';
        
        const computedStyle = window.getComputedStyle(originalElement);
        if (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyle.backgroundColor === 'transparent') {
             clonedElement.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--bg');
        }

        const scrollables = clonedElement.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-x-auto, .custom-scrollbar');
        scrollables.forEach((el: any) => {
            el.style.height = 'auto';
            el.style.overflow = 'visible';
            el.style.maxHeight = 'none';
        });

        const toRemove = clonedElement.querySelectorAll('.no-export');
        toRemove.forEach(el => el.remove());

        if (options.padding) {
            clonedElement.style.padding = `${options.padding}px`;
            clonedElement.style.boxSizing = 'border-box';
        }

        container.appendChild(clonedElement);

        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
            // 7. Capture
            const canvas = await html2canvas(clonedElement, {
                scale: options.scale || 3, // High Res
                useCORS: true,
                logging: false,
                backgroundColor: null,
                width: container.offsetWidth,
                height: container.offsetHeight,
                // CRITICAL FIX: Force a large window width so Tailwind desktop breakpoints (md:) are used 
                // in the clone regardless of the user's actual screen width.
                windowWidth: options.minWidth || 1440, 
                windowHeight: 1080,
                onclone: (doc) => {
                    const el = doc.getElementById(elementId);
                    if(el) el.style.width = `${width}px`;
                }
            });

            document.body.removeChild(container);
            return canvas;

        } catch (err) {
            console.error('Export capture failed:', err);
            if(document.body.contains(container)) document.body.removeChild(container);
            return null;
        }
    },

    async exportToPdf(elementId: string, fileName: string = 'export.pdf', options: { minWidth?: number } = {}) {
        try {
            const canvas = await this.capture(elementId, { scale: 2, minWidth: options.minWidth }); 
            if (!canvas) return false;

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
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

    async exportToPng(elementId: string, fileName: string = 'export.png', options: { minWidth?: number } = {}) {
        try {
            const canvas = await this.capture(elementId, { scale: 3, padding: 20, minWidth: options.minWidth }); 
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
