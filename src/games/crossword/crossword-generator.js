// Azerbaijani alphabet validation (uppercase only)
const AZ_VALID = /^[ABCÇDEƏFGĞHIİJKQLMNOÖPRSŞTUÜVXYZ]+$/;

/**
 * Fetch random words + descriptions from az.wikipedia.org.
 * Uses generator=random with prop=extracts to get title + first sentence in one call.
 */
export async function fetchWordsFromWikipedia() {
    const words = new Map();

    const fetchBatch = () =>
        fetch(
            'https://az.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=20&prop=extracts&exintro=true&explaintext=true&exsentences=2&format=json&origin=*'
        )
            .then(r => r.json())
            .catch(() => null);

    // Fire 15 parallel requests → 300 random articles
    const results = await Promise.all(Array.from({ length: 15 }, fetchBatch));

    for (const data of results) {
        if (!data?.query?.pages) continue;

        for (const page of Object.values(data.query.pages)) {
            const title = page.title.toLocaleUpperCase('az');

            // Only single words, no spaces/dashes/parens/digits
            if (/[\s\-\(\),\d\.':;]/.test(title)) continue;
            if (title.length < 3 || title.length > 9) continue;
            if (!AZ_VALID.test(title)) continue;
            if (words.has(title)) continue;

            let extract = page.extract?.trim();
            if (!extract || extract.length < 20) continue;

            // Step 1: Remove the title from the beginning
            const titleLower = page.title;
            let hint = extract.replace(new RegExp(`^${escapeRegex(titleLower)}\\s*`, 'i'), '');

            // Step 2: Strip ALL leading parenthetical blocks (etymology notes like "(q.yun. ...)" or "(lat. ...)")
            hint = hint.replace(/^(\s*\([^)]*\)\s*[—\-–:,]?\s*)+/g, '');

            // Step 3: Remove leading dashes, colons, commas
            hint = hint.replace(/^[—\-–:,]\s*/, '');

            // Step 4: Smart sentence split — don't break on abbreviation periods (q.yun. lat. ing. etc.)
            // Match a period/!/? that is followed by a space and then an uppercase letter or digit
            const sentenceMatch = hint.match(/^(.+?[.!?])(?:\s+[A-ZƏÖÜŞÇĞİ0-9])/);
            if (sentenceMatch) {
                hint = sentenceMatch[1].trim();
            }

            // Step 5: Remove trailing period
            hint = hint.replace(/\.\s*$/, '');

            // Step 6: Remove any remaining occurrences of the title word
            hint = hint.replace(new RegExp(escapeRegex(titleLower), 'gi'), '___');

            // Step 7: Capitalize first letter
            if (hint.length > 0) {
                hint = hint[0].toLocaleUpperCase('az') + hint.slice(1);
            }

            // Step 8: Truncate overly long hints
            if (hint.length > 120) hint = hint.substring(0, 117) + '...';

            // Step 9: Quality checks — reject garbage
            if (!hint || hint.length < 10) continue;
            if (/^\s*\(/.test(hint)) continue;         // Still starts with parenthetical
            if (/^\.\.\./.test(hint)) continue;         // Broken replacement
            if (hint.split(/\s+/).length < 3) continue; // Fewer than 3 words
            if (/^\s*$/.test(hint)) continue;            // Blank

            words.set(title, { word: title, hint });
        }
    }

    return Array.from(words.values());
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fallback dictionary used when Wikipedia is unreachable.
 */
export const FALLBACK_WORDS = [
    { word: "PLANET", hint: "Ulduz ətrafında fırlanan göy cismi" },
    { word: "VULKAN", hint: "Yerin təkindən lava püskürən dağ" },
    { word: "ORMAN", hint: "Ağaclarla örtülü geniş ərazi" },
    { word: "KOMPAS", hint: "Cəhətləri göstərən naviqasiya aləti" },
    { word: "ŞAHMAT", hint: "64 xanalı lövhədə oynanılan strateji oyun" },
    { word: "OKEAN", hint: "Yer kürəsinin böyük hissəsini örtən duzlu su" },
    { word: "MOZAIKA", hint: "Kiçik parçalardan düzülmüş dekorativ sənət əsəri" },
    { word: "MEDAL", hint: "Yarışda qazanılan metal mükafat" },
    { word: "OPERA", hint: "Musiqili-dramatik səhnə əsəri" },
    { word: "MAQNIT", hint: "Dəmiri özünə cəzb edən cisim" },
    { word: "KÜLƏŞ", hint: "Taxıl biçildikdən sonra qalan quru saplar" },
    { word: "ATOM", hint: "Maddənin ən kiçik hissəciyi" },
    { word: "GÖBƏLƏK", hint: "Nə bitki, nə heyvan olan canlı orqanizm" },
    { word: "ROBOT", hint: "İnsan əməyini əvəz edən avtomatik mexanizm" },
    { word: "BALET", hint: "Rəqs əsasında qurulan səhnə sənəti" },
    { word: "TUNEL", hint: "Dağın və ya yerin altından keçən yol" },
    { word: "ANANAS", hint: "Tropik iqlimli ölkələrdə yetişən tikanlı meyvə" },
    { word: "LIMON", hint: "Turş dadlı sarı rəngli sitrus meyvəsi" },
    { word: "FENOMEN", hint: "Qeyri-adi, nadir hadisə" },
    { word: "KAMERA", hint: "Şəkil və ya video çəkmək üçün cihaz" },
    { word: "SATRANC", hint: "İki oyunçu arasında oynanılan ağıl yarışı" },
    { word: "LAVA", hint: "Vulkandan axan ərinmiş süxur" },
    { word: "QALA", hint: "Ortaçağda müdafiə üçün tikilmiş istehkam" },
    { word: "FLORA", hint: "Müəyyən ərazidəki bitki örtüyünün məcmusu" },
    { word: "FAUNA", hint: "Müəyyən ərazidəki heyvanlar aləmi" },
    { word: "ATLAS", hint: "Xəritələr toplusundan ibarət kitab" },
    { word: "EPOX", hint: "Tarixdə böyük dəyişikliklə başlayan dövr" },
    { word: "HOVUZ", hint: "Üzmək üçün su ilə doldurulmuş çala" },
    { word: "SULTAN", hint: "Osmanlı dövlətinin hökmdarı" },
    { word: "BOLQAR", hint: "Cənubi Avropada slavyan xalqı" },
];

/**
 * Crossword layout generator.
 * Places words on a grid maximizing intersections for a dense, newspaper-style layout.
 */
export class CrosswordGenerator {
    constructor(dictionary) {
        this.dictionary = [...dictionary];
    }

    generate(targetCount = 20) {
        let bestLayout = null;
        let bestScore = -Infinity;

        for (let attempt = 0; attempt < 300; attempt++) {
            const pool = this.shuffle([...this.dictionary]).slice(0, Math.min(targetCount * 3, this.dictionary.length));
            const grid = new Map(); // "r,c" → char
            const placed = [];

            // Place first word horizontally
            const first = pool.shift();
            this._place(first, 0, 0, 'across', grid, placed);

            // Iteratively place remaining words
            let stuck = 0;
            while (pool.length > 0 && placed.length < targetCount && stuck < pool.length) {
                let bestPlacement = null;
                let bestIdx = -1;
                let bestIntersections = 0;

                for (let i = 0; i < pool.length; i++) {
                    const candidates = this._findPlacements(pool[i].word, grid, placed);
                    for (const c of candidates) {
                        if (c.intersections > bestIntersections ||
                            (c.intersections === bestIntersections && Math.random() < 0.3)) {
                            bestIntersections = c.intersections;
                            bestPlacement = c;
                            bestIdx = i;
                        }
                    }
                }

                if (bestPlacement) {
                    this._place(pool[bestIdx], bestPlacement.r, bestPlacement.c, bestPlacement.dir, grid, placed);
                    pool.splice(bestIdx, 1);
                    stuck = 0;
                } else {
                    // Rotate the pool
                    pool.push(pool.shift());
                    stuck++;
                }
            }

            if (placed.length >= Math.min(10, Math.floor(targetCount * 0.5))) {
                const totalIntersections = this._countIntersections(placed, grid);
                const { width, height } = this._getBounds(placed);
                const area = width * height;
                const aspectPenalty = Math.abs(width - height) * 5;
                const score = placed.length * 100 + totalIntersections * 40 - area * 2 - aspectPenalty;

                if (score > bestScore) {
                    bestScore = score;
                    bestLayout = this._normalize(placed);
                }
            }
        }

        if (!bestLayout || bestLayout.length === 0) {
            // Absolute fallback: just place one word
            bestLayout = [{ ...this.dictionary[0], r: 0, c: 0, dir: 'across', num: 1 }];
        }

        // Number the layout
        this._numberLayout(bestLayout);

        const { width, height } = this._getBounds(bestLayout);
        return {
            layout: bestLayout,
            rows: height,
            cols: width
        };
    }

    _place(wordObj, r, c, dir, grid, placed) {
        placed.push({ ...wordObj, r, c, dir });
        for (let i = 0; i < wordObj.word.length; i++) {
            const tr = dir === 'across' ? r : r + i;
            const tc = dir === 'across' ? c + i : c;
            grid.set(`${tr},${tc}`, wordObj.word[i]);
        }
    }

    _findPlacements(word, grid, placed) {
        const results = [];

        for (const [key, gchar] of grid.entries()) {
            for (let idx = 0; idx < word.length; idx++) {
                if (word[idx] !== gchar) continue;
                const [gr, gc] = key.split(',').map(Number);

                // Try across: the letter at position idx should be at (gr, gc)
                const acrossR = gr;
                const acrossC = gc - idx;
                if (this._canPlace(word, acrossR, acrossC, 'across', grid)) {
                    const ints = this._countWordIntersections(word, acrossR, acrossC, 'across', grid);
                    results.push({ r: acrossR, c: acrossC, dir: 'across', intersections: ints });
                }

                // Try down
                const downR = gr - idx;
                const downC = gc;
                if (this._canPlace(word, downR, downC, 'down', grid)) {
                    const ints = this._countWordIntersections(word, downR, downC, 'down', grid);
                    results.push({ r: downR, c: downC, dir: 'down', intersections: ints });
                }
            }
        }

        return results;
    }

    _canPlace(word, r, c, dir, grid) {
        let intersections = 0;
        for (let i = 0; i < word.length; i++) {
            const tr = dir === 'across' ? r : r + i;
            const tc = dir === 'across' ? c + i : c;
            const key = `${tr},${tc}`;

            if (grid.has(key)) {
                if (grid.get(key) !== word[i]) return false;
                intersections++;
            } else {
                // Check parallel neighbors (avoid side-by-side words in the same direction)
                if (dir === 'across') {
                    if (grid.has(`${tr - 1},${tc}`) || grid.has(`${tr + 1},${tc}`)) return false;
                } else {
                    if (grid.has(`${tr},${tc - 1}`) || grid.has(`${tr},${tc + 1}`)) return false;
                }
            }
        }

        // Check before and after the word (no adjacent letters at word boundaries)
        if (dir === 'across') {
            if (grid.has(`${r},${c - 1}`) || grid.has(`${r},${c + word.length}`)) return false;
        } else {
            if (grid.has(`${r - 1},${c}`) || grid.has(`${r + word.length},${c}`)) return false;
        }

        return intersections > 0;
    }

    _countWordIntersections(word, r, c, dir, grid) {
        let count = 0;
        for (let i = 0; i < word.length; i++) {
            const tr = dir === 'across' ? r : r + i;
            const tc = dir === 'across' ? c + i : c;
            if (grid.has(`${tr},${tc}`)) count++;
        }
        return count;
    }

    _countIntersections(placed, grid) {
        const cellDirs = new Map(); // "r,c" → Set of directions
        for (const p of placed) {
            for (let i = 0; i < p.word.length; i++) {
                const tr = p.dir === 'across' ? p.r : p.r + i;
                const tc = p.dir === 'across' ? p.c + i : p.c;
                const key = `${tr},${tc}`;
                if (!cellDirs.has(key)) cellDirs.set(key, new Set());
                cellDirs.get(key).add(p.dir);
            }
        }
        let count = 0;
        for (const dirs of cellDirs.values()) {
            if (dirs.size > 1) count++;
        }
        return count;
    }

    _getBounds(placed) {
        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        for (const p of placed) {
            minR = Math.min(minR, p.r);
            minC = Math.min(minC, p.c);
            maxR = Math.max(maxR, p.dir === 'down' ? p.r + p.word.length - 1 : p.r);
            maxC = Math.max(maxC, p.dir === 'across' ? p.c + p.word.length - 1 : p.c);
        }
        return { minR, maxR, minC, maxC, width: maxC - minC + 1, height: maxR - minR + 1 };
    }

    _normalize(placed) {
        const { minR, minC } = this._getBounds(placed);
        return placed.map(p => ({ ...p, r: p.r - minR, c: p.c - minC }));
    }

    _numberLayout(layout) {
        layout.sort((a, b) => a.r !== b.r ? a.r - b.r : a.c - b.c);
        let num = 1;
        for (let i = 0; i < layout.length; i++) {
            if (i > 0 && layout[i].r === layout[i - 1].r && layout[i].c === layout[i - 1].c) {
                layout[i].num = layout[i - 1].num;
            } else {
                layout[i].num = num++;
            }
        }
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
