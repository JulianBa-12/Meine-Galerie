require("dotenv").config();

const express = require("express");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const app = express();

// ==========================================
// KONFIGURATION
// ==========================================

const PORT = process.env.PORT || 3000;

const PUBLIC_DIR =
    path.join(__dirname, "public");

const UPLOAD_DIR =
    path.join(PUBLIC_DIR, "uploads");

const DATA_FILE =
    path.join(__dirname, "data.json");

const BACKUP_DIR =
    path.join(__dirname, "backups");

const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME || "admin";

const INITIAL_ADMIN_PASSWORD =
    process.env.INITIAL_ADMIN_PASSWORD || "71743";

const SESSION_SECRET =
    process.env.SESSION_SECRET ||
    "meine-galerie-session-secret-2026-aendere-diesen-wert";

// ==========================================
// ORDNER ERSTELLEN
// ==========================================

if (!fs.existsSync(PUBLIC_DIR)) {

    fs.mkdirSync(
        PUBLIC_DIR,
        {
            recursive: true
        }
    );

}

if (!fs.existsSync(UPLOAD_DIR)) {

    fs.mkdirSync(
        UPLOAD_DIR,
        {
            recursive: true
        }
    );

}

if (!fs.existsSync(BACKUP_DIR)) {

    fs.mkdirSync(
        BACKUP_DIR,
        {
            recursive: true
        }
    );

}

// ==========================================
// STANDARD-DATEN
// ==========================================

function createAdminHash() {

    return bcrypt.hashSync(
        INITIAL_ADMIN_PASSWORD,
        12
    );

}

const defaultData = {

    settings: {

        site_name:
            "Meine Galerie",

        hero_title:
            "Willkommen in meiner Galerie",

        hero_text:
            "Entdecke meine schönsten Bilder.",

        about_text:
            "Hier findest du eine Auswahl meiner Bilder.",

        contact_text:
            "Du möchtest mich kontaktieren? Schreib mir gerne.",

        footer_text:
            "© 2026 Meine Galerie"

    },

    categories: [

        {
            id: 1,
            name: "Landschaft",
            slug: "landschaft"
        },

        {
            id: 2,
            name: "Natur",
            slug: "natur"
        },

        {
            id: 3,
            name: "Berge",
            slug: "berge"
        },

        {
            id: 4,
            name: "Sonstiges",
            slug: "sonstiges"
        }

    ],

    gallery: [],

    nextCategoryId: 5,

    nextGalleryId: 1,

    admin: {

        username:
            ADMIN_USERNAME,

        passwordHash:
            createAdminHash()

    }

};

// ==========================================
// DATEN SPEICHERN
// ==========================================

function saveData(dataToSave) {

    fs.writeFileSync(

        DATA_FILE,

        JSON.stringify(
            dataToSave,
            null,
            2
        ),

        "utf8"

    );

}

// ==========================================
// DATEN LADEN
// ==========================================

function loadData() {

    if (
        !fs.existsSync(
            DATA_FILE
        )
    ) {

        const newData =
            JSON.parse(
                JSON.stringify(
                    defaultData
                )
            );

        saveData(
            newData
        );

        return newData;

    }

    try {

        const content =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        if (
            !content.trim()
        ) {

            const newData =
                JSON.parse(
                    JSON.stringify(
                        defaultData
                    )
                );

            saveData(
                newData
            );

            return newData;

        }

        const loaded =
            JSON.parse(
                content
            );

        // ==================================
        // FEHLENDE BEREICHE ABSICHERN
        // ==================================

        loaded.settings =
            loaded.settings || {};

        loaded.categories =
            Array.isArray(
                loaded.categories
            )
                ? loaded.categories
                : [];

        loaded.gallery =
            Array.isArray(
                loaded.gallery
            )
                ? loaded.gallery
                : [];

        // ==================================
        // ADMIN-DATEN
        // ==================================

        if (
            !loaded.admin
        ) {

            loaded.admin = {

                username:
                    ADMIN_USERNAME,

                passwordHash:
                    createAdminHash()

            };

            saveData(
                loaded
            );

        } else {

            if (
                !loaded.admin.username
            ) {

                loaded.admin.username =
                    ADMIN_USERNAME;

            }

            if (
                !loaded.admin.passwordHash
            ) {

                loaded.admin.passwordHash =
                    createAdminHash();

                saveData(
                    loaded
                );

            }

        }

        // ==================================
        // ID-ZÄHLER
        // ==================================

        loaded.nextCategoryId =
            loaded.nextCategoryId ||
            (
                Math.max(
                    0,
                    ...loaded.categories.map(
                        category =>
                            Number(
                                category.id
                            ) || 0
                    )
                ) + 1
            );

        loaded.nextGalleryId =
            loaded.nextGalleryId ||
            (
                Math.max(
                    0,
                    ...loaded.gallery.map(
                        image =>
                            Number(
                                image.id
                            ) || 0
                    )
                ) + 1
            );

        return loaded;

    } catch (error) {

        console.error(
            "Fehler beim Lesen von data.json:",
            error
        );

        const backupData =
            JSON.parse(
                JSON.stringify(
                    defaultData
                )
            );

        saveData(
            backupData
        );

        return backupData;

    }

}

