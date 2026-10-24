/**
 * ============================================================================
 * Reading App - Literary Reader & Real-Time Contextual Translator
 * ============================================================================
 */

class ReadingApp {
    constructor() {
        this.currentBook = null;
        this.currentChapterIndex = 0;
        this.booksManifest = [];
        this.offlineDict = {};
        this.translationCache = {};
        this.savedVocabulary = [];

        // Reader Preferences
        this.settings = {
            theme: 'theme-midnight',
            fontFamily: 'font-serif',
            fontSize: 19,
            lineHeight: 1.85,
            maxWidth: 780
        };

        // UI State
        this.activePopupTarget = null;
        this.isSelectingSentence = false;
        this.currentPopupData = null;
        this.activeLibraryFilter = 'all';

        // Bindings
        this.handleWordClick = this.handleWordClick.bind(this);
        this.handleTextSelection = this.handleTextSelection.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    async init() {
        this.loadSettings();
        this.loadSavedVocabulary();
        this.loadTranslationCache();

        await this.loadOfflineDictionary();
        await this.loadManifest();

        this.cacheDOM();
        this.applySettings();
        this.bindEvents();

        // Load default book: Japanische Märchen (Gutenberg 23393)
        const defaultBookId = localStorage.getItem('reading_active_book_id') || 'japanische-maerchen';
        const defaultChapterIdx = parseInt(localStorage.getItem(`reading_book_${defaultBookId}_chapter`) || '0', 10);
        await this.loadBook(defaultBookId, defaultChapterIdx);
    }

    cacheDOM() {
        this.dom = {
            app: document.getElementById('reading-app'),
            topBar: document.getElementById('reader-top-bar'),
            bookTitleEl: document.getElementById('reader-book-title'),
            chapterSubEl: document.getElementById('reader-chapter-sub'),
            langBadgeEl: document.getElementById('reader-lang-badge'),
            progressBar: document.getElementById('reader-progress-bar'),
            viewport: document.getElementById('reader-viewport'),
            contentWrap: document.getElementById('reader-content-wrap'),
            bodyContent: document.getElementById('reader-body-content'),
            chapterHeading: document.getElementById('reader-chapter-heading'),
            chapterOrnament: document.getElementById('reader-chapter-ornament'),
            chapterMeta: document.getElementById('reader-chapter-meta'),
            prevBtn: document.getElementById('reader-prev-chapter-btn'),
            nextBtn: document.getElementById('reader-next-chapter-btn'),

            // Pop-up
            popup: document.getElementById('translation-popup'),
            popupArrow: document.getElementById('popup-arrow'),
            popupLangBadge: document.getElementById('popup-lang-badge'),
            popupOriginal: document.getElementById('popup-original'),
            popupPreview: document.getElementById('popup-sentence-preview'),
            popupTranslation: document.getElementById('popup-translation'),
            popupAudioBtn: document.getElementById('popup-audio-btn'),
            popupSaveBtn: document.getElementById('popup-save-btn'),
            popupCopyBtn: document.getElementById('popup-copy-btn'),
            popupCloseBtn: document.getElementById('popup-close-btn'),

            // Drawers & Modals
            overlay: document.getElementById('reader-drawer-overlay'),
            tocDrawer: document.getElementById('reader-toc-drawer'),
            tocList: document.getElementById('reader-toc-list'),
            settingsDrawer: document.getElementById('reader-settings-drawer'),
            vocabDrawer: document.getElementById('reader-vocab-drawer'),
            vocabList: document.getElementById('reader-vocab-list'),
            vocabCountBadge: document.getElementById('reader-vocab-count'),
            vocabSearchInput: document.getElementById('vocab-search-input'),
            libraryModal: document.getElementById('reader-library-modal'),
            bookShelfGrid: document.getElementById('reader-bookshelf-grid'),
            toast: document.getElementById('reader-toast'),

            // File upload & Gutenberg fetch
            fileUploadInput: document.getElementById('custom-book-file-input'),
            gutenbergUrlInput: document.getElementById('gutenberg-url-input'),
            gutenbergFetchBtn: document.getElementById('gutenberg-fetch-btn')
        };
    }

    bindEvents() {
        // Word click inside reader body
        if (this.dom.bodyContent) {
            this.dom.bodyContent.addEventListener('click', this.handleWordClick);
        }

        // Sentence / text selection inside reader body
        document.addEventListener('selectionchange', () => {
            // small debounce
            clearTimeout(this._selectionTimer);
            this._selectionTimer = setTimeout(this.handleTextSelection, 200);
        });

        // Dismiss popup on outside clicks or scroll
        document.addEventListener('pointerdown', this.handleDocumentClick);
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        window.addEventListener('resize', () => this.repositionPopup());

        // Popup controls
        if (this.dom.popupAudioBtn) {
            this.dom.popupAudioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.currentPopupData) {
                    this.speakText(this.currentPopupData.text, this.currentBook ? this.currentBook.language : 'de');
                }
            });
        }

        if (this.dom.popupSaveBtn) {
            this.dom.popupSaveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSaveCurrentPopup();
            });
        }

        if (this.dom.popupCopyBtn) {
            this.dom.popupCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.currentPopupData && this.currentPopupData.translation) {
                    navigator.clipboard.writeText(this.currentPopupData.translation);
                    this.showToast('Copied translation to clipboard!');
                }
            });
        }

        if (this.dom.popupCloseBtn) {
            this.dom.popupCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hidePopup();
            });
        }

        // Top bar buttons
        document.getElementById('reader-toc-btn')?.addEventListener('click', () => this.openDrawer('toc'));
        document.getElementById('reader-library-btn')?.addEventListener('click', () => this.openLibraryModal());
        document.getElementById('reader-settings-btn')?.addEventListener('click', () => this.openDrawer('settings'));
        document.getElementById('reader-vocab-btn')?.addEventListener('click', () => this.openDrawer('vocab'));

        // Drawer close buttons
        document.querySelectorAll('.drawer-close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllDrawers());
        });
        this.dom.overlay?.addEventListener('click', () => this.closeAllDrawers());

        // Chapter pagination
        this.dom.prevBtn?.addEventListener('click', () => this.prevChapter());
        this.dom.nextBtn?.addEventListener('click', () => this.nextChapter());

        // Settings theme buttons
        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Settings font buttons
        document.querySelectorAll('.font-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const font = btn.dataset.font;
                this.setFontFamily(font);
            });
        });

        // Font size slider
        const fontSizeSlider = document.getElementById('settings-font-size-slider');
        fontSizeSlider?.addEventListener('input', (e) => {
            const size = parseInt(e.target.value, 10);
            this.setFontSize(size);
            document.getElementById('font-size-val').textContent = `${size}px`;
        });

        // Line height slider
        const lineHeightSlider = document.getElementById('settings-line-height-slider');
        lineHeightSlider?.addEventListener('input', (e) => {
            const lh = parseFloat(e.target.value);
            this.setLineHeight(lh);
            document.getElementById('line-height-val').textContent = lh.toFixed(1);
        });

        // Width slider
        const widthSlider = document.getElementById('settings-width-slider');
        widthSlider?.addEventListener('input', (e) => {
            const w = parseInt(e.target.value, 10);
            this.setMaxWidth(w);
            document.getElementById('width-val').textContent = `${w}px`;
        });

        // Vocab search
        this.dom.vocabSearchInput?.addEventListener('input', (e) => {
            this.renderVocabularyList(e.target.value.toLowerCase().trim());
        });

        // Export Vocab
        document.getElementById('export-vocab-csv-btn')?.addEventListener('click', () => this.exportVocabularyCSV());
        document.getElementById('export-vocab-json-btn')?.addEventListener('click', () => this.exportVocabularyJSON());
        document.getElementById('clear-vocab-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your saved vocabulary?')) {
                this.savedVocabulary = [];
                this.saveVocabularyToStorage();
                this.renderVocabularyList();
                this.showToast('Vocabulary cleared');
            }
        });

        // Custom File Upload
        this.dom.fileUploadInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });

        // Gutenberg URL fetch
        this.dom.gutenbergFetchBtn?.addEventListener('click', () => {
            const url = this.dom.gutenbergUrlInput?.value.trim();
            if (url) this.loadGutenbergFromUrl(url);
        });

        // Library filter buttons
        document.querySelectorAll('.library-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.library-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeLibraryFilter = btn.dataset.filter || 'all';
                this.renderBookshelf();
            });
        });
    }

    // =========================================================================
    // Data Loading & Manifest
    // =========================================================================

    async loadOfflineDictionary() {
        try {
            const res = await fetch('assets/books/common-dict.json');
            if (res.ok) {
                this.offlineDict = await res.json();
            }
        } catch (err) {
            console.warn('Could not load offline dictionary:', err);
        }
    }

    async loadManifest() {
        try {
            const res = await fetch('assets/books/manifest.json');
            if (res.ok) {
                this.booksManifest = await res.json();
            }
        } catch (err) {
            console.warn('Could not load books manifest:', err);
        }
    }

    async loadBook(bookId, chapterIndex = 0) {
        try {
            this.showToast('Loading book...');
            const res = await fetch(`assets/books/${bookId}.json`);
            if (!res.ok) throw new Error('Book file not found');
            this.currentBook = await res.json();
            this.currentChapterIndex = Math.min(Math.max(0, chapterIndex), this.currentBook.chapters.length - 1);

            localStorage.setItem('reading_active_book_id', bookId);
            this.renderBookMeta();
            this.renderTOC();
            this.renderChapter(this.currentChapterIndex);
            this.closeAllDrawers();
            this.showToast(`Opened: ${this.currentBook.title}`);
        } catch (err) {
            console.error('Failed to load book:', err);
            this.showToast('Failed to load book data. Please check connection.');
        }
    }

    renderBookMeta() {
        if (!this.currentBook) return;
        if (this.dom.bookTitleEl) {
            this.dom.bookTitleEl.innerHTML = `📖 ${this.currentBook.title}`;
        }
        if (this.dom.langBadgeEl) {
            const langName = this.currentBook.languageName || this.currentBook.language.toUpperCase();
            this.dom.langBadgeEl.textContent = `${langName} → English`;
        }
    }

    renderTOC() {
        if (!this.currentBook || !this.dom.tocList) return;
        this.dom.tocList.innerHTML = '';

        this.currentBook.chapters.forEach((chap, idx) => {
            const li = document.createElement('li');
            li.className = `toc-item ${idx === this.currentChapterIndex ? 'active' : ''}`;
            li.innerHTML = `
                <span>${chap.title}</span>
                <span class="toc-num">#${idx + 1}</span>
            `;
            li.addEventListener('click', () => {
                this.renderChapter(idx);
                this.closeAllDrawers();
            });
            this.dom.tocList.appendChild(li);
        });
    }

    // =========================================================================
    // Chapter Rendering & Word Tokenization
    // =========================================================================

    renderChapter(index) {
        if (!this.currentBook || !this.currentBook.chapters[index]) return;
        this.currentChapterIndex = index;
        const chap = this.currentBook.chapters[index];

        // Save progress in localStorage
        localStorage.setItem(`reading_book_${this.currentBook.id}_chapter`, index);

        // Update top-bar subtitle
        if (this.dom.chapterSubEl) {
            this.dom.chapterSubEl.textContent = chap.title;
        }

        // Ornament
        if (this.dom.chapterOrnament) {
            this.dom.chapterOrnament.innerHTML = chap.headpiece || '';
        }

        // Heading & Meta
        if (this.dom.chapterHeading) {
            this.dom.chapterHeading.textContent = chap.title;
        }
        if (this.dom.chapterMeta) {
            this.dom.chapterMeta.textContent = `${this.currentBook.title} • Chapter ${index + 1} of ${this.currentBook.chapters.length}`;
        }

        // Chapter HTML Body with Word-level Interactive Tokenization
        if (this.dom.bodyContent) {
            this.dom.bodyContent.innerHTML = chap.html;
            this.tokenizeTextContent(this.dom.bodyContent);
        }

        // Update TOC Active State
        const tocItems = this.dom.tocList?.querySelectorAll('.toc-item');
        tocItems?.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Update Prev / Next Buttons
        if (this.dom.prevBtn) {
            this.dom.prevBtn.disabled = (index <= 0);
            const prevTitle = index > 0 ? this.currentBook.chapters[index - 1].title : '';
            this.dom.prevBtn.querySelector('.nav-label') && (this.dom.prevBtn.querySelector('.nav-label').textContent = prevTitle ? `← ${prevTitle}` : 'Previous');
        }

        if (this.dom.nextBtn) {
            this.dom.nextBtn.disabled = (index >= this.currentBook.chapters.length - 1);
            const nextTitle = index < this.currentBook.chapters.length - 1 ? this.currentBook.chapters[index + 1].title : '';
            this.dom.nextBtn.querySelector('.nav-label') && (this.dom.nextBtn.querySelector('.nav-label').textContent = nextTitle ? `${nextTitle} →` : 'Next');
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.hidePopup();
        this.updateProgressBar();
    }

    prevChapter() {
        if (this.currentChapterIndex > 0) {
            this.renderChapter(this.currentChapterIndex - 1);
        }
    }

    nextChapter() {
        if (this.currentBook && this.currentChapterIndex < this.currentBook.chapters.length - 1) {
            this.renderChapter(this.currentChapterIndex + 1);
        }
    }

    /**
     * Walks all text nodes in the container and wraps each word in a <span class="reader-word">
     * while preserving all existing elements, dropcaps, formatting, and images.
     */
    tokenizeTextContent(container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip if parent is already a reader-word, script, style, or tag
                    if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    const parentName = node.parentNode.nodeName.toLowerCase();
                    if (parentName === 'script' || parentName === 'style' || node.parentNode.classList?.contains('reader-word')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToProcess = [];
        let currentNode;
        while ((currentNode = walker.nextNode())) {
            nodesToProcess.push(currentNode);
        }

        const wordRegex = /([\p{L}\p{M}\d'-]+)/gu;

        nodesToProcess.forEach(textNode => {
            const text = textNode.nodeValue;
            if (!wordRegex.test(text)) return;
            wordRegex.lastIndex = 0;

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;

            while ((match = wordRegex.exec(text)) !== null) {
                // Preceding whitespace / punctuation
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }

                const word = match[0];
                const span = document.createElement('span');
                span.className = 'reader-word';
                span.dataset.word = word;
                span.textContent = word;
                fragment.appendChild(span);

                lastIndex = wordRegex.lastIndex;
            }

            // Remaining text after last word
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            textNode.parentNode.replaceChild(fragment, textNode);
        });
    }

    // =========================================================================
    // Word Click & Sentence Selection Handlers
    // =========================================================================

    handleWordClick(e) {
        // If the user was just dragging to select multiple words/sentences, don't trigger word-click
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            return;
        }

        const wordSpan = e.target.closest('.reader-word');
        if (!wordSpan) return;

        // Clear active word styles
        this.dom.bodyContent.querySelectorAll('.active-word').forEach(el => el.classList.remove('active-word'));
        wordSpan.classList.add('active-word');

        const rawWord = wordSpan.dataset.word || wordSpan.textContent;
        const cleanWord = rawWord.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
        if (!cleanWord) return;

        // Show word pop-up
        this.activePopupTarget = wordSpan;
        this.isSelectingSentence = false;

        this.showTranslationPopup({
            type: 'word',
            text: cleanWord,
            targetEl: wordSpan,
            targetRect: wordSpan.getBoundingClientRect(),
            contextSentence: this.getSentenceAroundElement(wordSpan)
        });
    }

    handleTextSelection() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const selectedText = selection.toString().trim();
        // Trigger sentence translation only if length > 1 word or > 12 characters
        const words = selectedText.split(/\s+/);
        if (words.length <= 1 && selectedText.length < 15) {
            return;
        }

        // Check if selection is within the reader body
        const range = selection.getRangeAt(0);
        if (!this.dom.bodyContent.contains(range.commonAncestorContainer)) {
            return;
        }

        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        this.activePopupTarget = null;
        this.isSelectingSentence = true;

        this.showTranslationPopup({
            type: 'sentence',
            text: selectedText,
            targetEl: null,
            targetRect: rect,
            contextSentence: ''
        });
    }

    getSentenceAroundElement(el) {
        const paragraph = el.closest('p');
        if (!paragraph) return '';
        const fullText = paragraph.textContent;
        const word = el.textContent;
        const idx = fullText.indexOf(word);
        if (idx === -1) return '';

        // Extract surrounding sentence
        const before = fullText.substring(0, idx);
        const after = fullText.substring(idx + word.length);
        const startSentence = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '));
        const endSentence = after.search(/[.!?]/);

        const sStart = startSentence !== -1 ? startSentence + 2 : 0;
        const sEnd = endSentence !== -1 ? idx + word.length + endSentence + 1 : fullText.length;

        return fullText.substring(sStart, sEnd).trim();
    }

    handleDocumentClick(e) {
        // If click is inside the popup or on an interactive trigger, don't close
        if (this.dom.popup && this.dom.popup.contains(e.target)) return;
        if (e.target.closest('.reader-word') || e.target.closest('.reader-icon-btn')) return;

        // If clicking outside, hide popup
        this.hidePopup();
    }

    handleScroll() {
        this.updateProgressBar();
        // Reposition active popup on scroll if open
        if (this.dom.popup && this.dom.popup.style.display === 'flex') {
            this.repositionPopup();
        }
    }

    updateProgressBar() {
        if (!this.dom.progressBar) return;
        const scrollH = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = scrollH > 0 ? (window.scrollY / scrollH) * 100 : 0;
        this.dom.progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
    }

    // =========================================================================
    // Translation Engine & Popup UI
    // =========================================================================

    async showTranslationPopup(data) {
        const { type, text, targetRect, contextSentence } = data;
        const srcLang = this.currentBook ? this.currentBook.language : 'de';
        const targetLang = 'en';

        this.currentPopupData = {
            type,
            text,
            srcLang,
            targetLang,
            translation: '',
            targetRect
        };

        // Populate Popup UI
        if (this.dom.popupLangBadge) {
            const flag = srcLang === 'de' ? '🇩🇪' : (srcLang === 'fr' ? '🇫🇷' : (srcLang === 'es' ? '🇪🇸' : '🌐'));
            this.dom.popupLangBadge.innerHTML = `${flag} ${type === 'word' ? 'Word' : 'Sentence'} Translation`;
        }

        if (this.dom.popupOriginal) {
            this.dom.popupOriginal.textContent = text;
        }

        if (this.dom.popupPreview) {
            if (type === 'sentence') {
                this.dom.popupPreview.style.display = 'block';
                this.dom.popupPreview.textContent = text.length > 120 ? `"${text.substring(0, 120)}..."` : `"${text}"`;
            } else if (contextSentence) {
                this.dom.popupPreview.style.display = 'block';
                this.dom.popupPreview.textContent = `"...${contextSentence.substring(0, 90)}..."`;
            } else {
                this.dom.popupPreview.style.display = 'none';
            }
        }

        // Show Loading State in translation box
        if (this.dom.popupTranslation) {
            this.dom.popupTranslation.innerHTML = `
                <div class="popup-loading">
                    <div class="popup-spinner"></div>
                    <span>Translating to English...</span>
                </div>
            `;
        }

        // Check if already saved in vocabulary
        this.updateSaveButtonState(text);

        // Position & Show Popup
        this.dom.popup.style.display = 'flex';
        this.positionPopupAboveRect(targetRect);

        // Perform Translation (offline dict -> memory/local cache -> online APIs)
        const translation = await this.translateText(text, srcLang, targetLang);
        this.currentPopupData.translation = translation;

        if (this.dom.popupTranslation) {
            this.dom.popupTranslation.textContent = translation;
        }

        // Reposition smoothly after translation content resolves
        requestAnimationFrame(() => this.repositionPopup());
    }

    async translateText(text, srcLang = 'de', targetLang = 'en') {
        const cleanKey = text.toLowerCase().trim();

        // 1. Check in-memory / localStorage cache
        const cacheKey = `${srcLang}_${targetLang}_${cleanKey}`;
        if (this.translationCache[cacheKey]) {
            return this.translationCache[cacheKey];
        }

        // 2. Check offline high-frequency dictionary for single words
        if (!cleanKey.includes(' ') && this.offlineDict[cleanKey]) {
            const entry = this.offlineDict[cleanKey];
            const result = entry.t;
            this.cacheTranslation(cacheKey, result);
            return result;
        }

        // 3. Online Translation via MyMemory API
        try {
            const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang}|${targetLang}`;
            const res = await fetch(myMemoryUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.responseData && data.responseData.translatedText) {
                    const trans = data.responseData.translatedText;
                    this.cacheTranslation(cacheKey, trans);
                    return trans;
                }
            }
        } catch (e) {
            console.warn('MyMemory translation error, trying Google fallback:', e);
        }

        // 4. Fallback to Google Translate GTX endpoint
        try {
            const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const gRes = await fetch(googleUrl);
            if (gRes.ok) {
                const gData = await gRes.json();
                if (gData && gData[0]) {
                    const trans = gData[0].map(item => item[0]).join('');
                    this.cacheTranslation(cacheKey, trans);
                    return trans;
                }
            }
        } catch (e) {
            console.warn('Google GTX fallback error:', e);
        }

        // 5. Fallback dictionary word lookup / placeholder
        return `[Translation unavailable offline]`;
    }

    cacheTranslation(key, value) {
        this.translationCache[key] = value;
        try {
            localStorage.setItem('reading_trans_cache', JSON.stringify(this.translationCache));
        } catch (e) {
            // storage full
        }
    }

    loadTranslationCache() {
        try {
            const cached = localStorage.getItem('reading_trans_cache');
            if (cached) this.translationCache = JSON.parse(cached);
        } catch (e) {
            this.translationCache = {};
        }
    }

    // =========================================================================
    // Precise Floating Pop-up Positioning
    // =========================================================================

    positionPopupAboveRect(targetRect) {
        if (!this.dom.popup || !targetRect) return;

        const popup = this.dom.popup;
        const arrow = this.dom.popupArrow;
        const popupW = popup.offsetWidth || 320;
        const popupH = popup.offsetHeight || 140;

        const targetCenter = targetRect.left + targetRect.width / 2;
        let left = targetCenter - popupW / 2;

        // Clamp horizontally inside viewport
        const margin = 12;
        if (left < margin) left = margin;
        if (left + popupW > window.innerWidth - margin) {
            left = window.innerWidth - popupW - margin;
        }

        // Place directly above target with 10px gap
        let top = targetRect.top - popupH - 12;
        let isArrowTop = false;

        // If not enough room on top, flip below target!
        if (top < 65) {
            top = targetRect.bottom + 12;
            isArrowTop = true;
        }

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;

        if (isArrowTop) {
            popup.classList.add('arrow-top');
        } else {
            popup.classList.remove('arrow-top');
        }

        // Center arrow horizontally to point exactly to the word
        if (arrow) {
            const arrowOffset = targetCenter - left;
            const clampedArrowOffset = Math.max(16, Math.min(popupW - 16, arrowOffset));
            arrow.style.left = `${clampedArrowOffset}px`;
        }
    }

    repositionPopup() {
        if (!this.dom.popup || this.dom.popup.style.display !== 'flex') return;
        if (this.activePopupTarget) {
            const rect = this.activePopupTarget.getBoundingClientRect();
            this.positionPopupAboveRect(rect);
        } else if (this.currentPopupData && this.currentPopupData.targetRect) {
            this.positionPopupAboveRect(this.currentPopupData.targetRect);
        }
    }

    hidePopup() {
        if (this.dom.popup) {
            this.dom.popup.style.display = 'none';
        }
        if (this.dom.bodyContent) {
            this.dom.bodyContent.querySelectorAll('.active-word').forEach(el => el.classList.remove('active-word'));
        }
        this.activePopupTarget = null;
        this.currentPopupData = null;
    }

    // =========================================================================
    // Speech Synthesis (Audio Pronunciation)
    // =========================================================================

    speakText(text, lang = 'de') {
        if (!window.speechSynthesis) {
            this.showToast('Speech synthesis not supported on this browser');
            return;
        }

        window.speechSynthesis.cancel(); // Stop any previous utterance

        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = {
            'de': 'de-DE',
            'fr': 'fr-FR',
            'es': 'es-ES',
            'it': 'it-IT',
            'en': 'en-US'
        };
        utterance.lang = langMap[lang] || 'de-DE';
        utterance.rate = 0.9; // slightly clearer pacing for language learners

        // Choose native voice if available
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
        if (matchingVoice) utterance.voice = matchingVoice;

        window.speechSynthesis.speak(utterance);
        this.showToast(`Pronouncing: "${text.substring(0, 25)}..."`);
    }

    // =========================================================================
    // Vocabulary Management & Persistence
    // =========================================================================

    toggleSaveCurrentPopup() {
        if (!this.currentPopupData) return;
        const { text, translation, type, srcLang } = this.currentPopupData;
        const existingIdx = this.savedVocabulary.findIndex(item => item.text.toLowerCase() === text.toLowerCase());

        if (existingIdx !== -1) {
            // Remove
            this.savedVocabulary.splice(existingIdx, 1);
            this.showToast('Removed from Vocabulary');
        } else {
            // Add
            this.savedVocabulary.unshift({
                id: Date.now(),
                text: text,
                translation: translation,
                type: type,
                lang: srcLang,
                book: this.currentBook ? this.currentBook.title : 'General',
                date: new Date().toLocaleDateString()
            });
            this.showToast('⭐ Saved to Vocabulary!');
        }

        this.saveVocabularyToStorage();
        this.updateSaveButtonState(text);
        this.renderVocabularyList();
    }

    updateSaveButtonState(text) {
        if (!this.dom.popupSaveBtn) return;
        const isSaved = this.savedVocabulary.some(item => item.text.toLowerCase() === text.toLowerCase());
        if (isSaved) {
            this.dom.popupSaveBtn.classList.add('saved');
            this.dom.popupSaveBtn.innerHTML = '⭐ Saved';
        } else {
            this.dom.popupSaveBtn.classList.remove('saved');
            this.dom.popupSaveBtn.innerHTML = '☆ Save';
        }
    }

    loadSavedVocabulary() {
        try {
            const raw = localStorage.getItem('reading_user_vocabulary');
            this.savedVocabulary = raw ? JSON.parse(raw) : [];
        } catch (e) {
            this.savedVocabulary = [];
        }
    }

    saveVocabularyToStorage() {
        try {
            localStorage.setItem('reading_user_vocabulary', JSON.stringify(this.savedVocabulary));
        } catch (e) {
            console.warn('Could not save vocabulary:', e);
        }
        if (this.dom.vocabCountBadge) {
            this.dom.vocabCountBadge.textContent = this.savedVocabulary.length;
        }
    }

    renderVocabularyList(filterQuery = '') {
        if (!this.dom.vocabList) return;
        this.dom.vocabList.innerHTML = '';

        let items = this.savedVocabulary;
        if (filterQuery) {
            items = items.filter(i =>
                i.text.toLowerCase().includes(filterQuery) ||
                i.translation.toLowerCase().includes(filterQuery) ||
                i.book.toLowerCase().includes(filterQuery)
            );
        }

        if (this.dom.vocabCountBadge) {
            this.dom.vocabCountBadge.textContent = this.savedVocabulary.length;
        }

        if (items.length === 0) {
            this.dom.vocabList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <p>No saved words yet.</p>
                    <p style="font-size: 0.78rem; margin-top: 0.4rem;">Click any word or sentence in the book, then tap "Save" to build your personal vocabulary notebook!</p>
                </div>
            `;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'vocab-card';
            card.innerHTML = `
                <div class="vocab-card-top">
                    <span class="vocab-word">${item.text}</span>
                    <button class="popup-mini-btn vocab-speak-btn" title="Listen">🔊</button>
                </div>
                <div class="vocab-trans">${item.translation}</div>
                <div class="vocab-meta">
                    <span>${item.book} • ${item.date}</span>
                    <button class="popup-mini-btn vocab-del-btn" title="Remove" style="font-size: 0.75rem;">✕</button>
                </div>
            `;

            card.querySelector('.vocab-speak-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speakText(item.text, item.lang || 'de');
            });

            card.querySelector('.vocab-del-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.savedVocabulary = this.savedVocabulary.filter(i => i.id !== item.id);
                this.saveVocabularyToStorage();
                this.renderVocabularyList(filterQuery);
            });

            this.dom.vocabList.appendChild(card);
        });
    }

    exportVocabularyCSV() {
        if (this.savedVocabulary.length === 0) {
            this.showToast('No vocabulary items to export');
            return;
        }
        let csv = 'Word / Phrase,English Translation,Type,Language,Book,Date\n';
        this.savedVocabulary.forEach(item => {
            const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
            csv += `${escape(item.text)},${escape(item.translation)},${escape(item.type)},${escape(item.lang)},${escape(item.book)},${escape(item.date)}\n`;
        });

        this.downloadFile(csv, 'reading-vocabulary.csv', 'text/csv');
        this.showToast('Exported CSV for Anki & Flashcards!');
    }

    exportVocabularyJSON() {
        if (this.savedVocabulary.length === 0) {
            this.showToast('No vocabulary items to export');
            return;
        }
        const json = JSON.stringify(this.savedVocabulary, null, 2);
        this.downloadFile(json, 'reading-vocabulary.json', 'application/json');
        this.showToast('Exported JSON notebook!');
    }

    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // =========================================================================
    // Drawers, Modals & Settings
    // =========================================================================

    openDrawer(type) {
        this.closeAllDrawers();
        this.dom.overlay?.classList.add('open');

        if (type === 'toc') {
            this.dom.tocDrawer?.classList.add('open');
        } else if (type === 'settings') {
            this.dom.settingsDrawer?.classList.add('open');
        } else if (type === 'vocab') {
            this.renderVocabularyList();
            this.dom.vocabDrawer?.classList.add('open');
        }
    }

    closeAllDrawers() {
        this.dom.overlay?.classList.remove('open');
        this.dom.tocDrawer?.classList.remove('open');
        this.dom.settingsDrawer?.classList.remove('open');
        this.dom.vocabDrawer?.classList.remove('open');
        this.dom.libraryModal?.classList.remove('open');
    }

    openLibraryModal() {
        this.closeAllDrawers();
        this.renderBookshelf();
        this.dom.libraryModal?.classList.add('open');
    }

    renderBookshelf() {
        if (!this.dom.bookShelfGrid) return;
        this.dom.bookShelfGrid.innerHTML = '';

        let books = this.booksManifest;
        if (this.activeLibraryFilter === 'beginner') {
            books = books.filter(b => b.difficultyLevel === 'beginner' || (b.difficulty && b.difficulty.includes('Beginner')));
        } else if (this.activeLibraryFilter === 'intermediate') {
            books = books.filter(b => b.difficultyLevel === 'intermediate' || (b.difficulty && b.difficulty.includes('Intermediate')));
        } else if (this.activeLibraryFilter === 'advanced') {
            books = books.filter(b => b.difficultyLevel === 'advanced' || (b.difficulty && b.difficulty.includes('Advanced')));
        } else if (this.activeLibraryFilter && this.activeLibraryFilter !== 'all') {
            books = books.filter(b => b.language === this.activeLibraryFilter);
        }

        const iconMap = {
            'grimms-maerchen': '🐺',
            'deutsche-fabeln': '🦊',
            'alltagsgeschichten': '☕',
            'japanische-maerchen': '🌸',
            'die-verwandlung': '🪲',
            'le-tour-du-monde': '🚂',
            'don-quijote': '🛡️'
        };

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = `book-card ${this.currentBook && this.currentBook.id === book.id ? 'active-book' : ''}`;

            const icon = iconMap[book.id] || '📚';
            const coverHtml = book.cover
                ? `<img src="${book.cover}" alt="${book.title}" class="book-cover-img" />`
                : `<div class="book-cover-placeholder">${icon}</div>`;

            const diffClass = (book.difficultyLevel === 'beginner' || (book.difficulty && book.difficulty.includes('Beginner')))
                ? 'diff-beginner'
                : (book.difficultyLevel === 'advanced' ? 'diff-advanced' : 'diff-intermediate');

            card.innerHTML = `
                <div class="book-cover-wrap">
                    ${coverHtml}
                </div>
                <div class="book-card-content">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.2rem;">
                        <span class="book-card-lang">${book.languageFlag || '🌐'} ${book.languageName || book.language.toUpperCase()}</span>
                        <span class="diff-badge ${diffClass}">${book.difficulty || 'All Levels'}</span>
                    </div>
                    <div class="book-card-title">${book.title}</div>
                    <div class="book-card-author">${book.author} (${book.year || ''})</div>
                    <div class="book-card-desc">${book.description}</div>
                    <div class="book-card-footer">
                        <span>📖 ${book.chaptersCount || 1} Stories</span>
                        <span class="badge-tag">${book.featured ? 'Featured' : 'Read'}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.loadBook(book.id);
            });

            this.dom.bookShelfGrid.appendChild(card);
        });
    }

    // =========================================================================
    // Custom Book Upload & Live Gutenberg Fetch
    // =========================================================================

    async handleFileUpload(file) {
        this.showToast(`Loading: ${file.name}...`);
        const name = file.name.replace(/\.[^/.]+$/, '');

        if (file.name.endsWith('.txt')) {
            const text = await file.text();
            this.createCustomBook(name, text);
        } else if (file.name.endsWith('.html') || file.name.endsWith('.xhtml')) {
            const html = await file.text();
            this.createCustomBook(name, html, true);
        } else {
            // For EPUB files: basic text extraction or notify
            const text = await file.text();
            this.createCustomBook(name, text);
        }
    }

    createCustomBook(title, content, isHtml = false) {
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const bodyHtml = isHtml ? content : paragraphs.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('\n');

        const customBook = {
            id: `custom-${Date.now()}`,
            title: title,
            author: 'Custom Upload',
            language: 'de',
            languageName: 'German / Multi',
            targetLanguage: 'en',
            chapters: [
                {
                    index: 0,
                    id: 'custom-chap-1',
                    title: 'Chapter 1',
                    html: bodyHtml
                }
            ]
        };

        this.currentBook = customBook;
        this.currentChapterIndex = 0;
        this.renderBookMeta();
        this.renderTOC();
        this.renderChapter(0);
        this.closeAllDrawers();
        this.showToast(`Loaded custom book: ${title}`);
    }

    async loadGutenbergFromUrl(url) {
        this.showToast('Fetching Gutenberg book...');
        try {
            // Extract Gutenberg ID
            const idMatch = url.match(/\/(\d+)(?:\.[^/]+)?$/) || url.match(/ebooks\/(\d+)/);
            if (!idMatch) {
                alert('Please enter a valid Project Gutenberg URL or eBook ID (e.g. 23393)');
                return;
            }
            const ebookId = idMatch[1];
            this.showToast(`Fetching Gutenberg #${ebookId}...`);

            // Fetch text or HTML from Project Gutenberg cache
            const cacheUrl = `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.txt`;
            const res = await fetch(cacheUrl);
            if (!res.ok) throw new Error('Could not download Gutenberg eBook text');
            const text = await res.text();
            this.createCustomBook(`Gutenberg #${ebookId}`, text);
        } catch (e) {
            console.error(e);
            this.showToast('Failed to fetch Gutenberg book. Check CORS or URL.');
        }
    }

    // =========================================================================
    // Reader Settings & Themes
    // =========================================================================

    loadSettings() {
        try {
            const saved = localStorage.getItem('reading_app_settings');
            if (saved) {
                this.settings = Object.assign(this.settings, JSON.parse(saved));
            }
        } catch (e) {
            // Default settings
        }
    }

    saveSettings() {
        localStorage.setItem('reading_app_settings', JSON.stringify(this.settings));
    }

    applySettings() {
        this.setTheme(this.settings.theme);
        this.setFontFamily(this.settings.fontFamily);
        this.setFontSize(this.settings.fontSize);
        this.setLineHeight(this.settings.lineHeight);
        this.setMaxWidth(this.settings.maxWidth);

        // Update slider values in settings drawer
        const sizeSlider = document.getElementById('settings-font-size-slider');
        if (sizeSlider) sizeSlider.value = this.settings.fontSize;
        const sizeVal = document.getElementById('font-size-val');
        if (sizeVal) sizeVal.textContent = `${this.settings.fontSize}px`;

        const lhSlider = document.getElementById('settings-line-height-slider');
        if (lhSlider) lhSlider.value = this.settings.lineHeight;
        const lhVal = document.getElementById('line-height-val');
        if (lhVal) lhVal.textContent = this.settings.lineHeight.toFixed(1);

        const wSlider = document.getElementById('settings-width-slider');
        if (wSlider) wSlider.value = this.settings.maxWidth;
        const wVal = document.getElementById('width-val');
        if (wVal) wVal.textContent = `${this.settings.maxWidth}px`;
    }

    setTheme(themeName) {
        if (!this.dom.app) return;
        this.dom.app.classList.remove('theme-light', 'theme-sepia', 'theme-midnight', 'theme-dark', 'theme-forest');
        this.dom.app.classList.add(themeName);
        this.settings.theme = themeName;
        this.saveSettings();

        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
    }

    setFontFamily(fontClass) {
        if (!this.dom.contentWrap) return;
        this.dom.contentWrap.classList.remove('font-serif', 'font-classic', 'font-sans', 'font-literary');
        this.dom.contentWrap.classList.add(fontClass);
        this.settings.fontFamily = fontClass;
        this.saveSettings();

        document.querySelectorAll('.font-opt-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.font === fontClass);
        });
    }

    setFontSize(sizePx) {
        this.settings.fontSize = sizePx;
        document.documentElement.style.setProperty('--reader-font-size', `${sizePx}px`);
        this.saveSettings();
    }

    setLineHeight(lh) {
        this.settings.lineHeight = lh;
        document.documentElement.style.setProperty('--reader-line-height', lh);
        this.saveSettings();
    }

    setMaxWidth(maxW) {
        this.settings.maxWidth = maxW;
        document.documentElement.style.setProperty('--reader-max-width', `${maxW}px`);
        this.saveSettings();
    }

    showToast(message) {
        if (!this.dom.toast) return;
        this.dom.toast.textContent = message;
        this.dom.toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.dom.toast.classList.remove('show');
        }, 2500);
    }
}

// Auto-initialize when loaded
let readingAppInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reading-app')) {
        readingAppInstance = new ReadingApp();
        readingAppInstance.init();
        window.readingApp = readingAppInstance;
    }
});

export default ReadingApp;
