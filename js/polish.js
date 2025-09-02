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
        
        // History navigation
        this.history = [];
        this.currentHistoryIndex = -1;
        this.backButton = null;
        this.forwardButton = null;
        
        // Keyboard navigation for suggestions
        this.selectedSuggestionIndex = -1;
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
        this.selectedSuggestionIndex = -1;
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.dataset.index = index;
            
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
        this.selectedSuggestionIndex = -1;
    }

    updateSuggestionHighlight() {
        const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        suggestions.forEach((item, index) => {
            if (index === this.selectedSuggestionIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectSuggestion(index) {
        const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        if (index >= 0 && index < suggestions.length) {
            const selectedSuggestion = suggestions[index].textContent;
            this.searchInput.value = selectedSuggestion;
            this.hideSuggestions();
            this.searchWord(selectedSuggestion);
        }
    }

    navigateSuggestions(direction) {
        const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;

        if (direction === 'down') {
            this.selectedSuggestionIndex++;
            if (this.selectedSuggestionIndex >= suggestions.length) {
                this.selectedSuggestionIndex = 0;
            }
        } else if (direction === 'up') {
            this.selectedSuggestionIndex--;
            if (this.selectedSuggestionIndex < 0) {
                this.selectedSuggestionIndex = suggestions.length - 1;
            }
        }

        this.updateSuggestionHighlight();
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

        // Raw Wikitext sections
        const polishWikitextEl = document.getElementById('polishWikitextText');
        const englishWikitextEl = document.getElementById('englishWikitextText');
        
        if (wordData.polishWikitext) {
            polishWikitextEl.textContent = wordData.polishWikitext;
        } else {
            polishWikitextEl.textContent = 'Brak polskiego wikitekstu';
        }
        
        if (wordData.englishWikitext) {
            englishWikitextEl.textContent = wordData.englishWikitext;
        } else {
            englishWikitextEl.textContent = 'No English wikitext available';
        }

        this.wordDetailsContainer.classList.remove('hidden');
    }

    async searchWord(word, addToHistory = true) {
        if (!word || word.trim() === '') {
            return;
        }

        this.showLoading();
        this.hideSuggestions();

        try {
            const wordData = await this.fetchWordDetails(word);
            this.displayWordDetails(wordData);
            
            if (addToHistory) {
                this.addToHistory(word);
            }
        } catch (error) {
            console.error('Error fetching word details:', error);
            this.showError(`Failed to load details for "${word}". ${error.message}`);
        }
    }

    addToHistory(word) {
        // Don't add duplicate consecutive entries
        if (this.history.length > 0 && this.history[this.currentHistoryIndex] === word) {
            return;
        }

        // Remove any entries after current position (when going back then searching new word)
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }

        // Add new word to history
        this.history.push(word);
        this.currentHistoryIndex = this.history.length - 1;

        // Limit history size to prevent memory issues
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
            this.currentHistoryIndex = this.history.length - 1;
        }

        this.updateNavigationButtons();
    }

    goBack() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const word = this.history[this.currentHistoryIndex];
            this.searchInput.value = word;
            this.searchWord(word, false); // Don't add to history
            this.updateNavigationButtons();
        }
    }

    goForward() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            const word = this.history[this.currentHistoryIndex];
            this.searchInput.value = word;
            this.searchWord(word, false); // Don't add to history
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        if (this.backButton && this.forwardButton) {
            // Update back button
            if (this.currentHistoryIndex > 0) {
                this.backButton.disabled = false;
            } else {
                this.backButton.disabled = true;
            }

            // Update forward button
            if (this.currentHistoryIndex < this.history.length - 1) {
                this.forwardButton.disabled = false;
            } else {
                this.forwardButton.disabled = true;
            }
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
        this.backButton = document.getElementById('backButton');
        this.forwardButton = document.getElementById('forwardButton');

        // Set up event listeners
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.handleInputChange(e.target.value);
            });

            this.searchInput.addEventListener('keydown', (e) => {
                const suggestionsVisible = !this.suggestionsContainer.classList.contains('hidden');
                
                if (e.key === 'ArrowDown' && suggestionsVisible) {
                    e.preventDefault();
                    this.navigateSuggestions('down');
                } else if (e.key === 'ArrowUp' && suggestionsVisible) {
                    e.preventDefault();
                    this.navigateSuggestions('up');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (suggestionsVisible && this.selectedSuggestionIndex >= 0) {
                        this.selectSuggestion(this.selectedSuggestionIndex);
                    } else {
                        this.hideSuggestions();
                        this.searchWord(this.searchInput.value);
                    }
                } else if (e.key === 'Escape' && suggestionsVisible) {
                    this.hideSuggestions();
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

        // Set up navigation button listeners
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.goBack();
            });
        }

        if (this.forwardButton) {
            this.forwardButton.addEventListener('click', () => {
                this.goForward();
            });
        }

        // Set up dropdown toggle listeners
        this.setupDropdownToggles();
    }

    setupDropdownToggles() {
        const polishToggle = document.getElementById('polishWikitextToggle');
        const polishContent = document.getElementById('polishWikitextContent');
        const polishArrow = document.getElementById('polishWikitextArrow');

        const englishToggle = document.getElementById('englishWikitextToggle');
        const englishContent = document.getElementById('englishWikitextContent');
        const englishArrow = document.getElementById('englishWikitextArrow');

        if (polishToggle && polishContent && polishArrow) {
            polishToggle.addEventListener('click', () => {
                this.toggleDropdown(polishContent, polishArrow);
            });
        }

        if (englishToggle && englishContent && englishArrow) {
            englishToggle.addEventListener('click', () => {
                this.toggleDropdown(englishContent, englishArrow);
            });
        }
    }

    toggleDropdown(content, arrow) {
        const isHidden = content.classList.contains('hidden');
        
        if (isHidden) {
            content.classList.remove('hidden');
            arrow.style.transform = 'rotate(180deg)';
        } else {
            content.classList.add('hidden');
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}