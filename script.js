/* =========================================================
   MEINE GALERIE – script.js
   ========================================================= */

"use strict";

/* =========================================================
   GLOBALE DATEN
   ========================================================= */

let siteData = {
    settings: {},
    categories: [],
    gallery: []
};

let currentGallery = [];
let currentIndex = 0;


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   API
   ========================================================= */

async function loadSiteData() {
    try {
        const response = await fetch("/api/site", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(`Serverfehler: ${response.status}`);
        }

        siteData = await response.json();

        console.log("Website-Daten geladen:", siteData);

        updateWebsite();
        initializeGallery();

    } catch (error) {
        console.error("Fehler beim Laden der Website-Daten:", error);

        showNotification(
            "Die Website-Daten konnten nicht geladen werden.",
            "error"
        );
    }
}


/* =========================================================
   WEBSITE MIT ADMIN-DATEN AKTUALISIEREN
   ========================================================= */

function updateWebsite() {

    const settings = siteData.settings || {};


    /* -----------------------------------------------------
       SEITENTITEL
       ----------------------------------------------------- */

    if (settings.site_name) {

        document.title = settings.site_name;

        const logo = $("[data-site-name]");
        if (logo) {
            logo.textContent = settings.site_name;
        }

        const elements = $$(".site-name");

        elements.forEach(element => {
            element.textContent = settings.site_name;
        });
    }


    /* -----------------------------------------------------
       HERO
       ----------------------------------------------------- */

    if (settings.hero_title) {

        const heroTitle =
            $("#hero-title") ||
            $(".hero-title") ||
            $("[data-hero-title]");

        if (heroTitle) {
            heroTitle.textContent = settings.hero_title;
        }
    }


    if (settings.hero_text) {

        const heroText =
            $("#hero-text") ||
            $(".hero-text") ||
            $("[data-hero-text]");

        if (heroText) {
            heroText.textContent = settings.hero_text;
        }
    }


    /* -----------------------------------------------------
       ABOUT
       ----------------------------------------------------- */

    if (settings.about_text) {

        const aboutText =
            $("#about-text") ||
            $(".about-text") ||
            $("[data-about-text]");

        if (aboutText) {
            aboutText.textContent = settings.about_text;
        }
    }


    /* -----------------------------------------------------
       CONTACT
       ----------------------------------------------------- */

    if (settings.contact_text) {

        const contactText =
            $("#contact-text") ||
            $(".contact-text") ||
            $("[data-contact-text]");

        if (contactText) {
            contactText.textContent = settings.contact_text;
        }
    }


    /* -----------------------------------------------------
       FOOTER
       ----------------------------------------------------- */

    if (settings.footer_text) {

        const footerText =
            $("#footer-text") ||
            $(".footer-text") ||
            $("[data-footer-text]");

        if (footerText) {
            footerText.textContent = settings.footer_text;
        }
    }
}


/* =========================================================
   GALERIE INITIALISIEREN
   ========================================================= */

function initializeGallery() {

    createCategoryFilters();
    renderGallery(siteData.gallery);

    setupSearch();
}


/* =========================================================
   KATEGORIEN
   ========================================================= */

function createCategoryFilters() {

    const containers = [
        "#filters",
        ".filters",
        "#category-filters"
    ];

    let container = null;

    for (const selector of containers) {

        const element = $(selector);

        if (element) {
            container = element;
            break;
        }
    }

    if (!container) {
        console.warn("Kein Kategorie-Container gefunden.");
        return;
    }


    container.innerHTML = "";


    /* ALLE */

    const allButton = document.createElement("button");

    allButton.type = "button";
    allButton.className = "filter-button active";
    allButton.dataset.category = "all";
    allButton.textContent = "Alle";

    container.appendChild(allButton);


    /* KATEGORIEN */

    siteData.categories.forEach(category => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "filter-button";

        button.dataset.category = String(category.id);
        button.textContent = category.name;

        container.appendChild(button);
    });


    /* CLICK-EVENTS */

    container.querySelectorAll(".filter-button").forEach(button => {

        button.addEventListener("click", () => {

            container
                .querySelectorAll(".filter-button")
                .forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");

            const category = button.dataset.category;

            filterGallery(category);
        });
    });
}


/* =========================================================
   GALERIE RENDERN
   ========================================================= */

function renderGallery(images) {

    const gallery =
        $("#gallery") ||
        $(".gallery") ||
        $("#gallery-container");

    if (!gallery) {
        console.warn("Galerie-Container nicht gefunden.");
        return;
    }


    gallery.innerHTML = "";


    if (!images || images.length === 0) {

        gallery.innerHTML = `
            <div class="gallery-empty">
                <div class="empty-icon">✦</div>
                <h3>Keine Bilder gefunden</h3>
                <p>In dieser Kategorie befinden sich momentan keine Bilder.</p>
            </div>
        `;

        currentGallery = [];

        return;
    }


    currentGallery = images;


    images.forEach((image, index) => {

        const card = createGalleryCard(image, index);

        gallery.appendChild(card);
    });


    setupGalleryButtons();
}


