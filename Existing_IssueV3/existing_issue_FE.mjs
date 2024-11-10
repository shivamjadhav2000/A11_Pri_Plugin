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

                let fetch_url = "https://huggingface.co/spaces/shivamjadhav/albert_latest_96/predict";
                let settings = {
                    method: "POST", body: issue_data, mode: "cors",
                    headers: {
                        'Content-Type': 'application/json', 'Accept': 'application/json', "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE,PUT"
                    }
                };

                fetch(fetch_url, settings).then(res => res.json()).then((json) => {
                    var result = JSON.stringify(json);
                    var prediction = JSON.parse(result);
                    var label = prediction.label;
                    var confidence = prediction.confidence;
                    var bug = prediction.bug;
                    var improvement = prediction.improvement;
                    var nf = prediction.nf;
                    var issue_type = prediction.current_issue_type;

                    var correct_type = "";
                    var type_check = 0;
                    if (bug > improvement && bug > nf) {
                        correct_type = "Bug";
                    }
                    else if (improvement > bug && improvement > nf) {
                        correct_type = "Improvement";
                    }
                    else {
                        correct_type = "New Feature";
                    }

                    var b0 = bug * 100;
                    var b1 = b0.toFixed(2);
                    var b2 = b1.toString();
                    var i0 = improvement * 100;
                    var i1 = i0.toFixed(2);
                    var i2 = i1.toString();
                    var nf0 = nf * 100;
                    var nf1 = nf0.toFixed(2);
                    var nf2 = nf1.toString();


                    if (issue_type != label) {
                        document.getElementById("icon").src = "http://localhost:8083/warning";
                        if (span_check == 1) {
                            document.getElementById("right").remove();
                            span_check = 0;
                        }
                        if (span_check == 0) {
                            document.getElementById("icon-span").innerHTML += "<span id='wrong'>The current issue type (<b>" + issue_type + "</b>) does not match the predicted issue type (<b>" + correct_type + "</b>)!</span>";
                            span_check = -1;
                        }
                    }
                    else {
                        type_check = 1;
                        document.getElementById("icon").src = "http://localhost:8083/correct";
                        if (span_check == -1) {
                            document.getElementById("wrong").remove();
                            span_check = 0;
                        }
                        if (span_check == 0) {
                            document.getElementById("icon-span").innerHTML += "<span id='right'>The current issue type matches the predicted issue type!</span>";
                            span_check = 1;
                        }
                    }

                    var res_tab = document.getElementById("result");
                    res_tab.innerHTML = "";

                    if (bug > improvement && bug > nf) {
                        res_tab.innerHTML += "<tr><th class='correct1'>Bug </th><th><span class='ratings' title='Confidence: " + b2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + b2 + "%'></span></span></th></tr>";
                        if (improvement > nf) {
                            res_tab.innerHTML += "<tr><td class='other'>Improvement </td><td><span class='ratings' title='Confidence: " + i2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + i2 + "%'></span></span></td></tr>";
                            res_tab.innerHTML += "<tr><td class='other'>New Feature </td><td><span class='ratings' title='Confidence: " + nf2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + nf2 + "%'></span></span></td></tr>";
                        }
                        else {
                            res_tab.innerHTML += "<tr><td class='other'>New Feature </td><td><span class='ratings' title='Confidence: " + nf2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + nf2 + "%'></span></span></td></tr>";
                            res_tab.innerHTML += "<tr><td class='other'>Improvement </td><td><span class='ratings' title='Confidence: " + i2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + i2 + "%'></span></span></td></tr>";
                        }
                    }

                    else if (improvement > bug && improvement > nf) {
                        res_tab.innerHTML += "<tr><th class='correct1'>Improvement </th><th><span class='ratings' title='Confidence: " + i2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + i2 + "%'></span></span></th></tr>";
                        if (bug > nf) {
                            res_tab.innerHTML += "<tr><td class='other'>Bug </td><td><span class='ratings' title='Confidence: " + b2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + b2 + "%'></span></span></td></tr>";
                            res_tab.innerHTML += "<tr><td class='other'>New Feature </td><td><span class='ratings' title='Confidence: " + nf2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + nf2 + "%'></span></span></td></tr>";
                        }
                        else {
                            res_tab.innerHTML += "<tr><td class='other'>New Feature </td><td><span class='ratings' title='Confidence: " + nf2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + nf2 + "%'></span></span></td></tr>";;
                            res_tab.innerHTML += "<tr><td class='other'>Bug </td><td><span class='ratings' title='Confidence: " + b2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + b2 + "%'></span></span></td></tr>";
                        }
                    }

                    else {
                        res_tab.innerHTML += "<tr><th class='correct1'>New Feature </th><th><span class='ratings' title='Confidence: " + nf2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + nf2 + "%'></span></span></th></tr>";
                        if (improvement > bug) {
                            res_tab.innerHTML += "<tr><td class='other'>Improvement </td><td><span class='ratings' title='Confidence: " + i2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + i2 + "%'></span></span></td></tr>";
                            res_tab.innerHTML += "<tr><td class='other'>Bug </td><td><span class='ratings' title='Confidence: " + b2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + b2 + "%'></span></span></td></tr>";
                        }
                        else {
                            res_tab.innerHTML += "<tr><td class='other'>Bug </td><td><span class='ratings' title='Confidence: " + b2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + b2 + "%'></span></span></td></tr>";
                            res_tab.innerHTML += "<tr><td class='other'>Improvement </td><td><span class='ratings' title='Confidence: " + i2 + "%'><span class='empty-stars'></span><span class='full-stars' style='width:" + i2 + "%'></span></span></td></tr>";
                        }
                    }


                    if (type_check == 0) {
                        document.getElementsByTagName("th")[0].style.backgroundColor = "rgb(247, 179, 179)";
                        document.getElementsByTagName("th")[1].style.backgroundColor = "rgb(247, 179, 179)";
                    }

                    var dummyText = "";
                    return dummyText;
                })
                    .then((dummyText) => {
                        console.log("DONE");
                        predict();
                    })
                    .catch(error => {
                        console.log("PREDICT ERROR: " + error);
                    })
            })
            .catch(e => console.log("GET ISSUE ERROR: " + e));
    })
}