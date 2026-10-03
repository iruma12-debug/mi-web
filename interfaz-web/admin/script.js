"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const PROJECTS_KEY = "iru-codex-projects";
    const CATALOGS_KEY = "iru-codex-catalogos";
    const SETTINGS_KEY = "iru-codex-configuracion";
    const API_BASE = "/api";
    const byId = id => document.getElementById(id);
    const ui = {
        sidebar: byId("sidebar"), overlay: byId("sidebarOverlay"),
        title: byId("pageTitle"), projectForm: byId("projectForm"),
        projectModal: byId("projectModal"), projectName: byId("projectName"),
        projectFolder: byId("projectFolder"), projectType: byId("projectType"),
        projectCategory: byId("projectCategory"), projectLink: byId("projectLink"),
        projectDescription: byId("projectDescription"), projectPublished: byId("projectPublished"),
        projectImage: byId("projectImage"), projectVideo: byId("projectVideo"),
        projectImagePreview: byId("projectImagePreview"), projectVideoPreview: byId("projectVideoPreview"),
        folderPreview: byId("projectFolderPreview"), projectRows: byId("projectsTableBody"),
        catalogForm: byId("catalogForm"), catalogModal: byId("catalogModal"),
        catalogName: byId("catalogName"), catalogCategory: byId("catalogCategory"),
        catalogDescription: byId("catalogDescription"), catalogGrid: byId("catalogAdminGrid"),
        message: byId("systemMessage"), messageTitle: byId("messageTitle"),
        messageText: byId("messageText"), modeIcon: byId("modeIcon")
    };

    let projects = readStorage(PROJECTS_KEY, []);
    let catalogs = readStorage(CATALOGS_KEY, []);
    let backendProjectIds = new Set();
    let editingId = null;
    let activeFilter = "todos";
    let messageTimer;

    function readStorage(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "null");
            return value === null ? fallback : value;
        } catch {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            showMessage("No se pudo guardar", "El navegador no pudo guardar los datos locales.");
            return false;
        }
    }

    function showMessage(title, text) {
        if (!ui.message) {
            window.alert(`${title}\n\n${text}`);
            return;
        }
        ui.messageTitle.textContent = title;
        ui.messageText.textContent = text;
        ui.message.classList.add("show");
        window.clearTimeout(messageTimer);
        messageTimer = window.setTimeout(() => ui.message.classList.remove("show"), 3500);
    }

    function renderMediaPreview(container, file, type, savedUrl = "") {
        if (!container) return;
        const previousPreview = container.querySelector("[data-object-url]");
        if (previousPreview) URL.revokeObjectURL(previousPreview.src);
        container.replaceChildren();

        const source = file ? URL.createObjectURL(file) : savedUrl;
        if (!source) {
            const empty = document.createElement("span");
            empty.textContent = type === "video" ? "Sin video seleccionado" : "Sin foto seleccionada";
            container.append(empty);
            return;
        }

        const preview = document.createElement(type === "video" ? "video" : "img");
        preview.src = source;
        if (file) preview.dataset.objectUrl = "true";
        if (type === "video") {
            preview.controls = true;
            preview.preload = "metadata";
            preview.playsInline = true;
        } else {
            preview.alt = "Vista previa de la foto de portada";
        }
        container.append(preview);

        const filename = document.createElement("small");
        filename.textContent = file?.name || "Archivo actual";
        container.append(filename);
    }

    async function uploadProjectMedia(file, field) {
        const formData = new FormData();
        formData.append(field, file);
        const response = await fetch(`${API_BASE}/proyectos/${field}`, {
            method: "POST",
            body: formData
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `No se pudo subir ${field === "imagen" ? "la foto" : "el video"}.`);
        }
        if (!result[field]) throw new Error("El servidor no devolvió la ruta del archivo.");
        return result[field];
    }

    function escapeHTML(value = "") {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        })[char]);
    }

    function setSection(name) {
        document.querySelectorAll(".admin-section").forEach(section => {
            section.classList.toggle("active", section.id === `section-${name}`);
        });
        document.querySelectorAll(".nav-item[data-section]").forEach(button => {
            button.classList.toggle("active", button.dataset.section === name);
        });
        const active = document.querySelector(`.nav-item[data-section="${name}"]`);
        if (ui.title) ui.title.textContent = active?.innerText.trim() || "Panel";
        closeSidebar();
    }

    function openModal(modal) {
        modal?.classList.add("active");
        modal?.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function closeModal(modal) {
        modal?.classList.remove("active");
        modal?.setAttribute("aria-hidden", "true");
        if (!document.querySelector(".modal.active")) document.body.classList.remove("modal-open");
    }

    function closeSidebar() {
        ui.sidebar?.classList.remove("open");
        ui.overlay?.classList.remove("active");
    }

    function updateDashboard() {
        const published = projects.filter(project => Number(project.publicado ?? 1) === 1).length;
        byId("totalProjects").textContent = projects.length;
        byId("totalCatalogs").textContent = catalogs.length;
        byId("publishedProjects").textContent = published;
    }

    async function loadVisits() {
        try {
            const response = await fetch(`${API_BASE}/visitas`);
            if (!response.ok) throw new Error("No se pudieron cargar las visitas.");
            const data = await response.json();
            byId("totalVisits").textContent = data.total ?? 0;
            byId("visitsTotal").textContent = data.total ?? 0;
            byId("visitsToday").textContent = data.hoy ?? 0;
            byId("visitsMonth").textContent = data.mes ?? 0;
        } catch (error) {
            console.info("Las visitas no están disponibles.", error.message);
        }
    }

    function applySettings(settings) {
        if (settings.nombre_sitio) byId("siteName").value = settings.nombre_sitio;
        if (settings.profesion) byId("siteProfession").value = settings.profesion;
        if (settings.descripcion) byId("siteDescription").value = settings.descripcion;
        if (settings.whatsapp) byId("whatsappLink").value = settings.whatsapp;
    }

    async function loadSettings() {
        let settings = readStorage(SETTINGS_KEY, {});
        try {
            const response = await fetch(`${API_BASE}/configuracion`);
            if (!response.ok) throw new Error("No se pudo cargar la configuración.");
            const data = await response.json();
            settings = data.configuracion || settings;
            writeStorage(SETTINGS_KEY, settings);
        } catch (error) {
            console.info("Se usa la configuración local.", error.message);
        }
        applySettings(settings);
    }

    function matchesFilter(project) {
        if (activeFilter === "todos") return true;
        return [project.categoria, project.category, project.tipo, project.type]
            .some(value => String(value || "").toLowerCase() === activeFilter);
    }

    function renderProjects() {
        if (!ui.projectRows) return;
        ui.projectRows.replaceChildren();
        const shown = projects.filter(matchesFilter);
        if (!shown.length) {
            const empty = document.createElement("div");
            empty.className = "table-empty";
            empty.innerHTML = '<span>◇</span><strong>No hay proyectos</strong><p>Agrega un proyecto para que aparezca aquí.</p><button type="button" class="secondary-button" data-action="new-project">＋ Agregar proyecto</button>';
            ui.projectRows.append(empty);
            return;
        }
        shown.forEach(project => {
            const row = document.createElement("div");
            row.className = "project-row";
            row.innerHTML = `
                <div class="project-row-name"><strong>${escapeHTML(project.nombre || project.name || "Proyecto")}</strong><small>${escapeHTML(project.carpeta || "")}</small></div>
                <span>${escapeHTML(project.categoria || project.category || "todos")}</span>
                <span>${escapeHTML(project.tipo || project.type || "gratis")}</span>
                <span class="project-status ${Number(project.publicado ?? 1) ? "is-published" : ""}">${Number(project.publicado ?? 1) ? "Publicado" : "Borrador"}</span>
                <div class="project-row-actions">
                    <button type="button" class="secondary-button" data-action="edit-project" data-id="${escapeHTML(project.id)}">Editar</button>
                    <button type="button" class="secondary-button danger-button" data-action="delete-project" data-id="${escapeHTML(project.id)}">Eliminar</button>
                </div>`;
            ui.projectRows.append(row);
        });
    }

    function renderCatalogs() {
        if (!ui.catalogGrid) return;
        ui.catalogGrid.replaceChildren();
        if (!catalogs.length) {
            const empty = document.createElement("div");
            empty.className = "admin-empty-state";
            empty.innerHTML = '<div class="empty-icon">▣</div><h3>No hay catálogos todavía</h3><p>Crea tu primer catálogo para organizar tus proyectos.</p><button type="button" class="secondary-button" data-action="new-catalog">Crear catálogo</button>';
            ui.catalogGrid.append(empty);
            return;
        }
        catalogs.forEach(catalog => {
            const card = document.createElement("article");
            card.className = "catalog-admin-card";
            card.innerHTML = `<div><h3>${escapeHTML(catalog.nombre)}</h3><p>${escapeHTML(catalog.descripcion || "Sin descripción")}</p><small>${escapeHTML(catalog.categoria || "todos")}</small></div><button type="button" class="secondary-button danger-button" data-action="delete-catalog" data-id="${escapeHTML(catalog.id)}">Eliminar</button>`;
            ui.catalogGrid.append(card);
        });
    }

    function resetProjectForm() {
        editingId = null;
        ui.projectForm.reset();
        ui.projectPublished.checked = true;
        ui.folderPreview.textContent = "nombre-carpeta";
        renderMediaPreview(ui.projectImagePreview, null, "image");
        renderMediaPreview(ui.projectVideoPreview, null, "video");
    }

    function editProject(id) {
        const project = projects.find(item => String(item.id) === String(id));
        if (!project) return;
        editingId = project.id;
        ui.projectName.value = project.nombre || project.name || "";
        ui.projectFolder.value = project.carpeta || "";
        ui.projectType.value = project.tipo || project.type || "gratis";
        ui.projectCategory.value = project.categoria || project.category || "todos";
        ui.projectLink.value = project.enlace || project.link || "";
        ui.projectDescription.value = project.descripcion || project.description || "";
        ui.projectPublished.checked = Number(project.publicado ?? 1) === 1;
        renderMediaPreview(ui.projectImagePreview, null, "image", project.imagen || project.image || "");
        renderMediaPreview(ui.projectVideoPreview, null, "video", project.video || "");
        ui.projectFolder.dispatchEvent(new Event("input", { bubbles: true }));
        openModal(ui.projectModal);
    }

    async function saveProject(event) {
        event.preventDefault();
        const name = ui.projectName.value.trim();
        const folder = ui.projectFolder.value.trim();
        if (!name || !/^[A-Za-z0-9_-]+$/.test(folder)) {
            showMessage("Revisa los datos", "Escribe un nombre y una carpeta válida (letras, números, - o _).");
            return;
        }

        const customLink = ui.projectLink.value.trim();
        const projectLink = customLink || `admin/proyectohtml/${folder}/index.html`;
        const previous = projects.find(project => String(project.id) === String(editingId)) || {};
        let imageUrl = previous.imagen || previous.image || "";
        let videoUrl = previous.video || "";
        try {
            if (ui.projectImage.files?.[0]) {
                imageUrl = await uploadProjectMedia(ui.projectImage.files[0], "imagen");
            }
            if (ui.projectVideo.files?.[0]) {
                videoUrl = await uploadProjectMedia(ui.projectVideo.files[0], "video");
            }
        } catch (error) {
            showMessage("No se pudo subir el archivo", error.message);
            return;
        }

        let project = {
            ...previous,
            id: editingId || Date.now(),
            nombre: name,
            name,
            carpeta: folder,
            ruta_proyecto: `proyectohtml/${folder}`,
            archivo_entrada: "index.html",
            tipo: ui.projectType.value,
            type: ui.projectType.value,
            categoria: ui.projectCategory.value,
            category: ui.projectCategory.value,
            descripcion: ui.projectDescription.value.trim(),
            description: ui.projectDescription.value.trim(),
            imagen: imageUrl,
            image: imageUrl,
            video: videoUrl,
            enlace: projectLink,
            link: projectLink,
            publicado: ui.projectPublished.checked ? 1 : 0,
            published: ui.projectPublished.checked
        };

        try {
            const response = await fetch(`${API_BASE}/proyectos${editingId ? `/${editingId}` : ""}`, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(project)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || result.mensaje || "El backend rechazó el proyecto.");
            project = { ...project, ...(result.proyecto || {}) };
            backendProjectIds.add(String(project.id));
        } catch (error) {
            showMessage("No se pudo guardar el proyecto", error.message);
            return;
        }

        const next = editingId
            ? projects.map(item => String(item.id) === String(editingId) ? project : item)
            : [project, ...projects];
        if (!writeStorage(PROJECTS_KEY, next)) return;
        projects = next;
        renderProjects();
        updateDashboard();
        closeModal(ui.projectModal);
        resetProjectForm();
        showMessage(
            "Proyecto guardado",
            `Se guardó en el servidor. Coloca su index.html en admin/proyectohtml/${folder}/.`
        );
    }

    async function saveCatalog(event) {
        event.preventDefault();
        const name = ui.catalogName.value.trim();
        if (!name) return;
        let catalog = {
            id: Date.now(), nombre: name, categoria: ui.catalogCategory.value,
            descripcion: ui.catalogDescription.value.trim(), fecha_creacion: new Date().toISOString()
        };
        try {
            const response = await fetch(`${API_BASE}/catalogos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(catalog)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "El backend rechazó el catálogo.");
            catalog = { ...catalog, ...(result.catalogo || {}) };
        } catch (error) {
            showMessage("No se pudo guardar el catálogo", error.message);
            return;
        }
        const next = [catalog, ...catalogs];
        if (!writeStorage(CATALOGS_KEY, next)) return;
        catalogs = next;
        renderCatalogs();
        updateDashboard();
        closeModal(ui.catalogModal);
        ui.catalogForm.reset();
        showMessage("Catálogo creado", "Se guardó en el servidor.");
    }

    document.querySelectorAll(".nav-item[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            const section = button.dataset.section;
            document.querySelectorAll(".admin-section").forEach(item => item.classList.toggle("active", item.id === `section-${section}`));
            document.querySelectorAll(".nav-item[data-section]").forEach(item => item.classList.toggle("active", item === button));
            ui.title.textContent = button.innerText.trim();
            closeSidebar();
        });
    });

    document.querySelectorAll("[data-open-section]").forEach(button => {
        button.addEventListener("click", () => document.querySelector(`.nav-item[data-section="${button.dataset.openSection}"]`)?.click());
    });

    byId("menuToggle").addEventListener("click", () => {
        ui.sidebar.classList.add("open");
        ui.overlay.classList.add("active");
    });
    byId("sidebarClose").addEventListener("click", closeSidebar);
    ui.overlay.addEventListener("click", closeSidebar);

    ["newProjectButton", "emptyNewProject"].forEach(id => byId(id)?.addEventListener("click", () => {
        resetProjectForm();
        openModal(ui.projectModal);
    }));
    ["newCatalogButton", "emptyNewCatalog"].forEach(id => byId(id)?.addEventListener("click", () => openModal(ui.catalogModal)));
    document.querySelectorAll("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => closeModal(byId(button.dataset.closeModal)));
    });
    document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", event => {
        if (event.target === modal) closeModal(modal);
    }));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal.active").forEach(closeModal);
            closeSidebar();
        }
    });
    byId("messageClose").addEventListener("click", () => ui.message.classList.remove("show"));

    ui.projectFolder.addEventListener("input", () => {
        const safe = ui.projectFolder.value.trim().replace(/[^A-Za-z0-9_-]/g, "");
        if (safe !== ui.projectFolder.value) ui.projectFolder.value = safe;
        ui.folderPreview.textContent = safe || "nombre-carpeta";
    });
    ui.projectImage.addEventListener("change", () => {
        renderMediaPreview(ui.projectImagePreview, ui.projectImage.files?.[0], "image");
    });
    ui.projectVideo.addEventListener("change", () => {
        renderMediaPreview(ui.projectVideoPreview, ui.projectVideo.files?.[0], "video");
    });
    ui.projectForm.addEventListener("submit", saveProject);
    ui.catalogForm.addEventListener("submit", saveCatalog);

    ui.projectRows.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        if (button.dataset.action === "new-project") {
            resetProjectForm();
            openModal(ui.projectModal);
        } else if (button.dataset.action === "edit-project") {
            editProject(button.dataset.id);
        } else if (button.dataset.action === "delete-project" && window.confirm("¿Eliminar este proyecto del catálogo?")) {
            const deleteProject = async () => {
                if (backendProjectIds.has(button.dataset.id)) {
                    try {
                        const response = await fetch(`${API_BASE}/proyectos/${button.dataset.id}`, { method: "DELETE" });
                        if (!response.ok) throw new Error(`El backend respondió HTTP ${response.status}.`);
                        backendProjectIds.delete(button.dataset.id);
                    } catch (error) {
                        showMessage("No se pudo eliminar", "El proyecto sigue en el servidor. " + error.message);
                        return;
                    }
                }
                const next = projects.filter(project => String(project.id) !== button.dataset.id);
                if (writeStorage(PROJECTS_KEY, next)) {
                    projects = next;
                    renderProjects();
                    updateDashboard();
                    showMessage("Proyecto eliminado", "Se quitó del catálogo.");
                }
            };
            deleteProject();
        }
    });

    ui.catalogGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (button?.dataset.action === "new-catalog") openModal(ui.catalogModal);
        if (button?.dataset.action === "delete-catalog" && window.confirm("¿Eliminar este catálogo?")) {
            const next = catalogs.filter(catalog => String(catalog.id) !== button.dataset.id);
            if (writeStorage(CATALOGS_KEY, next)) {
                catalogs = next;
                renderCatalogs();
                updateDashboard();
            }
        }
    });

    document.querySelectorAll(".filter-button[data-filter]").forEach(button => button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll(".filter-button").forEach(item => item.classList.toggle("active", item === button));
        renderProjects();
    }));

    byId("modeButton").addEventListener("click", () => {
        const light = document.body.classList.toggle("light-mode");
        localStorage.setItem("iru-codex-mode", light ? "light" : "dark");
        ui.modeIcon.textContent = light ? "☀" : "☾";
    });
    if (localStorage.getItem("iru-codex-mode") === "light") {
        document.body.classList.add("light-mode");
        ui.modeIcon.textContent = "☀";
    }

    applySettings(readStorage(SETTINGS_KEY, {}));
    byId("saveSettings").addEventListener("click", async () => {
        const next = { ...readStorage(SETTINGS_KEY, {}), nombre_sitio: byId("siteName").value.trim(), profesion: byId("siteProfession").value.trim(), descripcion: byId("siteDescription").value.trim() };
        let savedToBackend = false;
        try {
            const response = await fetch(`${API_BASE}/configuracion`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(next)
            });
            if (!response.ok) throw new Error(`El backend respondió HTTP ${response.status}.`);
            savedToBackend = true;
        } catch (error) {
            console.warn("Configuración guardada solo localmente.", error);
        }
        if (writeStorage(SETTINGS_KEY, next)) {
            showMessage("Configuración guardada", savedToBackend ? "Los cambios se guardaron en el servidor." : "Los cambios se guardaron en este navegador.");
        }
    });
    byId("saveWhatsapp").addEventListener("click", async () => {
        const next = { ...readStorage(SETTINGS_KEY, {}), whatsapp: byId("whatsappLink").value.trim() };
        let savedToBackend = false;
        try {
            const response = await fetch(`${API_BASE}/configuracion`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(next)
            });
            if (!response.ok) throw new Error(`El backend respondió HTTP ${response.status}.`);
            savedToBackend = true;
        } catch (error) {
            console.warn("Enlace guardado solo localmente.", error);
        }
        if (writeStorage(SETTINGS_KEY, next)) {
            showMessage("Enlace guardado", savedToBackend ? "Se guardó en el servidor." : "Se guardó en este navegador.");
        }
    });
    byId("premiumCodeForm").addEventListener("submit", event => {
        event.preventDefault();
        showMessage("Backend requerido", "La generación de códigos premium necesita el servicio backend.");
    });

    renderProjects();
    renderCatalogs();
    updateDashboard();
    loadVisits();
    loadSettings();

    Promise.all([
        fetch(`${API_BASE}/admin/proyectos`).then(response => {
            if (!response.ok) throw new Error("No se pudieron cargar los proyectos del servidor.");
            return response.json();
        }),
        fetch(`${API_BASE}/admin/catalogos`).then(response => {
            if (!response.ok) throw new Error("No se pudieron cargar los catálogos del servidor.");
            return response.json();
        })
    ]).then(([projectData, catalogData]) => {
        const remoteProjects = Array.isArray(projectData.proyectos) ? projectData.proyectos : [];
        const remoteCatalogs = Array.isArray(catalogData.catalogos) ? catalogData.catalogos : [];
        backendProjectIds = new Set(remoteProjects.map(project => String(project.id)));
        projects = remoteProjects;
        catalogs = remoteCatalogs;
        renderProjects();
        renderCatalogs();
        updateDashboard();
    }).catch(error => {
        console.info("Se muestran los datos guardados en este navegador.", error.message);
    });
});