let db;
let budgetVersion;

// CREATE NEW REQUEST FOR BUDGET DB.
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
    console.log('Upgrade needed in IndexDB');

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('BudgetStore', { autoIncrement: true });
    }
};

request.onerror = function (e) {
    console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
    console.log('check db invoked');

    // OPEN A TRANSACTION ON YOUR BudgetStore DB
    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    // ACCESS YOUR BudgetStore OBJECT
    const store = transaction.objectStore('BudgetStore');

    // GET ALL RECORDS FROM STORE AND SET YO A VARIABLE 
    const getAll = store.getAll();

    // IF THE REQUEST WAS SUCCESSFUL
    getAll.onsuccess = function () {
        // IF THERE ARE ITEMS IN THE STORE, WE NEED TO BULK ADD THEM WHEN WE ARE BACK ONLINE
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    // IF OUR RETURNED RESPONSE IS NOT EMPTY
                    if (res.length !== 0) {
                        // OPEN ANOTHER TRANSACTION TO BudgetStore WITH THE ABILITY TO READ AND WRITE
                        transaction = db.transaction(['BudgetStore'], 'readwrite');

                        // ASSIGN THE CURRENT STORE TO A VARIABLE
                        const currentStore = transaction.objectStore('BudgetStore');

                        // CLEAR EXISTING ENTRIES BECAUSE OUR BULK ADD WAS SUCCESSFUL
                        currentStore.clear();
                        console.log('Clearing store 🧹');
                    }
                });
        }
    };
}

request.onsuccess = function (e) {
    console.log('success');
    db = e.target.result;

    // CHECK IF APP IS ONLINE BEFORE READING FROM DB
    if (navigator.onLine) {
        console.log('Backend online! 🗄️');
        checkDatabase();
    }
};

const saveRecord = (record) => {
    console.log('Save record invoked');
    // CREATE A TRANSACTION ON THE BudgetStore DB WITH READ/WRITE ACCESS
    const transaction = db.transaction(['BudgetStore'], 'readwrite');

    // ACCESS YOUR BudgetStore OBJECT STORE
    const store = transaction.objectStore('BudgetStore');

    // ADD RECORD TO YOUR STORE WITH ADD METHOD
    store.add(record);
};

// LISTEN FOR APP COMING BACK ONLINE
window.addEventListener('online', checkDatabase);
