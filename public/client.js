let req = null;

function search() {
    req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            let dataSet = document.getElementById("dataSet").value == "1" ? "fruits" : "personal";

            const searchResults = JSON.parse(req.responseText);

            let listOfResults = document.getElementById("searchResults");
            listOfResults.textContent = '';

            for (let page of searchResults) {
                let entry = document.createElement("li");
                entry.style.display = "block";

                let pageTitle
                if (dataSet == "fruits") {
                    pageTitle = String(page.ref.slice(57, -5));
                } else {
                    pageTitle = String(page.ref.slice(30).replace(/_/g, " ").replace(/%27/g, "'"));
                }

                newHTML = document.createElement("div");
                newHTML.classList.add("list-item");
                newHTML.innerHTML = `<div class="outerclass"><div class="innerclass2"><b>S:</b> ${page.score}<br><b>PR</b>: ${page.pr}<br></div><div class="innerclass1"><b>Title:</b> ${pageTitle}</b><br><button class="link" onclick="linkClick('${pageTitle}')">${page.ref}</button><br></div></div>`;

                entry.appendChild(newHTML);
                listOfResults.appendChild(entry);
            }

        } else if (this.readyState == 4 && this.status == 500) {
            alert("The server broke.");
        }
    }
    
    let dataSet = document.getElementById("dataSet").value == "1" ? "fruits" : "personal";

    req.open("GET", `http://localhost:3000/${dataSet}?q=${document.getElementById("query").value}&limit=${document.getElementById("limit").value}&boost=${document.getElementById("boost").checked}`, true);
    req.send();
}

function linkClick (param) {
    console.log(param)
    req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            let page = JSON.parse(req.responseText)

            let resultDiv = document.getElementById("searchResults");
            resultDiv.textContent = '';

            newHTML = document.createElement("div")
            newHTML.classList.add('outerclass')

            newHTML.innerHTML = ``
            newHTML.innerHTML = `<b>${page.title}</b>`

            newHTML.innerHTML += `<br><br><b>Incoming links to this page:</b>`
            for (let incomingLink of page.linkedBy) {
                newHTML.innerHTML += `<br>${incomingLink}`
            }

            newHTML.innerHTML += `<br><br><b>This page links to:</b>`
            for (let outgoingLink of page.linksTo) {
                newHTML.innerHTML += `<br>${outgoingLink}`
            }

            newHTML.innerHTML += `<br><br><b>The word frequency of this page is:</b>`
            for (let wordCount of page.wordsAndCounts) {
                newHTML.innerHTML += `<br>${wordCount[0]} occurred ${wordCount[1]} times`
            }

            newHTML.innerHTML = `<div class="outerclass>"` + newHTML.innerHTML + `</div>`

            resultDiv.appendChild(newHTML)
        } 
        else if (this.readyState == 4 && this.status == 500) {
            alert("The server broke.");
        }
    }

    req.open("GET", `http://localhost:3000/pages?title=${param}`, true);
    req.send()
}