window.addEventListener('load', function () {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
            .then(() => console.log("Service Worker Registered!"))
            .catch(error => console.error("Service Worker Registration Failed!", error))
    }
})

let transactions = [];
let myChart;

fetch("/api/transaction")
    .then(response => {
        return response.json();
    })
    .then(data => {
        // SAVE DB DATA ON GLOBAL VARIABLE
        transactions = data;

        populateTotal();
        populateTable();
        populateChart();
    });

function populateTotal() {
    // REDUCE TRANSACTION AMOUNTS TO A SINGLE TOTAL VALUE
    let total = transactions.reduce((total, t) => {
        return total + parseInt(t.value);
    }, 0);

    let totalEl = document.querySelector("#total");
    totalEl.textContent = total;
}

function populateTable() {
    let tbody = document.querySelector("#tbody");
    tbody.innerHTML = "";

    transactions.forEach(transaction => {
        // CREATE AND POPULATE A TABLE ROW 
        let tr = document.createElement("tr");
        tr.innerHTML = `
    <td>${transaction.name}</td>
    <td>${transaction.value}</td>
    `;

        tbody.appendChild(tr);
    });
}

function populateChart() {
    // COPY ARRAY AND REVERSE IT
    let reversed = transactions.slice().reverse();
    let sum = 0;

    // CREATE DATE LABELS FOR CHARTS
    let labels = reversed.map(t => {
        let date = new Date(t.date);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    });

    // CREATE INCREMENTAL VALUES FOR CHART
    let data = reversed.map(t => {
        sum += parseInt(t.value);
        return sum;
    });

    // REMOVE OLD CHART IF IT EXISTS
    if (myChart) {
        myChart.destroy();
    }

    let ctx = document.getElementById("myChart").getContext("2d");

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: "Total Over Time",
                fill: true,
                backgroundColor: "#6666ff",
                data
            }]
        }
    });
}

function sendTransaction(isAdding) {
    let nameEl = document.querySelector("#t-name");
    let amountEl = document.querySelector("#t-amount");
    let errorEl = document.querySelector(".form .error");

    // VALIDATE FORM
    if (nameEl.value === "" || amountEl.value === "") {
        errorEl.textContent = "Missing Information";
        return;
    }
    else {
        errorEl.textContent = "";
    }

    // CREATE RECORD
    let transaction = {
        name: nameEl.value,
        value: amountEl.value,
        date: new Date().toISOString()
    };

    // IF SUBTRACTING FUNDS, CONVERT AMOUNT TO NEGATIVE NUMBER
    if (!isAdding) {
        transaction.value *= -1;
    }

    // ADD TO BEGINNING OF CURRENT ARRAY OF DATA 
    transactions.unshift(transaction);

    // RE-RUN LOGIC TO POPULATE UI WITH NEW RECORD 
    populateChart();
    populateTable();
    populateTotal();

    // ALSO SEND TO SERVER
    fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
        }
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.errors) {
                errorEl.textContent = "Missing Information";
            }
            else {
                // CLEAR FORM
                nameEl.value = "";
                amountEl.value = "";
            }
        })
        .catch(err => {
            // FETCH FAILED, SO SAVE IN indexedDB
            saveRecord(transaction);

            // CLEAR FORM
            nameEl.value = "";
            amountEl.value = "";
        });
}

document.querySelector("#add-btn").onclick = function () {
    sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
    sendTransaction(false);
};