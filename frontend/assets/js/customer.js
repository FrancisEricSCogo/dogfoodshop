async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products/get_products.php`);
        const data = await response.json();
        
        if (data.success) {
            const grid = document.getElementById('products-grid');
            if (data.products.length === 0) {
                grid.innerHTML = '<p>No products available</p>';
                return;
            }
            
            grid.innerHTML = data.products.map(product => `
                <div class="product-card">
                    <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200'">
                    <h3>${product.name}</h3>
                    <p>${product.description || 'No description'}</p>
                    <p class="price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <p>Stock: ${product.stock}</p>
                    <p>Supplier: ${product.supplier_name}</p>
                    <div class="quantity-selector">
                        <label>Quantity: </label>
                        <input type="number" id="qty_${product.id}" min="1" max="${product.stock}" value="1">
                    </div>
                    <button onclick="buyProduct(${product.id})" class="btn btn-primary" ${product.stock === 0 ? 'disabled' : ''}>Buy Now</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-grid').innerHTML = '<p>Error loading products</p>';
    }
}

async function addToCart(productId) {
    // Check if user has complete address first
    const user = getUser();
    if (!user || !user.address || user.address.trim() === '' || !user.city || user.city.trim() === '' || !user.postal_code || user.postal_code.trim() === '') {
        // SweetAlert prompt for missing address
        const result = await Swal.fire({
            title: 'Add your address',
            html: `<div style="text-align: left;">
                <p style="margin: 0; color: #475569;">You need to add a complete address (street, city, and postal code) before adding items to cart.</p>
            </div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Go to Profile',
            cancelButtonText: 'Maybe later',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true
        });
        if (result.isConfirmed) {
            window.location.href = 'profile.html';
        }
        return;
    }
    
    // Get product details from the page
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    
    let productName = '';
    let price = 0;
    let stock = 0;
    let quantity = 1;
    
    // Try to get product info from the card
    if (productCard) {
        const nameEl = productCard.querySelector('.product-title, h3');
        const priceEl = productCard.querySelector('.product-price');
        const stockEl = productCard.querySelector('.product-stock');
        const qtyInput = document.getElementById(`qty_${productId}`);
        
        productName = nameEl ? nameEl.textContent.trim() : 'Product';
        price = priceEl ? parseFloat(priceEl.textContent.replace(/[₱$,]/g, '')) : 0;
        stock = stockEl ? parseInt(stockEl.textContent.match(/\d+/)?.[0] || 0) : 0;
        quantity = qtyInput ? parseInt(qtyInput.value) || 0 : 0;
        
        // Validate quantity
        if (quantity < 1) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Quantity',
                    text: 'Quantity must be at least 1.',
                    confirmButtonColor: '#4f46e5'
                });
            } else {
                alert('Quantity must be at least 1.');
            }
            if (qtyInput) qtyInput.value = 1;
            if (addButton) {
                addButton.disabled = false;
                addButton.innerHTML = originalText;
            }
            return;
        }
        
        if (quantity > stock) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Insufficient Stock',
                    html: `Only <strong>${stock}</strong> item(s) available in stock. Please reduce the quantity.`,
                    confirmButtonColor: '#4f46e5'
                });
            } else {
                alert(`Only ${stock} item(s) available in stock.`);
            }
            if (qtyInput) qtyInput.value = stock;
            if (addButton) {
                addButton.disabled = false;
                addButton.innerHTML = originalText;
            }
            return;
        }
    } else {
        // Fallback: fetch product details
        try {
                const API_BASE = 'https://dogfoodshop.ccs4thyear.com/api';
        const response = await fetch(`${API_BASE}/products/get_product.php?id=${productId}`);
            const data = await response.json();
            if (data.success && data.product) {
                productName = data.product.name;
                price = parseFloat(data.product.price);
                stock = parseInt(data.product.stock);
                const qtyInput = document.getElementById(`qty_${productId}`);
                quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            } else {
                alert('Product not found');
                return;
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Failed to get product details');
            return;
        }
    }
    
    const addButton = event?.target || document.querySelector(`button[onclick*="addToCart(${productId})"]`);
    const originalText = addButton ? addButton.innerHTML : '';
    
    // Show loading state
    if (addButton) {
        addButton.disabled = true;
        addButton.innerHTML = '<span class="loading-spinner"></span>Adding...';
    }
    
    // Add to cart using localStorage
    const cart = JSON.parse(localStorage.getItem('dogfoodshop_cart') || '[]');
    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > stock) {
            alert(`Cannot add more items. Only ${stock} available in stock.`);
            if (addButton) {
                addButton.disabled = false;
                addButton.innerHTML = originalText;
            }
            return;
        }
        existingItem.quantity = newQuantity;
    } else {
        cart.push({
            product_id: productId,
            product_name: productName,
            price: price,
            quantity: quantity,
            stock: stock
        });
    }
    
    localStorage.setItem('dogfoodshop_cart', JSON.stringify(cart));
    
    // Update cart count if function exists
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    } else {
        // Fallback update
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        const cartBadges = document.querySelectorAll('.cart-count, #cart-count');
        cartBadges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }
    
    if (addButton) {
        addButton.innerHTML = '<span class="loading-spinner"></span>Added!';
        setTimeout(() => {
            addButton.disabled = false;
            addButton.innerHTML = originalText;
        }, 1000);
    }
    
    // Show success notification
    showCartNotification('Item added to cart!');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('dogfoodshop_cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadges = document.querySelectorAll('.cart-count, #cart-count');
    cartBadges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

function showCartNotification(message) {
    // Remove existing notification if any
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();
    
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add animation styles if not present
    if (!document.getElementById('cart-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders/get_orders.php`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            const list = document.getElementById('orders-list');
            if (data.orders.length === 0) {
                list.innerHTML = '<p>No orders yet</p>';
                return;
            }
            
            list.innerHTML = data.orders.map(order => `
                <div class="order-card">
                    <h3>Order #${order.id} - ${order.product_name}</h3>
                    <p>Quantity: ${order.quantity}</p>
                    <p>Price: ₱${parseFloat(order.price).toFixed(2)}</p>
                    <p>Total: ₱${(parseFloat(order.price) * order.quantity).toFixed(2)}</p>
                    <p>Status: <span class="status status-${order.status}">${order.status}</span></p>
                    <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                    <div class="order-actions">
                        ${order.status === 'pending' ? `<button onclick="cancelOrder(${order.id})" class="btn btn-danger">Cancel</button>` : ''}
                        ${order.status === 'delivered' ? `<button onclick="receiveOrder(${order.id})" class="btn btn-success">Receive</button>` : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = '<p>Error loading orders</p>';
    }
}

async function cancelOrder(orderId) {
    // Get order details for confirmation
    let orderNumber = `Order #${orderId}`;
    try {
        const orderResponse = await fetch(`${API_BASE}/orders/get_order.php?id=${orderId}`, {
            headers: getAuthHeaders()
        });
        const orderData = await orderResponse.json();
        if (orderData.success && orderData.order) {
            orderNumber = orderData.order.order_number || `Order #${orderId}`;
        }
    } catch (error) {
        console.error('Error fetching order name:', error);
    }
    
    // Show confirmation dialog with SweetAlert
    const result = await Swal.fire({
        title: 'Cancel Order?',
        html: `Are you sure you want to cancel <strong>${orderNumber}</strong>?<br><br>This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'Keep Order',
        reverseButtons: true
    });
    
    if (!result.isConfirmed) {
        return;
    }
    
    const button = event?.target;
    const originalText = button ? button.innerHTML : '';
    
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span>Cancelling...';
    }
    
    // Show loading alert
    Swal.fire({
        title: 'Cancelling...',
        text: 'Please wait',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(`${API_BASE}/orders/update_order_status.php`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ order_id: orderId, status: 'cancelled' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            Swal.close(); // Close loading alert
            Swal.fire({
                icon: 'success',
                title: 'Order Cancelled!',
                text: `${orderNumber} has been cancelled successfully.`,
                confirmButtonColor: '#667eea',
                timer: 2000,
                showConfirmButton: true
            });
            if (button) button.innerHTML = originalText;
            if (typeof loadOrders === 'function') {
                loadOrders();
            }
        } else {
            Swal.close(); // Close loading alert
            if (button) {
                button.disabled = false;
                button.innerHTML = originalText;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'Failed to cancel order',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        Swal.close(); // Close loading alert
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to cancel order. Please try again.',
            confirmButtonColor: '#667eea'
        });
    }
}

async function receiveOrder(orderId) {
    const button = event?.target;
    const originalText = button ? button.innerHTML : '';
    
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span>Processing...';
    }
    
    try {
        const response = await fetch(`${API_BASE}/orders/update_order_status.php`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ order_id: orderId, status: 'completed' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (button) button.innerHTML = '<span class="loading-spinner"></span>Success!';
            setTimeout(() => {
                alert('Order marked as received!');
                loadOrders();
            }, 500);
        } else {
            if (button) {
                button.disabled = false;
                button.innerHTML = originalText;
            }
            alert('Error: ' + result.error);
        }
    } catch (error) {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
        alert('Failed to update order');
    }
}

async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE}/notifications/get_notifications.php`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            const unread = data.notifications.filter(n => !n.read_at).length;
            const badge = document.getElementById('notification-badge');
            const count = document.getElementById('notification-count');
            
            if (unread > 0) {
                badge.style.display = 'block';
                count.textContent = unread;
            } else {
                badge.style.display = 'none';
            }
            
            const list = document.getElementById('notifications-list');
            if (data.notifications.length === 0) {
                list.innerHTML = '<p>No notifications</p>';
            } else {
                list.innerHTML = data.notifications.map(notif => `
                    <div class="notification-item ${notif.read_at ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
                        <p>${notif.message}</p>
                        <small>${new Date(notif.created_at).toLocaleString()}</small>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function showNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;
    panel.style.display = 'block';
}

function closeNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;
    panel.style.display = 'none';
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;
    if (panel.style.display === 'block') {
        closeNotifications();
    } else {
        showNotifications();
    }
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`${API_BASE}/notifications/mark_read.php`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ notification_id: notificationId })
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

