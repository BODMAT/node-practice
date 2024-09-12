const path = require("path");
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

//! changable for other file
const startSymbols = "за";
const textPath = path.resolve(__dirname, "data", "ofitsier_iz_striis_kogho_parku_andrii_viktorovich_kokotiukha.pdf");
const wordsPath = path.resolve(__dirname, "data", "з-words.docx");
const outputPath = path.resolve(__dirname, "data", 'output.txt');

//перевірка чи це окреме слово
function checkSpacesAroundString(inputString, searchString) {
    if (searchString === inputString.trim(" ")) {
        return true;
    } else {
        return false;
    }
}

//! pdf parser
let text = [];
async function extractTextFromPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);

        const pages = data.text.split('\n\n');
        let textArr = [];
        pages.forEach((page) => {
            textArr.push(page);
        });

        text = textArr;
    } catch (err) {
        console.error(err);
    }
}

//! docx parser "filtered - за"
const ending = [["и", "і", "ь", "у", "a", "e", "ой", "ом", "ою", "о", "ові", "еві", "ю", "ем", "єм", "ям", "ів", "ей", "їв", "ами", "ями", "ах", "ях", "оми"],
["в", "а", "ла", "вши", "ємо", "їмо", "вся", "лася", "мось", "ся", "ася", "яся", "емо", "ли", "имо", "иму", "єся"],
["ий", "ая", "еє", "ій", "іє", "ія", "ого", "ому", "ою", "ім", "іх", "им", "ими", "іми"],
["о", "е", "і", "и"],
["а", "е", "ого", "ому", "иму", "іму", "їму", "им", "їм"],];

let words = [];
async function parseDocxFile(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const wordsStr = result.value;
        let wordsArr = wordsStr.split('\n\n').filter(str => str.trim().startsWith(startSymbols));
        wordsArr = wordsArr.map((el) => (el.slice(0, el.indexOf("."))));
        wordsArr = wordsArr.filter((str) => (str.split(' ').length === 2));
        wordsArr = wordsArr.map(el => el.replaceAll('*', '').replaceAll('\t', ''))
        words = wordsArr;
    } catch (err) {
        console.error(err);
    }
}

//! transformation+finding+writer
let countStr = 0;
function makeResult(text, currentWord, word, result, found) {
    for (let pageNum = 0; pageNum < text.length; pageNum++) {
        let page = text[pageNum];
        if (page.includes(currentWord)) {
            let wordIndex = page.indexOf(currentWord);
            if (checkSpacesAroundString(page.slice(wordIndex - 1, wordIndex + currentWord.length + 1), currentWord)) {
                let leftBorder = -1;
                let rightBorder = -1;

                // Знаходження лівої межі
                for (let i = wordIndex - 1; i >= 0; i--) {
                    if ([".", "!", "?", "—"].includes(page[i])) {
                        leftBorder = i;
                        break;
                    }
                }

                // Знаходження правої межі
                for (let i = wordIndex + currentWord.length; i < page.length; i++) {
                    if ([".", "!", "?", "—"].includes(page[i])) {
                        rightBorder = i;
                        break;
                    }
                }

                // Якщо права межа не знайдена, встановити її на кінець сторінки
                if (rightBorder === -1) {
                    rightBorder = page.length;
                }

                let subString = page.slice(leftBorder + 1, rightBorder + 1);
                result += `${++countStr}) ${word} - ${subString.replace(/\n/g, '').replace(/\s{2,}/g, ' ')} (${pageNum}) \n`;
                found = true;
                break;

            }
        }
    }
    return { result, found };
}

Promise.all([parseDocxFile(wordsPath), extractTextFromPdf(textPath)]).then(() => {
    let result = "";
    words.forEach(wordLine => {
        let word = wordLine.split(" ")[0];
        let status = wordLine.split(" ")[1];
        let found = false;

        // Перевірка на наявність чисел в слові
        if (!/\d/.test(word)) {
            //без змін закінчень
            let { result: newResult, found: newFound } = makeResult(text, word, word, result, found);
            result = newResult;
            found = newFound;
            //зі змінами закінчень
            if (!found) {
                if (status === "ім") {
                    for (let i = 0; i < ending[0].length; i++) {
                        let end = ending[0][i];
                        let currentWord = word + end;
                        let { result: newResult, found: newFound } = makeResult(text, currentWord, word, result, found);
                        result = newResult;
                        found = newFound;
                    }
                }
                if (status === "ім") {
                    for (let i = 0; i < ending[0].length; i++) {
                        let end = ending[0][i];
                        let currentWord = word.slice(0, word.length - 1) + end;
                        let { result: newResult, found: newFound } = makeResult(text, currentWord, word, result, found);
                        result = newResult;
                        found = newFound;
                    }
                }
                if (status === "дієсл") {
                    for (let i = 0; i < ending[1].length; i++) {
                        let end = ending[1][i];
                        let currentWord = word.slice(0, word.length - 2) + end;
                        let { result: newResult, found: newFound } = makeResult(text, currentWord, word, result, found);
                        result = newResult;
                        found = newFound;
                    }
                }
                if (status === "прикм") {
                    for (let i = 0; i < ending[2].length; i++) {
                        let end = ending[2][i];
                        let currentWord = word.slice(0, word.length - 1) + end;
                        let { result: newResult, found: newFound } = makeResult(text, currentWord, word, result, found);
                        result = newResult;
                        found = newFound;
                    }
                }
                if (status === "присл") {
                    for (let i = 0; i < ending[3].length; i++) {
                        let end = ending[3][i];
                        let currentWord = word.slice(0, word.length - 1) + end;
                        let { result: newResult, found: newFound } = makeResult(text, currentWord, word, result, found);
                        result = newResult;
                        found = newFound;
                    }
                }
                if (status === "дієприкм") {
                    for (let i = 0; i < ending[4].length; i++) {
                        let end = ending[4][i];
                        let currentWord = word.slice(0, word.length - 2) + end;
                        let { result: newResult, found: newFound } = makeResult(text, currentWord, word, result, found);
                        result = newResult;
                        found = newFound;
                    }
                }
            }
        }
    });

    return result;
}).then((content) => {
    fs.writeFile(outputPath, content, (err) => {
        if (err) {
            console.error('Помилка при записуванні файла:', err);
        } else {
            console.log('Файл успішно записаний:', outputPath);
        }
    });
});