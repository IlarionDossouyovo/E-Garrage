# E-GARRAGE API Documentation

## Base URL
```
https://api.egarrage.com/v1
```

## Authentication
```bash
Authorization: Bearer <your_token>
```

---

## 📦 Products

### List Products
```bash
GET /api/products
```
**Query Params:** `category`, `search`, `dropshipping`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Wireless Earbuds",
    "description": "High quality wireless earbuds",
    "price": 49.99,
    "category": "Electronics",
    "stock": 100,
    "isDropshipping": true
  }
]
```

### Get Product
```bash
GET /api/products/:id
```

### Create Product (Admin)
```bash
POST /api/products
Headers: Authorization: Bearer <admin_token>
Body: { "name": "...", "price": 99.99, "category": "Electronics" }
```

### Update Product (Admin)
```bash
PUT /api/products/:id
Body: { "price": 79.99 }
```

### Delete Product (Admin)
```bash
DELETE /api/products/:id
```

---

## 🛒 Orders

### Create Order
```bash
POST /api/orders
Headers: Authorization: Bearer <token>
Body: {
  "items": [{ "id": 1, "quantity": 2, "price": 49.99 }],
  "shipping_address": "123 Main St, City"
}
```
**Response:** `{ "success": true, "orderId": 123, "total": 99.98 }`

### Get Orders
```bash
GET /api/orders
# Returns user's orders. Admin sees all.
```

### Get Order Details
```bash
GET /api/orders/:id
```

### Update Order Status (Admin)
```bash
PUT /api/orders/:id/status
Body: { "status": "shipped", "tracking_number": "EG123456" }
```

---

## 👤 Users

### Register
```bash
POST /api/auth/register
Body: { "username": "john", "email": "john@email.com", "password": "..." }
```

### Login
```bash
POST /api/auth/login
Body: { "email": "...", "password": "..." }
```
**Response:** `{ "success": true, "token": "...", "user": {...} }`

### Get Profile
```bash
GET /api/users/me
Headers: Authorization: Bearer <token>
```

### Update Profile
```bash
PUT /api/users/me
Body: { "username": "newname" }
```

### Upgrade to Premium
```bash
POST /api/users/upgrade
Headers: Authorization: Bearer <token>
```

---

## 🚚 Suppliers (Admin)

### List Suppliers
```bash
GET /api/suppliers
Headers: Authorization: Bearer <admin_token>
```

### Add Supplier
```bash
POST /api/suppliers
Body: { "name": "Supplier Co", "email": "sup@plier.com", "phone": "+123456" }
```

### Update Supplier
```bash
PUT /api/suppliers/:id
Body: { "status": "active" }
```

### Delete Supplier
```bash
DELETE /api/suppliers/:id
```

---

## 📊 Analytics (Admin)

### Get Analytics
```bash
GET /api/analytics?period=7d|30d|year
```

**Response:**
```json
{
  "revenue": 12450.00,
  "orders": 156,
  "topProducts": [
    { "name": "Earbuds", "sold": 245, "revenue": 12247 }
  ]
}
```

### Dropship Stats
```bash
GET /api/analytics/dropshipping
```

---

## 🔔 Webhooks

Subscribe to order events:
```bash
POST /api/webhooks
Body: { "url": "https://yoursite.com/hook", "events": ["order.created", "order.shipped"] }
```

---

## 💳 Errors

```json
{
  "success": false,
  "message": "Error description"
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## 📱 SDK Examples

### JavaScript
```javascript
const response = await fetch('https://api.egarrage.com/v1/products', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const data = await response.json();
```

### Python
```python
import requests
response = requests.get(
  'https://api.egarrage.com/v1/products',
  headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
data = response.json()
```

---

**Base URL (Dev):** `http://localhost:3000/api`