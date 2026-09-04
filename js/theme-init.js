(() => {
  const STORAGE_KEY = "dmsi-theme";
  let theme;

  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      theme = savedTheme;
    }
  } catch {
    // System preference remains available when browser storage is unavailable.
  }

  if (!theme) {
    theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.documentElement.dataset.theme = theme;
})();
