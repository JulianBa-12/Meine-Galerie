"use strict";

// ============================================================
// MEINE GALERIE – ADMIN.JS
// Passend zum aktuellen server.js
// ============================================================


// ============================================================
// STATE
// ============================================================

const state = {
    settings: {},
    categories: [],
    gallery: [],
    currentSection: "dashboard"
};


// ============================================================
// API
// ============================================================

async function api(url, options = {}) {

    const response = await fetch(url, {
        credentials: "same-origin",
        ...options
    });


    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            `Fehler ${response.status}`
        );

    }


    return data;
}


// ============================================================
// HILFSFUNKTIONEN
// ============================================================

function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function showToast(message, type = "success") {

    const toast =
        document.getElementById("toast");

    if (!toast) return;


    toast.textContent = message;

    toast.className =
        `toast ${type}`;


    setTimeout(() => {

        toast.classList.add("hidden");

    }, 3000);

}


// ============================================================
// LOGIN
// ============================================================

async function checkLogin() {

    try {

        const result =
            await api("/api/admin/status");


        if (result.loggedIn) {

            showAdmin();

            await loadData();

        } else {

            showLogin();

        }

    } catch (error) {

        console.error(
            "Login-Status konnte nicht geprüft werden:",
            error
        );

        showLogin();

    }

}


function showLogin() {

    const loginScreen =
        document.getElementById("login-screen");

    const adminApp =
        document.getElementById("admin-app");


    if (loginScreen) {

        loginScreen.classList.remove("hidden");

    }


    if (adminApp) {

        adminApp.classList.add("hidden");

    }

}


function showAdmin() {

    const loginScreen =
        document.getElementById("login-screen");

    const adminApp =
        document.getElementById("admin-app");


    if (loginScreen) {

        loginScreen.classList.add("hidden");

    }


    if (adminApp) {

        adminApp.classList.remove("hidden");

    }

}


function setupLogin() {

    const form =
        document.getElementById("login-form");


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const error =
                document.getElementById(
                    "login-error"
                );


            if (error) {

                error.textContent = "";

            }


            try {

                await api("/api/login", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        username,
                        password

                    })

                });


                showAdmin();

                await loadData();


                if (error) {

                    error.textContent = "";

                }


            } catch (err) {

                console.error(err);


                if (error) {

                    error.textContent =
                        err.message ||
                        "Login fehlgeschlagen.";

                }

            }

        }
    );

}


function setupLogout() {

    const button =
        document.getElementById(
            "logout-button"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            try {

                await api("/api/logout", {
                    method: "POST"
                });


                location.reload();


            } catch (err) {

                showToast(
                    err.message,
                    "error"
                );

            }

        }
    );

}


// ============================================================
// DATEN LADEN
// ============================================================

async function loadData() {

    try {

        const data =
            await api("/api/site");


        state.settings =
            data.settings || {};


        state.categories =
            data.categories || [];


        state.gallery =
            data.gallery || [];


        renderSettings();

        renderStats();

        renderCategorySelects();

        renderGallery();

        renderCategories();


    } catch (err) {

        console.error(err);


        showToast(
            `Daten konnten nicht geladen werden: ${err.message}`,
            "error"
        );

    }

}


// ============================================================
// STATISTIK
// ============================================================

function renderStats() {

    const imageCount =
        document.getElementById(
            "stat-images"
        );


    const categoryCount =
        document.getElementById(
            "stat-categories"
        );


    const uncategorizedCount =
        document.getElementById(
            "stat-uncategorized"
        );


    if (imageCount) {

        imageCount.textContent =
            state.gallery.length;

    }


    if (categoryCount) {

        categoryCount.textContent =
            state.categories.length;

    }


    if (uncategorizedCount) {

        const count =
            state.gallery.filter(
                image =>
                    !image.category_id
            ).length;


        uncategorizedCount.textContent =
            count;

    }

}


// ============================================================
// EINSTELLUNGEN / TEXTE
// ============================================================

