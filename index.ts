require('dotenv').config();

import * as restify from "restify";
import * as http from "http";
import * as request from "request"
import * as sequelize from "sequelize";
import * as Representative from "./models/representative"

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

sqlize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
    OnDatabaseConnectionEstablished();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Private config file for API keys
var config = require('./config');
var proPublicaRequest = request.defaults(
  {
    headers: {'X-API-Key' : process.env.PRO_PUBLICA_API_KEY }
  }
)

function index(req, res, next) {
  res.send("Listening at " + server.url);
  next();
}

// Makes a request to the WhoisMyRepresentative API for your representatives.
function findMyRep(req : restify.Request, res, next : restify.Next) {
  let zipcode = req.params.zipcode;
  let requestURL = "http://whoismyrepresentative.com/getall_mems.php?zip=" + zipcode + "&output=json";
  console.log("findMyRep::URL: " + requestURL);   

  request(requestURL, function(requestError, requestResponse, requestBody)
  {
    if (requestError)
    {
      res.locals = { whoIsMyRepresentativeSuccess: false }
    }
    else
    {
      res.locals = {
        success: true,
        whoIsMyRepresentativeResults: JSON.parse(requestBody).results
      };
    }

    next();
  });
}


// Queries the local cache DB for a representatives information
function getRepById(req, res, next)
{
  var repId = req.params.repid;
  var requestURL = "http://localhost:8080/update"
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
function getHouse(req : restify.Request, res, next : restify.Next)
{
  let requestURL = "https://api.propublica.org/congress/" + config.PRO_PUBLICA_API_VERSION + "/" + config.CURRENT_HOUSE + "/" + config.HOUSE + "/members.json";
  console.log("getHouse::requestURL = " + requestURL);

  proPublicaRequest(requestURL, function(requestError, requestResponse, requestBody)
  {
    if (requestError)
    {
      res.locals.proPublicaHouseSuccess = false;
    }
    else
    {
      res.locals.proPublicaHouseSuccess = true;
      res.locals.proPublicaHouseResults = JSON.parse(requestBody).results;
    }

//1      res.json(res.locals);  
      next();
  });
}

// Makes a request to the ProPublica API and gets all members of the Senate
function getSenate(req : restify.Request, res, next: restify.Next)
{
  let requestURL = "https://api.propublica.org/congress/" + config.PRO_PUBLICA_API_VERSION + "/" + config.CURRENT_SENATE + "/" + config.SENATE + "/members.json";
  console.log("getSenate::requestURL = " + requestURL);

  proPublicaRequest(requestURL, function(requestError, requestResponse, requestBody)
  {
    // Store the result in locals if relevant
    if (requestError)
    {
      res.locals.proPublicaSenateSuccess = false;
    }
    else
    {
      res.locals.proPublicaSenateSuccess = true;
      res.locals.proPublicaSenateResults = JSON.parse(requestBody).results;
    }

    next();
  });
}

// Finds the MemberID of your representative based on district
function getRepresentativeId(req : restify.Request, res, next : restify.Next)
{
  let representatives = res.locals.whoIsMyRepresentativeResults;
  let myReps: Representative.Representative[] = [];
  for (let key in representatives)
  {
     let rep = representatives[key];
     let name = rep.name.split(" ");
     let firstName = name[0];
     let lastName = name[1];
     let state = rep.state;
     let representative = new Representative.Representative(firstName, lastName, rep.state);
     myReps.push(representative);
  }

  let senators = res.locals.proPublicaSenateResults[0]['members'];
  FindMatchingRepresentative(senators, myReps, Representative.Chamber.Senate);

  let houseMembers = res.locals.proPublicaHouseResults[0]['members'];
  FindMatchingRepresentative(houseMembers, myReps, Representative.Chamber.House);

  res.json(myReps);
  next();
}

function FindMatchingRepresentative(proPublicaReps, myReps : Representative.Representative[], chamber : Representative.Chamber)
{
  for (let key in proPublicaReps)
  {
    let proPublicaRep = proPublicaReps[key];
    for (let key in myReps)
    {
      let rep = myReps[key]
      if ((proPublicaRep.state === rep.state) && (proPublicaRep.last_name === rep.lastName))
      {
        rep.SetRepresentativeId(proPublicaRep.id);
        rep.SetChamber(chamber);
      }
    }
  }
}

var server = restify.createServer();

server.listen(8081, function () {
    console.log('%s listening at %s', server.name, server.url);
});


function OnDatabaseConnectionEstablished()
{
  var zipcodePath = '/zipcode/:zipcode';
  var representativePath = '/repid/:repid';
  server.get(zipcodePath, [findMyRep, getHouse, getSenate, getRepresentativeId]);
  server.get(representativePath, [getRepById])
  server.get('/', index);
  server.head('/', index);
  server.listen(8081, function () {
      console.log('%s listening at %s', server.name, server.url);
  });
}
