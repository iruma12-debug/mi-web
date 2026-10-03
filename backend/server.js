const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const multer = require("multer");
const postcss = require("postcss");
const postcssImport = require("postcss-import");
const postcssUrl = require("postcss-url");

const app = express();
const PORT = Number(process.env.PORT) || 3100;
const premiumDownloadTokens = new Map();

// ==========================================
// CONFIGURACIÓN
// ==========================================

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ==========================================
// CARPETAS
// ==========================================

const dbFolder = path.join(__dirname, "db");
const uploadsFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder, { recursive: true });
}

app.use("/uploads", express.static(uploadsFolder));

// ==========================================
// INTERFAZ WEB
// ==========================================
const frontendFolder = path.resolve(__dirname, "..");

app.use("/backend", (req, res) => {
    res.sendStatus(404);
});
app.use(express.static(frontendFolder));

const videoExtensions = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov"
};

const uploadProjectVideo = multer({
    storage: multer.diskStorage({
        destination: uploadsFolder,
        filename: (req, file, callback) => {
            const extension = videoExtensions[file.mimetype];
            const uniqueName = `project-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
            callback(null, uniqueName);
        }
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!videoExtensions[file.mimetype]) {
            callback(new Error("Solo se aceptan videos MP4, WebM o MOV."));
            return;
        }

        callback(null, true);
    }
});

const imageExtensions = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp"
};

const uploadProjectImage = multer({
    storage: multer.diskStorage({
        destination: uploadsFolder,
        filename: (req, file, callback) => {
            const extension = imageExtensions[file.mimetype];
            const uniqueName = `project-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
            callback(null, uniqueName);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!imageExtensions[file.mimetype]) {
            callback(new Error("Solo se aceptan imágenes PNG, JPG o WEBP."));
            return;
        }

        callback(null, true);
    }
});

// ==========================================
// BASE DE DATOS SQLITE
// ==========================================

const dbPath = path.join(dbFolder, "catalogo.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

console.log("✓ Base de datos conectada");

// ==========================================
// TABLA PROYECTOS
// ==========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS proyectos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'gratis',
        categoria TEXT NOT NULL DEFAULT 'todos',
        descripcion TEXT DEFAULT '',
        enlace TEXT DEFAULT '',
        imagen TEXT DEFAULT '',
        video TEXT DEFAULT '',
        codigo_html TEXT DEFAULT '',
        publicado INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

const projectColumns = db.pragma("table_info(proyectos)");
if (!projectColumns.some(column => column.name === "video")) {
    db.exec("ALTER TABLE proyectos ADD COLUMN video TEXT DEFAULT ''");
}

// ==========================================
// TABLA CATÁLOGOS
// ==========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS catalogos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT DEFAULT '',
        categoria TEXT DEFAULT 'todos',
        publicado INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// ==========================================
// TABLA CÓDIGOS PREMIUM
// ==========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS codigos_premium (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        proyecto_id INTEGER NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
    )
`);

// ==========================================
// TABLA CONFIGURACIÓN
// ==========================================

db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        nombre_sitio TEXT DEFAULT 'Iru Codex',
        profesion TEXT DEFAULT 'Ingeniero De Software',
        descripcion TEXT DEFAULT '',
        whatsapp TEXT DEFAULT ''
    )
`);

const configExists = db
    .prepare("SELECT id FROM configuracion WHERE id = 1")
    .get();

if (!configExists) {
    db.prepare(`
        INSERT INTO configuracion
        (
            id,
            nombre_sitio,
            profesion,
            descripcion,
            whatsapp
        )
        VALUES (1, ?, ?, ?, ?)
    `).run(
        "Iru Codex",
        "Ingeniero De Software",
        "Explora códigos desarrollados con HTML modernos y creativos con animaciones efectos visuales y diseños interactivos",
        ""
    );
}

// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendFolder, "index.html"));
});

// ==========================================
// PROYECTOS PÚBLICOS
// ==========================================

app.get("/api/proyectos", (req, res) => {
    try {

        const proyectos = db.prepare(`
            SELECT *
            FROM proyectos
            WHERE publicado = 1
            ORDER BY id DESC
        `).all();

        res.json({
            ok: true,
            proyectos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudieron obtener los proyectos"
        });

    }
});