function renderSettings() {

    const fields = {

        "site-name":
            state.settings.site_name || "",

        "hero-title":
            state.settings.hero_title || "",

        "hero-text":
            state.settings.hero_text || "",

        "about-text":
            state.settings.about_text || "",

        "contact-text":
            state.settings.contact_text || "",

        "footer-text":
            state.settings.footer_text || ""

    };


    Object.entries(fields).forEach(
        ([id, value]) => {

            const element =
                document.getElementById(id);


            if (element) {

                element.value = value;

            }

        }
    );

}


function setupSettings() {

    const form =
        document.getElementById(
            "settings-form"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const settings = {

                site_name:
                    document.getElementById(
                        "site-name"
                    ).value,

                hero_title:
                    document.getElementById(
                        "hero-title"
                    ).value,

                hero_text:
                    document.getElementById(
                        "hero-text"
                    ).value,

                about_text:
                    document.getElementById(
                        "about-text"
                    ).value,

                contact_text:
                    document.getElementById(
                        "contact-text"
                    ).value,

                footer_text:
                    document.getElementById(
                        "footer-text"
                    ).value

            };


            try {

                await api(
                    "/api/settings",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                settings
                            )
                    }
                );


                state.settings =
                    settings;


                showToast(
                    "Änderungen gespeichert."
                );


            } catch (err) {

                showToast(
                    err.message,
                    "error"
                );

            }

        }
    );

}


// ============================================================
// KATEGORIE-DROPDOWNS
// ============================================================

function renderCategorySelects() {

    const uploadSelect =
        document.getElementById(
            "upload-category"
        );


    const editSelect =
        document.getElementById(
            "edit-category"
        );


    const filterSelect =
        document.getElementById(
            "gallery-category-filter"
        );


    const selects = [

        uploadSelect,
        editSelect

    ];


    selects.forEach(select => {

        if (!select) return;


        const oldValue =
            select.value;


        select.innerHTML =
            `<option value="">
                Kategorie auswählen
            </option>`;


        state.categories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;


                option.textContent =
                    category.name;


                select.appendChild(
                    option
                );

            }
        );


        if (oldValue) {

            select.value =
                oldValue;

        }

    });


    if (filterSelect) {

        const oldValue =
            filterSelect.value;


        filterSelect.innerHTML =
            `<option value="">
                Alle Kategorien
            </option>`;


        state.categories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;


                option.textContent =
                    category.name;


                filterSelect.appendChild(
                    option
                );

            }
        );


        if (oldValue) {

            filterSelect.value =
                oldValue;

        }

    }

}


// ============================================================
// KATEGORIEN
// ============================================================

function renderCategories() {

    const container =
        document.getElementById(
            "categories-list"
        );


    if (!container) return;


    if (
        state.categories.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <span>🗂️</span>

                <h2>
                    Noch keine Kategorien
                </h2>

                <p>
                    Erstelle deine erste Kategorie.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.categories
            .map(category => `

                <div class="category-item">

                    <div class="category-info">

                        <strong>
                            ${escapeHTML(
                                category.name
                            )}
                        </strong>

                        <span>
                            ID: ${category.id}
                        </span>

                    </div>


                    <div class="category-actions">

                        <button
                            class="edit-category-button"
                            data-id="${category.id}"
                            type="button"
                        >
                            ✏️ Bearbeiten
                        </button>


                        <button
                            class="delete-category-button danger"
                            data-id="${category.id}"
                            type="button"
                        >
                            🗑️ Löschen
                        </button>

                    </div>

                </div>

            `)
            .join("");


    container
        .querySelectorAll(
            ".edit-category-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editCategory(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".delete-category-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteCategory(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });

}


function setupCategories() {

    const form =
        document.getElementById(
            "category-form"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const input =
                document.getElementById(
                    "category-name"
                );


            const name =
                input.value.trim();


            if (!name) {

                showToast(
                    "Bitte einen Kategorienamen eingeben.",
                    "error"
                );

                return;

            }


            try {

                await api(
                    "/api/categories",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                name
                            })

                    }
                );


                input.value = "";


                await loadData();


                showToast(
                    "Kategorie erstellt."
                );


            } catch (err) {

                showToast(
                    err.message,
                    "error"
                );

            }

        }
    );

}


