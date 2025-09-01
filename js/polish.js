export class PolishModule {
    constructor() {
        this.searchInput = null;
        this.searchButton = null;
        this.suggestionsContainer = null;
        this.wordDetailsContainer = null;
        this.loadingState = null;
        this.errorState = null;
        this.currentSuggestions = [];
        this.debounceTimer = null;
    }

    async fetchSuggestions(query) {
        // Placeholder for async implementation
        // This will be implemented by you to fetch suggestions from your data source
        // Should return an array of suggestion strings
        throw new Error("fetchSuggestions not implemented. Please implement this method.");
    }

    async fetchWordDetails(word) {
        // Placeholder for async implementation
        // This will be implemented by you to fetch word details from your data source
        // Should return an object with:
        // {
        //   polishExplanation: string,
        //   englishTranslation: string,
        //   grammarTable: object/array with declension data,
        //   examples: array of example sentences
        // }
        throw new Error("fetchWordDetails not implemented. Please implement this method.");
    }

    showSuggestions(suggestions) {
        this.suggestionsContainer.innerHTML = '';
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors text-primary';
            item.textContent = suggestion;
            
            item.addEventListener('click', () => {
                this.searchInput.value = suggestion;
                this.hideSuggestions();
                this.searchWord(suggestion);
            });

            this.suggestionsContainer.appendChild(item);
        });

        this.suggestionsContainer.classList.remove('hidden');
    }

    hideSuggestions() {
        this.suggestionsContainer.classList.add('hidden');
    }

    async handleInputChange(value) {
        if (value.length < 2) {
            this.hideSuggestions();
            return;
        }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(async () => {
            try {
                const suggestions = await this.fetchSuggestions(value);
                this.currentSuggestions = suggestions;
                this.showSuggestions(suggestions);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                this.hideSuggestions();
            }
        }, 300);
    }

    showLoading() {
        this.wordDetailsContainer.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.loadingState.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingState.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.wordDetailsContainer.classList.add('hidden');
        document.getElementById('errorMessage').textContent = message;
        this.errorState.classList.remove('hidden');
    }

    hideError() {
        this.errorState.classList.add('hidden');
    }

    renderGrammarTable(grammarData) {
        const table = document.createElement('table');
        table.className = 'table-base';

        const thead = document.createElement('thead');
        thead.className = 'table-header';
        
        const tbody = document.createElement('tbody');
        tbody.className = 'table-body';

        // This is a flexible implementation that will adapt to different grammar table structures
        // The actual structure will depend on your data format
        if (Array.isArray(grammarData)) {
            // Handle array format
            grammarData.forEach((row, index) => {
                const tr = document.createElement('tr');
                if (index === 0) {
                    // First row as header
                    row.forEach(cell => {
                        const th = document.createElement('th');
                        th.className = 'table-header-cell';
                        th.textContent = cell;
                        tr.appendChild(th);
                    });
                    thead.appendChild(tr);
                } else {
                    // Data rows
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        td.className = 'table-cell';
                        td.textContent = cell;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                }
            });
        } else if (typeof grammarData === 'object') {
            // Handle object format
            const headerRow = document.createElement('tr');
            const caseHeader = document.createElement('th');
            caseHeader.className = 'table-header-cell';
            caseHeader.textContent = 'Case';
            headerRow.appendChild(caseHeader);
            
            const formHeader = document.createElement('th');
            formHeader.className = 'table-header-cell';
            formHeader.textContent = 'Form';
            headerRow.appendChild(formHeader);
            thead.appendChild(headerRow);

            Object.entries(grammarData).forEach(([key, value]) => {
                const tr = document.createElement('tr');
                
                const tdKey = document.createElement('td');
                tdKey.className = 'table-cell-bold';
                tdKey.textContent = key;
                tr.appendChild(tdKey);
                
                const tdValue = document.createElement('td');
                tdValue.className = 'table-cell';
                tdValue.textContent = value;
                tr.appendChild(tdValue);
                
                tbody.appendChild(tr);
            });
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    displayWordDetails(wordData) {
        this.hideLoading();
        this.hideError();

        // Polish Explanation
        const polishExplanationEl = document.getElementById('polishExplanation');
        if (wordData.polishExplanation) {
            // Display as seamless text without list formatting
            const meanings = wordData.polishExplanation.split('\n').filter(line => line.trim());
            polishExplanationEl.innerHTML = meanings.join('<br>');
        } else {
            polishExplanationEl.innerHTML = '<span class="text-secondary">Brak definicji</span>';
        }

        // English Translation
        const englishTranslationEl = document.getElementById('englishTranslation');
        if (wordData.englishTranslation) {
            englishTranslationEl.innerHTML = wordData.englishTranslation;
        } else {
            // Add pronunciation and etymology if available
            let additionalInfo = [];
            if (wordData.pronunciation) {
                additionalInfo.push(`<div class="mb-2"><strong>Wymowa:</strong> ${wordData.pronunciation}</div>`);
            }
            if (wordData.etymology) {
                additionalInfo.push(`<div><strong>Etymologia:</strong> ${wordData.etymology}</div>`);
            }
            if (additionalInfo.length > 0) {
                englishTranslationEl.innerHTML = additionalInfo.join('');
            } else {
                englishTranslationEl.innerHTML = '<span class="text-secondary">Tłumaczenie niedostępne</span>';
            }
        }

        // Grammar Table
        const grammarTableEl = document.getElementById('grammarTable');
        grammarTableEl.innerHTML = '';
        if (wordData.grammarTable && Object.keys(wordData.grammarTable).length > 0) {
            const table = this.renderGrammarTable(wordData.grammarTable);
            grammarTableEl.appendChild(table);
        } else {
            grammarTableEl.innerHTML = '<p class="text-secondary">Brak informacji o odmianie</p>';
        }

        // Examples
        const examplesListEl = document.getElementById('examplesList');
        examplesListEl.innerHTML = '';
        if (wordData.examples && wordData.examples.length > 0) {
            wordData.examples.forEach(example => {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'border-l-4 border-blue-500 pl-4 py-2';
                
                if (typeof example === 'object' && example.polish) {
                    const polishText = example.polish;
                    const englishText = example.english || '';
                    
                    exampleDiv.innerHTML = `
                        <p class="text-primary mb-1">${polishText}</p>
                        ${englishText ? `<p class="text-secondary text-sm italic">${englishText}</p>` : ''}
                    `;
                } else if (typeof example === 'string') {
                    exampleDiv.innerHTML = `<p class="text-primary">${example}</p>`;
                }
                
                examplesListEl.appendChild(exampleDiv);
            });
        } else {
            examplesListEl.innerHTML = '<p class="text-secondary">Brak przykładów</p>';
        }

        this.wordDetailsContainer.classList.remove('hidden');
    }

    async searchWord(word) {
        if (!word || word.trim() === '') {
            return;
        }

        this.showLoading();
        this.hideSuggestions();

        try {
            const wordData = await this.fetchWordDetails(word);
            this.displayWordDetails(wordData);
        } catch (error) {
            console.error('Error fetching word details:', error);
            this.showError(`Failed to load details for "${word}". ${error.message}`);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initialize() {
        // Get DOM elements
        this.searchInput = document.getElementById('polishSearchInput');
        this.searchButton = document.getElementById('searchButton');
        this.suggestionsContainer = document.getElementById('suggestions');
        this.wordDetailsContainer = document.getElementById('wordDetails');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');

        // Set up event listeners
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleInputChange(e.target.value);
            });

            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.hideSuggestions();
                    this.searchWord(this.searchInput.value);
                }
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.searchInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                    this.hideSuggestions();
                }
            });
        }

        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                this.searchWord(this.searchInput.value);
            });
        }
    }
}