/* =========================================================
   GALERIE-KARTE ERSTELLEN
   ========================================================= */

function createGalleryCard(image, index) {

    const card = document.createElement("article");

    card.className = "gallery-item";

    card.dataset.category =
        image.category_id !== null &&
        image.category_id !== undefined
            ? String(image.category_id)
            : "";


    const imageWrapper = document.createElement("div");

    imageWrapper.className = "gallery-image-wrapper";


    const img = document.createElement("img");

    img.className = "gallery-image";

    img.src = image.image;

    img.alt = image.title || "Galeriebild";

    img.loading = "lazy";


    img.addEventListener("error", () => {

        img.src =
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg"
                     width="800"
                     height="600"
                     viewBox="0 0 800 600">

                    <rect width="800"
                          height="600"
                          fill="#111827"/>

                    <text x="400"
                          y="300"
                          text-anchor="middle"
                          fill="#ffffff"
                          font-size="28"
                          font-family="Arial">

                        Bild konnte nicht geladen werden

                    </text>
                </svg>
            `);
    });


    imageWrapper.appendChild(img);


    /* -----------------------------------------------------
       OVERLAY
       ----------------------------------------------------- */

    const overlay = document.createElement("div");

    overlay.className = "gallery-overlay";


    const overlayContent = document.createElement("div");

    overlayContent.className = "gallery-overlay-content";


    const categoryName =
        image.category ||
        getCategoryName(image.category_id) ||
        "Ohne Kategorie";


    overlayContent.innerHTML = `
        <span class="gallery-category">
            ${escapeHTML(categoryName)}
        </span>

        <h3 class="gallery-title">
            ${escapeHTML(image.title || "Ohne Titel")}
        </h3>

        ${
            image.description
                ? `
                    <p class="gallery-description">
                        ${escapeHTML(image.description)}
                    </p>
                  `
                : ""
        }

        <button
            type="button"
            class="gallery-view-button"
            data-gallery-index="${index}"
            aria-label="Bild öffnen">

            Ansehen
        </button>
    `;


    overlay.appendChild(overlayContent);

    imageWrapper.appendChild(overlay);

    card.appendChild(imageWrapper);


    /* -----------------------------------------------------
       FALLBACK-INFORMATIONEN
       ----------------------------------------------------- */

    const info = document.createElement("div");

    info.className = "gallery-card-info";

    info.innerHTML = `
        <h3>${escapeHTML(image.title || "Ohne Titel")}</h3>

        ${
            image.description
                ? `<p>${escapeHTML(image.description)}</p>`
                : ""
        }

        <span>
            ${escapeHTML(categoryName)}
        </span>
    `;


    card.appendChild(info);


    return card;
}


/* =========================================================
   KATEGORIENNAME
   ========================================================= */

function getCategoryName(categoryId) {

    if (
        categoryId === null ||
        categoryId === undefined ||
        categoryId === ""
    ) {
        return "";
    }


    const category = siteData.categories.find(
        item => String(item.id) === String(categoryId)
    );


    return category ? category.name : "";
}


/* =========================================================
   GALERIE BUTTONS
   ========================================================= */

function setupGalleryButtons() {

    $$(".gallery-view-button").forEach(button => {

        button.addEventListener("click", event => {

            event.stopPropagation();

            const index =
                Number(button.dataset.galleryIndex);

            openLightbox(index);
        });
    });


    $$(".gallery-image").forEach((image, index) => {

        image.addEventListener("click", () => {

            const card =
                image.closest(".gallery-item");

            if (!card) return;

            const button =
                card.querySelector(".gallery-view-button");

            if (!button) return;

            openLightbox(
                Number(button.dataset.galleryIndex)
            );
        });
    });
}


/* =========================================================
   GALERIE FILTERN
   ========================================================= */

function filterGallery(category) {

    const searchInput =
        $("#gallery-search") ||
        $(".gallery-search");

    const searchTerm =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    let filtered = siteData.gallery;


    /* KATEGORIE */

    if (category !== "all") {

        filtered = filtered.filter(image => {

            return String(image.category_id) === String(category);
        });
    }


    /* SUCHBEGRIFF */

    if (searchTerm) {

        filtered = filtered.filter(image => {

            const title =
                (image.title || "").toLowerCase();

            const description =
                (image.description || "").toLowerCase();

            const categoryName =
                (
                    image.category ||
                    getCategoryName(image.category_id) ||
                    ""
                ).toLowerCase();


            return (
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                categoryName.includes(searchTerm)
            );
        });
    }


    renderGallery(filtered);
}


/* =========================================================
   SUCHE
   ========================================================= */

function setupSearch() {

    const searchInput =
        $("#gallery-search") ||
        $(".gallery-search");

    if (!searchInput) {
        return;
    }


    searchInput.addEventListener("input", () => {

        const activeButton =
            document.querySelector(
                ".filter-button.active"
            );


        const category =
            activeButton
                ? activeButton.dataset.category
                : "all";


        filterGallery(category);
    });
}


/* =========================================================
   LIGHTBOX
   ========================================================= */

function openLightbox(index) {

    if (
        !currentGallery ||
        !currentGallery.length ||
        !currentGallery[index]
    ) {
        return;
    }


    currentIndex = index;

    let lightbox =
        $("#lightbox") ||
        $(".lightbox");


    /* -----------------------------------------------------
       LIGHTBOX ERSTELLEN, FALLS NICHT VORHANDEN
       ----------------------------------------------------- */

    if (!lightbox) {

        lightbox = document.createElement("div");

        lightbox.id = "lightbox";

        lightbox.className = "lightbox";

        lightbox.innerHTML = `

            <button
                type="button"
                class="lightbox-close"
                aria-label="Schließen">
                ×
            </button>

            <button
                type="button"
                class="lightbox-prev"
                aria-label="Vorheriges Bild">
                ‹
            </button>

            <div class="lightbox-content">

                <img
                    class="lightbox-image"
                    src=""
                    alt="">

                <div class="lightbox-info">

                    <h2 class="lightbox-title"></h2>

                    <p class="lightbox-description"></p>

                </div>

            </div>

            <button
                type="button"
                class="lightbox-next"
                aria-label="Nächstes Bild">
                ›
            </button>
        `;


        document.body.appendChild(lightbox);


        lightbox
            .querySelector(".lightbox-close")
            .addEventListener("click", closeLightbox);


        lightbox
            .querySelector(".lightbox-prev")
            .addEventListener("click", previousImage);


        lightbox
            .querySelector(".lightbox-next")
            .addEventListener("click", nextImage);


        lightbox.addEventListener("click", event => {

            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }


    updateLightbox();

    lightbox.classList.add("active");

    document.body.classList.add("lightbox-open");
}


/* =========================================================
   LIGHTBOX AKTUALISIEREN
   ========================================================= */

function updateLightbox() {

    const lightbox =
        $("#lightbox") ||
        $(".lightbox");


    if (!lightbox) return;


    const image =
        currentGallery[currentIndex];


    if (!image) return;


    const img =
        lightbox.querySelector(".lightbox-image");

    const title =
        lightbox.querySelector(".lightbox-title");

    const description =
        lightbox.querySelector(".lightbox-description");


    img.src = image.image;

    img.alt =
        image.title ||
        "Galeriebild";


    title.textContent =
        image.title ||
        "";


    description.textContent =
        image.description ||
        "";


    /* Buttons ausblenden, wenn nicht benötigt */

    const prev =
        lightbox.querySelector(".lightbox-prev");

    const next =
        lightbox.querySelector(".lightbox-next");


    if (prev) {
        prev.style.display =
            currentGallery.length > 1
                ? ""
                : "none";
    }


    if (next) {
        next.style.display =
            currentGallery.length > 1
                ? ""
                : "none";
    }
}


/* =========================================================
   LIGHTBOX SCHLIESSEN
   ========================================================= */

function closeLightbox() {

    const lightbox =
        $("#lightbox") ||
        $(".lightbox");


    if (!lightbox) return;


    lightbox.classList.remove("active");

    document.body.classList.remove("lightbox-open");
}


/* =========================================================
   VORHERIGES BILD
   ========================================================= */

function previousImage() {

    if (!currentGallery.length) {
        return;
    }


    currentIndex--;

    if (currentIndex < 0) {

        currentIndex =
            currentGallery.length - 1;
    }


    updateLightbox();
}


/* =========================================================
   NÄCHSTES BILD
   ========================================================= */

function nextImage() {

    if (!currentGallery.length) {
        return;
    }


    currentIndex++;

    if (
        currentIndex >=
        currentGallery.length
    ) {

        currentIndex = 0;
    }


    updateLightbox();
}


/* =========================================================
   TASTATUR-STEUERUNG
   ========================================================= */

document.addEventListener("keydown", event => {

    const lightbox =
        $("#lightbox") ||
        $(".lightbox");


    const lightboxIsOpen =
        lightbox &&
        lightbox.classList.contains("active");


    if (!lightboxIsOpen) {
        return;
    }


    if (event.key === "Escape") {

        closeLightbox();

        return;
    }


    if (event.key === "ArrowLeft") {

        previousImage();

        return;
    }


    if (event.key === "ArrowRight") {

        nextImage();

        return;
    }
});


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function setupMobileNavigation() {

    const menuButton =
        $("#menu-toggle") ||
        $(".menu-toggle") ||
        $(".hamburger");


    const nav =
        $("#nav-menu") ||
        $(".nav-menu") ||
        $("nav");


    if (!menuButton || !nav) {
        return;
    }


    menuButton.addEventListener("click", () => {

        nav.classList.toggle("active");

        menuButton.classList.toggle("active");

        const expanded =
            menuButton.classList.contains("active");


        menuButton.setAttribute(
            "aria-expanded",
            expanded
        );
    });


    nav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            nav.classList.remove("active");

            menuButton.classList.remove("active");

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        });
    });
}


/* =========================================================
   DARK / LIGHT MODE
   ========================================================= */

function setupTheme() {

    const themeButton =
        $("#theme-toggle") ||
        $(".theme-toggle");


    if (!themeButton) {
        return;
    }


    const savedTheme =
        localStorage.getItem("theme");


    if (savedTheme === "light") {

        document.body.classList.add("light-mode");
    }


    updateThemeButton();


    themeButton.addEventListener("click", () => {

        document.body.classList.toggle("light-mode");


        const isLight =
            document.body.classList.contains(
                "light-mode"
            );


        localStorage.setItem(
            "theme",
            isLight ? "light" : "dark"
        );


        updateThemeButton();
    });
}


function updateThemeButton() {

    const themeButton =
        $("#theme-toggle") ||
        $(".theme-toggle");


    if (!themeButton) {
        return;
    }


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    themeButton.textContent =
        isLight ? "☀️" : "🌙";
}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function setupActiveNavigation() {

    const sections =
        $$("section[id]");

    const links =
        $$('nav a[href^="#"]');


    if (
        !sections.length ||
        !links.length
    ) {
        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) {
                        return;
                    }


                    const id =
                        entry.target.id;


                    links.forEach(link => {

                        link.classList.toggle(
                            "active",
                            link.getAttribute("href") ===
                            `#${id}`
                        );
                    });
                });

            },
            {
                threshold: 0.25
            }
        );


    sections.forEach(section => {

        observer.observe(section);
    });
}


