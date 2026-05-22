// js/main.js
// === CONTROLADOR DE LA PÁGINA DE INICIO ===

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');
let productosGlobales = [];

// === SKELETON LOADING ===
function mostrarSkeleton() {
    if (!contenedor) return;
    contenedor.innerHTML = '';
    for(let i=0; i<8; i++){
        contenedor.innerHTML += `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-title"></div><div class="skeleton-text"></div><div class="skeleton-price"></div></div>`;
    }
}

// === AUTO SLIDER DE IMÁGENES ===
let sliderInterval;
function iniciarAutoSlider() {
    if(sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        document.querySelectorAll('.auto-slider').forEach(img => {
            const imagenes = img.getAttribute('data-images').split('|||');
            if(imagenes.length > 1) {
                let currentIndex = parseInt(img.getAttribute('data-index'));
                let nextIndex = (currentIndex + 1) % imagenes.length;
                img.style.opacity = 0; // Desvanecer
                setTimeout(() => {
                    img.src = imagenes[nextIndex];
                    img.setAttribute('data-index', nextIndex);
                    img.style.opacity = 1; // Aparecer
                }, 200);
            }
        });
    }, 3000); // Cambia cada 3 segundos
}

// === RENDERIZAR PRODUCTOS ===
function renderizarProductos(lista) {
    contenedor.innerHTML = ''; 
    if(!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; margin-top: 20px;">No encontramos productos.</p>';
        contadorText.textContent = '0';
        return;
    }

    lista.forEach((prod, index) => {
       const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`; 
        
        const tieneMultiples = prod.imagenes && prod.imagenes.length > 1;
        const imagenPrincipal = (prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0] : 'https://via.placeholder.com/500x500';
        const dataImagesStr = tieneMultiples ? prod.imagenes.join('|||') : imagenPrincipal;

        let esOfertaValida = prod.precio_oferta && (!prod.fecha_fin_oferta || new Date(prod.fecha_fin_oferta) > new Date());
        let precioMostrar = esOfertaValida ? prod.precio_oferta : prod.precio;
        const sinStock = prod.stock <= 0; 
        
        let precioOriginalHTML = esOfertaValida ? `<span style="display: block; text-decoration: line-through; color: #a0aec0; font-size: 0.85rem; font-weight: 500; margin-bottom: -2px;">Normal: $${prod.precio.toLocaleString('es-CL')}</span>` : '';
        let colorNuevo = esOfertaValida ? 'var(--danger)' : 'var(--secondary-brand)';
        const precioFormateado = precioOriginalHTML + `<span style="color: ${colorNuevo};">` + new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(precioMostrar) + ` CLP</span>`;

        let badgesHTML = `<span class="badge category">${prod.categoria}</span>`;
        if (sinStock) {
            badgesHTML += `<span class="badge oferta" style="background: #718096; animation: none;">AGOTADO</span>`;
        } else if (prod.etiqueta_destacada) {
            badgesHTML += `<span class="badge oferta" style="background:var(--secondary-brand); animation:none;">${prod.etiqueta_destacada}</span>`;
        } else if (esOfertaValida) {
            let dcto = Math.round(100 - (prod.precio_oferta * 100 / prod.precio));
            badgesHTML += `<span class="badge oferta" style="background:var(--danger);">¡${dcto}% OFF!</span>`;
        }

        const materialPrincipal = (prod.material && prod.material.length > 0) ? prod.material.join(', ') : 'Impresión 3D';

        let btnCartHTML = '';
        if (sinStock) {
            btnCartHTML = `<button class="btn-add-cart" disabled style="background: #cbd5e1; color: #64748b; cursor: not-allowed; width: 100%;"><i class="fas fa-times-circle"></i> Agotado</button>`;
        } else {
            // Llama a la función global agregarAlCarrito de carrito.js
            btnCartHTML = `<button class="btn-add-cart" onclick="agregarAlCarrito('${prod.id}', '${prod.titulo.replace(/'/g, "")}', ${precioMostrar}, '${imagenPrincipal}', ${esOfertaValida ? prod.precio : null})" style="background: var(--secondary-brand); color: white; width: 100%;"><i class="fas fa-cart-plus"></i> Al Carrito</button>`;
        }

        card.innerHTML = `
            <div class="image-container">
                <div class="badges-container">${badgesHTML}</div>
                <img src="${imagenPrincipal}" alt="${prod.titulo}" class="product-image ${tieneMultiples ? 'auto-slider' : ''}" data-images="${dataImagesStr}" data-index="0" loading="lazy">
                <div class="quick-action-overlay">
                    ${btnCartHTML}
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${prod.titulo}</h3>
                <div class="product-material">${materialPrincipal}</div>
                <div class="product-price">${precioFormateado}</div>
            </div>
        `;
        
        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
            if (!e.target.closest(".btn-add-cart")) {
                window.location.href = `producto.html?id=${prod.id}`;
            }
        });
        contenedor.appendChild(card);
    });
    
    contadorText.textContent = lista.length;
    iniciarAutoSlider(); 
}

// === MOTOR DE FILTROS ===
function aplicarFiltros() {

    const textoBuscado = document.getElementById('searchInput').value.toLowerCase();

    // Detectar categoría activa (desktop o móvil)
    const categoriaActiva =
        document.querySelector('#lista-categorias-sidebar a.active') ||
        document.querySelector('#lista-categorias-mobile a.active');

    const categoria = categoriaActiva
        ? categoriaActiva.textContent.trim()
        : 'Todas';

    // Materiales
    const matSeleccionados = Array.from(
        document.querySelectorAll('.filter-section:nth-of-type(2) input[type="checkbox"]:checked')
    ).map(cb => cb.closest('label').textContent.trim());

    // Orden desktop
    const sortDesktop = document.querySelector('.sort-select');

    // Orden móvil
    const sortMobile = document.querySelector('input[name="sort_mobile"]:checked');

    const ordenSeleccionado =
        window.innerWidth <= 768
            ? (sortMobile ? sortMobile.value : 'Más Relevantes')
            : (sortDesktop ? sortDesktop.value : 'Más Relevantes');

    let filtrados = productosGlobales.filter(prod => {

        const cTexto =
            prod.titulo.toLowerCase().includes(textoBuscado) ||
            prod.categoria.toLowerCase().includes(textoBuscado);

        const cCat =
            categoria === 'Todas' ||
            prod.categoria === categoria;

        let cMat = true;

        if (matSeleccionados.length > 0) {
            cMat = prod.material
                ? prod.material.some(m => matSeleccionados.includes(m))
                : false;
        }

        return cTexto && cCat && cMat;
    });

    // Ordenamiento
    if (ordenSeleccionado === 'Menor Precio') {

        filtrados.sort((a, b) => {

            let precioA =
                (a.precio_oferta &&
                (!a.fecha_fin_oferta || new Date(a.fecha_fin_oferta) > new Date()))
                    ? a.precio_oferta
                    : a.precio;

            let precioB =
                (b.precio_oferta &&
                (!b.fecha_fin_oferta || new Date(b.fecha_fin_oferta) > new Date()))
                    ? b.precio_oferta
                    : b.precio;

            return precioA - precioB;
        });

    } else if (ordenSeleccionado === 'Mayor Precio') {

        filtrados.sort((a, b) => {

            let precioA =
                (a.precio_oferta &&
                (!a.fecha_fin_oferta || new Date(a.fecha_fin_oferta) > new Date()))
                    ? a.precio_oferta
                    : a.precio;

            let precioB =
                (b.precio_oferta &&
                (!b.fecha_fin_oferta || new Date(b.fecha_fin_oferta) > new Date()))
                    ? b.precio_oferta
                    : b.precio;

            return precioB - precioA;
        });
    }

    renderizarProductos(filtrados);
}

// Escuchadores de Filtros
document.getElementById('searchInput')?.addEventListener('input', aplicarFiltros);
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.addEventListener('change', aplicarFiltros));
document.querySelector('.sort-select')?.addEventListener('change', aplicarFiltros);

// Lógica de UI Móvil para Filtros
const btnFiltros = document.getElementById('btnToggleFiltros');
const sidebar = document.getElementById('sidebarFiltros');
if(btnFiltros && sidebar) {
    btnFiltros.addEventListener('click', () => {
        sidebar.classList.toggle('mostrar');
        btnFiltros.innerHTML = sidebar.classList.contains('mostrar') ? '<i class="fas fa-times"></i> Ocultar Filtros' : '<i class="fas fa-filter"></i> Mostrar Filtros';
    });
}

// === CARGA INICIAL DE BASE DE DATOS ===
async function cargarProductosDesdeBD() {
    mostrarSkeleton(); 
    try {
        const { data, error } = await supabaseClient.from('productos').select('*').eq('disponible', true).order('fecha_creacion', { ascending: false });
        if (error) throw error;
        productosGlobales = data;
        setTimeout(() => { aplicarFiltros(); }, 400); 
    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p>Ocurrió un error al cargar los productos.</p>';
    }
}

async function cargarCategoriasStore() {

    try {

        const { data, error } = await supabaseClient
            .from('categorias')
            .select('nombre')
            .order('nombre');

        if (error) throw error;

        const listaDesktop = document.getElementById('lista-categorias-sidebar');
        const listaMobile = document.getElementById('lista-categorias-mobile');

        if (!listaDesktop || !listaMobile) return;

        const categoriaTodas = `
            <li>
                <a href="#" class="active">Todas</a>
            </li>
        `;

        listaDesktop.innerHTML = categoriaTodas;
        listaMobile.innerHTML = categoriaTodas;

        data.forEach(cat => {

            const html = `
                <li>
                    <a href="#">${cat.nombre}</a>
                </li>
            `;

            listaDesktop.innerHTML += html;
            listaMobile.innerHTML += html;
        });

        // Eventos categorías
        document.querySelectorAll('.category-list a').forEach(enlace => {

            enlace.addEventListener('click', (e) => {

                e.preventDefault();

                const texto = enlace.textContent.trim();

                document.querySelectorAll('.category-list a').forEach(el => {
                    el.classList.remove('active');
                });

                // Activar desktop + mobile al mismo tiempo
                document.querySelectorAll('.category-list a').forEach(el => {

                    if (el.textContent.trim() === texto) {
                        el.classList.add('active');
                    }
                });

                aplicarFiltros();
            });
        });

    } catch (err) {

        console.error("Error cargando categorías:", err);
    }
}

async function cargarBanners() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient.from('banners').select('*').eq('activo', true).order('fecha_creacion', { ascending: false });
        if (error) throw error;

        const ahora = new Date();
        const bannersActivos = data ? data.filter(b => !b.fecha_expiracion || new Date(b.fecha_expiracion) > ahora) : [];

        let slidesHTML = `
            <div class="slide active" style="background: linear-gradient(to right, #0f172a, #1e293b);">
                <div class="hero-content">
                    <span class="hero-tag">BIENVENIDO</span>
                    <h2>Imprime tus ideas <br>en alta calidad</h2>
                    <p>Descubre miles de modelos listos para fabricar.</p>
                </div>
            </div>
        `;

        bannersActivos.forEach((banner) => {
            slidesHTML += `
                <div class="slide" style="background-image: url('${banner.imagen_url}');">
                    <div class="hero-content">
                        ${banner.etiqueta ? `<span class="hero-tag">${banner.etiqueta}</span>` : ''}
                        <h2>${banner.titulo}</h2>
                        ${banner.descripcion ? `<p>${banner.descripcion}</p>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = slidesHTML;
        const totalSlides = bannersActivos.length + 1; 

        if (totalSlides > 1) {
            let dotsHTML = '<div class="slider-controls">';
            for(let i=0; i < totalSlides; i++) {
                dotsHTML += `<div class="slider-dot ${i === 0 ? 'active' : ''}" onclick="cambiarSlide(${i})"></div>`;
            }
            dotsHTML += '</div>';
            container.innerHTML += dotsHTML;

            if(window.bannerInterval) clearInterval(window.bannerInterval);
            
            window.bannerInterval = setInterval(() => {
                const slides = document.querySelectorAll('#hero-slider-container .slide');
                let currentIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));
                let nextIndex = (currentIndex + 1) % slides.length;
                cambiarSlide(nextIndex);
            }, 5000); 
        }
    } catch (err) { console.error("Error cargando banners:", err); }
}

window.cambiarSlide = function(index) {
    document.querySelectorAll('#hero-slider-container .slide').forEach((s, i) => s.classList.toggle('active', i === index));
    document.querySelectorAll('#hero-slider-container .slider-dot').forEach((d, i) => d.classList.toggle('active', i === index));
};

// === CONTROL DE INTERACCIONES PREMIUM DEL HEADER MÓVIL ===
document.addEventListener('DOMContentLoaded', () => {
    const btnToggleSearch = document.getElementById('btnToggleSearchMobile');
    const searchBox = document.getElementById('searchBoxMobile');
    const btnToggleMenu = document.getElementById('btnToggleMenuMobile');
    const btnExplorarMobile = document.getElementById('btnToggleFiltrosMobile');

    // Desplegar/Ocultar buscador en celular
    if (btnToggleSearch && searchBox) {
        btnToggleSearch.addEventListener('click', (e) => {
            e.stopPropagation();
            searchBox.classList.toggle('active');
            
            // Foco automático en el input al abrir
            if (searchBox.classList.contains('active')) {
                searchBox.querySelector('input')?.focus();
            }
        });
    }

        // BOTÓN EXPLORAR DE LA NAVBAR INFERIOR
    if (btnExplorarMobile) {

        btnExplorarMobile.addEventListener('click', (e) => {

            e.preventDefault();

            // Abrir buscador superior
            if (searchBox) {
                searchBox.classList.add('active');

                setTimeout(() => {
                    searchBox.querySelector('input')?.focus();
                }, 200);
            }

            // Abrir filtros móviles
            const sidebarFilter = document.getElementById('sidebarFiltrosMobile');
            const uiOverlay = document.getElementById('uiOverlay');

            if (sidebarFilter) {
                sidebarFilter.classList.add('active');
            }

            if (uiOverlay) {
                uiOverlay.classList.add('active');
            }

            document.body.style.overflow = 'hidden';
        });
    }

    // Comportamiento del botón de menú izquierdo
    if (btnToggleMenu) {
        btnToggleMenu.addEventListener('click', () => {
            // Vinculado al panel lateral de filtros ya existente en tu interfaz
            const sidebarFiltros = document.getElementById('sidebarFiltros');
            if (sidebarFiltros) {
                sidebarFiltros.classList.toggle('mostrar');
            }
        });
    }

    // Cerrar buscador automáticamente si el cliente hace clic fuera del área
    document.addEventListener('click', (e) => {
        if (searchBox && searchBox.classList.contains('active')) {
            if (!searchBox.contains(e.target) && e.target !== btnToggleSearch) {
                searchBox.classList.remove('active');
            }
        }
    });
});

// === AUTO-COLAPSAR BANNER AL ESCRIBIR EN EL BUSCADOR ===
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const banner = document.getElementById('hero-slider-container');
    const btnCollapse = document.getElementById('btnCollapseBanner');
    const KEY = 'dycrea_banner_oculto';

    if (searchInput && banner) {
        // Escuchar cada vez que el usuario ingresa texto
        searchInput.addEventListener('input', () => {
            
            // Si hay al menos una letra escrita y el banner NO está colapsado aún
            if (searchInput.value.trim().length > 0 && banner.style.maxHeight !== '0px') {
                
                // Aplicar la transición fluida
                banner.style.transition = 'max-height 0.4s ease, opacity 0.4s ease';
                banner.style.maxHeight = '0px';
                banner.style.opacity = '0';
                
                // Cambiar el ícono del botón pequeño
                if (btnCollapse) {
                    btnCollapse.classList.add('colapsado');
                }
                
                // Guardar la preferencia en la sesión (para que si recarga la página, siga oculto)
                sessionStorage.setItem(KEY, '1');
            }
        });
    }
});

// === CONTROL DE PANELES MÓVILES (FILTRAR / ORDENAR) ===
document.addEventListener('DOMContentLoaded', () => {
    const btnSort = document.getElementById('btnOpenSortMobile');
    const btnFilter = document.getElementById('btnOpenFilterMobile');
    const sidebarSort = document.getElementById('sidebarOrdenarMobile');
    const sidebarFilter = document.getElementById('sidebarFiltrosMobile');
    const uiOverlay = document.getElementById('uiOverlay');

    function abrirPanel(panel) {
        if (!panel) return;
        panel.classList.add('active');
        if (uiOverlay) uiOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evita que la página haga scroll de fondo
    }

    function cerrarPaneles() {
        document.querySelectorAll('.ui-sidebar').forEach(p => p.classList.remove('active'));
        if (uiOverlay) uiOverlay.classList.remove('active');
        document.body.style.overflow = ''; 
    }

    // Eventos de apertura
    if (btnSort) btnSort.addEventListener('click', () => abrirPanel(sidebarSort));
    if (btnFilter) btnFilter.addEventListener('click', () => abrirPanel(sidebarFilter));

    // Eventos de cierre
    if (uiOverlay) uiOverlay.addEventListener('click', cerrarPaneles);
    document.querySelectorAll('.close-ui-btn, #applyFilterBtn').forEach(btn => {
        btn.addEventListener('click', cerrarPaneles);
    });
});

// Función para el acordeón
window.toggleAccordion = function(element) {
    element.classList.toggle('active');
    const content = element.nextElementSibling;
    content.classList.toggle('active');
};

document.getElementById('applySortBtn')?.addEventListener('click', () => {

    aplicarFiltros();

    document.querySelectorAll('.ui-sidebar').forEach(p => {
        p.classList.remove('active');
    });

    document.getElementById('uiOverlay')?.classList.remove('active');

    document.body.style.overflow = '';
});

// Ejecución inicial
cargarProductosDesdeBD();
cargarCategoriasStore();
cargarBanners();