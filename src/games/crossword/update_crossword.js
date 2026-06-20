const fs = require('fs');

const content = `const crosswordData = [
    { num: 1, word: "BOZBAŞ", r: 0, c: 3, dir: "down", hint: "Ət və noxudla hazırlanan ənənəvi Azərbaycan yeməyi." },
    { num: 2, word: "ÇİNAR", r: 0, c: 9, dir: "across", hint: "Uzunömürlü, geniş çətirli nəhəng ağac." },
    { num: 3, word: "NOVRUZ", r: 0, c: 11, dir: "down", hint: "Baharın gəlişini qeyd edən milli bayram." },
    { num: 4, word: "KÜR", r: 3, c: 9, dir: "across", hint: "Qafqazın ən böyük çayı." },
    { num: 5, word: "PİTİ", r: 4, c: 14, dir: "down", hint: "Sxsı qablarda bişirilən Şəki mətbəxinə aid yemək." },
    { num: 6, word: "MÜŞFİQ", r: 5, c: 1, dir: "across", hint: "Azərbaycanın görkəmli şairi, repressiya qurbanı." },
    { num: 6, word: "MİRZƏ", r: 5, c: 1, dir: "down", hint: "\\"Hophopnamə\\" əsərinin müəllifi olan satirik şairin adı." },
    { num: 7, word: "QUTAB", r: 5, c: 6, dir: "down", hint: "İçərisinə ət və ya göyərti qoyularaq bişirilən xəmir xörəyi." },
    { num: 8, word: "NİZAMİ", r: 5, c: 9, dir: "across", hint: "\\"Xəmsə\\" müəllifi olan dahi Azərbaycan şairi." },
    { num: 8, word: "NEFT", r: 5, c: 9, dir: "down", hint: "Abşeron yarımadasında çıxarılan \\"qara qızıl\\"." },
    { num: 9, word: "ARAZ", r: 5, c: 12, dir: "down", hint: "Türkiyə, Ermənistan, İran və Azərbaycandan keçən çay." },
    { num: 10, word: "KƏLAĞAYI", r: 8, c: 3, dir: "down", hint: "Azərbaycan qadınlarının ənənəvi ipək baş örtüyü." },
    { num: 11, word: "MANAT", r: 8, c: 5, dir: "across", hint: "Azərbaycan Respublikasının milli pul vahidi." },
    { num: 12, word: "XƏZƏR", r: 9, c: 0, dir: "across", hint: "Yer kürəsində ən böyük qapalı su hövzəsi." },
    { num: 13, word: "PAXLAVA", r: 10, c: 5, dir: "down", hint: "Qoz və ya badam içi ilə hazırlanan şərbətli şirniyyat." },
    { num: 14, word: "QAFQAZ", r: 10, c: 7, dir: "down", hint: "Qara dənizlə Xəzər dənizi arasındakı dağlıq region." },
    { num: 15, word: "MƏHSƏTİ", r: 10, c: 11, dir: "down", hint: "XII əsrdə yaşamış görkəmli Azərbaycan şairəsi." },
    { num: 16, word: "QARABAĞ", r: 11, c: 2, dir: "across", hint: "Azərbaycanın qərb hissəsində tarixi ərazi." },
    { num: 17, word: "KƏPƏZ", r: 11, c: 10, dir: "across", hint: "Kiçik Qafqazda, Murovdağ silsiləsində dağ." },
    { num: 18, word: "MUĞAM", r: 12, c: 1, dir: "down", hint: "Azərbaycan ənənəvi musiqisinin əsas janrı." },
    { num: 19, word: "ŞUŞA", r: 13, c: 0, dir: "across", hint: "Azərbaycanın mədəniyyət paytaxtı sayılan şəhər." },
    { num: 20, word: "QOBUSTAN", r: 13, c: 7, dir: "across", hint: "Qədim qayaüstü rəsmləri ilə tanınan qoruq." },
    { num: 21, word: "BAKI", r: 15, c: 0, dir: "across", hint: "Azərbaycan Respublikasının paytaxtı." },
    { num: 22, word: "TAR", r: 16, c: 4, dir: "across", hint: "Azərbaycanın milli simli dartımlı musiqi aləti." }
];`;

let oldCrosswordJS = fs.readFileSync('crossword.js', 'utf8');
let newData = oldCrosswordJS.replace(/const crosswordData = \[([\s\S]*?)\];/, content);
newData = newData.replace(/const ROWS = \d+;/, 'const ROWS = 17;');
newData = newData.replace(/const COLS = \d+;/, 'const COLS = 17;');
newData = newData.replace(/const c = item\.dir === "across" \? item\.c \+ i \+ 5 : item\.c \+ 5;/g, 'const c = item.dir === "across" ? item.c + i + 1 : item.c + 1;'); // shift by 1 column and 0 rows since max_c = 14, wait, max_c is 14? 14+len(PITI)-1 = 14, no PITI down is 14+0 = 14. Wait, max_r=16, max_c=14.

fs.writeFileSync('crossword.js', newData);
console.log('updated');
