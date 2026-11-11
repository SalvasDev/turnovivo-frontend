export const THEME_STORAGE_KEY = 'turnovivo-theme';

// Runs before first paint so a stored dark theme never flashes light.
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;
