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
              const data = doc.data();
              const rarityColor = getRarityColor(data.Rarity);
  
              itemsList += `
                  <li style="padding: 10px; border-bottom: 1px solid #ddd; margin-bottom: 10px;">
                      <span style="color: ${rarityColor};">${data.Name}</span> - ${data.Value} ${data.Currency}
                      <div>
                          <p>Requirements: ${data.Requirements}</p>
                          <p>Description: ${data.Description}</p>
                          <p>Modifier: ${data.Modifier}</p>
                          <p>Stock: ${data.StockValue}</p>
                      </div>
                      <button onclick="buyItem('${doc.id}', '${shop}', ${data.Value})">Buy</button>
                  </li>
                  `;
          });
          document.getElementById('items-list').innerHTML = itemsList;
      }).catch((error) => {
          console.error("Error fetching items: ", error);
      });
  }
  
  // Function to get the color based on item rarity
  function getRarityColor(rarity) {
      switch (rarity.toLowerCase()) {
          case 'junk':
              return 'gray';
          case 'common':
              return 'black';
          case 'uncommon':
              return 'green';
          case 'rare':
              return 'blue';
          case 'epic':
              return 'purple';
          case 'legendary':
              return 'orange';
          case 'mythic':
              return 'red';
          default:
              return 'black'; // Default color
      }
  }
  
  // Function to fetch the blacksmith's available funds
  function fetchFunds() {
      db.collection('merchant').doc('blacksmith').get().then((doc) => {
          if (doc.exists) {
              const data = doc.data();
              const totalFunds = data.gold * 10000 + data.silver * 100 + data.copper;
              document.getElementById('blacksmith-funds').innerText = `Funds: ${data.gold} Gold, ${data.silver} Silver, ${data.copper} Copper`;
              return data;
          } else {
              console.log("No such document!");
          }
      }).catch((error) => {
          console.error("Error getting document: ", error);
      });
  }
  
  // Function to update the blacksmith's available funds
  function updateFunds(amount) {
      db.collection('merchant').doc('blacksmith').get().then((doc) => {
          if (doc.exists) {
              const data = doc.data();
              let totalFunds = data.gold * 10000 + data.silver * 100 + data.copper;
              totalFunds += amount;
  
              let newGold = Math.floor(totalFunds / 10000);
              totalFunds %= 10000;
              let newSilver = Math.floor(totalFunds / 100);
              let newCopper = totalFunds % 100;
  
              return db.collection('merchant').doc('blacksmith').update({
                  gold: newGold,
                  silver: newSilver,
                  copper: newCopper
              }).then(() => {
                  fetchFunds(); // Refresh the funds display
                  console.log("Funds updated successfully!");
              }).catch((error) => {
                  console.error("Error updating funds: ", error);
              });
          }
      }).catch((error) => {
          console.error("Error getting document: ", error);
      });
  }
  
  // Function to buy an item (check stock and update or delete item based on stock)
  function buyItem(itemId, shop, itemValue) {
      fetchFunds().then((funds) => {
          const totalFunds = funds.gold * 10000 + funds.silver * 100 + funds.copper;
          
          if (itemValue > totalFunds) {
              alert("The blacksmith can't afford this item!");
              return;
          }
  
          const itemRef = db.collection(shop).doc(itemId);
          
          itemRef.get().then((doc) => {
              if (doc.exists) {
                  const data = doc.data();
                  const currentStock = parseInt(data.StockValue);
  
                  if (currentStock > 1) {
                      // Decrease stock and update funds
                      return itemRef.update({
                          StockValue: currentStock - 1
                      }).then(() => {
                          updateFunds(itemValue); // Add item value to funds
                          fetchItems(shop); // Refresh the item list
                      }).catch((error) => {
                          console.error("Error updating item stock: ", error);
                      });
                  } else if (currentStock === 1) {
                      // Delete item and update funds
                      return itemRef.delete().then(() => {
                          updateFunds(itemValue); // Add item value to funds
                          fetchItems(shop); // Refresh the item list
                      }).catch((error) => {
                          console.error("Error deleting item: ", error);
                      });
                  } else {
                      alert("Item is out of stock!");
                  }
              } else {
                  console.log("No such document!");
              }
          }).catch((error) => {
              console.error("Error getting document: ", error);
          });
      });
  }
  
  // Function to add a new item to the shop
  function addItem() {
      const itemName = document.getElementById('item-name').value;
      const itemValue = parseInt(document.getElementById('item-value').value);
      const itemCurrency = document.getElementById('item-currency').value;
      const itemRarity = document.getElementById('item-rarity').value;
      const itemRequirements = document.getElementById('item-requirements').value;
      const itemStockValue = parseInt(document.getElementById('item-stockValue').value);
      const itemModifier = document.getElementById('item-modifier').value;
      const itemDescription = document.getElementById('item-description').value;
  
      fetchFunds().then((funds) => {
          const totalFunds = funds.gold * 10000 + funds.silver * 100 + funds.copper;
  
          if (itemValue > totalFunds) {
              alert("The blacksmith can't afford to add this item!");
              return;
          }
  
          db.collection('blacksmithshop').add({
              Name: itemName,
              Value: itemValue,
              Currency: itemCurrency,
              Rarity: itemRarity,
              Requirements: itemRequirements,
              StockValue: itemStockValue,
              Modifier: itemModifier,
              Description: itemDescription
          }).then((docRef) => {
              console.log("Document written with ID: ", docRef.id);
              updateFunds(-itemValue); // Subtract item value from funds
              fetchItems('blacksmithshop'); // Refresh the item list
          }).catch((error) => {
              console.error("Error adding document: ", error);
          });
  
          // Clear form inputs
          document.getElementById('item-name').value = '';
          document.getElementById('item-value').value = '';
          document.getElementById('item-currency').value = '';
          document.getElementById('item-rarity').value = '';
          document.getElementById('item-requirements').value = '';
          document.getElementById('item-stockValue').value = '';
          document.getElementById('item-modifier').value = '';
          document.getElementById('item-description').value = '';
      });
  }
  