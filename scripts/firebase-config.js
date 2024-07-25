// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2h0Y1Km5nWDGCNIBRUChtH481Q-lt8dw",
  authDomain: "adventurer-s-guild.firebaseapp.com",
  projectId: "adventurer-s-guild",
  storageBucket: "adventurer-s-guild.appspot.com",
  messagingSenderId: "937158092711",
  appId: "1:937158092711:web:a03bee6d47f0534fd9f882"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
var db = firebase.firestore();

// Function to fetch items for a specific shop
function fetchItems(shop) {
  db.collection(shop).get().then((querySnapshot) => {
      let itemsList = '';
      querySnapshot.forEach((doc) => {
          itemsList += `
              <li>
                  ${doc.data().Name} - ${doc.data().Value} ${doc.data().Currency}
                  <button onclick="buyItem('${doc.id}', '${shop}')">Buy</button>
              </li>`;
      });
      document.getElementById('items-list').innerHTML = itemsList;
  }).catch((error) => {
      console.error("Error fetching items: ", error);
  });
}

// Function to buy an item (remove from the database)
function buyItem(itemId, shop) {
  db.collection(shop).doc(itemId).delete().then(() => {
      console.log("Item successfully deleted!");
      fetchItems(shop); // Refresh the item list
  }).catch((error) => {
      console.error("Error removing item: ", error);
  });
}

// Function to add a new item to the shop
function addItem() {
  const itemName = document.getElementById('item-name').value;
  const itemValue = document.getElementById('item-value').value;
  const itemCurrency = document.getElementById('item-currency').value;

  db.collection('blacksmithshop').add({
      Name: itemName,
      Value: parseInt(itemValue),
      Currency: itemCurrency
  }).then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
      fetchItems('blacksmithshop'); // Refresh the item list
  }).catch((error) => {
      console.error("Error adding document: ", error);
  });

  // Clear form inputs
  document.getElementById('item-name').value = '';
  document.getElementById('item-value').value = '';
  document.getElementById('item-currency').value = '';
}
