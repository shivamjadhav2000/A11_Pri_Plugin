function init() {
    predict();
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

                let fetch_url = `https://a11-pri-plugin.onrender.com/predict`;
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
                    var priority1 = prediction.No;
                    var priority2 = prediction.Yes;

                    // Display results in a simple format
                    var res_tab = document.getElementById("result");
                    res_tab.innerHTML = `
                        <tr><th> Label</th><td>${label}</td></tr>
                        <tr><th> Confidence</th><td>${(confidence * 100).toFixed(2)}%</td></tr>
                        <tr><th> No</th><td>${(priority1*100).toFixed(2)}%</td></tr>
                        <tr><th> Yes</th><td>${(priority2*100).toFixed(2)}%</td></tr>
                    `;

                    // Display warning or success icon based on the label
                    console.log(label,"<<<<<------");
                    if (label === "Yes") {
                        console.log("YES");
                        document.getElementById("icon").src = "https://a11-pri-plugin.onrender.com/correct";
                        document.getElementById("icon-span").innerHTML = `<span id='right'>The issue is identified as a Accessibility</span>`;
                    } else {
                        document.getElementById("icon").src = "https://a11-pri-plugin.onrender.com/warning";
                        document.getElementById("icon-span").innerHTML = `<span id='wrong'>The issue is not identified as not an Accessibility.</span>`;
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
