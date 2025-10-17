/* script.js
 *
 * This script handles the light/dark mode toggle for the HTML
 * template. It reads the current theme from a data attribute on
 * the <html> element and flips it when the button is clicked. The
 * chosen theme is stored in localStorage so that it persists
 * across page loads. The toggle button's label updates to reflect
 * the next available mode.
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('theme-toggle');
  const root = document.documentElement;

  /**
   * Update the toggle button's label based on the active theme.
   *
   * @param {string} theme - The current theme ('light' or 'dark').
   */
  function updateLabel(theme) {
    if (theme === 'dark') {
      toggleButton.textContent = 'Switch to Light Mode';
    } else {
      toggleButton.textContent = 'Switch to Dark Mode';
    }
  }

  /**
   * Apply a given theme to the document and persist it in localStorage.
   *
   * @param {string} newTheme - The new theme to apply ('light' or 'dark').
   */
  function applyTheme(newTheme) {
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('preferred-theme', newTheme);
    updateLabel(newTheme);
  }

  /**
   * Toggle the current theme between light and dark.
   */
  function toggleTheme() {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // Initialise theme based on saved preference or system preference.
  const storedTheme = localStorage.getItem('preferred-theme');
  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    // Optionally respect system preference as default if no saved
    // preference exists.
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(systemPrefersDark ? 'dark' : 'light');
  }

  // Attach click handler to the toggle button.
  toggleButton.addEventListener('click', toggleTheme);
});