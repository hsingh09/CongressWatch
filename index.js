"use strict";
exports.__esModule = true;
var restify = require("restify");
var request = require("request");
var Representative = require("./models/representative");
// Private config file for API keys
var config = require('./config');
var proPublicaRequest = request.defaults({
    headers: { 'X-API-Key': config.PRO_PUBLICA_API_KEY }
});
function index(req, res, next) {
    res.send("Listening at " + server.url);
    next();
}
// Makes a request to the WhoisMyRepresentative API for your representatives.
function findMyRep(req, res, next) {
    var zipcode = req.params.zipcode;
    var requestURL = "http://whoismyrepresentative.com/getall_mems.php?zip=" + zipcode + "&output=json";
    console.log("findMyRep::URL: " + requestURL);
    request(requestURL, function (requestError, requestResponse, requestBody) {
        if (requestError) {
            res.locals = { whoIsMyRepresentativeSuccess: false };
        }
        else {
            res.locals = {
                success: true,
                whoIsMyRepresentativeResults: JSON.parse(requestBody).results
            };
        }
        next();
    });
}
// Queries the local cache DB for a representatives information
function getRepById(req, res, next) {
    var repId = req.params.repid;
    var requestURL = "http://localhost:8080/update";
    console.log("getRepById::ID :" + repId);
    request(requestURL, function (requestError, requestResponse, requestBody) {
        if (requestError) {
            res.locals = { getRepByIdSuccess: false };
        }
        else {
            // // TODO: Replace this with a SQL Query
            // var representatives = JSON.parse(requestBody).results;
            // console.log(representatives);
            // for (let rep in representatives) {
            //     console.log(rep);
            //     // if (repId == rep.representativeId) {
            //         // res.json(rep);
            //         // next();
            //     }
            // }
        }
        next();
    });
}
// Makes a request to the ProPublica API to get get all members of the House
function getHouse(req, res, next) {
    var requestURL = "https://api.propublica.org/congress/" + config.PRO_PUBLICA_API_VERSION + "/" + config.CURRENT_HOUSE + "/" + config.HOUSE + "/members.json";
    console.log("getHouse::requestURL = " + requestURL);
    proPublicaRequest(requestURL, function (requestError, requestResponse, requestBody) {
        if (requestError) {
            res.locals.proPublicaHouseSuccess = false;
        }
        else {
            res.locals.proPublicaHouseSuccess = true;
            res.locals.proPublicaHouseResults = JSON.parse(requestBody).results;
        }
        //1      res.json(res.locals);  
        next();
    });
}
// Makes a request to the ProPublica API and gets all members of the Senate
function getSenate(req, res, next) {
    var requestURL = "https://api.propublica.org/congress/" + config.PRO_PUBLICA_API_VERSION + "/" + config.CURRENT_SENATE + "/" + config.SENATE + "/members.json";
    console.log("getSenate::requestURL = " + requestURL);
    proPublicaRequest(requestURL, function (requestError, requestResponse, requestBody) {
        // Store the result in locals if relevant
        console.log(requestError);
        if (requestError) {
            res.locals.proPublicaSenateSuccess = false;
        }
        else {
            console.log(requestBody);
            res.locals.proPublicaSenateSuccess = true;
            res.locals.proPublicaSenateResults = JSON.parse(requestBody).results;
        }
        next();
    });
}
// Finds the MemberID of your representative based on district
function getRepresentativeId(req, res, next) {
    var representatives = res.locals.whoIsMyRepresentativeResults;
    console.log(res.locals);
    var myReps = [];
    for (var key in representatives) {
        var rep = representatives[key];
        var name_1 = rep.name.split(" ");
        var firstName = name_1[0];
        var lastName = name_1[1];
        var state = rep.sate;
        var representative = new Representative.Representative(firstName, lastName, state);
        myReps.push(representative);
    }
    var senators = res.locals.proPublicaSenateResults[0]['members'];
    FindMatchingRepresentative(senators, myReps, 1 /* Senate */);
    var houseMembers = res.locals.proPublicaHouseResults[0]['members'];
    FindMatchingRepresentative(houseMembers, myReps, 0 /* House */);
    res.json(myReps);
    next();
}
function FindMatchingRepresentative(proPublicaReps, myReps, chamber) {
    for (var key in proPublicaReps) {
        var proPublicaRep = proPublicaReps[key];
        for (var key_1 in myReps) {
            var rep = myReps[key_1];
            if ((proPublicaRep.state === rep.state) && (proPublicaRep.last_name === rep.lastName)) {
                rep.SetRepresentativeId(proPublicaRep.id);
                rep.SetChamber(chamber);
            }
        }
    }
}
var server = restify.createServer();
var zipcodePath = '/zipcode/:zipcode';
var representativePath = '/repid/:repid';
server.get(zipcodePath, [findMyRep, getHouse, getSenate, getRepresentativeId]);
server.get(representativePath, [getRepById]);
server.get('/', index);
server.head('/', index);
server.listen(8081, function () {
    console.log('%s listening at %s', server.name, server.url);
});
