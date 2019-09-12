const express = require("express");
const app = express();
const mongojs = require("mongojs");

const axios = require("axios");
const cheerio = require("cheerio");

const db = require("../models");


const databaseUrl = "NewsScraper";
const collections = ["articles"];

const mongodb = mongojs(databaseUrl, collections);
mongodb.on("error", function (err) {
    console.log("Database Error:", err);
});

app.get("/", function (req, res) {
    db.Article.find({ saved: false }, function (err, data) {
        res.render('index', { index: true, article: data });
    });
});

app.get("/scrape", function (req, res) {
    axios.get("https://basketball.realgm.com/nba/news").then(function (response) {

        const $ = cheerio.load(response.data);
        const articles = [];

        $(".article clearfix").each(function (i, element) {
            const result = {};

            result.title = $(this)
                .children("a")
                .text();

            result.link = $(this)
                .children("a")
                .attr("href");

            if (title && link) {
                articles.push({
                    title: title,
                    link: link
                });
            }
            else {
                console.log("Missing Data");
            }
        });

        mongodb.scrapedData.insert(articles, function (err) {
            if (err) return res.json({ err: err.message });
            res.send("Scrape Complete");
        });
    });
});

app.get("/articles", function (req, res) {
    Article.find({})
        .sort({ _id: 1 })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                res.json("index", article);
            }
        });
});

app.get("/articles-json", function (req, res) {
    Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

app.get("/readArticle/:id", function (req, res) {
    const articleId = req.params.id;
    const hbsObj = {
        article: [],
        body: []
    };

    Article.findOne({ _id: articleId })
        .populate("comment")
        .exec(function (err, doc) {
            if (err) {
                console.log("Error: " + err);
            }
            else {
                hbsObj.article = doc;
                const link = doc.link;
                axios(link).then(function (response) {
                    const $ = cheerio.load(response.data);

                    $(".article clearfix").each(function (i, element) {
                        hbsObj.body = $(this)
                            .children(".article-title")
                            .children("p")
                            .text();

                        res.render("article", hbsObj);
                        return false;
                    });
                });
            }
        });
});

app.get("/clear", function (req, res) {
    Article.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("Removed Articles");
        }
    });
});



app.post("/comment/:id", function (req, res) {

    const user = req.body.name;
    const content = req.body.comment;
    const articleId = req.params.id;

    const commentObj = {
        name: user,
        body: content
    };

    const newComment = new Comment(commentObj);

    newComment.save(function (err, doc) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(doc._id);
            console.log(articleId);

            Article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { comment: doc._id } },
                { new: true }
            )
                .exec(function (err, doc) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/readArticle/" + articleId);
                    }
                });
        }
    });
});

module.exports = app;