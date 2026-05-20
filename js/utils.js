// js/utils.js
// === MÓDULO DE UTILIDADES GLOBALES ===

// 1. Sistema de Notificaciones
window.mostrarNotificacion = function(mensaje, tipo = "oferta") {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icono = tipo === 'oferta' ? '<i class="fas fa-fire"></i>' : '<i class="fas fa-check"></i>';
    toast.innerHTML = `<div class="toast-icon">${icono}</div><div class="toast-text">${mensaje}</div>`;
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { 
        toast.classList.remove('show'); 
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
};

// 2. Lógica del Acordeón del Footer
window.inicializarAcordeonFooter = function() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        // Clonamos el nodo para evitar que se dupliquen eventos si la página recarga componentes
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', () => {
            if(window.innerWidth <= 768) {
                const item = newHeader.parentElement;
                if(item.classList.contains('activo')) {
                    item.classList.remove('activo');
                } else {
                    document.querySelectorAll('.accordion-item').forEach(other => other.classList.remove('activo')); 
                    item.classList.add('activo'); 
                }
            }
        });
    });
};

// 3. Obtener parámetros de URL (Herramienta para producto.js)
window.obtenerIdDeLaURL = function() { 
    return new URLSearchParams(window.location.search).get('id'); 
};

// Ejecutar utilidades automáticas al cargar
document.addEventListener('DOMContentLoaded', () => {
    inicializarAcordeonFooter();
});

// 4. Sistema para encoger el Header y Logo al hacer Scroll
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.ecommerce-header');
    
    if (header) {
        window.addEventListener('scroll', () => {
            // Si el usuario baja más de 40 píxeles desde el inicio...
            if (window.scrollY > 40) {
                header.classList.add('shrunk'); // Añade la clase que encoge el logo
            } else {
                header.classList.remove('shrunk'); // Quita la clase y vuelve al tamaño original
            }
        });
    }
});