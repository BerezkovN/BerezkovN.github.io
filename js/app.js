import { ChineseModule } from './chinese.js';
import { PolishModule } from './polish.js';
import { WiktionaryAPI } from './wiktionary.js';

class LanguageLearningApp {
    constructor() {
        this.chineseModule = new ChineseModule();
        this.polishModule = new PolishModule();
        this.wiktionaryAPI = new WiktionaryAPI();
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
        // Use Wiktionary API for fetching suggestions
        this.polishModule.fetchSuggestions = async (query) => {
            try {
                const suggestions = await this.wiktionaryAPI.searchWords(query);
                return suggestions.slice(0, 8); // Return top 8 suggestions
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                return [];
            }
        };

        // Use Wiktionary API for fetching word details
        this.polishModule.fetchWordDetails = async (word) => {
            try {
                const wiktionaryData = await this.wiktionaryAPI.fetchWordData(word);
                
                // Format the data for our Polish module
                const formattedData = {
                    polishExplanation: '',
                    englishTranslation: '',
                    grammarTable: {},
                    examples: [],
                    pronunciation: wiktionaryData.pronunciation || '',
                    etymology: wiktionaryData.etymology || ''
                };

                // Format meanings
                if (wiktionaryData.meanings && wiktionaryData.meanings.length > 0) {
                    formattedData.polishExplanation = wiktionaryData.meanings.map((meaning, index) => 
                        `${index + 1}. ${meaning}`
                    ).join('\n');
                } else {
                    formattedData.polishExplanation = 'Brak definicji';
                }

                // Format conjugations/declensions
                if (wiktionaryData.conjugations && Object.keys(wiktionaryData.conjugations).length > 0) {
                    // Map Polish case names to display format
                    const caseMapping = {
                        'mianownik': 'Mianownik (kto? co?)',
                        'dopełniacz': 'Dopełniacz (kogo? czego?)',
                        'celownik': 'Celownik (komu? czemu?)',
                        'biernik': 'Biernik (kogo? co?)',
                        'narzędnik': 'Narzędnik (kim? czym?)',
                        'miejscownik': 'Miejscownik (o kim? o czym?)',
                        'wołacz': 'Wołacz (o!)'
                    };

                    Object.entries(wiktionaryData.conjugations).forEach(([key, value]) => {
                        const displayKey = caseMapping[key.toLowerCase()] || key;
                        formattedData.grammarTable[displayKey] = value;
                    });
                }

                // Format examples
                if (wiktionaryData.examples && wiktionaryData.examples.length > 0) {
                    formattedData.examples = wiktionaryData.examples.map(ex => ({
                        polish: ex.polish,
                        english: ex.translation || ''
                    }));
                }

                return formattedData;
            } catch (error) {
                console.error('Error fetching word details:', error);
                throw new Error(`Nie można pobrać informacji o słowie "${word}"`);
            }
        };
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new LanguageLearningApp();
    
    // Expose app instance for debugging (optional)
    window.languageLearningApp = app;
});