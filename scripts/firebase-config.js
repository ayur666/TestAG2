// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA2h0Y1Km5nWDGCNIBRUChtH481Q-lt8dw", //process.env.FIREBASE_API_KEY,
    authDomain: "adventurer-s-guild.firebaseapp.com", // process.env.FIREBASE_AUTH_DOMAIN,
    projectId: "adventurer-s-guild", // process.env.FIREBASE_PROJECT_ID,
    storageBucket: "adventurer-s-guild.appspot.com", //process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: "937158092711", //process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: "1:937158092711:web:a03bee6d47f0534fd9f882.env", //process.env.FIREBASE_APP_ID,
};

class ArgumentError extends Error {
    constructor(msg) {
        super(msg);
        alert(msg)
        this.name = this.constructor.name;
    }
}

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

// Type safety in spaghetti language
const checkPositiveNumbers = (...args)  => {
    args.forEach(n => {
        if(n < 0 || typeof(n) != "number"){
            throw new ArgumentError("Value must be a positive number")
        }
    })
}

// Convert currency values to Copper
const convertToCopper = (gold, silver, copper) => {
    checkPositiveNumbers(gold, silver, copper);
    return (gold * 10000) + (silver * 100) + copper;
}

// Convert any currency value to Copper
const convertCurrencyToCopper = (curr, amount) => {
    checkPositiveNumbers(amount);
    switch(curr.toLowerCase()) {
        case "gold": return amount * 10000;
        case "silver": return amount * 100;
        case "copper": return amount;
        default: throw new ArgumentError("Currency must be gold, silver, or copper");
    }
}

// Convert Copper value to Gold, Silver, Copper
const convertFromCopper = (copper) => {
    checkPositiveNumbers(copper);
    return {
        gold: Math.floor(copper / 10000),
        silver: Math.floor((copper % 10000) / 100),
        copper: copper % 100
    };
}


class GameItem {
    // to-do use better pattern
    constructor(
        name, 
        value,
        currency, 
        rarity, 
        requirements, 
        stockValue, 
        modifier, 
        description) {
            if(!name.match("[A-Za-z \'-]*")){
                throw new ArgumentError("Name must be text and no special characters except ' or \\")
            }

            this.name = name

            if(!["gold","silver","copper"].includes(currency.toLowerCase())){
                throw new ArgumentError("Currency must be gold,silver or copper")
            }
            this.currency = currency

            checkPositiveNumbers(value)
            this.value = value

            if(!Object.keys(RARITY_MAP).includes(rarity)){
                throw new ArgumentError(`Rarity must be one of ${Object.keys(RARITY_MAP).join(", ")}`)
            }
            this.rarity = rarity
            this.requirements = requirements

            checkPositiveNumbers(stockValue)
            this.stockValue = stockValue
            this.modifier = modifier
            this.description = description
            //TBD validators for remaining attrs


    }
}

class NPC {
    constructor(name, age, race, affiliation, description, shopDescription) {
        this.name = name;
        this.age = age;
        this.race = race;
        this.affiliation = affiliation;
        this.description = description;
        this.shopDescription = shopDescription;
    }
}


const RARITY_MAP = {
    junk: "gray",
    common: "black",
    uncommon: "green",
    rare: "blue",
    epic: "purple",
    mythic: "red"
}

// Function to fetch items for a specific NPC
async function fetchNPC(npcId) {
    let npcRef;
    try {
        npcRef = await db.collection('NPCData').doc(npcId).get();
    } catch (err) {
        console.error("Error fetching NPC data: ", err);
        return null;
    }

    if (!npcRef.exists) {
        console.error("No NPC found with the provided ID.");
        return null;
    }

    const npcData = npcRef.data();
    return new NPC(
        npcData.Name,
        npcData.Age,
        npcData.Race,
        npcData.Affiliation,
        npcData.Description,
        npcData.ShopDescription
    );
}

// Function to fetch items for a specific shop
async function fetchItems(shop) {
    let querySnapshot;
    let itemsList = ''

    try {
        querySnapshot = await db.collection(shop).get()
    }
    catch (err) {
        console.error("Error fetching items: ", err)
    }

    querySnapshot.forEach((doc) =>  {
        const data = doc.data()
        const rarityColor = RARITY_MAP[data.Rarity] || "black";

        itemsList += `
            <li class="item-tile">
                <span class="item-name" style="color: ${rarityColor};">${data.Name}</span> - ${data.Value} ${data.Currency}
                <div class="item-details">
                    <p><strong>Requirements:</strong> ${data.Requirements}</p>
                    <p><strong>Description:</strong> ${data.Description}</p>
                    <p><strong>Modifier:</strong> ${data.Modifier}</p>
                    <p><strong>Stock:</strong> ${data.StockValue}</p>
                </div>
                <button class="buy-button" onclick="buyItem('${doc.id}', '${shop}', ${data.Value}, '${data.Currency}')">Buy</button>
            </li>
        `
        document.getElementById('items-list').innerHTML = itemsList;
    })
}

