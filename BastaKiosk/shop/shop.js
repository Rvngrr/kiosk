// shop.js

// DOM elements
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const categoryList = document.getElementById("categoryList");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalSpan = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const leftSidebar = document.getElementById("leftSidebar");
const rightSidebar = document.getElementById("rightSidebar");
const leftResizer = document.getElementById("leftResizer");
const rightResizer = document.getElementById("rightResizer");

let products = [];
let cart = {};
let selectedCategory = "";

// ------------------- Load Products -------------------
async function loadProducts() {
    try {
        const res = await fetch("get_products.php");
        if (!res.ok) throw new Error("Failed to fetch products");
        products = await res.json();
        populateCategories();
        renderProducts();
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

// ------------------- Populate Categories -------------------
function populateCategories() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    categoryList.innerHTML = `<li class="category-item active" data-cat="">All</li>`;
    categories.forEach(cat => {
        const li = document.createElement("li");
        li.classList.add("category-item");
        li.textContent = cat;
        li.dataset.cat = cat;
        categoryList.appendChild(li);
    });

    document.querySelectorAll(".category-item").forEach(li => {
        li.addEventListener("click", () => {
            document.querySelectorAll(".category-item").forEach(el => el.classList.remove("active"));
            li.classList.add("active");
            selectedCategory = li.dataset.cat;
            renderProducts();
        });
    });
}

// ------------------- Render Products -------------------
function renderProducts() {
    const search = searchInput.value.toLowerCase();
    let filtered = products;

    if (selectedCategory) filtered = filtered.filter(p => p.category === selectedCategory);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));

    productGrid.innerHTML = "";

    filtered.forEach(product => {
        const imgSrc = product.image ? `../uploads/${product.image}` : "../uploads/image-gallery.png";
        const col = document.createElement("div");
        col.className = "col-6 col-md-3 col-lg-2 col-xl-2";
        col.innerHTML = `
            <div class="card h-100 product-card" data-id="${product.id}">
                <img src="${imgSrc}" class="card-img-top" style="height:120px; object-fit:cover;">
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title mb-1">${product.name}</h6>
                    <p class="mb-1 text-muted">${product.category}</p>
                    <strong class="mt-auto">₱${parseFloat(product.price).toFixed(2)}</strong>
                    <button class="btn btn-primary btn-sm mt-2 add-to-cart">Add</button>
                </div>
            </div>
        `;
        productGrid.appendChild(col);

        const card = col.querySelector(".product-card");
        card.addEventListener("click", (e) => {
            if (!e.target.classList.contains("add-to-cart")) addToCart(product);
        });
        col.querySelector(".add-to-cart").addEventListener("click", () => addToCart(product));
    });
}

// ------------------- Cart Functions -------------------
function addToCart(product) {
    if (cart[product.id]) cart[product.id].qty++;
    else cart[product.id] = { ...product, qty: 1 };
    renderCart();
}