async function editCategory(id) {

    const category =
        state.categories.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!category) return;


    const newName =
        prompt(
            "Neuer Kategoriename:",
            category.name
        );


    if (newName === null) {
        return;
    }


    const name =
        newName.trim();


    if (!name) {

        showToast(
            "Der Name darf nicht leer sein.",
            "error"
        );

        return;

    }


    try {

        await api(
            `/api/categories/${id}`,
            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        name
                    })

            }
        );


        await loadData();


        showToast(
            "Kategorie geändert."
        );


    } catch (err) {

        showToast(
            err.message,
            "error"
        );

    }

}


async function deleteCategory(id) {

    const category =
        state.categories.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!category) return;


    const confirmed =
        confirm(
            `Kategorie "${category.name}" wirklich löschen?`
        );


    if (!confirmed) return;


    try {

        await api(
            `/api/categories/${id}`,
            {
                method: "DELETE"
            }
        );


        await loadData();


        showToast(
            "Kategorie gelöscht."
        );


    } catch (err) {

        showToast(
            err.message,
            "error"
        );

    }

}


// ============================================================
// BILDER HOCHLADEN
// ============================================================

function setupUpload() {

    const form =
        document.getElementById(
            "upload-form"
        );


    const fileInput =
        document.getElementById(
            "image-file"
        );


    const dropZone =
        document.getElementById(
            "drop-zone"
        );


    const fileName =
        document.getElementById(
            "file-name"
        );


    const previewContainer =
        document.getElementById(
            "image-preview-container"
        );


    const preview =
        document.getElementById(
            "image-preview"
        );


    if (!form || !fileInput) {
        return;
    }


    function showPreview(file) {

        if (!file) return;


        if (fileName) {

            fileName.textContent =
                file.name;

        }


        if (
            previewContainer &&
            preview
        ) {

            previewContainer
                .classList
                .remove("hidden");


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    preview.src =
                        event.target.result;

                };


            reader.readAsDataURL(
                file
            );

        }

    }


    fileInput.addEventListener(
        "change",
        () => {

            showPreview(
                fileInput.files[0]
            );

        }
    );


    if (dropZone) {

        dropZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                dropZone.classList.add(
                    "dragging"
                );

            }
        );


        dropZone.addEventListener(
            "dragleave",
            () => {

                dropZone.classList.remove(
                    "dragging"
                );

            }
        );


        dropZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();


                dropZone.classList.remove(
                    "dragging"
                );


                const file =
                    event.dataTransfer
                        .files[0];


                if (!file) return;


                try {

                    fileInput.files =
                        event.dataTransfer.files;

                } catch {
                    // Browser unterstützt das Setzen
                    // von files eventuell nicht.
                }


                showPreview(file);

            }
        );

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const file =
                fileInput.files[0];


            if (!file) {

                showToast(
                    "Bitte ein Bild auswählen.",
                    "error"
                );

                return;

            }


            const title =
                document
                    .getElementById(
                        "upload-title"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "upload-description"
                    )
                    .value
                    .trim();


            const categoryId =
                document
                    .getElementById(
                        "upload-category"
                    )
                    .value;


            if (!title) {

                showToast(
                    "Bitte einen Titel eingeben.",
                    "error"
                );

                return;

            }


            if (!categoryId) {

                showToast(
                    "Bitte eine Kategorie auswählen.",
                    "error"
                );

                return;

            }


            const formData =
                new FormData();


            formData.append(
                "image",
                file
            );


            formData.append(
                "title",
                title
            );


            formData.append(
                "description",
                description
            );


            formData.append(
                "category_id",
                categoryId
            );


            try {

                await api(
                    "/api/gallery",
                    {

                        method: "POST",

                        body:
                            formData

                    }
                );


                form.reset();


                if (previewContainer) {

                    previewContainer
                        .classList
                        .add("hidden");

                }


                if (fileName) {

                    fileName.textContent =
                        "";

                }


                await loadData();


                showToast(
                    "Bild erfolgreich hochgeladen."
                );


            } catch (err) {

                showToast(
                    err.message,
                    "error"
                );

            }

        }
    );

}


