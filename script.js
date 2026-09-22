// ==========================================
// MEINE WEBSITE - JAVASCRIPT
// ==========================================


// ==========================================
// DARK / LIGHT MODE
// ==========================================

const themeButton = document.createElement("button");

themeButton.id = "theme-button";

themeButton.type = "button";

themeButton.setAttribute(
    "aria-label",
    "Farbschema wechseln"
);

document.body.appendChild(themeButton);


const savedTheme =
    localStorage.getItem("theme");


if (savedTheme === "light") {

    document.body.classList.add(
        "light-mode"
    );

    themeButton.textContent = "🌙";

} else {

    themeButton.textContent = "☀️";

}


themeButton.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "light-mode"
        );


        const lightMode =
            document.body.classList.contains(
                "light-mode"
            );


        if (lightMode) {

            themeButton.textContent = "🌙";

            localStorage.setItem(
                "theme",
                "light"
            );

        } else {

            themeButton.textContent = "☀️";

            localStorage.setItem(
                "theme",
                "dark"
            );

        }

    }
);


// ==========================================
// BUTTON-EFFEKT
// ==========================================

const buttons =
    document.querySelectorAll(".button");


buttons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                button.classList.add(
                    "clicked"
                );


                setTimeout(
                    function () {

                        button.classList.remove(
                            "clicked"
                        );

                    },
                    150
                );

            }
        );

    }
);


// ==========================================
// SCROLL-ANIMATION
// ==========================================

const animatedElements =
    document.querySelectorAll(
        ".card, .about, .contact"
    );


const observer =
    new IntersectionObserver(
        function (entries) {

            entries.forEach(
                function (entry) {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "show-element"
                        );

                    }

                }
            );

        },
        {
            threshold: 0.15
        }
    );


animatedElements.forEach(
    function (element) {

        element.classList.add(
            "hidden-element"
        );

        observer.observe(element);

    }
);


// ==========================================
// KONTAKT-BUTTON
// ==========================================

const contactButton =
    document.querySelector(
        'a[href^="mailto:"]'
    );


if (contactButton) {

    contactButton.addEventListener(
        "click",
        function () {

            showNotification(
                "Dein E-Mail-Programm wird geöffnet."
            );

        }
    );

}


// ==========================================
// BENACHRICHTIGUNG
// ==========================================

function showNotification(message) {

    const notification =
        document.createElement("div");


    notification.className =
        "website-notification";


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    setTimeout(
        function () {

            notification.classList.add(
                "notification-visible"
            );

        },
        10
    );


    setTimeout(
        function () {

            notification.classList.remove(
                "notification-visible"
            );


            setTimeout(
                function () {

                    notification.remove();

                },
                300
            );

        },
        3000
    );

}


// ==========================================
// AKTIVE NAVIGATION
// ==========================================

const sections =
    document.querySelectorAll(
        "main section"
    );


const navigationLinks =
    document.querySelectorAll(
        ".desktop-nav a, .mobile-nav a"
    );


const sectionObserver =
    new IntersectionObserver(
        function (entries) {

            entries.forEach(
                function (entry) {

                    if (
                        entry.isIntersecting
                    ) {

                        navigationLinks.forEach(
                            function (link) {

                                link.classList.remove(
                                    "active"
                                );

                            }
                        );


                        const activeLinks =
                            document.querySelectorAll(
                                'a[href="#' +
                                entry.target.id +
                                '"]'
                            );


                        activeLinks.forEach(
                            function (link) {

                                link.classList.add(
                                    "active"
                                );

                            }
                        );

                    }

                }
            );

        },
        {
            threshold: 0.45
        }
    );


sections.forEach(
    function (section) {

        sectionObserver.observe(
            section
        );

    }
);


// ==========================================
// MOBILES MENÜ
// ==========================================

const menuButton =
    document.getElementById(
        "menu-button"
    );


const mobileNav =
    document.getElementById(
        "mobile-nav"
    );


menuButton.addEventListener(
    "click",
    function () {

        const isOpen =
            mobileNav.classList.toggle(
                "mobile-nav-open"
            );


        menuButton.classList.toggle(
            "menu-open"
        );


        menuButton.setAttribute(
            "aria-expanded",
            isOpen
        );

    }
);


// ==========================================
// MOBILES MENÜ NACH KLICK SCHLIESSEN
// ==========================================

const mobileLinks =
    document.querySelectorAll(
        ".mobile-nav a"
    );


mobileLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                mobileNav.classList.remove(
                    "mobile-nav-open"
                );


                menuButton.classList.remove(
                    "menu-open"
                );


                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }
        );

    }
);


// ==========================================
// MOBILES MENÜ BEI DESKTOP-GRÖSSE SCHLIESSEN
// ==========================================

window.addEventListener(
    "resize",
    function () {

        if (window.innerWidth > 700) {

            mobileNav.classList.remove(
                "mobile-nav-open"
            );


            menuButton.classList.remove(
                "menu-open"
            );


            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }
);
