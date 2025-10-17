(() => {
  const html = document.documentElement;
  const toggleButton = document.querySelector("#theme-toggle");
  const menuToggle = document.querySelector("#menu-toggle");
  const drawer = document.querySelector("#primary-nav");
  const footerYear = document.querySelector("#footer-year");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
  if (!toggleButton || !menuToggle) return;

  const THEME_KEY = "preferred-theme";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const statusLabel = toggleButton.querySelector(".toggle-status");
  const menuLabel = menuToggle.querySelector(".menu-label");

  const setButtonState = (theme) => {
    const isDark = theme === "dark";
    const labelText = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
    if (statusLabel) {
      statusLabel.textContent = labelText;
    }
    toggleButton.setAttribute("aria-label", labelText);
    toggleButton.setAttribute("aria-pressed", String(isDark));
  };

  const applyTheme = (theme, persist = true) => {
    html.dataset.theme = theme;
    setButtonState(theme);

    if (persist) {
      localStorage.setItem(THEME_KEY, theme);
    }
  };

  const storedTheme = localStorage.getItem(THEME_KEY);
  const initialTheme = storedTheme || (prefersDark.matches ? "dark" : "light");
  applyTheme(initialTheme, Boolean(storedTheme));

  toggleButton.addEventListener("click", () => {
    const nextTheme = html.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  const handlePreferenceChange = (event) => {
    const hasStoredPreference = Boolean(localStorage.getItem(THEME_KEY));
    if (!hasStoredPreference) {
      applyTheme(event.matches ? "dark" : "light", false);
    }
  };

  if (typeof prefersDark.addEventListener === "function") {
    prefersDark.addEventListener("change", handlePreferenceChange);
  } else if (typeof prefersDark.addListener === "function") {
    prefersDark.addListener(handlePreferenceChange);
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    if (menuLabel) {
      menuLabel.textContent = isOpen ? menuLabel.dataset.close : menuLabel.dataset.open;
    }
    if (drawer) {
      drawer.hidden = !isOpen;
      if (isOpen) {
        drawer.removeAttribute("aria-hidden");
      } else {
        drawer.setAttribute("aria-hidden", "true");
      }
      if (isOpen) {
        const firstLink = drawer.querySelector("a");
        if (firstLink) {
          firstLink.focus();
        }
      } else {
        menuToggle.focus();
      }
    }
  });

  if (menuLabel) {
    menuLabel.textContent = menuLabel.dataset.open;
  }
  if (drawer) {
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
  }
})();
