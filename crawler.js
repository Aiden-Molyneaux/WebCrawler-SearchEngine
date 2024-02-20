const Crawler = require("crawler");
var XMLHttpRequest = require('xhr2');

let numInFruitQueue = 0;
let numInPersonalQueue = 0;

let globalFruitsLinkedBy = {};
let globalPersonalLinkedBy = {};

let globalFruitsPageOb = {};
let globalPersonalPageOb = {};

let globalFruitsQueue = [];

function createCrawler(url, dbName, lim, numInQueue, globalPageOb, globalLinkedBy) {
    const c = new Crawler({
        rateLimit: 5,
    
        // This will be called for each crawled page
        callback : async function (error, res, done) {
            if (error) {
                console.log(error);
            } else {
                let $ = res.$;
                let links = $("a"); // get all links from page
                let currentURL = res.request.uri.href;
                let title = $("title").text();
                let bodyText = $("body").text();

                if (dbName == "personal") {
                    let body = $(".mw-page-container-inner");
                    let paragraphs = body.find('p');

                    bodyText = "";
                    paragraphs.each((index, element) => {
                        bodyText += $(element).text().replace(/[^'a-zA-Z]/g, ' ');
                    });

                    let newWords = bodyText.match(/\b\w+\b/g);
                    bodyText = newWords.join('\n');
                }

                let linksArr = [];
                for (let i = 0; i < links.length; i++) {
                    let link = links.eq(i);
                    let href = $(link).attr('href');
                
                    if (dbName == "personal") {
                        if (href == undefined || href.slice(0, 5) != "/wiki" || (href.split(":").length-1) != 0 || (href.split("#").length-1) != 0) {
                            continue;
                        }
                    }

                    let childURL = url + href.slice(1);
                    if (dbName == "personal" && currentURL == childURL) {
                        continue;
                    }

                    if (numInQueue < lim) {
                        if (!globalLinkedBy[childURL]) { globalLinkedBy[childURL] = []; }
                        globalLinkedBy[childURL].push(currentURL);
                    } else {
                        if (globalLinkedBy[childURL]) { globalLinkedBy[childURL].push(currentURL); }
                    }

                    if (dbName == "fruits" && !globalFruitsQueue.includes(childURL)) {
                        c.queue(childURL);
                        numInQueue++;
                        globalFruitsQueue.push(childURL);
                    }
                    
                    if (dbName == "personal" && numInQueue < lim-1 && !globalPageOb[childURL] && !linksArr.includes(childURL)) {
                        c.queue(childURL);
                        numInQueue++;
                    }
                    
                    linksArr.push(childURL);
                }

                globalPageOb[currentURL] = {
                    url: currentURL,
                    linksTo: linksArr,
                    linkedBy: [],
                    body: bodyText,
                    title: title,
                    dbName: dbName
                };
            }
            done();
        }
    });
    return c;
}

function addPages(pages) {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            console.log("Page added!");

        } else if (this.readyState == 4 && this.status == 500) {
            console.log("The server broke.");
        }
    }
    req.open("POST", `http://localhost:3000/${pages[0].dbName}`);
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.send(JSON.stringify(pages));
}

// Queue the fruit URL, which starts the fruit crawl
let fruitCrawler = createCrawler('https://people.scs.carleton.ca/~davidmckenney/fruitgraph', 'fruits', 1000, numInFruitQueue, globalFruitsPageOb, globalFruitsLinkedBy);
fruitCrawler.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');

//Triggered when the queue becomes empty
fruitCrawler.on('drain', function() {
    let pagesToUpdate = [];
    
    for (const [key, value] of Object.entries(globalFruitsPageOb)) {
        globalFruitsPageOb[key].linkedBy = globalFruitsLinkedBy[key];
        pagesToUpdate.push(globalFruitsPageOb[key]);
    }

    if (pagesToUpdate.length > 0) {
        addPages(pagesToUpdate);
    }
});

//Queue the fruit URL, which starts the fruit crawl
let personalCrawler = createCrawler('https://en.wikipedia.org/', 'personal', 500, numInPersonalQueue, globalPersonalPageOb, globalPersonalLinkedBy);
personalCrawler.queue('https://en.wikipedia.org/wiki/Carleton_University');

//Triggered when the queue becomes empty
personalCrawler.on('drain', async function() {
    let pagesToUpdate = [];

    for (const [key, value] of Object.entries(globalPersonalPageOb)) {
        globalPersonalPageOb[key].linkedBy = globalPersonalLinkedBy[key];
        pagesToUpdate.push(globalPersonalPageOb[key]);
    }

    if (pagesToUpdate.length > 0) {
        addPages(pagesToUpdate);
    }
});

