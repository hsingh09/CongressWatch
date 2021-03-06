"use strict";
exports.__esModule = true;
require('dotenv').config();
var restify = require("restify");
var request = require("request");
var sequelize = require("sequelize");
var Representative = require("./models/representative");
var sqlize = new sequelize(process.env.REP_DB_NAME, process.env.REP_DB_USERNAME, process.env.REP_DB_PASSWORD, {
    host: 'replist.database.windows.net',
    port: 1433,
    dialect: 'mssql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    dialectOptions: {
        encrypt: true
    }
});
var repDb = sqlize.define('Representative', {
    representativeId: {
        type: sequelize.STRING
    },
    firstName: {
        type: sequelize.STRING
    },
    lastName: {
        type: sequelize.STRING
    },
    chamber: {
        type: sequelize.INTEGER
    },
    party: {
        type: sequelize.INTEGER
    },
    contactUrl: {
        type: sequelize.STRING
    },
    cspanId: {
        type: sequelize.STRING
    },
    facebookAccount: {
        type: sequelize.STRING
    },
    googleEntityId: {
        type: sequelize.STRING
    },
    govtrackId: {
        type: sequelize.STRING
    },
    phone: {
        type: sequelize.STRING
    }
});
sqlize
    .authenticate()
    .then(function () {
    console.log('Connection has been established successfully.');
    OnDatabaseConnectionEstablished();
})["catch"](function (err) {
    console.error('Unable to connect to the database:', err);
});
var proPublicaRequest = request.defaults({
    headers: { 'X-API-Key': process.env.PRO_PUBLICA_API_KEY }
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
    repDb.findOne({ where: { representativeId: repId } }).then(function (reps) {
        res.json(reps);
        next();
    });
}
// Returns all sentators
function getAllSenators(req, res, next) {
    repDb.findAll({ where: { chamber: 1 /* Senate */ } }).then(function (reps) {
        res.json(reps);
        next();
    });
}
// Returns all hose members
function getAllHouseMembers(req, res, next) {
    console.log("Called getAllHouseMembers");
    console.log("repDB: " + repDb);
    console.log("Server: " + server);
    repDb.findAll({ where: { chamber: 0 /* House */ } }).then(function (reps) {
        res.json(reps);
        next();
    });
}
// Makes a request to the ProPublica API to get get all members of the House
function getHouse(req, res, next) {
    var requestURL = "https://api.propublica.org/congress/" + process.env.PRO_PUBLICA_API_VERSION + "/" + process.env.CURRENT_HOUSE + "/" + process.env.HOUSE + "/members.json";
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
    var requestURL = "https://api.propublica.org/congress/" + process.env.PRO_PUBLICA_API_VERSION + "/" + process.env.CURRENT_SENATE + "/" + process.env.SENATE + "/members.json";
    console.log("getSenate::requestURL = " + requestURL);
    proPublicaRequest(requestURL, function (requestError, requestResponse, requestBody) {
        // Store the result in locals if relevant
        if (requestError) {
            res.locals.proPublicaSenateSuccess = false;
        }
        else {
            res.locals.proPublicaSenateSuccess = true;
            res.locals.proPublicaSenateResults = JSON.parse(requestBody).results;
        }
        next();
    });
}
// Finds the MemberID of your representative based on district
function getRepresentativeId(req, res, next) {
    var representatives = res.locals.whoIsMyRepresentativeResults;
    var myReps = [];
    for (var key in representatives) {
        var rep = representatives[key];
        var name_1 = rep.name.split(" ");
        var firstName = name_1[0];
        var lastName = name_1[1];
        var state = rep.state;
        var representative = new Representative.Representative(firstName, lastName, rep.state);
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
var port = process.env.port || 8081;
server.listen(port, function () {
    console.log('%s listening at %s', server.name, server.url);
});
server.get('/', index);
server.head('/', index);
var houseMembersPath = '/house';
server.get(houseMembersPath, [getAllHouseMembers]);
function OnDatabaseConnectionEstablished() {
    var zipcodePath = '/zipcode/:zipcode';
    var representativePath = '/repid/:repid';
    //var houseMembersPath = '/house'
    var senatorsPath = '/senate';
    server.get(zipcodePath, [findMyRep, getHouse, getSenate, getRepresentativeId]);
    server.get(representativePath, [getRepById]);
    //server.get(houseMembersPath, [getAllHouseMembers]);
    server.get(senatorsPath, [getAllSenators]);
}
