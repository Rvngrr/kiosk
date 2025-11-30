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

    const leftSidebar = document.getElementById("categorySidebar");
    const rightSidebar = document.getElementById("cartSidebar");
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
        categoryList.innerHTML = `<li class="category-item active" data-cat="">All</li>`; // no dot
        categories.forEach(cat => {
            const li = document.createElement("li");
            li.classList.add("category-item");
            li.textContent = cat; // just the name, no dot
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
    // Render products based on search and category
    function renderProducts() {
        const search = searchInput.value.toLowerCase();
        let filtered = products;

        if (selectedCategory) {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        if (search) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
        }

        productGrid.innerHTML = "";

        filtered.forEach(product => {
            const imgSrc = product.image ? `../uploads/${product.image}` : "../uploads/image-gallery.png";
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-3";
            col.innerHTML = `
                <div class="card h-100 product-card" data-id="${product.id}">
                    <img src="${imgSrc}" class="card-img-top" style="height:120px; object-fit:cover;">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title mb-1">${product.name}</h6>
                        <p class="mb-1 text-muted">${product.category}</p>
                        <strong class="mt-auto">₱${product.price}</strong>
                        <button class="btn btn-primary btn-sm mt-2 add-to-cart">Add</button>
                    </div>
                </div>
            `;
            productGrid.appendChild(col);

            const card = col.querySelector(".product-card");

            // Make the entire card clickable
            card.addEventListener("click", (e) => {
                // Prevent double triggering if "Add" button is clicked
                if (!e.target.classList.contains("add-to-cart")) {
                    addToCart(product);
                }
            });

            // Add click listener for the Add button (optional, keeps the button working too)
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
        cartItemsContainer.innerHTML = `
            <div class="cart-header">
                <div class="item-name">Item</div>
                <div class="qty-container">Qty</div>
                <div class="item-amount">Amount</div>
                <div class="delete-placeholder"></div>
            </div>
        `;

        let total = 0;
        Object.values(cart).forEach(item => {
            const amount = item.price * item.qty;
            total += amount;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="qty-container">
                    <button class="qty-btn" data-action="minus">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-action="plus">+</button>
                </div>
                <div class="item-amount">₱${amount.toFixed(2)}</div>
                <button class="delete-item">×</button>
            `;
            cartItemsContainer.appendChild(div);

            // Qty buttons
            div.querySelectorAll(".qty-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (btn.dataset.action === "plus") item.qty++;
                    else if (btn.dataset.action === "minus") item.qty = Math.max(0, item.qty - 1);

                    if (item.qty === 0) delete cart[item.id];
                    renderCart();
                });
            });

            // Delete button
            div.querySelector(".delete-item").addEventListener("click", () => {
                delete cart[item.id];
                renderCart();
            });
        });

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
    checkoutBtn.addEventListener("click", () => {
        alert("Checkout not implemented yet!");
    });

    // ------------------- Sidebar Resizing -------------------
    function makeResizable(sidebar, resizer, isLeft = true) {
        let startX, startWidth;

        const onMouseMove = e => {
            const dx = isLeft ? e.clientX - startX : startWidth - (e.clientX - startX);
            sidebar.style.width = `${Math.min(Math.max(startWidth + dx, 150), 400)}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        resizer.addEventListener("mousedown", e => {
            e.preventDefault();
            startX = e.clientX;
            startWidth = sidebar.getBoundingClientRect().width;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    makeResizable(leftSidebar, leftResizer, true);
    makeResizable(rightSidebar, rightResizer, false);

    // ------------------- Initial Load -------------------
    document.addEventListener("DOMContentLoaded", loadProducts);
