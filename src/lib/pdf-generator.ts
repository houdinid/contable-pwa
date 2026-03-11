
import { RefObject } from "react";

// Import html2pdf dynamically to avoid SSR issues
const getHtml2Pdf = async (): Promise<any> => {
    const module = await import("html2pdf.js");
    console.log("html2pdf module loaded:", module);
    return module.default || module;
};

interface GeneratePdfOptions {
    filename: string;
    elementId: string;
}

const prepareElementForPdf = (elementId: string): HTMLElement => {
    const original = document.getElementById(elementId);
    if (!original) {
        throw new Error(`Element with id ${elementId} not found`);
    }

    // Clone the element
    const clone = original.cloneNode(true) as HTMLElement;

    // Create a container to hold the clone off-screen but valid for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    // Force a desktop width to ensure the layout looks like the desktop version
    container.style.width = '800px';
    // Ensure it's on top of everything z-index wise just in case, though off-screen
    container.style.zIndex = '-1';

    // Add the clone to the container
    container.appendChild(clone);
    document.body.appendChild(container);

    // Add the clone to the container
    container.appendChild(clone);
    document.body.appendChild(container);

    // Sanitize styles to remove unsupported functions like lab() or oklch()
    // by freezing computed styles as RGB/RGBA
    sanitizeStyles(clone);

    // Return the clone (which is now in the DOM)
    return clone;
};

// Helper to convert any color string (lab, oklch, etc.) to valid RGBA for html2canvas
const ensureRgb = (color: string): string => {
    if (!color || color === 'transparent' || color === 'inherit') return color;
    if (color.startsWith('rgb') || color.startsWith('#')) return color;

    // Use a temporary canvas to force browser color conversion
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return color;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
};

const sanitizeStyles = (element: HTMLElement) => {
    const colorProps = [
        'color', 'backgroundColor', 'borderColor', 'borderTopColor', 
        'borderRightColor', 'borderBottomColor', 'borderLeftColor',
        'outlineColor', 'columnRuleColor', 'textDecorationColor',
        'fill', 'stroke'
    ];

    const processNode = (node: HTMLElement) => {
        const computed = window.getComputedStyle(node);

        // 1. Basic color properties
        colorProps.forEach(prop => {
            const value = (computed as any)[prop];
            if (value && value !== 'transparent' && value !== 'none') {
                (node.style as any)[prop] = ensureRgb(value);
            }
        });

        // 2. Complex properties: Box Shadow
        if (computed.boxShadow && computed.boxShadow !== 'none') {
            // Box shadow can contain multiple colors. 
            // The simplest is to either convert colors or remove it if it contains modern formats.
            if (computed.boxShadow.includes('oklch') || computed.boxShadow.includes('lab')) {
                // If it contains modern colors, just strip it for now to avoid the crash
                node.style.boxShadow = 'none';
            } else {
                // Try to sanitize it by forcing it to RGB if it's already standard
                node.style.boxShadow = computed.boxShadow;
            }
        }

        // 3. Gradients and background images
        if (computed.backgroundImage && computed.backgroundImage.includes('gradient')) {
            // Gradients are notoriously hard to sanitize. 
            // If they contain oklch/lab, we simplify to a solid color or common fallback.
            if (computed.backgroundImage.includes('oklch') || computed.backgroundImage.includes('lab')) {
                node.style.backgroundImage = 'none';
                node.style.backgroundColor = ensureRgb(computed.backgroundColor || '#ffffff');
            }
        }
        
        // 4. Filters
        if (computed.filter && computed.filter !== 'none') {
            if (computed.filter.includes('oklch') || computed.filter.includes('lab')) {
                node.style.filter = 'none';
            }
        }
    };

    // Process the element itself
    processNode(element);

    // Process all children
    const children = element.querySelectorAll('*');
    children.forEach((child) => {
        if (child instanceof HTMLElement || child instanceof SVGElement) {
            processNode(child as HTMLElement);
        }
    });
};

const cleanupElement = (element: HTMLElement) => {
    const container = element.parentElement;
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
};

export const generatePDF = async ({ filename, elementId }: GeneratePdfOptions): Promise<void> => {
    let targetElement: HTMLElement | null = null;

    try {
        targetElement = prepareElementForPdf(elementId);
        const html2pdf = await getHtml2Pdf();

        const opt = {
            margin: [10, 10, 10, 10],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 1200 }, // windowWidth helps simulate desktop
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(targetElement).save();

    } catch (error) {
        console.error("Internal PDF Generation Error:", error);
        throw error;
    } finally {
        if (targetElement) {
            cleanupElement(targetElement);
        }
    }
};

export const sharePDF = async ({ filename, elementId }: GeneratePdfOptions): Promise<void> => {
    let targetElement: HTMLElement | null = null;

    try {
        targetElement = prepareElementForPdf(elementId);
        const html2pdf = await getHtml2Pdf();

        const opt = {
            margin: [10, 10, 10, 10],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(opt).from(targetElement).output('blob');
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: filename,
                text: 'Adjunto encontrarás el documento.'
            });
        } else {
            // Fallback
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            // alert("La función de compartir no es compatible. El archivo se ha descargado."); 
            // Suppress alert to avoid double alerting if main catch block handles it, 
            // but here we are successful in fallback.
        }

    } catch (error) {
        console.error("Internal PDF Share Error:", error);
        throw error;
    } finally {
        if (targetElement) {
            cleanupElement(targetElement);
        }
    }
};
