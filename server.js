const express = require("express");
const mongoose = require("mongoose");
const handlebars = require("express-handlebars");
const path = require("path");

const PORT = 3000;

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("views", "../views")
app.engine("handlebars", handlebars({
    defaultLayout: "main", layoutsDir: path.join(__dirname, '../views/layouts'), partialsDir: [
        path.join(__dirname, '../views/partials'),
    ]
}));
app.set("view engine", "handlebars");


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/NewsScraper";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

const mongoosedb = mongoose.connection;
mongoosedb.on("error", console.error.bind(console, "connection error:"));
mongoosedb.once("open", function () { console.log("Connected to Mongoose!"); });


const routes = require("./controller/controller");
app.use("/", routes);

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});