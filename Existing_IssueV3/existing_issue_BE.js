//INITIALIZATIONS
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const { type } = require('os');
const { Console } = require('console');
const { response } = require('express');
const app = express();
app.use(bodyParser.json());
var json = require('../atlassian-connect.json');

let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
}
app.use(allowCrossDomain);



//SERVE ATLASSIAN-CONNECT.JSON
app.get('/install', (req, res) => {
    res.json(json);
});

//SERVE PLUGIN HTML
app.get("/Existing_IssueV3", (req, res) => {
    res.sendFile(__dirname + "/existing_issue_FE.htm");
})

//SERVE PLUGIN JS
app.get("/js", (req, res) => {
    res.sendFile(__dirname + "/existing_issue_FE.mjs");
})

//SERVE WARNING ICON
app.get("/warning", (req, res) => {
    res.sendFile(__dirname + "/icons/warning.png");
})

//SERVE CORRECT ICON
app.get("/correct", (req, res) => {
    res.sendFile(__dirname + "/icons/correct.png");
})

//SERVE APP ICON
app.get("/app_icon", (req, res) => {
    res.sendFile(__dirname + "/icons/app-icon.svg");
})



//SEND ISSUE DATA TO MODEL AND RECEIVE PREDICTIONS - THEN SEND PREDICTIONS TO FRONT-END
app.post('/predict', (req, res) => {
    var issue_type = req.body.issue_type;
    var title = req.body.title;
    var desc = req.body.desc;

    var total_issue_text = title + " " + desc;
    var parsed_issue_text = total_issue_text.replaceAll(/\s/g, '%20');
    var parsed_issue_text1 = parsed_issue_text.replaceAll('"', '');
    console.log(parsed_issue_text1);
    fetch(`https://shivamjadhav-albert-latest-96.hf.space/predict?issue=${parsed_issue_text1}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => response.json())  // Directly parse JSON
        .then(data => {
            // Extract priority values
            var priority1 = parseFloat(data["priority 1"]);
            var priority2 = parseFloat(data["priority 2"]);
            var Label=data["Label"];
            // Determine highest priority
            var priorities = { "No": priority1, "Yes": priority2 };
            var confidence = 0;
            var label = '';
            for (const [key, value] of Object.entries(priorities)) {
                if (value > confidence) {
                    confidence = value;
                    label = key;
                }
            }

            // Create result object
            var results = {
                "label": label,
                "confidence": confidence,
                "No": priority1,
                "Yes": priority2,
            };

            console.log(results);
            res.json(results);
        })
        .catch(error => {
            console.log("PREDICT API ERROR: " + error);
        });

})



/*PORT LISTENING*/
const port = process.env.PORT || 8083;

app.listen(port, () => {
    console.log(`Server running on port${port}`);
});