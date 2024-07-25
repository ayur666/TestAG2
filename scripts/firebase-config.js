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
                <li>
                    <span style="color: ${rarityColor};">${data.Name}</span> - ${data.Value} ${data.Currency}
                    <span>Stock: ${data.StockValue}</span>
                    <button onclick="buyItem('${doc.id}', '${shop}')">Buy</button>
                    <div>
                        <p>Requirements: ${data.Requirements}</p>
                        <p>Description: ${data.Description}</p>
                        <p>Modifier: ${data.Modifier}</p>
                    </div>
                </li>`;
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

// Function to buy an item (check stock and update or delete item based on stock)
function buyItem(itemId, shop) {
    const itemRef = db.collection(shop).doc(itemId);

    itemRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const currentStock = parseInt(data.StockValue);

            if (currentStock > 1) {
                // Decrease stock
                return itemRef.update({
                    StockValue: currentStock - 1
                }).then(() => {
                    console.log("Item stock updated successfully!");
                    fetchItems(shop); // Refresh the item list
                }).catch((error) => {
                    console.error("Error updating item stock: ", error);
                });
            } else if (currentStock === 1) {
                // Delete item
                return itemRef.delete().then(() => {
                    console.log("Item successfully deleted!");
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
}

// Function to add a new item to the shop
function addItem() {
    const itemName = document.getElementById('item-name').value;
    const itemValue = parseInt(document.getElementById('item-value').value);
    const itemCurrency = document.getElementById('item-currency').value;
    const itemRarity = document.getElementById('item-rarity').value;
    const itemRequirements = document.getElementById('item-requirements').value;
    const itemStockValue = document.getElementById('item-stockValue').value;
    const itemModifier = document.getElementById('item-modifier').value;
    const itemDescription = document.getElementById('item-description').value;

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
}
