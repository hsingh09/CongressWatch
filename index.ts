var restify = require('restify');

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

function index(req, res, next) {
  res.send("Listening at " + server.url);
  next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.get('/', index);
server.head('/', index);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});