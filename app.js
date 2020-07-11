const express = require("express");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const request = require("request");
const ejs = require("ejs");
const axios = require("axios");
const { response } = require("express");

const app = express();

var list = [];
var pageNumber = 1;

var product = {
    asin: "",
    name: "",
    image: "",
    questions: [],
    answers: []
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));


app.get("/", function(req, res){
    res.render("index", 
    {questions: product.questions, answers: product.answers, productName: product.name, imageUrl: product.image, pageNumber: pageNumber});
})

app.post("/", (req, res)=> {
    list = [];
    product.asin = req.body.productAsin;
    product.questions = [];
    product.answers = [];
    url = "https://www.amazon.com/ask/questions/asin/" + product.asin;
    axios.get(url)
      .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
        $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());
        })
        product.name = $('div.a-section.askProductDescription').find('a').text().trim();
        product.image = $('a.a-link-normal').find('img').attr('src');
    
        for(var i = 0 ; i < list.length ; i++){
            if(list[i] === "Question:"){
                product.questions.push(list[i+1]);
            }
            if(list[i] === "Answer:"){
                if(list[i+1].includes("see less")){
                    product.answers.push(list[i+1].substring(0, list[i+1].length - 8));
                }
                else{
                    product.answers.push(list[i+1]);
                }
        }
    }

    res.render("index", 
    {questions: product.questions, answers: product.answers, productName: product.name, imageUrl: product.image, pageNumber: pageNumber});
    });
});

app.get("/more", function(req, res){
    res.render("index", 
    {questions: product.questions, answers: product.answers, productName: product.name, imageUrl: product.image, pageNumber: pageNumber});
})

app.post("/more", (req, res)=> {
    list = []
    pageNumber++;
    url =  "https://www.amazon.com/ask/questions/asin/" + product.asin + "/" + pageNumber;
    axios.get(url)
      .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
        $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());    
        })
    
        for(var i = 0 ; i < list.length ; i++){
            if(list[i] === "Question:"){
                product.questions.push(list[i+1]);
            }
            if(list[i] === "Answer:"){
                if(list[i+1].includes("see less")){
                    product.answers.push(list[i+1].substring(0, list[i+1].length - 8)); 
                }
                else{
                    product.answers.push(list[i+1]);
                }
            }
        }
    
        res.render("index", 
        {questions: product.questions, answers: product.answers, productName: product.name, imageUrl: product.image, pageNumber: pageNumber});
    }); 
});


//  <--- API --->

var product_api = {
    asin: "",
    name: "",
    image: "",
    questions: [],
    answers: []
}

app.route("/product/:asin")
.get(function(req, res) {
    res.send(product_api);
})
.post((req, res)=> {
    list = [];
    product_api.asin = req.params.asin;
    product_api.questions = [];
    product_api.answers = [];
    url = "https://www.amazon.com/ask/questions/asin/" + product_api.asin;
    axios.get(url)
      .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
        $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());
        })
        product_api.name = $('div.a-section.askProductDescription').find('a').text().trim();
        product_api.image = $('a.a-link-normal').find('img').attr('src');

        for(var i = 0 ; i < list.length ; i++){
            if(list[i] === "Question:"){
                product_api.questions.push(list[i+1]);
            }
            if(list[i] === "Answer:"){
                if(list[i+1].includes("see less")){
                    product_api.answers.push(list[i+1].substring(0, list[i+1].length - 8));
                }
                else{
                    product_api.answers.push(list[i+1]);
                }
         }
        }
    });
    res.send("Q&A was added successfuly!")
})

app.route("/product/more/:asin")
.get(function(req, res) {
    res.send(product_api);
})
.post((req, res)=> {
    list = [];
    pageNumber++;
    product_api.asin = req.params.asin;
    url = "https://www.amazon.com/ask/questions/asin/" + product_api.asin + "/" + pageNumber;
    axios.get(url)
      .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
        $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());
        })
        product_api.name = $('div.a-section.askProductDescription').find('a').text().trim();
        product_api.image = $('a.a-link-normal').find('img').attr('src');

        for(var i = 0 ; i < list.length ; i++){
            if(list[i] === "Question:"){
                product_api.questions.push(list[i+1]);
            }
            if(list[i] === "Answer:"){
                if(list[i+1].includes("see less")){
                    product_api.answers.push(list[i+1].substring(0, list[i+1].length - 8));
                }
                else{
                    product_api.answers.push(list[i+1]);
                }
            }
        }
    });
    res.send("More Q&A was added successfuly!")
})


app.listen(5000, function(){
    console.log("Server started on port 5000");
})