let data =
    loadData();

// ==========================================
// EXPRESS
// ==========================================

app.use(
    express.json(
        {
            limit: "10mb"
        }
    )
);

app.use(
    express.urlencoded(
        {
            extended: true
        }
    )
);

// ==========================================
// SESSION
// ==========================================

app.use(
    session({

        secret:
            SESSION_SECRET,

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            sameSite:
                "lax",

            secure:
                process.env.NODE_ENV === "production",

            maxAge:
                1000 *
                60 *
                60 *
                8

        }

    })
);

// ==========================================
// MULTER
// ==========================================

const storage =
    multer.diskStorage({

        destination:
            (req, file, callback) => {

                callback(
                    null,
                    UPLOAD_DIR
                );

            },

        filename:
            (req, file, callback) => {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();

                const baseName =
                    path
                        .basename(
                            file.originalname,
                            extension
                        )
                        .replace(
                            /[^a-zA-Z0-9äöüÄÖÜß_-]/g,
                            "-"
                        )
                        .replace(
                            /-+/g,
                            "-"
                        )
                        .substring(
                            0,
                            80
                        );

                const timestamp =
                    Date.now();

                const random =
                    Math.round(
                        Math.random() *
                        100000
                    );

                callback(

                    null,

                    `${baseName}-${timestamp}-${random}${extension}`

                );

            }

    });

const upload =
    multer({

        storage,

        limits: {

            fileSize:
                20 *
                1024 *
                1024

        },

        fileFilter:
            (req, file, callback) => {

                const allowed =
                    [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "image/gif"
                    ];

                if (
                    allowed.includes(
                        file.mimetype
                    )
                ) {

                    callback(
                        null,
                        true
                    );

                } else {

                    callback(
                        new Error(
                            "Nur JPG, PNG, WEBP und GIF sind erlaubt."
                        )
                    );

                }

            }

    });

// ==========================================
// BACKUP – DATEN
// ==========================================

function createDataBackup() {

    try {

        if (
            !fs.existsSync(
                DATA_FILE
            )
        ) {

            return;

        }

        const timestamp =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );

        const backupFile =
            path.join(
                BACKUP_DIR,
                `data-${timestamp}.json`
            );

        fs.copyFileSync(
            DATA_FILE,
            backupFile
        );

        cleanupDataBackups();

    } catch (error) {

        console.error(
            "Daten-Backup fehlgeschlagen:",
            error
        );

    }

}

// ==========================================
// BACKUP – BILDER
// ==========================================

function createImageBackup() {

    try {

        if (
            !fs.existsSync(
                UPLOAD_DIR
            )
        ) {

            return;

        }

        const files =
            fs.readdirSync(
                UPLOAD_DIR
            );

        const imageFiles =
            files.filter(
                file =>
                    /\.(jpg|jpeg|png|webp|gif)$/i
                        .test(file)
            );

        if (
            imageFiles.length === 0
        ) {

            return;

        }

        const timestamp =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );

        const backupFolder =
            path.join(
                BACKUP_DIR,
                `images-${timestamp}`
            );

        fs.mkdirSync(
            backupFolder,
            {
                recursive: true
            }
        );

        imageFiles.forEach(
            file => {

                fs.copyFileSync(

                    path.join(
                        UPLOAD_DIR,
                        file
                    ),

                    path.join(
                        backupFolder,
                        file
                    )

                );

            }
        );

        cleanupImageBackups();

    } catch (error) {

        console.error(
            "Bild-Backup fehlgeschlagen:",
            error
        );

    }

}

