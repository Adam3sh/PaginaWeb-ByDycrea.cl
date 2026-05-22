// js/producto.js
// === CONTROLADOR DE LA PÁGINA DE PRODUCTO ===

async function cargarDetalleProducto() {
    // 1. Utilizamos la función global que movimos a utils.js
    const productoId = window.obtenerIdDeLaURL ? window.obtenerIdDeLaURL() : new URLSearchParams(window.location.search).get('id');
    
    if (!productoId) { 
        document.getElementById('loading-spinner').innerHTML = '<h2>Error. No se encontró el producto.</h2>'; 
        return; 
    }

    try {
        // 2. supabaseClient viene de config.js
        const { data, error } = await supabaseClient.from('productos').select('*').eq('id', productoId).single();
        if (error) throw error;

        // --- GALERÍA DE IMÁGENES ---
        const imagenUrl = (data.imagenes && data.imagenes.length > 0) ? data.imagenes[0] : 'https://via.placeholder.com/800x800';
        const imgPrincipal = document.getElementById('detail-image');
        if (imgPrincipal) imgPrincipal.src = imagenUrl;

        const thumbContainer = document.getElementById('thumbnails-container');
        if(thumbContainer && data.imagenes && data.imagenes.length > 1) {
            thumbContainer.innerHTML = '';
            data.imagenes.forEach((img, idx) => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.className = idx === 0 ? 'thumbnail active' : 'thumbnail';
                thumb.addEventListener('click', () => {
                    imgPrincipal.src = img; 
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                thumbContainer.appendChild(thumb);
            });
        }
        
        // --- TEXTOS Y OFERTAS ---
        document.getElementById('detail-title').textContent = data.titulo || 'Sin título';
        document.getElementById('detail-desc').textContent = data.descripcion || "Sin descripción adicional.";
        
        let esOfertaValida = data.precio_oferta && (!data.fecha_fin_oferta || new Date(data.fecha_fin_oferta) > new Date());
        let precioMostrar = esOfertaValida ? data.precio_oferta : data.precio;
        
        if (esOfertaValida) {
            let dcto = Math.round(100 - (data.precio_oferta * 100 / data.precio));
            let textoTermina = '';
            if (data.fecha_fin_oferta) {
                const diasRestantes = Math.ceil((new Date(data.fecha_fin_oferta) - new Date()) / (1000 * 60 * 60 * 24));
                textoTermina = `<div style="font-size: 0.95rem; color: var(--danger); margin-top: 8px; font-weight: 700;"><i class="fas fa-stopwatch"></i> ¡Termina en ${diasRestantes} días!</div>`;
            }
            document.getElementById('detail-price').innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="font-size: 1.1rem; color: #a0aec0; font-weight: 500; text-decoration: line-through;">Normal: $${data.precio.toLocaleString('es-CL')}</span>
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <span style="color: var(--danger); font-size: 3rem; font-weight: 800; line-height: 1;">$${precioMostrar.toLocaleString('es-CL')}</span>
                        <span style="background: var(--danger); color: white; padding: 6px 14px; border-radius: 8px; font-size: 1.2rem; font-weight: 800; box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);">¡${dcto}% OFF!</span>
                    </div>
                    ${textoTermina}
                </div>
            `;
        } else {
            document.getElementById('detail-price').textContent = `$${precioMostrar.toLocaleString('es-CL')} CLP`;
        }

        // Etiquetas (Badges)
        let etiquetasExtras = '';
        if (data.etiqueta_destacada) {
            etiquetasExtras = ` <span style="background:var(--secondary-brand); color:white; font-size:0.8rem; padding: 4px 10px; border-radius:4px; margin-left: 10px;">${data.etiqueta_destacada}</span>`;
        } else if (esOfertaValida) {
             let dcto = Math.round(100 - (data.precio_oferta * 100 / data.precio));
             etiquetasExtras = ` <span style="background:var(--danger); color:white; font-size:0.8rem; padding: 4px 10px; border-radius:4px; margin-left: 10px;">¡${dcto}% OFF!</span>`;
        }
        const badgeEl = document.getElementById('detail-badge');
        if (badgeEl) badgeEl.innerHTML = (data.categoria || '') + etiquetasExtras;

        // Especificaciones Técnicas Seguras
        const formatArray = (arr) => Array.isArray(arr) ? arr.join(', ') : (typeof arr === 'string' ? arr.replace(/[{""}]/g, '') : '');
        const setSafeText = (id, text) => { if(document.getElementById(id)) document.getElementById(id).textContent = text; };
        
        setSafeText('detail-material', formatArray(data.material) || 'No especificado');
        setSafeText('detail-color', formatArray(data.color) || 'A elección');
        setSafeText('detail-altura', data.altura ? `${data.altura} cm` : 'No especificada');
        setSafeText('detail-peso', data.peso ? `${data.peso} g` : 'No especificado');
        setSafeText('detail-pers', data.personalizable ? 'Sí' : 'No');

        // Stock y Botón
        // --- SELECCIÓN DE VARIANTES Y BOTÓN AL CARRITO ---
        const sinStock = data.stock <= 0;
        const textoStock = document.getElementById('detail-stock');
        if (textoStock) {
            textoStock.textContent = sinStock ? 'Agotado' : `${data.stock} disponibles`;
            textoStock.style.color = sinStock ? 'var(--danger)' : '#27ae60';
        }

        const btnAccion = document.getElementById('btn-cotizar-detail');
        if (btnAccion) {
            const containerBotones = btnAccion.parentElement;

            if (sinStock) {
                btnAccion.innerHTML = '<i class="fas fa-times-circle"></i> Producto Agotado';
                btnAccion.style.background = '#cbd5e1'; 
                btnAccion.style.color = '#64748b';
                btnAccion.style.cursor = 'not-allowed';
                btnAccion.onclick = (e) => { e.preventDefault(); };
            } else {
                // 1. Crear selectores si hay múltiples opciones
                let selectsHTML = '';
                
                if (Array.isArray(data.material) && data.material.length > 0) {
                    selectsHTML += `
                        <div style="margin-bottom: 10px;">
                            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-body); margin-bottom: 5px; display: block;">Selecciona el Material:</label>
                            <select id="select-material" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; font-family: inherit;">
                                ${data.material.map(m => `<option value="${m}">${m}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }
                
                if (Array.isArray(data.color) && data.color.length > 0) {
                    selectsHTML += `
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-body); margin-bottom: 5px; display: block;">Selecciona el Color:</label>
                            <select id="select-color" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; font-family: inherit;">
                                ${data.color.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }

                // Insertar los selectores justo antes del botón
                if (selectsHTML !== '') {
                    const selectorDiv = document.createElement('div');
                    selectorDiv.innerHTML = selectsHTML;
                    containerBotones.insertBefore(selectorDiv, btnAccion);
                }

                // 2. Configurar el botón para que lea los selectores
                btnAccion.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
                btnAccion.style.background = 'var(--secondary-brand)'; 
                
                btnAccion.onclick = () => {
                    const selectorMat = document.getElementById('select-material');
                    const selectorCol = document.getElementById('select-color');
                    
                    const matElegido = selectorMat ? selectorMat.value : (Array.isArray(data.material) ? data.material[0] : null);
                    const colElegido = selectorCol ? selectorCol.value : (Array.isArray(data.color) ? data.color[0] : null);

                    if(typeof window.agregarAlCarrito === 'function') {
                        window.agregarAlCarrito(data.id, data.titulo, precioMostrar, imagenUrl, esOfertaValida ? data.precio : null, matElegido, colElegido);
                    }
                };
            }
        }

        // ¡EL MOMENTO CLAVE! Ocultar spinner y mostrar contenido
        const spinner = document.getElementById('loading-spinner');
        const content = document.getElementById('product-detail-content');
        if(spinner) spinner.style.display = 'none';
        if(content) content.style.display = 'grid';

    } catch (err) {
        console.error("Error al cargar figura:", err);
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--danger); margin-bottom:15px;"></i>
                <h2>Error al cargar el producto.</h2>
                <p>Verifica que el enlace sea correcto o tu conexión.</p>
                <button onclick="window.history.back()" style="margin-top:20px; padding:10px 20px; border-radius:8px; background:var(--secondary-brand); color:white; border:none; cursor:pointer;">Volver Atrás</button>
            </div>`;
    }
}

// Ya no llamamos a los inicializadores del carrito aquí ni al acordeón, 
// esos módulos se disparan solos gracias a utils.js y carrito.js
document.addEventListener('DOMContentLoaded', () => {
    cargarDetalleProducto();
});