// ==========================================
// PROYECTOS PARA ADMIN
// ==========================================

app.get("/api/admin/proyectos", (req, res) => {
    try {

        const proyectos = db.prepare(`
            SELECT *
            FROM proyectos
            ORDER BY id DESC
        `).all();

        res.json({
            ok: true,
            proyectos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudieron obtener los proyectos"
        });

    }
});

function getProjectFolder(project) {
    const match = String(project.enlace || "")
        .replace(/\\/g, "/")
        .match(/(?:^|\/)admin\/proyectohtml\/([A-Za-z0-9_-]+)\/index\.html(?:[?#].*)?$/i);

    if (!match) return null;

    const projectsRoot = path.resolve(
        __dirname,
        "..",
        "interfaz-web",
        "admin",
        "proyectohtml"
    );
    const folderPath = path.resolve(projectsRoot, match[1]);
    const relativePath = path.relative(projectsRoot, folderPath);
    const entryFile = path.join(folderPath, "index.html");

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath) ||
        !fs.existsSync(entryFile)
    ) {
        return null;
    }

    return { folderPath, entryFile };
}


function resolveLocalResource(rootPath, source) {
    if (!source || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(source)) {
        return null;
    }

    const resourcePath = decodeURIComponent(source.split(/[?#]/, 1)[0])
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");
    const absolutePath = path.resolve(rootPath, resourcePath);
    const relativePath = path.relative(rootPath, absolutePath);

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath) ||
        !fs.existsSync(absolutePath) ||
        !fs.statSync(absolutePath).isFile()
    ) {
        throw new Error(`No se encontró un recurso del proyecto: ${source}`);
    }

    return absolutePath;
}


function mimeTypeFor(filePath) {
    const mimeTypes = {
        ".avif": "image/avif",
        ".gif": "image/gif",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".ogg": "audio/ogg",
        ".ogv": "video/ogg",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".ttf": "font/ttf",
        ".wav": "audio/wav",
        ".webm": "video/webm",
        ".webp": "image/webp",
        ".woff": "font/woff",
        ".woff2": "font/woff2"
    };

    return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}


async function createStandaloneProjectHtml(project) {
    const folder = getProjectFolder(project);
    let html = folder
        ? await fs.promises.readFile(folder.entryFile, "utf8")
        : String(project.codigo_html || "").trim();

    if (!html && project.enlace) {
        const { load } = await import("cheerio");
        const $ = load("<!doctype html><html lang=\"es\"><head></head><body></body></html>");
        $("head").append($("<title>").text(project.nombre || "Proyecto"));
        $("body").append(
            $("<p>").append(
                $("<a>")
                    .attr({ href: project.enlace, rel: "noopener noreferrer" })
                    .text(`Abrir ${project.nombre || "proyecto"}`)
            )
        );
        html = $.html();
    }

    if (!html) {
        throw new Error("Este proyecto no tiene contenido HTML para descargar.");
    }

    const { load } = await import("cheerio");
    const $ = load(html, { decodeEntities: false });

    if (folder) {
        const processCss = async (css, cssPath) => {
            const plugins = [
                postcssImport({ root: folder.folderPath }),
                postcssUrl({
                    url: "inline",
                    basePath: folder.folderPath,
                    maxSize: Infinity
                })
            ];
            const result = await postcss(plugins).process(css, { from: cssPath });
            return result.css;
        };

        for (const link of $("link[rel~=stylesheet][href]").toArray()) {
            const href = $(link).attr("href");
            if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href || "")) continue;

            const cssPath = resolveLocalResource(folder.folderPath, href);
            const css = await fs.promises.readFile(cssPath, "utf8");
            const style = $("<style>").text(await processCss(css, cssPath));
            const media = $(link).attr("media");
            if (media) style.attr("media", media);
            $(link).replaceWith(style);
        }

        for (const element of $("style").toArray()) {
            const cssPath = path.join(folder.folderPath, "index.html");
            $(element).text(await processCss($(element).html() || "", cssPath));
        }

        for (const element of $("script[src], img[src]").toArray()) {
            const source = $(element).attr("src");
            if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(source || "")) continue;
            resolveLocalResource(folder.folderPath, source);
            $(element).attr("inline", "");
        }

        const mediaTags = $("audio[src], video[src], source[src], track[src]").toArray();
        for (const element of mediaTags) {
            const source = $(element).attr("src");
            if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(source || "")) continue;
            const mediaPath = resolveLocalResource(folder.folderPath, source);
            const data = await fs.promises.readFile(mediaPath);
            $(element).attr(
                "src",
                `data:${mimeTypeFor(mediaPath)};base64,${data.toString("base64")}`
            );
        }

        for (const video of $("video[poster]").toArray()) {
            const poster = $(video).attr("poster");
            if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(poster || "")) continue;
            const posterPath = resolveLocalResource(folder.folderPath, poster);
            const data = await fs.promises.readFile(posterPath);
            $(video).attr(
                "poster",
                `data:${mimeTypeFor(posterPath)};base64,${data.toString("base64")}`
            );
        }
    }

    const { inlineSource } = await import("inline-source");
    return inlineSource($.html(), {
        rootpath: folder?.folderPath || __dirname,
        compress: false,
        saveRemote: false,
        swallowErrors: false
    });
}


