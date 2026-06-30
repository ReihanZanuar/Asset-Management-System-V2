# 🔧 Troubleshooting Guide - Asset Management System

## Error yang Mungkin Terjadi & Solusinya

---

## 🚨 Backend Errors

### 1. Server Tidak Bisa Start

#### Error: `EADDRINUSE: address already in use :::5000`

**Penyebab**: Port 5000 sudah digunakan oleh aplikasi lain

**Solusi A - Kill Process**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Restart server
npm run dev
```

**Solusi B - Ubah Port**:
```bash
# Edit .env
PORT=5001

# Restart
npm run dev
```

---

### 2. Database Connection Error

#### Error: `password authentication failed for user "postgres"`

**Penyebab**: Password PostgreSQL salah atau user tidak exist

**Solusi**:
```bash
# 1. Verify PostgreSQL is running
pg_isready

# 2. Test connection
psql -U postgres -h localhost

# 3. Update .env dengan password yang benar
DB_PASSWORD=your_correct_password

# 4. Restart server
npm run dev
```

#### Error: `database "ams_smk_db" does not exist`

**Penyebab**: Database belum dibuat

**Solusi**:
```bash
# Run database setup
npm run db:setup

# Jika masih error, create manual:
psql -U postgres -c "CREATE DATABASE ams_smk_db;"
npm run db:setup
```

#### Error: `connect ECONNREFUSED 127.0.0.1:5432`

**Penyebab**: PostgreSQL service tidak running

**Solusi**:
```bash
# MacOS
brew services start postgresql

# Ubuntu/Debian
sudo systemctl start postgresql

# Windows
# Start PostgreSQL dari Services atau pg_ctl

# Verify
pg_isready
```

---

### 3. JWT Token Errors

#### Error: `Invalid or expired token`

**Penyebab**: Token expired atau JWT_SECRET berubah

**Solusi**:
1. Logout dan login kembali
2. Clear browser localStorage
3. Verify JWT_SECRET di .env tidak berubah

#### Error: `Access token required`

**Penyebab**: Request tanpa Authorization header

**Solusi**:
```javascript
// Pastikan token disimpan setelah login
localStorage.setItem('token', response.token);

// Pastikan token dikirim di header
headers: {
    'Authorization': `Bearer ${token}`
}
```

---

### 4. CORS Errors

#### Error: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Penyebab**: Frontend origin tidak di-allow oleh backend

**Solusi**:
```bash
# Edit .env
CORS_ORIGIN=http://localhost:8080

# Atau untuk multiple origins, edit server/index.js:
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    credentials: true
}));
```

### 5. WhatsApp Integration (Fonnte API)

#### Error: `Fonnte failed to send message` atau tidak ada notifikasi masuk ke Admin

**Penyebab A: Token salah atau kosong**
- Fonnte API membutuhkan token autentikasi yang valid.
- **Solusi**:
  1. Buka dashboard Fonnte (`md.fonnte.com`) dan salin token aktif Anda.
  2. Edit token di environment file `.env` atau `docker-compose.yml` (`FONNTE_TOKEN=...`).
  3. Restart backend server / recreate docker containers.

**Penyebab B: Device status Offline di Fonnte**
- HP/Device yang digunakan sebagai pengirim WhatsApp harus terhubung/online.
- **Solusi**:
  1. Buka dashboard Fonnte.
  2. Di menu **Device**, pastikan status device Anda adalah **connected**.
  3. Jika offline, lakukan scan QR code ulang dari WhatsApp HP Anda.

**Penyebab C: ADMIN_WA_NUMBER belum diset atau format salah**
- Notifikasi dikirimkan ke nomor admin yang didefinisikan di environment.
- **Solusi**:
  1. Pastikan `ADMIN_WA_NUMBER` sudah diset di `.env` (lokal) atau `docker-compose.yml` (Docker).
  2. Format nomor disarankan menggunakan format internasional atau lokal biasa (`0878...` atau `62878...`). Sistem akan menormalisasinya secara otomatis.

**Penyebab D: Kuota/Quota Fonnte habis**
- **Solusi**: Cek sisa kuota bulanan Anda di dashboard Fonnte.

---

### 6. npm Errors

#### Error: `Cannot find module 'express'`

**Penyebab**: Dependencies belum terinstall

**Solusi**:
```bash
cd server
npm install
```

#### Error: `npm ERR! code ENOENT`

**Penyebab**: package.json tidak ditemukan

**Solusi**:
```bash
# Pastikan berada di folder server
cd /Users/ReihanZanu/Documents/AMS-SMK/ams-smk-app/server
npm install
```

---

## 💻 Frontend Errors

### 6. Login Tidak Berhasil

#### Error: `Failed to fetch` di console

**Penyebab**: Backend server tidak running atau URL salah

**Solusi**:
1. Pastikan backend running di http://localhost:5000
2. Check browser console untuk detail error
3. Verify API_BASE_URL di `client/js/api.js`

#### Error: `Invalid credentials`

**Penyebab**: Username atau password salah

**Solusi**:
```
Default credentials:
Username: admin
Password: admin123

Atau check database:
SELECT username FROM users;
```

---

### 7. Data Tidak Muncul

#### Dashboard kosong / Loading terus

**Penyebab**: API endpoint error atau token expired

**Solusi**:
1. Open browser DevTools (F12)
2. Check Console tab untuk errors
3. Check Network tab untuk failed requests
4. Logout dan login kembali
5. Verify backend logs

#### Table menampilkan "No items found"

**Penyebab**: Database kosong atau filter terlalu ketat

**Solusi**:
```bash
# Re-seed database
cd server
npm run db:setup