// ==========================================
// BACKUP – AUFRÄUMEN
// ==========================================

function cleanupDataBackups() {

    try {

        const files =
            fs.readdirSync(
                BACKUP_DIR
            )
            .filter(
                file =>
                    file.startsWith(
                        "data-"
                    ) &&
                    file.endsWith(
                        ".json"
                    )
            )
            .map(
                file => {

                    const fullPath =
                        path.join(
                            BACKUP_DIR,
                            file
                        );

                    return {

                        file,

                        time:
                            fs.statSync(
                                fullPath
                            ).mtimeMs

                    };

                }
            )
            .sort(
                (a, b) =>
                    b.time -
                    a.time
            );

        files
            .slice(30)
            .forEach(
                item => {

                    fs.unlinkSync(
                        path.join(
                            BACKUP_DIR,
                            item.file
                        )
                    );

                }
            );

    } catch (error) {

        console.error(
            "Daten-Backups konnten nicht bereinigt werden:",
            error
        );

    }

}

function cleanupImageBackups() {

    try {

        const folders =
            fs.readdirSync(
                BACKUP_DIR
            )
            .filter(
                file =>
                    file.startsWith(
                        "images-"
                    )
            )
            .map(
                file => {

                    const fullPath =
                        path.join(
                            BACKUP_DIR,
                            file
                        );

                    return {

                        file,

                        time:
                            fs.statSync(
                                fullPath
                            ).mtimeMs

                    };

                }
            )
            .sort(
                (a, b) =>
                    b.time -
                    a.time
            );

        folders
            .slice(1000)
            .forEach(
                item => {

                    fs.rmSync(

                        path.join(
                            BACKUP_DIR,
                            item.file
                        ),

                        {
                            recursive:
                                true,

                            force:
                                true
                        }

                    );

                }
            );

    } catch (error) {

        console.error(
            "Bild-Backups konnten nicht bereinigt werden:",
            error
        );

    }

}

// ==========================================
// ADMIN-SCHUTZ
// ==========================================

function requireAdmin(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.isAdmin
    ) {

        return next();

    }

    return res.status(401).json({

        error:
            "Nicht angemeldet."

    });

}

// ==========================================
// ADMIN-SEITE
// ==========================================

app.get(
    "/admin",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "admin.html"
            )
        );

    }
);

// ==========================================
// ÖFFENTLICHE STATISCHE DATEIEN
// ==========================================

app.use(
    express.static(
        PUBLIC_DIR
    )
);

// ==========================================
// ÖFFENTLICHE WEBSITE-DATEN
// ==========================================

app.get(
    "/api/site",
    (req, res) => {

        data =
            loadData();

        res.json({

            settings:
                data.settings,

            categories:
                data.categories,

            gallery:
                data.gallery.map(
                    image => ({

                        ...image,

                        url:
                            image.url ||
                            `/uploads/${encodeURIComponent(
                                image.filename
                            )}`

                    })
                )

        });

    }
);

// ==========================================
// ÖFFENTLICHE GALERIE
// ==========================================

app.get(
    "/api/gallery/public",
    (req, res) => {

        data =
            loadData();

        res.json(
            data.gallery.map(
                image => ({

                    ...image,

                    url:
                        image.url ||
                        `/uploads/${encodeURIComponent(
                            image.filename
                        )}`

                })
            )
        );

    }
);

// ==========================================
// KATEGORIEN – ÖFFENTLICH
// ==========================================

app.get(
    "/api/categories",
    (req, res) => {

        data =
            loadData();

        res.json(
            data.categories
        );

    }
);

// ==========================================
// KATEGORIE ERSTELLEN
// ==========================================

app.post(
    "/api/categories",
    requireAdmin,
    (req, res) => {

        const name =
            String(
                req.body.name || ""
            ).trim();

        if (!name) {

            return res.status(400).json({

                error:
                    "Kategoriename fehlt."

            });

        }

        const exists =
            data.categories.some(
                category =>
                    category.name
                        .toLowerCase() ===
                    name.toLowerCase()
            );

        if (exists) {

            return res.status(400).json({

                error:
                    "Diese Kategorie existiert bereits."

            });

        }

        createDataBackup();

        const category = {

            id:
                data.nextCategoryId++,

            name:
                name,

            slug:
                name
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9äöüß]+/gi,
                        "-"
                    )
                    .replace(
                        /^-|-$/g,
                        ""
                    )

        };

        data.categories.push(
            category
        );

        saveData(
            data
        );

        res.json(
            category
        );

    }
);

