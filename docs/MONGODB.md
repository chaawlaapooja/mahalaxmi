# MongoDB guide — Mahalaxmi ERP

## View local database

### Option 1: MongoDB Compass (recommended)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass).
2. Connect with:
   ```
   mongodb://127.0.0.1:27017/mahalaxmi
   ```
3. Browse collections: `products`, `customers`, `invoices`, `users`, `expenses`.

### Option 2: Docker shell

If you use the Docker MongoDB container from setup:

```bash
docker exec -it mahalaxmi-mongo mongosh mahalaxmi
```

Example commands:

```javascript
db.products.find().pretty()
db.users.find({}, { name: 1, email: 1, role: 1 })
```

### Option 3: VS Code

Install the **MongoDB for VS Code** extension and connect to the same URI above.

---

## MongoDB Atlas integration

### 1. Create Atlas cluster

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0** cluster.
3. Create a database user (username + password).
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for development only).

### 2. Get connection string

In Atlas → **Connect** → **Drivers**, copy the URI, e.g.:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mahalaxmi?retryWrites=true&w=majority
```

Replace `USER`, `PASSWORD`, and ensure the database name is `mahalaxmi`.

### 3. Update API environment

Edit `api/.env`:

```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mahalaxmi?retryWrites=true&w=majority
```

Restart the API: `cd api && npm run dev`

### 4. Seed Atlas database

**Yes — you need to seed** when using a new/empty Atlas database:

```bash
cd api
npm run seed
```

This creates:

- Admin & employee users
- Sample customers
- **10 Jockey product variants** (barcode, category, color, size)

To **only refresh products** (keep users/customers):

```bash
npm run seed:products
```

### 5. Atlas vs local

| | Local Docker | Atlas |
|---|-------------|-------|
| URI | `mongodb://127.0.0.1:27017/mahalaxmi` | `mongodb+srv://...` |
| Seed required | On first run | On first run |
| Compass | `127.0.0.1:27017` | Use Atlas connection string |

---

## After schema changes

If you changed product fields (barcode, color, size, etc.), re-run:

```bash
cd api && npm run seed
```

This clears old products and loads the Jockey catalog. **Warning:** full seed also resets users and customers.
