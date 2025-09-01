export class ChineseModule {
    constructor() {
        this.strokeCounterArray = [];
        this.t2sConverter = null;
        this.s2tConverter = null;
        this.initializeConverters();
    }

    initializeConverters() {
        if (typeof OpenCC !== 'undefined') {
            this.t2sConverter = OpenCC.Converter({ from: 'tw', to: 'cn' });
            this.s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
        }
    }

    async getCharacterStrokeCount(hanziChar) {
        try {
            const charData = await HanziWriter.loadCharacterData(hanziChar);
            return charData.strokes.length;
        } catch (error) {
            return -1;
        }
    }


    createCharacterCard(hanziChar, containerName, index, strokeCount) {
        const card = document.createElement("div");
        card.className = "character-card flex flex-col items-center min-w-[240px]";

        const hanziDivID = `${containerName}-hanzi-${index}`;
        
        // Create a wrapper div with relative positioning
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.width = "200px";
        wrapper.style.height = "200px";
        
        // Create guide lines SVG overlay
        const guideLines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        guideLines.setAttribute("width", "200");
        guideLines.setAttribute("height", "200");
        guideLines.style.position = "absolute";
        guideLines.style.top = "0";
        guideLines.style.left = "0";
        guideLines.style.pointerEvents = "none";
        guideLines.style.zIndex = "1";
        
        // Add the guide lines
        const lines = [
            { x1: 0, y1: 0, x2: 200, y2: 200 },     // Diagonal top-left to bottom-right
            { x1: 200, y1: 0, x2: 0, y2: 200 },     // Diagonal top-right to bottom-left
            { x1: 100, y1: 0, x2: 100, y2: 200 },   // Vertical center
            { x1: 0, y1: 100, x2: 200, y2: 100 }    // Horizontal center
        ];
        
        lines.forEach(line => {
            const lineElement = document.createElementNS("http://www.w3.org/2000/svg", "line");
            Object.entries(line).forEach(([key, value]) => {
                lineElement.setAttribute(key, value);
            });
            lineElement.setAttribute("stroke", "#DDD");
            lineElement.setAttribute("stroke-width", "1");
            lineElement.setAttribute("opacity", "0.8");
            guideLines.appendChild(lineElement);
        });
        
        // Create a container div for HanziWriter
        const hanziContainer = document.createElement("div");
        hanziContainer.id = hanziDivID;
        hanziContainer.style.position = "relative";
        hanziContainer.style.zIndex = "2";
        
        wrapper.appendChild(guideLines);
        wrapper.appendChild(hanziContainer);
        card.appendChild(wrapper);

        // Create HanziWriter with the container element
        const writer = HanziWriter.create(hanziContainer, hanziChar, {
            width: 200,
            height: 200,
            showCharacter: false,
            strokeAnimationSpeed: 4,
            padding: 5,
            showOutline: true,
            strokeColor: '#555'
        });

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "mt-4 flex gap-2";

        const nextStrokeBtn = document.createElement("button");
        nextStrokeBtn.textContent = "Next Stroke";
        nextStrokeBtn.className = "btn-primary text-sm w-28";
        
        let currentStroke = 0;
        nextStrokeBtn.addEventListener('click', () => {
            if (currentStroke >= strokeCount) {
                writer.hideCharacter();
                currentStroke = 0;
                nextStrokeBtn.textContent = "Next Stroke";
            } else {
                writer.animateStroke(currentStroke);
                currentStroke++;
                if (currentStroke >= strokeCount) {
                    nextStrokeBtn.textContent = "Reset";
                }
            }
        });

        const showAllBtn = document.createElement("button");
        showAllBtn.textContent = "Show All";
        showAllBtn.className = "btn-secondary text-sm w-28";
        showAllBtn.addEventListener('click', () => {
            writer.showCharacter();
            currentStroke = strokeCount;
            nextStrokeBtn.textContent = "Reset";
        });

        buttonContainer.appendChild(nextStrokeBtn);
        buttonContainer.appendChild(showAllBtn);
        card.appendChild(buttonContainer);

        return card;
    }

    async generateHanziRow(containerName, hanziString) {
        const container = document.getElementById(containerName);
        container.innerHTML = '';

        for (let i = 0; i < hanziString.length; i++) {
            const strokeCount = await this.getCharacterStrokeCount(hanziString[i]);
            
            if (strokeCount === -1) {
                const padding = document.createElement("div");
                padding.className = "w-4";
                container.appendChild(padding);
                continue;
            }

            const card = this.createCharacterCard(hanziString[i], containerName, i, strokeCount);
            container.appendChild(card);
        }
    }

    async processInput(inputText) {
        if (!this.s2tConverter || !this.t2sConverter) {
            throw new Error("OpenCC converters not initialized");
        }

        const traditionalText = this.s2tConverter(inputText);
        const simplifiedText = this.t2sConverter(inputText);

        await Promise.all([
            this.generateHanziRow("traditional-container", traditionalText),
            this.generateHanziRow("simplified-container", simplifiedText)
        ]);
    }

    initialize() {
        const hanziInput = document.getElementById("hanziInput");
        const generateButton = document.getElementById("generateButton");

        if (generateButton) {
            generateButton.addEventListener('click', () => {
                const text = hanziInput.value.trim();
                if (text) {
                    this.processInput(text);
                }
            });
        }

        if (hanziInput) {
            hanziInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = hanziInput.value.trim();
                    if (text) {
                        this.processInput(text);
                    }
                }
            });
            
            // Set default text and generate immediately
            hanziInput.value = '學習';
            this.processInput('學習');
        }
    }
}