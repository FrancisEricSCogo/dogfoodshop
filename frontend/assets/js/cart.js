// Cart Management System
const CART_STORAGE_KEY = 'dogfoodshop_cart';

function getCart() {
    const cartStr = localStorage.getItem(CART_STORAGE_KEY);
    return cartStr ? JSON.parse(cartStr) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(productId, productName, price, quantity, stock) {
    // Check if user has complete address
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.address || user.address.trim() === '' || !user.city || user.city.trim() === '' || !user.postal_code || user.postal_code.trim() === '') {
        Swal.fire({
            title: 'Add your address',
            html: `<div style="text-align: left;">
                <p style="margin: 0; color: #475569;">You need a complete address (street, city, and postal code) before adding items to cart.</p>
            </div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Go to Profile',
            cancelButtonText: 'Maybe later',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true
        }).then((res) => {
            if (res.isConfirmed) {
                window.location.href = 'profile.html';
            }
        });
        return false;
    }

    const cart = getCart();
    const existingItem = cart.find(item => item.product_id === productId);

    if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > stock) {
            alert(`Cannot add more items. Only ${stock} available in stock.`);
            return false;
        }
        existingItem.quantity = newQuantity;
    } else {
        // Add new item to cart
        cart.push({
            product_id: productId,
            product_name: productName,
            price: parseFloat(price),
            quantity: quantity,
            stock: stock
        });
    }

    saveCart(cart);
    updateCartCount();
    return true;
}

function removeFromCart(productId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.product_id !== productId);
    saveCart(filteredCart);
    updateCartCount();
}

function updateCartItemQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.product_id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            if (quantity > item.stock) {
                alert(`Cannot add more items. Only ${item.stock} available in stock.`);
                return false;
            }
            item.quantity = quantity;
            saveCart(cart);
            updateCartCount();
        }
    }
    return true;
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartCount();
}

function updateCartCount() {
    const count = getCartCount();
    const cartBadges = document.querySelectorAll('.cart-count, #cart-count');
    cartBadges.forEach(badge => {
        // Always clear text first to prevent showing "0"
        badge.textContent = '';
        
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            // Hide badge completely when count is 0
            badge.style.display = 'none';
            badge.textContent = ''; // Ensure text is cleared
        }
    });
}

// Initialize cart count on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        updateCartCount();
    });
}

