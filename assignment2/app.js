const express = require("express");
const app = express();
const path = require("path");
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/map", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "map.html"));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// BONUS TASK IS UNREACHABLE DUE TO API PRICES, I made everything I could
