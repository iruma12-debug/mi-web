/* ============================================================
   IRU CODEX — INTERFAZ WEB
   JAVASCRIPT PRINCIPAL
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       ELEMENTOS
       ======================================================== */

    const body = document.body;
    const PROJECTS_STORAGE_KEY = "iru-codex-projects";
    const API_BASE = "/api";

    const modeButton =
        document.getElementById("modeButton");

    const modeIcon =
        document.getElementById("modeIcon");

    const modeText =
        document.getElementById("modeText");

    const whatsappButton =
        document.getElementById("whatsappButton");

    const categoryButtons =
        document.querySelectorAll(".category");

    const catalogGrid =
        document.getElementById("catalogGrid");

    const publicCatalogGrid =
        document.getElementById("publicCatalogGrid");

    const publicCatalogsSection =
        document.getElementById("publicCatalogsSection");

    const projectPreviewDialog =
        document.getElementById("projectPreviewDialog");

    const projectPreviewTitle =
        document.getElementById("projectPreviewTitle");

    const projectPreviewFrame =
        document.getElementById("projectPreviewFrame");

    const projectPreviewClose =
        document.getElementById("projectPreviewClose");

    const projectPreviewDownload =
        document.getElementById("projectPreviewDownload");

    const projectPreviewOpenLink =
        document.getElementById("projectPreviewOpenLink");

    let projectForDownload = null;

    const catalogStatus =
        document.getElementById("catalogStatus");

    const emptyCatalog =
        document.getElementById("emptyCatalog");

    const menuButton =
        document.getElementById("menuButton");

    const menuOverlay =
        document.getElementById("menuOverlay");

    const closeMenu =
        document.getElementById("closeMenu");

    const menuLinks =
        document.querySelectorAll(".menu-navigation a");


    /* ========================================================
       MODO OSCURO / CLARO
       ======================================================== */

    const savedMode =
        localStorage.getItem("iru-codex-mode");

    if (savedMode === "light") {
        body.classList.add("light-mode");
    }


    function updateMode() {

        const light =
            body.classList.contains("light-mode");

        if (modeIcon) {
            modeIcon.textContent =
                light ? "☀" : "☾";
        }

        if (modeText) {
            modeText.textContent = "MODO";
        }

    }


    if (modeButton) {

        modeButton.addEventListener("click", () => {

            body.classList.toggle("light-mode");

            const light =
                body.classList.contains("light-mode");

            localStorage.setItem(
                "iru-codex-mode",
                light ? "light" : "dark"
            );

            updateMode();

        });

    }


    updateMode();


    /* ========================================================
       CANAL DE WHATSAPP
       ======================================================== */

    if (whatsappButton) {

        whatsappButton.addEventListener("click", () => {

            showNotification(
                "Canal de WhatsApp",
                "Nuestro canal de WhatsApp estará disponible próximamente."
            );

        });

    }


    /* ========================================================
       MENÚ
       ======================================================== */

    function openMenu() {

        if (!menuOverlay) return;

        menuOverlay.classList.add("active");

        body.style.overflow = "hidden";

    }


    function closeSideMenu() {

        if (!menuOverlay) return;

        menuOverlay.classList.remove("active");

        body.style.overflow = "";

    }


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openMenu
        );

    }


    if (closeMenu) {

        closeMenu.addEventListener(
            "click",
            closeSideMenu
        );

    }


    /* ========================================================
       CERRAR MENÚ AL HACER CLICK FUERA
       ======================================================== */

    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === menuOverlay
                ) {

                    closeSideMenu();

                }

            }
        );

    }


    /* ========================================================
       CERRAR MENÚ CON ESC
       ======================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeSideMenu();

            }

        }
    );


    /* ========================================================
       BOTONES DEL MENÚ
       ======================================================== */

    menuLinks.forEach((link) => {

        link.addEventListener("click", (event) => {

            const href =
                link.getAttribute("href");

            /*
             * Inicio
             */

            if (href === "../index.html") {

                closeSideMenu();

                return;

            }


            /*
             * Categorías
             */

            if (href === "#categorias") {

                event.preventDefault();

                closeSideMenu();

                const categories =
                    document.querySelector(
                        ".categories-section"
                    );

                if (categories) {

                    categories.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

                return;

            }


            /*
             * Catálogos
             */

            if (href === "#catalogos") {

                event.preventDefault();

                closeSideMenu();

                const catalog =
                    document.querySelector(
                        ".catalog-section"
                    );

                if (catalog) {

                    catalog.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }

        });

    });


    /* ========================================================
       CATEGORÍAS
       ======================================================== */

    categoryButtons.forEach((button) => {

        button.addEventListener("click", () => {

            /*
             * Quitar selección anterior
             */

            categoryButtons.forEach((item) => {

                item.classList.remove("active");

            });


            /*
             * Activar categoría seleccionada
             */

            button.classList.add("active");


            /*
             * Obtener categoría
             */

            const category =
                button.dataset.category;


            /*
             * Filtrar catálogo
             */

            filterCatalog(category);

        });

    });


    function filterCatalog(category) {

        const cards =
            document.querySelectorAll(
                ".catalog-project-card"
            );


        /*
         * Si todavía no hay catálogos
         */

        if (!cards.length) {

            if (catalogStatus) {

                if (category === "todos") {

                    catalogStatus.textContent =
                        "Mostrando todo el catálogo";

                } else {

                    catalogStatus.textContent =
                        "No hay proyectos en esta categoría";

                }

            }

            if (emptyCatalog) {
                emptyCatalog.style.display = "flex";
            }

            return;

        }


        let visible =
            0;


        cards.forEach((card) => {

            const cardCategory =
                card.dataset.category;


            const show =
                category === "todos" ||
                cardCategory === category;


            if (show) {

                card.style.display = "";

                visible++;

            } else {

                card.style.display = "none";

            }

        });


        /*
         * Texto superior
         */

        if (catalogStatus) {

            if (category === "todos") {

                catalogStatus.textContent =
                    "Mostrando todo el catálogo";

            } else {

                const button =
                    document.querySelector(
                        `.category[data-category="${category}"]`
                    );


                const categoryName =
                    button
                        ? button.textContent.trim()
                        : category;


                catalogStatus.textContent =
                    `Mostrando ${visible} proyecto${visible !== 1 ? "s" : ""} · ${categoryName}`;

            }

        }


        /*
         * Estado vacío
         */

        if (emptyCatalog) {

            if (visible === 0) {

                emptyCatalog.style.display =
                    "flex";

            } else {

                emptyCatalog.style.display =
                    "none";

            }

        }

    }


    /* ========================================================
       CATÁLOGO
       ======================================================== */

    function createCatalogCard(project) {
        const card = document.createElement("article");
        card.className = "catalog-card catalog-project-card";
        card.dataset.category = project.category === "cumpleaños"
            ? "cumpleanos"
            : project.category || "gratis";

        const preview = document.createElement("div");
        preview.className = "catalog-preview";

        const videoUrl = getSafeProjectUrl(project.video);
        const imageUrl = getSafeProjectUrl(project.image, true);
        if (videoUrl) {
            const video = document.createElement("video");
            video.src = videoUrl;
            video.className = "catalog-project-video";
            video.muted = true;
            video.loop = true;
            video.autoplay = !imageUrl;
            video.controls = Boolean(imageUrl);
            video.playsInline = true;
            video.preload = "metadata";
            if (imageUrl) video.poster = imageUrl;
            preview.append(video);
        } else if (imageUrl) {
            const backdrop = document.createElement("img");
            backdrop.className = "catalog-preview-backdrop";
            backdrop.src = imageUrl;
            backdrop.alt = "";
            backdrop.setAttribute("aria-hidden", "true");

            const image = document.createElement("img");
            image.src = imageUrl;
            image.alt = project.name || "Vista previa del proyecto";
            preview.append(backdrop, image);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "catalog-placeholder";

            const symbol = document.createElement("span");
            symbol.textContent = "✦";
            placeholder.append(symbol);
            preview.append(placeholder);
        }

        const info = document.createElement("div");
        info.className = "catalog-card-info";

        const title = document.createElement("h3");
        title.textContent = project.name || "Proyecto";

        const description = document.createElement("p");
        description.textContent = project.description || "";

        const cardButton = document.createElement("button");
        cardButton.type = "button";
        cardButton.className = "catalog-card-button";
        const projectLink = getSafeProjectUrl(project.link);
        const hasHtml = Boolean(project.html.trim());
        const isPremium = String(project.type || "").toLowerCase() === "premium";

        if (isPremium) {
            cardButton.textContent = "ACCEDER A PREMIUM →";
            cardButton.addEventListener("click", () => {
                const accessUrl = new URL(
                    "../premium/recursos/pago.html",
                    window.location.href
                );
                accessUrl.searchParams.set("proyecto_id", project.id);
                window.location.href = accessUrl.href;
            });
        } else if (!projectLink && !hasHtml) {
            cardButton.textContent = "CONTENIDO PENDIENTE";
            cardButton.disabled = true;
            cardButton.title = "Agrega un enlace o código HTML desde el panel de administración.";
        } else {
            cardButton.textContent = "VER PROYECTO →";
            cardButton.addEventListener("click", () => {
                if (project.backend) {
                    window.location.assign(
                        `${API_BASE}/proyectos/${encodeURIComponent(project.id)}/abrir`
                    );
                    return;
                }

                if (projectLink) {
                    window.location.assign(projectLink);
                    return;
                }

                if (!projectPreviewDialog || !projectPreviewFrame) return;

                if (projectPreviewTitle) {
                    projectPreviewTitle.textContent = project.name || "Vista previa del proyecto";
                }

                projectForDownload = project;
                projectPreviewFrame.removeAttribute("src");
                projectPreviewFrame.srcdoc = project.html;

                if (projectPreviewOpenLink) {
                    projectPreviewOpenLink.hidden = true;
                    projectPreviewOpenLink.removeAttribute("href");
                }

                projectPreviewDialog.showModal();
            });
        }

        info.append(title, description, cardButton);
        card.append(preview, info);
        return card;
    }


    projectPreviewClose?.addEventListener("click", () => {
        projectPreviewDialog?.close();
    });

    projectPreviewDownload?.addEventListener("click", () => {
        if (projectForDownload) {
            descargarProyecto(projectForDownload);
        }
    });

    projectPreviewDialog?.addEventListener("close", () => {
        if (projectPreviewFrame) {
            projectPreviewFrame.srcdoc = "";
            projectPreviewFrame.removeAttribute("src");
        }
        projectForDownload = null;
    });

    projectPreviewDialog?.addEventListener("click", (event) => {
        if (event.target === projectPreviewDialog) {
            projectPreviewDialog.close();
        }
    });


    function normalizeCatalogCategory(catalog) {
        const category = String(catalog.categoria || "todos")
            .toLowerCase()
            .trim();
        const name = String(catalog.nombre || "")
            .toLowerCase()
            .trim();
        const value = category === "todos" ? name : category;

        return value === "cumpleaños" ? "cumpleanos" : value;
    }


    function createPublicCatalogCard(catalog) {
        const card = document.createElement("article");
        card.className = "catalog-card public-catalog-card";

        const preview = document.createElement("div");
        preview.className = "catalog-preview catalog-placeholder";
        const symbol = document.createElement("span");
        symbol.textContent = "▣";
        preview.append(symbol);

        const info = document.createElement("div");
        info.className = "catalog-card-info";

        const title = document.createElement("h3");
        title.textContent = catalog.nombre || "Catálogo";

        const description = document.createElement("p");
        description.textContent = catalog.descripcion || "Explora los proyectos de esta categoría.";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "catalog-card-button";
        button.textContent = "VER PROYECTOS →";
        button.addEventListener("click", () => {
            const category = normalizeCatalogCategory(catalog);
            const filterButton = Array.from(categoryButtons).find(
                (item) => item.dataset.category === category
            ) || Array.from(categoryButtons).find(
                (item) => item.dataset.category === "todos"
            );

            filterButton?.click();
            catalogGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        info.append(title, description, button);
        card.append(preview, info);
        return card;
    }


    function renderPublicCatalogs(catalogs) {
        if (!publicCatalogGrid || !publicCatalogsSection) return;

        publicCatalogGrid.replaceChildren();
        catalogs.forEach((catalog) => {
            publicCatalogGrid.append(createPublicCatalogCard(catalog));
        });
        publicCatalogsSection.hidden = catalogs.length === 0;
    }


    function readSavedCatalogs() {
        try {
            const catalogs = JSON.parse(
                localStorage.getItem("iru-codex-catalogos") || "[]"
            );

            return Array.isArray(catalogs)
                ? catalogs.filter((catalog) =>
                    catalog &&
                    Number(catalog.publicado ?? 1) !== 0
                )
                : [];
        } catch {
            return [];
        }
    }


    async function loadPublicCatalogs() {
        try {
            const response = await fetch(`${API_BASE}/catalogos`);
            if (!response.ok) {
                throw new Error(`La API respondió con estado ${response.status}.`);
            }

            const data = await response.json();
            const serverCatalogs = Array.isArray(data.catalogos) ? data.catalogos : [];
            const mergedCatalogs = new Map(
                serverCatalogs.map(catalog => [String(catalog.id), catalog])
            );
            readSavedCatalogs().forEach(catalog => {
                mergedCatalogs.set(String(catalog.id), catalog);
            });
            renderPublicCatalogs([...mergedCatalogs.values()]);
        } catch (error) {
            console.warn("No se pudieron cargar los catálogos públicos; se usan datos locales.", error);
            renderPublicCatalogs(readSavedCatalogs());
        }
    }


    /* ========================================================
       PROYECTOS COMPARTIDOS CON ADMIN
       ======================================================== */

    function getSafeProjectUrl(value, allowImageData = false) {
        if (!value || value === "#") return "";

        if (
            allowImageData &&
            /^data:image\/(?:png|jpeg|webp);base64,/i.test(value)
        ) {
            return value;
        }

        try {
            const url = new URL(value, window.location.href);
            return ["http:", "https:", "file:"].includes(url.protocol)
                ? url.href
                : "";
        } catch {
            return "";
        }
    }


    async function descargarProyecto(project, button) {
        const projectUrl = getSafeProjectUrl(project.link);
        const projectHtml = String(project.html || "").trim();
        const safeName = String(project.name || "proyecto")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9_-]+/gi, "-")
            .replace(/^-+|-+$/g, "") || "proyecto";

        if (button) {
            button.disabled = true;
            button.textContent = "…";
        }

        try {
            const response = await fetch(
                `${API_BASE}/proyectos/${encodeURIComponent(project.id)}/descargar`
            );

            if (response.ok) {
                const file = await response.blob();
                const extension = file.type.includes("zip") ? "zip" : "html";
                iniciarDescarga(file, `${safeName}.${extension}`);
                return;
            }
        } catch (error) {
            console.warn("No se pudo descargar desde el backend; se usará el contenido disponible.", error);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "↓";
            }
        }

        let content = projectHtml;
        if (!content && projectUrl) {
            const escapedUrl = projectUrl
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            const escapedName = String(project.name || "Proyecto")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            content = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedName}</title>
</head>
<body>
  <p>Este proyecto se encuentra en un sitio externo.</p>
  <p><a href="${escapedUrl}" rel="noopener noreferrer">Abrir ${escapedName}</a></p>
</body>
</html>`;
        }

        if (!content) return;

        iniciarDescarga(
            new Blob([content], { type: "text/html;charset=utf-8" }),
            `${safeName}.html`
        );
    }


    function iniciarDescarga(file, fileName) {
        const fileUrl = URL.createObjectURL(file);
        const downloadLink = document.createElement("a");
        downloadLink.href = fileUrl;
        downloadLink.download = fileName;
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    }


    function readSavedProjects() {
        try {
            const projects = JSON.parse(
                localStorage.getItem(PROJECTS_STORAGE_KEY) || "[]"
            );

            return Array.isArray(projects)
                ? projects
                    .filter((project) =>
                        project &&
                        typeof project === "object" &&
                        project.published !== false &&
                        Number(project.publicado ?? 1) !== 0
                    )
                    .map(normalizePublicProject)
                : [];
        } catch {
            return [];
        }
    }


    function normalizePublicProject(project) {
        const category = project.category || project.categoria || "gratis";

        return {
            id: project.id,
            name: project.name || project.nombre || "Proyecto",
            type: project.type || project.tipo || "gratis",
            category: category === "cumpleaños" ? "cumpleanos" : category,
            description: project.description || project.descripcion || "",
            image: project.image || project.imagen || "",
            video: project.video || "",
            link: project.link || project.enlace || "",
            html: project.html || project.codigo_html || "",
            backend: project.backend === true,
            published: project.published ?? Number(project.publicado ?? 1) === 1
        };
    }


    function saveProjects(projects) {
        try {
            localStorage.setItem(
                PROJECTS_STORAGE_KEY,
                JSON.stringify(projects)
            );
            return true;
        } catch {
            return false;
        }
    }


    function renderSavedProjects(projects = readSavedProjects()) {
        if (!catalogGrid) return;

        catalogGrid.replaceChildren();
        projects.forEach((project) => {
            catalogGrid.append(createCatalogCard(project));
        });

        const activeCategory =
            document.querySelector(".category.active")?.dataset.category || "todos";
        filterCatalog(activeCategory);
    }


    async function loadPublicProjects() {
        try {
            const response = await fetch(`${API_BASE}/proyectos`);
            if (!response.ok) {
                throw new Error(`La API respondió con estado ${response.status}.`);
            }

            const data = await response.json();
            const serverProjects = Array.isArray(data.proyectos)
                ? data.proyectos.map(project => normalizePublicProject({
                    ...project,
                    backend: true
                }))
                : [];
            renderSavedProjects(serverProjects);
        } catch (error) {
            console.warn("No se pudo cargar el catálogo desde el backend; se usan datos locales.", error);
            renderSavedProjects();
        }
    }


    window.agregarProyecto = function(project) {
        if (!catalogGrid || !project) return;

        const projects = readSavedProjects();
        projects.unshift({
            id: project.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: String(project.name || "Proyecto").trim(),
            category: String(project.category || "gratis"),
            description: String(project.description || ""),
            image: String(project.image || ""),
            link: String(project.link || "")
        });

        if (!saveProjects(projects)) {
            showNotification(
                "No se pudo publicar",
                "El navegador no permitió guardar el proyecto."
            );
            return;
        }

        renderSavedProjects();
    };


    window.addEventListener("storage", (event) => {
        if (event.key === PROJECTS_STORAGE_KEY) {
            loadPublicProjects();
        }

        if (event.key === "iru-codex-catalogos") {
            loadPublicCatalogs();
        }
    });

    window.addEventListener("pageshow", () => {
        loadPublicProjects();
        loadPublicCatalogs();
    });
    loadPublicProjects();
    loadPublicCatalogs();


    /* ========================================================
       NOTIFICACIONES
       ======================================================== */

    function showNotification(title, message) {

        /*
         * Eliminar notificación anterior
         */

        const old =
            document.querySelector(
                ".system-message"
            );


        if (old) {
            old.remove();
        }


        const notification =
            document.createElement("div");


        notification.className =
            "system-message";


        notification.innerHTML = `

            <div class="system-message-box">

                <span class="system-message-icon">
                    ✦
                </span>


                <div class="system-message-content">

                    <strong>
                        ${title}
                    </strong>

                    <p>
                        ${message}
                    </p>

                </div>


                <button
                    type="button"
                    class="system-message-close"
                    aria-label="Cerrar"
                >
                    ×
                </button>

            </div>

        `;


        document.body.appendChild(
            notification
        );


        requestAnimationFrame(() => {

            notification.classList.add(
                "show"
            );

        });


        const closeButton =
            notification.querySelector(
                ".system-message-close"
            );


        closeButton.addEventListener(
            "click",
            () => {

                closeNotification(
                    notification
                );

            }
        );


        setTimeout(() => {

            if (
                document.body.contains(
                    notification
                )
            ) {

                closeNotification(
                    notification
                );

            }

        }, 4000);

    }


    function closeNotification(
        notification
    ) {

        notification.classList.remove(
            "show"
        );


        setTimeout(() => {

            if (
                notification &&
                notification.parentNode
            ) {

                notification.remove();

            }

        }, 350);

    }


    /* ========================================================
       ANIMACIÓN DE ENTRADA
       ======================================================== */

    const sections =
        document.querySelectorAll(
            ".top-header, .intro-card, .categories-section, .catalog-section"
        );


    sections.forEach(
        (section, index) => {

            section.style.opacity = "0";

            section.style.transform =
                "translateY(18px)";


            setTimeout(() => {

                section.style.transition =
                    "opacity .65s ease, transform .65s ease";

                section.style.opacity =
                    "1";

                section.style.transform =
                    "translateY(0)";

            }, 100 + (index * 100));

        }
    );


    /* ========================================================
       PARTÍCULAS
       ======================================================== */

    const particles =
        document.getElementById(
            "particles"
        );


    if (particles) {

        const amount =
            window.innerWidth <= 600
                ? 18
                : 35;


        for (
            let i = 0;
            i < amount;
            i++
        ) {

            const particle =
                document.createElement(
                    "span"
                );


            particle.className =
                "particle";


            particle.style.left =
                `${Math.random() * 100}%`;


            particle.style.top =
                `${Math.random() * 100}%`;


            particle.style.animationDelay =
                `${Math.random() * 8}s`;


            particle.style.animationDuration =
                `${6 + Math.random() * 8}s`;


            particles.appendChild(
                particle
            );

        }

    }


    /* ========================================================
       MENSAJE EN CONSOLA
       ======================================================== */

    console.log(
        "%c✦ IRU CODEX",
        "font-size:22px;font-weight:800;color:#b979ff;"
    );

    console.log(
        "%cCatálogo cargado correctamente.",
        "font-size:12px;color:#29e88b;"
    );

});