function renderCart() {
    let total = 0;
    const table = document.createElement("table");
    table.className = "cart-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th class="item-name">Item</th>
                <th class="qty-container">Qty</th>
                <th class="item-amount">Amount</th>
                <th class="delete-placeholder"></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    Object.values(cart).forEach(item => {
        const price = parseFloat(item.price);
        const amount = price * item.qty;
        total += amount;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="item-name">${item.name}</td>
            <td class="qty-container">
                <button class="qty-btn" data-action="minus">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" data-action="plus">+</button>
            </td>
            <td class="item-amount">₱${amount.toFixed(2)}</td>
            <td>
                <button class="delete-item">×</button>
            </td>
        `;

        tr.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.dataset.action === "plus") item.qty++;
                else if (btn.dataset.action === "minus") item.qty = Math.max(0, item.qty - 1);
                if (item.qty === 0) delete cart[item.id];
                renderCart();
            });
        });

        tr.querySelector(".delete-item").addEventListener("click", () => {
            delete cart[item.id];
            renderCart();
        });

        tbody.appendChild(tr);
    });

    cartItemsContainer.innerHTML = "";
    cartItemsContainer.appendChild(table);
    cartTotalSpan.textContent = total.toFixed(2);
}

// ------------------- Event Listeners -------------------
searchInput.addEventListener("input", renderProducts);
clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderProducts();
});
clearCartBtn.addEventListener("click", () => {
    cart = {};
    renderCart();
});

// ------------------- Checkout -------------------
checkoutBtn.addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
        alert("Cart is empty!");
        return;
    }

    const customerModalEl = document.getElementById('customerModal');
    const customerModal = new bootstrap.Modal(customerModalEl);
    customerModal.show();

    const confirmBtn = document.getElementById("confirmCheckoutBtn");
    confirmBtn.onclick = () => {
        const customerName = document.getElementById("customerName").value.trim();
        if (!customerName) {
            alert("Please enter customer name!");
            return;
        }

        customerModal.hide();

        customerModalEl.addEventListener('hidden.bs.modal', function handler() {
            customerModalEl.removeEventListener('hidden.bs.modal', handler);

            const tbody = document.querySelector("#paymentCartTable tbody");
            tbody.innerHTML = "";
            let total = 0;

            Object.values(cart).forEach(item => {
                const price = parseFloat(item.price);
                const amount = price * item.qty;
                total += amount;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>₱${price.toFixed(2)}</td>
                    <td>₱${amount.toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });

            // Display total amount (read-only)
            document.getElementById("totalDisplay").textContent = total.toFixed(2);

            // Payment received input (editable), pre-filled with total
            const paymentInput = document.getElementById("paymentReceived");
            paymentInput.value = total.toFixed(2);
            paymentInput.removeAttribute("readonly");

            const paymentModalEl = document.getElementById('paymentModal');
            const paymentModal = new bootstrap.Modal(paymentModalEl);
            paymentModal.show();

            const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
            confirmPaymentBtn.onclick = () => {
                const paidAmount = parseFloat(paymentInput.value);
                if (isNaN(paidAmount) || paidAmount < total) {
                    alert("Payment amount is invalid or less than total!");
                    return;
                }

                saveOrderToDB(customerName, cart, total, paidAmount);

                cart = {};
                renderCart();
                paymentModal.hide();
                document.getElementById("customerName").value = "";
            };
        });
    };
});


// ------------------- Save Order to Database -------------------
function saveOrderToDB(customerName, cart, total, paidAmount) {
    const orderData = {
        customer: customerName,
        items: Object.values(cart).map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            qty: item.qty
        })),
        total: total,
        paid: paidAmount
    };

    fetch('save_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(async res => {
        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${text}`);
        }

        if (!contentType.includes('application/json')) {
            console.error('Non-JSON response from save_order.php:', text);
            if (text.includes('<?php') || text.trim().startsWith('<')) {
                console.error('It looks like PHP/HTML was returned. Make sure you are calling the script via a PHP-enabled server (http://localhost/...), not a static server like Live Server.');
            }
            throw new Error('Expected JSON but received non-JSON response. See console for details.');
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON response from save_order.php:', text);
            throw e;
        }
    })
    .then(data => {
        if (data.success) alert('Order saved successfully!');
        else alert('Failed to save order: ' + (data.error || 'Unknown error'));
    })
    .catch(err => {
        console.error('Error saving order:', err);
        alert('Error saving order. Check console.');
    });
}

// ------------------- Sidebar Resizing -------------------
document.addEventListener("DOMContentLoaded", () => {
    let isResizingLeft = false;
    let isResizingRight = false;

    leftResizer.addEventListener("mousedown", () => {
        isResizingLeft = true;
        document.body.style.userSelect = "none";
    });
    rightResizer.addEventListener("mousedown", () => {
        isResizingRight = true;
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (isResizingLeft) {
            const newWidth = e.clientX;
            if (newWidth > 120 && newWidth < 400) leftSidebar.style.width = newWidth + "px";
        }
        if (isResizingRight) {
            const screenWidth = window.innerWidth;
            const newWidth = screenWidth - e.clientX;
            if (newWidth > 200 && newWidth < 450) rightSidebar.style.width = newWidth + "px";
        }
    });

    document.addEventListener("mouseup", () => {
        isResizingLeft = false;
        isResizingRight = false;
        document.body.style.userSelect = "auto";
    });
});

// ------------------- Initial Load -------------------
document.addEventListener("DOMContentLoaded", loadProducts);