// ============================================================
// GALERIE
// ============================================================

function renderGallery() {

    const container =
        document.getElementById(
            "gallery"
        );


    if (!container) return;


    const searchInput =
        document.getElementById(
            "gallery-search"
        );


    const categoryFilter =
        document.getElementById(
            "gallery-category-filter"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    let items =
        [...state.gallery];


    if (search) {

        items =
            items.filter(item => {

                const title =
                    String(
                        item.title || ""
                    )
                    .toLowerCase();


                const description =
                    String(
                        item.description || ""
                    )
                    .toLowerCase();


                const originalName =
                    String(
                        item.original_name || ""
                    )
                    .toLowerCase();


                return (
                    title.includes(search) ||
                    description.includes(search) ||
                    originalName.includes(search)
                );

            });

    }


    if (category) {

        items =
            items.filter(item =>

                String(
                    item.category_id
                ) ===
                String(category)

            );

    }


    const empty =
        document.getElementById(
            "gallery-empty"
        );


    if (items.length === 0) {

        container.innerHTML = "";


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    container.innerHTML =
        items
            .map(item => {

                const categoryObject =
                    state.categories.find(
                        category =>
                            Number(
                                category.id
                            ) ===
                            Number(
                                item.category_id
                            )
                    );


                const categoryName =
                    categoryObject
                        ? categoryObject.name
                        : "Ohne Kategorie";


                return `

                    <article
                        class="admin-gallery-card"
                    >

                        <img
                            src="${escapeHTML(
                                item.url
                            )}"
                            alt="${escapeHTML(
                                item.title
                            )}"
                            loading="lazy"
                        >


                        <div
                            class="admin-gallery-info"
                        >

                            <span
                                class="gallery-category"
                            >
                                ${escapeHTML(
                                    categoryName
                                )}
                            </span>


                            <h3>
                                ${escapeHTML(
                                    item.title
                                )}
                            </h3>


                            <p>
                                ${escapeHTML(
                                    item.description ||
                                    ""
                                )}
                            </p>


                            <div
                                class="gallery-actions"
                            >

                                <button
                                    class="edit-gallery-button"
                                    data-id="${item.id}"
                                    type="button"
                                >
                                    ✏️ Bearbeiten
                                </button>


                                <button
                                    class="delete-gallery-button danger"
                                    data-id="${item.id}"
                                    type="button"
                                >
                                    🗑️ Löschen
                                </button>

                            </div>

                        </div>

                    </article>

                `;

            })
            .join("");


    container
        .querySelectorAll(
            ".edit-gallery-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openEditModal(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".delete-gallery-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteGalleryItem(
                        Number(
                            button.dataset.id
                        )
                    );

                }
            );

        });

}


function setupGalleryFilters() {

    const search =
        document.getElementById(
            "gallery-search"
        );


    const category =
        document.getElementById(
            "gallery-category-filter"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderGallery
        );

    }


    if (category) {

        category.addEventListener(
            "change",
            renderGallery
        );

    }

}


// ============================================================
// BILD BEARBEITEN
// ============================================================

