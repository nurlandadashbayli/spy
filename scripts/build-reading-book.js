import fs from 'fs';
import path from 'path';

// 1. Process Japanische Märchen (Gutenberg 23393)
const basePath = './assets/books/japanische-maerchen/OEBPS';
const tocRaw = fs.readFileSync(path.join(basePath, 'toc.xhtml'), 'utf8');

const linkRegex = /<a href="([^"#]+)(?:#([^"]+))?"[^>]*>([^<]+)<\/a>/g;
let m;
const entries = [];
while ((m = linkRegex.exec(tocRaw)) !== null) {
  const file = m[1];
  const anchor = m[2];
  const title = m[3].replace(/\d+$/, '').trim();
  if (anchor && !['pgepubid00000', 'pgepubid00001', 'pgepubid00005', 'pgepubid00113', 'pg-footer-heading'].includes(anchor)) {
    entries.push({ file, anchor, title });
  }
}

const file0 = fs.readFileSync(path.join(basePath, '2824508384728103197_23393-h-0.htm.xhtml'), 'utf8');
const file1 = fs.readFileSync(path.join(basePath, '2824508384728103197_23393-h-1.htm.xhtml'), 'utf8');

const fileContents = {
  '2824508384728103197_23393-h-0.htm.xhtml': file0,
  '2824508384728103197_23393-h-1.htm.xhtml': file1
};

const jmChapters = [];

for (let i = 0; i < entries.length; i++) {
  const cur = entries[i];
  const next = entries[i + 1];
  const content = fileContents[cur.file];

  const anchorStr = 'id="' + cur.anchor + '"';
  const anchorIdx = content.indexOf(anchorStr);
  if (anchorIdx === -1) continue;

  // Check for headpiece illustration preceding chapter
  const searchBefore = content.substring(Math.max(0, anchorIdx - 350), anchorIdx);
  const headpieceMatch = searchBefore.match(/<img[^>]*src="([^"]*head[^"]*)"[^>]*>/i);
  let headpieceHtml = '';
  if (headpieceMatch) {
    headpieceHtml = `<div class="chapter-ornament"><img src="assets/books/japanische-maerchen/OEBPS/${headpieceMatch[1]}" alt="Ornament" class="ornament-img" /></div>`;
  }

  // Find start of the <h3> tag containing this anchor
  const headingStart = content.lastIndexOf('<h3', anchorIdx);
  const startIdx = headingStart !== -1 ? headingStart : anchorIdx;

  let endIdx = -1;
  if (next && next.file === cur.file) {
    const nextAnchorStr = 'id="' + next.anchor + '"';
    const nextAnchorIdx = content.indexOf(nextAnchorStr);
    const nextHeadingStart = content.lastIndexOf('<h3', nextAnchorIdx);
    endIdx = nextHeadingStart !== -1 ? nextHeadingStart : nextAnchorIdx;
  } else {
    if (cur.file.includes('h-0')) {
      endIdx = content.lastIndexOf('</section>');
      if (endIdx === -1) endIdx = content.lastIndexOf('</body>');
    } else {
      endIdx = content.indexOf('id="pgepubid00113"');
      if (endIdx === -1) endIdx = content.lastIndexOf('</section>') || content.lastIndexOf('</body>');
    }
  }

  let raw = content.substring(startIdx, endIdx);

  // Replace original h3 with cleaned modern heading
  raw = raw.replace(/<h3[^>]*>[\s\S]*?<\/h3>/i, '');

  // Clean drop caps: <img alt="X" src="..." style="float: left;"/>s waren -> Dropcap with alt letter
  raw = raw.replace(/<img\s+alt="([A-ZÄÖÜ])"\s+src="([^"]+)"[^>]*\/>([a-zäöüß])/gi, (match, letter, imgPath, nextChar) => {
    return `<span class="reader-dropcap-letter">${letter}</span>${nextChar}`;
  });

  // Rewrite remaining images to local assets
  raw = raw.replace(/src="(3761235858305626459_[^"]+)"/g, 'src="assets/books/japanische-maerchen/OEBPS/$1"');

  // Remove tag / footnote link clutter
  raw = raw.replace(/<a class="tag pginternal"[^>]*>.*?<\/a>/g, '');

  // Clean empty paragraphs or duplicate breaks
  raw = raw.replace(/<p>\s*<\/p>/g, '');

  const cleanTitle = cur.title.replace(/\.$/, '');

  jmChapters.push({
    index: i,
    id: cur.anchor,
    title: cleanTitle,
    headpiece: headpieceHtml,
    html: raw
  });
}

console.log(`Processed ${jmChapters.length} chapters for Japanische Märchen.`);

