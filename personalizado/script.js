/* =========================================================
   IRU CODEX - PERSONALIZADOS
   JAVASCRIPT
   ========================================================= */

"use strict";

/* =========================================================
   ELEMENTOS
   ========================================================= */

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-box h2");
const modalDescription = document.querySelector(".modal-box > p");

/* =========================================================
   INFORMACIÓN DE PROYECTOS
   ========================================================= */

const proyectos = {

    "Dedicatoria Animada": {
        titulo: "Dedicatoria Animada",
        descripcion: "Crea una página especial con animaciones, mensajes y efectos.",
        opciones: [
            "Crear nueva dedicatoria",
            "Personalizar diseño",
            "Agregar música",
            "Agregar animaciones"
        ]
    },

    "Invitación Digital": {
        titulo: "Invitación Digital",
        descripcion: "Crea una invitación digital personalizada para compartir mediante un enlace.",
        opciones: [
            "Crear nueva invitación",
            "Elegir diseño",
            "Agregar información",
            "Generar enlace"
        ]
    },

    "Landing Premium": {
        titulo: "Landing Premium",
        descripcion: "Diseña una página moderna para presentar tu proyecto o negocio.",
        opciones: [
            "Crear Landing",
            "Personalizar colores",
            "Agregar contenido",
            "Vista previa"
        ]
    },

    "Sorpresa Digital": {
        titulo: "Sorpresa Digital",
        descripcion: "Crea una experiencia interactiva para sorprender a otra persona.",
        opciones: [
            "Crear sorpresa",
            "Agregar mensaje",
            "Agregar imágenes",
            "Agregar animaciones"
        ]
    },

    "Proyecto Personal": {
        titulo: "Proyecto Personal",
        descripcion: "Empieza un proyecto completamente personalizado desde cero.",
        opciones: [
            "Crear proyecto",
            "Elegir estructura",
            "Editar contenido",
            "Personalizar diseño"
        ]
    }

};


/* =========================================================
   ABRIR MODAL
   ========================================================= */

function openModal(nombreProyecto) {

    if (!modal) {
        console.error("No se encontró el modal.");
        return;
    }

    const proyecto = proyectos[nombreProyecto];

    if (!proyecto) {
        console.error("Proyecto no encontrado:", nombreProyecto);
        return;
    }

    modalTitle.textContent = proyecto.titulo;

    modalDescription.textContent = proyecto.descripcion;

    const opciones = document.querySelector(".modal-options");

    if (opciones) {

        opciones.innerHTML = "";

        proyecto.opciones.forEach((opcion, index) => {

            const elemento = document.createElement("div");

            elemento.className = "option";

            elemento.innerHTML = `
                <span>${index + 1}.</span>
                ${opcion}
            `;

            elemento.addEventListener("click", function () {
                seleccionarOpcion(
                    proyecto.titulo,
                    opcion
                );
            });

            opciones.appendChild(elemento);

        });

    }

    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function closeModal() {

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    document.body.style.overflow = "";
}


/* =========================================================
   SELECCIONAR OPCIÓN
   ========================================================= */

function seleccionarOpcion(proyecto, opcion) {

    console.log("Proyecto:", proyecto);
    console.log("Opción seleccionada:", opcion);

    /*
       Aquí posteriormente podremos conectar
       cada opción con tu sistema real de creación.
    */

    if (opcion === "Crear nueva dedicatoria") {

        iniciarProyecto("dedicatoria");

    } else if (opcion === "Crear nueva invitación") {

        iniciarProyecto("invitacion");

    } else if (opcion === "Crear Landing") {

        iniciarProyecto("landing");

    } else if (opcion === "Crear sorpresa") {

        iniciarProyecto("sorpresa");

    } else if (opcion === "Crear proyecto") {

        closeModal();
        alert("Este apartado se encuentra en mantenimiento. Por favor, no ingreses por ahora.");

    } else {

        mostrarMensaje(
            "Esta función estará disponible próximamente."
        );

    }

}


/* =========================================================
   INICIAR PROYECTO
   ========================================================= */

function iniciarProyecto(tipo) {

    console.log("Iniciando proyecto:", tipo);

    closeModal();

    /*
       Por ahora mostramos un mensaje.
       Después podemos conectar esto con:

       /personalizado/editor.html
       /personalizado/dedicatoria.html
       /personalizado/invitacion.html

       o con tu backend de Iru Codex.
    */

    mostrarMensaje(
        "Preparando tu proyecto..."
    );

}


/* =========================================================
   MENSAJE TEMPORAL
   ========================================================= */

function mostrarMensaje(texto) {

    const mensajeAnterior =
        document.querySelector(".iru-message");

    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }

    const mensaje = document.createElement("div");

    mensaje.className = "iru-message";

    mensaje.textContent = texto;

    mensaje.style.position = "fixed";
    mensaje.style.left = "50%";
    mensaje.style.bottom = "25px";
    mensaje.style.transform = "translateX(-50%)";
    mensaje.style.zIndex = "9999";
    mensaje.style.padding = "12px 18px";
    mensaje.style.borderRadius = "12px";
    mensaje.style.background = "#0a1929";
    mensaje.style.border = "1px solid rgba(40,150,255,.3)";
    mensaje.style.color = "#ffffff";
    mensaje.style.fontSize = "12px";
    mensaje.style.boxShadow = "0 10px 35px rgba(0,0,0,.4)";

    document.body.appendChild(mensaje);

    setTimeout(function () {

        mensaje.style.opacity = "0";
        mensaje.style.transition = "opacity .3s ease";

        setTimeout(function () {

            mensaje.remove();

        }, 300);

    }, 1800);

}


/* =========================================================
   CERRAR AL HACER CLICK FUERA DEL MODAL
   ========================================================= */

if (modal) {

    modal.addEventListener("click", function (evento) {

        if (evento.target === modal) {
            closeModal();
        }

    });

}


/* =========================================================
   CERRAR CON ESC
   ========================================================= */

document.addEventListener("keydown", function (evento) {

    if (evento.key === "Escape") {
        closeModal();
    }

});


/* =========================================================
   BOTONES DE PROYECTOS
   ========================================================= */

document.querySelectorAll(".button").forEach(function (boton) {

    boton.addEventListener("click", function () {

        const tarjeta = boton.closest(".project");

        if (!tarjeta) {
            return;
        }

        const titulo = tarjeta.querySelector("h3");

        if (!titulo) {
            return;
        }

        openModal(titulo.textContent.trim());

    });

});


/* =========================================================
   INICIO
   ========================================================= */

console.log("=================================");
console.log("       IRU CODEX");
console.log("   Personalizados cargado");
console.log("=================================");