async function injectProjectDownloadButton(html, projectName, downloadUrl) {
    const { load } = await import("cheerio");
    const $ = load(html, { decodeEntities: false });
    const safeName = String(projectName || "proyecto")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "proyecto";
    const button = $("<a>")
        .attr({
            id: "iru-codex-project-download",
            href: downloadUrl,
            download: `${safeName}.html`,
            "aria-label": "Descargar este proyecto como HTML"
        })
        .text("↓ Descargar HTML");
    const style = $("<style>").text(`
        #iru-codex-project-download {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 2147483647;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            padding: 0 16px;
            border: 1px solid rgba(255,255,255,.65);
            border-radius: 999px;
            background: rgba(10,12,18,.86);
            color: #fff;
            font: 600 14px/1.2 system-ui, sans-serif;
            text-decoration: none;
            box-shadow: 0 4px 18px rgba(0,0,0,.35);
            backdrop-filter: blur(10px);
        }
        #iru-codex-project-download:hover,
        #iru-codex-project-download:focus-visible {
            background: #26734d;
            outline: 2px solid #fff;
            outline-offset: 2px;
        }
        @media (max-width: 480px) {
            #iru-codex-project-download {
                top: 10px;
                right: 10px;
                min-height: 38px;
                padding: 0 12px;
                font-size: 12px;
            }
        }
    `);

    $("#iru-codex-project-download").remove();
    $("head").append(style);
    $("body").append(button);
    return $.html();
}


app.get("/api/proyectos/:id/abrir", async (req, res) => {
    try {
        const project = db.prepare(`
            SELECT id, nombre, tipo, enlace, codigo_html
            FROM proyectos
            WHERE id = ? AND publicado = 1
        `).get(Number(req.params.id));

        if (!project) {
            return res.status(404).send("Proyecto no encontrado.");
        }

        if (String(project.tipo).toLowerCase() === "premium") {
            return res.status(403).send("Este proyecto requiere acceso Premium.");
        }

        const html = await createStandaloneProjectHtml(project);
        const downloadUrl = `${req.protocol}://${req.get("host")}/api/proyectos/${project.id}/descargar`;
        const page = await injectProjectDownloadButton(
            html,
            project.nombre,
            downloadUrl
        );
        res.type("html").send(page);
    } catch (error) {
        console.error("Error abriendo proyecto:", error);
        res.status(500).send("No se pudo abrir el proyecto.");
    }
});


app.get("/api/proyectos/:id/descargar", async (req, res) => {
    try {
        const project = db.prepare(`
            SELECT id, nombre, tipo, publicado, enlace, codigo_html
            FROM proyectos
            WHERE id = ?
        `).get(Number(req.params.id));

        if (!project) {
            return res.status(404).json({
                ok: false,
                error: "Proyecto no encontrado"
            });
        }

        if (String(project.tipo).toLowerCase() === "premium") {
            const grant = premiumDownloadTokens.get(String(req.query.token || ""));
            if (
                !grant ||
                grant.projectId !== project.id ||
                grant.expiresAt <= Date.now()
            ) {
                return res.status(403).json({
                    ok: false,
                    error: "Valida el código Premium antes de descargar este proyecto."
                });
            }
        } else if (Number(project.publicado) !== 1) {
            return res.status(404).json({
                ok: false,
                error: "Proyecto no encontrado"
            });
        }

        const safeName = String(project.nombre || `proyecto-${project.id}`)
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9_-]+/gi, "-")
            .replace(/^-+|-+$/g, "") || `proyecto-${project.id}`;
        const content = await createStandaloneProjectHtml(project);

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeName}.html"`
        );
        return res.send(content);
    } catch (error) {
        console.error("Error preparando descarga del proyecto:", error);
        return res.status(500).json({
            ok: false,
            error: "No se pudo preparar la descarga del proyecto"
        });
    }
});