const japanischeMaerchenData = {
  id: 'japanische-maerchen',
  title: 'Japanische Märchen',
  author: 'Karl Alberti',
  year: '1913',
  language: 'de',
  languageName: 'German',
  targetLanguage: 'en',
  cover: 'assets/books/japanische-maerchen/OEBPS/3761235858305626459_cover_light_sm.jpg',
  description: 'Authentic collection of 24 Japanese folk legends, fairy tales, and ghost stories translated into German with period woodcut illustrations.',
  sourceUrl: 'https://www.gutenberg.org/ebooks/23393.epub3.images',
  gutenbergId: 23393,
  chapters: jmChapters
};

fs.writeFileSync('./assets/books/japanische-maerchen.json', JSON.stringify(japanischeMaerchenData, null, 2));

// 2. Process Die Verwandlung (Kafka)
const kafkaRaw = fs.readFileSync('./assets/books/die-verwandlung.txt', 'utf8');
const kStart = kafkaRaw.indexOf('I.\n\nAls Gregor Samsa');
const kEnd = kafkaRaw.indexOf('*** END OF THE PROJECT GUTENBERG EBOOK');
const kBody = kafkaRaw.substring(kStart > 0 ? kStart : 0, kEnd > 0 ? kEnd : kafkaRaw.length);

const kParts = kBody.split(/\n(?=[I|V|X]+\.\s*\n)/g);
const kafkaChapters = [];
const kTitles = [
  'Teil I — Das Ungeziefer',
  'Teil II — Die Verwandlung der Familie',
  'Teil III — Das Ende'
];

kParts.forEach((partText, idx) => {
  if (idx > 2) return;
  const lines = partText.trim().split(/\n\s*\n/);
  // remove the "I." heading line if separate
  if (lines[0].match(/^[I|V|X]+\.\s*$/)) {
    lines.shift();
  }
  const html = lines.map(p => `<p>${p.replace(/\n/g, ' ').trim()}</p>`).join('\n');
  kafkaChapters.push({
    index: idx,
    id: `kafka-part-${idx + 1}`,
    title: kTitles[idx] || `Teil ${idx + 1}`,
    html: html
  });
});

const kafkaData = {
  id: 'die-verwandlung',
  title: 'Die Verwandlung',
  author: 'Franz Kafka',
  year: '1915',
  language: 'de',
  languageName: 'German',
  targetLanguage: 'en',
  cover: '',
  description: 'The iconic novella following Gregor Samsa, a travelling salesman who wakes up one morning transformed into a monstrous insect.',
  sourceUrl: 'https://www.gutenberg.org/ebooks/22367',
  gutenbergId: 22367,
  chapters: kafkaChapters
};

fs.writeFileSync('./assets/books/die-verwandlung.json', JSON.stringify(kafkaData, null, 2));
console.log(`Processed ${kafkaChapters.length} chapters for Die Verwandlung.`);

// 3. Process Le Tour du monde en 80 jours (Jules Verne - French)
const verneRaw = fs.readFileSync('./assets/books/le-tour-du-monde.txt', 'utf8').replace(/\r\n/g, '\n');
const vStart = verneRaw.indexOf('I\n\nDANS LEQUEL');
const vEnd = verneRaw.indexOf('*** END OF THE PROJECT GUTENBERG EBOOK');
const vBody = verneRaw.substring(vStart > 0 ? vStart : 0, vEnd > 0 ? vEnd : verneRaw.length);

const verneChapters = [];
const vRegex = /(?:^|\n)([I|V|X|L]+)\n\n([^\n]+(?:\n[^\n]+)?)\n\n([\s\S]*?)(?=(?:\n[I|V|X|L]+\n\n[A-ZÀ-Ö]|\n\*\*\* END|$))/g;
let vm;
let vCount = 0;
while ((vm = vRegex.exec(vBody)) !== null && vCount < 10) {
  const num = vm[1];
  const title = vm[2].replace(/\n/g, ' ').trim();
  const text = vm[3].trim();
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).slice(0, 20);
  const html = paragraphs.map(p => `<p>${p.replace(/\n/g, ' ').trim()}</p>`).join('\n');

  verneChapters.push({
    index: vCount,
    id: `verne-chap-${vCount + 1}`,
    title: `Chapitre ${num}: ${title}`,
    html: html
  });
  vCount++;
}

const verneData = {
  id: 'le-tour-du-monde',
  title: 'Le Tour du monde en 80 jours',
  author: 'Jules Verne',
  year: '1873',
  language: 'fr',
  languageName: 'French',
  targetLanguage: 'en',
  cover: '',
  description: 'The thrilling adventure of Phileas Fogg and Passepartout attempting to circumnavigate the globe in 80 days.',
  sourceUrl: 'https://www.gutenberg.org/ebooks/800',
  gutenbergId: 800,
  chapters: verneChapters
};

