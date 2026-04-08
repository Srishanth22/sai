document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggling ---
    const themeBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
    });

    // --- Core UI Elements ---
    const toneChips = document.querySelectorAll('.chip');
    let selectedTone = 'neutral';
    
    toneChips.forEach(chip => {
        chip.addEventListener('click', () => {
            toneChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedTone = chip.getAttribute('data-val');
        });
    });

    const lengthSlider = document.getElementById('length-slider');
    const lenDisplay = document.getElementById('len-display');
    lengthSlider.addEventListener('input', (e) => {
        lenDisplay.textContent = e.target.value;
    });

    // --- Generation Logic & API Call ---
    const generateBtn = document.getElementById('generate-btn');
    const btnLbl = generateBtn.querySelector('.btn-lbl');
    const spinner = generateBtn.querySelector('.spinner');
    
    const promptInput = document.getElementById('prompt-input');
    const typeSelect = document.getElementById('type-select');
    const outputBox = document.getElementById('output-box');
    const wordCountDisplay = document.getElementById('word-count');
    const statusIndicator = document.getElementById('status-indicator');
    
    const API_URL = 'http://localhost:8000/generate';
    const historyList = document.getElementById('history-list');

    let isGenerating = false;

    generateBtn.addEventListener('click', async () => {
        if (isGenerating) return;

        const prompt = promptInput.value.trim();
        if (!prompt) {
            showToast('Please enter a prompt text.');
            return;
        }

        const contentType = typeSelect.value;
        const length = parseInt(lengthSlider.value);

        // UI State Update
        isGenerating = true;
        btnLbl.style.display = 'none';
        spinner.style.display = 'inline-block';
        statusIndicator.textContent = 'Initializing Stream...';
        statusIndicator.style.color = 'var(--primary)';
        generateBtn.disabled = true;

        // Skeleton Loading State
        outputBox.innerHTML = `
            <div class="skeleton w-90"></div>
            <div class="skeleton w-80"></div>
            <div class="skeleton w-60"></div>
        `;

        try {
            // Actual API Call to FastAPI Backend
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    content_type: contentType,
                    tone: selectedTone,
                    max_length: length,
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('API Request Failed');
            
            outputBox.innerHTML = ''; // Clear skeleton
            statusIndicator.textContent = 'Streaming live...';
            
            // True Real-Time SSE Stream Consumption
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                
                // Append directly to DOM
                outputBox.textContent += chunk;
                
                // Update word count live
                const words = outputBox.textContent.trim().split(/\\s+/).filter(w => w.length > 0).length;
                wordCountDisplay.textContent = `${words} words`;
                
                // Keep scroll at bottom
                outputBox.scrollTop = outputBox.scrollHeight;
            }

            statusIndicator.textContent = 'Complete';
            statusIndicator.style.color = '#10b981'; // Green
            resetBtnState();
            addToHistory(prompt, fullText);

        } catch (error) {
            console.error('Generation Error:', error);
            outputBox.innerHTML = `<span style="color: #ef4444;">Error generating text. Ensure Python backend is running on port 8000.</span>`;
            statusIndicator.textContent = 'Failed';
            statusIndicator.style.color = '#ef4444';
            resetBtnState();
        }
    });

    function resetBtnState() {
        isGenerating = false;
        btnLbl.style.display = 'inline-block';
        spinner.style.display = 'none';
        generateBtn.disabled = false;
    }

    // --- Features: Copy & Download ---
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    copyBtn.addEventListener('click', () => {
        const txt = outputBox.textContent;
        if (!txt || document.querySelector('.placeholder-text')) return showToast('Nothing to copy!');
        navigator.clipboard.writeText(txt).then(() => {
            showToast('Copied to clipboard! 📋');
        });
    });

    downloadBtn.addEventListener('click', () => {
        const txt = outputBox.textContent;
        if (!txt || document.querySelector('.placeholder-text')) return showToast('Nothing to download!');
        
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'synthAI-generation.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('File downloaded! 📥');
    });

    // --- Session History ---
    function addToHistory(prompt, result) {
        const emptyState = document.querySelector('.history-empty');
        if (emptyState) emptyState.remove();

        const li = document.createElement('li');
        li.className = 'history-item';
        // Show first 60 chars of prompt
        const shortPrompt = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
        li.innerHTML = `<strong>${selectedTone} ${typeSelect.value}</strong><br> <span style="color:var(--text-2); font-size: 0.85rem;">"${shortPrompt}"</span>`;
        
        // Allow clicking history to load result
        li.addEventListener('click', () => {
            promptInput.value = prompt;
            outputBox.textContent = result;
            const words = result.trim().split(/\s+/).filter(w => w.length > 0).length;
            wordCountDisplay.textContent = `${words} words`;
            statusIndicator.textContent = 'Loaded from history';
        });

        historyList.prepend(li);
        
        // Keep max 5 items
        while (historyList.children.length > 5) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    // --- Contact Form ---
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Message sent! We will contact you soon. ✉️');
        contactForm.reset();
    });

    // --- Toast Notifications ---
    function showToast(msg) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = msg;
        container.appendChild(toast);
        
        // trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
