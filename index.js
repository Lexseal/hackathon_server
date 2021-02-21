const express = require('express');
const cors = require('cors')

const admin = require('firebase-admin');

const serviceAccount = require('./maps-94346c6d6ab7.json');
const { exit } = require('process');

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
//     hash: Math.random().toString(),
//     name: generate_name()+" "+generate_name(),
//     password: Math.random().toString(),
//     home_lat: (Math.random()-0.5)/5+32.8800604,
//     home_lng: (Math.random()-0.5)/5-117.2340135,
//     depart_time: Math.floor(Math.random()*12)+":"+Math.floor(Math.random()*60),
//     work_lat: (Math.random()-0.5)/5+32.8800604,
//     work_lng: (Math.random()-0.5)/5-117.2340135,
//     return_time: (Math.floor(Math.random()*12)+12)+":"+Math.floor(Math.random()*60),
//     preferece: Math.round(Math.random()*2-1),
//     radius: Math.random()*10,
//     paired: false,
//     match: null,
//   };
//   console.log(person);
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
    if (person.name === name) return;
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
  let same = false;
  if (people.get(name)) {
    same = true
    for (let key in request.body) {
      if (request.body[key] !== people.get(name)[key]) {
        same = false;
        break;
      }
    }
  }
  if (!same) {
    people.set(name, request.body);
    const docRef = colRef.doc(name);
    docRef.set(request.body);
  }

  // console.log(name, home_lat, work_lat);
  // console.log(people.get(name));

  //console.log(compose_response(name));
  response.send(compose_response(name));
});

app.get('/pair', (request, response) => {
  const from = request.query.from;
  const to = request.query.to;
  //console.log(from, to);
  if (people.get(to).paired == false) {
    people.get(to).paired = true;
    people.get(to).match = from;
    people.get(from).paired = true;
    people.get(from).match = to;
    let docRef = colRef.doc(from);
    docRef.set(people.get(from));
    docRef = colRef.doc(to);
    docRef.set(people.get(to));
  }
  response.send(people.get(from));
});

app.get('/fetch', (request, response) => {
  const user = request.query.user;
  response.send(people.get(user));
  console.log(user, people.get(user));
});