/* =========================================================
   SCROLL ANIMATION
   ========================================================= */

function setupScrollAnimations() {

    const elements =
        $$(".animate-on-scroll");


    if (!elements.length) {
        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                });

            },
            {
                threshold: 0.15
            }
        );


    elements.forEach(element => {

        observer.observe(element);
    });
}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = "success"
) {

    let notification =
        $("#notification");


    if (!notification) {

        notification =
            document.createElement("div");

        notification.id =
            "notification";

        notification.className =
            "notification";

        document.body.appendChild(
            notification
        );
    }


    notification.textContent =
        message;


    notification.classList.remove(
        "success",
        "error",
        "show"
    );


    notification.classList.add(
        type
    );


    /* Animation neu starten */

    void notification.offsetWidth;


    notification.classList.add(
        "show"
    );


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 3500);
}


/* =========================================================
   HTML SICHER MACHEN
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   SMOOTH SCROLL
   ========================================================= */

function setupSmoothScroll() {

    $$('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetId =
                link.getAttribute("href");


            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }


            const target =
                $(targetId);


            if (!target) {
                return;
            }


            event.preventDefault();


            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}


/* =========================================================
   BILDER-LAZY-LOADING
   ========================================================= */

function setupImageObserver() {

    const images =
        $$("img[data-src]");


    if (!images.length) {
        return;
    }


    if (
        !("IntersectionObserver" in window)
    ) {

        images.forEach(image => {

            image.src =
                image.dataset.src;
        });

        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        !entry.isIntersecting
                    ) {
                        return;
                    }


                    const image =
                        entry.target;


                    image.src =
                        image.dataset.src;


                    image.removeAttribute(
                        "data-src"
                    );


                    observer.unobserve(
                        image
                    );
                });

            }
        );


    images.forEach(image => {

        observer.observe(image);
    });
}


/* =========================================================
   FENSTER RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        /* Hier können später weitere
           Responsive-Funktionen hinzukommen. */

    }
);


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Meine Galerie wird gestartet..."
        );


        setupMobileNavigation();

        setupTheme();

        setupActiveNavigation();

        setupScrollAnimations();

        setupSmoothScroll();

        setupImageObserver();


        /* -------------------------------------------------
           WICHTIG:
           Daten vom Node/Express-Server laden
           ------------------------------------------------- */

        await loadSiteData();


        console.log(
            "Meine Galerie ist bereit."
        );
    }
);