# Atau add data manual via UI
```

---

### 8. Frontend Tidak Load

#### Error: `Cannot GET /login.html`

**Penyebab**: HTTP server tidak running atau file tidak ada

**Solusi**:
```bash
# Pastikan berada di folder client
cd /Users/ReihanZanu/Documents/AMS-SMK/ams-smk-app/client

# Start server
python3 -m http.server 8080

# Verify files ada
ls *.html
```

---

## 🗄️ Database Errors

### 9. Migration/Schema Errors

#### Error: `relation "inventory" already exists`

**Penyebab**: Table sudah ada dari setup sebelumnya

**Solusi**:
```bash
# Option A: Drop dan recreate database
psql -U postgres -c "DROP DATABASE ams_smk_db;"
npm run db:setup

# Option B: Manually drop tables
psql -U postgres -d ams_smk_db
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS cannibalization_logs CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS consumables CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS users CASCADE;
\q

npm run db:setup
```

#### Error: `syntax error at or near "AUTOINCREMENT"`

**Penyebab**: SQL syntax untuk PostgreSQL berbeda dengan SQLite

**Solusi**: Gunakan `SERIAL PRIMARY KEY` bukan `AUTOINCREMENT` di schema.sql

---

### 10. Data Integrity Errors

#### Error: `violates foreign key constraint`

**Penyebab**: Mencoba delete inventory yang masih ada di loans

**Solusi**:
1. Return atau delete loans yang reference inventory tersebut dulu
2. Atau update schema dengan `ON DELETE CASCADE`

#### Error: `duplicate key value violates unique constraint`

**Penyebab**: Mencoba insert data dengan code/email yang sudah ada

**Solusi**:
```bash
# Check existing codes
SELECT code FROM inventory WHERE code = 'INV-XXX-001';

# Use different code atau update existing item
```

---

## 🌐 Network Errors

### 11. Timeout Errors

#### Error: `Request timeout`

**Penyebab**: Server overloaded atau query terlalu lambat

**Solusi**:
1. Check server logs untuk slow queries
2. Add database indexes
3. Optimize queries dengan LIMIT
4. Increase timeout di client

---

### 12. SSL/HTTPS Errors

#### Error: `net::ERR_CERT_AUTHORITY_INVALID`

**Penyebab**: Self-signed certificate atau development environment

**Solusi**: Use HTTP untuk development (http://localhost)

---

## 🔐 Security Errors

### 13. Authentication Errors

#### Error: `jwt malformed`

**Penyebab**: Token format salah

**Solusi**:
```javascript
// Pastikan token format benar:
// Bearer <token>

// Clear corrupted token
localStorage.removeItem('token');
window.location.href = '/login.html';
```

---

## 🛠️ Development Errors

### 14. nodemon Not Found

#### Error: `nodemon: command not found`

**Penyebab**: nodemon tidak installed atau tidak di PATH

**Solusi**:
```bash
# Install nodemon globally
npm install -g nodemon

# Atau use npx
npx nodemon index.js

# Atau gunakan node biasa
node index.js
```

---

### 15. Environment Variables

#### Error: `process.env.JWT_SECRET is undefined`

**Penyebab**: File .env tidak dibaca atau tidak ada

**Solusi**:
```bash
# Pastikan .env file ada di folder server
ls -la server/.env

# Copy dari example jika perlu
cp server/.env.example server/.env

# Edit dengan nilai yang benar
nano server/.env
```

---

## 📱 Browser Compatibility

### 16. LocalStorage Errors

#### Error: `SecurityError: localStorage is not available`

**Penyebab**: Private browsing atau localStorage disabled

**Solusi**:
1. Disable private browsing mode
2. Enable localStorage di browser settings
3. Use regular browser window

---

## 🚀 Production Errors

### 17. Performance Issues

#### Symptom: Website lambat

**Penyebab**: Database tidak ter-index, terlalu banyak data

**Solusi**:
```sql
-- Add indexes
CREATE INDEX idx_inventory_code ON inventory(code);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_consumables_quantity ON consumables(quantity);

-- Clean old activity logs
DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '6 months';
```

---

## 📞 Getting Help

### Log Files Locations
```
Backend logs: server/logs/ (if configured)
Browser console: F12 → Console tab
Network requests: F12 → Network tab
Database logs: PostgreSQL log directory
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check database queries
# Uncomment console.log di database.js
```

### Common Commands
```bash
# Check all services
pg_isready                    # PostgreSQL
curl http://localhost:5000/health  # Backend
curl http://localhost:8080    # Frontend

# View logs
tail -f logs/app.log          # Application logs
tail -f /var/log/postgresql/  # PostgreSQL logs

# Database inspection
psql -U postgres -d ams_smk_db
\dt                           # List tables
SELECT COUNT(*) FROM inventory;
```

---

## 🎯 Quick Fixes Checklist

When something goes wrong:

```
□ Backend server running? (http://localhost:5000/health)
□ PostgreSQL running? (pg_isready)
□ Database exists? (npm run db:setup)
□ .env file configured correctly?
□ Frontend server running? (http://localhost:8080)
□ Browser console has errors?
□ Network tab shows failed requests?
□ Try logout & login again
□ Clear browser cache/localStorage
□ Restart all services
```

---

*Last Updated: 2024-06-23*  
*For additional support, check GitHub Issues or documentation*