// ==========================================
// KATEGORIE BEARBEITEN
// ==========================================

app.put(
    "/api/categories/:id",
    requireAdmin,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );

        const category =
            data.categories.find(
                item =>
                    Number(
                        item.id
                    ) === id
            );

        if (!category) {

            return res.status(404).json({

                error:
                    "Kategorie nicht gefunden."

            });

        }

        const name =
            String(
                req.body.name || ""
            ).trim();

        if (!name) {

            return res.status(400).json({

                error:
                    "Kategoriename fehlt."

            });

        }

        const duplicate =
            data.categories.some(
                item =>
                    Number(item.id) !== id &&
                    item.name
                        .toLowerCase() ===
                    name.toLowerCase()
            );

        if (duplicate) {

            return res.status(400).json({

                error:
                    "Diese Kategorie existiert bereits."

            });

        }

        createDataBackup();

        category.name =
            name;

        category.slug =
            name
                .toLowerCase()
                .replace(
                    /[^a-z0-9äöüß]+/gi,
                    "-"
                )
                .replace(
                    /^-|-$/g,
                    ""
                );

        saveData(
            data
        );

        res.json(
            category
        );

    }
);

// ==========================================
// KATEGORIE LÖSCHEN
// ==========================================

app.delete(
    "/api/categories/:id",
    requireAdmin,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );

        const index =
            data.categories.findIndex(
                category =>
                    Number(
                        category.id
                    ) === id
            );

        if (index === -1) {

            return res.status(404).json({

                error:
                    "Kategorie nicht gefunden."

            });

        }

        createDataBackup();

        data.categories.splice(
            index,
            1
        );

        saveData(
            data
        );

        res.json({

            success:
                true

        });

    }
);

// ==========================================
// ADMIN GALERIE
// ==========================================

app.get(
    "/api/gallery",
    requireAdmin,
    (req, res) => {

        data =
            loadData();

        res.json(

            data.gallery.map(
                image => ({

                    ...image,

                    url:
                        image.url ||
                        `/uploads/${encodeURIComponent(
                            image.filename
                        )}`

                })
            )

        );

    }
);

// ==========================================
// BILD HOCHLADEN
// ==========================================

app.post(
    "/api/gallery",
    requireAdmin,
    upload.single("image"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                error:
                    "Kein Bild hochgeladen."

            });

        }

        const title =
            String(
                req.body.title || ""
            ).trim();

        const description =
            String(
                req.body.description || ""
            ).trim();

        const categoryId =
            Number(
                req.body.category_id
            );

        const category =
            data.categories.find(
                item =>
                    Number(
                        item.id
                    ) === categoryId
            );

        if (!category) {

            fs.unlinkSync(
                path.join(
                    UPLOAD_DIR,
                    req.file.filename
                )
            );

            return res.status(400).json({

                error:
                    "Ungültige Kategorie."

            });

        }

        const image = {

            id:
                data.nextGalleryId++,

            title:
                title ||
                req.file.originalname,

            description:
                description,

            category_id:
                category.id,

            filename:
                req.file.filename,

            originalName:
                req.file.originalname,

            mimetype:
                req.file.mimetype,

            size:
                req.file.size,

            url:
                `/uploads/${encodeURIComponent(
                    req.file.filename
                )}`,

            createdAt:
                new Date().toISOString()

        };

        data.gallery.push(
            image
        );

        saveData(
            data
        );

        createDataBackup();

        createImageBackup();

        res.json(
            image
        );

    }
);

// ==========================================
// BILD BEARBEITEN
// ==========================================

