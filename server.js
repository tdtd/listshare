var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var port = process.env.PORT || 3500;
var checklist = require('./lib/index.js');

function uuidValid(uuid){
  var reg = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4{1}[a-fA-F0-9]{3}-[89abAB]{1}[a-fA-F0-9]{3}-[a-fA-F0-9]{12}$/;
  return reg.test(uuid);
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

server.listen(port, function(){
  console.log("Listening on "+port);
});

//Return empty root api
app.get('/api', function(req, res){
  res.json({}).status(200);
});

//Return 10 most recent public checklists
app.get('/api/recentChecklists', function(req, res){
  checklist.loadRecentPublic()
    .then(function(doc){
      res.json(doc).status(200);
    })
    .catch(function(err){
      console.log(err);
      res.status(404).end();
    })
});

//return a specific checklist
app.get('/api/:id', function(req, res){
  checklist.loadPollById(req.params.id)
    .then(function(doc){
      res.json(doc).status(200);
    })
    .catch(function(err){
      console.log(err);
      res.status(404).end();
    })
});

app.post('/api', function(req, res){
  if (req.body.list.length < 1){
    return res.status(400).send({err: 'List must contain atleast one item.'});
  }
  
  if (req.body.title.length < 1){
    return res.status(400).send({err: 'List title must be atlest one character long.'});
  }
  
  if (typeof req.body.createrId == 'object' || req.body.createrId && !uuidValid(req.body.createrId)){
    delete req.body.createrId;
  }
  
  checklist.create(req.body)
    .then(function(doc){
      res.json(doc).status(201);
    })
    .catch(function(err){
      console.log(err);
      res.status(401).end();
    })
})

app.use(express.static(path.resolve(__dirname, 'client')));

//Allow any id to open page
app.use('/#/*', express.static(path.resolve(__dirname, 'client')));

app.get('/*/*', function(req, res){
  res.json({err: 'Page Not Found'}).status(404);
});