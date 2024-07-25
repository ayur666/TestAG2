// firebase-config.js

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2h0Y1Km5nWDGCNIBRUChtH481Q-lt8dw",
  authDomain: "adventurer-s-guild.firebaseapp.com",
  projectId: "adventurer-s-guild",
  storageBucket: "adventurer-s-guild.appspot.com",
  messagingSenderId: "937158092711",
  appId: "1:937158092711:web:a03bee6d47f0534fd9f882"
};

// Example function to fetch items for a specific shop
function fetchItems(shop) {
  db.collection(blacksmithshop).get().then((querySnapshot) => {
      let itemsList = '';
      querySnapshot.forEach((doc) => {
          itemsList += `<li>${doc.data().name} - ${doc.data().Value} coins</li>`;
      });
      document.getElementById('items').innerHTML = `<ul>${itemsList}</ul>`;
  });
}


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
var db = firebase.firestore();
