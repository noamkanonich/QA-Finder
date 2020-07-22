const express = require("express");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const request = require("request");
const ejs = require("ejs");
const axios = require("axios");
const { response } = require("express");
const mongoose = require("mongoose");
const e = require("express");

const app = express();

mongoose.connect("mongodb://localhost:27017/productsDB", { useNewUrlParser: true, useUnifiedTopology: true}) 


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));


const productSchema = new mongoose.Schema({
    asin: String, 
    name: String,
    imageUrl: String,
    questions: Array,
    answers: Array
  });

const Product = mongoose.model("Product", productSchema);

var list = [];
var pageNumber = 1;
var startingProduct = new Product();
var asinCode;


app.get("/", function(req, res){

    Product.findOne({asin: asinCode},function(err, productFound){
        if(productFound === null) {
            res.render("index", 
            {
                questions: startingProduct.questions, 
                answers: startingProduct.answers, 
                asin: startingProduct.asin,
                productName: startingProduct.name, 
                imageUrl: startingProduct.imageUrl, 
                pageNumber: pageNumber
            })
        }

        else{
            res.render("index", 
            {
                questions: productFound.questions, 
                answers: productFound.answers, 
                asin: productFound.asin,
                productName: productFound.name, 
                imageUrl: productFound.imageUrl, 
                pageNumber: pageNumber
            })
        }
    })
})

app.post("/", async(req, res) => {
    var product = new Product();
    scrape(asinCode);
    list = [];
    asinCode = req.body.productAsin;
    product.asin = asinCode;
    url = "https://www.amazon.com/ask/questions/asin/" + product.asin;
    axios.get(url)
    .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
        $('div.a-section.askTeaserQuestions div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());
        })
        product.name = $('div.a-section.askProductDescription').find('a').text().trim();
        product.imageUrl = $('a.a-link-normal').find('img').attr('src');

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
        product.save().then(function(){
            Product.find({},function(err, foundProduct){
                if(err) {
                    console.log(err);
                }
                else {
                    res.redirect("/")
                    }
            });
        })
    })   
})


// Scraping more Q&A about the same Amazon product
app.post("/more", (req, res)=> {
    Product.findOne({asin: asinCode},function(err, productFound){
        list = []
        pageNumber++;
        url =  "https://www.amazon.com/ask/questions/asin/" + productFound.asin + "/" + pageNumber;
        axios.get(url)
          .then((response)=> {
            const html = response.data;
            const $ = cheerio.load(html);
            $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
                list.push($(element).text().trim());    
            })
        
            for(var i = 0 ; i < list.length ; i++){
                if(list[i] === "Question:"){
                    productFound.questions.push(list[i+1]);
                }
                if(list[i] === "Answer:"){
                    if(list[i+1].includes("see less")){
                        productFound.answers.push(list[i+1].substring(0, list[i+1].length - 8)); 
                    }
                    else{
                        productFound.answers.push(list[i+1]);
                    }
                }
            }
        
            productFound.save().then(function(){
                Product.find({},function(err, foundProduct){
                    if(err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/")
                        }
                });
            })
         }); 
    })
});



//  <--- API --->

app.route("/product/:asin")
.get(function(req, res) {
    Product.findOne({asin: asinCode},function(err, productFound){
        if(productFound === null) {
            res.send("There is no such product in the database.")
            console.log(productFound)
        }

        else{
            res.send(productFound)
        }
    })
})
.post((req, res)=> {
    var product = new Product();
    list = [];
    asinCode = req.params.asin;
    product.asin = asinCode;
    url = "https://www.amazon.com/ask/questions/asin/" + product.asin;
    axios.get(url)
    .then((response)=> {
        const html = response.data;
        const $ = cheerio.load(html);
        $('div.a-section.askTeaserQuestions div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
            list.push($(element).text().trim());
        })
        product.name = $('div.a-section.askProductDescription').find('a').text().trim();
        product.imageUrl = $('a.a-link-normal').find('img').attr('src');

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
        product.save().then(function(){
            Product.find({},function(err, foundProduct){
                if(err) {
                    console.log(err);
                }
                else {
                    res.send("Q&A was added successfuly!")
                }
            });
        })
    })   
})


app.route("/product/more/:asin")
.get(function(req, res) {
    Product.findOne({asin: asinCode},function(err, productFound){
        res.send(productFound)
    })
})
.post((req, res)=> {
    Product.findOne({asin: asinCode},function(err, productFound){
        list = []
        pageNumber++;
        url =  "https://www.amazon.com/ask/questions/asin/" + productFound.asin + "/" + pageNumber;
        axios.get(url)
          .then((response)=> {
            const html = response.data;
            const $ = cheerio.load(html);
            $('div.a-fixed-left-grid-col.a-col-right div').find('span').each(function (i, element) {
                list.push($(element).text().trim());    
            })
        
            for(var i = 0 ; i < list.length ; i++){
                if(list[i] === "Question:"){
                    productFound.questions.push(list[i+1]);
                }
                if(list[i] === "Answer:"){
                    if(list[i+1].includes("see less")){
                        productFound.answers.push(list[i+1].substring(0, list[i+1].length - 8)); 
                    }
                    else{
                        productFound.answers.push(list[i+1]);
                    }
                }
            }
        
            productFound.save().then(function(){
                Product.find({},function(err, foundProduct){
                    if(err) {
                        console.log(err);
                    }
                    else {
                        res.send("More Q&A was added successfuly!")
                    }
                });
            })
         }); 
    })
})



app.listen(5000, function(){
    Product.deleteMany({}, function(err){
        if(err){
            console.log(err)
        }
    })
    console.log("Server started on port 5000");
})

