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
  
// Function to buy an item (check stock and update or delete item based on stock)
function buyItem(itemId, shop) {
    const itemRef = db.collection(shop).doc(itemId);

    itemRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const currentStock = parseInt(data.StockValue);
            const itemPrice = data.Value; // Assuming the price is in the same currency as the shop's funds

            // Fetch current funds
            return db.collection('merchant').doc('blacksmith').get().then((fundsDoc) => {
                if (fundsDoc.exists) {
                    const funds = fundsDoc.data();
                    const totalFunds = funds.gold * 10000 + funds.silver * 100 + funds.copper;

                    if (itemPrice > totalFunds) {
                        alert("The blacksmith can't afford this item!");
                        return; // Exit the function if the funds are not sufficient
                    }

                    if (currentStock > 1) {
                        // Decrease stock and update funds
                        return itemRef.update({
                            StockValue: currentStock - 1
                        }).then(() => {
                            return updateFunds(funds, itemPrice); // Update funds after buying
                        }).then(() => {
                            console.log("Item stock and funds updated successfully!");
                            fetchItems(shop); // Refresh the item list
                            fetchFunds(); // Refresh the available funds display
                        }).catch((error) => {
                            console.error("Error updating item stock or funds: ", error);
                        });
                    } else if (currentStock === 1) {
                        // Delete item and update funds
                        return itemRef.delete().then(() => {
                            return updateFunds(funds, itemPrice); // Update funds after deleting
                        }).then(() => {
                            console.log("Item successfully deleted and funds updated!");
                            fetchItems(shop); // Refresh the item list
                            fetchFunds(); // Refresh the available funds display
                        }).catch((error) => {
                            console.error("Error deleting item or updating funds: ", error);
                        });
                    } else {
                        alert("Item is out of stock!");
                    }
                } else {
                    console.log("No funds document found!");
                }
            }).catch((error) => {
                console.error("Error fetching funds document: ", error);
            });
        } else {
            console.log("No such item document!");
        }
    }).catch((error) => {
        console.error("Error getting item document: ", error);
    });
}

// Function to update funds after a purchase
function updateFunds(funds, itemPrice) {
    const totalFunds = funds.gold * 10000 + funds.silver * 100 + funds.copper;
    const newTotalFunds = totalFunds - itemPrice;

    const newFunds = {
        gold: Math.floor(newTotalFunds / 10000),
        silver: Math.floor((newTotalFunds % 10000) / 100),
        copper: newTotalFunds % 100
    };

    return db.collection('merchant').doc('blacksmith').update(newFunds);
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
            updateFunds(funds, -itemValue); // Subtract item value from funds
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