app.put(
    "/api/gallery/:id",
    requireAdmin,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );

        const image =
            data.gallery.find(
                item =>
                    Number(
                        item.id
                    ) === id
            );

        if (!image) {

            return res.status(404).json({

                error:
                    "Bild nicht gefunden."

            });

        }

        const title =
            req.body.title !== undefined
                ? String(
                    req.body.title
                ).trim()
                : image.title;

        const description =
            req.body.description !== undefined
                ? String(
                    req.body.description
                ).trim()
                : image.description;

        let categoryId =
            image.category_id;

        if (
            req.body.category_id !== undefined
        ) {

            categoryId =
                Number(
                    req.body.category_id
                );

        }

        const category =
            data.categories.find(
                item =>
                    Number(
                        item.id
                    ) === categoryId
            );

        if (!category) {

            return res.status(400).json({

                error:
                    "Ungültige Kategorie."

            });

        }

        createDataBackup();

        image.title =
            title;

        image.description =
            description;

        image.category_id =
            category.id;

        image.url =
            `/uploads/${encodeURIComponent(
                image.filename
            )}`;

        image.updatedAt =
            new Date().toISOString();

        saveData(
            data
        );

        res.json(
            image
        );

    }
);

// ==========================================
// BILD LÖSCHEN
// ==========================================

app.delete(
    "/api/gallery/:id",
    requireAdmin,
    (req, res) => {

        const id =
            Number(
                req.params.id
            );

        const index =
            data.gallery.findIndex(
                item =>
                    Number(
                        item.id
                    ) === id
            );

        if (index === -1) {

            return res.status(404).json({

                error:
                    "Bild nicht gefunden."

            });

        }

        const image =
            data.gallery[index];

        createDataBackup();

        if (
            image.filename
        ) {

            const imagePath =
                path.join(
                    UPLOAD_DIR,
                    image.filename
                );

            if (
                fs.existsSync(
                    imagePath
                )
            ) {

                fs.unlinkSync(
                    imagePath
                );

            }

        }

        data.gallery.splice(
            index,
            1
        );

        saveData(
            data
        );

        res.json({

            success:
                true

        });

    }
);

// ==========================================
// EINSTELLUNGEN
// ==========================================

app.get(
    "/api/settings",
    requireAdmin,
    (req, res) => {

        res.json(
            data.settings
        );

    }
);

app.put(
    "/api/settings",
    requireAdmin,
    (req, res) => {

        createDataBackup();

        const allowedFields = [

            "site_name",
            "hero_title",
            "hero_text",
            "about_text",
            "contact_text",
            "footer_text"

        ];

        for (
            const field of
            allowedFields
        ) {

            if (
                req.body[field] !==
                undefined
            ) {

                data.settings[field] =
                    String(
                        req.body[field]
                    );

            }

        }

        saveData(
            data
        );

        res.json(
            data.settings
        );

    }
);

// ==========================================
// BACKUP-LISTE
// ==========================================

app.get(
    "/api/backups",
    requireAdmin,
    (req, res) => {

        try {

            const files =
                fs.readdirSync(
                    BACKUP_DIR
                );

            const dataBackups =
                files
                    .filter(
                        file =>
                            file.startsWith(
                                "data-"
                            ) &&
                            file.endsWith(
                                ".json"
                            )
                    )
                    .map(
                        file => {

                            const filePath =
                                path.join(
                                    BACKUP_DIR,
                                    file
                                );

                            const stats =
                                fs.statSync(
                                    filePath
                                );

                            return {

                                name:
                                    file,

                                type:
                                    "data",

                                size:
                                    stats.size,

                                createdAt:
                                    stats.mtime
                                        .toISOString()

                            };

                        }
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                b.createdAt
                            ) -
                            new Date(
                                a.createdAt
                            )
                    );

            const imageBackups =
                files
                    .filter(
                        file =>
                            file.startsWith(
                                "images-"
                            )
                    )
                    .map(
                        file => {

                            const folderPath =
                                path.join(
                                    BACKUP_DIR,
                                    file
                                );

                            const stats =
                                fs.statSync(
                                    folderPath
                                );

                            let imageCount =
                                0;

                            if (
                                stats.isDirectory()
                            ) {

                                imageCount =
                                    fs.readdirSync(
                                        folderPath
                                    )
                                    .filter(
                                        image =>
                                            /\.(jpg|jpeg|png|webp|gif)$/i
                                                .test(
                                                    image
                                                )
                                    )
                                    .length;

                            }

                            return {

                                name:
                                    file,

                                type:
                                    "images",

                                imageCount:
                                    imageCount,

                                createdAt:
                                    stats.mtime
                                        .toISOString()

                            };

                        }
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                b.createdAt
                            ) -
                            new Date(
                                a.createdAt
                            )
                    );

            res.json({

                dataBackups:
                    dataBackups,

                imageBackups:
                    imageBackups,

                limits: {

                    data:
                        30,

                    images:
                        1000

                }

            });

        } catch (error) {

            console.error(
                "Backup-Liste konnte nicht geladen werden:",
                error
            );

            res.status(500).json({

                error:
                    "Backup-Liste konnte nicht geladen werden."

            });

        }

    }
);

