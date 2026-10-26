/**
 * ============================================================================
 * Reading App - Literary Reader & Real-Time Contextual Translator
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, set, get, child, onValue, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyBT0StKCiled3K5uAi3lcrJlFALXI5KgvE",
    authDomain: "spy-game-4ce29.firebaseapp.com",
    databaseURL: "https://spy-game-4ce29-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spy-game-4ce29",
    storageBucket: "spy-game-4ce29.firebasestorage.app",
    messagingSenderId: "20232358549",
    appId: "1:20232358549:web:feb22d19fb56e13ec9699c"
};

let db = null;
try {
    const fbApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(fbApp);
} catch (e) {
    console.warn('Firebase init warning in reading.js:', e);
}

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

        // Web & Wikipedia Browser State
        this.webHistory = [];
        this.webHistoryIndex = -1;

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
        let defaultBookId = localStorage.getItem('reading_active_book_id') || 'japanische-maerchen';
        if (defaultBookId.startsWith('wiki-')) {
            defaultBookId = 'japanische-maerchen';
            try { localStorage.removeItem('reading_active_book_id'); } catch (e) {}
        }
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

            // Web & Wikipedia Browser elements
            webBtn: document.getElementById('reader-web-btn'),
            webModal: document.getElementById('reader-web-modal'),
            webLangSelect: document.getElementById('web-lang-select'),
            webSearchInput: document.getElementById('web-search-input'),
            webSearchBtn: document.getElementById('web-search-submit-btn'),
            webSuggestions: document.getElementById('web-search-suggestions'),
            webQuickTopics: document.getElementById('web-quick-topics'),
            webNavBar: document.getElementById('web-nav-bar'),
            webNavBackBtn: document.getElementById('web-nav-back-btn'),
            webNavForwardBtn: document.getElementById('web-nav-forward-btn'),
            webNavNewBtn: document.getElementById('web-nav-new-btn'),
            webNavTitle: document.getElementById('web-nav-title'),
            webNavSourceLink: document.getElementById('web-nav-source-link'),

            // File upload, paste modal & Gutenberg fetch
            fileUploadInput: document.getElementById('custom-book-file-input'),
            openPasteBtn: document.getElementById('open-paste-modal-btn'),
            pasteModal: document.getElementById('reader-paste-modal'),
            pasteTitleInput: document.getElementById('paste-book-title-input'),
            pasteTextInput: document.getElementById('paste-book-text-input'),
            pasteSubmitBtn: document.getElementById('paste-book-submit-btn'),
            gutenbergUrlInput: document.getElementById('gutenberg-url-input'),
            gutenbergFetchBtn: document.getElementById('gutenberg-fetch-btn'),
            gutenbergHint: document.getElementById('gutenberg-help-hint')
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

        // Paste Text Modal bindings
        this.dom.openPasteBtn?.addEventListener('click', () => {
            this.openPasteModal();
        });

        this.dom.pasteSubmitBtn?.addEventListener('click', () => {
            const title = this.dom.pasteTitleInput?.value.trim() || 'Custom Story';
            const text = this.dom.pasteTextInput?.value.trim();
            if (!text) {
                alert('Please paste some text to read.');
                return;
            }
            this.createCustomBook(title, text);
            this.closeAllDrawers();
        });

        // Gutenberg URL fetch
        this.dom.gutenbergFetchBtn?.addEventListener('click', () => {
            const url = this.dom.gutenbergUrlInput?.value.trim();
            if (url) this.loadGutenbergFromUrl(url);
        });

        // Web & Wikipedia Browser bindings
        this.dom.webBtn?.addEventListener('click', () => this.openWebModal());
        this.dom.webSearchInput?.addEventListener('input', (e) => this.handleWebSearchInput(e.target.value));
        this.dom.webSearchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.triggerWebSearch();
            }
        });
        this.dom.webSearchBtn?.addEventListener('click', () => this.triggerWebSearch());
        this.dom.webLangSelect?.addEventListener('change', () => this.renderQuickTopics());
        this.dom.webNavBackBtn?.addEventListener('click', () => this.navigateWebHistory(-1));
        this.dom.webNavForwardBtn?.addEventListener('click', () => this.navigateWebHistory(1));
        this.dom.webNavNewBtn?.addEventListener('click', () => this.openWebModal());

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

        // 1. Merge locally stored custom/uploaded books from localStorage (excluding temporary web articles)
        try {
            const localCustom = JSON.parse(localStorage.getItem('reading_custom_books') || '{}');
            let cleanedLocal = false;
            Object.keys(localCustom).forEach(key => {
                if (key.startsWith('wiki-') || localCustom[key].isWebArticle) {
                    delete localCustom[key];
                    cleanedLocal = true;
                }
            });
            if (cleanedLocal) {
                localStorage.setItem('reading_custom_books', JSON.stringify(localCustom));
            }

            Object.values(localCustom).forEach(book => {
                if (!book.id.startsWith('wiki-') && !book.isWebArticle && !this.booksManifest.find(b => b.id === book.id)) {
                    this.booksManifest.unshift({
                        id: book.id,
                        title: book.title,
                        author: book.author || 'Custom Upload',
                        language: book.language || 'de',
                        languageName: book.languageName || 'German',
                        languageFlag: book.languageFlag || '🌐',
                        description: book.description || 'Uploaded Book',
                        difficulty: book.difficulty || 'Custom Book',
                        difficultyLevel: book.difficultyLevel || 'intermediate',
                        chaptersCount: book.chapters ? book.chapters.length : 1,
                        isCloud: true,
                        source: 'cloud',
                        updatedAt: book.updatedAt || Date.now()
                    });
                }
            });
        } catch (e) {
            console.warn('Could not load local custom books:', e);
        }

        // 2. Fetch shared cloud books from Firebase Realtime Database
        if (db) {
            try {
                const snapshot = await get(ref(db, 'reading_books_meta'));
                if (snapshot.exists()) {
                    const cloudMetaMap = snapshot.val();
                    Object.values(cloudMetaMap).forEach(meta => {
                        if (!meta.id.startsWith('wiki-') && !meta.isWebArticle) {
                            const existingIdx = this.booksManifest.findIndex(b => b.id === meta.id);
                            if (existingIdx >= 0) {
                                this.booksManifest[existingIdx] = meta;
                            } else {
                                this.booksManifest.unshift(meta);
                            }
                        }
                    });
                }

                // Setup realtime listener so books uploaded or deleted appear or disappear instantly!
                onValue(ref(db, 'reading_books_meta'), (snapshot) => {
                    const cloudMetaMap = snapshot.exists() ? snapshot.val() : {};
                    const cloudIds = Object.keys(cloudMetaMap);

                    // Remove any cloud books that were deleted from Firebase
                    this.booksManifest = this.booksManifest.filter(b => {
                        if (b.isCloud || b.source === 'cloud') {
                            return cloudIds.includes(b.id);
                        }
                        return true;
                    });

                    // Add or update cloud books
                    Object.values(cloudMetaMap).forEach(meta => {
                        if (!meta.id.startsWith('wiki-') && !meta.isWebArticle) {
                            const existingIdx = this.booksManifest.findIndex(b => b.id === meta.id);
                            if (existingIdx === -1) {
                                this.booksManifest.unshift(meta);
                            } else {
                                this.booksManifest[existingIdx] = meta;
                            }
                        }
                    });

                    if (this.dom.libraryModal?.classList.contains('open')) {
                        this.renderBookshelf();
                    }
                });
            } catch (err) {
                console.warn('Could not load cloud books metadata from Firebase:', err);
            }
        }
    }

    async loadBook(bookId, chapterIndex = 0) {
        try {
            this.showToast('Loading book...');
            let bookData = null;

            // 1. Try local assets/books/
            try {
                const res = await fetch(`assets/books/${bookId}.json`);
                if (res.ok) {
                    bookData = await res.json();
                }
            } catch (e) {}

            // 2. Try localStorage custom books
            if (!bookData) {
                try {
                    const localCustom = JSON.parse(localStorage.getItem('reading_custom_books') || '{}');
                    if (localCustom[bookId]) {
                        bookData = localCustom[bookId];
                    }
                } catch (e) {}
            }

            // 3. Try Firebase Realtime Database cloud library
            if (!bookData && db) {
                this.showToast('☁️ Fetching book from Cloud Library...');
                const snapshot = await get(ref(db, `reading_books/${bookId}`));
                if (snapshot.exists()) {
                    bookData = snapshot.val();
                    // Cache in localStorage for future fast loading
                    try {
                        const local = JSON.parse(localStorage.getItem('reading_custom_books') || '{}');
                        local[bookId] = bookData;
                        localStorage.setItem('reading_custom_books', JSON.stringify(local));
                    } catch (e) {}
                }
            }

            if (!bookData) {
                throw new Error(`Book "${bookId}" not found in assets, local storage, or cloud library.`);
            }

            this.currentBook = bookData;
            this.currentChapterIndex = Math.min(Math.max(0, chapterIndex), (this.currentBook.chapters?.length || 1) - 1);

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

        // Update Web Navigation Bar if reading a web/Wikipedia article
        if (this.currentBook && this.currentBook.isWebArticle) {
            this.dom.webNavBar?.classList.add('show');
            if (this.dom.webNavTitle) {
                this.dom.webNavTitle.textContent = `${this.currentBook.title} (${chap.title})`;
            }
            if (this.dom.webNavSourceLink) {
                this.dom.webNavSourceLink.href = this.currentBook.webUrl || '#';
            }
        } else {
            this.dom.webNavBar?.classList.remove('show');
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
        // If the user was dragging to select multiple words/sentences, don't trigger word-click
        const selection = window.getSelection();
        if (selection && selection.toString().trim().split(/\s+/).length > 1) {
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

        // Check if word is inside a Wikipedia article link
        const linkParent = wordSpan.closest('a');
        let wikiTopic = null;
        if (linkParent && this.currentBook && this.currentBook.isWebArticle) {
            const href = linkParent.getAttribute('href');
            if (href && (href.includes('/wiki/') || href.startsWith('./'))) {
                const topic = href.replace(/^.*\/wiki\//, '').replace(/^\.\//, '');
                wikiTopic = decodeURIComponent(topic).replace(/_/g, ' ');
            }
        }

        this.showTranslationPopup({
            type: 'word',
            text: cleanWord,
            targetEl: wordSpan,
            targetRect: wordSpan.getBoundingClientRect(),
            contextSentence: this.getSentenceAroundElement(wordSpan),
            wikiTopic: wikiTopic
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

        // Display Wikipedia Article jump button if clicked inside a wiki hyperlink
        let wikiBtn = this.dom.popup.querySelector('#popup-wiki-article-btn');
        if (data.wikiTopic) {
            if (!wikiBtn) {
                wikiBtn = document.createElement('button');
                wikiBtn.id = 'popup-wiki-article-btn';
                wikiBtn.className = 'reader-icon-btn primary';
                wikiBtn.style.cssText = 'width: 100%; justify-content: center; font-size: 0.76rem; padding: 0.4rem 0.6rem; margin-top: 0.45rem;';
                this.dom.popup.appendChild(wikiBtn);
            }
            wikiBtn.style.display = 'flex';
            wikiBtn.innerHTML = `<span>📖 Read Wikipedia: "${data.wikiTopic}" →</span>`;
            wikiBtn.onclick = (e) => {
                e.stopPropagation();
                this.hidePopup();
                this.loadWikipediaArticle(data.wikiTopic, srcLang);
            };
        } else if (wikiBtn) {
            wikiBtn.style.display = 'none';
        }

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
        const cacheKey = `${srcLang}_${targetLang}_${cleanKey}`;

        // 1. Check in-memory / local storage cache (v3)
        if (this.translationCache[cacheKey]) {
            const cachedVal = this.translationCache[cacheKey];
            // If cached value was an untranslated echo of the source word, invalidate it
            if (cachedVal.toLowerCase() !== cleanKey) {
                return cachedVal;
            }
        }

        // Helper: returns true only if the result is valid and NOT an identical echo
        const isValidTranslation = (cand) => {
            if (!cand || typeof cand !== 'string') return false;
            const trimmed = cand.trim();
            if (!trimmed) return false;
            // Reject if the result is just the input word repeated
            if (trimmed.toLowerCase() === cleanKey && cleanKey.length > 2) {
                return false;
            }
            return true;
        };

        // 2. Primary Engine: Google Official Chrome Dictionary API (clients5.google.com)
        // High availability, ultra-fast, 100% accurate neural translations, no echo
        try {
            const chromeApiUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${srcLang}&tl=${targetLang}&q=${encodeURIComponent(text)}`;
            const res = await fetch(chromeApiUrl);
            if (res.ok) {
                const data = await res.json();
                let trans = null;
                if (Array.isArray(data) && data[0]) {
                    trans = Array.isArray(data[0]) ? data[0][0] : data[0];
                }
                if (isValidTranslation(trans)) {
                    const cleanTrans = trans.trim();
                    this.cacheTranslation(cacheKey, cleanTrans);
                    return cleanTrans;
                }
            }
        } catch (e) {
            console.warn('Google clients5 API error, trying secondary Google GTX:', e);
        }

        // 3. Secondary Engine: Google Translate GTX endpoint (translate.googleapis.com)
        try {
            const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcLang}&tl=${targetLang}&dt=t&dt=bd&q=${encodeURIComponent(text)}`;
            const gRes = await fetch(googleUrl);
            if (gRes.ok) {
                const gData = await gRes.json();
                if (gData && gData[0]) {
                    const trans = gData[0].map(item => item[0]).filter(Boolean).join('');
                    if (isValidTranslation(trans)) {
                        const cleanTrans = trans.trim();
                        this.cacheTranslation(cacheKey, cleanTrans);
                        return cleanTrans;
                    }
                }
            }
        } catch (e) {
            console.warn('Google Translate GTX error, checking dictionary & fallbacks:', e);
        }

        // 4. High-frequency offline dictionary fallback for common words (0ms)
        if (!cleanKey.includes(' ') && this.offlineDict[cleanKey]) {
            const entry = this.offlineDict[cleanKey];
            const result = entry.t;
            if (isValidTranslation(result)) {
                this.cacheTranslation(cacheKey, result);
                return result;
            }
        }

        // 5. Tertiary fallback: MyMemory (crowdsourced memory, filtered for quality)
        try {
            const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang}|${targetLang}`;
            const res = await fetch(myMemoryUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.responseData && data.responseData.translatedText) {
                    const trans = data.responseData.translatedText.trim();
                    // Reject weirdly long crowdsourced text or identical echo for single words
                    if (isValidTranslation(trans) && !(cleanKey.split(' ').length === 1 && (trans.includes(',') || trans.split(' ').length > 3))) {
                        this.cacheTranslation(cacheKey, trans);
                        return trans;
                    }
                }
            }
        } catch (e) {
            console.warn('MyMemory fallback error:', e);
        }

        // 6. Quaternary fallback: Lingva Translate public API (only if not echoing)
        try {
            const lingvaUrl = `https://lingva.ml/api/v1/${srcLang}/${targetLang}/${encodeURIComponent(text)}`;
            const lRes = await fetch(lingvaUrl);
            if (lRes.ok) {
                const lData = await lRes.json();
                if (lData && isValidTranslation(lData.translation)) {
                    const cleanTrans = lData.translation.trim();
                    this.cacheTranslation(cacheKey, cleanTrans);
                    return cleanTrans;
                }
            }
        } catch (e) {
            console.warn('Lingva translation fallback error:', e);
        }

        // 7. Offline placeholder if all network requests fail
        return `[Translation unavailable offline]`;
    }

    cacheTranslation(key, value) {
        this.translationCache[key] = value;
        try {
            localStorage.setItem('reading_trans_cache_v3', JSON.stringify(this.translationCache));
        } catch (e) {
            // storage quota full
        }
    }

    loadTranslationCache() {
        try {
            // Purge legacy caches which stored crowdsourced or echoed words (e.g. "morgens" -> "morgens")
            localStorage.removeItem('reading_trans_cache');
            localStorage.removeItem('reading_trans_cache_v2');

            const cached = localStorage.getItem('reading_trans_cache_v3');
            if (cached) {
                this.translationCache = JSON.parse(cached);
            }
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
        const cleanText = text.trim();
        if (!cleanText) return;

        const langMap = {
            'de': 'de',
            'fr': 'fr',
            'es': 'es',
            'it': 'it',
            'en': 'en',
            'ru': 'ru',
            'ja': 'ja'
        };
        const voiceLang = langMap[lang] || 'de';

        // 1. Google Official TTS Audio (Natural human pronunciation across all browsers: Safari, Chrome, iOS)
        try {
            const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${voiceLang}&q=${encodeURIComponent(cleanText)}`;
            const audio = new Audio(googleTtsUrl);
            audio.playbackRate = 0.95;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.showToast(`Pronouncing: "${cleanText.substring(0, 25)}"`);
                }).catch(err => {
                    console.warn('Google TTS play error, falling back to Web Speech API:', err);
                    this.speakWebSpeech(cleanText, voiceLang);
                });
                return;
            }
        } catch (e) {
            console.warn('Google TTS initialization error, falling back to Web Speech API:', e);
        }

        this.speakWebSpeech(cleanText, voiceLang);
    }

    speakWebSpeech(cleanText, lang) {
        if (!window.speechSynthesis) {
            this.showToast('Speech synthesis not supported on this browser');
            return;
        }

        window.speechSynthesis.cancel(); // Stop any previous utterance

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const fullLangMap = {
            'de': 'de-DE',
            'fr': 'fr-FR',
            'es': 'es-ES',
            'it': 'it-IT',
            'en': 'en-US'
        };
        utterance.lang = fullLangMap[lang] || 'de-DE';
        utterance.rate = 0.9;

        // Prioritize natural / Siri / Google voices over legacy robotic compact voices
        const voices = window.speechSynthesis.getVoices();
        const langVoices = voices.filter(v => v.lang.startsWith(utterance.lang.substring(0, 2)));
        const bestVoice = langVoices.find(v => !v.name.includes('Compact') && (v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Enhanced'))) || langVoices[0];
        if (bestVoice) utterance.voice = bestVoice;

        window.speechSynthesis.speak(utterance);
        this.showToast(`Pronouncing: "${cleanText.substring(0, 25)}..."`);
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
        this.dom.pasteModal?.classList.remove('open');
        this.dom.webModal?.classList.remove('open');
        if (this.dom.webSuggestions) this.dom.webSuggestions.style.display = 'none';
    }

    openWebModal() {
        this.closeAllDrawers();
        this.renderQuickTopics();
        this.dom.overlay?.classList.add('open');
        this.dom.webModal?.classList.add('open');
        setTimeout(() => this.dom.webSearchInput?.focus(), 120);
    }

    openPasteModal(defaultTitle = '') {
        this.closeAllDrawers();
        if (this.dom.pasteTitleInput && defaultTitle) {
            this.dom.pasteTitleInput.value = defaultTitle;
        }
        this.dom.overlay?.classList.add('open');
        this.dom.pasteModal?.classList.add('open');
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
        } else if (this.activeLibraryFilter === 'cloud') {
            books = books.filter(b => b.isCloud || b.source === 'cloud' || b.source === 'custom');
        } else if (this.activeLibraryFilter && this.activeLibraryFilter !== 'all') {
            books = books.filter(b => b.language === this.activeLibraryFilter);
        }

        if (books.length === 0) {
            this.dom.bookShelfGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--read-text-muted);">
                    <div style="font-size: 2.8rem; margin-bottom: 0.6rem;">☁️</div>
                    <div style="font-size: 1.05rem; font-weight: 700; color: var(--read-text); margin-bottom: 0.3rem;">No books found in this category</div>
                    <div style="font-size: 0.85rem; max-width: 400px; margin: 0 auto;">Upload an .epub book or paste text below to add it to your cloud library!</div>
                </div>
            `;
            return;
        }

        const iconMap = {
            'grimms-maerchen': '🐺',
            'deutsche-fabeln': '🦊',
            'alltagsgeschichten': '☕',
            'japanische-maerchen': '🌸',
            'der-fremde': '👤',
            'die-verwandlung': '🪲',
            'le-tour-du-monde': '🚂',
            'don-quijote': '🛡️'
        };

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = `book-card ${this.currentBook && this.currentBook.id === book.id ? 'active-book' : ''}`;

            const icon = iconMap[book.id] || (book.isCloud ? '☁️' : '📚');
            const coverHtml = book.cover
                ? `<img src="${book.cover}" alt="${book.title}" class="book-cover-img" />`
                : `<div class="book-cover-placeholder">${icon}</div>`;

            const diffClass = (book.difficultyLevel === 'beginner' || (book.difficulty && book.difficulty.includes('Beginner')))
                ? 'diff-beginner'
                : (book.difficultyLevel === 'advanced' ? 'diff-advanced' : 'diff-intermediate');

            const isStaticAsset = [
                'grimms-maerchen', 'deutsche-fabeln', 'alltagsgeschichten',
                'japanische-maerchen', 'der-fremde', 'die-verwandlung',
                'le-tour-du-monde', 'don-quijote'
            ].includes(book.id);
            const isDeletable = !isStaticAsset || book.isCloud || book.source === 'cloud' || book.source === 'custom';

            const cloudTagHtml = book.isCloud
                ? `<span class="badge-tag" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);">☁️ Cloud Synced</span>`
                : `<span class="badge-tag">${book.featured ? 'Featured' : 'Read'}</span>`;

            const delBtnHtml = isDeletable
                ? `<button class="book-card-del-btn" title="Delete from Library and Cloud" type="button">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                   </button>`
                : '';

            card.innerHTML = `
                <div class="book-cover-wrap">
                    ${coverHtml}
                </div>
                <div class="book-card-content">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; margin-bottom: 0.2rem;">
                        <span class="book-card-lang">${book.languageFlag || '🌐'} ${book.languageName || (book.language ? book.language.toUpperCase() : 'MULTI')}</span>
                        <span class="diff-badge ${diffClass}">${book.difficulty || 'All Levels'}</span>
                    </div>
                    <div class="book-card-title">${book.title}</div>
                    <div class="book-card-author">${book.author || 'Unknown Author'} ${book.year ? `(${book.year})` : ''}</div>
                    <div class="book-card-desc">${book.description || 'Custom uploaded book.'}</div>
                    <div class="book-card-footer">
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span>📖 ${book.chaptersCount || 1} Chapters</span>
                            ${cloudTagHtml}
                        </div>
                        ${delBtnHtml}
                    </div>
                </div>
            `;

            const delBtn = card.querySelector('.book-card-del-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteBook(book.id);
                });
            }

            card.addEventListener('click', () => {
                this.loadBook(book.id);
            });

            this.dom.bookShelfGrid.appendChild(card);
        });
    }

    // =========================================================================
    // Custom Book Upload & In-Browser EPUB Parser
    // =========================================================================

    async handleFileUpload(file) {
        try {
            this.showToast(`Processing: ${file.name}...`);
            let bookData = null;

            if (file.name.toLowerCase().endsWith('.epub')) {
                bookData = await this.parseEpubFile(file);
            } else if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.xhtml')) {
                const html = await file.text();
                const name = file.name.replace(/\.[^/.]+$/, '');
                bookData = {
                    id: `html-${Date.now()}`,
                    title: name,
                    author: 'Custom Upload',
                    language: 'de',
                    languageName: 'German / Multi',
                    languageFlag: '🇩🇪',
                    targetLanguage: 'en',
                    description: 'Custom HTML Book',
                    difficulty: 'Uploaded File',
                    difficultyLevel: 'intermediate',
                    chaptersCount: 1,
                    isCloud: true,
                    source: 'cloud',
                    updatedAt: Date.now(),
                    chapters: [{
                        index: 0,
                        id: 'chap-1',
                        title: 'Chapter 1',
                        html: html
                    }]
                };
            } else {
                // Text file (.txt or generic)
                const text = await file.text();
                const name = file.name.replace(/\.[^/.]+$/, '');
                const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
                const bodyHtml = paragraphs.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('\n');
                bookData = {
                    id: `txt-${Date.now()}`,
                    title: name,
                    author: 'Custom Text',
                    language: 'de',
                    languageName: 'German / Multi',
                    languageFlag: '🇩🇪',
                    targetLanguage: 'en',
                    description: `Text Document (${paragraphs.length} paragraphs)`,
                    difficulty: 'Uploaded Text',
                    difficultyLevel: 'intermediate',
                    chaptersCount: 1,
                    isCloud: true,
                    source: 'cloud',
                    updatedAt: Date.now(),
                    chapters: [{
                        index: 0,
                        id: 'chap-1',
                        title: 'Chapter 1',
                        html: bodyHtml
                    }]
                };
            }

            if (bookData) {
                this.currentBook = bookData;
                this.currentChapterIndex = 0;
                localStorage.setItem('reading_active_book_id', bookData.id);
                this.renderBookMeta();
                this.renderTOC();
                this.renderChapter(0);
                this.closeAllDrawers();
                this.showToast(`Opened: ${bookData.title}`);

                // Automatically save to local and Firebase Cloud Library
                await this.saveBookToCloudAndLocal(bookData);
            }
        } catch (err) {
            console.error('EPUB / File parsing error:', err);
            alert(`Could not parse EPUB book: ${err.message}`);
            this.showToast('Failed to open file. Please verify it is a valid EPUB/text file.');
        }
    }

    /**
     * Parses an EPUB (.epub) ZIP archive in-browser using JSZip.
     * Extracts OPF manifest, spine reading order, chapter XHTML documents,
     * inlines embedded images into base64 data URLs, and structures clean chapters.
     */
    async parseEpubFile(file) {
        if (!window.JSZip) {
            throw new Error('JSZip library not loaded. Please check your internet connection.');
        }

        const zip = await window.JSZip.loadAsync(file);

        // Helper to locate files in zip with case-insensitivity and slash normalization
        const findZipFile = (path) => {
            if (zip.file(path)) return zip.file(path);
            const normPath = path.replace(/\\/g, '/');
            if (zip.file(normPath)) return zip.file(normPath);
            const lower = normPath.toLowerCase();
            for (const name of Object.keys(zip.files)) {
                if (name.toLowerCase() === lower) return zip.files[name];
            }
            const baseName = normPath.split('/').pop().toLowerCase();
            for (const name of Object.keys(zip.files)) {
                if (name.split('/').pop().toLowerCase() === baseName) return zip.files[name];
            }
            return null;
        };

        const resolveZipPath = (baseDir, relativePath) => {
            const raw = (baseDir + decodeURIComponent(relativePath)).replace(/\\/g, '/');
            const parts = raw.split('/');
            const stack = [];
            for (const part of parts) {
                if (part === '.' || part === '') continue;
                if (part === '..') {
                    if (stack.length > 0) stack.pop();
                } else {
                    stack.push(part);
                }
            }
            return stack.join('/');
        };

        // 1. Read META-INF/container.xml to find the root OPF file
        let containerFile = findZipFile('META-INF/container.xml');
        let opfPath = null;
        const domParser = new DOMParser();

        if (containerFile) {
            const containerXml = await containerFile.async('string');
            const containerDoc = domParser.parseFromString(containerXml, 'application/xml');
            const rootfile = containerDoc.querySelector('rootfile');
            if (rootfile) {
                opfPath = rootfile.getAttribute('full-path');
            }
        }

        if (!opfPath) {
            // Fallback: search for any .opf file in the archive
            for (const name of Object.keys(zip.files)) {
                if (name.toLowerCase().endsWith('.opf')) {
                    opfPath = name;
                    break;
                }
            }
        }

        if (!opfPath) {
            throw new Error('No OPF package manifest found inside EPUB archive.');
        }

        const opfFile = findZipFile(opfPath);
        if (!opfFile) {
            throw new Error(`OPF package file not found at path: ${opfPath}`);
        }

        const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
        const opfXml = await opfFile.async('string');
        const opfDoc = domParser.parseFromString(opfXml, 'application/xml');

        // 2. Extract Metadata (Title, Author, Language)
        const titleEl = opfDoc.querySelector('title');
        const creatorEl = opfDoc.querySelector('creator');
        const langEl = opfDoc.querySelector('language');

        const fallbackName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/\{[^}]+\}/g, ' ')
            .replace(/\[[^\]]+\]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const bookTitle = titleEl?.textContent?.trim() || fallbackName || 'Untitled EPUB';
        const bookAuthor = creatorEl?.textContent?.trim() || 'Unknown Author';
        const rawLang = langEl?.textContent?.trim()?.toLowerCase() || 'de';
        const bookLang = rawLang.split('-')[0].split('_')[0].slice(0, 2) || 'de';

        const langMap = {
            'de': 'German',
            'en': 'English',
            'fr': 'French',
            'es': 'Spanish',
            'it': 'Italian',
            'ru': 'Russian',
            'ja': 'Japanese'
        };

        // 3. Map manifest items: id -> href & media-type
        const manifestMap = {};
        opfDoc.querySelectorAll('manifest > item').forEach(item => {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type');
            if (id && href) {
                manifestMap[id] = { href, mediaType };
            }
        });

        // 4. Read spine itemrefs to preserve the exact linear reading order
        const spineRefs = Array.from(opfDoc.querySelectorAll('spine > itemref'));
        const chapters = [];

        for (let i = 0; i < spineRefs.length; i++) {
            const idref = spineRefs[i].getAttribute('idref');
            const item = manifestMap[idref];
            if (!item || !item.href) continue;

            const chapterZipPath = resolveZipPath(opfDir, item.href);
            const chapterFile = findZipFile(chapterZipPath);
            if (!chapterFile) continue;

            try {
                const chapterRaw = await chapterFile.async('string');
                const chapDoc = domParser.parseFromString(chapterRaw, 'text/html');

                const chapDir = chapterZipPath.includes('/') ? chapterZipPath.substring(0, chapterZipPath.lastIndexOf('/') + 1) : '';

                // Convert relative image URLs to base64 data URIs
                const imgEls = Array.from(chapDoc.querySelectorAll('img, image'));
                for (const img of imgEls) {
                    const src = img.getAttribute('src') || img.getAttribute('xlink:href') || img.getAttribute('href');
                    if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
                        const imgPath = resolveZipPath(chapDir, src);
                        const imgFile = findZipFile(imgPath);
                        if (imgFile) {
                            try {
                                const ext = imgPath.split('.').pop().toLowerCase();
                                const mime = ext === 'png' ? 'image/png' : (ext === 'svg' ? 'image/svg+xml' : (ext === 'webp' ? 'image/webp' : 'image/jpeg'));
                                const b64 = await imgFile.async('base64');
                                const dataUri = `data:${mime};base64,${b64}`;
                                if (img.hasAttribute('src')) img.setAttribute('src', dataUri);
                                if (img.hasAttribute('xlink:href')) img.setAttribute('xlink:href', dataUri);
                                if (img.hasAttribute('href')) img.setAttribute('href', dataUri);
                            } catch (e) {
                                console.warn('Could not encode image:', imgPath, e);
                            }
                        }
                    }
                }

                // Extract Chapter Title
                const headingEl = chapDoc.querySelector('h1, h2, h3, .chapter-title, .title, title');
                let chapTitle = headingEl?.textContent?.trim()?.replace(/\s+/g, ' ');
                if (!chapTitle || chapTitle.length > 70) {
                    chapTitle = `Chapter ${chapters.length + 1}`;
                }

                // Remove script, style, and link elements to avoid polluting reader styles
                chapDoc.querySelectorAll('script, style, link').forEach(el => el.remove());

                const bodyHtml = chapDoc.body ? chapDoc.body.innerHTML.trim() : chapterRaw.trim();
                const textOnly = chapDoc.body ? chapDoc.body.textContent.trim() : '';

                // Skip only if completely empty (no text and no images)
                if (textOnly.length === 0 && !chapDoc.querySelector('img, image, svg')) {
                    continue;
                }

                chapters.push({
                    index: chapters.length,
                    id: `chap-${chapters.length + 1}`,
                    title: chapTitle,
                    html: bodyHtml
                });
            } catch (err) {
                console.warn(`Error parsing chapter ${item.href}:`, err);
            }
        }

        if (chapters.length === 0) {
            throw new Error('Could not extract any readable chapters from the EPUB.');
        }

        const safeId = 'epub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        return {
            id: safeId,
            title: bookTitle,
            author: bookAuthor,
            language: bookLang,
            languageName: langMap[bookLang] || bookLang.toUpperCase(),
            languageFlag: bookLang === 'de' ? '🇩🇪' : (bookLang === 'fr' ? '🇫🇷' : (bookLang === 'es' ? '🇪🇸' : '🌐')),
            targetLanguage: 'en',
            description: `EPUB Book • ${chapters.length} chapters`,
            difficulty: 'Custom EPUB',
            difficultyLevel: 'intermediate',
            chaptersCount: chapters.length,
            isCloud: true,
            source: 'cloud',
            updatedAt: Date.now(),
            chapters: chapters
        };
    }

    /**
     * Persists uploaded/custom books to:
     * 1) localStorage (for fast offline reading on this machine)
     * 2) Firebase Realtime Database (so the book is automatically synchronized to other computers)
     */
    async saveBookToCloudAndLocal(bookData) {
        // 1. Save locally
        try {
            const localCustom = JSON.parse(localStorage.getItem('reading_custom_books') || '{}');
            localCustom[bookData.id] = bookData;
            localStorage.setItem('reading_custom_books', JSON.stringify(localCustom));
        } catch (e) {
            console.warn('LocalStorage save warning:', e);
        }

        const meta = {
            id: bookData.id,
            title: bookData.title,
            author: bookData.author || 'Custom Author',
            language: bookData.language || 'de',
            languageName: bookData.languageName || 'German',
            languageFlag: bookData.languageFlag || '🌐',
            description: bookData.description || `Custom Book • ${bookData.chapters ? bookData.chapters.length : 1} Chapters`,
            difficulty: bookData.difficulty || 'Custom Book',
            difficultyLevel: bookData.difficultyLevel || 'intermediate',
            chaptersCount: bookData.chapters ? bookData.chapters.length : 1,
            isCloud: true,
            source: 'cloud',
            updatedAt: bookData.updatedAt || Date.now()
        };

        const existingIdx = this.booksManifest.findIndex(b => b.id === bookData.id);
        if (existingIdx >= 0) {
            this.booksManifest[existingIdx] = meta;
        } else {
            this.booksManifest.unshift(meta);
        }

        // 2. Sync to Firebase Cloud Database
        if (db) {
            try {
                this.showToast('☁️ Syncing book to Cloud Library...');
                await set(ref(db, `reading_books_meta/${bookData.id}`), meta);
                await set(ref(db, `reading_books/${bookData.id}`), bookData);
                this.showToast('✅ Saved to Cloud Library! Available on all your devices.');
            } catch (err) {
                console.error('Firebase cloud save error:', err);
                this.showToast('Saved locally (Cloud sync failed or offline).');
            }
        }

        // Re-render shelf if open
        if (this.dom.libraryModal?.classList.contains('open')) {
            this.renderBookshelf();
        }
    }

    async deleteBook(bookId) {
        const book = this.booksManifest.find(b => b.id === bookId);
        const title = book ? book.title : 'this book';
        if (!confirm(`Are you sure you want to delete "${title}" from your library and cloud?`)) {
            return;
        }

        this.showToast(`Deleting "${title}"...`);

        // 1. Remove from in-memory manifest
        this.booksManifest = this.booksManifest.filter(b => b.id !== bookId);

        // 2. Remove from LocalStorage
        try {
            const localCustom = JSON.parse(localStorage.getItem('reading_custom_books') || '{}');
            if (localCustom[bookId]) {
                delete localCustom[bookId];
                localStorage.setItem('reading_custom_books', JSON.stringify(localCustom));
            }
        } catch (e) {
            console.warn('LocalStorage delete warning:', e);
        }

        // 3. Remove from Firebase Realtime Database
        if (db) {
            try {
                await remove(ref(db, `reading_books_meta/${bookId}`));
                await remove(ref(db, `reading_books/${bookId}`));
            } catch (err) {
                console.error('Firebase cloud delete error:', err);
            }
        }

        // 4. If currently reading this book, switch back to default
        if (this.currentBook && this.currentBook.id === bookId) {
            const fallbackId = this.booksManifest[0]?.id || 'japanische-maerchen';
            await this.loadBook(fallbackId);
        }

        // 5. Update UI
        this.renderBookshelf();
        this.showToast(`Deleted "${title}"`);
    }

    async createCustomBook(title, content, isHtml = false) {
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const bodyHtml = isHtml ? content : paragraphs.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('\n');

        const customBook = {
            id: `custom-${Date.now()}`,
            title: title || 'Custom Story',
            author: 'Custom Text',
            language: 'de',
            languageName: 'German / Multi',
            languageFlag: '🇩🇪',
            targetLanguage: 'en',
            description: `Custom text (${paragraphs.length} paragraphs)`,
            difficulty: 'Custom Text',
            difficultyLevel: 'intermediate',
            chaptersCount: 1,
            isCloud: true,
            source: 'cloud',
            updatedAt: Date.now(),
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
        localStorage.setItem('reading_active_book_id', customBook.id);
        this.renderBookMeta();
        this.renderTOC();
        this.renderChapter(0);
        this.closeAllDrawers();
        this.showToast(`Loaded: ${customBook.title}`);

        await this.saveBookToCloudAndLocal(customBook);
    }

    async loadGutenbergFromUrl(url) {
        if (!url) return;
        this.showToast('Checking Gutenberg book...');

        // Clear previous hint
        if (this.dom.gutenbergHint) {
            this.dom.gutenbergHint.style.display = 'none';
            this.dom.gutenbergHint.innerHTML = '';
        }

        // Extract Gutenberg ID
        const idMatch = url.match(/\/(\d+)(?:\.[^/]+)?$/) || url.match(/ebooks\/(\d+)/) || url.match(/^(\d+)$/);
        if (!idMatch) {
            alert('Please enter a valid Project Gutenberg URL or eBook ID (e.g. 36227 or 23393)');
            return;
        }
        const ebookId = idMatch[1];

        // 1. Check if this book is already in our manifest or preloaded!
        const existing = this.booksManifest.find(b =>
            b.gutenbergId == ebookId ||
            b.id == ebookId ||
            (ebookId === '36227' && b.id === 'der-fremde') ||
            (ebookId === '23393' && b.id === 'japanische-maerchen') ||
            (ebookId === '22367' && b.id === 'die-verwandlung') ||
            (ebookId === '800' && b.id === 'le-tour-du-monde') ||
            (ebookId === '2000' && b.id === 'don-quijote')
        );

        if (existing) {
            this.showToast(`Found "${existing.title}" in library! Loading...`);
            await this.loadBook(existing.id);
            return;
        }

        // 2. Check if local JSON exists for this ID
        try {
            const localRes = await fetch(`assets/books/${ebookId}.json`);
            if (localRes.ok) {
                const data = await localRes.json();
                this.currentBook = data;
                this.currentChapterIndex = 0;
                this.renderBookMeta();
                this.renderTOC();
                this.renderChapter(0);
                this.closeAllDrawers();
                this.showToast(`Loaded ${data.title}!`);
                return;
            }
        } catch (e) {}

        this.showToast(`Fetching Gutenberg #${ebookId}...`);

        // 3. Attempt downloading via CORS-friendly proxies with timeout
        const directUrl = `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.txt`;
        const proxyUrls = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`
        ];

        let text = null;
        for (const pUrl of proxyUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                const res = await fetch(pUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const candidateText = await res.text();
                    if (candidateText && candidateText.length > 200 && !candidateText.includes('error code: 522')) {
                        text = candidateText;
                        break;
                    }
                }
            } catch (err) {
                // try next proxy
            }
        }

        if (text) {
            this.createCustomBook(`Gutenberg #${ebookId}`, text);
            this.showToast(`Loaded Gutenberg #${ebookId}!`);
            return;
        }

        // 4. If all automated downloads are blocked by Gutenberg's strict CORS/bot filter,
        // provide immediate, clear, friendly 1-click fallback buttons:
        if (this.dom.gutenbergHint) {
            this.dom.gutenbergHint.style.display = 'block';
            this.dom.gutenbergHint.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.85rem; margin-top: 0.5rem;">
                    <div style="color: #fca5a5; font-weight: 700; font-size: 0.84rem; margin-bottom: 0.25rem;">
                        ⚠️ Project Gutenberg blocks direct in-browser downloads due to CORS policy.
                    </div>
                    <div style="color: var(--read-text-muted); font-size: 0.78rem; line-height: 1.45; margin-bottom: 0.7rem;">
                        To read <strong>Gutenberg #${ebookId}</strong>, you can download it directly or copy-paste its text below:
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <a href="${directUrl}" target="_blank" rel="noopener noreferrer" class="reader-icon-btn" style="text-decoration: none; font-size: 0.75rem;">
                            📥 Open pg${ebookId}.txt in New Tab
                        </a>
                        <button type="button" class="reader-icon-btn primary" id="gutenberg-paste-helper-btn" style="font-size: 0.75rem;">
                            📋 Paste Text Directly
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('gutenberg-paste-helper-btn')?.addEventListener('click', () => {
                this.openPasteModal(`Gutenberg #${ebookId}`);
            });
        }
        this.showToast('Gutenberg blocked direct browser download. See options below.');
    }

    // =========================================================================
    // Web & Wikipedia In-App Article Browser
    // =========================================================================

    handleWebSearchInput(query) {
        clearTimeout(this._searchTimer);
        const trimmed = (query || '').trim();
        if (trimmed.length < 2) {
            if (this.dom.webSuggestions) this.dom.webSuggestions.style.display = 'none';
            return;
        }

        this._searchTimer = setTimeout(async () => {
            const lang = this.dom.webLangSelect ? this.dom.webLangSelect.value : 'de';
            try {
                const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(trimmed)}&limit=6&format=json&origin=*`;
                const res = await fetch(searchUrl);
                if (res.ok) {
                    const data = await res.json();
                    const suggestions = data[1] || [];
                    this.renderWebSuggestions(suggestions, lang);
                }
            } catch (e) {
                console.warn('Wikipedia OpenSearch error:', e);
            }
        }, 200);
    }

    renderWebSuggestions(suggestions, lang) {
        if (!this.dom.webSuggestions) return;
        if (!suggestions || suggestions.length === 0) {
            this.dom.webSuggestions.style.display = 'none';
            return;
        }

        this.dom.webSuggestions.innerHTML = '';
        suggestions.forEach(title => {
            const div = document.createElement('div');
            div.className = 'web-suggestion-item';
            div.innerHTML = `
                <span class="web-suggestion-title">📖 ${title}</span>
                <span class="web-suggestion-meta">${lang.toUpperCase()} Wikipedia</span>
            `;
            div.addEventListener('click', () => {
                if (this.dom.webSearchInput) this.dom.webSearchInput.value = title;
                this.dom.webSuggestions.style.display = 'none';
                this.loadWikipediaArticle(title, lang);
            });
            this.dom.webSuggestions.appendChild(div);
        });
        this.dom.webSuggestions.style.display = 'block';
    }

    triggerWebSearch() {
        const query = this.dom.webSearchInput ? this.dom.webSearchInput.value.trim() : '';
        if (!query) return;
        const lang = this.dom.webLangSelect ? this.dom.webLangSelect.value : 'de';
        if (this.dom.webSuggestions) this.dom.webSuggestions.style.display = 'none';
        this.loadWikipediaArticle(query, lang);
    }

    renderQuickTopics() {
        if (!this.dom.webQuickTopics) return;
        const lang = this.dom.webLangSelect ? this.dom.webLangSelect.value : 'de';

        const topicsByLang = {
            'de': [
                'Albert Camus', 'Philosophie', 'Künstliche Intelligenz', 'Franz Kafka',
                'Berlin', 'Deutsche Literatur', 'Grimms Märchen', 'Psychologie', 'Quantenmechanik', 'Sonne'
            ],
            'fr': [
                'Albert Camus', "L'Étranger", 'Philosophie', 'Paris', 'Victor Hugo',
                'Révolution française', 'Intelligence artificielle', 'Cinéma français'
            ],
            'es': [
                'Don Quijote', 'Gabriel García Márquez', 'Filosofía', 'Madrid',
                'Historia de España', 'Inteligencia artificial', 'Literatura española'
            ],
            'it': [
                'Dante Alighieri', 'Divina Commedia', 'Roma', 'Leonardo da Vinci', 'Filosofia', 'Rinascimento'
            ],
            'en': [
                'Albert Camus', 'Philosophy', 'Artificial intelligence', 'German literature', 'Existentialism'
            ]
        };

        const topics = topicsByLang[lang] || topicsByLang['de'];
        this.dom.webQuickTopics.innerHTML = '';

        topics.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'web-topic-chip';
            btn.innerHTML = `<span>📖</span> <span>${t}</span>`;
            btn.addEventListener('click', () => {
                if (this.dom.webSearchInput) this.dom.webSearchInput.value = t;
                this.loadWikipediaArticle(t, lang);
            });
            this.dom.webQuickTopics.appendChild(btn);
        });
    }

    /**
     * Loads any Wikipedia article in the chosen language.
     * Parses sections into chapters, fixes relative images, and enables live in-app reading.
     */
    async loadWikipediaArticle(query, lang = 'de', addToHistory = true) {
        if (!query || !query.trim()) return;
        let cleanQuery = query.trim();

        // Detect if input was a full Wikipedia URL (e.g. https://de.wikipedia.org/wiki/Albert_Camus)
        const urlMatch = cleanQuery.match(/([a-z]{2,3})\.wikipedia\.org\/wiki\/([^#?]+)/i);
        if (urlMatch) {
            lang = urlMatch[1].toLowerCase();
            cleanQuery = decodeURIComponent(urlMatch[2]).replace(/_/g, ' ');
        }

        this.showToast(`🌐 Fetching "${cleanQuery}" from Wikipedia (${lang.toUpperCase()})...`);

        try {
            const apiTitle = encodeURIComponent(cleanQuery.replace(/ /g, '_'));
            let articleHtml = null;
            let articleTitle = cleanQuery;

            // 1. Attempt direct REST API HTML fetch
            const restUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/html/${apiTitle}`;
            const res = await fetch(restUrl);
            if (res.ok) {
                articleHtml = await res.text();
            } else {
                // Fallback: search via OpenSearch for closest match
                const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=1&format=json&origin=*`;
                const sRes = await fetch(searchUrl);
                if (sRes.ok) {
                    const sData = await sRes.json();
                    if (sData[1] && sData[1][0]) {
                        articleTitle = sData[1][0];
                        const retryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(articleTitle.replace(/ /g, '_'))}`;
                        const rRes = await fetch(retryUrl);
                        if (rRes.ok) {
                            articleHtml = await rRes.text();
                        }
                    }
                }
            }

            if (!articleHtml) {
                throw new Error(`Could not find Wikipedia article for "${cleanQuery}".`);
            }

            // 2. Parse and sanitize article HTML
            const domParser = new DOMParser();
            const doc = domParser.parseFromString(articleHtml, 'text/html');

            const titleEl = doc.querySelector('title, h1');
            if (titleEl) {
                articleTitle = titleEl.textContent.trim().replace(/ - Wikipedia.*$/, '');
            }

            // Remove unneeded Wikipedia UI junk
            doc.querySelectorAll('script, style, link, .mw-editsection, .navbox, .vertical-navbox, .metadata, sup.reference').forEach(el => el.remove());

            // Fix image src protocols (e.g. //upload.wikimedia.org -> https://upload.wikimedia.org)
            doc.querySelectorAll('img, source').forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('//')) {
                    img.setAttribute('src', 'https:' + src);
                }
                const srcset = img.getAttribute('srcset');
                if (srcset) {
                    img.setAttribute('srcset', srcset.replace(/(^|\s)\/\//g, '$1https://'));
                }
            });

            // 3. Structure into chapters by major section
            const sections = Array.from(doc.querySelectorAll('section'));
            const chapters = [];

            if (sections.length > 1) {
                sections.forEach((sec, idx) => {
                    const h = sec.querySelector('h2, h3, h1');
                    let secTitle = h ? h.textContent.trim() : (idx === 0 ? 'Introduction' : `Section ${idx + 1}`);
                    const secText = sec.textContent.trim();
                    if (secText.length > 25 || sec.querySelector('img')) {
                        chapters.push({
                            index: chapters.length,
                            id: `sec-${chapters.length + 1}`,
                            title: secTitle,
                            html: sec.innerHTML
                        });
                    }
                });
            }

            if (chapters.length === 0) {
                chapters.push({
                    index: 0,
                    id: 'sec-1',
                    title: articleTitle,
                    html: doc.body ? doc.body.innerHTML : articleHtml
                });
            }

            const langNameMap = {
                'de': 'German',
                'fr': 'French',
                'es': 'Spanish',
                'it': 'Italian',
                'en': 'English'
            };
            const langFlagMap = {
                'de': '🇩🇪',
                'fr': '🇫🇷',
                'es': '🇪🇸',
                'it': '🇮🇹',
                'en': '🇬🇧'
            };

            const bookData = {
                id: `wiki-${lang}-${encodeURIComponent(articleTitle).toLowerCase().replace(/%/g, '').substring(0, 30)}`,
                title: articleTitle,
                author: `Wikipedia (${lang.toUpperCase()})`,
                language: lang,
                languageName: langNameMap[lang] || lang.toUpperCase(),
                languageFlag: langFlagMap[lang] || '🌐',
                targetLanguage: 'en',
                description: `Wikipedia Article • ${chapters.length} sections`,
                difficulty: 'Wikipedia Article',
                difficultyLevel: 'intermediate',
                chaptersCount: chapters.length,
                isWebArticle: true,
                webUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(articleTitle.replace(/ /g, '_'))}`,
                isCloud: false,
                source: 'web',
                updatedAt: Date.now(),
                chapters: chapters
            };

            // 4. Update Web History
            if (addToHistory) {
                this.webHistory = this.webHistory.slice(0, this.webHistoryIndex + 1);
                this.webHistory.push({ title: articleTitle, lang: lang });
                this.webHistoryIndex = this.webHistory.length - 1;
            }
            this.updateWebNavHistoryButtons();

            // 5. Render Book & Close Modal
            this.currentBook = bookData;
            this.currentChapterIndex = 0;
            // Note: Wikipedia articles are ephemeral live reading sessions and not saved to the library
            this.renderBookMeta();
            this.renderTOC();
            this.renderChapter(0);
            this.closeAllDrawers();
            this.showToast(`Opened: ${articleTitle}`);

        } catch (err) {
            console.error('Wikipedia load error:', err);
            alert(`Could not load Wikipedia article: ${err.message}`);
            this.showToast('Failed to load Wikipedia article.');
        }
    }

    navigateWebHistory(delta) {
        const newIndex = this.webHistoryIndex + delta;
        if (newIndex >= 0 && newIndex < this.webHistory.length) {
            this.webHistoryIndex = newIndex;
            const item = this.webHistory[newIndex];
            this.loadWikipediaArticle(item.title, item.lang, false);
            this.updateWebNavHistoryButtons();
        }
    }

    updateWebNavHistoryButtons() {
        if (this.dom.webNavBackBtn) {
            this.dom.webNavBackBtn.disabled = this.webHistoryIndex <= 0;
        }
        if (this.dom.webNavForwardBtn) {
            this.dom.webNavForwardBtn.disabled = this.webHistoryIndex >= this.webHistory.length - 1;
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
