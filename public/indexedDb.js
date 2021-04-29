const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
    let db = target.result;
    db.createObjectStore("budget", { autoIncrement: true });
};

function checkDatabase() {
    console.log('check db invoked');

    // Open a transaction on your BudgetStore db
    let transaction = db.transaction(
        ['Budget'], 'readwrite');

    // access your BudgetStore object
    const store = transaction.objectStore('Budget');

    // Get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        // If there are items in the store, we need to bulk add them when we are back online
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
                    // If our returned response is not empty
                    if (res.length !== 0) {
                        // Open another transaction to BudgetStore with the ability to read and write
                        transaction = db.transaction(['Budget'], 'readwrite');

                        // Assign the current store to a variable
                        const currentStore = transaction.objectStore('Budget');

                        // Clear existing entries because our bulk add was successful
                        currentStore.clear();
                        console.log('Clearing store 🧹');
                    }
                });
        }
    };
}

request.onsuccess = ({ target }) => {
    db = target.result;
    console.log("success");
    if (navigator.onLine) {
        console.log('Backend Online!🗄️');
        checkDatabase();
    }
};

const saveRecord = (record) => {
    console.log('Save record invoked');
    // Create a transaction on the BudgetStore db with readwrite access
    const transaction = db.transaction(['Budget'], 'readwrite');

    // Access your BudgetStore object store
    const store = transaction.objectStore('Budget');

    // Add record to your store with add method.
    store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
