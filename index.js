const express = require('express');
const cors = require('cors')
const app = express();
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");

app.listen(8080, () => console.log("on :8080"));

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 
}
app.use(cors(corsOptions))

app.use(express.json());

let count = 0;
const people = new Map();
app.put('/', (request, response) => {
  response.send("received");
  if (request.body.home_lat != null) {
    console.log(request.body.home_lat+" "+count++);
    people.set(request.body.name, request.body);
  }
});