// ==========================================
// CREAR PROYECTO
// ==========================================

app.post("/api/proyectos/video", (req, res, next) => {
    uploadProjectVideo.single("video")(req, res, error => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "El video no puede superar los 100 MB."
                : error.message;

            res.status(400).json({ ok: false, error: message });
            return;
        }

        next();
    });
}, (req, res) => {
    if (!req.file) {
        res.status(400).json({ ok: false, error: "Selecciona un video para subir." });
        return;
    }

    res.status(201).json({
        ok: true,
        video: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    });
});

app.post("/api/proyectos/imagen", (req, res, next) => {
    uploadProjectImage.single("imagen")(req, res, error => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "La imagen no puede superar los 50 MB."
                : error.message;

            res.status(400).json({ ok: false, error: message });
            return;
        }

        next();
    });
}, (req, res) => {
    if (!req.file) {
        res.status(400).json({ ok: false, error: "Selecciona una imagen para subir." });
        return;
    }

    res.status(201).json({
        ok: true,
        imagen: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    });
});

app.post("/api/proyectos", (req, res) => {
    try {

        const {
            nombre,
            tipo = "gratis",
            categoria = "todos",
            descripcion = "",
            enlace = "",
            imagen = "",
            video = "",
            codigo_html = "",
            publicado = 0
        } = req.body;

        if (!nombre || !nombre.trim()) {

            return res.status(400).json({
                ok: false,
                error: "El nombre del proyecto es obligatorio"
            });

        }

        const resultado = db.prepare(`
            INSERT INTO proyectos
            (
                nombre,
                tipo,
                categoria,
                descripcion,
                enlace,
                imagen,
                video,
                codigo_html,
                publicado
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            nombre.trim(),
            tipo,
            categoria,
            descripcion,
            enlace,
            imagen,
            video,
            codigo_html,
            publicado ? 1 : 0
        );

        const proyecto = db.prepare(`
            SELECT *
            FROM proyectos
            WHERE id = ?
        `).get(resultado.lastInsertRowid);

        res.status(201).json({
            ok: true,
            mensaje: "Proyecto creado correctamente",
            proyecto
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo crear el proyecto"
        });

    }
});

// ==========================================
// EDITAR PROYECTO
// ==========================================

app.put("/api/proyectos/:id", (req, res) => {
    try {

        const id = Number(req.params.id);

        const {
            nombre,
            tipo = "gratis",
            categoria = "todos",
            descripcion = "",
            enlace = "",
            imagen = "",
            video = "",
            codigo_html = "",
            publicado = 0
        } = req.body;

        const existe = db.prepare(`
            SELECT id
            FROM proyectos
            WHERE id = ?
        `).get(id);

        if (!existe) {

            return res.status(404).json({
                ok: false,
                error: "Proyecto no encontrado"
            });

        }

        db.prepare(`
            UPDATE proyectos
            SET
                nombre = ?,
                tipo = ?,
                categoria = ?,
                descripcion = ?,
                enlace = ?,
                imagen = ?,
                video = ?,
                codigo_html = ?,
                publicado = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            nombre,
            tipo,
            categoria,
            descripcion,
            enlace,
            imagen,
            video,
            codigo_html,
            publicado ? 1 : 0,
            id
        );

        const proyecto = db.prepare(`
            SELECT *
            FROM proyectos
            WHERE id = ?
        `).get(id);

        res.json({
            ok: true,
            mensaje: "Proyecto actualizado correctamente",
            proyecto
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo actualizar el proyecto"
        });

    }
});

// ==========================================
// ELIMINAR PROYECTO
// ==========================================

