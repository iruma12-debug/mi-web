/* ============================================================
   IRUCODEX — JAVASCRIPT PRINCIPAL
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "http://localhost:3100/api";

    /* ========================================================
       ELEMENTOS
       ======================================================== */

    const templatesButton = document.getElementById("templatesButton");
    const customLinkButton = document.getElementById("customLinkButton");
    const groupButton = document.getElementById("groupButton");

    const notificationOverlay =
        document.getElementById("notificationOverlay");

    const notificationClose =
        document.getElementById("notificationClose");

    const notificationContinue =
        document.getElementById("notificationContinue");

    const tiktokLink =
        document.getElementById("tiktokLink");

    const whatsappLink =
        document.getElementById("whatsappLink");

    const brandName =
        document.querySelector(".brand-name");

    const profession =
        document.querySelector(".profession");


    /* ========================================================
       CONFIGURACIÓN DE ENLACES
       ======================================================== */

    /*
       CAMBIA ESTOS ENLACES POR LOS TUYOS
    */

    const LINKS = {

        tiktok: "#",

        whatsapp:
            "https://chat.whatsapp.com/EHKmkOGGV0y4pyTG0xatST?s=cl&p=a&mlu=4&ilr=4",

        templates:
            "interfaz-web/index.html",

        customLink:
            "personalizado/personalizado.html",

        whatsappPage:
            "pages/whatsapp.html"
    };


    async function connectToBackend() {
        try {
            const [configResponse, visitResponse] = await Promise.all([
                fetch(`${API_BASE}/configuracion`),
                fetch(`${API_BASE}/visitas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pagina: window.location.pathname }),
                    keepalive: true
                })
            ]);

            if (!configResponse.ok) {
                throw new Error("No se pudo cargar la configuración pública.");
            }

            const responseData = await configResponse.json();
            const config = responseData.configuracion;

            if (config) {
                const siteName = config.nombre_sitio || "IruCodex";
                const siteProfession = config.profesion || "Ingeniero De Software";
                const siteDescription = config.descripcion || "";

                if (brandName) brandName.textContent = siteName;
                if (profession) profession.textContent = siteProfession;

                document.title = `${siteName} | ${siteProfession}`;

                const descriptionMeta = document.querySelector('meta[name="description"]');
                if (descriptionMeta && siteDescription) {
                    descriptionMeta.content = siteDescription;
                }

                if (config.whatsapp) {
                    LINKS.whatsapp = config.whatsapp;
                    whatsappLink?.setAttribute("href", config.whatsapp);
                }
            }

            if (!visitResponse.ok) {
                console.warn("No se pudo registrar la visita en el backend.");
            }
        } catch (error) {
            console.warn("Backend no disponible; se conserva el contenido local.", error);
        }
    }


    connectToBackend();


    /* ========================================================
       UTILIDADES
       ======================================================== */

    function navigateTo(url) {

        if (!url || url === "#") {
            return;
        }

        window.location.href = url;
    }


    /* ========================================================
       NOTIFICACIÓN
       ======================================================== */

    function openNotification() {

        if (!notificationOverlay) {
            return;
        }

        notificationOverlay.classList.add("active");

        notificationOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "notification-open"
        );

        /*
           Evita que la página se desplace
           mientras la notificación está abierta.
        */
        document.body.style.overflow = "hidden";

    }


    function closeNotification() {

        if (!notificationOverlay) {
            return;
        }

        notificationOverlay.classList.remove("active");

        notificationOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "notification-open"
        );

        document.body.style.overflow = "";

    }


    /* ========================================================
       BOTÓN — PLANTILLAS
       ======================================================== */

    if (templatesButton) {

        templatesButton.addEventListener(
            "click",
            () => {

                /*
                   Primero mostramos el mensaje.
                */

                openNotification();

            }
        );

    }


    /* ========================================================
       CONTINUAR — PLANTILLAS
       ======================================================== */

    if (notificationContinue) {

        notificationContinue.addEventListener(
            "click",
            () => {

                closeNotification();

                /*
                   Pequeño retraso para que
                   la animación de cierre se vea.
                */

                setTimeout(() => {

                    navigateTo(
                        LINKS.templates
                    );

                }, 180);

            }
        );

    }


    /* ========================================================
       CERRAR NOTIFICACIÓN
       ======================================================== */

    if (notificationClose) {

        notificationClose.addEventListener(
            "click",
            () => {

                closeNotification();

            }
        );

    }


    /* ========================================================
       CERRAR HACIENDO CLICK FUERA
       ======================================================== */

    if (notificationOverlay) {

        notificationOverlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    notificationOverlay
                ) {

                    closeNotification();

                }

            }
        );

    }


    /* ========================================================
       TECLA ESC
       ======================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                notificationOverlay &&
                notificationOverlay.classList.contains("active")
            ) {

                closeNotification();

            }

        }
    );


    /* ========================================================
       BOTÓN — LINK PERSONALIZADO
       ======================================================== */

    if (customLinkButton) {

        customLinkButton.addEventListener(
            "click",
            () => {

                window.alert(
                    "Este apartado se encuentra en mantenimiento. Por favor, no ingreses por ahora."
                );

            }
        );

    }


    /* ========================================================
       BOTÓN — WHATSAPP
       ======================================================== */

    if (groupButton) {

        groupButton.addEventListener(
            "click",
            () => {

                if (LINKS.whatsapp && LINKS.whatsapp !== "#") {
                    window.open(
                        LINKS.whatsapp,
                        "_blank",
                        "noopener,noreferrer"
                    );
                    return;
                }

                navigateTo(LINKS.whatsappPage);

            }
        );

    }


    /* ========================================================
       TIKTOK
       ======================================================== */

    if (tiktokLink) {

        tiktokLink.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                if (
                    LINKS.tiktok &&
                    LINKS.tiktok !== "#"
                ) {

                    window.open(
                        LINKS.tiktok,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }

            }
        );

    }


    /* ========================================================
       WHATSAPP SOCIAL
       ======================================================== */

    if (whatsappLink) {

        whatsappLink.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                if (
                    LINKS.whatsapp &&
                    LINKS.whatsapp !== "#"
                ) {

                    window.open(
                        LINKS.whatsapp,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }

            }
        );

    }


    /* ========================================================
       EFECTO DE ENTRADA
       ======================================================== */

    document.body.classList.add(
        "page-loaded"
    );


    /* ========================================================
       MICRO INTERACCIÓN DE BOTONES
       ======================================================== */

    const buttons = document.querySelectorAll(
        ".action-button"
    );

    buttons.forEach((button) => {

        button.addEventListener(
            "mousedown",
            () => {

                button.classList.add(
                    "button-pressed"
                );

            }
        );

        button.addEventListener(
            "mouseup",
            () => {

                button.classList.remove(
                    "button-pressed"
                );

            }
        );

        button.addEventListener(
            "mouseleave",
            () => {

                button.classList.remove(
                    "button-pressed"
                );

            }
        );

    });


    /* ========================================================
       PREVENIR DOBLE CLICK ACCIDENTAL
       ======================================================== */

    let navigating = false;

    function safeNavigate(url) {

        if (navigating) {
            return;
        }

        if (!url || url === "#") {
            return;
        }

        navigating = true;

        navigateTo(url);

    }


    /* ========================================================
       CONSOLA
       ======================================================== */

    console.log(
        "%cIruCodex",
        "font-size: 22px; font-weight: 800;"
    );

    console.log(
        "%cIngeniero De Software 🧑‍💻",
        "font-size: 13px;"
    );

    console.log(
        "%cSistema cargado correctamente.",
        "font-size: 12px;"
    );

});