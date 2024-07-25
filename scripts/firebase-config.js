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

// Convert currency values to Copper
function convertToCopper(gold, silver, copper) {
    return (gold * 10000) + (silver * 100) + copper;
}

// Convert Copper value to Gold, Silver, Copper
function convertFromCopper(copper) {
    return {
        gold: Math.floor(copper / 10000),
        silver: Math.floor((copper % 10000) / 100),
        copper: copper % 100
    };
}

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
                    <button onclick="buyItem('${doc.id}', '${shop}', ${data.Value}, '${data.Currency}')">Buy</button>
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
    return db.collection('merchant').doc('blacksmith').get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const totalFunds = convertToCopper(data.gold, data.silver, data.copper);
            document.getElementById('blacksmith-funds').innerText = `Funds: ${data.gold} Gold, ${data.silver} Silver, ${data.copper} Copper`;
            return data;
        } else {
            console.log("No such document!");
            return null;
        }
    }).catch((error) => {
        console.error("Error getting document: ", error);
        return null;
    });
}

// Function to buy an item (check stock and update or delete item based on stock)
function buyItem(itemId, shop, itemPrice, itemCurrency) {
    const itemRef = db.collection(shop).doc(itemId);

    itemRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const currentStock = parseInt(data.StockValue);

            return db.collection('merchant').doc('blacksmith').get().then((fundsDoc) => {
                if (fundsDoc.exists) {
                    const funds = fundsDoc.data();
                    const totalFundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper);
                    let itemPriceInCopper;

                    // Convert item price to Copper based on currency
                    switch (itemCurrency.toLowerCase()) {
                        case 'gold':
                            itemPriceInCopper = itemPrice * 10000;
                            break;
                        case 'silver':
                            itemPriceInCopper = itemPrice * 100;
                            break;
                        case 'copper':
                            itemPriceInCopper = itemPrice;
                            break;
                        default:
                            itemPriceInCopper = itemPrice;
                    }

                    const newTotalFundsInCopper = totalFundsInCopper + itemPriceInCopper;
                    const newFunds = convertFromCopper(newTotalFundsInCopper);

                    if (currentStock > 1) {
                        // Decrease stock and update funds
                        return itemRef.update({
                            StockValue: currentStock - 1
                        }).then(() => {
                            return db.collection('merchant').doc('blacksmith').update(newFunds);
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
                            return db.collection('merchant').doc('blacksmith').update(newFunds);
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

// Function to add a new item to the shop
function sellItem() {
    const itemName = document.getElementById('item-name').value;
    const itemValue = parseInt(document.getElementById('item-value').value);
    const itemCurrency = document.getElementById('item-currency').value;
    const itemRarity = document.getElementById('item-rarity').value;
    const itemRequirements = document.getElementById('item-requirements').value;
    const itemStockValue = parseInt(document.getElementById('item-stockValue').value);
    const itemModifier = document.getElementById('item-modifier').value;
    const itemDescription = document.getElementById('item-description').value;

    fetchFunds().then((funds) => {
        if (funds) {
            const totalFundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper);
            let itemValueInCopper;

            // Convert item value to Copper based on currency
            switch (itemCurrency.toLowerCase()) {
                case 'gold':
                    itemValueInCopper = itemValue * 10000;
                    break;
                case 'silver':
                    itemValueInCopper = itemValue * 100;
                    break;
                case 'copper':
                    itemValueInCopper = itemValue;
                    break;
                default:
                    itemValueInCopper = itemValue;
            }

            if (itemValueInCopper > totalFundsInCopper) {
                alert("The blacksmith can't afford to add this item!");
                // Ensure form inputs are cleared even if the item cannot be added
                clearFormInputs();
                return;
            }

            return db.collection('blacksmithshop').add({
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
                const newTotalFundsInCopper = totalFundsInCopper - itemValueInCopper;
                const newFunds = convertFromCopper(newTotalFundsInCopper);
                return db.collection('merchant').doc('blacksmith').update(newFunds);
            }).then(() => {
                fetchItems('blacksmithshop'); // Refresh the item list
                fetchFunds(); // Refresh the available funds display
                // Clear form inputs after successful item addition
                clearFormInputs();
            }).catch((error) => {
                console.error("Error adding document or updating funds: ", error);
                // Clear form inputs in case of error
                clearFormInputs();
            });
        }
    }).catch((error) => {
        console.error("Error fetching funds: ", error);
        // Clear form inputs if there is an error fetching funds
        clearFormInputs();
    });
}

// Function to clear form inputs
function clearFormInputs() {
    document.getElementById('item-name').value = '';
    document.getElementById('item-value').value = '';
    document.getElementById('item-currency').value = '';
    document.getElementById('item-rarity').value = '';
    document.getElementById('item-requirements').value = '';
    document.getElementById('item-stockValue').value = '';
    document.getElementById('item-modifier').value = '';
    document.getElementById('item-description').value = '';
}

