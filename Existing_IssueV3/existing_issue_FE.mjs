function init() {
    predict();
    console.log("INITIALIZED");
}

var span_check = 0;

/*SEND ISSUE DATA TO NODE.JS BACK-END AND RECEIVE PREDICTION THEN REFORMAT AND DISPLAY*/
function predict() {
    AP.context.getContext(function (response) {
        var issue_key = response.jira.issue.key;

        AP.request("/rest/api/3/issue/" + issue_key)
            .then(data => {
                return data.body;
            })
            .then(body => {
                var parsed_body = JSON.parse(body);
                var issue_type = parsed_body.fields.issuetype.name;
                var desc = parsed_body.fields.description.content[0].content[0].text;
                var title = parsed_body.fields.summary;

                let issue_data = JSON.stringify({
                    "issue_type": issue_type,
                    "desc": desc,
                    "title": title
                });

                let fetch_url = `${process.env.PLUGIN_URL}/predict`;
                console.log(fetch_url,'fetch url heer');
                let settings = {
                    method: "POST",
                    body: issue_data,
                    mode: "cors",
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE,PUT"
                    }
                };

                fetch(fetch_url, settings).then(res => res.json()).then((json) => {
                    var prediction = JSON.parse(JSON.stringify(json));
                    var label = prediction.label;
                    var confidence = prediction.confidence;
                    var priority1 = prediction.priority1;
                    var priority2 = prediction.priority2;
                    console.log("PREDICTION: ", prediction);

                    // Display results in a simple format
                    var res_tab = document.getElementById("result");
                    res_tab.innerHTML = `
                        <tr><th>Label</th><td>${label}</td></tr>
                        <tr><th>Confidence</th><td>${(confidence * 100).toFixed(2)}%</td></tr>
                        <tr><th>Priority 1</th><td>${priority1}</td></tr>
                        <tr><th>Priority 2</th><td>${priority2}</td></tr>
                    `;

                    // Display warning or success icon based on the label
                    if (label === "Bug") {
                        document.getElementById("icon").src = "http://localhost:8083/correct";
                        document.getElementById("icon-span").innerHTML = `<span id='right'>The issue is identified as a Bug!</span>`;
                    } else {
                        document.getElementById("icon").src = "http://localhost:8083/warning";
                        document.getElementById("icon-span").innerHTML = `<span id='wrong'>The issue is not identified as a Bug.</span>`;
                    }

                    var dummyText = "";
                    return dummyText;
                })
                .then(() => {
                    console.log("DONE");
                    predict();
                })
                .catch(error => {
                    console.log("PREDICT ERROR: " + error);
                });
            })
            .catch(e => console.log("GET ISSUE ERROR: " + e));
    });
}