app.delete("/api/proyectos/:id", (req, res) => {
    try {

        const id = Number(req.params.id);

        const eliminarProyecto = db.transaction(() => {
            db.prepare(`
                DELETE FROM codigos_premium
                WHERE proyecto_id = ?
            `).run(id);

            return db.prepare(`
                DELETE FROM proyectos
                WHERE id = ?
            `).run(id);
        });

        const resultado = eliminarProyecto();

        if (resultado.changes === 0) {

            return res.status(404).json({
                ok: false,
                error: "Proyecto no encontrado"
            });

        }

        res.json({
            ok: true,
            mensaje: "Proyecto eliminado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo eliminar el proyecto"
        });

    }
});

// ==========================================
// CATÁLOGOS PÚBLICOS
// ==========================================

app.get("/api/catalogos", (req, res) => {
    try {

        const catalogos = db.prepare(`
            SELECT *
            FROM catalogos
            WHERE publicado = 1
            ORDER BY id DESC
        `).all();

        res.json({
            ok: true,
            catalogos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudieron obtener los catálogos"
        });

    }
});

// ==========================================
// CATÁLOGOS ADMIN
// ==========================================

app.get("/api/admin/catalogos", (req, res) => {
    try {

        const catalogos = db.prepare(`
            SELECT *
            FROM catalogos
            ORDER BY id DESC
        `).all();

        res.json({
            ok: true,
            catalogos
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudieron obtener los catálogos"
        });

    }
});

// ==========================================
// CREAR CATÁLOGO
// ==========================================

app.post("/api/catalogos", (req, res) => {
    try {

        const {
            nombre,
            descripcion = "",
            categoria = "todos",
            publicado = 1
        } = req.body;

        if (!nombre || !nombre.trim()) {

            return res.status(400).json({
                ok: false,
                error: "El nombre del catálogo es obligatorio"
            });

        }

        const resultado = db.prepare(`
            INSERT INTO catalogos
            (
                nombre,
                descripcion,
                categoria,
                publicado
            )
            VALUES (?, ?, ?, ?)
        `).run(
            nombre.trim(),
            descripcion,
            categoria,
            publicado ? 1 : 0
        );

        const catalogo = db.prepare(`
            SELECT *
            FROM catalogos
            WHERE id = ?
        `).get(resultado.lastInsertRowid);

        res.status(201).json({
            ok: true,
            mensaje: "Catálogo creado correctamente",
            catalogo
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo crear el catálogo"
        });

    }
});

// ==========================================
// ELIMINAR CATÁLOGO
// ==========================================

app.delete("/api/catalogos/:id", (req, res) => {
    try {

        const id = Number(req.params.id);

        const resultado = db.prepare(`
            DELETE FROM catalogos
            WHERE id = ?
        `).run(id);

        if (resultado.changes === 0) {

            return res.status(404).json({
                ok: false,
                error: "Catálogo no encontrado"
            });

        }

        res.json({
            ok: true,
            mensaje: "Catálogo eliminado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo eliminar el catálogo"
        });

    }
});

// ==========================================
// REGISTRAR VISITA
// ==========================================

app.post("/api/visitas", (req, res) => {
    try {

        const pagina = req.body.pagina || "/";

        db.prepare(`
            INSERT INTO visitas (pagina)
            VALUES (?)
        `).run(pagina);

        res.json({
            ok: true,
            mensaje: "Visita registrada"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo registrar la visita"
        });

    }
});

// ==========================================
// ESTADÍSTICAS DE VISITAS
// ==========================================

app.get("/api/visitas", (req, res) => {
    try {

        const total = db.prepare(`
            SELECT COUNT(*) AS total
            FROM visitas
        `).get().total;

        const hoy = db.prepare(`
            SELECT COUNT(*) AS total
            FROM visitas
            WHERE date(fecha, 'localtime')
            = date('now', 'localtime')
        `).get().total;

        const mes = db.prepare(`
            SELECT COUNT(*) AS total
            FROM visitas
            WHERE strftime('%Y-%m', fecha, 'localtime')
            = strftime('%Y-%m', 'now', 'localtime')
        `).get().total;

        res.json({
            ok: true,
            total,
            hoy,
            mes
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudieron obtener las visitas"
        });

    }
});

// ==========================================
// CONFIGURACIÓN DEL SITIO
// ==========================================

