import * as THREE from "three";

const $ = (id) => document.getElementById(id);

const homeScreen = $("home-screen");
const basketScreen = $("basket-screen");
const basketGrid = $("basket-grid");
const basket3D = $("basket-3d");
const basketTitle = $("basket-title");
const basketItems = $("basket-items");
const shopPanel = $("shop-panel");
const productGrid = $("product-grid");
const searchStatus = $("search-status");

let baskets = [];
let activeBasket = null;
let scene, camera, renderer, basketGroup;
let currentBasketColor = "#f3a8c7";
let rotation = 0;
let dragging = false;
let previousX = 0;
let previousY = 0;
let models = [];

// Sample products: real pictures are used where available.
// The 3D objects are simplified representations of the products.
const products = [
    {
        id: "lipgloss",
        name: "Pink Lip Gloss",
        category: "Makeup",
        emoji: "💄",
        color: "#e88bab",
        image: "https://images.unsplash.com/photo-1631214540242-4e4f9e9a9d44?auto=format&fit=crop&w=500&q=80"
    },
    {
        id: "handbag",
        name: "Mini Handbag",
        category: "Bags",
        emoji: "👜",
        color: "#b88762",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80"
    },
    {
        id: "book",
        name: "Mystery Novel",
        category: "Books",
        emoji: "📚",
        color: "#8d83c7",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80"
    },
    {
        id: "album",
        name: "Music Album",
        category: "Albums",
        emoji: "🎵",
        color: "#9c8ed1",
        image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=500&q=80"
    },
    {
        id: "shirt",
        name: "Classic T-Shirt",
        category: "Clothing",
        emoji: "👕",
        color: "#a4b5e8",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80"
    },
    {
        id: "stationery",
        name: "Colourful Stationery",
        category: "Stationery",
        emoji: "✏️",
        color: "#f0bd68",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=80"
    }
];

// HOME SCREEN

function renderBaskets() {
    basketGrid.innerHTML = "";

    baskets.forEach((basket) => {
        const card = document.createElement("button");
        card.className = "basket-card";

        const preview = document.createElement("div");
        preview.className = "basket-preview";
        preview.textContent = "🧺";
        preview.style.backgroundColor = basket.color + "30";

        const title = document.createElement("h3");
        title.textContent = basket.name;

        const count = document.createElement("p");
        count.textContent = `${basket.items.length} products`;

        card.append(preview, title, count);

        card.addEventListener("click", () => openBasket(basket.id));

        basketGrid.appendChild(card);
    });
}

$("create-basket").addEventListener("click", () => {
    const name = prompt("What would you like to call your basket?");

    if (!name || !name.trim()) return;

    const basket = {
        id: crypto.randomUUID(),
        name: name.trim(),
        color: "#f3a8c7",
        items: []
    };

    baskets.push(basket);
    renderBaskets();
    openBasket(basket.id);
});

$("back-button").addEventListener("click", () => {
    shopPanel.classList.add("hidden");
    basketScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    destroy3D();
    renderBaskets();
});

function openBasket(id) {
    activeBasket = baskets.find((basket) => basket.id === id);

    if (!activeBasket) return;

    homeScreen.classList.add("hidden");
    basketScreen.classList.remove("hidden");

    basketTitle.textContent = activeBasket.name;

    currentBasketColor = activeBasket.color;
    $("basket-color").value = currentBasketColor;

    create3D();
    renderBasketItems();
}

// THREE.JS: 3D BASKET

function create3D() {
    destroy3D();

    scene = new THREE.Scene();
    scene.background = new THREE.Color("#fff5f9");

    camera = new THREE.PerspectiveCamera(
        45,
        basket3D.clientWidth / basket3D.clientHeight,
        0.1,
        100
    );

    camera.position.set(0, 3.8, 8);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
        basket3D.clientWidth,
        basket3D.clientHeight
    );

    basket3D.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight("#ffffff", "#b8a2af", 2));

    const light = new THREE.DirectionalLight("#ffffff", 3);
    light.position.set(4, 7, 5);
    scene.add(light);

    basketGroup = new THREE.Group();
    scene.add(basketGroup);

    buildBasket();

    activeBasket.items.forEach((item, index) => {
        addProductModel(item, index);
    });

    rotation = 0;

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    animate();
}

function buildBasket() {
    const material = new THREE.MeshStandardMaterial({
        color: currentBasketColor,
        roughness: 0.65
    });

    // Basket base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.55, 1.25, 0.25, 48, 1, false),
        material
    );

    base.position.y = 0.35;
    basketGroup.add(base);

    // Woven-looking horizontal rings
    for (let y = 0.5; y <= 1.7; y += 0.28) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.48 - (y - 0.5) * 0.12, 0.075, 8, 48),
            material
        );

        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        basketGroup.add(ring);
    }

    // Vertical woven strips
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;

        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 1.2, 0.09),
            material
        );

        strip.position.set(
            Math.cos(angle) * 1.38,
            1.08,
            Math.sin(angle) * 1.38
        );

        strip.rotation.y = -angle;
        basketGroup.add(strip);
    }

    // Basket handles
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: currentBasketColor,
        roughness: 0.65
    });

    const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.08, 12, 40, Math.PI),
        handleMaterial
    );

    handle.position.y = 1.75;
    handle.scale.set(1.1, 1, 1);
    basketGroup.add(handle);
}

