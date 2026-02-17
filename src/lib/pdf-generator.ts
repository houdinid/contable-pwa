
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
    // Helper to process a single node
    const processNode = (node: HTMLElement) => {
        const computed = window.getComputedStyle(node);

        // Critical colors
        if (computed.color) node.style.color = ensureRgb(computed.color);
        if (computed.backgroundColor) node.style.backgroundColor = ensureRgb(computed.backgroundColor);
        if (computed.borderColor) node.style.borderColor = ensureRgb(computed.borderColor);

        // Handle SVGs
        if (computed.fill && computed.fill !== 'none') node.style.fill = ensureRgb(computed.fill);
        if (computed.stroke && computed.stroke !== 'none') node.style.stroke = ensureRgb(computed.stroke);

        // Box shadow is complex causing issues with lab colors, 
        // if it contains unsupported formats, we might want to simplify or remove it for PDF
        if (computed.boxShadow && (computed.boxShadow.includes('lab(') || computed.boxShadow.includes('oklch('))) {
            // Attempt to keep layout but lose shadow color if complex
            node.style.boxShadow = 'none';
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
