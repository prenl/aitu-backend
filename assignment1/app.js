const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DB LOGIC
const historyFilePath = __dirname + "/public/database/history.json";

function readHistory() {
    try {
        const historyData = fs.readFileSync(historyFilePath, "utf8");
        return JSON.parse(historyData);
    } catch (error) {
        return [];
    }
}

function saveHistory(history) {
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), "utf8");
}

// GET ROUTES

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/bmicalculator", (req, res) => {
    res.sendFile(__dirname + "/public/calculator.html");
});

app.get("/result", (req, res) => {
    res.sendFile(__dirname + "/public/result.html");
});

app.get("/history", (req, res) => {
    res.sendFile(__dirname + "/public/history.html");
});

app.get("/data", (req, res) => {
    const contentTypeHeader = req.headers["content-type"];

    if (contentTypeHeader && contentTypeHeader.toLowerCase() === "application/json") {
        res.sendFile(__dirname + "/public/database/history.json");
    } else {
        res.status(405).send("400: Bad gateway");
    }
});

// POST ROUTES

app.post("/bmicalculator", (req, res) => {
    let height_number = parseInt(req.body.height_number);
    const height_type = req.body.height_type;

    if (height_type === "f") {
        height_number *= 0.3048;
    }

    height_number /= 100;

    let weight_number = parseInt(req.body.weight_number);
    const weight_type = req.body.weight_type;

    if (weight_type === "lbs") {
        weight_number *= 0.45359237;
    }

    let age = parseInt(req.body.age);
    const gender = req.body.gender;

    let bmi_value = weight_number / height_number ** 2;

    if (age !== null) {
        if (age > 35) {
            bmi_value += 0.5;
        } else if (age > 45) {
            bmi_value += 1;
        } else if (age > 55) {
            bmi_value += 1.5;
        } else if (age > 60) {
            bmi_value += 2;
        }
    }

    let historyJson = readHistory();
    historyJson.push({
        timestamp: new Date().toLocaleString(),
        weight: weight_number,
        height: height_number,
        bmi: bmi_value,
        gender: gender,
        age: age ? age : "None",
    });
    saveHistory(historyJson);

    res.redirect(`/result?bmi=${bmi_value}`);
});

// IF NOT FOUND

app.use((req, res) => {
    res.sendFile(__dirname + "/public/error.html");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