function openEditModal(id) {

    const item =
        state.gallery.find(
            image =>
                Number(image.id) ===
                Number(id)
        );


    if (!item) return;


    const modal =
        document.getElementById(
            "edit-modal"
        );


    const editId =
        document.getElementById(
            "edit-id"
        );


    const editTitle =
        document.getElementById(
            "edit-title"
        );


    const editDescription =
        document.getElementById(
            "edit-description"
        );


    const editCategory =
        document.getElementById(
            "edit-category"
        );


    if (editId) {

        editId.value =
            item.id;

    }


    if (editTitle) {

        editTitle.value =
            item.title || "";

    }


    if (editDescription) {

        editDescription.value =
            item.description || "";

    }


    if (editCategory) {

        editCategory.value =
            item.category_id || "";

    }


    const previewContainer =
        document.getElementById(
            "edit-preview-container"
        );


    const preview =
        document.getElementById(
            "edit-preview-image"
        );


    if (
        previewContainer &&
        preview &&
        item.url
    ) {

        preview.src =
            item.url;


        previewContainer
            .classList
            .remove("hidden");

    }


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }

}


function closeEditModal() {

    const modal =
        document.getElementById(
            "edit-modal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


function setupEditModal() {

    const form =
        document.getElementById(
            "edit-form"
        );


    const closeButton =
        document.getElementById(
            "close-modal"
        );


    const cancelButton =
        document.getElementById(
            "cancel-edit"
        );


    const background =
        document.querySelector(
            "#edit-modal .modal-background"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeEditModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeEditModal
        );

    }


    if (background) {

        background.addEventListener(
            "click",
            closeEditModal
        );

    }


    if (!form) return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const id =
                document.getElementById(
                    "edit-id"
                ).value;


            try {

                await api(
                    `/api/gallery/${id}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                title:
                                    document
                                        .getElementById(
                                            "edit-title"
                                        )
                                        .value,

                                description:
                                    document
                                        .getElementById(
                                            "edit-description"
                                        )
                                        .value,

                                category_id:
                                    document
                                        .getElementById(
                                            "edit-category"
                                        )
                                        .value

                            })

                    }
                );


                closeEditModal();


                await loadData();


                showToast(
                    "Bild geändert."
                );


            } catch (err) {

                showToast(
                    err.message,
                    "error"
                );

            }

        }
    );

}


// ============================================================
// BILD LÖSCHEN
// ============================================================

async function deleteGalleryItem(id) {

    const item =
        state.gallery.find(
            image =>
                Number(image.id) ===
                Number(id)
        );


    if (!item) return;


    const confirmed =
        confirm(
            `Bild "${item.title}" wirklich löschen?`
        );


    if (!confirmed) return;


    try {

        await api(
            `/api/gallery/${id}`,
            {
                method: "DELETE"
            }
        );


        await loadData();


        showToast(
            "Bild gelöscht."
        );


    } catch (err) {

        showToast(
            err.message,
            "error"
        );

    }

}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-item, .quick-action"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionName =
                    button.dataset.section;


                if (!sectionName) return;


                switchSection(
                    sectionName
                );

            }
        );

    });

}


function switchSection(sectionName) {

    state.currentSection =
        sectionName;


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionName
            );

        });


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(section => {

            section.classList.remove(
                "active"
            );

            section.classList.add(
                "hidden"
            );

        });


    const target =
        document.getElementById(
            `section-${sectionName}`
        );


    if (target) {

        target.classList.remove(
            "hidden"
        );

        target.classList.add(
            "active"
        );

    }

}


// ============================================================
// MOBILE MENÜ
// ============================================================

function setupMobileMenu() {

    const button =
        document.getElementById(
            "mobile-menu-button"
        );


    const overlay =
        document.getElementById(
            "mobile-nav-overlay"
        );


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {

                sidebar?.classList.toggle(
                    "mobile-open"
                );


                overlay?.classList.toggle(
                    "active"
                );

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                sidebar?.classList.remove(
                    "mobile-open"
                );


                overlay.classList.remove(
                    "active"
                );

            }
        );

    }

}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupLogin();

        setupLogout();

        setupSettings();

        setupCategories();

        setupUpload();

        setupGalleryFilters();

        setupEditModal();

        setupNavigation();

        setupMobileMenu();

        await checkLogin();

    }
);
