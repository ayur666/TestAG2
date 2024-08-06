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
        this.name = this.constructor.name;
    }
}

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

// Type safety in spaghetti language
const checkPositiveNumbers = (...args)  => {
    for(let n in args){
        if(n < 0 || typeof(n) != "number"){
            throw new ArgumentError("Value must be a positive number")
        }
    }
}

// Convert currency values to Copper
const convertToCopper = (gold, silver, copper) => {
    checkPositiveNumbers(gold, silver, copper)
    (gold * 1000) + (silver * 100) + copper
}

const convertCurrencyToCopper = (curr, amount) => {
    checkPositiveNumbers(amount)
    
    switch(curr.toLowerCase()){
        case "gold": return amount * 10_000
        case "silver": return amount * 100
        case "copper": return amount
    }
    
    throw new ArgumentError("Currency must be gold/silver/copper")
}

// Convert Copper value to Gold, Silver, Copper
const convertFromCopper = (copper) => {
    checkPositiveNumbers(copper)

    return {
        gold: Math.floor(copper / 10_000),
        silver: Math.floor((copper % 10_000 / 100)),
        copper: copper % 100
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

// Function to fetch items for a specific shop
async function fetchItems(shop) {
    let querySnapshot;
    const itemsList = ''

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
        `
        
        document.getElementById('items-list').innerHTML = itemsList;
    })
}

// Function to fetch the blacksmith's available funds
async function fetchFunds() {
    let blacksmithFunds;

    try {
        blacksmithFunds = await db.collection('merchant').doc('blacksmith').get().data()
    }
    catch (err) {
        console.error("Error getting documennt: ", err)
        return null;
    }

    const funds = convertToCopper(blacksmithFunds.gold, blacksmithFunds.silver, blacksmithFunds.copper);

    document
        .getElementById('blacksmith-funds')
        .innerText = `Funds: ${blacksmithFunds.gold} Gold, ${blacksmithFunds.silver} Silver, ${dablacksmithFundsta.copper} Copper`;
}

// Function to buy an item (check stock and update or delete item based on stock)
async function buyItem(itemId, shop, itemPrice, itemCurrency) {
    let itemRef = await db.collection(shop).doc(itemId).get;
    let funds;

    try {
        itemRef = await db.collection(shop).doc(itemId).get().data();
    }
    catch (err) {
        console.log("Error getting item document: ", err)
    }

    const currentStock = parseInt(itemRef.StockValue)

    try {
        funds = await db.collection('merchant').doc('blacksmith').get().data()
    }
    catch {
        console.log("Error getting blacksmith document: ", err)
    }

    const fundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper)
    const itemPriceInCopper = convertCurrencyToCopper(itemCurrency.toLowerCase, itemPrice)
    const newFunds = convertFromCopper(fundsInCopper + itemPriceInCopper)

    if(currentStock > 1){
        await itemRef.update({ StockValue: currentStock - 1})
        await db.collection('merchant').doc('blacksmith').update(newFunds)

        console.log("Item stock and funds updated successfully")
        fetchItems(shop)
        fetchFunds()
    }
    else if (currentStock === 1){
        await itemRef.delete()
        await db.collection('merchant').doc('blacksmith').update(newFunds)

        console.log("Item successfully deleted and funds updated!");
        fetchItems(shop); // Refresh the item list
        fetchFunds(); // Refresh the available funds display
    }
}

// Function to add a new item to the shop
async function sellItem() {
    const itemName = document.getElementById('item-name').value;
    const itemValue = parseInt(document.getElementById('item-value').value);
    const itemCurrency = document.getElementById('item-currency').value;
    const itemRarity = document.getElementById('item-rarity').value;
    const itemRequirements = document.getElementById('item-requirements').value;
    const itemStockValue = parseInt(document.getElementById('item-stockValue').value);
    const itemModifier = document.getElementById('item-modifier').value;
    const itemDescription = document.getElementById('item-description').value;

    try {
        funds = await fetchFunds()
    }
    catch (err) {
        console.error("Error fetching funds", err)
        clearFormInputs();
    }

    if(!funds) {
        return
    }
    const totalFundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper);
    let itemValueInCopper = convertCurrencyToCopper(itemCurrency, itemValue)

    if (itemValueInCopper > totalFundsInCopper) {
        alert("The blacksmith can't afford to add this item!");
        // Ensure form inputs are cleared even if the item cannot be added
        clearFormInputs();
        return;
    }

    const docRef = await db.collection('blacksmith').add({
        Name: itemName,
        Value: itemValue,
        Currency: itemCurrency,
        Rarity: itemRarity,
        Requirements: itemRequirements,
        StockValue: itemStockValue,
        Modifier: itemModifier,
        Description: itemDescription
    })

    console.log("Doc written with ID: " , docRef.id)

    const newTotalFundsInCopper = totalFundsInCopper - itemValueInCopper
    
    await db.collection('merchant').doc('blacksmith').update(convertFromCopper(newTotalFundsInCopper))

    fetchItems('blacksmithshop')
    fetchFunds()
    clearFormInputs()
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