// Function to fetch the blacksmith's available funds
async function fetchFunds() {
    let blacksmithFunds;

    try {
        blacksmithFunds = await db.collection('merchant').doc('blacksmith').get()
    }
    catch (err) {
        console.error("Error getting documennt: ", err)
        return null;
    }

    blacksmithFunds = blacksmithFunds.data()

    const funds = convertToCopper(blacksmithFunds.gold, blacksmithFunds.silver, blacksmithFunds.copper);

    document
        .getElementById('blacksmith-funds')
        .innerText = `Funds: ${blacksmithFunds.gold} Gold, ${blacksmithFunds.silver} Silver, ${blacksmithFunds.copper} Copper`;

    return blacksmithFunds;
}

// Function to buy an item (corrected)
async function buyItem(itemId, shop, itemPrice, itemCurrency) {
    let itemRef = await db.collection(shop).doc(itemId).get();
    let funds = await db.collection('merchant').doc('blacksmith').get();
    
    const currentStock = parseInt(itemRef.data().StockValue);
    funds = funds.data();

    const fundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper);
    const itemPriceInCopper = convertCurrencyToCopper(itemCurrency, itemPrice);
    const newFunds = convertFromCopper(fundsInCopper + itemPriceInCopper); // Funds should increase

    try {
        if (currentStock > 1) {
            await db.collection(shop).doc(itemId).update({ StockValue: currentStock - 1 });
        } else if (currentStock === 1) {
            await db.collection(shop).doc(itemId).delete();
        }
        await db.collection('merchant').doc('blacksmith').update(newFunds);
        console.log("Item stock and funds updated successfully");
    } catch (err) {
        console.error("Error updating item or funds: ", err);
    }

    fetchItems(shop); // Refresh the item list
    fetchFunds(); // Refresh the available funds display
}

async function sellItem() {
    let gameItem;
    try {
        gameItem = new GameItem(
            document.getElementById('item-name').value,
            parseInt(document.getElementById('item-value').value, 10),
            document.getElementById('item-currency').value,
            document.getElementById('item-rarity').value,
            document.getElementById('item-requirements').value,
            parseInt(document.getElementById('item-stockValue').value, 10),
            document.getElementById('item-modifier').value,
            document.getElementById('item-description').value
        );
    } catch (err) {
        console.error("Could not create GameItem: ", err);
        return;
    }

    let funds;
    try {
        funds = await fetchFunds();
        if (!funds) {
            console.error("Failed to fetch funds.");
            return;
        }
    } catch (err) {
        console.error("Error fetching funds: ", err);
        return;
    }

    // Convert the fetched funds to copper
    const totalFundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper);
    const itemValueInCopper = convertCurrencyToCopper(gameItem.currency, gameItem.value) * gameItem.stockValue;

    console.log(`Total funds in copper: ${totalFundsInCopper}`);
    console.log(`Item value in copper: ${itemValueInCopper}`);

    // Check if the merchant can afford the item
    if (itemValueInCopper > totalFundsInCopper) {
        alert("The blacksmith can't afford to add this item!");
        clearFormInputs();
        return;
    }

    try {
        // Add the new item to the 'blacksmithshop' collection
        const docRef = await db.collection('blacksmithshop').add({
            Name: gameItem.name,
            Value: gameItem.value,
            Currency: gameItem.currency,
            Rarity: gameItem.rarity,
            Requirements: gameItem.requirements,
            StockValue: gameItem.stockValue,
            Modifier: gameItem.modifier,
            Description: gameItem.description
        });

        console.log("Doc written with ID: ", docRef.id);

        // Calculate the new total funds
        const newTotalFundsInCopper = totalFundsInCopper - itemValueInCopper;
        console.log(`New total funds in copper: ${newTotalFundsInCopper}`);

        // Convert new total funds in copper to individual currency fields
        const updatedFunds = convertToCurrencyFields(newTotalFundsInCopper);

        // Update the 'blacksmith' document with the new funds
        await db.collection('merchant').doc('blacksmith').update(updatedFunds);

        console.log("Merchant's funds updated successfully.");

        // Refresh the UI and clear the form inputs
        fetchItems('blacksmithshop');
        fetchFunds();
        clearFormInputs();
    } catch (err) {
        console.error("Error updating database: ", err);
    }
}

// Function to convert total copper to gold, silver, and copper fields
function convertToCurrencyFields(totalCopper) {
    const gold = Math.floor(totalCopper / 10000);  // 1 gold = 100 silver = 10,000 copper
    totalCopper %= 10000;
    const silver = Math.floor(totalCopper / 100); // 1 silver = 100 copper
    totalCopper %= 100;
    const copper = totalCopper % 100;

    return {
        gold: gold,
        silver: silver,
        copper: copper
    };
}



// Function to clear form inputs
function clearFormInputs() {
    const inputs = [
        'item-name', 
        'item-value', 
        'item-currency', 
        'item-rarity',
        'item-requirements',
        'item-stockValue',
        'item-modifier',
        'item-description'
    ]

    inputs.forEach(e => document.getElementById(e).value = '')
}

