// Trigger click on 'Convertir' using the DOM

setTimeout(() => {
    // Busca el boton de convertir
    const botones = Array.from(document.querySelectorAll('button'));
    const convertirBtn = botones.find(b => b.textContent?.includes('Convertir') || b.title?.includes('Convertir a Factura'));
    
    if (convertirBtn) {
        console.log("Haciendo click en convertir...");
        (convertirBtn as HTMLButtonElement).click();
    } else {
        console.log("No se encontró el botón de convertir");
    }
}, 3000);
