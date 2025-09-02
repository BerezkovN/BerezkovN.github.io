export class WiktionaryAPI {
    constructor() {
        this.baseUrl = 'https://pl.wiktionary.org/w/api.php';
        this.cache = new Map();
    }

    async fetchWordData(word) {
        // Check cache first
        const cacheKey = `pl:${word}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Fetch the page content from Polish Wiktionary
            const pageContent = await this.fetchPageContent(word);
            if (!pageContent) {
                throw new Error(`Word "${word}" not found`);
            }

            // Parse the wikitext content
            const parsedData = this.parseWikitext(pageContent, word);
            parsedData.rawWikitext = pageContent; // Include raw wikitext
            
            // Cache the result
            this.cache.set(cacheKey, parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('Error fetching Wiktionary data:', error);
            throw error;
        }
    }

    async fetchEnglishWordData(word) {
        // Check cache first
        const cacheKey = `en:${word}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Fetch the page content from English Wiktionary
            const pageContent = await this.fetchEnglishPageContent(word);
            if (!pageContent) {
                return { word, meanings: [], conjugations: {}, examples: [], etymology: '', pronunciation: '' };
            }

            // Parse the English wikitext content
            const parsedData = this.parseEnglishWikitext(pageContent, word);
            parsedData.rawWikitext = pageContent; // Include raw wikitext
            
            // Cache the result
            this.cache.set(cacheKey, parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('Error fetching English Wiktionary data:', error);
            return { word, meanings: [], conjugations: {}, examples: [], etymology: '', pronunciation: '' };
        }
    }

    async fetchPageContent(word) {
        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            titles: word,
            prop: 'revisions',
            rvprop: 'content',
            origin: '*'
        });

        const response = await fetch(`${this.baseUrl}?${params}`);
        const data = await response.json();

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId === '-1') {
            return null; // Page not found
        }

        return pages[pageId].revisions[0]['*'];
    }

    async fetchEnglishPageContent(word) {
        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            titles: word,
            prop: 'revisions',
            rvprop: 'content',
            origin: '*'
        });

        const englishBaseUrl = 'https://en.wiktionary.org/w/api.php';
        const response = await fetch(`${englishBaseUrl}?${params}`);
        const data = await response.json();

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId === '-1') {
            return null; // Page not found
        }

        return pages[pageId].revisions[0]['*'];
    }

    parseEnglishWikitext(wikitext, word) {
        const result = {
            word: word,
            meanings: [],
            conjugations: {},
            examples: [],
            etymology: '',
            pronunciation: ''
        };

        // Split text into lines for easier processing
        const lines = wikitext.split('\n');
        
        // Extract definitions from all part-of-speech sections
        result.meanings = this.extractEnglishMeanings(lines);
        
        return result;
    }

    extractEnglishMeanings(lines) {
        const meanings = [];
        let currentPartOfSpeech = '';
        let inDefinitionSection = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Look for part of speech headers (like ===Noun===, ===Verb===, ===Adjective===)
            if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
                const partOfSpeech = trimmed.replace(/=/g, '').trim();
                
                // Check if it's a valid part of speech
                const validPartsOfSpeech = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 
                    'Preposition', 'Conjunction', 'Interjection', 'Particle', 'Determiner'];
                
                if (validPartsOfSpeech.includes(partOfSpeech)) {
                    currentPartOfSpeech = partOfSpeech.toLowerCase();
                    inDefinitionSection = true;
                } else {
                    // Hit a non-part-of-speech section, stop looking for definitions
                    inDefinitionSection = false;
                }
                continue;
            }
            
            // Stop if we hit a new level 3 or 4 section that's not a part of speech
            if ((trimmed.startsWith('===') || trimmed.startsWith('====')) && inDefinitionSection) {
                const sectionName = trimmed.replace(/=/g, '').trim();
                if (sectionName.includes('Etymology') || sectionName.includes('Pronunciation') || 
                    sectionName.includes('References') || sectionName.includes('Further') ||
                    sectionName.includes('Usage') || sectionName.includes('Synonyms') ||
                    sectionName.includes('Antonyms') || sectionName.includes('Derived')) {
                    inDefinitionSection = false;
                }
                continue;
            }
            
            // Extract numbered definitions
            if (inDefinitionSection && trimmed.startsWith('#') && !trimmed.startsWith('##')) {
                let definition = trimmed.substring(1).trim();
                
                // Clean up the definition
                definition = definition
                    .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1') // Remove wiki links
                    .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
                    .replace(/'{2,}/g, '') // Remove wiki formatting
                    .trim();
                
                if (definition && !definition.startsWith('{{') && definition.length > 2) {
                    // Prefix with part of speech if we have one
                    const formattedDefinition = currentPartOfSpeech ? 
                        `(${currentPartOfSpeech}) ${definition}` : definition;
                    meanings.push(formattedDefinition);
                }
            }
        }
        
        return meanings;
    }

    parseWikitext(wikitext, word) {
        const result = {
            word: word,
            meanings: [],
            conjugations: {},
            examples: [],
            etymology: '',
            pronunciation: ''
        };

        // Split text into lines for easier processing
        const lines = wikitext.split('\n');
        
        // Find sections
        const sections = this.findSections(lines);
        
        // Extract data from each section
        if (sections.wymowa) {
            result.pronunciation = this.extractPronunciation(sections.wymowa);
        }
        
        if (sections.znaczenia) {
            const meaningData = this.extractMeanings(sections.znaczenia);
            result.meanings = meaningData.meanings;
        }
        
        if (sections.odmiana) {
            result.conjugations = this.extractConjugations(sections.odmiana);
        }
        
        if (sections.przykłady) {
            result.examples = this.extractExamples(sections.przykłady);
        }
        
        if (sections.etymologia) {
            result.etymology = this.extractEtymology(sections.etymologia);
        }

        return result;
    }

    findSections(lines) {
        const sections = {};
        let currentSection = null;
        let currentContent = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for section headers
            if (line.startsWith('{{wymowa}}')) {
                if (currentSection) {
                    sections[currentSection] = currentContent.slice();
                }
                currentSection = 'wymowa';
                currentContent = [];
            } else if (line.startsWith('{{znaczenia}}')) {
                if (currentSection) {
                    sections[currentSection] = currentContent.slice();
                }
                currentSection = 'znaczenia';
                currentContent = [];
            } else if (line.startsWith('{{odmiana}}')) {
                if (currentSection) {
                    sections[currentSection] = currentContent.slice();
                }
                currentSection = 'odmiana';
                currentContent = [];
            } else if (line.startsWith('{{przykłady}}')) {
                if (currentSection) {
                    sections[currentSection] = currentContent.slice();
                }
                currentSection = 'przykłady';
                currentContent = [];
            } else if (line.startsWith('{{etymologia}}')) {
                if (currentSection) {
                    sections[currentSection] = currentContent.slice();
                }
                currentSection = 'etymologia';
                currentContent = [];
            } else if (line.startsWith('{{') && currentSection) {
                // New section started, save current one
                sections[currentSection] = currentContent.slice();
                currentSection = null;
                currentContent = [];
            } else if (currentSection) {
                currentContent.push(line);
            }
        }
        
        // Don't forget the last section
        if (currentSection) {
            sections[currentSection] = currentContent.slice();
        }

        return sections;
    }

    extractPronunciation(lines) {
        for (const line of lines) {
            if (line.includes('{{IPA3|')) {
                const start = line.indexOf('{{IPA3|') + 7;
                const end = line.indexOf('}}', start);
                if (end > start) {
                    return `[${line.substring(start, end)}]`;
                }
            } else if (line.includes('{{IPA|')) {
                const start = line.indexOf('{{IPA|') + 6;
                const end = line.indexOf('}}', start);
                if (end > start) {
                    return `[${line.substring(start, end)}]`;
                }
            }
        }
        return '';
    }

    extractMeanings(lines) {
        const meanings = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = this.processTemplatesAndLinks(lines[i]);
            meanings.push(line);
        }
        
        return { meanings };
    }

    extractConjugations(lines) {
        const conjugations = {};
        let inTemplate = false;
        let templateContent = '';
        
        for (const line of lines) {
            if (line.includes('{{odmiana-')) {
                inTemplate = true;
                templateContent = line;
            } else if (inTemplate) {
                if (line.includes('}}')) {
                    templateContent += ' ' + line;
                    inTemplate = false;
                    // Process the complete template
                    this.parseConjugationTemplate(templateContent, conjugations);
                } else if (line.includes('|')) {
                    templateContent += ' ' + line;
                }
            }
        }
        
        return conjugations;
    }

    parseConjugationTemplate(template, conjugations) {
        // Split by | and process each parameter
        const parts = template.split('|');
        
        for (const part of parts) {
            if (part.includes('=')) {
                const [key, value] = part.split('=', 2);
                const cleanKey = key.trim();
                const cleanValue = value.trim();
                
                if (cleanValue && !cleanValue.includes('{{') && !cleanValue.includes('}}') && cleanValue !== '') {
                    // Map Polish noun declension keys to readable forms
                    const keyMap = {
                        'Mianownik lp': 'Mianownik (lp)',
                        'Dopełniacz lp': 'Dopełniacz (lp)',
                        'Celownik lp': 'Celownik (lp)',
                        'Biernik lp': 'Biernik (lp)',
                        'Narzędnik lp': 'Narzędnik (lp)',
                        'Miejscownik lp': 'Miejscownik (lp)',
                        'Wołacz lp': 'Wołacz (lp)',
                        'Mianownik lm': 'Mianownik (lm)',
                        'Dopełniacz lm': 'Dopełniacz (lm)',
                        'Celownik lm': 'Celownik (lm)',
                        'Biernik lm': 'Biernik (lm)',
                        'Narzędnik lm': 'Narzędnik (lm)',
                        'Miejscownik lm': 'Miejscownik (lm)',
                        'Wołacz lm': 'Wołacz (lm)',
                        'Forma ndepr': 'Forma niedeprecjonalna'
                    };
                    
                    const displayKey = keyMap[cleanKey] || cleanKey;
                    if (keyMap[cleanKey]) { // Only add recognized declension forms
                        conjugations[displayKey] = cleanValue;
                    }
                }
            }
        }
    }

    extractExamples(lines) {
        const examples = [];
        
        for (const line of lines) {
            // Look for lines starting with ': (number) '' (italic text) ''
            if (line.startsWith(': (') && line.includes("''") && line.includes("''")) {
                // Find the text between the double single quotes
                const firstQuoteIndex = line.indexOf("''");
                const lastQuoteIndex = line.lastIndexOf("''");
                
                if (firstQuoteIndex !== -1 && lastQuoteIndex !== -1 && firstQuoteIndex !== lastQuoteIndex) {
                    const example = line.substring(firstQuoteIndex + 2, lastQuoteIndex);
                    const exampleWithLinks = this.processTemplatesAndLinks(example);
                    examples.push({
                        polish: exampleWithLinks,
                        translation: ''
                    });
                }
            }
        }
        
        return examples;
    }

    extractEtymology(lines) {
        for (const line of lines) {
            if (line.startsWith(':')) {
                const etymology = line.substring(1).trim();
                return this.processTemplatesAndLinks(etymology);
            }
        }
        return '';
    }

    processTemplatesAndLinks(text) {
        let result = text;
        
        // First, handle templates {{...}}
        result = this.processTemplates(result);
        
        // Then, convert wikilinks to HTML
        result = this.convertWikiLinksToHtml(result);
        
        return result;
    }

    processTemplates(text) {
        let result = text;
        
        // Process templates {{...}}
        while (result.includes('{{') && result.includes('}}')) {
            const start = result.indexOf('{{');
            const end = result.indexOf('}}', start);
            if (end === -1) break;
            
            const templateContent = result.substring(start + 2, end);
            
            if (templateContent.includes('|')) {
                // Handle special templates that should display both parts
                const parts = templateContent.split('|');
                const templateName = parts[0].trim();
                
                // Special cases for templates that should show meaningful content
                if (templateName === 'dokonany od' || templateName === 'niedokonany od' || 
                    templateName === 'forma' || templateName === 'odmiana' || 
                    templateName === 'synonim' || templateName === 'antonim') {
                    // Show as "templateName: parameter"
                    const parameter = parts[1] ? parts[1].trim() : '';
                    const replacement = parameter ? `${templateName}: ${parameter}` : templateName;
                    result = result.substring(0, start) + replacement + result.substring(end + 2);
                } else {
                    // For other complex templates, hide completely
                    result = result.substring(0, start) + result.substring(end + 2);
                }
            } else {
                // If no |, show the template content as simple text
                result = result.substring(0, start) + templateContent + result.substring(end + 2);
            }
        }
        
        return result;
    }

    convertWikiLinksToHtml(text) {
        let result = text;
        
        // Handle [[word|display]] format first
        while (result.includes('[[') && result.includes('|') && result.includes(']]')) {
            const start = result.indexOf('[[');
            const end = result.indexOf(']]', start);
            if (end === -1) break;
            
            const linkContent = result.substring(start + 2, end);
            if (linkContent.includes('|')) {
                const [word, display] = linkContent.split('|', 2);
                const link = `<span onclick="window.searchPolishWord('${word.replace(/'/g, "\\'")}'); return false;" class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline">${display}</span>`;
                result = result.substring(0, start) + link + result.substring(end + 2);
            } else {
                // Handle as simple [[word]] case
                const word = linkContent;
                const link = `<span onclick="window.searchPolishWord('${word.replace(/'/g, "\\'")}'); return false;" class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline">${word}</span>`;
                result = result.substring(0, start) + link + result.substring(end + 2);
            }
        }
        
        // Handle remaining simple [[word]] format
        while (result.includes('[[') && result.includes(']]')) {
            const start = result.indexOf('[[');
            const end = result.indexOf(']]', start);
            if (end === -1) break;
            
            const word = result.substring(start + 2, end);
            if (!word.includes('|')) { // Make sure it's not a complex link we missed
                const link = `<span onclick="window.searchPolishWord('${word.replace(/'/g, "\\'")}'); return false;" class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline">${word}</span>`;
                result = result.substring(0, start) + link + result.substring(end + 2);
            } else {
                break; // Avoid infinite loop
            }
        }
        
        return result;
    }

    async searchWords(query) {
        const params = new URLSearchParams({
            action: 'opensearch',
            format: 'json',
            search: query,
            limit: '10',
            namespace: '0',
            origin: '*'
        });

        const response = await fetch(`${this.baseUrl}?${params}`);
        const data = await response.json();
        
        // OpenSearch returns [query, [titles], [descriptions], [urls]]
        return data[1] || [];
    }
}