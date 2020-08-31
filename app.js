const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const ejs = require("ejs");
const axios = require("axios");
const mongoose = require("mongoose");

const { scrapeFunction, scrapeMoreQaFunction } = require("./public/js/scraping");
const app = express();

mongoose.connect("mongodb://localhost:27017/productsDB", { useNewUrlParser: true, useUnifiedTopology: true })

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const productSchema = new mongoose.Schema({
    asin: String,
    name: String,
    imageUrl: String,
    questions: Array,
    answers: Array
});

const Product = mongoose.model("Product", productSchema);

var pageNumber = 1;
var startingProduct = new Product();
var asinCode;

app.get("/", function(req, res) {
    Product.findOne({ asin: asinCode }, function (err, productFound) {
        if (productFound === null) {
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

        else {
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

app.post("/", function(req, res) {
    var product = new Product();
    asinCode = req.body.productAsin;
    product.asin = asinCode;
    url = "https://www.amazon.com/ask/questions/asin/" + product.asin;

    let promises = [];
    var newProduct = new Product();
    promises.push(axios.get(url));
    Promise.all(promises).then(function (results) {
        results.forEach(async function (response) {
            product = scrapeFunction(results[0]);
            product.asin = asinCode;
            newProduct = new Product({
                asin: product.asin,
                name: product.name,
                imageUrl: product.imageUrl,
                questions: product.questions,
                answers: product.answers
            });
        });

        newProduct.save().then(function () {
            Product.find({}, function (err, foundProduct) {
                if (err) {
                    console.log(err);
                }
                else {
                    res.redirect("/")
                }
            });
        })
    })
        .catch(function (err) {
            console.log(err)
        })
})


// Scraping more Q&A about the same Amazon product
app.post("/more", function(req, res) {
    Product.findOne({ asin: asinCode }, function (err, productFound) {
        pageNumber++;
        url = "https://www.amazon.com/ask/questions/asin/" + productFound.asin + "/" + pageNumber;

        let promises = [];
        var moreList = [];
        promises.push(axios.get(url));
        Promise.all(promises).then(function (results) {
            results.forEach(async function (response) {
                moreList = scrapeMoreQaFunction(results[0]);
                moreList.questionsList.forEach(function (question) {
                    productFound.questions.push(question);
                })
                moreList.answersList.forEach(function (answer) {
                    productFound.answers.push(answer);
                })
            });

            productFound.save().then(function () {
                Product.find({}, function (err, foundProduct) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/")
                    }
                });
            })
        });
    });
});


//  <--- API --->

app.route("/product/:asin")
    .get(function (req, res) {
        Product.findOne({ asin: asinCode }, function (err, productFound) {
            if (productFound === null) {
                res.send("There is no such product in the database.")
                console.log(productFound)
            }

            else {
                res.send(productFound)
            }
        })
    })
    .post((req, res) => {
        var product = new Product();
        list = [];
        asinCode = req.params.asin;
        product.asin = asinCode;
        url = "https://www.amazon.com/ask/questions/asin/" + product.asin;
        let promises = [];
        var newProduct = new Product();
        promises.push(axios.get(url));
        Promise.all(promises).then(function (results) {
            results.forEach(async function (response) {
                product = scrapeFunction(results[0]);
                product.asin = asinCode;
                newProduct = new Product({
                    asin: product.asin,
                    name: product.name,
                    imageUrl: product.imageUrl,
                    questions: product.questions,
                    answers: product.answers
                });
            });

            newProduct.save().then(function () {
                Product.find({}, function (err, foundProduct) {
                    if (err) {
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
    .get(function (req, res) {
        Product.findOne({ asin: asinCode }, function (err, productFound) {
            res.send(productFound)
        })
    })
    .post((req, res) => {
        Product.findOne({ asin: asinCode }, function (err, productFound) {
            list = []
            pageNumber++;
            url = "https://www.amazon.com/ask/questions/asin/" + productFound.asin + "/" + pageNumber;

            let promises = [];
            var moreList = [];
            promises.push(axios.get(url));
            Promise.all(promises).then(function (results) {
                results.forEach(async function (response) {
                    moreList = scrapeMoreQaFunction(results[0]);
                    moreList.questionsList.forEach(function (question) {
                        productFound.questions.push(question);
                    })
                    moreList.answersList.forEach(function (answer) {
                        productFound.answers.push(answer);
                    })
                });

                productFound.save().then(function () {
                    Product.find({}, function (err, foundProduct) {
                        if (err) {
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



app.listen(5000, function () {
    Product.deleteMany({}, function (err) {
        if (err) {
            console.log(err)
        }
    })
    console.log("Server started on port 5000");
})