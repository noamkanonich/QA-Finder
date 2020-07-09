const express = require("express");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const request = require("request");
const ejs = require("ejs");
const axios = require("axios");
const { response } = require("express");
// const swagger = require("swagger");

const app = express();

var list = [];
var imageUrl = "";
var asinCode = "";
var productName = "";
var questions = [];
var answers = [];
var pageNumber = 1;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.get("/", function(req, res){
    res.render("index", {questions: questions, answers: answers, productName: productName, imageUrl: imageUrl, pageNumber: pageNumber});
})

app.post("/", (req, res)=> {
    asinCode = req.body.productAsin;
    list = [];
    questions = [];
    answers = [];
    url = "https://www.amazon.com/ask/questions/asin/" + asinCode;
    axios.get(url)
      .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
    
        $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());
        })

        productName = $('div.a-section.askProductDescription').find('a').text().trim();
        imageUrl = $('a.a-link-normal').find('img').attr('src');

        for(var i = 0 ; i < list.length ; i++){
            if(list[i] === "Question:"){
                questions.push(list[i+1]);
            }
            if(list[i] === "Answer:"){
                if(list[i+1].includes("see less")){
                    answers.push(list[i+1].substring(0, list[i+1].length - 8));
                }
                else{
                     answers.push(list[i+1]);
                }
        }
    }

    res.render("index", 
    {questions: questions, answers: answers, productName: productName, imageUrl: imageUrl, pageNumber: pageNumber});

    });
     
});


app.get("/more", function(req, res){
    res.render("index", {questions: questions, answers: answers, productName: productName, imageUrl: imageUrl, pageNumber: pageNumber});
})

app.post("/more",(req,res)=> {
    list = []
    pageNumber++;
    url =  "https://www.amazon.com/ask/questions/asin/" + asinCode + "/" + pageNumber;
    axios.get(url)
      .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
    
        $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());    
        })

        productName = $('div.a-section.askProductDescription').find('a').text().trim();
        imageUrl = $('a.a-link-normal').find('img').attr('src');
    
        for(var i = 0 ; i < list.length ; i++){
            if(list[i] === "Question:"){
                questions.push(list[i+1]);
            }
            if(list[i] === "Answer:"){
                if(list[i+1].includes("see less")){
                    answers.push(list[i+1].substring(0, list[i+1].length - 8)); 
                }
                else{
                    answers.push(list[i+1]);
                }
            }
        }
    
        res.render("index", 
        {questions: questions, answers: answers, productName: productName, imageUrl: imageUrl, pageNumber: pageNumber});
    });
     
});


app.listen(5000, function(){
    console.log("Server started on port 5000");
})
