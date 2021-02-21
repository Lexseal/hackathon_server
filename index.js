const express = require('express');
const cors = require('cors')

const admin = require('firebase-admin');

const serviceAccount = require('./maps-94346c6d6ab7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const colRef = db.collection('users');

const app = express();
app.listen(8080, () => console.log("on :8080"));

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 
}
app.use(cors(corsOptions))

app.use(express.json());

const people = new Map();

// function generate_name() {
//   let name = "";
//   for (let i = 0; i < Math.random()*10; i++) {
//     name += String.fromCharCode(97+Math.floor(Math.random()*26))
//   }
//   return name;
// }

// const default_people = [];
// for (let i = 0; i < 100; i++) {
//   const person = {
//     name: generate_name()+" "+generate_name(),
//     home_lat: (Math.random()/5-0.5)+32.8686,
//     home_lng: (Math.random()/5-0.5)-116.9728,
//     depart_time: 1,
//     work_lat: (Math.random()/5-0.5)+32.8686,
//     work_lng: (Math.random()/5-0.5)-116.9728,
//     return_time: 2,
//     perferece: Math.round(Math.random()*2-1),
//     radius: Math.random()*10,
//   };
//   default_people.push(person);
// }

// (function populate_database() {
//   default_people.forEach((person) => {
//     const docRef = colRef.doc(person.name);
//     docRef.set(person);
//   });
// })();

async function populate_people() {
  const snapshot = await colRef.get();
  snapshot.forEach((person) => {
    people.set(person.id, person.data());
  });
  // console.log(people);
}

function dist(lat1, lng1, lat2, lng2) {
  const x1 = lat1*110.574;
  const x2 = lat2*110.574;
  const y1 = lng1*111.320*Math.cos(lat1*Math.PI/180);
  const y2 = lng2*111.320*Math.cos(lat2*Math.PI/180);
  const dist = Math.sqrt(Math.pow(x1-x2, 2)+Math.pow(y1-y2, 2));
  // console.log(lat1, lng1, lat2, lng2, dist);
  return dist;
}

function compose_response(name) {
  const user = people.get(name);
  const home_lat = user.home_lat;
  const home_lng = user.home_lng;
  const work_lat = user.work_lat;
  const work_lng = user.work_lng;
  const rad = user.radius;
  const list = [];
  people.forEach((person) => {
    // if (person.name === name) return;
    const home_lat2 = person.home_lat;
    const home_lng2 = person.home_lng;
    const work_lat2 = person.work_lat;
    const work_lng2 = person.work_lng;
    const rad2 = person.radius;
    // console.log(person.name);
    if (dist(home_lat, home_lng, home_lat2, home_lng2) > Math.min(rad, rad2)) return;
    if (dist(work_lat, work_lng, work_lat2, work_lng2) > Math.min(rad, rad2)) return;
    list.push(person);
  })
  // console.log(list);
  return list;
}

populate_people(); // initialize database
app.post('/', (request, response) => {
  const name = request.body.name;
  const home_lat = request.body.home_lat;
  const work_lat = request.body.work_lat;
  
  if (home_lat == null || work_lat == null) {
    response.send([]);
    console.log("null");
    return;
  }
  if (people.get(name)) {
    if (home_lat == people.get(name).home_lat && work_lat == people.get(name).work_lat) {
      response.send([]);
      console.log("same");
      return;
    }
  }

  console.log(name, home_lat, work_lat);
  // console.log(people.get(name));
  people.set(name, request.body);
  const docRef = colRef.doc(name);
  docRef.set(request.body);

  console.log(compose_response(name));
  response.send(compose_response(name));
});