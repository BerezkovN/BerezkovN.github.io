import { ChineseModule } from './chinese.js';
import { PolishModule } from './polish.js';

class LanguageLearningApp {
    constructor() {
        this.chineseModule = new ChineseModule();
        this.polishModule = new PolishModule();
        this.currentSection = 'chinese';
        this.currentTheme = this.loadThemePreference();
        this.initializeTheme();
        this.initializeTabs();
        this.initializeModules();
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    saveThemePreference(theme) {
        localStorage.setItem('theme', theme);
    }

    initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
                this.saveThemePreference(this.currentTheme);
            });
        }
    }

    applyTheme(theme) {
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
        }
    }

    initializeTabs() {
        const chineseTab = document.getElementById('chineseTab');
        const polishTab = document.getElementById('polishTab');
        const chineseSection = document.getElementById('chineseSection');
        const polishSection = document.getElementById('polishSection');

        if (chineseTab && polishTab && chineseSection && polishSection) {
            chineseTab.addEventListener('click', () => {
                this.switchToSection('chinese');
            });

            polishTab.addEventListener('click', () => {
                this.switchToSection('polish');
            });
        }
    }

    switchToSection(section) {
        const chineseTab = document.getElementById('chineseTab');
        const polishTab = document.getElementById('polishTab');
        const chineseSection = document.getElementById('chineseSection');
        const polishSection = document.getElementById('polishSection');

        if (section === 'chinese') {
            // Update tabs
            chineseTab.classList.remove('tab-inactive');
            chineseTab.classList.add('tab-active');
            
            polishTab.classList.remove('tab-active');
            polishTab.classList.add('tab-inactive');

            // Update sections
            chineseSection.classList.remove('hidden');
            polishSection.classList.add('hidden');
            
            this.currentSection = 'chinese';
        } else if (section === 'polish') {
            // Update tabs
            polishTab.classList.remove('tab-inactive');
            polishTab.classList.add('tab-active');
            
            chineseTab.classList.remove('tab-active');
            chineseTab.classList.add('tab-inactive');

            // Update sections
            polishSection.classList.remove('hidden');
            chineseSection.classList.add('hidden');
            
            this.currentSection = 'polish';
        }
    }

    initializeModules() {
        // Initialize Chinese module
        this.chineseModule.initialize();
        
        // Initialize Polish module
        this.polishModule.initialize();

        // Override Polish module's async methods for demonstration
        // You should replace these with your actual implementations
        this.setupPolishDataFetchers();
    }

    setupPolishDataFetchers() {
        // Example implementation - replace with your actual data fetching logic
        
        // Override fetchSuggestions
        this.polishModule.fetchSuggestions = async (query) => {
            // This is a placeholder implementation
            // Replace with your actual API call or data source
            console.log(`Fetching suggestions for: ${query}`);
            
            // Simulated suggestions - replace with real data
            const mockSuggestions = [
                'dom', 'domy', 'domowy', 'domek',
                'kot', 'koty', 'kotek', 'kotka',
                'pies', 'pieski', 'piesek',
                'książka', 'książki', 'książeczka'
            ];
            
            return mockSuggestions.filter(word => 
                word.toLowerCase().startsWith(query.toLowerCase())
            ).slice(0, 5);
        };

        // Override fetchWordDetails
        this.polishModule.fetchWordDetails = async (word) => {
            // This is a placeholder implementation
            // Replace with your actual API call or data source
            console.log(`Fetching details for word: ${word}`);
            
            // Simulated word details - replace with real data
            return {
                polishExplanation: `${word} - przykładowe wyjaśnienie słowa w języku polskim. To jest miejsce na rzeczywistą definicję.`,
                englishTranslation: `${word} - example English translation. This is a placeholder for the actual translation.`,
                grammarTable: {
                    'Nominative (Mianownik)': word,
                    'Genitive (Dopełniacz)': `${word}u/a`,
                    'Dative (Celownik)': `${word}owi/e`,
                    'Accusative (Biernik)': word,
                    'Instrumental (Narzędnik)': `${word}em/ą`,
                    'Locative (Miejscownik)': `${word}u/e`,
                    'Vocative (Wołacz)': `${word}u/e`
                },
                examples: [
                    {
                        polish: `To jest ${word}.`,
                        english: `This is a ${word}.`
                    },
                    {
                        polish: `Widzę ${word} na stole.`,
                        english: `I see a ${word} on the table.`
                    },
                    {
                        polish: `Idę do ${word}u.`,
                        english: `I'm going to the ${word}.`
                    }
                ]
            };
        };
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new LanguageLearningApp();
    
    // Expose app instance for debugging (optional)
    window.languageLearningApp = app;
});