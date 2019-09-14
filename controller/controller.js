const express = require("express");
const app = express();

const axios = require("axios");
const cheerio = require("cheerio");

const db = require("../models");

app.get("/", function(req, res) {
  res.redirect("/articles");
});

app.get("/scrape", function(req, res) {
    
  axios.get("https://basketball.realgm.com/nba/news").then(function(response){
    
   const $ = cheerio.load(response.data);
   const articleArray = [];

    $("div.article.clearfix").each(function(i, element) {
     const result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

        db.Article.create(result)
        .then(function(result) {
        })
        .catch(function(err) {
          return res.json(err);
        });
    });
    res.redirect("/articles");
  });
});

app.get("/articles", function(req, res) {
  db.Article.find()
    .sort({ _id: -1 })
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } 
      else {
       const artcl = { article: doc };
        res.render("index", artcl);
      }
    });
});

app.get("/articles-json", function(req, res) {
  db.Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    } 
    else {
      res.json(doc);
    }
  });
});

app.get("/clear", function(req, res) {
  db.Article.deleteMany({}, function(err, doc) {
    if (err) {
      console.log(err);
    } 
    else {
      console.log("removed all articles");
    }
  });
  res.redirect("/articles-json");
});

app.get("/readArticle/:id", function(req, res) {
 const articleId = req.params.id;
 const hbsObj = {
    article: [],
    body: []
  };

  db.Article.findOne({ _id: articleId })
    .populate("comment")
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } 
      else {
        hbsObj.article = doc;
        const link = doc.link;
        
        console.log("https://basketball.realgm.com"+link);
        axios.get("https://basketball.realgm.com"+link)
        .then(function(response) {
         const $ = cheerio.load(response.data);

          $("div.article.clearfix").each(function(i, element) {
            hbsObj.body = $(this)
              .children("div.article-title")
              .children("div.article-body")
              .text();

            res.render("article", hbsObj);
            return false;
          });
        });
      }
    });
});

app.post("/comment/:id", function(req, res) {
 const user = req.body.name;
 const content = req.body.comment;
 const articleId = req.params.id;

 const commentObj = {
    name: user,
    body: content
  };

 let Comment = new db.Comment(commentObj);

  Comment.save(function(err, doc) {
    if (err) {
      console.log(err);
    } 
    else {
      console.log(doc._id);
      console.log(articleId);

      db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comment: doc._id } },
        { new: true }
      )
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/readArticle/" + articleId);
        }
      });
    }
  });
});

module.exports = app;