// ==========================================
// MANUELLES BACKUP
// ==========================================

app.post(
    "/api/backups",
    requireAdmin,
    (req, res) => {

        try {

            createDataBackup();

            createImageBackup();

            res.json({

                success:
                    true,

                message:
                    "Backup wurde erfolgreich erstellt."

            });

        } catch (error) {

            console.error(
                "Manuelles Backup fehlgeschlagen:",
                error
            );

            res.status(500).json({

                error:
                    "Backup konnte nicht erstellt werden."

            });

        }

    }
);

// ==========================================
// LOGIN
// ==========================================

app.post(
    "/api/login",
    async (req, res) => {

        const username =
            String(
                req.body.username || ""
            );

        const password =
            String(
                req.body.password || ""
            );

        data =
            loadData();

        if (
            username !==
            data.admin.username
        ) {

            return res.status(401).json({

                error:
                    "Benutzername oder Passwort falsch."

            });

        }

        try {

            const passwordCorrect =
                await bcrypt.compare(

                    password,

                    data.admin.passwordHash

                );

            if (
                !passwordCorrect
            ) {

                return res.status(401).json({

                    error:
                        "Benutzername oder Passwort falsch."

                });

            }

        } catch (error) {

            console.error(
                "Passwortprüfung fehlgeschlagen:",
                error
            );

            return res.status(500).json({

                error:
                    "Login konnte nicht durchgeführt werden."

            });

        }

        req.session.isAdmin =
            true;

        req.session.username =
            data.admin.username;

        res.json({

            success:
                true,

            message:
                "Login erfolgreich."

        });

    }
);

// ==========================================
// LOGIN STATUS
// ==========================================

app.get(
    "/api/admin/status",
    (req, res) => {

        res.json({

            loggedIn:
                Boolean(
                    req.session &&
                    req.session.isAdmin
                )

        });

    }
);

// ==========================================
// ZUSÄTZLICHER AUTH-STATUS
// ==========================================

app.get(
    "/api/auth/status",
    (req, res) => {

        res.json({

            loggedIn:
                Boolean(
                    req.session &&
                    req.session.isAdmin
                )

        });

    }
);

// ==========================================
// LOGOUT
// ==========================================

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            error => {

                if (error) {

                    console.error(
                        "Logout fehlgeschlagen:",
                        error
                    );

                    return res
                        .status(500)
                        .json({

                            error:
                                "Logout fehlgeschlagen."

                        });

                }

                res.json({

                    success:
                        true

                });

            }
        );

    }
);

// ==========================================
// FEHLERBEHANDLUNG
// ==========================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Serverfehler:",
            error
        );

        if (
            error instanceof
            multer.MulterError
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Upload-Fehler: " +
                        error.message

                });

        }

        res.status(500).json({

            error:
                error.message ||
                "Interner Serverfehler."

        });

    }
);

// ==========================================
// SERVER START
// ==========================================

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "======================================"
        );

        console.log(
            "          MEINE GALERIE"
        );

        console.log(
            "======================================"
        );

        console.log("");

        console.log(
            `Website: http://localhost:${PORT}`
        );

        console.log(
            `Admin:   http://localhost:${PORT}/admin`
        );

        console.log("");

        console.log(
            `Benutzer: ${ADMIN_USERNAME}`
        );

        console.log(
            "Passwort: [nicht angezeigt]"
        );

        console.log("");

        console.log(
            "bcrypt Passwort-Hash: aktiviert"
        );

        console.log(
            "Session-Secret: .env"
        );

        console.log(
            "Daten-Backups: aktiviert"
        );

        console.log(
            "Bild-Backups: aktiviert"
        );

        console.log("");

        console.log(
            "Server läuft..."
        );

        console.log(
            "======================================"
        );

    }
);
