# E-GARRAGE Webhooks Configuration

## Endpoint
```
POST https://api.egarrage.com/webhooks
```

## Webhook Events

### Order Events
```json
{
  "event": "order.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "orderId": "123",
    "customer": "john@example.com",
    "total": 99.99,
    "items": []
  }
}
```

```json
{
  "event": "order.shipped",
  "timestamp": "2024-01-01T14:00:00Z",
  "data": {
    "orderId": "123",
    "trackingNumber": "EG123TRACK"
  }
}
```

```json
{
  "event": "order.delivered",
  "timestamp": "2024-01-01T18:00:00Z",
  "data": {
    "orderId": "123"
  }
}
```

### Inventory Events
```json
{
  "event": "inventory.low",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "productId": "1",
    "productName": "Wireless Earbuds",
    "stock": 5,
    "threshold": 10
  }
}
```

```json
{
  "event": "inventory.restock",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "productId": "1",
    "newStock": 100
  }
}
```

### User Events
```json
{
  "event": "user.registered",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": "1",
    "email": "user@example.com"
  }
}
```

```json
{
  "event": "user.premium.upgraded",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "userId": "1",
    "plan": "premium"
  }
}
```

---

## PHP Implementation Example

```php
<?php
// webhook_receiver.php

$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

switch($data['event']) {
    case 'order.created':
        // Send email notification
        sendEmail($data['data']['customer'], 'New Order', $data);
        break;
        
    case 'order.shipped':
        // Update shipping status
        updateShipping($data['data']);
        break;
        
    case 'inventory.low':
        // Trigger restock alert
        sendSlackAlert("Low stock: " . $data['data']['productName']);
        break;
}

// Response
http_response_code(200);
echo json_encode(['status' => 'received']);
?>
```

---

## Node.js Implementation

```javascript
// webhook_receiver.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhooks', (req, res) => {
  const { event, data } = req.body;
  
  switch(event) {
    case 'order.created':
      sendEmail(data.customer, 'Order Confirmation');
      break;
      
    case 'inventory.low':
      slack.notify(`⚠️ Low stock: ${data.productName}`);
      break;
  }
  
  res.status(200).json({ received: true });
});

app.listen(3000);
```

---

## Security

Include signature in header:
```
X-Egarrage-Signature: sha256=...
```

Verify signature:
```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```