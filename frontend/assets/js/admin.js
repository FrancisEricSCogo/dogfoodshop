async function loadAllOrders() {
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
                    <p>Customer: ${order.customer_name}</p>
                    <p>Supplier: ${order.supplier_name}</p>
                    <p>Quantity: ${order.quantity}</p>
                    <p>Total: ₱${(parseFloat(order.price) * order.quantity).toFixed(2)}</p>
                    <p>Status: <span class="status status-${order.status}">${order.status}</span></p>
                    <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = '<p>Error loading orders</p>';
    }
}

async function loadUsers(role = null) {
    try {
        const url = role ? `${API_BASE}/admin/get_users.php?role=${role}` : `${API_BASE}/admin/get_users.php`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            const list = document.getElementById('users-list');
            if (data.users.length === 0) {
                list.innerHTML = '<p>No users found</p>';
                return;
            }
            
            list.innerHTML = data.users.map(user => `
                <div class="user-card">
                    <h3>${user.first_name} ${user.last_name}</h3>
                    <p>Username: ${user.username}</p>
                    <p>Email: ${user.email}</p>
                    <p>Phone: ${user.phone || 'N/A'}</p>
                    <p>Role: <span class="role role-${user.role}">${user.role}</span></p>
                    <p>Joined: ${new Date(user.created_at).toLocaleDateString()}</p>
                    <button onclick="openEditModal(${user.id}, '${user.first_name}', '${user.last_name}', '${user.email}', '${user.phone || ''}', '${user.role}')" class="btn btn-primary">Edit</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-list').innerHTML = '<p>Error loading users</p>';
    }
}

function openEditModal(userId, firstName, lastName, email, phone, role) {
    const editUserId = document.getElementById('edit_user_id');
    const editFirstName = document.getElementById('edit_first_name');
    const editLastName = document.getElementById('edit_last_name');
    const editEmail = document.getElementById('edit_email');
    const editPhone = document.getElementById('edit_phone');
    const editRole = document.getElementById('edit_role');
    const modal = document.getElementById('edit-user-modal');
    
    if (editUserId) editUserId.value = userId;
    if (editFirstName) editFirstName.value = firstName;
    if (editLastName) editLastName.value = lastName;
    if (editEmail) editEmail.value = email;
    if (editPhone) editPhone.value = phone;
    if (editRole) editRole.value = role;
    if (modal) modal.style.display = 'block';
}

function closeEditModal() {
    const modal = document.getElementById('edit-user-modal');
    const form = document.getElementById('editUserForm');
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

// Only add event listener if the form exists (on manage_users.html page)
// This function will be called when needed, avoiding errors on pages without the form
function initEditUserForm() {
    try {
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm && !editUserForm.hasAttribute('data-listener-added')) {
            editUserForm.setAttribute('data-listener-added', 'true');
            editUserForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const data = {
                    user_id: parseInt(document.getElementById('edit_user_id').value),
                    first_name: document.getElementById('edit_first_name').value,
                    last_name: document.getElementById('edit_last_name').value,
                    email: document.getElementById('edit_email').value,
                    phone: document.getElementById('edit_phone').value,
                    role: document.getElementById('edit_role').value
                };
                
                try {
                    const response = await fetch(`${API_BASE}/admin/update_user.php`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('User updated successfully!');
                        closeEditModal();
                        loadUsers();
                    } else {
                        alert('Error: ' + result.error);
                    }
                } catch (error) {
                    alert('Failed to update user');
                }
            });
        }
    } catch (error) {
        // Silently fail if form doesn't exist (not on manage_users page)
        console.log('Edit user form not found on this page');
    }
}

// Try to initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditUserForm);
    } else {
        // DOM already loaded, try immediately
        setTimeout(initEditUserForm, 0);
    }
}

