var express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
var fs = require("fs-extra");
ObjectId = require("mongodb").ObjectId;
var cors = require("cors");
var MongoClient = require("mongodb").MongoClient;
const url = "mongodb+srv://admin:oV9NUcHsWinEEmsD@cluster0-ibf7x.mongodb.net/test?retryWrites=true&w=majority";
const dbName = "mosquiteer";
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var app = express();
var Parser = require('rss-parser');

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
app.use(bodyParser.json());
app.use(cors());
app.get("/getAllMosquitoBreeding", function (req, res) {
    const client = new MongoClient(url, { useNewUrlParser: true });
    client.connect(err => {
        if (err) {
            console.log('err', err);
            res.send({});
            return;

        }
        const collection = client.db(dbName).collection("mosquito_breeding_images");
        // perform actions on the collection object
        collection
            .find({}, { fields: { latitude: 1, longitude: 1 } })
            .toArray(function (err, results) {
                console.log("results", results);
                console.log("errors", err);
                res.setHeader("content-type", "application/json");
                res.send(results);
            });
    });
});

app.get("/getRSSFeed", async function (req, res) {
    let parser = new Parser();
    let feed = await parser.parseURL('https://www.reddit.com/.rss');
    res.setHeader("content-type", "application/json");
    res.send(feed);
});
app.get("/getAllMosquitoBreeding/:id", function (req, res) {
    MongoClient.connect(url, function (err, client) {
        const db2 = client.db(dbName);
        console.log('id', req.params.id)
        db2
            .collection("mosquito_breeding_images")
            .findOne({ _id: ObjectId(req.params.id) }, function (err, results) {
                res.setHeader("content-type", "application/json");
                res.send(results);
            });
    });
});
app.post("/reportMosquitoBreeding", upload.single("avatar"), function (
    req,
    res
) {
    console.log("receiving data...");
    console.log("body is ", req.body);
    // Create a new MongoClient
    const client = new MongoClient(url);

    // Use connect method to connect to the Server
    client.connect(function (err, client) {
        console.log(err);

        console.log("Connected correctly to server");

        const db = client.db(dbName);
        if (!req.body.user_id || !req.body.description || !req.file || !req.body.latitude || !req.body.longitude || !req.body.address) {
            res.send(req.body);
            return;
        }
        var newItem = {
            user_id: req.body.user_id,
            description: req.body.description,
            contentType: req.file.mimetype,
            size: req.file.size,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            address: req.body.address,
            img: req.file.buffer.toString("base64")
        };
        db.collection("mosquito_breeding_images").insert(newItem, function (
            err,
            result
        ) {
            if (err) {
                console.log(err);
            }
            var newoid = new ObjectId(result.ops[0]._id);
            res.send(req.body);
        });
    });
});
let port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log('Example app listening on port 8080!');
});