app.get("/api/configuracion", (req, res) => {
    try {

        const configuracion = db.prepare(`
            SELECT *
            FROM configuracion
            WHERE id = 1
        `).get();

        res.json({
            ok: true,
            configuracion
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo obtener la configuración"
        });

    }
});

// ==========================================
// ACTUALIZAR CONFIGURACIÓN
// ==========================================

app.put("/api/configuracion", (req, res) => {
    try {

        const {
            nombre_sitio = "Iru Codex",
            profesion = "Ingeniero De Software",
            descripcion = "",
            whatsapp = ""
        } = req.body;

        db.prepare(`
            UPDATE configuracion
            SET
                nombre_sitio = ?,
                profesion = ?,
                descripcion = ?,
                whatsapp = ?
            WHERE id = 1
        `).run(
            nombre_sitio,
            profesion,
            descripcion,
            whatsapp
        );

        const configuracion = db.prepare(`
            SELECT *
            FROM configuracion
            WHERE id = 1
        `).get();

        res.json({
            ok: true,
            mensaje: "Configuración actualizada",
            configuracion
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No se pudo actualizar la configuración"
        });

    }
});

app.use((error, req, res, next) => {
    if (!req.path.startsWith("/api/")) {
        next(error);
        return;
    }

    const status = Number(error.status) || 500;
    const message = error.type === "entity.too.large"
        ? "El contenido supera el límite máximo de 50 MB."
        : error.type === "entity.parse.failed"
            ? "La solicitud JSON no es válida."
            : "Error interno del servidor.";

    res.status(status).json({ ok: false, error: message });
});

// ==========================================
// CÓDIGOS PREMIUM - GENERADOR
// ==========================================

// Generar un código Premium único
function generarCodigoPremium() {
    let codigo;

    do {
        const parte1 = crypto.randomBytes(3).toString("hex").toUpperCase();
        const parte2 = crypto.randomBytes(3).toString("hex").toUpperCase();
        const parte3 = crypto.randomBytes(3).toString("hex").toUpperCase();

        codigo = `IRU-${parte1}-${parte2}-${parte3}`;
    } while (
        db.prepare("SELECT id FROM codigos_premium WHERE codigo = ?").get(codigo)
    );

    return codigo;
}

// ==========================================
// GENERAR VARIOS CÓDIGOS PREMIUM
// ==========================================

app.post("/api/admin/codigos-premium/generar", (req, res) => {
    try {
        const { proyecto_id, cantidad } = req.body;

        if (!proyecto_id) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debes seleccionar un proyecto."
            });
        }

        const cantidadNumerica = Number(cantidad);

        if (
            !Number.isInteger(cantidadNumerica) ||
            cantidadNumerica < 1 ||
            cantidadNumerica > 1000
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "La cantidad debe estar entre 1 y 1000."
            });
        }

        // Comprobar que el proyecto existe
        const proyectoId = Number(proyecto_id);
        const proyecto = db.prepare(`
            SELECT id, nombre, tipo
            FROM proyectos
            WHERE id = ?
        `).get(proyectoId);

        if (!proyecto) {
            return res.status(404).json({
                ok: false,
                mensaje: "El proyecto no existe."
            });
        }

        if (String(proyecto.tipo).toLowerCase() !== "premium") {
            return res.status(400).json({
                ok: false,
                mensaje: "Los códigos sólo se pueden generar para proyectos Premium."
            });
        }

        const insertar = db.prepare(`
            INSERT INTO codigos_premium
            (codigo, proyecto_id)
            VALUES (?, ?)
        `);

        const generar = db.transaction(() => {
            const codigos = [];

            for (let i = 0; i < cantidadNumerica; i++) {
                const codigo = generarCodigoPremium();

                insertar.run(
                    codigo,
                    proyectoId
                );

                codigos.push(codigo);
            }

            return codigos;
        });

        const codigosGenerados = generar();

        res.json({
            ok: true,
            mensaje: `${codigosGenerados.length} código(s) Premium generado(s).`,
            proyecto: proyecto.nombre,
            codigos: codigosGenerados
        });

    } catch (error) {
        console.error("Error generando códigos Premium:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error interno al generar los códigos Premium."
        });
    }
});

// ==========================================
// LISTAR CÓDIGOS PREMIUM DISPONIBLES
// ==========================================

