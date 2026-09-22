"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const state = {
        settings: {},
        categories: [],
        gallery: [],
        activeCategory: "all",
        searchText: "",
        lightboxIndex: 0
    };

    const elements = {
        heroTitle: document.getElementById("hero-title"),
        heroText: document.getElementById("hero-text"),
        aboutText: document.getElementById("about-text"),
        contactText: document.getElementById("contact-text"),
        footerText: document.getElementById("footer-text"),

        galleryGrid: document.getElementById("gallery-grid"),
        filters: document.getElementById("filters"),
        search: document.getElementById("gallery-search"),
        empty: document.getElementById("gallery-empty"),
        emptyTitle: document.getElementById("gallery-empty-title"),
        emptyText: document.getElementById("gallery-empty-text"),

        lightbox: document.getElementById("lightbox"),
        lightboxImage: document.getElementById("lightbox-image"),
        lightboxTitle: document.getElementById("lightbox-title"),
        lightboxDescription: document.getElementById("lightbox-description"),
        lightboxClose: document.getElementById("lightbox-close"),
        lightboxPrev: document.getElementById("lightbox-prev"),
        lightboxNext: document.getElementById("lightbox-next"),

        notification: document.getElementById("notification"),

        navToggle: document.getElementById("nav-toggle"),
        navLinks: document.getElementById("nav-links"),
        themeToggle: document.getElementById("theme-toggle")
    };

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showNotification(message, type = "info") {
        if (!elements.notification) {
            return;
        }

        elements.notification.textContent = message;
        elements.notification.className = `notification show ${type}`;

        clearTimeout(showNotification.timeout);

        showNotification.timeout = setTimeout(() => {
            elements.notification.classList.remove("show");
        }, 3000);
    }

    async function fetchJson(url, options = {}) {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(
                `${response.status} ${response.statusText} bei ${url}`
            );
        }

        return response.json();
    }

    async function loadSite() {
        try {
            const [site, categories, gallery] = await Promise.all([
                fetchJson("/api/site"),
                fetchJson("/api/categories"),
                fetchJson("/api/gallery/public")
            ]);

            state.settings = site || {};
            state.categories = Array.isArray(categories) ? categories : [];
            state.gallery = Array.isArray(gallery) ? gallery : [];

            applySettings();
            renderFilters();
            renderGallery();

            console.log("Website-Daten geladen:");
            console.log("Kategorien:", state.categories);
            console.log("Bilder:", state.gallery);
        } catch (error) {
            console.error("Fehler beim Laden der Website:", error);

            showNotification(
                "Die Galerie-Daten konnten nicht geladen werden.",
                "error"
            );
        }
    }

    function applySettings() {
        const settings = state.settings;

        if (elements.heroTitle && settings.hero_title) {
            elements.heroTitle.textContent = settings.hero_title;
        }

        if (elements.heroText && settings.hero_text) {
            elements.heroText.textContent = settings.hero_text;
        }

        if (elements.aboutText && settings.about_text) {
            elements.aboutText.textContent = settings.about_text;
        }

        if (elements.contactText && settings.contact_text) {
            elements.contactText.textContent = settings.contact_text;
        }

        if (elements.footerText && settings.footer_text) {
            elements.footerText.textContent = settings.footer_text;
        }

        const logo = document.getElementById("nav-logo");

        if (logo && settings.site_name) {
            logo.textContent = settings.site_name;
        }

        const footerLogo = document.getElementById("footer-logo");

        if (footerLogo && settings.site_name) {
            footerLogo.textContent = settings.site_name;
        }

        document.title = settings.site_name || "Meine Galerie";
    }

    function findCategoryName(image) {
        if (!image) {
            return "Ohne Kategorie";
        }

        if (image.category_name) {
            return image.category_name;
        }

        if (image.categoryName) {
            return image.categoryName;
        }

        if (image.category_slug) {
            const categoryBySlug = state.categories.find(
                category => category.slug === image.category_slug
            );

            if (categoryBySlug) {
                return categoryBySlug.name;
            }
        }

        if (image.category_id !== undefined && image.category_id !== null) {
            const category = state.categories.find(
                category => Number(category.id) === Number(image.category_id)
            );

            if (category) {
                return category.name;
            }
        }

        return "Ohne Kategorie";
    }

    function findCategoryId(image) {
        if (!image) {
            return null;
        }

        if (
            image.category_id !== undefined &&
            image.category_id !== null
        ) {
            return Number(image.category_id);
        }

        if (image.categoryId !== undefined && image.categoryId !== null) {
            return Number(image.categoryId);
        }

        if (image.category_slug) {
            const category = state.categories.find(
                item => item.slug === image.category_slug
            );

            return category ? Number(category.id) : null;
        }

        return null;
    }

    function renderFilters() {
        if (!elements.filters) {
            console.error("Element #filters wurde nicht gefunden.");
            return;
        }

        elements.filters.innerHTML = "";

        const allButton = document.createElement("button");

        allButton.type = "button";
        allButton.className = "filter-button active";
        allButton.dataset.category = "all";
        allButton.textContent = "Alle";

        allButton.addEventListener("click", () => {
            state.activeCategory = "all";
            updateFilterButtons();
            renderGallery();
        });

        elements.filters.appendChild(allButton);

        state.categories.forEach(category => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "filter-button";
            button.dataset.category = String(category.id);
            button.textContent = category.name;

            button.addEventListener("click", () => {
                state.activeCategory = String(category.id);
                updateFilterButtons();
                renderGallery();
            });

            elements.filters.appendChild(button);
        });

        updateFilterButtons();
    }

    function updateFilterButtons() {
        if (!elements.filters) {
            return;
        }

        const buttons =
            elements.filters.querySelectorAll(".filter-button");

        buttons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.category === String(state.activeCategory)
            );
        });
    }

    function getFilteredGallery() {
        const search = state.searchText.trim().toLowerCase();

        return state.gallery.filter(image => {
            const categoryId = findCategoryId(image);

            const categoryMatches =
                state.activeCategory === "all" ||
                Number(categoryId) === Number(state.activeCategory);

            if (!categoryMatches) {
                return false;
            }

            if (!search) {
                return true;
            }

            const categoryName = findCategoryName(image);

            const searchableText = [
                image.title || "",
                image.description || "",
                image.originalName || "",
                categoryName || ""
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(search);
        });
    }

    function getImageUrl(image) {
        if (!image) {
            return "";
        }

        if (image.url) {
            return image.url;
        }

        if (image.filename) {
            return `/uploads/${encodeURIComponent(image.filename)}`;
        }

        return "";
    }

    function createGalleryCard(image, index) {
        const article = document.createElement("article");

        article.className = "gallery-card";
        article.dataset.index = String(index);

        const imageUrl = getImageUrl(image);
        const title = image.title || image.originalName || "Bild";
        const description = image.description || "";
        const categoryName = findCategoryName(image);

        article.innerHTML = `
            <div class="gallery-image-wrapper">
                <img
                    class="gallery-image"
                    src="${escapeHtml(imageUrl)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                >

                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <span class="gallery-category">
                            ${escapeHtml(categoryName)}
                        </span>

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                        ${
                            description
                                ? `<p>${escapeHtml(description)}</p>`
                                : ""
                        }

                        <button
                            type="button"
                            class="gallery-view"
                            aria-label="Bild ${escapeHtml(title)} öffnen"
                        >
                            Ansehen
                        </button>
                    </div>
                </div>
            </div>
        `;

        const imageElement = article.querySelector(".gallery-image");

        imageElement.addEventListener("error", () => {
            console.error(
                "Bild konnte nicht geladen werden:",
                imageUrl
            );

            imageElement.alt = "Bild konnte nicht geladen werden";
            imageElement.style.display = "none";
        });

        article.addEventListener("click", () => {
            openLightbox(index);
        });

        return article;
    }

    function renderGallery() {
        if (!elements.galleryGrid) {
            console.error(
                "Element #gallery-grid wurde nicht gefunden."
            );
            return;
        }

        const filteredGallery = getFilteredGallery();

        elements.galleryGrid.innerHTML = "";

        if (filteredGallery.length === 0) {
            elements.galleryGrid.style.display = "none";

            if (elements.empty) {
                elements.empty.style.display = "block";
            }

            if (elements.emptyTitle) {
                elements.emptyTitle.textContent =
                    state.gallery.length === 0
                        ? "Noch keine Bilder vorhanden"
                        : "Keine Bilder gefunden";
            }

            if (elements.emptyText) {
                elements.emptyText.textContent =
                    state.gallery.length === 0
                        ? "Lade im Admin-Bereich dein erstes Bild hoch."
                        : "Ändere deine Suche oder wähle eine andere Kategorie.";
            }

            return;
        }

        elements.galleryGrid.style.display = "grid";

        if (elements.empty) {
            elements.empty.style.display = "none";
        }

        filteredGallery.forEach((image) => {
            const originalIndex = state.gallery.indexOf(image);

            const card = createGalleryCard(
                image,
                originalIndex
            );

            elements.galleryGrid.appendChild(card);
        });
    }

    function openLightbox(index) {
        if (
            !elements.lightbox ||
            !elements.lightboxImage ||
            !state.gallery.length
        ) {
            return;
        }

        if (index < 0 || index >= state.gallery.length) {
            return;
        }

        state.lightboxIndex = index;

        const image = state.gallery[index];

        const imageUrl = getImageUrl(image);
        const title = image.title || image.originalName || "Bild";
        const description = image.description || "";

        elements.lightboxImage.src = imageUrl;
        elements.lightboxImage.alt = title;

        if (elements.lightboxTitle) {
            elements.lightboxTitle.textContent = title;
        }

        if (elements.lightboxDescription) {
            elements.lightboxDescription.textContent = description;
        }

        if (elements.lightboxPrev) {
            elements.lightboxPrev.disabled =
                state.gallery.length <= 1;
        }

        if (elements.lightboxNext) {
            elements.lightboxNext.disabled =
                state.gallery.length <= 1;
        }

        elements.lightbox.classList.add("open");
        elements.lightbox.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
        document.body.classList.add("lightbox-open");
    }

    function closeLightbox() {
        if (!elements.lightbox) {
            return;
        }

        elements.lightbox.classList.remove("open");
        elements.lightbox.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";
        document.body.classList.remove("lightbox-open");
    }

    function showPreviousImage() {
        if (!state.gallery.length) {
            return;
        }

        state.lightboxIndex =
            (state.lightboxIndex - 1 + state.gallery.length) %
            state.gallery.length;

        updateLightbox();
    }

    function showNextImage() {
        if (!state.gallery.length) {
            return;
        }

        state.lightboxIndex =
            (state.lightboxIndex + 1) %
            state.gallery.length;

        updateLightbox();
    }

    function updateLightbox() {
        const image = state.gallery[state.lightboxIndex];

        if (!image) {
            return;
        }

        const imageUrl = getImageUrl(image);
        const title = image.title || image.originalName || "Bild";
        const description = image.description || "";

        if (elements.lightboxImage) {
            elements.lightboxImage.src = imageUrl;
            elements.lightboxImage.alt = title;
        }

        if (elements.lightboxTitle) {
            elements.lightboxTitle.textContent = title;
        }

        if (elements.lightboxDescription) {
            elements.lightboxDescription.textContent = description;
        }
    }

    function setupSearch() {
        if (!elements.search) {
            return;
        }

        elements.search.addEventListener("input", event => {
            state.searchText = event.target.value || "";
            renderGallery();
        });
    }

    function setupLightbox() {
        if (elements.lightboxClose) {
            elements.lightboxClose.addEventListener(
                "click",
                closeLightbox
            );
        }

        if (elements.lightboxPrev) {
            elements.lightboxPrev.addEventListener(
                "click",
                showPreviousImage
            );
        }

        if (elements.lightboxNext) {
            elements.lightboxNext.addEventListener(
                "click",
                showNextImage
            );
        }

        if (elements.lightbox) {
            elements.lightbox.addEventListener("click", event => {
                if (event.target === elements.lightbox) {
                    closeLightbox();
                }
            });
        }

        document.addEventListener("keydown", event => {
            if (
                !elements.lightbox ||
                !elements.lightbox.classList.contains("open")
            ) {
                return;
            }

            if (event.key === "Escape") {
                closeLightbox();
            }

            if (event.key === "ArrowLeft") {
                showPreviousImage();
            }

            if (event.key === "ArrowRight") {
                showNextImage();
            }
        });
    }

    function setupMobileNavigation() {
        if (!elements.navToggle || !elements.navLinks) {
            return;
        }

        elements.navToggle.addEventListener("click", () => {
            const isOpen =
                elements.navLinks.classList.toggle("open");

            elements.navToggle.classList.toggle("open", isOpen);

            elements.navToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });

        const links =
            elements.navLinks.querySelectorAll("a");

        links.forEach(link => {
            link.addEventListener("click", () => {
                elements.navLinks.classList.remove("open");
                elements.navToggle.classList.remove("open");

                elements.navToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });
        });
    }

    function setupTheme() {
        if (!elements.themeToggle) {
            return;
        }

        const savedTheme =
            localStorage.getItem("gallery-theme");

        if (savedTheme === "light") {
            document.body.classList.add("light-mode");
        }

        elements.themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");

            const isLight =
                document.body.classList.contains("light-mode");

            localStorage.setItem(
                "gallery-theme",
                isLight ? "light" : "dark"
            );
        });
    }

    let touchStartX = 0;

    function setupLightboxTouch() {
        if (!elements.lightbox) {
            return;
        }

        elements.lightbox.addEventListener(
            "touchstart",
            event => {
                if (!event.touches.length) {
                    return;
                }

                touchStartX = event.touches[0].clientX;
            },
            { passive: true }
        );

        elements.lightbox.addEventListener(
            "touchend",
            event => {
                if (!event.changedTouches.length) {
                    return;
                }

                const touchEndX =
                    event.changedTouches[0].clientX;

                const difference =
                    touchEndX - touchStartX;

                if (Math.abs(difference) < 50) {
                    return;
                }

                if (difference > 0) {
                    showPreviousImage();
                } else {
                    showNextImage();
                }
            },
            { passive: true }
        );
    }

    setupSearch();
    setupLightbox();
    setupMobileNavigation();
    setupTheme();
    setupLightboxTouch();

    loadSite();
});
