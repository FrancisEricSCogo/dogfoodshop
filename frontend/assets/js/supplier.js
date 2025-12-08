async function loadSupplierProducts() {
    const user = getUser();
    if (!user) return;
    
    try {
        const response = await fetch(`${API_BASE}/products/get_products.php?supplier_id=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
            const list = document.getElementById('products-list');
            if (data.products.length === 0) {
                list.innerHTML = '<p>No products yet. Add your first product!</p>';
                return;
            }
            
            list.innerHTML = data.products.map(product => `
                <div class="product-card">
                    <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200'">
                    <h3>${product.name}</h3>
                    <p>${product.description || 'No description'}</p>
                    <p class="price">₱${parseFloat(product.price).toFixed(2)}</p>
                    <p>Stock: ${product.stock}</p>
                    <button onclick="editProduct(${product.id})" class="btn btn-primary">Edit</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = '<p>Error loading products</p>';
    }
}

function showAddProductForm() {
    const form = document.getElementById('add-product-form');
    if (form) {
        form.style.display = 'block';
    }
}

function hideAddProductForm() {
    const form = document.getElementById('add-product-form');
    if (form) {
        form.style.display = 'none';
    }
    const formElement = document.getElementById('addProductForm');
    if (formElement) {
        formElement.reset();
    }
}

// Only add event listener if the form exists (products page)
// Wait for DOM to be ready
function setupAddProductForm() {
    try {
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm && typeof addProductForm.addEventListener === 'function') {
            addProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    price: parseFloat(formData.get('price')),
                    stock: parseInt(formData.get('stock')),
                    image: formData.get('image')
                };
                
                try {
                    const response = await fetch(`${API_BASE}/products/add_product.php`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Product added successfully!');
                        hideAddProductForm();
                        loadSupplierProducts();
                    } else {
                        alert('Error: ' + result.error);
                    }
                } catch (error) {
                    alert('Failed to add product');
                }
            });
        }
    } catch (error) {
        // Silently fail if form doesn't exist (e.g., on orders page)
        console.log('Add product form not found on this page');
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAddProductForm);
} else {
    setupAddProductForm();
}

function editProduct(productId) {
    // Simple edit - in production, use a modal
    const newName = prompt('Enter new product name:');
    const newPrice = prompt('Enter new price:');
    const newStock = prompt('Enter new stock:');
    
    if (newName && newPrice && newStock) {
        updateProduct(productId, {
            name: newName,
            price: parseFloat(newPrice),
            stock: parseInt(newStock)
        });
    }
}

async function updateProduct(productId, data) {
    try {
        const response = await fetch(`${API_BASE}/products/update_product.php`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product_id: productId, ...data })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Product updated!');
            loadSupplierProducts();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Failed to update product');
    }
}

async function loadSupplierOrders() {
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
            
            list.innerHTML = data.orders.map(order => {
                const statusTransitions = {
                    'pending': ['processing'],
                    'processing': ['shipped'],
                    'shipped': ['delivered']
                };
                
                const nextStatus = statusTransitions[order.status] ? statusTransitions[order.status][0] : null;
                
                return `
                    <div class="order-card">
                        <h3>Order #${order.id} - ${order.product_name}</h3>
                        <p>Customer: ${order.customer_name}</p>
                        <p>Quantity: ${order.quantity}</p>
                        <p>Total: ₱${(parseFloat(order.price) * order.quantity).toFixed(2)}</p>
                        <p>Status: <span class="status status-${order.status}">${order.status}</span></p>
                        <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                        ${nextStatus ? `<button onclick="updateOrderStatus(${order.id}, '${nextStatus}')" class="btn btn-primary">Mark as ${nextStatus}</button>` : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = '<p>Error loading orders</p>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/orders/update_order_status.php`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Order status updated!');
            loadSupplierOrders();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Failed to update order status');
    }
}