app.get("/api/admin/codigos-premium", (req, res) => {
    try {
        const codigos = db.prepare(`
            SELECT
                codigos_premium.id,
                codigos_premium.codigo,
                codigos_premium.proyecto_id,
                proyectos.nombre AS proyecto,
                codigos_premium.fecha_creacion
            FROM codigos_premium
            INNER JOIN proyectos
                ON proyectos.id = codigos_premium.proyecto_id
            WHERE LOWER(proyectos.tipo) = 'premium'
            ORDER BY codigos_premium.id DESC
        `).all();

        res.json({
            ok: true,
            cantidad: codigos.length,
            codigos
        });

    } catch (error) {
        console.error("Error obteniendo códigos Premium:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error obteniendo los códigos Premium."
        });
    }
});

// ==========================================
// VERIFICAR CÓDIGO PREMIUM
// ==========================================

app.post("/api/premium/verificar", async (req, res) => {
    try {
        const { codigo, proyecto_id } = req.body;

        if (!codigo || !proyecto_id) {
            return res.status(400).json({
                ok: false,
                mensaje: "Falta el código o el proyecto."
            });
        }

        const codigoLimpio = String(codigo).trim().toUpperCase();
        const proyectoId = Number(proyecto_id);

        const resultado = db.prepare(`
                SELECT
                    codigos_premium.id,
                    codigos_premium.codigo,
                    codigos_premium.proyecto_id,
                    proyectos.nombre AS proyecto,
                    proyectos.codigo_html,
                    proyectos.enlace
                FROM codigos_premium
                INNER JOIN proyectos
                    ON proyectos.id = codigos_premium.proyecto_id
                WHERE codigos_premium.codigo = ?
                  AND codigos_premium.proyecto_id = ?
                                    AND LOWER(proyectos.tipo) = 'premium'
            `).get(codigoLimpio, proyectoId);

        if (!resultado) {
            return res.status(401).json({
                ok: false,
                acceso: false,
                mensaje: "Código inválido o no corresponde a este proyecto."
            });
        }

        const project = {
            id: resultado.proyecto_id,
            nombre: resultado.proyecto,
            enlace: resultado.enlace,
            codigo_html: resultado.codigo_html
        };
        const standaloneHtml = await createStandaloneProjectHtml(project);
        const token = crypto.randomBytes(32).toString("hex");
        const safeName = String(project.nombre || "proyecto")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9_-]+/gi, "-")
            .replace(/^-+|-+$/g, "") || "proyecto";
        const downloadUrl = `${req.protocol}://${req.get("host")}/api/proyectos/${project.id}/descargar?token=${token}`;
        const projectView = await injectProjectDownloadButton(
            standaloneHtml,
            project.nombre,
            downloadUrl
        );
        const consumedCode = db.prepare(`
            DELETE FROM codigos_premium
            WHERE id = ? AND proyecto_id = ?
        `).run(resultado.id, proyectoId);

        if (consumedCode.changes !== 1) {
            return res.status(401).json({
                ok: false,
                acceso: false,
                mensaje: "El código Premium ya fue utilizado."
            });
        }

        for (const [activeToken, grant] of premiumDownloadTokens) {
            if (grant.expiresAt <= Date.now()) {
                premiumDownloadTokens.delete(activeToken);
            }
        }
        premiumDownloadTokens.set(token, {
            projectId: proyectoId,
            expiresAt: Date.now() + 20 * 60 * 1000
        });

        res.json({
            ok: true,
            acceso: true,
            mensaje: "Código Premium válido.",
            proyecto_id: resultado.proyecto_id,
            proyecto: resultado.proyecto,
            codigo_html: resultado.codigo_html,
            enlace: resultado.enlace,
            vista_html: projectView,
            download_token: token
        });

    } catch (error) {
        console.error("Error verificando código Premium:", error);

        res.status(500).json({
            ok: false,
            mensaje: "Error interno al verificar el código Premium."
        });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("        ✦ IRU CODEX ✦");
    console.log("=================================");
    console.log(`✓ Servidor: http://localhost:${PORT}`);
    console.log("✓ API funcionando");
    console.log("✓ SQLite conectado");
    console.log("=================================");
    console.log("");

});

// ==========================================
// CIERRE LIMPIO
// ==========================================

process.on("SIGINT", () => {

    db.close();

    console.log("\n✓ Base de datos cerrada");

    process.exit(0);

});