fs.writeFileSync('./assets/books/le-tour-du-monde.json', JSON.stringify(verneData, null, 2));
console.log(`Processed ${verneChapters.length} chapters for Jules Verne.`);

// 4. Process Don Quijote (Spanish)
const quijoteRaw = fs.readFileSync('./assets/books/don-quijote.txt', 'utf8').replace(/\r\n/g, '\n');
const qStart = quijoteRaw.indexOf('Capítulo primero.');
const qBody = quijoteRaw.substring(qStart > 0 ? qStart : 0);

const qChapters = [];
const qRegex = /(Capítulo\s+[^\n]+)\n\n([\s\S]*?)(?=(?:\nCapítulo|\n\*\*\* END|$))/g;
let qm;
let qCount = 0;
while ((qm = qRegex.exec(qBody)) !== null && qCount < 8) {
  const title = qm[1].trim();
  const text = qm[2].trim();
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).slice(0, 18);
  const html = paragraphs.map(p => `<p>${p.replace(/\n/g, ' ').trim()}</p>`).join('\n');

  qChapters.push({
    index: qCount,
    id: `quijote-chap-${qCount + 1}`,
    title: title,
    html: html
  });
  qCount++;
}

const quijoteData = {
  id: 'don-quijote',
  title: 'Don Quijote de la Mancha',
  author: 'Miguel de Cervantes',
  year: '1605',
  language: 'es',
  languageName: 'Spanish',
  targetLanguage: 'en',
  cover: '',
  description: 'The monumental Spanish classic following the adventures of Alonso Quijano and his squire Sancho Panza.',
  sourceUrl: 'https://www.gutenberg.org/ebooks/2000',
  gutenbergId: 2000,
  chapters: qChapters
};

fs.writeFileSync('./assets/books/don-quijote.json', JSON.stringify(quijoteData, null, 2));
console.log(`Processed ${qChapters.length} chapters for Don Quijote.`);

// 5. Build Master Library Manifest
const libraryManifest = [
  {
    id: 'japanische-maerchen',
    title: 'Japanische Märchen',
    author: 'Karl Alberti',
    year: '1913',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: true,
    chaptersCount: jmChapters.length,
    cover: 'assets/books/japanische-maerchen/OEBPS/3761235858305626459_cover_light_sm.jpg',
    description: 'Enchanting Japanese fairy tales translated into German with authentic woodcuts. Click any word or sentence to see English translation!',
    gutenbergUrl: 'https://www.gutenberg.org/ebooks/23393.epub3.images',
    difficulty: 'Intermediate',
    genre: 'Fairy Tales & Legends'
  },
  {
    id: 'die-verwandlung',
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    year: '1915',
    language: 'de',
    languageFlag: '🇩🇪',
    languageName: 'German',
    targetLanguage: 'en',
    featured: false,
    chaptersCount: kafkaChapters.length,
    cover: '',
    description: 'Gregor Samsa wakes up transformed into an insect. A towering masterpiece of 20th-century literature.',
    gutenbergUrl: 'https://www.gutenberg.org/ebooks/22367',
    difficulty: 'Advanced',
    genre: 'Modernist Fiction'
  },
  {
    id: 'le-tour-du-monde',
    title: 'Le Tour du monde en 80 jours',
    author: 'Jules Verne',
    year: '1873',
    language: 'fr',
    languageFlag: '🇫🇷',
    languageName: 'French',
    targetLanguage: 'en',
    featured: false,
    chaptersCount: verneChapters.length,
    cover: '',
    description: 'Phileas Fogg and Passepartout embark on their world-famous wager across steamships, railways, and elephants.',
    gutenbergUrl: 'https://www.gutenberg.org/ebooks/800',
    difficulty: 'Intermediate',
    genre: 'Classic Adventure'
  },
  {
    id: 'don-quijote',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    year: '1605',
    language: 'es',
    languageFlag: '🇪🇸',
    languageName: 'Spanish',
    targetLanguage: 'en',
    featured: false,
    chaptersCount: qChapters.length,
    cover: '',
    description: 'The foundational novel of Western literature about the noble knight of La Mancha and his squire Sancho Panza.',
    gutenbergUrl: 'https://www.gutenberg.org/ebooks/2000',
    difficulty: 'Upper Intermediate',
    genre: 'Epic Chivalry'
  }
];

fs.writeFileSync('./assets/books/manifest.json', JSON.stringify(libraryManifest, null, 2));
console.log('Saved library manifest to assets/books/manifest.json');
