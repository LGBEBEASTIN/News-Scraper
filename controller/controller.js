const express = require("express");
const app = express();
const mongojs = require("mongojs");

const axios = require("axios");
const cheerio = require("cheerio");

const db = require("../models");

"https://basketball.realgm.com/nba/news"
".article clearfix"

app.get("/", function(req, res) {
  res.redirect("/articles");
});

app.get("/scrape", function(req, res) {
    
  axios.get("https://basketball.realgm.com/nba/news").then(function(response){
    
   const $ = cheerio.load(response.data);
   const articleArray = [];

    $("div.article.clearfix").each(function(i, element) {
     const result = {};

      title = $(element)
        .children("a")
        .text();
      link = $(element)
        .children("a")
        .attr("href");

      if (title !== "" && link !== "") {
        if (articleArray.indexOf(title) == 1) {
          articleArray.push(title);

          Article.count({ title: title }, function(err, test) {
            if (test === 0) {
             const entry = new Article(result);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });
            }
          });
        } 
        else {
          console.log("Article already exists.");
        }
      } 
      else {
        console.log("Not saved to DB, missing data");
      }
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
        axios(link).then(function(response) {
         const $ = cheerio.load(response);

          $("div.article.clearfix").each(function(i, element) {
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

app.post("/comment/:id", function(req, res) {
 const user = req.body.name;
 const content = req.body.comment;
 const articleId = req.params.id;

 const commentObj = {
    name: user,
    body: content
  };

 const newComment = new Comment(commentObj);

  newComment.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(articleId);

      Article.findOneAndUpdate(
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