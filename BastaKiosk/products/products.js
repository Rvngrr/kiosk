// Default image for products
const DEFAULT_IMAGE = "../uploads/image-gallery.png";

// DOM elements
const tbody = document.getElementById("productTableBody");
const productModal = new bootstrap.Modal(document.getElementById("productModal"));
const productForm = document.getElementById("productForm");
const imageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const categorySelect = document.getElementById("categoryFilter");
const categoryDatalist = document.getElementById("categoryList");
const searchInput = document.getElementById("searchInput");

// Delete modal elements
const deleteModalElement = document.getElementById("deleteModal");
const deleteModal = new bootstrap.Modal(deleteModalElement);
const deleteProductName = document.getElementById("deleteProductName");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let editMode = false;
let editId = null;
let productToDelete = null;
let products = []; // all products loaded
let sortConfig = { key: "id", ascending: true };

// Load products from database
async function loadProducts() {
    tbody.innerHTML = "";
    try {
        const res = await fetch('get_products.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        products = data;

        populateCategoryFilter();
        populateCategoryDatalist();
        renderProducts();

    } catch (err) {
        console.error("Error fetching products:", err);
        if (err.message.includes('<?php')) {
            console.error('PHP source returned. Make sure to run via localhost server.');
        }
    }
}

// Render products in table applying search/filter/sort
function renderProducts() {
    tbody.innerHTML = "";

    let filtered = products;

    // Filter by search
    const search = searchInput.value.toLowerCase();
    if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    }

    // Filter by category
    const category = categorySelect.value;
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    // Sort
    filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.ascending ? -1 : 1;
        if (valA > valB) return sortConfig.ascending ? 1 : -1;
        return 0;
    });

    // Populate table
    filtered.forEach(product => {
        const tr = document.createElement("tr");
        const imgSrc = product.image ? `../${product.image}` : DEFAULT_IMAGE;

        tr.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${imgSrc}" style="width:60px;height:60px;object-fit:cover;border-radius:5px;"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₱${product.price}</td>
            <td><button class="btn btn-sm btn-success editBtn">Edit</button></td>
            <td><button class="btn btn-sm btn-danger deleteBtn">Delete</button></td>
        `;
        tbody.appendChild(tr);

        tr.querySelector(".editBtn").addEventListener("click", () => openEditModal(product));
        tr.querySelector(".deleteBtn").addEventListener("click", () => openDeleteModal(product));
    });
}

// Populate category filter select
function populateCategoryFilter() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    categorySelect.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Populate category datalist for modal input
function populateCategoryDatalist() {
    const categories = [...new Set(products.map(p => p.category))].sort();
    categoryDatalist.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        categoryDatalist.appendChild(option);
    });
}

// Open Add Product Modal
document.getElementById("addProductBtn").addEventListener("click", () => {
    editMode = false;
    editId = null;
    productForm.reset();
    imagePreview.src = DEFAULT_IMAGE;
    document.getElementById("productModalLabel").textContent = "Add Product";
    productModal.show();
});

// Open Edit Product Modal
function openEditModal(product) {
    editMode = true;
    editId = product.id;
    document.getElementById("productModalLabel").textContent = "Edit Product";
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
    imagePreview.src = product.image ? `../${product.image}` : DEFAULT_IMAGE;
    productModal.show();
}

// Image preview
imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = e => imagePreview.src = e.target.result;
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = DEFAULT_IMAGE;
    }
});

// Open Delete Modal
function openDeleteModal(product) {
    productToDelete = product.id;
    deleteProductName.textContent = product.name;
    deleteModal.show();
}

// Confirm delete
confirmDeleteBtn.addEventListener("click", async () => {
    if(productToDelete){
        const formData = new URLSearchParams({id: productToDelete});
        const res = await fetch('delete_product.php', { method: 'POST', body: formData });
        const result = await res.json();
        if(result.success){
            deleteModal.hide();
            await loadProducts();
        } else {
            alert("Delete failed: " + (result.error || "Unknown error"));
        }
    }
});

// Save product (Add/Edit)
productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    if(imageInput.files[0]) formData.append('image', imageInput.files[0]);
    if(editMode) formData.append('id', editId);

    const url = editMode ? 'edit_product.php' : 'add_product.php';
    const res = await fetch(url, { method: 'POST', body: formData });
    const result = await res.json();

    if(result.success){
        productModal.hide();
        await loadProducts();
    } else {
        alert("Error saving product: " + (result.error || "Unknown error"));
    }
});

// Search & Filter events
searchInput.addEventListener("input", renderProducts);
categorySelect.addEventListener("change", renderProducts);

// Table header sorting
document.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
        const key = th.id.replace("th", "").toLowerCase();
        if(sortConfig.key === key){
            sortConfig.ascending = !sortConfig.ascending;
        } else {
            sortConfig.key = key;
            sortConfig.ascending = true;
        }
        updateSortIndicators();
        renderProducts();
    });
});

// Update sort indicators
function updateSortIndicators() {
    document.querySelectorAll("th.sortable").forEach(th => {
        const span = th.querySelector(".sort-indicator");
        const key = th.id.replace("th", "").toLowerCase();
        if(sortConfig.key === key){
            span.textContent = sortConfig.ascending ? "▲" : "▼";
        } else {
            span.textContent = "";
        }
    });
}

// Initial load
document.addEventListener("DOMContentLoaded", loadProducts);
