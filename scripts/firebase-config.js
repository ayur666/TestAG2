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

    return (gold * 1000) + (silver * 100) + copper
}

const convertCurrencyToCopper = (curr, amount) => {
    checkPositiveNumbers(amount)
    if(!["gold","silver","copper"].includes(curr.toLowerCase())) {
        throw new ArgumentError("Currency must be gold/silver/copper")

    }

    switch(curr.toLowerCase()){
        case "gold": return amount * 10_000
        case "silver": return amount * 100
        case "copper": return amount
    }
    
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

// Function to buy an item (check stock and update or delete item based on stock)
async function buyItem(itemId, shop, itemPrice, itemCurrency) {
    let itemRef = await db.collection(shop).doc(itemId).get;
    let funds;

    try {
        itemRef = await db.collection(shop).doc(itemId).get()
    }
    catch (err) {
        console.log("Error getting item document: ", err)
    }

    const currentStock = parseInt(itemRef.data().StockValue)

    try {
        funds = await db.collection('merchant').doc('blacksmith').get()
    }
    catch {
        console.log("Error getting blacksmith document: ", err)
    }

    funds = funds.data()

    const fundsInCopper = convertToCopper(funds.gold, funds.silver, funds.copper)
    const itemPriceInCopper = convertCurrencyToCopper(itemCurrency, itemPrice)
    const newFunds = convertFromCopper(fundsInCopper + itemPriceInCopper)

    if(currentStock > 1){
        await db.collection(shop).doc(itemId).update({ StockValue: currentStock - 1})
        await db.collection('merchant').doc('blacksmith').update(newFunds)

        console.log("Item stock and funds updated successfully")
        fetchItems(shop)
        fetchFunds()
    }
    else if (currentStock === 1){
        await db.collection(shop).doc(itemId).delete()
        await db.collection('merchant').doc('blacksmith').update(newFunds)

        console.log("Item successfully deleted and funds updated!");
        fetchItems(shop); // Refresh the item list
        fetchFunds(); // Refresh the available funds display
    }
}

// Function to add a new item to the shop
async function sellItem() {
    let gameitem;
    try {
        gameItem = new GameItem(
            document.getElementById('item-name').value,
            parseInt(document.getElementById('item-value').value),
            document.getElementById('item-currency').value,
            document.getElementById('item-rarity').value,
            document.getElementById('item-requirements').value,
            parseInt(document.getElementById('item-stockValue').value),
            document.getElementById('item-modifier').value,
            document.getElementById('item-description').value
        )
    }
    catch(err) {
        console.error("Could not create GameItem")
        return;
    }

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
    let itemValueInCopper = convertCurrencyToCopper(gameItem.currency, gameItem.value)

    if (itemValueInCopper > totalFundsInCopper) {
        alert("The blacksmith can't afford to add this item!");
        // Ensure form inputs are cleared even if the item cannot be added
        clearFormInputs();
        return;
    }

    const docRef = await db.collection('blacksmithshop').add({
        Name: gameItem.name,
        Value: gameItem.value,
        Currency: gameItem.currency,
        Rarity: gameItem.rarity,
        Requirements: gameItem.requirements,
        StockValue: gameItem.stockValue,
        Modifier: gameItem.modifier,
        Description: gameItem.description
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

