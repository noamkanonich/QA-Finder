const cheerio = require("cheerio");
const mongoose = require("mongoose");

function scrapeFunction(response) {
    let newProdcut = {
        asin: "",
        name: "",
        imageUrl: "",
        questions: [],
        answers: []
    }

    let list = [];
    const html = response.data;
    const $ = cheerio.load(html);

    $('div.a-section.askTeaserQuestions div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
        list.push($(element).text().trim());
    })
    newProdcut.name = $('div.a-section.askProductDescription').find('a').text().trim();
    newProdcut.imageUrl = $('a.a-link-normal').find('img').attr('src');

    for (var i = 0; i < list.length; i++) {
        if (list[i] === "Question:") {
            newProdcut.questions.push(list[i + 1]);
        }
        if (list[i] === "Answer:") {
            if (list[i + 1].includes("see less")) {
                newProdcut.answers.push(list[i + 1].substring(0, list[i + 1].length - 8));
            }
            else {
                newProdcut.answers.push(list[i + 1]);
            }
        }
    }
    return newProdcut;
}

function scrapeMoreQaFunction(response) {
    let list = [];
    let allList = {
        questionsList: [],
        answersList: []
    }
    const html = response.data;
    const $ = cheerio.load(html);
    $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
        list.push($(element).text().trim());
    })

    for (var i = 0; i < list.length; i++) {
        if (list[i] === "Question:") {
            allList.questionsList.push(list[i + 1]);
        }
        if (list[i] === "Answer:") {
            if (list[i + 1].includes("see less")) {
                allList.answersList.push(list[i + 1].substring(0, list[i + 1].length - 8));
            }
            else {
                allList.answersList.push(list[i + 1]);
            }
        }
    }
    return allList;

}

module.exports = { scrapeFunction, scrapeMoreQaFunction };