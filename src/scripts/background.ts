 /// <reference path="../typings/index.d.ts" />

var currentApiRequest:XMLHttpRequest = null;

chrome.omnibox.onInputStarted.addListener(function() {
    //console.log('STARTED');
});

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {

    //If any API request already in progress - cancel it
    //As when we type it would fire loads of requests otherwise
    if (currentApiRequest != null) {
        currentApiRequest.onreadystatechange = null;
        currentApiRequest.abort();
        currentApiRequest = null;
    }


    //Query Umbraco API - Split on first word?
    //OurUmbraco Forums Forms
    //OurUmbraco Projects Forms
    //OurUmbraco Documentation Forms

    //Split 'text' on space
    var textSpaces = text.split(' ');
    var searchType = '';
    var searchTerm = '';

    //Found a word/s serprated with spaces
    if(textSpaces.length > 1){

        //Get the first word before the space
        searchType = textSpaces[0].toLowerCase();

        //Get the actual search term (remove first word)
        searchTerm = text.replace(searchType + " ", "");

        //Switch case to see if we find a match
        switch (searchType) {
            case "forums":
                fetchResults(searchTerm, "Forum", function(apiResponse){

                    var results = parseForumResults(apiResponse);
                    suggest(results);
                });
                break;

            case "projects":
                fetchResults(searchTerm, "Project", function(apiResponse){

                    var results = parseProjectsResults(apiResponse);
                    suggest(results);
                });

                break;
        
            case "docs":
                fetchResults(searchTerm, "Docs", function(apiResponse){

                    var results = parseDocResults(apiResponse);
                    suggest(results);
                });
                break;

            default:
                //Don't match any of these words just search the API for ALL types
                break;
        }
    };

  });

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(function(text) {

    //Think we simply just need to use the text which will be the URL to the item
    //To open it in the current tab

    console.log('inputEntered: ' + text);
    alert('You just typed "' + text + '"');
});



function fetchResults(term:string, apiType: ApiRequest, callbackFunction) : void {

    if(term.length === 0){
        return;
    }

    //Perform AJAX request
    var apiUrl = "https://our.umbraco.org/umbraco/api/OurSearch/Get" + apiType + "SearchResults?term=" + term;

     currentApiRequest = new XMLHttpRequest();
     currentApiRequest.open("GET", apiUrl, true);
     currentApiRequest.onreadystatechange = function() {
        if (currentApiRequest.readyState == 4) {

            callbackFunction(currentApiRequest.response);
        }
    }
    
    //Make the API request
    currentApiRequest.send();

}

function parseForumResults(apiResponse){
    var result = JSON.parse(apiResponse);
    var baseUrl = "https://our.umbraco.org";

    var suggestResults: chrome.omnibox.SuggestResult[] = [];

    result.items.forEach(function (element) {
        //For each items returned (20)
        //Dive into Fields Collection
        
        var forumPost = element.Fields;

        //Description
        //TODO: Create a TypeScript interface based on the JSON we get back from API
        var description =   "<match>" + forumPost.nodeName + "</match> " +
                            "<dim>Poster: " + forumPost.authorName + "</dim> " +
                            "<dim>Replies: " + forumPost.replies + "</dim>";

        if(forumPost.solved !== "0"){
            description = description + " <url><match>Solved</match></url>";
        }

        //Push the result into the collection
        suggestResults.push({ content: baseUrl + forumPost.url, description: description });
    });

    return suggestResults;
}

function parseProjectsResults(apiResponse){
    var result = JSON.parse(apiResponse);
    var baseUrl = "https://our.umbraco.org";

    var suggestResults: chrome.omnibox.SuggestResult[] = [];

    result.items.forEach(function (element) {
        //For each items returned (20)
        //Dive into Fields Collection
        
        var project = element.Fields;

        console.log('Project', project);

        //Description
        //TODO: Create a TypeScript interface based on the JSON we get back from API
        var description =   "<match>" + project.nodeName + "</match> " +
                            "<dim>Karma: " + project.karma + "</dim> " +
                            "<dim>Downloads: " + project.downloads + "</dim>";

        if(project.worksOnUaaS.toLowerCase() === "true"){
            description = description + " <url><match>Works on Umbraco as a Service</match></url>";
        }


        //Push the result into the collection
        suggestResults.push({ content: baseUrl + project.url, description: description });
    });

    return suggestResults;
}

function parseDocResults(apiResponse){
    var result = JSON.parse(apiResponse);
    var baseUrl = "https://our.umbraco.org";

    var suggestResults: chrome.omnibox.SuggestResult[] = [];

    result.items.forEach(function (element) {
        //For each items returned (20)
        //Dive into Fields Collection
        
        var doc = element.Fields;

        //Description
        //TODO: Create a TypeScript interface based on the JSON we get back from API
        var description =   "<match>" + doc.nodeName + "</match>";

        //Push the result into the collection
        suggestResults.push({ content: baseUrl + doc.url, description: description });
    });

    return suggestResults;
}

interface Project {

}

type ApiRequest = "Project" | "Docs" | "Forum";