function addProductModel(item, index) {
    const color = item.color || "#e8a9c7";

    let geometry;

    switch (item.category) {
        case "Makeup":
            // Simplified lip gloss tube
            geometry = new THREE.CylinderGeometry(
                0.16, 0.19, 0.85, 20
            );
            break;

        case "Bags":
            geometry = new THREE.BoxGeometry(0.8, 0.65, 0.35);
            break;

        case "Books":
        case "Stationery":
            geometry = new THREE.BoxGeometry(0.75, 0.95, 0.14);
            break;

        case "Albums":
            geometry = new THREE.BoxGeometry(0.85, 0.85, 0.12);
            break;

        default:
            geometry = new THREE.BoxGeometry(0.65, 0.65, 0.35);
    }

    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.05
    });

    const model = new THREE.Mesh(geometry, material);

    // Place each item in a slightly different position.
    const angle = index * 2.4;
    const radius = 0.35 + (index % 3) * 0.25;

    model.position.set(
        Math.cos(angle) * radius,
        1.15 + (index % 2) * 0.2,
        Math.sin(angle) * radius
    );

    model.rotation.y = angle;

    basketGroup.add(model);
    models.push(model);
}

function animate() {
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function destroy3D() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);

    if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
    }

    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();

            if (object.material) {
                const materials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];

                materials.forEach((material) => material.dispose());
            }
        });
    }

    renderer = null;
    scene = null;
    camera = null;
    basketGroup = null;
    models = [];
}

// ROTATE BASKET

function onPointerDown(event) {
    dragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
    if (!dragging || !basketGroup) return;

    const deltaX = event.clientX - previousX;
    const deltaY = event.clientY - previousY;

    rotation += deltaX * 0.01;
    basketGroup.rotation.y = rotation;

    basketGroup.rotation.x = Math.max(
        -0.3,
        Math.min(0.3, basketGroup.rotation.x + deltaY * 0.003)
    );

    previousX = event.clientX;
    previousY = event.clientY;
}

function onPointerUp() {
    dragging = false;
}

$("rotate-button").addEventListener("click", () => {
    if (!basketGroup) return;

    rotation += Math.PI / 4;
    basketGroup.rotation.y = rotation;
});

// CHANGE BASKET COLOUR

$("basket-color").addEventListener("input", (event) => {
    currentBasketColor = event.target.value;

    if (!activeBasket) return;

    activeBasket.color = currentBasketColor;

    if (basketGroup) {
        basketGroup.traverse((object) => {
            if (object.isMesh && object.material) {
                // Update only the basket, not its products.
                if (object.userData.isBasketPart) {
                    object.material.color.set(currentBasketColor);
                }
            }
        });

        // Rebuild the basket to apply the new colour.
        const items = [...activeBasket.items];
        create3D();
    }
});

// SHOP PANEL

$("shop-button").addEventListener("click", () => {
    shopPanel.classList.remove("hidden");
    renderProducts(products);
});

$("close-shop").addEventListener("click", () => {
    shopPanel.classList.add("hidden");
});

function renderProducts(list) {
    productGrid.innerHTML = "";

    if (!list.length) {
        searchStatus.textContent =
            "No matching sample products. Try another search.";

        return;
    }

    searchStatus.textContent =
        `${list.length} sample product(s) found.`;

    list.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageBox = document.createElement("div");
        imageBox.className = "product-image";

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;
        img.loading = "lazy";

        img.onerror = () => {
            imageBox.innerHTML = "";
            const emoji = document.createElement("span");
            emoji.className = "product-emoji";
            emoji.textContent = product.emoji;
            imageBox.appendChild(emoji);
        };

        imageBox.appendChild(img);

        const info = document.createElement("div");
        info.className = "product-info";

        const title = document.createElement("h3");
        title.textContent = product.name;

        const category = document.createElement("p");
        category.textContent = product.category;

        const actions = document.createElement("div");
        actions.className = "product-actions";

        const addButton = document.createElement("button");
        addButton.textContent = "＋ Add to basket";

        addButton.addEventListener("click", () => {
            addToBasket(product);
        });

        // Native HTML drag-and-drop for desktop.
        card.draggable = true;

        card.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData(
                "text/plain",
                product.id
            );
        });

        actions.appendChild(addButton);
        info.append(title, category, actions);
        card.append(imageBox, info);
        productGrid.appendChild(card);
    });
}

$("search-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const query = $("search-input").value
        .trim()
        .toLowerCase();

    if (!query) {
        renderProducts(products);
        return;
    }

    const results = products.filter((product) => {
        return (
            product.name.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            product.id.toLowerCase().includes(query)
        );
    });

    renderProducts(results);
});

$("categories").addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    const category = button.dataset.query;

    $("search-input").value = category;

    renderProducts(
        products.filter(
            (product) => product.category === category
        )
    );
});

// ADD PRODUCTS

function addToBasket(product) {
    if (!activeBasket) return;

    activeBasket.items.push({ ...product });

    addProductModel(product, activeBasket.items.length - 1);
    renderBasketItems();
    renderBaskets();
}

function renderBasketItems() {
    basketItems.innerHTML = "";

    activeBasket.items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "basket-item";

        const name = document.createElement("span");
        name.textContent = `${item.emoji} ${item.name}`;

        const remove = document.createElement("button");
        remove.textContent = "Remove";

        remove.addEventListener("click", () => {
            activeBasket.items.splice(index, 1);
            create3D();
            renderBasketItems();
            renderBaskets();
        });

        row.append(name, remove);
        basketItems.appendChild(row);
    });
}

// RESIZE 3D VIEW

window.addEventListener("resize", () => {
    if (!renderer || !camera) return;

    const width = basket3D.clientWidth;
    const height = basket3D.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

// INITIAL SCREEN

renderBaskets();
