/**
 * UNRAVEL Theme System
 * Multiple readable themes for better accessibility
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        return localStorage.getItem('unravel-theme') || 'dark';
    }

    saveTheme(theme) {
        localStorage.setItem('unravel-theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);
        
        // Update select if it exists
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = theme;
        }
    }

    switchTheme(theme) {
        this.applyTheme(theme);
        showToast(`Switched to ${this.getThemeName(theme)} theme`, 'info');
    }

    getThemeName(theme) {
        const names = {
            dark: 'Dark',
            light: 'Light', 
            contrast: 'High Contrast',
            warm: 'Warm'
        };
        return names[theme] || theme;
    }

    getThemeDescription(theme) {
        const descriptions = {
            dark: 'Easy on the eyes for long sessions',
            light: 'Clean and bright interface',
            contrast: 'Maximum readability and accessibility', 
            warm: 'Comfortable amber tones'
        };
        return descriptions[theme] || '';
    }

    initializeThemeSelector() {
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
            themeSelect.addEventListener('change', (e) => {
                this.switchTheme(e.target.value);
            });
        }
    }
}

// Global theme manager
const themeManager = new ThemeManager();

// Global function for inline handlers
function switchTheme(theme) {
    themeManager.switchTheme(theme);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    themeManager.initializeThemeSelector();
});