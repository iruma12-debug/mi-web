const WHATSAPP_URL =
    "https://wa.me/51959322255?text=Hola%2C%20ya%20realic%C3%A9%20el%20pago%20de%20mi%20proyecto%20Premium.%20Adjunto%20la%20captura%20del%20pago%20para%20solicitar%20mi%20c%C3%B3digo%20de%20acceso.%20Gracias.";

const qrImage = document.querySelector(".qr-wrap img");
const downloadButton = document.createElement("a");

downloadButton.className = "download-button";
downloadButton.href = qrImage.src;
downloadButton.download = "qr-yape.jpeg";
downloadButton.textContent = "Descargar QR";
qrImage.closest(".qr-wrap").insertAdjacentElement("afterend", downloadButton);

const premiumCodeInput = document.querySelector("#premium-code-input");
const premiumCodeButton = document.querySelector("#premium-code-button");
const premiumCodeMessage = document.querySelector("#premium-code-message");
const premiumProjectId = new URLSearchParams(window.location.search).get("proyecto_id");
const premiumProjectView = document.querySelector("#premium-project-view");
const premiumProjectFrame = document.querySelector("#premium-project-frame");
const premiumProjectBack = document.querySelector("#premium-project-back");
const paymentCard = document.querySelector(".card");
const API_BASE = "/api";

premiumCodeButton.addEventListener("click", async () => {
    const premiumCode = premiumCodeInput.value.trim();

    if (!premiumCode) {
        premiumCodeMessage.textContent = "Ingresa tu código Premium para continuar.";
        premiumCodeMessage.style.color = "#ffadad";
        premiumCodeInput.focus();
        return;
    }

    if (!premiumProjectId) {
        premiumCodeMessage.textContent = "No se pudo identificar el proyecto Premium.";
        premiumCodeMessage.style.color = "#ffadad";
        return;
    }

    premiumCodeButton.disabled = true;
    premiumCodeButton.textContent = "Verificando...";
    premiumCodeMessage.textContent = "Comprobando el código...";
    premiumCodeMessage.style.color = "#c4c4d0";

    try {
        const response = await fetch(`${API_BASE}/premium/verificar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigo: premiumCode,
                proyecto_id: Number(premiumProjectId)
            })
        });
        const result = await response.json();

        if (!response.ok || !result.acceso) {
            throw new Error(result.mensaje || "El código no es válido para este proyecto.");
        }

        if (!result.vista_html) {
            throw new Error("No se pudo preparar el proyecto.");
        }

        premiumProjectFrame.srcdoc = result.vista_html;

        paymentCard.hidden = true;
        premiumProjectView.hidden = false;
        document.body.classList.add("premium-project-open");
        document.title = `${result.proyecto || "Proyecto"} | Acceso Premium`;
    } catch (error) {
        premiumCodeMessage.textContent = error.message || "No se pudo verificar el código. Inténtalo nuevamente.";
        premiumCodeMessage.style.color = "#ffadad";
        premiumCodeButton.disabled = false;
        premiumCodeButton.textContent = "Ingresar Código Premium";
    }
});

premiumProjectBack.addEventListener("click", () => {
    premiumProjectFrame.srcdoc = "";
    premiumProjectFrame.removeAttribute("src");
    premiumProjectView.hidden = true;
    paymentCard.hidden = false;
    document.body.classList.remove("premium-project-open");
    document.title = "Acceso Premium";
});

function abrirWhatsApp() {
    window.open(WHATSAPP_URL, "_blank");
}